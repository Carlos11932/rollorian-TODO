import {
  CreateItemCommandHandler,
  ReadItemByIdCommandHandler,
  UpdateItemCommandHandler,
  toItemOutput,
  type ItemCommandError,
  type ItemCommandRepository,
  type ItemOutput,
  type ItemRecord,
} from "@/application/commands";
import {
  AppendOnlyGroupItemAuditRecorder,
  type AppendGroupItemAuditEntryRepository,
} from "@/application/history";
import {
  projectItemQueryFacts,
  type AttentionThresholds,
} from "@/application/queries/projectors";
import {
  GetCalendarViewQueryHandler,
  GetGroupViewQueryHandler,
  GetMyViewQueryHandler,
  GetRequiresAttentionViewQueryHandler,
  GetUndatedViewQueryHandler,
  VIEW_SPACE_FILTER,
  type ItemViewQueryRepository,
  type ItemViewRecord,
} from "@/application/queries/views";
import {
  createGroupSpaceAccessContext,
  createPersonalSpaceAccessContext,
  type GroupSpaceAccessContext,
  type PersonalSpaceAccessContext,
} from "@/domain/access";
import { type GroupItemAuditEntry } from "@/domain/history";
import {
  createAuthorizationActor,
  createGroupMembership,
  createUserIdentity,
  type AuthorizationActor,
  type GroupMembership,
} from "@/domain/identity";
import {
  EVENT_STATUS,
  EVENT_TEMPORAL_KIND,
  TASK_STATUS,
  TASK_TEMPORAL_KIND,
  createEventCanceledLifecycle,
  createEventCompletedLifecycle,
  createEventScheduledLifecycle,
  createEventStartAndEndTemporal,
  createEventStartTemporal,
  createGroupItemScope,
  createPersonalItemScope,
  createTaskBlockedLifecycle,
  createTaskCanceledLifecycle,
  createTaskDoneLifecycle,
  createTaskDueDateTemporal,
  createTaskInProgressLifecycle,
  createTaskPendingLifecycle,
  createTaskPostponedLifecycle,
  createTaskStartAndDueTemporal,
  createTaskStartAndEndTemporal,
  createTaskStartDateTemporal,
  createTaskStartEndAndDueTemporal,
  createTaskUndatedTemporal,
  type EventLifecycle,
  type EventTemporal,
  type GroupItemScope,
  type PersonalItemScope,
  type TaskLifecycle,
  type TaskTemporal,
} from "@/domain/item";
import {
  ITEM_TYPE,
  PRIORITY,
  SPACE_TYPE,
  createGroupId,
  createItemId,
  createMembershipId,
  createSpaceId,
  createUserId,
  createVersionToken,
} from "@/domain/shared";
import {
  createItemRequestSchema,
  getAttentionViewRequestSchema,
  getCalendarViewRequestSchema,
  getGroupViewRequestSchema,
  getItemByIdRequestSchema,
  getItemHistoryRequestSchema,
  getMyViewRequestSchema,
  getUndatedViewRequestSchema,
  itemHistoryResponseSchema,
  itemListResponseSchema,
  itemResponseSchema,
  listItemsRequestSchema,
  toAttentionViewResponse,
  toCalendarViewResponse,
  toGroupViewResponse,
  toItemCommandResultResponse,
  toItemHistoryEntriesResponse,
  toItemListResponse,
  toMyViewResponse,
  toUndatedViewResponse,
  updateItemRequestSchema,
  type ViewFilters,
} from "@/interfaces/api";

const REFERENCE_DATE = new Date("2026-04-14T12:00:00.000Z");
const THRESHOLDS: AttentionThresholds = {
  openItemDays: 7,
  postponeCount: 3,
};

interface ApiResponse<TBody> {
  body: TBody;
  status: number;
}

interface HarnessActors {
  agent: TestClient;
  member: TestClient;
  memberId: ReturnType<typeof createUserId>;
  outsider: TestClient;
  teammate: TestClient;
  teammateId: ReturnType<typeof createUserId>;
}

interface Harness {
  actors: HarnessActors;
  groupId: ReturnType<typeof createGroupId>;
  groupSpaceId: ReturnType<typeof createSpaceId>;
  personalSpaceId: ReturnType<typeof createSpaceId>;
}

type CommandSpace =
  | {
      accessContext: GroupSpaceAccessContext;
      scope: GroupItemScope;
    }
  | {
      accessContext: PersonalSpaceAccessContext;
      scope: PersonalItemScope;
    };

class InMemoryApiRepository
  implements ItemCommandRepository, ItemViewQueryRepository, AppendGroupItemAuditEntryRepository
{
  private readonly records = new Map<string, ItemRecord>();

  public readonly historyEntries: GroupItemAuditEntry[] = [];

  public async append(entry: GroupItemAuditEntry): Promise<void> {
    this.historyEntries.push(entry);
  }

  public async findById(itemId: ReturnType<typeof createItemId>): Promise<ItemRecord | null> {
    return this.records.get(itemId) ?? null;
  }

  public async listProjectedItems(): Promise<readonly ItemViewRecord[]> {
    return [...this.records.values()].map((record) => ({
      item: toItemOutput(record),
      projection: projectItemQueryFacts({
        record,
        referenceDate: REFERENCE_DATE,
        thresholds: THRESHOLDS,
      }),
    }));
  }

  public listHistoryEntries(itemId: string): readonly GroupItemAuditEntry[] {
    return this.historyEntries.filter((entry) => entry.itemId === itemId);
  }

  public async save(record: ItemRecord): Promise<void> {
    this.records.set(record.item.id, record);
  }
}

class TestClient {
  private readonly createHandler: CreateItemCommandHandler;
  private readonly readHandler: ReadItemByIdCommandHandler;
  private readonly updateHandler: UpdateItemCommandHandler;

  public constructor(
    private readonly repository: InMemoryApiRepository,
    private readonly actor: AuthorizationActor,
    private readonly visibleGroupIds: readonly ReturnType<typeof createGroupId>[],
    private readonly membershipsByGroupId: ReadonlyMap<
      ReturnType<typeof createGroupId>,
      readonly GroupMembership[]
    >,
  ) {
    this.createHandler = new CreateItemCommandHandler(repository);
    this.readHandler = new ReadItemByIdCommandHandler(repository);
    this.updateHandler = new UpdateItemCommandHandler(
      repository,
      new AppendOnlyGroupItemAuditRecorder(repository),
    );
  }

  public async postItem(
    request: unknown,
  ): Promise<ApiResponse<unknown>> {
    const parsed = createItemRequestSchema.safeParse(request);
    if (!parsed.success) {
      return badRequest(parsed.error.flatten());
    }

    const body = parsed.data.body;
    const itemId = createItemId(`api-item-${crypto.randomUUID()}`);
    const result =
      body.itemType === ITEM_TYPE.TASK
        ? await this.createHandler.execute({
            actor: this.actor,
            assigneeIds: toUserIds(body.assigneeIds),
            itemId,
            itemType: ITEM_TYPE.TASK,
            labels: body.labels,
            lifecycle: body.lifecycle
              ? toTaskLifecycle(body.lifecycle as Parameters<typeof toTaskLifecycle>[0])
              : undefined,
            notes: body.notes,
            postponeCount: body.postponeCount,
            priority: body.priority,
            space: createCommandSpace(body, this.membershipsByGroupId),
            temporal: toTaskTemporal(body.temporal as Parameters<typeof toTaskTemporal>[0]),
            title: body.title,
          })
        : await this.createHandler.execute({
            actor: this.actor,
            assigneeIds: toUserIds(body.assigneeIds),
            itemId,
            itemType: ITEM_TYPE.EVENT,
            labels: body.labels,
            lifecycle: body.lifecycle
              ? toEventLifecycle(body.lifecycle as Parameters<typeof toEventLifecycle>[0])
              : undefined,
            notes: body.notes,
            priority: body.priority,
            space: createCommandSpace(body, this.membershipsByGroupId),
            temporal: toEventTemporal(body.temporal as Parameters<typeof toEventTemporal>[0]),
            title: body.title,
          });

    return {
      body: toItemCommandResultResponse(result),
      status: result.ok ? 201 : getCommandErrorStatus(result.error),
    };
  }

  public async getItem(
    request: unknown,
  ): Promise<ApiResponse<unknown>> {
    const parsed = getItemByIdRequestSchema.safeParse(request);
    if (!parsed.success) {
      return badRequest(parsed.error.flatten());
    }

    const result = await this.readHandler.execute({
      actor: this.actor,
      itemId: createItemId(parsed.data.params.itemId),
      space: createCommandSpace(parsed.data.query, this.membershipsByGroupId),
    });

    return {
      body: toItemCommandResultResponse(result),
      status: result.ok ? 200 : getCommandErrorStatus(result.error),
    };
  }

  public async patchItem(
    request: unknown,
  ): Promise<ApiResponse<unknown>> {
    const parsed = updateItemRequestSchema.safeParse(request);
    if (!parsed.success) {
      return badRequest(parsed.error.flatten());
    }

    const body = parsed.data.body;
    const current = await this.repository.findById(createItemId(parsed.data.params.itemId));
    const resolvedItemType = body.itemType ?? current?.item.itemType ?? ITEM_TYPE.TASK;

    const result =
      resolvedItemType === ITEM_TYPE.TASK
        ? await this.updateHandler.execute({
            actor: this.actor,
            assigneeIds: toUserIds(body.assigneeIds),
            expectedVersionToken:
              body.expectedVersionToken === undefined
                ? undefined
                : createVersionToken(body.expectedVersionToken),
            itemId: createItemId(parsed.data.params.itemId),
            itemType: ITEM_TYPE.TASK,
            labels: body.labels,
            lifecycle: body.lifecycle
              ? toTaskLifecycle(body.lifecycle as Parameters<typeof toTaskLifecycle>[0])
              : undefined,
            notes: body.notes,
            postponeCount:
              "postponeCount" in body && typeof body.postponeCount === "number"
                ? body.postponeCount
                : undefined,
            priority: body.priority,
            space: createCommandSpace(body, this.membershipsByGroupId),
            temporal: body.temporal
              ? toTaskTemporal(body.temporal as Parameters<typeof toTaskTemporal>[0])
              : undefined,
            title: body.title,
          })
        : await this.updateHandler.execute({
            actor: this.actor,
            assigneeIds: toUserIds(body.assigneeIds),
            expectedVersionToken:
              body.expectedVersionToken === undefined
                ? undefined
                : createVersionToken(body.expectedVersionToken),
            itemId: createItemId(parsed.data.params.itemId),
            itemType: ITEM_TYPE.EVENT,
            labels: body.labels,
            lifecycle: body.lifecycle
              ? toEventLifecycle(body.lifecycle as Parameters<typeof toEventLifecycle>[0])
              : undefined,
            notes: body.notes,
            priority: body.priority,
            space: createCommandSpace(body, this.membershipsByGroupId),
            temporal: body.temporal
              ? toEventTemporal(body.temporal as Parameters<typeof toEventTemporal>[0])
              : undefined,
            title: body.title,
          });

    return {
      body: toItemCommandResultResponse(result),
      status: result.ok ? 200 : getCommandErrorStatus(result.error),
    };
  }

  public async listItems(
    request: unknown,
  ): Promise<ApiResponse<unknown>> {
    const parsed = listItemsRequestSchema.safeParse(request);
    if (!parsed.success) {
      return badRequest(parsed.error.flatten());
    }

    const visibleItems = (await this.repository.listProjectedItems())
      .filter((record) => isVisibleToActor(record, this.actor.userId, this.visibleGroupIds))
      .map((record) => record.item);

    return {
      body: toItemListResponse(applyItemFilters(visibleItems, parsed.data.query), parsed.data.query),
      status: 200,
    };
  }

  public async getMyView(
    request: unknown,
  ): Promise<ApiResponse<unknown>> {
    const parsed = getMyViewRequestSchema.safeParse(request);
    if (!parsed.success) {
      return badRequest(parsed.error.flatten());
    }

    const result = await new GetMyViewQueryHandler(this.repository).execute({
      actorUserId: this.actor.userId,
      visibleGroupIds: this.visibleGroupIds,
    });
    const items = applyViewFilters(result.items, parsed.data.query.filters);

    return {
      body: toMyViewResponse({ items, totalCount: items.length }, parsed.data.query.filters),
      status: 200,
    };
  }

  public async getGroupView(
    request: unknown,
  ): Promise<ApiResponse<unknown>> {
    const parsed = getGroupViewRequestSchema.safeParse(request);
    if (!parsed.success) {
      return badRequest(parsed.error.flatten());
    }

    const result = await new GetGroupViewQueryHandler(this.repository).execute({
      actorUserId: this.actor.userId,
      groupId: createGroupId(parsed.data.params.groupId),
      visibleGroupIds: this.visibleGroupIds,
    });
    const items = applyViewFilters(result.items, parsed.data.query.filters);

    return {
      body: toGroupViewResponse(
        { groupId: result.groupId, items, totalCount: items.length },
        parsed.data.query.filters,
      ),
      status: 200,
    };
  }

  public async getCalendarView(
    request: unknown,
  ): Promise<ApiResponse<unknown>> {
    const parsed = getCalendarViewRequestSchema.safeParse(request);
    if (!parsed.success) {
      return badRequest(parsed.error.flatten());
    }

    const result = await new GetCalendarViewQueryHandler(this.repository).execute({
      actorUserId: this.actor.userId,
      range: {
        endAt: new Date(parsed.data.query.range.endAt),
        startAt: new Date(parsed.data.query.range.startAt),
      },
      spaceFilter: parsed.data.query.spaceFilter,
      visibleGroupIds: this.visibleGroupIds,
    });
    const items = applyViewFilters(result.items, parsed.data.query.filters);

    return {
      body: toCalendarViewResponse(
        {
          items,
          range: result.range,
          spaceFilter: result.spaceFilter,
          totalCount: items.length,
        },
        parsed.data.query.filters,
      ),
      status: 200,
    };
  }

  public async getUndatedView(
    request: unknown,
  ): Promise<ApiResponse<unknown>> {
    const parsed = getUndatedViewRequestSchema.safeParse(request);
    if (!parsed.success) {
      return badRequest(parsed.error.flatten());
    }

    const result = await new GetUndatedViewQueryHandler(this.repository).execute({
      actorUserId: this.actor.userId,
      spaceFilter: parsed.data.query.spaceFilter,
      visibleGroupIds: this.visibleGroupIds,
    });
    const items = applyViewFilters(result.items, parsed.data.query.filters);

    return {
      body: toUndatedViewResponse(
        { items, spaceFilter: result.spaceFilter, totalCount: items.length },
        parsed.data.query.filters,
      ),
      status: 200,
    };
  }

  public async getAttentionView(
    request: unknown,
  ): Promise<ApiResponse<unknown>> {
    const parsed = getAttentionViewRequestSchema.safeParse(request);
    if (!parsed.success) {
      return badRequest(parsed.error.flatten());
    }

    const result = await new GetRequiresAttentionViewQueryHandler(this.repository).execute({
      actorUserId: this.actor.userId,
      spaceFilter: parsed.data.query.spaceFilter,
      visibleGroupIds: this.visibleGroupIds,
    });
    const items = applyViewFilters(result.items, parsed.data.query.filters);

    return {
      body: toAttentionViewResponse(
        { items, spaceFilter: result.spaceFilter, totalCount: items.length },
        parsed.data.query.filters,
      ),
      status: 200,
    };
  }

  public async getItemHistory(
    request: unknown,
  ): Promise<ApiResponse<unknown>> {
    const parsed = getItemHistoryRequestSchema.safeParse(request);
    if (!parsed.success) {
      return badRequest(parsed.error.flatten());
    }

    const readResult = await this.readHandler.execute({
      actor: this.actor,
      itemId: createItemId(parsed.data.params.itemId),
      space: createCommandSpace(parsed.data.query, this.membershipsByGroupId),
    });

    if (!readResult.ok) {
      return { body: toItemCommandResultResponse(readResult), status: getCommandErrorStatus(readResult.error) };
    }

    return {
      body: toItemHistoryEntriesResponse(
        parsed.data.params.itemId,
        this.repository.listHistoryEntries(parsed.data.params.itemId),
      ),
      status: 200,
    };
  }
}

function applyItemFilters(
  items: readonly ItemOutput[],
  filters: {
    assigneeId?: string;
    datedState?: "dated" | "undated";
    groupId?: string;
    includeCompletedEvents?: boolean;
    itemType?: ItemOutput["itemType"];
    label?: string;
    ownerId?: string;
    priority?: ItemOutput["priority"];
    spaceType?: ItemOutput["spaceType"];
    status?: string;
  },
): readonly ItemOutput[] {
  const normalizedLabel = filters.label?.trim().toLowerCase();

  return items.filter((item) => {
    if (
      filters.assigneeId !== undefined &&
      !item.assigneeIds.includes(createUserId(filters.assigneeId))
    ) {
      return false;
    }

    if (filters.datedState === "dated" && isItemUndated(item)) {
      return false;
    }

    if (filters.datedState === "undated" && !isItemUndated(item)) {
      return false;
    }

    if (filters.groupId !== undefined && item.groupId !== createGroupId(filters.groupId)) {
      return false;
    }

    if (
      filters.includeCompletedEvents === false &&
      item.itemType === ITEM_TYPE.EVENT &&
      item.status === EVENT_STATUS.COMPLETED
    ) {
      return false;
    }

    if (filters.itemType !== undefined && item.itemType !== filters.itemType) {
      return false;
    }

    if (
      normalizedLabel !== undefined &&
      !item.labels.some((label) => label.value === normalizedLabel)
    ) {
      return false;
    }

    if (filters.ownerId !== undefined && item.ownerId !== createUserId(filters.ownerId)) {
      return false;
    }

    if (filters.priority !== undefined && item.priority !== filters.priority) {
      return false;
    }

    if (filters.spaceType !== undefined && item.spaceType !== filters.spaceType) {
      return false;
    }

    if (filters.status !== undefined && item.status !== filters.status) {
      return false;
    }

    return true;
  });
}

function applyViewFilters(
  records: readonly ItemViewRecord[],
  filters: ViewFilters | undefined,
): readonly ItemViewRecord[] {
  if (filters === undefined) {
    return records;
  }

  const ids = new Set(applyItemFilters(records.map((record) => record.item), filters).map((item) => item.id));
  return records.filter((record) => ids.has(record.item.id));
}

function badRequest(error: unknown): ApiResponse<{ error: unknown }> {
  return {
    body: { error },
    status: 400,
  };
}

function createActor(userId: ReturnType<typeof createUserId>, displayName: string) {
  return createAuthorizationActor(createUserIdentity({ displayName, id: userId }));
}

function createCommandSpace(
  scope:
    | {
        groupId: string;
        spaceId: string;
        spaceType: typeof SPACE_TYPE.GROUP;
      }
    | {
        ownerId: string;
        spaceId: string;
        spaceType: typeof SPACE_TYPE.PERSONAL;
      },
  membershipsByGroupId: ReadonlyMap<ReturnType<typeof createGroupId>, readonly GroupMembership[]>,
): CommandSpace {
  if (scope.spaceType === SPACE_TYPE.PERSONAL) {
    return {
      accessContext: createPersonalSpaceAccessContext({
        ownerId: createUserId(scope.ownerId),
        spaceId: createSpaceId(scope.spaceId),
      }),
      scope: createPersonalItemScope({ ownerId: createUserId(scope.ownerId) }),
    };
  }

  const memberships = membershipsByGroupId.get(createGroupId(scope.groupId)) ?? [];

  return {
    accessContext: createGroupSpaceAccessContext({
      groupId: createGroupId(scope.groupId),
      memberships,
      spaceId: createSpaceId(scope.spaceId),
    }),
    scope: createGroupItemScope({
      groupId: createGroupId(scope.groupId),
      memberships,
    }),
  };
}

function createHarness(): Harness {
  const repository = new InMemoryApiRepository();
  const groupId = createGroupId("group-api-1");
  const personalSpaceId = createSpaceId("space-personal-api-1");
  const groupSpaceId = createSpaceId("space-group-api-1");
  const memberId = createUserId("member-api-1");
  const teammateId = createUserId("member-api-2");
  const outsiderId = createUserId("outsider-api-1");
  const memberships = [
    createGroupMembership({
      groupId,
      id: createMembershipId("membership-api-1"),
      userId: memberId,
    }),
    createGroupMembership({
      groupId,
      id: createMembershipId("membership-api-2"),
      userId: teammateId,
    }),
  ];
  const membershipsByGroupId = new Map<ReturnType<typeof createGroupId>, readonly GroupMembership[]>([
    [groupId, memberships],
  ]);

  return {
    actors: {
      agent: new TestClient(
        repository,
        createActor(memberId, "Agent Member"),
        [groupId],
        membershipsByGroupId,
      ),
      member: new TestClient(
        repository,
        createActor(memberId, "Member"),
        [groupId],
        membershipsByGroupId,
      ),
      memberId,
      outsider: new TestClient(
        repository,
        createActor(outsiderId, "Outsider"),
        [],
        membershipsByGroupId,
      ),
      teammate: new TestClient(
        repository,
        createActor(teammateId, "Teammate"),
        [groupId],
        membershipsByGroupId,
      ),
      teammateId,
    },
    groupId,
    groupSpaceId,
    personalSpaceId,
  };
}

function getCommandErrorStatus(error: ItemCommandError): number {
  switch (error.code) {
    case "access_denied":
      return 403;
    case "not_found":
      return 404;
    case "scope_mismatch":
    case "version_conflict":
      return 409;
    case "validation_failed":
      return 422;
  }
}

function isItemUndated(item: ItemOutput): boolean {
  return item.itemType === ITEM_TYPE.TASK && item.temporal.kind === TASK_TEMPORAL_KIND.UNDATED;
}

function isVisibleToActor(
  record: ItemViewRecord,
  actorUserId: ReturnType<typeof createUserId>,
  visibleGroupIds: readonly ReturnType<typeof createGroupId>[],
): boolean {
  return (
    (record.item.spaceType === SPACE_TYPE.PERSONAL && record.item.ownerId === actorUserId) ||
    (record.item.spaceType === SPACE_TYPE.GROUP &&
      record.item.groupId !== null &&
      visibleGroupIds.includes(record.item.groupId))
  );
}

function readItemData(
  response: ApiResponse<unknown>,
) {
  expect(response.status).toBeGreaterThanOrEqual(200);
  expect(response.status).toBeLessThan(300);
  return itemResponseSchema.parse(response.body).data;
}

function toEventLifecycle(
  lifecycle:
    | { status: typeof EVENT_STATUS.SCHEDULED }
    | { completedAt: string; status: typeof EVENT_STATUS.COMPLETED }
    | { canceledAt: string; status: typeof EVENT_STATUS.CANCELED },
): EventLifecycle {
  switch (lifecycle.status) {
    case EVENT_STATUS.SCHEDULED:
      return createEventScheduledLifecycle();
    case EVENT_STATUS.COMPLETED:
      return createEventCompletedLifecycle(new Date(lifecycle.completedAt));
    case EVENT_STATUS.CANCELED:
      return createEventCanceledLifecycle(new Date(lifecycle.canceledAt));
  }
}

function toEventTemporal(
  temporal:
    | { kind: typeof EVENT_TEMPORAL_KIND.START; startAt: string }
    | { endAt: string; kind: typeof EVENT_TEMPORAL_KIND.START_AND_END; startAt: string },
): EventTemporal {
  switch (temporal.kind) {
    case EVENT_TEMPORAL_KIND.START:
      return createEventStartTemporal(new Date(temporal.startAt));
    case EVENT_TEMPORAL_KIND.START_AND_END:
      return createEventStartAndEndTemporal(new Date(temporal.startAt), new Date(temporal.endAt));
  }
}

function toTaskLifecycle(
  lifecycle:
    | { status: typeof TASK_STATUS.PENDING }
    | { status: typeof TASK_STATUS.IN_PROGRESS }
    | { status: typeof TASK_STATUS.BLOCKED }
    | { postponedUntil: string; status: typeof TASK_STATUS.POSTPONED }
    | { completedAt: string; status: typeof TASK_STATUS.DONE }
    | { canceledAt: string; status: typeof TASK_STATUS.CANCELED },
): TaskLifecycle {
  switch (lifecycle.status) {
    case TASK_STATUS.PENDING:
      return createTaskPendingLifecycle();
    case TASK_STATUS.IN_PROGRESS:
      return createTaskInProgressLifecycle();
    case TASK_STATUS.BLOCKED:
      return createTaskBlockedLifecycle();
    case TASK_STATUS.POSTPONED:
      return createTaskPostponedLifecycle(new Date(lifecycle.postponedUntil));
    case TASK_STATUS.DONE:
      return createTaskDoneLifecycle(new Date(lifecycle.completedAt));
    case TASK_STATUS.CANCELED:
      return createTaskCanceledLifecycle(new Date(lifecycle.canceledAt));
  }
}

function toTaskTemporal(
  temporal:
    | { kind: typeof TASK_TEMPORAL_KIND.UNDATED }
    | { dueAt: string; kind: typeof TASK_TEMPORAL_KIND.DUE_DATE }
    | { kind: typeof TASK_TEMPORAL_KIND.START_DATE; startAt: string }
    | { endAt: string; kind: typeof TASK_TEMPORAL_KIND.START_AND_END; startAt: string }
    | { dueAt: string; kind: typeof TASK_TEMPORAL_KIND.START_AND_DUE; startAt: string }
    | {
        dueAt: string;
        endAt: string;
        kind: typeof TASK_TEMPORAL_KIND.START_END_AND_DUE;
        startAt: string;
      },
): TaskTemporal {
  switch (temporal.kind) {
    case TASK_TEMPORAL_KIND.UNDATED:
      return createTaskUndatedTemporal();
    case TASK_TEMPORAL_KIND.DUE_DATE:
      return createTaskDueDateTemporal(new Date(temporal.dueAt));
    case TASK_TEMPORAL_KIND.START_DATE:
      return createTaskStartDateTemporal(new Date(temporal.startAt));
    case TASK_TEMPORAL_KIND.START_AND_END:
      return createTaskStartAndEndTemporal(new Date(temporal.startAt), new Date(temporal.endAt));
    case TASK_TEMPORAL_KIND.START_AND_DUE:
      return createTaskStartAndDueTemporal(new Date(temporal.startAt), new Date(temporal.dueAt));
    case TASK_TEMPORAL_KIND.START_END_AND_DUE:
      return createTaskStartEndAndDueTemporal(
        new Date(temporal.startAt),
        new Date(temporal.endAt),
        new Date(temporal.dueAt),
      );
  }
}

function toIds(
  response: unknown,
): readonly string[] {
  return (response as { data: { items: Array<{ item: { id: string } }> } }).data.items.map(
    (record) => record.item.id,
  );
}

function toUserIds(userIds: readonly string[] | undefined) {
  return userIds?.map((userId) => createUserId(userId));
}

describe("item API integration", () => {
  it("covers CRUD validation and successful read/update flows", async () => {
    const harness = createHarness();
    const { member } = harness.actors;

    const invalidCreate = await member.postItem({
      body: {
        itemType: ITEM_TYPE.EVENT,
        ownerId: harness.actors.memberId,
        spaceId: harness.personalSpaceId,
        spaceType: SPACE_TYPE.PERSONAL,
        temporal: { kind: EVENT_TEMPORAL_KIND.START },
        title: "Invalid event",
      },
    });

    expect(invalidCreate.status).toBe(400);

    const createdTask = readItemData(
      await member.postItem({
        body: {
          itemType: ITEM_TYPE.TASK,
          labels: ["Docs"],
          ownerId: harness.actors.memberId,
          priority: PRIORITY.HIGH,
          spaceId: harness.personalSpaceId,
          spaceType: SPACE_TYPE.PERSONAL,
          temporal: { kind: TASK_TEMPORAL_KIND.UNDATED },
          title: "Write backend docs",
        },
      }),
    );

    const invalidUpdate = await member.patchItem({
      body: {
        itemType: ITEM_TYPE.EVENT,
        ownerId: harness.actors.memberId,
        spaceId: harness.personalSpaceId,
        spaceType: SPACE_TYPE.PERSONAL,
        temporal: {
          endAt: "2026-04-14T09:00:00.000Z",
          kind: EVENT_TEMPORAL_KIND.START_AND_END,
          startAt: "2026-04-14T10:00:00.000Z",
        },
        title: "Broken event conversion",
      },
      params: { itemId: createdTask.id },
    });

    expect(invalidUpdate.status).toBe(422);
    expect((invalidUpdate.body as { error: { code: string } }).error.code).toBe("validation_failed");

    const updatedTask = readItemData(
      await member.patchItem({
        body: {
          ownerId: harness.actors.memberId,
          priority: PRIORITY.URGENT,
          spaceId: harness.personalSpaceId,
          spaceType: SPACE_TYPE.PERSONAL,
          temporal: {
            dueAt: "2026-04-15T18:00:00.000Z",
            kind: TASK_TEMPORAL_KIND.DUE_DATE,
          },
          title: "Write backend docs v2",
        },
        params: { itemId: createdTask.id },
      }),
    );

    expect(updatedTask.priority).toBe(PRIORITY.URGENT);
    expect(updatedTask.temporal.kind).toBe(TASK_TEMPORAL_KIND.DUE_DATE);

    const fetched = await member.getItem({
      params: { itemId: createdTask.id },
      query: {
        ownerId: harness.actors.memberId,
        spaceId: harness.personalSpaceId,
        spaceType: SPACE_TYPE.PERSONAL,
      },
    });

    expect(itemResponseSchema.parse(fetched.body).data.title).toBe("Write backend docs v2");
  });

  it("returns a stable item shape for task and event resources", async () => {
    const harness = createHarness();
    const { member } = harness.actors;

    const task = readItemData(
      await member.postItem({
        body: {
          itemType: ITEM_TYPE.TASK,
          ownerId: harness.actors.memberId,
          spaceId: harness.personalSpaceId,
          spaceType: SPACE_TYPE.PERSONAL,
          temporal: {
            dueAt: "2026-04-14T17:00:00.000Z",
            kind: TASK_TEMPORAL_KIND.DUE_DATE,
          },
          title: "Task shape",
        },
      }),
    );
    const event = readItemData(
      await member.postItem({
        body: {
          assigneeIds: [harness.actors.memberId],
          groupId: harness.groupId,
          itemType: ITEM_TYPE.EVENT,
          labels: ["Ceremony"],
          spaceId: harness.groupSpaceId,
          spaceType: SPACE_TYPE.GROUP,
          temporal: {
            endAt: "2026-04-14T11:00:00.000Z",
            kind: EVENT_TEMPORAL_KIND.START_AND_END,
            startAt: "2026-04-14T09:00:00.000Z",
          },
          title: "Event shape",
        },
      }),
    );

    expect(Object.keys(task).sort()).toEqual(Object.keys(event).sort());
    expect(task.itemType).toBe(ITEM_TYPE.TASK);
    expect(task.temporal.kind).toBe(TASK_TEMPORAL_KIND.DUE_DATE);
    expect(event.itemType).toBe(ITEM_TYPE.EVENT);
    expect(event.temporal.kind).toBe(EVENT_TEMPORAL_KIND.START_AND_END);

    const listed = await member.listItems({ query: {} });
    expect(itemListResponseSchema.parse(listed.body).data.items.map((item) => item.id)).toEqual([
      task.id,
      event.id,
    ]);
  });

  it("serves my/group/calendar/undated/attention views with expected visibility behavior", async () => {
    const harness = createHarness();
    const { member, teammate } = harness.actors;

    const personal = readItemData(
      await member.postItem({
        body: {
          itemType: ITEM_TYPE.TASK,
          ownerId: harness.actors.memberId,
          spaceId: harness.personalSpaceId,
          spaceType: SPACE_TYPE.PERSONAL,
          temporal: { kind: TASK_TEMPORAL_KIND.UNDATED },
          title: "Personal undated",
        },
      }),
    );
    const unassignedGroup = readItemData(
      await member.postItem({
        body: {
          groupId: harness.groupId,
          itemType: ITEM_TYPE.TASK,
          spaceId: harness.groupSpaceId,
          spaceType: SPACE_TYPE.GROUP,
          temporal: { kind: TASK_TEMPORAL_KIND.UNDATED },
          title: "Unassigned group item",
        },
      }),
    );
    const assignedOther = readItemData(
      await member.postItem({
        body: {
          assigneeIds: [harness.actors.teammateId],
          groupId: harness.groupId,
          itemType: ITEM_TYPE.TASK,
          spaceId: harness.groupSpaceId,
          spaceType: SPACE_TYPE.GROUP,
          temporal: { kind: TASK_TEMPORAL_KIND.UNDATED },
          title: "Assigned to teammate only",
        },
      }),
    );
    const completedEvent = readItemData(
      await teammate.postItem({
        body: {
          assigneeIds: [harness.actors.teammateId],
          groupId: harness.groupId,
          itemType: ITEM_TYPE.EVENT,
          lifecycle: {
            completedAt: "2026-04-14T10:30:00.000Z",
            status: EVENT_STATUS.COMPLETED,
          },
          spaceId: harness.groupSpaceId,
          spaceType: SPACE_TYPE.GROUP,
          temporal: {
            endAt: "2026-04-14T11:00:00.000Z",
            kind: EVENT_TEMPORAL_KIND.START_AND_END,
            startAt: "2026-04-14T09:00:00.000Z",
          },
          title: "Completed event",
        },
      }),
    );
    const blockedGroup = readItemData(
      await member.postItem({
        body: {
          groupId: harness.groupId,
          itemType: ITEM_TYPE.TASK,
          lifecycle: { status: TASK_STATUS.BLOCKED },
          spaceId: harness.groupSpaceId,
          spaceType: SPACE_TYPE.GROUP,
          temporal: { kind: TASK_TEMPORAL_KIND.UNDATED },
          title: "Blocked group item",
        },
      }),
    );

    const myView = await member.getMyView({ query: {} });
    const groupView = await member.getGroupView({
      params: { groupId: harness.groupId },
      query: {},
    });
    const calendarView = await member.getCalendarView({
      query: {
        range: {
          endAt: "2026-04-14T23:59:59.999Z",
          startAt: "2026-04-14T00:00:00.000Z",
        },
        spaceFilter: VIEW_SPACE_FILTER.BOTH,
      },
    });
    const undatedView = await member.getUndatedView({
      query: { spaceFilter: VIEW_SPACE_FILTER.BOTH },
    });
    const attentionView = await member.getAttentionView({
      query: { spaceFilter: VIEW_SPACE_FILTER.BOTH },
    });

    expect(toIds(myView.body)).toContain(personal.id);
    expect(toIds(myView.body)).toContain(unassignedGroup.id);
    expect(toIds(myView.body)).not.toContain(assignedOther.id);

    expect(toIds(groupView.body)).toContain(unassignedGroup.id);
    expect(toIds(groupView.body)).toContain(assignedOther.id);
    expect(toIds(groupView.body)).toContain(blockedGroup.id);

    expect(toIds(calendarView.body)).toEqual([completedEvent.id]);
    expect(toIds(undatedView.body)).toContain(personal.id);
    expect(toIds(undatedView.body)).toContain(unassignedGroup.id);
    expect(toIds(undatedView.body)).toContain(assignedOther.id);
    expect(toIds(attentionView.body)).toEqual([blockedGroup.id]);
  });

  it("applies list and view filters without changing item meaning", async () => {
    const harness = createHarness();
    const { member, teammate } = harness.actors;

    const matchingTask = readItemData(
      await member.postItem({
        body: {
          assigneeIds: [harness.actors.teammateId],
          groupId: harness.groupId,
          itemType: ITEM_TYPE.TASK,
          labels: ["Ops"],
          priority: PRIORITY.URGENT,
          spaceId: harness.groupSpaceId,
          spaceType: SPACE_TYPE.GROUP,
          temporal: { kind: TASK_TEMPORAL_KIND.UNDATED },
          title: "Filtered group task",
        },
      }),
    );

    await teammate.postItem({
      body: {
        assigneeIds: [harness.actors.teammateId],
        groupId: harness.groupId,
        itemType: ITEM_TYPE.EVENT,
        lifecycle: {
          completedAt: "2026-04-14T12:00:00.000Z",
          status: EVENT_STATUS.COMPLETED,
        },
        labels: ["Ops"],
        priority: PRIORITY.URGENT,
        spaceId: harness.groupSpaceId,
        spaceType: SPACE_TYPE.GROUP,
        temporal: {
          kind: EVENT_TEMPORAL_KIND.START,
          startAt: "2026-04-14T10:00:00.000Z",
        },
        title: "Completed filtered event",
      },
    });

    const listResponse = await member.listItems({
      query: {
        assigneeId: harness.actors.teammateId,
        datedState: "undated",
        groupId: harness.groupId,
        itemType: ITEM_TYPE.TASK,
        label: " ops ",
        priority: PRIORITY.URGENT,
        spaceType: SPACE_TYPE.GROUP,
        status: TASK_STATUS.PENDING,
      },
    });
    const filteredGroupView = await member.getGroupView({
      params: { groupId: harness.groupId },
      query: {
        filters: {
          assigneeId: harness.actors.teammateId,
          label: "ops",
          priority: PRIORITY.URGENT,
          status: TASK_STATUS.PENDING,
        },
      },
    });
    const filteredCalendar = await member.getCalendarView({
      query: {
        filters: {
          includeCompletedEvents: false,
        },
        range: {
          endAt: "2026-04-14T23:59:59.999Z",
          startAt: "2026-04-14T00:00:00.000Z",
        },
        spaceFilter: VIEW_SPACE_FILTER.BOTH,
      },
    });

    expect(itemListResponseSchema.parse(listResponse.body).data.items.map((item) => item.id)).toEqual([
      matchingTask.id,
    ]);
    expect(toIds(filteredGroupView.body)).toEqual([matchingTask.id]);
    expect(toIds(filteredCalendar.body)).toEqual([]);
  });

  it("returns history payload parity for agents", async () => {
    const harness = createHarness();
    const { agent, member, teammate } = harness.actors;

    const created = readItemData(
      await member.postItem({
        body: {
          groupId: harness.groupId,
          itemType: ITEM_TYPE.TASK,
          labels: ["Ops"],
          spaceId: harness.groupSpaceId,
          spaceType: SPACE_TYPE.GROUP,
          temporal: { kind: TASK_TEMPORAL_KIND.UNDATED },
          title: "History item",
        },
      }),
    );

    const updated = readItemData(
      await teammate.patchItem({
        body: {
          assigneeIds: [harness.actors.teammateId],
          expectedVersionToken: created.versionToken,
          groupId: harness.groupId,
          itemType: ITEM_TYPE.TASK,
          labels: ["Ops", "Urgent"],
          lifecycle: { status: TASK_STATUS.BLOCKED },
          priority: PRIORITY.HIGH,
          spaceId: harness.groupSpaceId,
          spaceType: SPACE_TYPE.GROUP,
          temporal: { kind: TASK_TEMPORAL_KIND.UNDATED },
          title: "History item updated",
        },
        params: { itemId: created.id },
      }),
    );

    expect(updated.versionToken).toBe(1);

    const request = {
      params: { itemId: created.id },
      query: {
        groupId: harness.groupId,
        spaceId: harness.groupSpaceId,
        spaceType: SPACE_TYPE.GROUP,
      },
    };

    const memberHistory = await member.getItemHistory(request);
    const agentHistory = await agent.getItemHistory(request);
    const parsed = itemHistoryResponseSchema.parse(memberHistory.body);

    expect(memberHistory.status).toBe(200);
    expect(agentHistory.status).toBe(200);
    expect(agentHistory.body).toEqual(memberHistory.body);
    expect(parsed.data.entries).toHaveLength(1);
    expect(parsed.data.entries[0]?.changes.map((change) => change.kind)).toEqual([
      "status",
      "title",
      "priority",
      "assignees",
      "labels",
    ]);
  });
});
