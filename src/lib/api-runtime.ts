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
  type TaskLifecycle,
  type TaskTemporal,
} from "@/domain/item";
import {
  ITEM_TYPE,
  SPACE_TYPE,
  createGroupId,
  createItemId,
  createSpaceId,
  createUserId,
  createVersionToken,
  type Priority,
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
  type CreateItemRequest,
  type GetAttentionViewRequest,
  type GetCalendarViewRequest,
  type GetGroupViewRequest,
  type GetItemByIdRequest,
  type GetItemHistoryRequest,
  type GetMyViewRequest,
  type GetUndatedViewRequest,
  type ItemScopeRequest,
  type ListItemsRequest,
  type UpdateItemRequest,
  type ViewFilters,
} from "@/interfaces/api";
import {
  createItemHandler,
  findItemById,
  getAttentionViewHandler,
  getCalendarViewHandler,
  getGroupViewHandler,
  getMyViewHandler,
  getUndatedViewHandler,
  prismaGroupItemHistoryRepository,
  prismaItemViewRepository,
  prismaMembershipResolver,
  readItemByIdHandler,
  updateItemHandler,
} from "@/lib/item-command-factory";
import {
  resolveMockActor,
} from "@/dev-data/actor";
import {
  createScopeMismatchError,
  type CommandFailure,
  type ItemCommandError,
  type ItemCommandSpace,
  type ItemOutput,
} from "@/application/commands";
import { type ItemViewRecord, VIEW_SPACE_FILTER } from "@/application/queries/views";

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

async function resolveRuntimeActor(request: Request) {
  const selectedActor = resolveMockActor(request);

  return (await prismaMembershipResolver.findActorByUserId(selectedActor.userId)) ?? selectedActor;
}

async function createCommandSpace(scope: ItemScopeRequest) {
  if (scope.spaceType === SPACE_TYPE.PERSONAL) {
    const space = await prismaMembershipResolver.hydratePersonalCommandSpace(createUserId(scope.ownerId));

    if (space === null) {
      return createScopeMismatchError([`Persisted personal space not found for ownerId \"${scope.ownerId}\".`]);
    }

    if (space.accessContext.spaceId !== createSpaceId(scope.spaceId)) {
      return createScopeMismatchError([
        `Requested personal space \"${scope.spaceId}\" does not match persisted space \"${space.accessContext.spaceId}\".`,
      ]);
    }

    return space;
  }

  const space = await prismaMembershipResolver.hydrateGroupCommandSpace(createGroupId(scope.groupId));

  if (space === null) {
    return createScopeMismatchError([`Persisted group space not found for groupId \"${scope.groupId}\".`]);
  }

  if (space.accessContext.spaceId !== createSpaceId(scope.spaceId)) {
    return createScopeMismatchError([
      `Requested group space \"${scope.spaceId}\" does not match persisted space \"${space.accessContext.spaceId}\".`,
    ]);
  }

  return space;
}

function isCommandFailure(value: CommandFailure | ItemCommandSpace): value is CommandFailure {
  return "ok" in value && value.ok === false;
}

async function resolveVisibleGroupIds(request: Request) {
  const actor = await resolveRuntimeActor(request);

  return {
    actor,
    visibleGroupIds: await prismaMembershipResolver.listVisibleGroupIdsForActor(actor.userId),
  };
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

function isItemUndated(item: ItemOutput): boolean {
  return item.itemType === ITEM_TYPE.TASK && item.temporal.kind === TASK_TEMPORAL_KIND.UNDATED;
}

function applyItemFilters(
  items: readonly ItemOutput[],
  filters: ListItemsRequest["query"],
): readonly ItemOutput[] {
  const normalizedLabel = filters.label?.trim().toLowerCase();

  return items.filter((item) => {
    if (filters.assigneeId !== undefined && !item.assigneeIds.includes(createUserId(filters.assigneeId))) {
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

    if (normalizedLabel !== undefined && !item.labels.some((label) => label.value === normalizedLabel)) {
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

function applyViewFilters(records: readonly ItemViewRecord[], filters: ViewFilters | undefined): readonly ItemViewRecord[] {
  if (filters === undefined) {
    return records;
  }

  const ids = new Set(
    applyItemFilters(records.map((record) => record.item), {
      assigneeId: filters.assigneeId,
      datedState: filters.datedState,
      includeCompletedEvents: filters.includeCompletedEvents,
      itemType: filters.itemType,
      label: filters.label,
      priority: filters.priority,
      status: filters.status,
    }).map((item) => item.id),
  );

  return records.filter((record) => ids.has(record.item.id));
}

function isVisibleToActor(record: ItemViewRecord, actorUserId: string, visibleGroupIds: readonly string[]): boolean {
  return (
    (record.item.spaceType === SPACE_TYPE.PERSONAL && record.item.ownerId === actorUserId) ||
    (record.item.spaceType === SPACE_TYPE.GROUP &&
      record.item.groupId !== null &&
      visibleGroupIds.includes(record.item.groupId))
  );
}

export async function createItem(request: Request, input: CreateItemRequest) {
  const actor = await resolveRuntimeActor(request);
  const body = input.body;
  const space = await createCommandSpace(body);

  if (isCommandFailure(space)) {
    return {
      body: toItemCommandResultResponse(space),
      status: getCommandErrorStatus(space.error),
    };
  }

  const itemId = createItemId(`api-item-${crypto.randomUUID()}`);
  const result =
    body.itemType === ITEM_TYPE.TASK
      ? await createItemHandler.execute({
          actor,
          assigneeIds: body.assigneeIds?.map((userId) => createUserId(userId)),
          itemId,
          itemType: ITEM_TYPE.TASK,
          labels: body.labels,
          lifecycle: body.lifecycle ? toTaskLifecycle(body.lifecycle) : undefined,
          notes: body.notes,
          postponeCount: body.postponeCount,
          priority: body.priority,
          space,
          temporal: toTaskTemporal(body.temporal),
          title: body.title,
        })
      : await createItemHandler.execute({
          actor,
          assigneeIds: body.assigneeIds?.map((userId) => createUserId(userId)),
          itemId,
          itemType: ITEM_TYPE.EVENT,
          labels: body.labels,
          lifecycle: body.lifecycle ? toEventLifecycle(body.lifecycle) : undefined,
          notes: body.notes,
          priority: body.priority,
          space,
          temporal: toEventTemporal(body.temporal),
          title: body.title,
        });

  return {
    body: toItemCommandResultResponse(result),
    status: result.ok ? 201 : getCommandErrorStatus(result.error),
  };
}

export async function getItem(request: Request, input: GetItemByIdRequest) {
  const actor = await resolveRuntimeActor(request);
  const space = await createCommandSpace(input.query);

  if (isCommandFailure(space)) {
    return {
      body: toItemCommandResultResponse(space),
      status: getCommandErrorStatus(space.error),
    };
  }

  const result = await readItemByIdHandler.execute({
    actor,
    itemId: createItemId(input.params.itemId),
    space,
  });

  return {
    body: toItemCommandResultResponse(result),
    status: result.ok ? 200 : getCommandErrorStatus(result.error),
  };
}

export async function updateItem(request: Request, input: UpdateItemRequest) {
  const actor = await resolveRuntimeActor(request);
  const body = input.body;
  const current = await findItemById(input.params.itemId);
  const resolvedItemType = body.itemType ?? current?.itemType ?? ITEM_TYPE.TASK;
  const space = await createCommandSpace(body);

  if (isCommandFailure(space)) {
    return {
      body: toItemCommandResultResponse(space),
      status: getCommandErrorStatus(space.error),
    };
  }

  const result =
    resolvedItemType === ITEM_TYPE.TASK
      ? await updateItemHandler.execute({
          actor,
          assigneeIds: body.assigneeIds?.map((userId) => createUserId(userId)),
          expectedVersionToken:
            body.expectedVersionToken === undefined
              ? undefined
              : createVersionToken(body.expectedVersionToken),
          itemId: createItemId(input.params.itemId),
          itemType: ITEM_TYPE.TASK,
          labels: body.labels,
          lifecycle: body.lifecycle ? toTaskLifecycle(body.lifecycle as Parameters<typeof toTaskLifecycle>[0]) : undefined,
          notes: body.notes,
          postponeCount:
           "postponeCount" in body && typeof body.postponeCount === "number"
               ? body.postponeCount
               : undefined,
           priority: body.priority as Priority | undefined,
           space,
           temporal: body.temporal ? toTaskTemporal(body.temporal as Parameters<typeof toTaskTemporal>[0]) : undefined,
           title: body.title,
         })
      : await updateItemHandler.execute({
          actor,
          assigneeIds: body.assigneeIds?.map((userId) => createUserId(userId)),
          expectedVersionToken:
            body.expectedVersionToken === undefined
              ? undefined
              : createVersionToken(body.expectedVersionToken),
          itemId: createItemId(input.params.itemId),
           itemType: ITEM_TYPE.EVENT,
           labels: body.labels,
           lifecycle: body.lifecycle ? toEventLifecycle(body.lifecycle as Parameters<typeof toEventLifecycle>[0]) : undefined,
           notes: body.notes,
           priority: body.priority as Priority | undefined,
           space,
           temporal: body.temporal ? toEventTemporal(body.temporal as Parameters<typeof toEventTemporal>[0]) : undefined,
           title: body.title,
         });

  return {
    body: toItemCommandResultResponse(result),
    status: result.ok ? 200 : getCommandErrorStatus(result.error),
  };
}

export async function listItems(request: Request, input: ListItemsRequest) {
  const { actor, visibleGroupIds } = await resolveVisibleGroupIds(request);
  const visibleItems = (await prismaItemViewRepository.listProjectedItems())
    .filter((record) => isVisibleToActor(record, actor.userId, visibleGroupIds))
    .map((record) => record.item);

  return {
    body: toItemListResponse(applyItemFilters(visibleItems, input.query), input.query),
    status: 200,
  };
}

export async function getMyView(request: Request, input: GetMyViewRequest) {
  const { actor, visibleGroupIds } = await resolveVisibleGroupIds(request);
  const result = await getMyViewHandler.execute({
    actorUserId: actor.userId,
    visibleGroupIds,
  });
  const items = applyViewFilters(result.items, input.query.filters);

  return {
    body: toMyViewResponse({ items, totalCount: items.length }, input.query.filters),
    status: 200,
  };
}

export async function getGroupView(request: Request, input: GetGroupViewRequest) {
  const { actor, visibleGroupIds } = await resolveVisibleGroupIds(request);
  const result = await getGroupViewHandler.execute({
    actorUserId: actor.userId,
    groupId: createGroupId(input.params.groupId),
    visibleGroupIds,
  });
  const items = applyViewFilters(result.items, input.query.filters);

  return {
    body: toGroupViewResponse({ groupId: result.groupId, items, totalCount: items.length }, input.query.filters),
    status: 200,
  };
}

export async function getCalendarView(request: Request, input: GetCalendarViewRequest) {
  const { actor, visibleGroupIds } = await resolveVisibleGroupIds(request);
  const result = await getCalendarViewHandler.execute({
    actorUserId: actor.userId,
    range: {
      endAt: new Date(input.query.range.endAt),
      startAt: new Date(input.query.range.startAt),
    },
    spaceFilter: input.query.spaceFilter,
    visibleGroupIds,
  });
  const items = applyViewFilters(result.items, input.query.filters);

  return {
    body: toCalendarViewResponse(
      { items, range: result.range, spaceFilter: result.spaceFilter, totalCount: items.length },
      input.query.filters,
    ),
    status: 200,
  };
}

export async function getUndatedView(request: Request, input: GetUndatedViewRequest) {
  const { actor, visibleGroupIds } = await resolveVisibleGroupIds(request);
  const result = await getUndatedViewHandler.execute({
    actorUserId: actor.userId,
    spaceFilter: input.query.spaceFilter,
    visibleGroupIds,
  });
  const items = applyViewFilters(result.items, input.query.filters);

  return {
    body: toUndatedViewResponse({ items, spaceFilter: result.spaceFilter, totalCount: items.length }, input.query.filters),
    status: 200,
  };
}

export async function getAttentionView(request: Request, input: GetAttentionViewRequest) {
  const { actor, visibleGroupIds } = await resolveVisibleGroupIds(request);
  const result = await getAttentionViewHandler.execute({
    actorUserId: actor.userId,
    spaceFilter: input.query.spaceFilter,
    visibleGroupIds,
  });
  const items = applyViewFilters(result.items, input.query.filters);

  return {
    body: toAttentionViewResponse({ items, spaceFilter: result.spaceFilter, totalCount: items.length }, input.query.filters),
    status: 200,
  };
}

export async function getItemHistory(request: Request, input: GetItemHistoryRequest) {
  const actor = await resolveRuntimeActor(request);
  const space = await createCommandSpace(input.query);

  if (isCommandFailure(space)) {
    return {
      body: toItemCommandResultResponse(space),
      status: getCommandErrorStatus(space.error),
    };
  }

  const readResult = await readItemByIdHandler.execute({
    actor,
    itemId: createItemId(input.params.itemId),
    space,
  });

  if (!readResult.ok) {
    return {
      body: toItemCommandResultResponse(readResult),
      status: getCommandErrorStatus(readResult.error),
    };
  }

  return {
    body: toItemHistoryEntriesResponse(
      input.params.itemId,
      await prismaGroupItemHistoryRepository.listByItemId(createItemId(input.params.itemId)),
    ),
    status: 200,
  };
}

export function parseCreateItemRequest(input: unknown) {
  return createItemRequestSchema.safeParse(input);
}

export function parseUpdateItemRequest(input: unknown) {
  return updateItemRequestSchema.safeParse(input);
}

export function parseGetItemByIdRequest(input: unknown) {
  return getItemByIdRequestSchema.safeParse(input);
}

export function parseListItemsRequest(input: unknown) {
  return listItemsRequestSchema.safeParse(input);
}

export function parseGetItemHistoryRequest(input: unknown) {
  return getItemHistoryRequestSchema.safeParse(input);
}

export function parseGetMyViewRequest(input: unknown) {
  return getMyViewRequestSchema.safeParse(input);
}

export function parseGetGroupViewRequest(input: unknown) {
  return getGroupViewRequestSchema.safeParse(input);
}

export function parseGetCalendarViewRequest(input: unknown) {
  return getCalendarViewRequestSchema.safeParse(input);
}

export function parseGetUndatedViewRequest(input: unknown) {
  return getUndatedViewRequestSchema.safeParse(input);
}

export function parseGetAttentionViewRequest(input: unknown) {
  return getAttentionViewRequestSchema.safeParse(input);
}

export { VIEW_SPACE_FILTER };
