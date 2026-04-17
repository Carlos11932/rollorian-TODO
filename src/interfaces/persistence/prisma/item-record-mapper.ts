import type { ItemRecord } from "@/application/commands";
import {
  createEventCanceledLifecycle,
  createEventCompletedLifecycle,
  createEventScheduledLifecycle,
  createTaskBlockedLifecycle,
  createTaskCanceledLifecycle,
  createTaskDoneLifecycle,
  createTaskInProgressLifecycle,
  createTaskPendingLifecycle,
  createTaskPostponedLifecycle,
  createEventItem,
  createTaskItem,
  createEventStartAndEndTemporal,
  createEventStartTemporal,
  createItemLabel,
  createTaskDueDateTemporal,
  createTaskStartAndDueTemporal,
  createTaskStartAndEndTemporal,
  createTaskStartDateTemporal,
  createTaskStartEndAndDueTemporal,
  createTaskUndatedTemporal,
  EVENT_STATUS,
  EVENT_TEMPORAL_KIND,
  TASK_STATUS,
  TASK_TEMPORAL_KIND,
} from "@/domain/item";
import {
  createGroupId,
  createItemId,
  createSpaceId,
  createUserId,
  createVersionToken,
  ITEM_TYPE,
  SPACE_TYPE,
} from "@/domain/shared";
import type { PrismaItemAggregate } from "./runtime-aggregates";

function assertPresent<TValue>(
  value: TValue | null,
  message: string,
): TValue {
  if (value === null) {
    throw new Error(message);
  }

  return value;
}

function assertAbsent<TValue>(value: TValue | null, message: string): void {
  if (value !== null) {
    throw new Error(message);
  }
}

function mapTaskTemporal(aggregate: PrismaItemAggregate) {
  switch (aggregate.temporalKind) {
    case TASK_TEMPORAL_KIND.UNDATED:
      assertAbsent(aggregate.startAt, "Undated task cannot have startAt.");
      assertAbsent(aggregate.endAt, "Undated task cannot have endAt.");
      assertAbsent(aggregate.dueAt, "Undated task cannot have dueAt.");
      return createTaskUndatedTemporal();
    case TASK_TEMPORAL_KIND.DUE_DATE:
      assertAbsent(aggregate.startAt, "Due-date task cannot have startAt.");
      assertAbsent(aggregate.endAt, "Due-date task cannot have endAt.");
      return createTaskDueDateTemporal(
        assertPresent(aggregate.dueAt, "Due-date task requires dueAt."),
      );
    case TASK_TEMPORAL_KIND.START_DATE:
      assertAbsent(aggregate.endAt, "Start-date task cannot have endAt.");
      assertAbsent(aggregate.dueAt, "Start-date task cannot have dueAt.");
      return createTaskStartDateTemporal(
        assertPresent(aggregate.startAt, "Start-date task requires startAt."),
      );
    case TASK_TEMPORAL_KIND.START_AND_END:
      assertAbsent(aggregate.dueAt, "Start/end task cannot have dueAt.");
      return createTaskStartAndEndTemporal(
        assertPresent(aggregate.startAt, "Start/end task requires startAt."),
        assertPresent(aggregate.endAt, "Start/end task requires endAt."),
      );
    case TASK_TEMPORAL_KIND.START_AND_DUE:
      assertAbsent(aggregate.endAt, "Start/due task cannot have endAt.");
      return createTaskStartAndDueTemporal(
        assertPresent(aggregate.startAt, "Start/due task requires startAt."),
        assertPresent(aggregate.dueAt, "Start/due task requires dueAt."),
      );
    case TASK_TEMPORAL_KIND.START_END_AND_DUE:
      return createTaskStartEndAndDueTemporal(
        assertPresent(aggregate.startAt, "Start/end/due task requires startAt."),
        assertPresent(aggregate.endAt, "Start/end/due task requires endAt."),
        assertPresent(aggregate.dueAt, "Start/end/due task requires dueAt."),
      );
    case EVENT_TEMPORAL_KIND.START:
      throw new Error("Task item cannot use event temporal kind 'start'.");
  }
}

function mapEventTemporal(aggregate: PrismaItemAggregate) {
  switch (aggregate.temporalKind) {
    case EVENT_TEMPORAL_KIND.START:
      assertAbsent(aggregate.endAt, "Single-start event cannot have endAt.");
      assertAbsent(aggregate.dueAt, "Event cannot have dueAt.");
      return createEventStartTemporal(
        assertPresent(aggregate.startAt, "Event start temporal requires startAt."),
      );
    case EVENT_TEMPORAL_KIND.START_AND_END:
      assertAbsent(aggregate.dueAt, "Event cannot have dueAt.");
      return createEventStartAndEndTemporal(
        assertPresent(aggregate.startAt, "Event start/end temporal requires startAt."),
        assertPresent(aggregate.endAt, "Event start/end temporal requires endAt."),
      );
    case TASK_TEMPORAL_KIND.UNDATED:
    case TASK_TEMPORAL_KIND.DUE_DATE:
    case TASK_TEMPORAL_KIND.START_DATE:
    case TASK_TEMPORAL_KIND.START_AND_DUE:
    case TASK_TEMPORAL_KIND.START_END_AND_DUE:
      throw new Error(`Event item cannot use task temporal kind '${aggregate.temporalKind}'.`);
  }
}

function mapTaskLifecycle(aggregate: PrismaItemAggregate) {
  switch (aggregate.status) {
    case TASK_STATUS.PENDING:
      assertAbsent(aggregate.postponedUntil, "Pending task cannot have postponedUntil.");
      assertAbsent(aggregate.completedAt, "Pending task cannot have completedAt.");
      assertAbsent(aggregate.canceledAt, "Pending task cannot have canceledAt.");
      return createTaskPendingLifecycle();
    case TASK_STATUS.IN_PROGRESS:
      assertAbsent(aggregate.postponedUntil, "In-progress task cannot have postponedUntil.");
      assertAbsent(aggregate.completedAt, "In-progress task cannot have completedAt.");
      assertAbsent(aggregate.canceledAt, "In-progress task cannot have canceledAt.");
      return createTaskInProgressLifecycle();
    case TASK_STATUS.BLOCKED:
      assertAbsent(aggregate.postponedUntil, "Blocked task cannot have postponedUntil.");
      assertAbsent(aggregate.completedAt, "Blocked task cannot have completedAt.");
      assertAbsent(aggregate.canceledAt, "Blocked task cannot have canceledAt.");
      return createTaskBlockedLifecycle();
    case TASK_STATUS.POSTPONED:
      assertAbsent(aggregate.completedAt, "Postponed task cannot have completedAt.");
      assertAbsent(aggregate.canceledAt, "Postponed task cannot have canceledAt.");
      return createTaskPostponedLifecycle(
        assertPresent(aggregate.postponedUntil, "Postponed task requires postponedUntil."),
      );
    case TASK_STATUS.DONE:
      assertAbsent(aggregate.postponedUntil, "Done task cannot have postponedUntil.");
      assertAbsent(aggregate.canceledAt, "Done task cannot have canceledAt.");
      return createTaskDoneLifecycle(
        assertPresent(aggregate.completedAt, "Done task requires completedAt."),
      );
    case TASK_STATUS.CANCELED:
      assertAbsent(aggregate.postponedUntil, "Canceled task cannot have postponedUntil.");
      assertAbsent(aggregate.completedAt, "Canceled task cannot have completedAt.");
      return createTaskCanceledLifecycle(
        assertPresent(aggregate.canceledAt, "Canceled task requires canceledAt."),
      );
    case EVENT_STATUS.SCHEDULED:
    case EVENT_STATUS.COMPLETED:
    case EVENT_STATUS.CANCELED:
      throw new Error(`Task item cannot use event status '${aggregate.status}'.`);
  }
}

function mapEventLifecycle(aggregate: PrismaItemAggregate) {
  switch (aggregate.status) {
    case EVENT_STATUS.SCHEDULED:
      assertAbsent(aggregate.postponedUntil, "Scheduled event cannot have postponedUntil.");
      assertAbsent(aggregate.completedAt, "Scheduled event cannot have completedAt.");
      assertAbsent(aggregate.canceledAt, "Scheduled event cannot have canceledAt.");
      return createEventScheduledLifecycle();
    case EVENT_STATUS.COMPLETED:
      assertAbsent(aggregate.postponedUntil, "Completed event cannot have postponedUntil.");
      assertAbsent(aggregate.canceledAt, "Completed event cannot have canceledAt.");
      return createEventCompletedLifecycle(
        assertPresent(aggregate.completedAt, "Completed event requires completedAt."),
      );
    case EVENT_STATUS.CANCELED:
      assertAbsent(aggregate.postponedUntil, "Canceled event cannot have postponedUntil.");
      assertAbsent(aggregate.completedAt, "Canceled event cannot have completedAt.");
      return createEventCanceledLifecycle(
        assertPresent(aggregate.canceledAt, "Canceled event requires canceledAt."),
      );
    case TASK_STATUS.PENDING:
    case TASK_STATUS.IN_PROGRESS:
    case TASK_STATUS.BLOCKED:
    case TASK_STATUS.POSTPONED:
    case TASK_STATUS.DONE:
      throw new Error(`Event item cannot use task status '${aggregate.status}'.`);
  }
}

export function mapPrismaItemAggregateToItemRecord(
  aggregate: PrismaItemAggregate,
): ItemRecord {
  const assigneeIds = aggregate.assignees.map((assignee) => createUserId(assignee.userId));
  const labels = aggregate.labels.map(({ label }) => createItemLabel(label.value));

  if (aggregate.itemType === ITEM_TYPE.TASK) {
    const item = createTaskItem({
      createdAt: aggregate.createdAt,
      id: createItemId(aggregate.id),
      itemType: ITEM_TYPE.TASK,
      lifecycle: mapTaskLifecycle(aggregate),
      notes: aggregate.notes,
      postponeCount: aggregate.postponeCount,
      priority: aggregate.priority,
      spaceId: createSpaceId(aggregate.spaceId),
      spaceType: aggregate.spaceType,
      temporal: mapTaskTemporal(aggregate),
      title: aggregate.title,
      updatedAt: aggregate.updatedAt,
      versionToken: createVersionToken(aggregate.versionToken),
    });

    if (aggregate.spaceType === SPACE_TYPE.PERSONAL) {
      assertAbsent(aggregate.groupId, "Personal item cannot have groupId.");

      return {
        assigneeIds,
        groupId: null,
        item,
        labels,
        ownerId: createUserId(assertPresent(aggregate.ownerId, "Personal item requires ownerId.")),
        spaceType: SPACE_TYPE.PERSONAL,
      };
    }

    assertAbsent(aggregate.ownerId, "Group item cannot have ownerId.");

    return {
      assigneeIds,
      groupId: createGroupId(assertPresent(aggregate.groupId, "Group item requires groupId.")),
      item,
      labels,
      ownerId: null,
      spaceType: SPACE_TYPE.GROUP,
    };
  }

  const item = createEventItem({
    createdAt: aggregate.createdAt,
    id: createItemId(aggregate.id),
    itemType: ITEM_TYPE.EVENT,
    lifecycle: mapEventLifecycle(aggregate),
    notes: aggregate.notes,
    priority: aggregate.priority,
    spaceId: createSpaceId(aggregate.spaceId),
    spaceType: aggregate.spaceType,
    temporal: mapEventTemporal(aggregate),
    title: aggregate.title,
    updatedAt: aggregate.updatedAt,
    versionToken: createVersionToken(aggregate.versionToken),
  });

  if (aggregate.spaceType === SPACE_TYPE.PERSONAL) {
    assertAbsent(aggregate.groupId, "Personal item cannot have groupId.");

    return {
      assigneeIds,
      groupId: null,
      item,
      labels,
      ownerId: createUserId(assertPresent(aggregate.ownerId, "Personal item requires ownerId.")),
      spaceType: SPACE_TYPE.PERSONAL,
    };
  }

  assertAbsent(aggregate.ownerId, "Group item cannot have ownerId.");

  return {
    assigneeIds,
    groupId: createGroupId(assertPresent(aggregate.groupId, "Group item requires groupId.")),
    item,
    labels,
    ownerId: null,
    spaceType: SPACE_TYPE.GROUP,
  };
}
