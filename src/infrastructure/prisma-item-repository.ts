/**
 * PrismaItemRepository — production persistence layer.
 *
 * Implements:
 *   - ItemCommandRepository  (findById, save)
 *   - ItemViewQueryRepository (listProjectedItems, listAll)
 *   - AppendGroupItemAuditEntryRepository (append)
 *
 * Temporal and lifecycle fields are stored as JSON (discriminated unions).
 * Dates inside JSON are ISO strings on the wire — hydrated back to Date objects on read.
 */
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { type AppendGroupItemAuditEntryRepository } from '@/application/history';
import {
  toItemOutput,
  type ItemCommandRepository,
  type ItemRecord,
} from '@/application/commands';
import {
  projectItemQueryFacts,
  type AttentionThresholds,
} from '@/application/queries/projectors';
import {
  type ItemViewQueryRepository,
  type ItemViewRecord,
} from '@/application/queries/views';
import { type GroupItemAuditEntry } from '@/domain/history';
import {
  createEventItem,
  createTaskItem,
  type EventLifecycle,
  type EventTemporal,
  type TaskLifecycle,
  type TaskTemporal,
} from '@/domain/item';
import {
  EVENT_STATUS,
  TASK_STATUS,
  createEventCanceledLifecycle,
  createEventCompletedLifecycle,
  createEventScheduledLifecycle,
  createTaskBlockedLifecycle,
  createTaskCanceledLifecycle,
  createTaskDoneLifecycle,
  createTaskInProgressLifecycle,
  createTaskPendingLifecycle,
  createTaskPostponedLifecycle,
} from '@/domain/item/lifecycle';
import {
  EVENT_TEMPORAL_KIND,
  TASK_TEMPORAL_KIND,
  createEventStartAndEndTemporal,
  createEventStartTemporal,
  createTaskDueDateTemporal,
  createTaskStartAndDueTemporal,
  createTaskStartAndEndTemporal,
  createTaskStartDateTemporal,
  createTaskStartEndAndDueTemporal,
  createTaskUndatedTemporal,
} from '@/domain/item/temporal';
import {
  ITEM_TYPE,
  SPACE_TYPE,
  createGroupId,
  createItemId,
  createSpaceId,
  createUserId,
  type ItemId,
  type Priority,
  type SpaceType,
  type VersionToken,
} from '@/domain/shared';
import { getItemStatus } from '@/domain/item/item';

// ── Thresholds for attention projector ──────────────────────────────────────

const ATTENTION_THRESHOLDS: AttentionThresholds = {
  openItemDays: 7,
  postponeCount: 3,
};

// ── Prisma result type ───────────────────────────────────────────────────────

type PrismaItemRow = Prisma.ItemGetPayload<{
  include: { assignees: true; labels: true };
}>;

// ── JSON hydrators (ISO string → Date) ──────────────────────────────────────

function hydrateTaskTemporal(json: unknown): TaskTemporal {
  const raw = json as Record<string, unknown>;
  switch (raw['kind']) {
    case TASK_TEMPORAL_KIND.UNDATED:
      return createTaskUndatedTemporal();
    case TASK_TEMPORAL_KIND.DUE_DATE:
      return createTaskDueDateTemporal(new Date(raw['dueAt'] as string));
    case TASK_TEMPORAL_KIND.START_DATE:
      return createTaskStartDateTemporal(new Date(raw['startAt'] as string));
    case TASK_TEMPORAL_KIND.START_AND_END:
      return createTaskStartAndEndTemporal(
        new Date(raw['startAt'] as string),
        new Date(raw['endAt'] as string),
      );
    case TASK_TEMPORAL_KIND.START_AND_DUE:
      return createTaskStartAndDueTemporal(
        new Date(raw['startAt'] as string),
        new Date(raw['dueAt'] as string),
      );
    case TASK_TEMPORAL_KIND.START_END_AND_DUE:
      return createTaskStartEndAndDueTemporal(
        new Date(raw['startAt'] as string),
        new Date(raw['endAt'] as string),
        new Date(raw['dueAt'] as string),
      );
    default:
      throw new Error(`Unknown task temporal kind: ${String(raw['kind'])}`);
  }
}

function hydrateEventTemporal(json: unknown): EventTemporal {
  const raw = json as Record<string, unknown>;
  switch (raw['kind']) {
    case EVENT_TEMPORAL_KIND.START:
      return createEventStartTemporal(new Date(raw['startAt'] as string));
    case EVENT_TEMPORAL_KIND.START_AND_END:
      return createEventStartAndEndTemporal(
        new Date(raw['startAt'] as string),
        new Date(raw['endAt'] as string),
      );
    default:
      throw new Error(`Unknown event temporal kind: ${String(raw['kind'])}`);
  }
}

function hydrateTaskLifecycle(json: unknown): TaskLifecycle {
  const raw = json as Record<string, unknown>;
  switch (raw['status']) {
    case TASK_STATUS.PENDING:
      return createTaskPendingLifecycle();
    case TASK_STATUS.IN_PROGRESS:
      return createTaskInProgressLifecycle();
    case TASK_STATUS.BLOCKED:
      return createTaskBlockedLifecycle();
    case TASK_STATUS.POSTPONED:
      return createTaskPostponedLifecycle(new Date(raw['postponedUntil'] as string));
    case TASK_STATUS.DONE:
      return createTaskDoneLifecycle(new Date(raw['completedAt'] as string));
    case TASK_STATUS.CANCELED:
      return createTaskCanceledLifecycle(new Date(raw['canceledAt'] as string));
    default:
      throw new Error(`Unknown task status: ${String(raw['status'])}`);
  }
}

function hydrateEventLifecycle(json: unknown): EventLifecycle {
  const raw = json as Record<string, unknown>;
  switch (raw['status']) {
    case EVENT_STATUS.SCHEDULED:
      return createEventScheduledLifecycle();
    case EVENT_STATUS.COMPLETED:
      return createEventCompletedLifecycle(new Date(raw['completedAt'] as string));
    case EVENT_STATUS.CANCELED:
      return createEventCanceledLifecycle(new Date(raw['canceledAt'] as string));
    default:
      throw new Error(`Unknown event status: ${String(raw['status'])}`);
  }
}

// ── Row → Domain reconstruction ──────────────────────────────────────────────

function rowToItemRecord(row: PrismaItemRow): ItemRecord {
  const baseInput = {
    id: createItemId(row.id),
    title: row.title,
    notes: row.notes,
    spaceId: createSpaceId(row.spaceId),
    spaceType: row.spaceType as SpaceType,
    priority: row.priority as Priority,
    postponeCount: row.postponeCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    versionToken: row.versionToken as unknown as VersionToken,
  };

  const assigneeIds = row.assignees.map((a) => createUserId(a.userId));
  const labels = row.labels.map((l) => ({ value: l.value }));

  if (row.itemType === ITEM_TYPE.TASK) {
    const item = createTaskItem({
      ...baseInput,
      itemType: ITEM_TYPE.TASK,
      temporal: hydrateTaskTemporal(row.temporal),
      lifecycle: hydrateTaskLifecycle(row.lifecycle),
      postponeCount: row.postponeCount,
    });

    if (row.ownerId) {
      return {
        item,
        assigneeIds,
        labels,
        ownerId: createUserId(row.ownerId),
        groupId: null,
        spaceType: SPACE_TYPE.PERSONAL,
      };
    }

    return {
      item,
      assigneeIds,
      labels,
      ownerId: null,
      groupId: createGroupId(row.groupId!),
      spaceType: SPACE_TYPE.GROUP,
    };
  }

  // EVENT
  const item = createEventItem({
    ...baseInput,
    itemType: ITEM_TYPE.EVENT,
    temporal: hydrateEventTemporal(row.temporal),
    lifecycle: hydrateEventLifecycle(row.lifecycle),
  });

  if (row.ownerId) {
    return {
      item,
      assigneeIds,
      labels,
      ownerId: createUserId(row.ownerId),
      groupId: null,
      spaceType: SPACE_TYPE.PERSONAL,
    };
  }

  return {
    item,
    assigneeIds,
    labels,
    ownerId: null,
    groupId: createGroupId(row.groupId!),
    spaceType: SPACE_TYPE.GROUP,
  };
}

// ── Repository ────────────────────────────────────────────────────────────────

export class PrismaItemRepository
  implements
    ItemCommandRepository,
    ItemViewQueryRepository,
    AppendGroupItemAuditEntryRepository
{
  // ── ItemCommandRepository ──────────────────────────────────────────────────

  async findById(itemId: ItemId): Promise<ItemRecord | null> {
    const row = await prisma.item.findUnique({
      where: { id: itemId },
      include: { assignees: true, labels: true },
    });
    return row ? rowToItemRecord(row) : null;
  }

  async save(record: ItemRecord): Promise<void> {
    const item = record.item;
    const temporal = item.itemType === ITEM_TYPE.TASK ? item.temporal : item.temporal;
    const lifecycle = item.itemType === ITEM_TYPE.TASK ? item.lifecycle : item.lifecycle;

    const data = {
      title: item.title,
      notes: item.notes,
      spaceId: item.spaceId as string,
      spaceType: record.spaceType as string,
      ownerId: (record.ownerId ?? null) as string | null,
      groupId: (record.groupId ?? null) as string | null,
      itemType: item.itemType as string,
      priority: item.priority as string,
      status: getItemStatus(item),
      postponeCount: item.postponeCount,
      versionToken: item.versionToken as unknown as string,
      temporal: temporal as unknown as Prisma.InputJsonValue,
      lifecycle: lifecycle as unknown as Prisma.InputJsonValue,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };

    await prisma.$transaction([
      prisma.item.upsert({
        where: { id: item.id },
        create: { id: item.id, ...data },
        update: data,
      }),
      prisma.itemAssignee.deleteMany({ where: { itemId: item.id } }),
      ...(record.assigneeIds.length > 0
        ? [
            prisma.itemAssignee.createMany({
              data: record.assigneeIds.map((userId) => ({ itemId: item.id, userId })),
              skipDuplicates: true,
            }),
          ]
        : []),
      prisma.itemLabel.deleteMany({ where: { itemId: item.id } }),
      ...(record.labels.length > 0
        ? [
            prisma.itemLabel.createMany({
              data: record.labels.map((label) => ({ itemId: item.id, value: label.value })),
              skipDuplicates: true,
            }),
          ]
        : []),
    ]);
  }

  // ── ItemViewQueryRepository ────────────────────────────────────────────────

  async listAll(): Promise<readonly ItemRecord[]> {
    const rows = await prisma.item.findMany({
      include: { assignees: true, labels: true },
    });
    return rows.map(rowToItemRecord);
  }

  async listProjectedItems(): Promise<readonly ItemViewRecord[]> {
    const records = await this.listAll();
    const referenceDate = new Date();

    return records.map((record) => ({
      item: toItemOutput(record),
      projection: projectItemQueryFacts({
        record,
        referenceDate,
        thresholds: ATTENTION_THRESHOLDS,
      }),
    }));
  }

  // ── AppendGroupItemAuditEntryRepository ────────────────────────────────────

  async append(entry: GroupItemAuditEntry): Promise<void> {
    await prisma.groupAuditEntry.create({
      data: {
        itemId: entry.itemId,
        groupId: entry.groupId,
        actorId: entry.actor.actorId,
        actorName: entry.actor.displayName,
        actorEmail: entry.actor.email,
        changes: entry.changes as unknown as Prisma.InputJsonValue,
        versionToken: entry.versionToken as unknown as string,
        changedAt: entry.changedAt,
      },
    });
  }

  // ── Extra: async history entries (used by api-runtime via item-command-factory) ──

  async listHistoryEntries(itemId: string): Promise<readonly GroupItemAuditEntry[]> {
    const rows = await prisma.groupAuditEntry.findMany({
      where: { itemId },
      orderBy: { changedAt: 'asc' },
    });

    return rows.map((row) => ({
      actor: {
        actorId: createUserId(row.actorId),
        displayName: row.actorName,
        email: row.actorEmail,
      },
      changedAt: row.changedAt,
      changes: row.changes as unknown as GroupItemAuditEntry['changes'],
      groupId: createGroupId(row.groupId),
      itemId: createItemId(row.itemId),
      versionToken: row.versionToken as unknown as VersionToken,
    }));
  }

  async remove(itemId: ItemId): Promise<void> {
    await prisma.item.delete({ where: { id: itemId } });
  }
}

export const prismaItemRepository = new PrismaItemRepository();
