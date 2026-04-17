import type { PrismaClient } from "@prisma/client";

import { GROUP_ITEM_AUDIT_CHANGE_KIND, type GroupItemAuditEntry } from "@/domain/history";
import { PRIORITY, createGroupId, createItemId, createUserId, createVersionToken } from "@/domain/shared";
import {
  PrismaGroupItemHistoryRepository,
  type PrismaGroupAuditEntryAggregate,
} from "@/interfaces/persistence/prisma";
import { describe, expect, it, vi } from "vitest";

function createMockClient() {
  return {
    groupAuditEntry: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  };
}

function createAuditEntry(
  overrides: Partial<GroupItemAuditEntry> = {},
): GroupItemAuditEntry {
  return {
    actor: {
      actorId: createUserId("user-1"),
      displayName: "Pat",
      email: "pat@example.com",
    },
    changedAt: new Date("2026-04-15T10:00:00.000Z"),
    changes: [
      {
        after: PRIORITY.URGENT,
        before: PRIORITY.MEDIUM,
        kind: GROUP_ITEM_AUDIT_CHANGE_KIND.PRIORITY,
      },
      {
        after: [createUserId("user-1"), createUserId("user-2")],
        before: [createUserId("user-1")],
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
    ],
    groupId: createGroupId("group-1"),
    itemId: createItemId("item-1"),
    versionToken: createVersionToken(4),
    ...overrides,
  };
}

function createAuditEntryAggregate(
  overrides: Partial<PrismaGroupAuditEntryAggregate> = {},
): PrismaGroupAuditEntryAggregate {
  return {
    actor: {
      name: "Fallback Name",
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
        afterCompletedAt: null,
        afterDueAt: null,
        afterEndAt: null,
        afterIsCanceled: null,
        afterIsCompleted: null,
        afterLabelValues: [],
        afterPriority: PRIORITY.URGENT,
        afterStartAt: null,
        afterStatus: null,
        afterTemporalKind: null,
        afterTitle: null,
        beforeAssigneeIds: [],
        beforeCanceledAt: null,
        beforeCompletedAt: null,
        beforeDueAt: null,
        beforeEndAt: null,
        beforeIsCanceled: null,
        beforeIsCompleted: null,
        beforeLabelValues: [],
        beforePriority: PRIORITY.MEDIUM,
        beforeStartAt: null,
        beforeStatus: null,
        beforeTemporalKind: null,
        beforeTitle: null,
        entryId: "entry-2",
        kind: GROUP_ITEM_AUDIT_CHANGE_KIND.PRIORITY,
        position: 0,
      },
      {
        afterAssigneeIds: ["user-1", "user-2"],
        afterCanceledAt: null,
        afterCompletedAt: null,
        afterDueAt: null,
        afterEndAt: null,
        afterIsCanceled: null,
        afterIsCompleted: null,
        afterLabelValues: [],
        afterPriority: null,
        afterStartAt: null,
        afterStatus: null,
        afterTemporalKind: null,
        afterTitle: null,
        beforeAssigneeIds: ["user-1"],
        beforeCanceledAt: null,
        beforeCompletedAt: null,
        beforeDueAt: null,
        beforeEndAt: null,
        beforeIsCanceled: null,
        beforeIsCompleted: null,
        beforeLabelValues: [],
        beforePriority: null,
        beforeStartAt: null,
        beforeStatus: null,
        beforeTemporalKind: null,
        beforeTitle: null,
        entryId: "entry-2",
        kind: GROUP_ITEM_AUDIT_CHANGE_KIND.ASSIGNEES,
        position: 1,
      },
    ],
    createdAt: new Date("2026-04-15T10:00:00.000Z"),
    groupId: "group-1",
    id: "entry-2",
    itemId: "item-1",
    versionToken: 4,
    ...overrides,
  };
}

describe("PrismaGroupItemHistoryRepository", () => {
  it("appends ordered audit changes with actor snapshot data", async () => {
    const client = createMockClient();
    const repository = new PrismaGroupItemHistoryRepository(client as unknown as PrismaClient);
    const entry = createAuditEntry();

    await repository.append(entry);

    expect(client.groupAuditEntry.create).toHaveBeenCalledTimes(1);
    expect(client.groupAuditEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorDisplayName: "Pat",
        actorEmail: "pat@example.com",
        actorUserId: "user-1",
        changedAt: new Date("2026-04-15T10:00:00.000Z"),
        groupId: "group-1",
        id: expect.stringMatching(/^audit-entry-/),
        itemId: "item-1",
        versionToken: 4,
        changes: {
          create: [
            {
              afterPriority: PRIORITY.URGENT,
              beforePriority: PRIORITY.MEDIUM,
              kind: GROUP_ITEM_AUDIT_CHANGE_KIND.PRIORITY,
              position: 0,
            },
            {
              afterAssigneeIds: ["user-1", "user-2"],
              beforeAssigneeIds: ["user-1"],
              kind: GROUP_ITEM_AUDIT_CHANGE_KIND.ASSIGNEES,
              position: 1,
            },
            {
              afterCompletedAt: new Date("2026-04-15T10:00:00.000Z"),
              afterIsCompleted: true,
              beforeCompletedAt: null,
              beforeIsCompleted: false,
              kind: GROUP_ITEM_AUDIT_CHANGE_KIND.COMPLETION,
              position: 2,
            },
          ],
        },
      }),
    });
  });

  it("lists persisted audit entries in repository order", async () => {
    const client = createMockClient();
    const repository = new PrismaGroupItemHistoryRepository(client as unknown as PrismaClient);

    client.groupAuditEntry.findMany.mockResolvedValue([
      createAuditEntryAggregate({
        changedAt: new Date("2026-04-15T09:00:00.000Z"),
        id: "entry-1",
        versionToken: 3,
      }),
      createAuditEntryAggregate(),
    ]);

    const entries = await repository.listByItemId(createItemId("item-1"));

    expect(client.groupAuditEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [
          { versionToken: "asc" },
          { changedAt: "asc" },
          { createdAt: "asc" },
          { id: "asc" },
        ],
        where: { itemId: "item-1" },
      }),
    );
    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual(
      expect.objectContaining({
        itemId: "item-1",
        versionToken: 3,
      }),
    );
    expect(entries[1]).toEqual(
      expect.objectContaining({
        actor: {
          actorId: "user-1",
          displayName: "Pat",
          email: "pat@example.com",
        },
        changes: [
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
        ],
        groupId: "group-1",
        itemId: "item-1",
        versionToken: 4,
      }),
    );
  });
});
