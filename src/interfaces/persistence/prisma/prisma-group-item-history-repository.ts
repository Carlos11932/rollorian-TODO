import type { ItemStatus, ItemTemporalKind, Prisma, PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

import type { AppendGroupItemAuditEntryRepository } from "@/application/history";
import {
  GROUP_ITEM_AUDIT_CHANGE_KIND,
  type GroupItemAuditChange,
  type GroupItemAuditEntry,
} from "@/domain/history";
import type { ItemId } from "@/domain/shared";

import { mapPrismaGroupAuditEntryAggregateToGroupItemAuditEntry } from "./group-item-audit-entry-mapper";
import {
  PRISMA_GROUP_AUDIT_ENTRY_ORDER_BY,
  prismaGroupAuditEntryAggregateArgs,
} from "./runtime-aggregates";

type PrismaGroupItemHistoryRepositoryClient = Pick<
  PrismaClient,
  "groupAuditEntry"
>;

type PersistedGroupAuditChangeCreateInput =
  Prisma.GroupAuditChangeUncheckedCreateWithoutEntryInput;

export class PrismaGroupItemHistoryRepository
  implements AppendGroupItemAuditEntryRepository
{
  public constructor(
    private readonly client: PrismaGroupItemHistoryRepositoryClient,
  ) {}

  public async append(entry: GroupItemAuditEntry): Promise<void> {
    await this.client.groupAuditEntry.create({
      data: {
        actorDisplayName: entry.actor.displayName,
        actorEmail: entry.actor.email,
        actorUserId: entry.actor.actorId,
        changedAt: entry.changedAt,
        changes: {
          create: entry.changes.map((change, position) =>
            mapGroupItemAuditChangeToPersistedInput(change, position),
          ),
        },
        groupId: entry.groupId,
        id: `audit-entry-${randomUUID()}`,
        itemId: entry.itemId,
        versionToken: entry.versionToken,
      },
    });
  }

  public async listByItemId(itemId: ItemId): Promise<readonly GroupItemAuditEntry[]> {
    const entries = await this.client.groupAuditEntry.findMany({
      ...prismaGroupAuditEntryAggregateArgs,
      orderBy: PRISMA_GROUP_AUDIT_ENTRY_ORDER_BY,
      where: {
        itemId,
      },
    });

    return entries.map((entry) => mapPrismaGroupAuditEntryAggregateToGroupItemAuditEntry(entry));
  }
}

function mapGroupItemAuditChangeToPersistedInput(
  change: GroupItemAuditChange,
  position: number,
): PersistedGroupAuditChangeCreateInput {
  switch (change.kind) {
    case GROUP_ITEM_AUDIT_CHANGE_KIND.STATUS:
      return {
        afterStatus: change.after as ItemStatus,
        beforeStatus: change.before as ItemStatus,
        kind: change.kind,
        position,
      };
    case GROUP_ITEM_AUDIT_CHANGE_KIND.ASSIGNEES:
      return {
        afterAssigneeIds: [...change.after],
        beforeAssigneeIds: [...change.before],
        kind: change.kind,
        position,
      };
    case GROUP_ITEM_AUDIT_CHANGE_KIND.PRIORITY:
      return {
        afterPriority: change.after,
        beforePriority: change.before,
        kind: change.kind,
        position,
      };
    case GROUP_ITEM_AUDIT_CHANGE_KIND.LABELS:
      return {
        afterLabelValues: [...change.after],
        beforeLabelValues: [...change.before],
        kind: change.kind,
        position,
      };
    case GROUP_ITEM_AUDIT_CHANGE_KIND.DATES:
      return {
        afterDueAt: change.after.dueAt,
        afterEndAt: change.after.endAt,
        afterStartAt: change.after.startAt,
        afterTemporalKind: change.after.temporalKind as ItemTemporalKind,
        beforeDueAt: change.before.dueAt,
        beforeEndAt: change.before.endAt,
        beforeStartAt: change.before.startAt,
        beforeTemporalKind: change.before.temporalKind as ItemTemporalKind,
        kind: change.kind,
        position,
      };
    case GROUP_ITEM_AUDIT_CHANGE_KIND.TITLE:
      return {
        afterTitle: change.after,
        beforeTitle: change.before,
        kind: change.kind,
        position,
      };
    case GROUP_ITEM_AUDIT_CHANGE_KIND.COMPLETION:
      return {
        afterCompletedAt: change.after.completedAt,
        afterIsCompleted: change.after.isCompleted,
        beforeCompletedAt: change.before.completedAt,
        beforeIsCompleted: change.before.isCompleted,
        kind: change.kind,
        position,
      };
    case GROUP_ITEM_AUDIT_CHANGE_KIND.CANCELLATION:
      return {
        afterCanceledAt: change.after.canceledAt,
        afterIsCanceled: change.after.isCanceled,
        beforeCanceledAt: change.before.canceledAt,
        beforeIsCanceled: change.before.isCanceled,
        kind: change.kind,
        position,
      };
  }
}
