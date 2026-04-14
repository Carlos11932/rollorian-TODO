import { toItemOutput, type ItemRecord } from "@/application/commands";
import { projectItemQueryFacts, type AttentionThresholds } from "@/application/queries/projectors";
import {
  GetCalendarViewQueryHandler,
  GetGroupViewQueryHandler,
  GetMyViewQueryHandler,
  GetRequiresAttentionViewQueryHandler,
  GetUndatedViewQueryHandler,
  VIEW_SPACE_FILTER,
  createCalendarRange,
  type ItemViewQueryRepository,
  type ItemViewRecord,
} from "@/application/queries/views";
import {
  createEventCompletedLifecycle,
  createEventItem,
  createEventStartTemporal,
  createTaskBlockedLifecycle,
  createTaskDueDateTemporal,
  createTaskItem,
  createTaskPendingLifecycle,
  createTaskPostponedLifecycle,
  createTaskUndatedTemporal,
} from "@/domain/item";
import {
  SPACE_TYPE,
  createGroupId,
  createItemId,
  createSpaceId,
  createUserId,
} from "@/domain/shared";

class InMemoryItemViewQueryRepository implements ItemViewQueryRepository {
  public constructor(private readonly records: readonly ItemViewRecord[]) {}

  public async listProjectedItems(): Promise<readonly ItemViewRecord[]> {
    return this.records;
  }
}

const REFERENCE_DATE = new Date("2026-04-14T12:00:00.000Z");
const THRESHOLDS: AttentionThresholds = {
  openItemDays: 7,
  postponeCount: 3,
};

const actorUserId = createUserId("member-1");
const teammateUserId = createUserId("member-2");
const outsiderUserId = createUserId("outsider-1");
const personalOwnerId = actorUserId;
const visibleGroupId = createGroupId("group-1");
const hiddenGroupId = createGroupId("group-2");

function createPersonalRecord(item: ItemRecord["item"]): ItemRecord {
  return {
    assigneeIds: [personalOwnerId],
    groupId: null,
    item,
    labels: [],
    ownerId: personalOwnerId,
    spaceType: SPACE_TYPE.PERSONAL,
  };
}

function createGroupRecord(
  item: ItemRecord["item"],
  assigneeIds: readonly ReturnType<typeof createUserId>[],
  groupId: ReturnType<typeof createGroupId> = visibleGroupId,
): ItemRecord {
  return {
    assigneeIds,
    groupId,
    item,
    labels: [],
    ownerId: null,
    spaceType: SPACE_TYPE.GROUP,
  };
}

function toViewRecord(record: ItemRecord): ItemViewRecord {
  return {
    item: toItemOutput(record),
    projection: projectItemQueryFacts({
      record,
      referenceDate: REFERENCE_DATE,
      thresholds: THRESHOLDS,
    }),
  };
}

function createRecords(): readonly ItemViewRecord[] {
  return [
    toViewRecord(
      createPersonalRecord(
        createTaskItem({
          createdAt: new Date("2026-04-10T00:00:00.000Z"),
          id: createItemId("personal-undated"),
          itemType: "task",
          lifecycle: createTaskPendingLifecycle(),
          spaceId: createSpaceId("space-personal-1"),
          spaceType: SPACE_TYPE.PERSONAL,
          temporal: createTaskUndatedTemporal(),
          title: "Personal undated",
          updatedAt: new Date("2026-04-10T00:00:00.000Z"),
        }),
      ),
    ),
    toViewRecord(
      createGroupRecord(
        createTaskItem({
          createdAt: new Date("2026-04-10T00:00:00.000Z"),
          id: createItemId("group-assigned-self"),
          itemType: "task",
          lifecycle: createTaskPendingLifecycle(),
          spaceId: createSpaceId("space-group-1"),
          spaceType: SPACE_TYPE.GROUP,
          temporal: createTaskDueDateTemporal(new Date("2026-04-16T09:00:00.000Z")),
          title: "Assigned to actor",
          updatedAt: new Date("2026-04-10T00:00:00.000Z"),
        }),
        [actorUserId],
      ),
    ),
    toViewRecord(
      createGroupRecord(
        createTaskItem({
          createdAt: new Date("2026-04-10T00:00:00.000Z"),
          id: createItemId("group-unassigned"),
          itemType: "task",
          lifecycle: createTaskPendingLifecycle(),
          spaceId: createSpaceId("space-group-1"),
          spaceType: SPACE_TYPE.GROUP,
          temporal: createTaskUndatedTemporal(),
          title: "Unassigned group item",
          updatedAt: new Date("2026-04-10T00:00:00.000Z"),
        }),
        [],
      ),
    ),
    toViewRecord(
      createGroupRecord(
        createTaskItem({
          createdAt: new Date("2026-04-10T00:00:00.000Z"),
          id: createItemId("group-assigned-other"),
          itemType: "task",
          lifecycle: createTaskPendingLifecycle(),
          spaceId: createSpaceId("space-group-1"),
          spaceType: SPACE_TYPE.GROUP,
          temporal: createTaskUndatedTemporal(),
          title: "Assigned only to teammate",
          updatedAt: new Date("2026-04-10T00:00:00.000Z"),
        }),
        [teammateUserId],
      ),
    ),
    toViewRecord(
      createGroupRecord(
        createEventItem({
          createdAt: new Date("2026-04-10T00:00:00.000Z"),
          id: createItemId("completed-event-visible"),
          itemType: "event",
          lifecycle: createEventCompletedLifecycle(
            new Date("2026-04-14T10:00:00.000Z"),
          ),
          spaceId: createSpaceId("space-group-1"),
          spaceType: SPACE_TYPE.GROUP,
          temporal: createEventStartTemporal(new Date("2026-04-14T09:00:00.000Z")),
          title: "Completed event",
          updatedAt: new Date("2026-04-14T10:00:00.000Z"),
        }),
        [teammateUserId],
      ),
    ),
    toViewRecord(
      createPersonalRecord(
        createTaskItem({
          createdAt: new Date("2026-04-10T00:00:00.000Z"),
          id: createItemId("personal-attention"),
          itemType: "task",
          lifecycle: createTaskBlockedLifecycle(),
          postponeCount: 0,
          spaceId: createSpaceId("space-personal-1"),
          spaceType: SPACE_TYPE.PERSONAL,
          temporal: createTaskUndatedTemporal(),
          title: "Blocked personal task",
          updatedAt: new Date("2026-04-10T00:00:00.000Z"),
        }),
      ),
    ),
    toViewRecord(
      createGroupRecord(
        createTaskItem({
          createdAt: new Date("2026-04-01T00:00:00.000Z"),
          id: createItemId("group-attention"),
          itemType: "task",
          lifecycle: createTaskPostponedLifecycle(
            new Date("2026-04-14T08:00:00.000Z"),
          ),
          postponeCount: 3,
          spaceId: createSpaceId("space-group-1"),
          spaceType: SPACE_TYPE.GROUP,
          temporal: createTaskUndatedTemporal(),
          title: "Postponed group task",
          updatedAt: new Date("2026-04-14T08:00:00.000Z"),
        }),
        [],
      ),
    ),
    toViewRecord(
      createGroupRecord(
        createTaskItem({
          createdAt: new Date("2026-04-10T00:00:00.000Z"),
          id: createItemId("group-future-postponed"),
          itemType: "task",
          lifecycle: createTaskPostponedLifecycle(
            new Date("2026-04-20T08:00:00.000Z"),
          ),
          postponeCount: 1,
          spaceId: createSpaceId("space-group-1"),
          spaceType: SPACE_TYPE.GROUP,
          temporal: createTaskUndatedTemporal(),
          title: "Future postponed",
          updatedAt: new Date("2026-04-10T00:00:00.000Z"),
        }),
        [],
      ),
    ),
    toViewRecord(
      createGroupRecord(
        createTaskItem({
          createdAt: new Date("2026-04-01T00:00:00.000Z"),
          id: createItemId("hidden-group-item"),
          itemType: "task",
          lifecycle: createTaskPendingLifecycle(),
          spaceId: createSpaceId("space-group-2"),
          spaceType: SPACE_TYPE.GROUP,
          temporal: createTaskUndatedTemporal(),
          title: "Hidden group item",
          updatedAt: new Date("2026-04-01T00:00:00.000Z"),
        }),
        [outsiderUserId],
        hiddenGroupId,
      ),
    ),
  ];
}

function createRepository(): ItemViewQueryRepository {
  return new InMemoryItemViewQueryRepository(createRecords());
}

function extractIds(records: readonly ItemViewRecord[]): readonly string[] {
  return records.map((record) => record.item.id);
}

describe("view query handlers", () => {
  it("returns only personal, assigned group, and unassigned group items in My View", async () => {
    const handler = new GetMyViewQueryHandler(createRepository());

    const result = await handler.execute({
      actorUserId,
      visibleGroupIds: [visibleGroupId],
    });

    expect(extractIds(result.items)).toEqual([
      "personal-undated",
      "group-assigned-self",
      "group-unassigned",
      "personal-attention",
      "group-attention",
      "group-future-postponed",
    ]);
  });

  it("returns all items for the selected visible group in Group View", async () => {
    const handler = new GetGroupViewQueryHandler(createRepository());

    const result = await handler.execute({
      actorUserId,
      groupId: visibleGroupId,
      visibleGroupIds: [visibleGroupId],
    });

    expect(extractIds(result.items)).toEqual([
      "group-assigned-self",
      "group-unassigned",
      "group-assigned-other",
      "completed-event-visible",
      "group-attention",
      "group-future-postponed",
    ]);
  });

  it("returns dated items by range and keeps completed events visible by default", async () => {
    const handler = new GetCalendarViewQueryHandler(createRepository());

    const bothResult = await handler.execute({
      actorUserId,
      range: createCalendarRange(
        new Date("2026-04-14T00:00:00.000Z"),
        new Date("2026-04-14T23:59:59.999Z"),
      ),
      spaceFilter: VIEW_SPACE_FILTER.BOTH,
      visibleGroupIds: [visibleGroupId],
    });
    const personalResult = await handler.execute({
      actorUserId,
      range: createCalendarRange(
        new Date("2026-04-14T00:00:00.000Z"),
        new Date("2026-04-16T23:59:59.999Z"),
      ),
      spaceFilter: VIEW_SPACE_FILTER.PERSONAL,
      visibleGroupIds: [visibleGroupId],
    });
    const groupResult = await handler.execute({
      actorUserId,
      range: createCalendarRange(
        new Date("2026-04-14T00:00:00.000Z"),
        new Date("2026-04-16T23:59:59.999Z"),
      ),
      spaceFilter: VIEW_SPACE_FILTER.GROUP,
      visibleGroupIds: [visibleGroupId],
    });

    expect(extractIds(bothResult.items)).toEqual(["completed-event-visible"]);
    expect(extractIds(personalResult.items)).toEqual([]);
    expect(extractIds(groupResult.items)).toEqual([
      "group-assigned-self",
      "completed-event-visible",
    ]);
  });

  it("returns only reachable undated items for the active visibility filter", async () => {
    const handler = new GetUndatedViewQueryHandler(createRepository());

    const result = await handler.execute({
      actorUserId,
      spaceFilter: VIEW_SPACE_FILTER.BOTH,
      visibleGroupIds: [visibleGroupId],
    });

    expect(extractIds(result.items)).toEqual([
      "personal-undated",
      "group-unassigned",
      "group-assigned-other",
      "personal-attention",
      "group-attention",
      "group-future-postponed",
    ]);
  });

  it("returns only reachable items whose projected attention reasons are present", async () => {
    const handler = new GetRequiresAttentionViewQueryHandler(createRepository());

    const bothResult = await handler.execute({
      actorUserId,
      spaceFilter: VIEW_SPACE_FILTER.BOTH,
      visibleGroupIds: [visibleGroupId],
    });
    const groupResult = await handler.execute({
      actorUserId,
      spaceFilter: VIEW_SPACE_FILTER.GROUP,
      visibleGroupIds: [visibleGroupId],
    });

    expect(extractIds(bothResult.items)).toEqual([
      "personal-attention",
      "group-attention",
    ]);
    expect(extractIds(groupResult.items)).toEqual(["group-attention"]);
  });
});
