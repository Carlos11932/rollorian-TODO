import {
  GROUP_ITEM_AUDIT_CHANGE_KIND,
  type GroupItemAuditChange,
  type GroupItemAuditEntry,
} from "@/domain/history";
import { createGroupId, createItemId, createUserId, createVersionToken } from "@/domain/shared";
import type { PrismaGroupAuditChangeRow, PrismaGroupAuditEntryAggregate } from "./runtime-aggregates";

function assertPresent<TValue>(
  value: TValue | null,
  message: string,
): TValue {
  if (value === null) {
    throw new Error(message);
  }

  return value;
}

function assertPresentBoolean(value: boolean | null, message: string): boolean {
  if (value === null) {
    throw new Error(message);
  }

  return value;
}

function mapPrismaGroupAuditChangeRowToChange(
  change: PrismaGroupAuditChangeRow,
): GroupItemAuditChange {
  switch (change.kind) {
    case GROUP_ITEM_AUDIT_CHANGE_KIND.STATUS:
      return {
        after: assertPresent(change.afterStatus, "Status audit change requires afterStatus."),
        before: assertPresent(change.beforeStatus, "Status audit change requires beforeStatus."),
        kind: GROUP_ITEM_AUDIT_CHANGE_KIND.STATUS,
      };
    case GROUP_ITEM_AUDIT_CHANGE_KIND.ASSIGNEES:
      return {
        after: change.afterAssigneeIds.map((value) => createUserId(value)),
        before: change.beforeAssigneeIds.map((value) => createUserId(value)),
        kind: GROUP_ITEM_AUDIT_CHANGE_KIND.ASSIGNEES,
      };
    case GROUP_ITEM_AUDIT_CHANGE_KIND.PRIORITY:
      return {
        after: assertPresent(change.afterPriority, "Priority audit change requires afterPriority."),
        before: assertPresent(change.beforePriority, "Priority audit change requires beforePriority."),
        kind: GROUP_ITEM_AUDIT_CHANGE_KIND.PRIORITY,
      };
    case GROUP_ITEM_AUDIT_CHANGE_KIND.LABELS:
      return {
        after: change.afterLabelValues,
        before: change.beforeLabelValues,
        kind: GROUP_ITEM_AUDIT_CHANGE_KIND.LABELS,
      };
    case GROUP_ITEM_AUDIT_CHANGE_KIND.DATES:
      return {
        after: {
          dueAt: change.afterDueAt,
          endAt: change.afterEndAt,
          startAt: change.afterStartAt,
          temporalKind: assertPresent(change.afterTemporalKind, "Dates audit change requires afterTemporalKind."),
        },
        before: {
          dueAt: change.beforeDueAt,
          endAt: change.beforeEndAt,
          startAt: change.beforeStartAt,
          temporalKind: assertPresent(change.beforeTemporalKind, "Dates audit change requires beforeTemporalKind."),
        },
        kind: GROUP_ITEM_AUDIT_CHANGE_KIND.DATES,
      };
    case GROUP_ITEM_AUDIT_CHANGE_KIND.TITLE:
      return {
        after: assertPresent(change.afterTitle, "Title audit change requires afterTitle."),
        before: assertPresent(change.beforeTitle, "Title audit change requires beforeTitle."),
        kind: GROUP_ITEM_AUDIT_CHANGE_KIND.TITLE,
      };
    case GROUP_ITEM_AUDIT_CHANGE_KIND.COMPLETION:
      return {
        after: {
          completedAt: change.afterCompletedAt,
          isCompleted: assertPresentBoolean(
            change.afterIsCompleted,
            "Completion audit change requires afterIsCompleted.",
          ),
        },
        before: {
          completedAt: change.beforeCompletedAt,
          isCompleted: assertPresentBoolean(
            change.beforeIsCompleted,
            "Completion audit change requires beforeIsCompleted.",
          ),
        },
        kind: GROUP_ITEM_AUDIT_CHANGE_KIND.COMPLETION,
      };
    case GROUP_ITEM_AUDIT_CHANGE_KIND.CANCELLATION:
      return {
        after: {
          canceledAt: change.afterCanceledAt,
          isCanceled: assertPresentBoolean(
            change.afterIsCanceled,
            "Cancellation audit change requires afterIsCanceled.",
          ),
        },
        before: {
          canceledAt: change.beforeCanceledAt,
          isCanceled: assertPresentBoolean(
            change.beforeIsCanceled,
            "Cancellation audit change requires beforeIsCanceled.",
          ),
        },
        kind: GROUP_ITEM_AUDIT_CHANGE_KIND.CANCELLATION,
      };
  }
}

export function mapPrismaGroupAuditEntryAggregateToGroupItemAuditEntry(
  aggregate: PrismaGroupAuditEntryAggregate,
): GroupItemAuditEntry {
  return {
    actor: {
      actorId: createUserId(aggregate.actorUserId),
      displayName: aggregate.actorDisplayName ?? aggregate.actor.name,
      email: aggregate.actorEmail ?? aggregate.actor.email,
    },
    changedAt: aggregate.changedAt,
    changes: aggregate.changes.map((change) => mapPrismaGroupAuditChangeRowToChange(change)),
    groupId: createGroupId(aggregate.groupId),
    itemId: createItemId(aggregate.itemId),
    versionToken: createVersionToken(aggregate.versionToken),
  };
}
