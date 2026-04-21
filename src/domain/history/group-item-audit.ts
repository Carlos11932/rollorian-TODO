import type { ActorMetadata } from "@/domain/identity";
import {
  EVENT_STATUS,
  EVENT_TEMPORAL_KIND,
  TASK_STATUS,
  TASK_TEMPORAL_KIND,
  type EventTemporal,
  type Item,
  type ItemLabel,
  type TaskTemporal,
} from "@/domain/item";
import type {
  GroupId,
  ItemId,
  Priority,
  UserId,
  VersionToken,
} from "@/domain/shared";

export const GROUP_ITEM_AUDIT_CHANGE_KIND = {
  ASSIGNEES: "assignees",
  CANCELLATION: "cancellation",
  COMPLETION: "completion",
  DATES: "dates",
  LABELS: "labels",
  PRIORITY: "priority",
  STATUS: "status",
  TITLE: "title",
} as const;

export type GroupItemAuditChangeKind =
  (typeof GROUP_ITEM_AUDIT_CHANGE_KIND)[keyof typeof GROUP_ITEM_AUDIT_CHANGE_KIND];

export interface GroupItemAuditSnapshot {
  assigneeIds: readonly UserId[];
  groupId: GroupId;
  item: Item;
  labels: readonly ItemLabel[];
}

export interface GroupItemAuditDatesState {
  dueAt: Date | null;
  endAt: Date | null;
  startAt: Date | null;
  temporalKind: string;
}

export interface GroupItemAuditCompletionState {
  completedAt: Date | null;
  isCompleted: boolean;
}

export interface GroupItemAuditCancellationState {
  canceledAt: Date | null;
  isCanceled: boolean;
}

export interface GroupItemStatusChanged {
  after: string;
  before: string;
  kind: typeof GROUP_ITEM_AUDIT_CHANGE_KIND.STATUS;
}

export interface GroupItemAssigneesChanged {
  after: readonly UserId[];
  before: readonly UserId[];
  kind: typeof GROUP_ITEM_AUDIT_CHANGE_KIND.ASSIGNEES;
}

export interface GroupItemPriorityChanged {
  after: Priority;
  before: Priority;
  kind: typeof GROUP_ITEM_AUDIT_CHANGE_KIND.PRIORITY;
}

export interface GroupItemLabelsChanged {
  after: readonly string[];
  before: readonly string[];
  kind: typeof GROUP_ITEM_AUDIT_CHANGE_KIND.LABELS;
}

export interface GroupItemDatesChanged {
  after: GroupItemAuditDatesState;
  before: GroupItemAuditDatesState;
  kind: typeof GROUP_ITEM_AUDIT_CHANGE_KIND.DATES;
}

export interface GroupItemTitleChanged {
  after: string;
  before: string;
  kind: typeof GROUP_ITEM_AUDIT_CHANGE_KIND.TITLE;
}

export interface GroupItemCompletionChanged {
  after: GroupItemAuditCompletionState;
  before: GroupItemAuditCompletionState;
  kind: typeof GROUP_ITEM_AUDIT_CHANGE_KIND.COMPLETION;
}

export interface GroupItemCancellationChanged {
  after: GroupItemAuditCancellationState;
  before: GroupItemAuditCancellationState;
  kind: typeof GROUP_ITEM_AUDIT_CHANGE_KIND.CANCELLATION;
}

export type GroupItemAuditChange =
  | GroupItemAssigneesChanged
  | GroupItemCancellationChanged
  | GroupItemCompletionChanged
  | GroupItemDatesChanged
  | GroupItemLabelsChanged
  | GroupItemPriorityChanged
  | GroupItemStatusChanged
  | GroupItemTitleChanged;

export interface GroupItemAuditEntry {
  actor: ActorMetadata;
  changedAt: Date;
  changes: readonly GroupItemAuditChange[];
  groupId: GroupId;
  itemId: ItemId;
  versionToken: VersionToken;
}

export interface CreateGroupItemAuditEntryInput {
  actor: ActorMetadata;
  after: GroupItemAuditSnapshot;
  before: GroupItemAuditSnapshot;
  changedAt?: Date;
}

function areDateValuesEqual(left: Date | null, right: Date | null): boolean {
  if (left === null || right === null) {
    return left === right;
  }

  return left.getTime() === right.getTime();
}

function areStringListsEqual(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function areUserIdListsEqual(
  left: readonly UserId[],
  right: readonly UserId[],
): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function toLabelValues(labels: readonly ItemLabel[]): readonly string[] {
  return labels.map((label) => label.value);
}

function toDatesStateFromTaskTemporal(
  temporal: TaskTemporal,
): GroupItemAuditDatesState {
  switch (temporal.kind) {
    case TASK_TEMPORAL_KIND.UNDATED:
      return { dueAt: null, endAt: null, startAt: null, temporalKind: temporal.kind };
    case TASK_TEMPORAL_KIND.DUE_DATE:
      return {
        dueAt: temporal.dueAt,
        endAt: null,
        startAt: null,
        temporalKind: temporal.kind,
      };
    case TASK_TEMPORAL_KIND.START_DATE:
      return {
        dueAt: null,
        endAt: null,
        startAt: temporal.startAt,
        temporalKind: temporal.kind,
      };
    case TASK_TEMPORAL_KIND.START_AND_END:
      return {
        dueAt: null,
        endAt: temporal.endAt,
        startAt: temporal.startAt,
        temporalKind: temporal.kind,
      };
    case TASK_TEMPORAL_KIND.START_AND_DUE:
      return {
        dueAt: temporal.dueAt,
        endAt: null,
        startAt: temporal.startAt,
        temporalKind: temporal.kind,
      };
    case TASK_TEMPORAL_KIND.START_END_AND_DUE:
      return {
        dueAt: temporal.dueAt,
        endAt: temporal.endAt,
        startAt: temporal.startAt,
        temporalKind: temporal.kind,
      };
  }
}

function toDatesStateFromEventTemporal(
  temporal: EventTemporal,
): GroupItemAuditDatesState {
  switch (temporal.kind) {
    case EVENT_TEMPORAL_KIND.START:
      return {
        dueAt: null,
        endAt: null,
        startAt: temporal.startAt,
        temporalKind: temporal.kind,
      };
    case EVENT_TEMPORAL_KIND.START_AND_END:
      return {
        dueAt: null,
        endAt: temporal.endAt,
        startAt: temporal.startAt,
        temporalKind: temporal.kind,
      };
  }
}

function toDatesState(item: Item): GroupItemAuditDatesState {
  if (item.itemType === "task") {
    return toDatesStateFromTaskTemporal(item.temporal);
  }

  return toDatesStateFromEventTemporal(item.temporal);
}

function areDatesStatesEqual(
  left: GroupItemAuditDatesState,
  right: GroupItemAuditDatesState,
): boolean {
  return (
    left.temporalKind === right.temporalKind &&
    areDateValuesEqual(left.startAt, right.startAt) &&
    areDateValuesEqual(left.endAt, right.endAt) &&
    areDateValuesEqual(left.dueAt, right.dueAt)
  );
}

function toCompletionState(item: Item): GroupItemAuditCompletionState {
  if (item.itemType === "task") {
    return item.lifecycle.status === TASK_STATUS.DONE
      ? { completedAt: item.lifecycle.completedAt, isCompleted: true }
      : { completedAt: null, isCompleted: false };
  }

  return item.lifecycle.status === EVENT_STATUS.COMPLETED
    ? { completedAt: item.lifecycle.completedAt, isCompleted: true }
    : { completedAt: null, isCompleted: false };
}

function areCompletionStatesEqual(
  left: GroupItemAuditCompletionState,
  right: GroupItemAuditCompletionState,
): boolean {
  return (
    left.isCompleted === right.isCompleted &&
    areDateValuesEqual(left.completedAt, right.completedAt)
  );
}

function toCancellationState(item: Item): GroupItemAuditCancellationState {
  if (item.itemType === "task") {
    return item.lifecycle.status === TASK_STATUS.CANCELED
      ? { canceledAt: item.lifecycle.canceledAt, isCanceled: true }
      : { canceledAt: null, isCanceled: false };
  }

  return item.lifecycle.status === EVENT_STATUS.CANCELED
    ? { canceledAt: item.lifecycle.canceledAt, isCanceled: true }
    : { canceledAt: null, isCanceled: false };
}

function areCancellationStatesEqual(
  left: GroupItemAuditCancellationState,
  right: GroupItemAuditCancellationState,
): boolean {
  return (
    left.isCanceled === right.isCanceled &&
    areDateValuesEqual(left.canceledAt, right.canceledAt)
  );
}

export function createGroupItemAuditEntry(
  input: CreateGroupItemAuditEntryInput,
): GroupItemAuditEntry | null {
  if (input.before.item.id !== input.after.item.id) {
    throw new Error("Group item audit snapshots must target the same item.");
  }

  if (input.before.groupId !== input.after.groupId) {
    throw new Error("Group item audit snapshots must target the same group.");
  }

  const changes: GroupItemAuditChange[] = [];
  const beforeStatus = input.before.item.lifecycle.status;
  const afterStatus = input.after.item.lifecycle.status;

  if (beforeStatus !== afterStatus) {
    changes.push({
      after: afterStatus,
      before: beforeStatus,
      kind: GROUP_ITEM_AUDIT_CHANGE_KIND.STATUS,
    });
  }

  if (input.before.item.title !== input.after.item.title) {
    changes.push({
      after: input.after.item.title,
      before: input.before.item.title,
      kind: GROUP_ITEM_AUDIT_CHANGE_KIND.TITLE,
    });
  }

  if (input.before.item.priority !== input.after.item.priority) {
    changes.push({
      after: input.after.item.priority,
      before: input.before.item.priority,
      kind: GROUP_ITEM_AUDIT_CHANGE_KIND.PRIORITY,
    });
  }

  if (!areUserIdListsEqual(input.before.assigneeIds, input.after.assigneeIds)) {
    changes.push({
      after: input.after.assigneeIds,
      before: input.before.assigneeIds,
      kind: GROUP_ITEM_AUDIT_CHANGE_KIND.ASSIGNEES,
    });
  }

  const beforeLabelValues = toLabelValues(input.before.labels);
  const afterLabelValues = toLabelValues(input.after.labels);

  if (!areStringListsEqual(beforeLabelValues, afterLabelValues)) {
    changes.push({
      after: afterLabelValues,
      before: beforeLabelValues,
      kind: GROUP_ITEM_AUDIT_CHANGE_KIND.LABELS,
    });
  }

  const beforeDates = toDatesState(input.before.item);
  const afterDates = toDatesState(input.after.item);

  if (!areDatesStatesEqual(beforeDates, afterDates)) {
    changes.push({
      after: afterDates,
      before: beforeDates,
      kind: GROUP_ITEM_AUDIT_CHANGE_KIND.DATES,
    });
  }

  const beforeCompletion = toCompletionState(input.before.item);
  const afterCompletion = toCompletionState(input.after.item);

  if (!areCompletionStatesEqual(beforeCompletion, afterCompletion)) {
    changes.push({
      after: afterCompletion,
      before: beforeCompletion,
      kind: GROUP_ITEM_AUDIT_CHANGE_KIND.COMPLETION,
    });
  }

  const beforeCancellation = toCancellationState(input.before.item);
  const afterCancellation = toCancellationState(input.after.item);

  if (!areCancellationStatesEqual(beforeCancellation, afterCancellation)) {
    changes.push({
      after: afterCancellation,
      before: beforeCancellation,
      kind: GROUP_ITEM_AUDIT_CHANGE_KIND.CANCELLATION,
    });
  }

  if (changes.length === 0) {
    return null;
  }

  return {
    actor: input.actor,
    changedAt: input.changedAt ?? input.after.item.updatedAt,
    changes,
    groupId: input.after.groupId,
    itemId: input.after.item.id,
    versionToken: input.after.item.versionToken,
  };
}
