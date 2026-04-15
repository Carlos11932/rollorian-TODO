import type { Prisma, PrismaClient } from "@prisma/client";

import type { GroupItemRecord, PersonalItemRecord } from "@/application/commands/shared";
import {
  createTaskItem,
  createTaskPendingLifecycle,
  createTaskUndatedTemporal,
  createItemLabel,
} from "@/domain/item";
import {
  createGroupId,
  createItemId,
  createSpaceId,
  createUserId,
  createVersionToken,
  ITEM_TYPE,
  PRIORITY,
  SPACE_TYPE,
} from "@/domain/shared";
import {
  PrismaItemCommandRepository,
  PrismaItemCommandRepositoryValidationError,
  PrismaItemVersionConflictError,
  type PrismaItemAggregate,
} from "@/interfaces/persistence/prisma";
import { describe, expect, it, vi } from "vitest";

type MockBatchPayload = Prisma.BatchPayload;

function createBatchPayload(count: number): MockBatchPayload {
  return { count };
}

function createMockClient() {
  const tx = {
    item: {
      create: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    itemAssignee: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    itemLabel: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    label: {
      upsert: vi.fn(),
    },
    membership: {
      findMany: vi.fn(),
    },
  };

  const client = {
    ...tx,
    $transaction: vi.fn(async (callback: (transaction: typeof tx) => Promise<void>) => callback(tx)),
  };

  return { client, tx };
}

function createGroupTaskRecord(
  overrides: Partial<GroupItemRecord> = {},
): GroupItemRecord {
  return {
    assigneeIds: [createUserId("user-2")],
    groupId: createGroupId("group-1"),
    item: createTaskItem({
      createdAt: new Date("2026-04-15T09:00:00.000Z"),
      id: createItemId("item-1"),
      itemType: ITEM_TYPE.TASK,
      lifecycle: createTaskPendingLifecycle(),
      notes: "Persist group repository behavior",
      priority: PRIORITY.HIGH,
      spaceId: createSpaceId("space-1"),
      spaceType: SPACE_TYPE.GROUP,
      temporal: createTaskUndatedTemporal(),
      title: "Persist repository item",
      updatedAt: new Date("2026-04-15T10:00:00.000Z"),
      versionToken: createVersionToken(0),
    }),
    labels: [createItemLabel("Finance"), createItemLabel("Ops")],
    ownerId: null,
    spaceType: SPACE_TYPE.GROUP,
    ...overrides,
  };
}

function createPersonalTaskRecord(
  overrides: Partial<PersonalItemRecord> = {},
): PersonalItemRecord {
  return {
    assigneeIds: [createUserId("user-1")],
    groupId: null,
    item: createTaskItem({
      createdAt: new Date("2026-04-15T09:00:00.000Z"),
      id: createItemId("item-1"),
      itemType: ITEM_TYPE.TASK,
      lifecycle: createTaskPendingLifecycle(),
      notes: "Persist personal repository behavior",
      priority: PRIORITY.MEDIUM,
      spaceId: createSpaceId("space-1"),
      spaceType: SPACE_TYPE.PERSONAL,
      temporal: createTaskUndatedTemporal(),
      title: "Persist personal item",
      updatedAt: new Date("2026-04-15T10:00:00.000Z"),
      versionToken: createVersionToken(0),
    }),
    labels: [createItemLabel("Focus")],
    ownerId: createUserId("user-1"),
    spaceType: SPACE_TYPE.PERSONAL,
    ...overrides,
  };
}

function createItemAggregate(): PrismaItemAggregate {
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
    dueAt: null,
    endAt: null,
    groupId: "group-1",
    id: "item-1",
    itemType: "task",
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
          value: "finance",
        },
        labelId: "label-1",
      },
    ],
    notes: "Persist group repository behavior",
    ownerId: null,
    postponedUntil: null,
    postponeCount: 0,
    priority: PRIORITY.HIGH,
    spaceId: "space-1",
    spaceType: SPACE_TYPE.GROUP,
    startAt: null,
    status: "pending",
    temporalKind: "undated",
    title: "Persist repository item",
    updatedAt: new Date("2026-04-15T10:00:00.000Z"),
    versionToken: 2,
  };
}

describe("PrismaItemCommandRepository", () => {
  it("maps persisted aggregates from findById", async () => {
    const { client } = createMockClient();
    const repository = new PrismaItemCommandRepository(client as unknown as PrismaClient);

    client.item.findUnique.mockResolvedValue(createItemAggregate());

    const result = await repository.findById(createItemId("item-1"));

    expect(client.item.findUnique).toHaveBeenCalledTimes(1);
    expect(client.item.findUnique.mock.calls[0]?.[0]?.where).toEqual({ id: "item-1" });
    expect(result?.groupId).toBe("group-1");
    expect(result?.labels).toEqual([{ value: "finance" }]);
    expect(result?.item.versionToken).toBe(2);
  });

  it("persists group items with active-membership assignees and scoped label reuse", async () => {
    const { client, tx } = createMockClient();
    const repository = new PrismaItemCommandRepository(client as unknown as PrismaClient);
    const record = createGroupTaskRecord();

    tx.item.findUnique.mockResolvedValueOnce(null);
    tx.membership.findMany.mockResolvedValue([{ id: "membership-1", userId: "user-2" }]);
    tx.label.upsert
      .mockResolvedValueOnce({ id: "label-1", value: "finance" })
      .mockResolvedValueOnce({ id: "label-2", value: "ops" });
    tx.item.create.mockResolvedValue({ id: record.item.id });
    tx.itemAssignee.deleteMany.mockResolvedValue(createBatchPayload(0));
    tx.itemAssignee.createMany.mockResolvedValue(createBatchPayload(1));
    tx.itemLabel.deleteMany.mockResolvedValue(createBatchPayload(0));
    tx.itemLabel.createMany.mockResolvedValue(createBatchPayload(2));

    await repository.save(record);

    expect(tx.membership.findMany).toHaveBeenCalledWith({
      select: { id: true, userId: true },
      where: {
        groupId: "group-1",
        isActive: true,
        userId: { in: ["user-2"] },
      },
    });
    expect(tx.label.upsert).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { groupId_value: { groupId: "group-1", value: "finance" } },
      }),
    );
    expect(tx.item.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          groupId: "group-1",
          ownerId: null,
          versionToken: 0,
        }),
      }),
    );
    expect(tx.itemAssignee.createMany).toHaveBeenCalledWith({
      data: [{ itemId: "item-1", membershipId: "membership-1", userId: "user-2" }],
    });
    expect(tx.itemLabel.createMany).toHaveBeenCalledWith({
      data: [
        { itemId: "item-1", labelId: "label-1" },
        { itemId: "item-1", labelId: "label-2" },
      ],
    });
  });

  it("rejects group assignees without an active membership", async () => {
    const { client, tx } = createMockClient();
    const repository = new PrismaItemCommandRepository(client as unknown as PrismaClient);

    tx.membership.findMany.mockResolvedValue([]);

    await expect(repository.save(createGroupTaskRecord())).rejects.toBeInstanceOf(
      PrismaItemCommandRepositoryValidationError,
    );
    expect(tx.item.create).not.toHaveBeenCalled();
  });

  it("enforces optimistic concurrency for shared item updates", async () => {
    const { client, tx } = createMockClient();
    const repository = new PrismaItemCommandRepository(client as unknown as PrismaClient);
    const record = createGroupTaskRecord({
      assigneeIds: [],
      item: createTaskItem({
        createdAt: new Date("2026-04-15T09:00:00.000Z"),
        id: createItemId("item-1"),
        itemType: ITEM_TYPE.TASK,
        lifecycle: createTaskPendingLifecycle(),
        priority: PRIORITY.HIGH,
        spaceId: createSpaceId("space-1"),
        spaceType: SPACE_TYPE.GROUP,
        temporal: createTaskUndatedTemporal(),
        title: "Persist repository item",
        updatedAt: new Date("2026-04-15T10:30:00.000Z"),
        versionToken: createVersionToken(4),
      }),
      labels: [],
    });

    tx.item.findUnique.mockResolvedValueOnce({
      groupId: "group-1",
      id: "item-1",
      ownerId: null,
      spaceId: "space-1",
      spaceType: SPACE_TYPE.GROUP,
      versionToken: 4,
    });
    tx.item.updateMany.mockResolvedValue(createBatchPayload(0));
    tx.itemAssignee.deleteMany.mockResolvedValue(createBatchPayload(0));
    tx.itemLabel.deleteMany.mockResolvedValue(createBatchPayload(0));

    await expect(repository.save(record)).rejects.toEqual(
      expect.objectContaining<Partial<PrismaItemVersionConflictError>>({
        actualVersionToken: createVersionToken(4),
        expectedVersionToken: createVersionToken(3),
      }),
    );
    expect(tx.item.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "item-1", versionToken: 3 },
      }),
    );
  });

  it("limits personal assignees to the owner and reuses personal label scope", async () => {
    const { client, tx } = createMockClient();
    const repository = new PrismaItemCommandRepository(client as unknown as PrismaClient);
    const record = createPersonalTaskRecord();

    tx.item.findUnique.mockResolvedValueOnce(null);
    tx.label.upsert.mockResolvedValueOnce({ id: "label-1", value: "focus" });
    tx.item.create.mockResolvedValue({ id: record.item.id });
    tx.itemAssignee.deleteMany.mockResolvedValue(createBatchPayload(0));
    tx.itemAssignee.createMany.mockResolvedValue(createBatchPayload(1));
    tx.itemLabel.deleteMany.mockResolvedValue(createBatchPayload(0));
    tx.itemLabel.createMany.mockResolvedValue(createBatchPayload(1));

    await repository.save(record);

    expect(tx.membership.findMany).not.toHaveBeenCalled();
    expect(tx.label.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ownerId_value: { ownerId: "user-1", value: "focus" } },
      }),
    );
    expect(tx.itemAssignee.createMany).toHaveBeenCalledWith({
      data: [{ itemId: "item-1", membershipId: null, userId: "user-1" }],
    });

    await expect(
      repository.save(
        createPersonalTaskRecord({ assigneeIds: [createUserId("user-2")] }),
      ),
    ).rejects.toBeInstanceOf(PrismaItemCommandRepositoryValidationError);
  });
});
