import { GROUP_ITEM_AUDIT_CHANGE_KIND } from "@/domain/history";
import { TASK_STATUS, TASK_TEMPORAL_KIND } from "@/domain/item";
import { ITEM_TYPE, PRIORITY, SPACE_TYPE } from "@/domain/shared";
import {
  mapPrismaGroupAuditEntryAggregateToGroupItemAuditEntry,
  mapPrismaItemAggregateToItemRecord,
  mapPrismaItemAggregateToItemViewRecord,
  type PrismaGroupAuditEntryAggregate,
  type PrismaItemAggregate,
} from "@/interfaces/persistence/prisma";
import { describe, expect, it } from "vitest";

function createTaskAggregate(overrides: Partial<PrismaItemAggregate> = {}): PrismaItemAggregate {
  return {
    assignees: [
      {
        createdAt: new Date("2026-04-15T09:00:00.000Z"),
        itemId: "item-1",
        membership: {
          createdAt: new Date("2026-04-10T00:00:00.000Z"),
          groupId: "group-1",
          id: "membership-1",
          isActive: true,
          role: "member",
          updatedAt: new Date("2026-04-10T00:00:00.000Z"),
          userId: "user-2",
        },
        membershipId: "membership-1",
        user: {
          displayName: "Alex",
          email: "alex@example.com",
          id: "user-2",
        },
        userId: "user-2",
      },
    ],
    canceledAt: null,
    completedAt: null,
    createdAt: new Date("2026-04-15T08:00:00.000Z"),
    dueAt: new Date("2026-04-20T00:00:00.000Z"),
    endAt: null,
    groupId: "group-1",
    id: "item-1",
    itemType: ITEM_TYPE.TASK,
    labels: [
      {
        createdAt: new Date("2026-04-15T09:05:00.000Z"),
        itemId: "item-1",
        label: {
          createdAt: new Date("2026-04-15T09:00:00.000Z"),
          groupId: "group-1",
          id: "label-1",
          ownerId: null,
          updatedAt: new Date("2026-04-15T09:00:00.000Z"),
          value: "Finance",
        },
        labelId: "label-1",
      },
    ],
    notes: "  Track renewal  ",
    ownerId: null,
    postponedUntil: null,
    postponeCount: 0,
    priority: PRIORITY.HIGH,
    spaceId: "space-1",
    spaceType: SPACE_TYPE.GROUP,
    startAt: null,
    status: TASK_STATUS.PENDING,
    temporalKind: TASK_TEMPORAL_KIND.DUE_DATE,
    title: " Renew subscription ",
    updatedAt: new Date("2026-04-15T08:00:00.000Z"),
    versionToken: 3,
    ...overrides,
  };
}

function createAuditEntryAggregate(): PrismaGroupAuditEntryAggregate {
  return {
    actor: {
      displayName: "Fallback Name",
      email: "fallback@example.com",
      id: "user-1",
    },
    actorDisplayName: "Pat",
    actorEmail: "pat@example.com",
    actorUserId: "user-1",
    changedAt: new Date("2026-04-15T10:00:00.000Z"),
    changes: [
      {
        afterAssigneeIds: [],
        afterCanceledAt: null,
        afterIsCanceled: null,
        afterIsCompleted: null,
        afterCompletedAt: null,
        afterDueAt: null,
        afterEndAt: null,
        afterLabelValues: [],
        afterPriority: PRIORITY.URGENT,
        afterStartAt: null,
        afterStatus: null,
        afterTemporalKind: null,
        afterTitle: null,
        beforeAssigneeIds: [],
        beforeCanceledAt: null,
        beforeIsCanceled: null,
        beforeIsCompleted: null,
        beforeCompletedAt: null,
        beforeDueAt: null,
        beforeEndAt: null,
        beforeLabelValues: [],
        beforePriority: PRIORITY.MEDIUM,
        beforeStartAt: null,
        beforeStatus: null,
        beforeTemporalKind: null,
        beforeTitle: null,
        entryId: "entry-1",
        kind: GROUP_ITEM_AUDIT_CHANGE_KIND.PRIORITY,
        position: 0,
      },
      {
        afterAssigneeIds: ["user-1", "user-2"],
        afterCanceledAt: null,
        afterIsCanceled: null,
        afterIsCompleted: null,
        afterCompletedAt: null,
        afterDueAt: null,
        afterEndAt: null,
        afterLabelValues: [],
        afterPriority: null,
        afterStartAt: null,
        afterStatus: null,
        afterTemporalKind: null,
        afterTitle: null,
        beforeAssigneeIds: ["user-1"],
        beforeCanceledAt: null,
        beforeIsCanceled: null,
        beforeIsCompleted: null,
        beforeCompletedAt: null,
        beforeDueAt: null,
        beforeEndAt: null,
        beforeLabelValues: [],
        beforePriority: null,
        beforeStartAt: null,
        beforeStatus: null,
        beforeTemporalKind: null,
        beforeTitle: null,
        entryId: "entry-1",
        kind: GROUP_ITEM_AUDIT_CHANGE_KIND.ASSIGNEES,
        position: 1,
      },
      {
        afterAssigneeIds: [],
        afterCanceledAt: null,
        afterIsCanceled: null,
        afterIsCompleted: true,
        afterCompletedAt: new Date("2026-04-15T10:00:00.000Z"),
        afterDueAt: null,
        afterEndAt: null,
        afterLabelValues: [],
        afterPriority: null,
        afterStartAt: null,
        afterStatus: null,
        afterTemporalKind: null,
        afterTitle: null,
        beforeAssigneeIds: [],
        beforeCanceledAt: null,
        beforeIsCanceled: null,
        beforeIsCompleted: false,
        beforeCompletedAt: null,
        beforeDueAt: null,
        beforeEndAt: null,
        beforeLabelValues: [],
        beforePriority: null,
        beforeStartAt: null,
        beforeStatus: null,
        beforeTemporalKind: null,
        beforeTitle: null,
        entryId: "entry-1",
        kind: GROUP_ITEM_AUDIT_CHANGE_KIND.COMPLETION,
        position: 2,
      },
    ],
    createdAt: new Date("2026-04-15T10:00:00.000Z"),
    groupId: "group-1",
    id: "entry-1",
    itemId: "item-1",
    versionToken: 4,
  };
}

describe("Prisma runtime mappers", () => {
  it("maps Prisma item aggregates into item records and projected view records", () => {
    const aggregate = createTaskAggregate();

    const record = mapPrismaItemAggregateToItemRecord(aggregate);
    const viewRecord = mapPrismaItemAggregateToItemViewRecord({
      aggregate,
      referenceDate: new Date("2026-04-18T00:00:00.000Z"),
      thresholds: {
        openItemDays: 7,
        postponeCount: 3,
      },
    });

    expect(record.spaceType).toBe(SPACE_TYPE.GROUP);
    expect(record.groupId).toBe("group-1");
    expect(record.item.title).toBe("Renew subscription");
    expect(record.item.notes).toBe("Track renewal");
    expect(record.item.temporal.kind).toBe(TASK_TEMPORAL_KIND.DUE_DATE);
    expect(record.labels).toEqual([{ value: "finance" }]);
    expect(viewRecord.item.labels).toEqual([{ value: "finance" }]);
    expect(viewRecord.projection.assigneeSummary.assigneeIds).toEqual(["user-2"]);
    expect(viewRecord.projection.visibility.groupId).toBe("group-1");
  });

  it("rejects invalid nullable lifecycle state when reconstructing a task", () => {
    const aggregate = createTaskAggregate({
      completedAt: new Date("2026-04-15T12:00:00.000Z"),
      status: TASK_STATUS.PENDING,
    });

    expect(() => mapPrismaItemAggregateToItemRecord(aggregate)).toThrow(
      "Pending task cannot have completedAt.",
    );
  });

  it("maps persisted audit aggregates into domain audit entries", () => {
    const entry = mapPrismaGroupAuditEntryAggregateToGroupItemAuditEntry(
      createAuditEntryAggregate(),
    );

    expect(entry.actor).toEqual({
      actorId: "user-1",
      displayName: "Pat",
      email: "pat@example.com",
    });
    expect(entry.changes).toEqual([
      {
        after: PRIORITY.URGENT,
        before: PRIORITY.MEDIUM,
        kind: GROUP_ITEM_AUDIT_CHANGE_KIND.PRIORITY,
      },
      {
        after: ["user-1", "user-2"],
        before: ["user-1"],
        kind: GROUP_ITEM_AUDIT_CHANGE_KIND.ASSIGNEES,
      },
      {
        after: {
          completedAt: new Date("2026-04-15T10:00:00.000Z"),
          isCompleted: true,
        },
        before: {
          completedAt: null,
          isCompleted: false,
        },
        kind: GROUP_ITEM_AUDIT_CHANGE_KIND.COMPLETION,
      },
    ]);
  });
});
