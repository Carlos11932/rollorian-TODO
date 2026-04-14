import {
  ATTENTION_REASON,
  MY_VIEW_MEMBERSHIP,
  QUERY_VISIBILITY_SCOPE,
  createAttentionThresholds,
  projectItemQueryFacts,
} from "@/application/queries/projectors";
import {
  createEventItem,
  createEventStartTemporal,
  createTaskBlockedLifecycle,
  createTaskDueDateTemporal,
  createTaskItem,
  createTaskPendingLifecycle,
  createTaskPostponedLifecycle,
  createTaskStartAndDueTemporal,
  createTaskUndatedTemporal,
} from "@/domain/item";
import {
  SPACE_TYPE,
  createGroupId,
  createItemId,
  createSpaceId,
  createUserId,
} from "@/domain/shared";

function createThresholds() {
  return createAttentionThresholds({
    openItemDays: 7,
    postponeCount: 3,
  });
}

function createPersonalTaskRecord() {
  const ownerId = createUserId("owner-1");

  return {
    assigneeIds: [ownerId],
    groupId: null,
    item: createTaskItem({
      createdAt: new Date("2026-04-01T00:00:00.000Z"),
      id: createItemId("item-personal-1"),
      itemType: "task",
      lifecycle: createTaskPendingLifecycle(),
      spaceId: createSpaceId("space-personal-1"),
      spaceType: SPACE_TYPE.PERSONAL,
      temporal: createTaskUndatedTemporal(),
      title: "Personal task",
      updatedAt: new Date("2026-04-01T00:00:00.000Z"),
    }),
    ownerId,
    spaceType: SPACE_TYPE.PERSONAL,
  } as const;
}

function createGroupTaskRecord() {
  const assigneeId = createUserId("member-1");

  return {
    assigneeIds: [assigneeId],
    groupId: createGroupId("group-1"),
    item: createTaskItem({
      createdAt: new Date("2026-04-01T00:00:00.000Z"),
      id: createItemId("item-group-1"),
      itemType: "task",
      lifecycle: createTaskPendingLifecycle(),
      spaceId: createSpaceId("space-group-1"),
      spaceType: SPACE_TYPE.GROUP,
      temporal: createTaskStartAndDueTemporal(
        new Date("2026-04-14T09:00:00.000Z"),
        new Date("2026-04-16T17:00:00.000Z"),
      ),
      title: "Group task",
      updatedAt: new Date("2026-04-01T00:00:00.000Z"),
    }),
    ownerId: null,
    spaceType: SPACE_TYPE.GROUP,
  } as const;
}

describe("item query projector", () => {
  it("projects visibility facts for personal and group items", () => {
    const referenceDate = new Date("2026-04-14T12:00:00.000Z");
    const personalProjection = projectItemQueryFacts({
      record: createPersonalTaskRecord(),
      referenceDate,
      thresholds: createThresholds(),
    });
    const groupProjection = projectItemQueryFacts({
      record: createGroupTaskRecord(),
      referenceDate,
      thresholds: createThresholds(),
    });

    expect(personalProjection.visibility).toEqual({
      groupId: null,
      groupViewGroupId: null,
      myViewMembership: MY_VIEW_MEMBERSHIP.PERSONAL_OWNER,
      ownerId: createUserId("owner-1"),
      visibilityScope: QUERY_VISIBILITY_SCOPE.PERSONAL_OWNER,
    });
    expect(groupProjection.visibility).toEqual({
      groupId: createGroupId("group-1"),
      groupViewGroupId: createGroupId("group-1"),
      myViewMembership: MY_VIEW_MEMBERSHIP.GROUP_ASSIGNEE_OR_UNASSIGNED,
      ownerId: null,
      visibilityScope: QUERY_VISIBILITY_SCOPE.GROUP_MEMBERS,
    });
  });

  it("projects dated span and undated state deterministically", () => {
    const referenceDate = new Date("2026-04-14T12:00:00.000Z");
    const undatedProjection = projectItemQueryFacts({
      record: createPersonalTaskRecord(),
      referenceDate,
      thresholds: createThresholds(),
    });
    const datedProjection = projectItemQueryFacts({
      record: createGroupTaskRecord(),
      referenceDate,
      thresholds: createThresholds(),
    });

    expect(undatedProjection.datedSpan).toEqual({
      calendarEndAt: null,
      calendarStartAt: null,
      dueAt: null,
      isDated: false,
    });
    expect(undatedProjection.undatedState).toEqual({ isUndated: true });
    expect(datedProjection.datedSpan).toEqual({
      calendarEndAt: new Date("2026-04-16T17:00:00.000Z"),
      calendarStartAt: new Date("2026-04-14T09:00:00.000Z"),
      dueAt: new Date("2026-04-16T17:00:00.000Z"),
      isDated: true,
    });
    expect(datedProjection.undatedState).toEqual({ isUndated: false });
  });

  it("summarizes assignees for unassigned and multi-assigned items", () => {
    const referenceDate = new Date("2026-04-14T12:00:00.000Z");
    const memberA = createUserId("member-a");
    const memberB = createUserId("member-b");
    const unassignedProjection = projectItemQueryFacts({
      record: {
        ...createGroupTaskRecord(),
        assigneeIds: [],
      },
      referenceDate,
      thresholds: createThresholds(),
    });
    const multiAssignedProjection = projectItemQueryFacts({
      record: {
        ...createGroupTaskRecord(),
        assigneeIds: [memberA, memberB],
      },
      referenceDate,
      thresholds: createThresholds(),
    });

    expect(unassignedProjection.assigneeSummary).toEqual({
      assigneeCount: 0,
      assigneeIds: [],
      hasMultipleAssignees: false,
      isUnassigned: true,
      primaryAssigneeId: null,
    });
    expect(multiAssignedProjection.assigneeSummary).toEqual({
      assigneeCount: 2,
      assigneeIds: [memberA, memberB],
      hasMultipleAssignees: true,
      isUnassigned: false,
      primaryAssigneeId: null,
    });
  });

  it("computes deterministic attention reasons from global thresholds", () => {
    const referenceDate = new Date("2026-04-14T12:00:00.000Z");
    const projection = projectItemQueryFacts({
      record: {
        ...createGroupTaskRecord(),
        item: createTaskItem({
          createdAt: new Date("2026-04-01T00:00:00.000Z"),
          id: createItemId("item-attention-1"),
          itemType: "task",
          lifecycle: createTaskBlockedLifecycle(),
          postponeCount: 3,
          spaceId: createSpaceId("space-group-1"),
          spaceType: SPACE_TYPE.GROUP,
          temporal: createTaskDueDateTemporal(new Date("2026-04-10T09:00:00.000Z")),
          title: "Needs attention",
          updatedAt: new Date("2026-04-11T00:00:00.000Z"),
        }),
      },
      referenceDate,
      thresholds: createThresholds(),
    });

    expect(projection.attention).toEqual({
      isOpen: true,
      reasons: [
        ATTENTION_REASON.OVERDUE,
        ATTENTION_REASON.BLOCKED,
        ATTENTION_REASON.OPEN_TOO_LONG,
        ATTENTION_REASON.POSTPONED_TOO_OFTEN,
      ],
    });
  });

  it("keeps future-postponed and closed items out of attention results", () => {
    const referenceDate = new Date("2026-04-14T12:00:00.000Z");
    const futurePostponedProjection = projectItemQueryFacts({
      record: {
        ...createGroupTaskRecord(),
        item: createTaskItem({
          createdAt: new Date("2026-04-10T00:00:00.000Z"),
          id: createItemId("item-postponed-future-1"),
          itemType: "task",
          lifecycle: createTaskPostponedLifecycle(
            new Date("2026-04-20T12:00:00.000Z"),
          ),
          postponeCount: 1,
          spaceId: createSpaceId("space-group-1"),
          spaceType: SPACE_TYPE.GROUP,
          temporal: createTaskUndatedTemporal(),
          title: "Future postponed",
          updatedAt: new Date("2026-04-10T00:00:00.000Z"),
        }),
      },
      referenceDate,
      thresholds: createThresholds(),
    });
    const closedEventProjection = projectItemQueryFacts({
      record: {
        assigneeIds: [],
        groupId: null,
        item: createEventItem({
          createdAt: new Date("2026-04-01T00:00:00.000Z"),
          id: createItemId("event-completed-1"),
          itemType: "event",
          lifecycle: { completedAt: new Date("2026-04-14T09:00:00.000Z"), status: "completed" },
          spaceId: createSpaceId("space-personal-1"),
          spaceType: SPACE_TYPE.PERSONAL,
          temporal: createEventStartTemporal(new Date("2026-04-14T08:00:00.000Z")),
          title: "Completed event",
          updatedAt: new Date("2026-04-14T09:00:00.000Z"),
        }),
        ownerId: createUserId("owner-1"),
        spaceType: SPACE_TYPE.PERSONAL,
      },
      referenceDate,
      thresholds: createThresholds(),
    });

    expect(futurePostponedProjection.attention).toEqual({
      isOpen: true,
      reasons: [],
    });
    expect(closedEventProjection.attention).toEqual({
      isOpen: false,
      reasons: [],
    });
  });

  it("applies the same global attention thresholds across personal and group spaces", () => {
    const referenceDate = new Date("2026-04-14T12:00:00.000Z");
    const personalProjection = projectItemQueryFacts({
      record: {
        ...createPersonalTaskRecord(),
        item: createTaskItem({
          createdAt: new Date("2026-04-01T00:00:00.000Z"),
          id: createItemId("item-personal-threshold-1"),
          itemType: "task",
          lifecycle: createTaskPendingLifecycle(),
          spaceId: createSpaceId("space-personal-1"),
          spaceType: SPACE_TYPE.PERSONAL,
          temporal: createTaskUndatedTemporal(),
          title: "Personal threshold item",
          updatedAt: new Date("2026-04-01T00:00:00.000Z"),
        }),
      },
      referenceDate,
      thresholds: createThresholds(),
    });
    const groupProjection = projectItemQueryFacts({
      record: {
        ...createGroupTaskRecord(),
        item: createTaskItem({
          createdAt: new Date("2026-04-01T00:00:00.000Z"),
          id: createItemId("item-group-threshold-1"),
          itemType: "task",
          lifecycle: createTaskPendingLifecycle(),
          spaceId: createSpaceId("space-group-1"),
          spaceType: SPACE_TYPE.GROUP,
          temporal: createTaskUndatedTemporal(),
          title: "Group threshold item",
          updatedAt: new Date("2026-04-01T00:00:00.000Z"),
        }),
      },
      referenceDate,
      thresholds: createThresholds(),
    });

    expect(personalProjection.attention.reasons).toEqual([
      ATTENTION_REASON.OPEN_TOO_LONG,
    ]);
    expect(groupProjection.attention.reasons).toEqual([
      ATTENTION_REASON.OPEN_TOO_LONG,
    ]);
  });
});
