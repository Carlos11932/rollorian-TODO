import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockPrismaClient,
  seedDevItemsMock,
} = vi.hoisted(() => ({
  mockPrismaClient: {
    $transaction: vi.fn(),
    group: {
      findUnique: vi.fn(),
    },
    groupAuditEntry: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    item: {
      deleteMany: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
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
    user: {
      findUnique: vi.fn(),
    },
  },
  seedDevItemsMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrismaClient,
}));

vi.mock("@/dev-data/seed", () => ({
  seedDevItems: seedDevItemsMock,
}));

import * as itemCommandFactory from "@/lib/item-command-factory";
import {
  createItemHandler,
  createProductionItemRuntime,
  ensureDevSeed,
  findItemById,
  prismaGroupItemHistoryRepository,
  prismaItemCommandRepository,
  prismaItemViewRepository,
  prismaMembershipResolver,
  removeItem,
} from "@/lib/item-command-factory";
import {
  PrismaGroupItemHistoryRepository,
  PrismaItemCommandRepository,
  PrismaItemViewRepository,
  PrismaMembershipResolver,
} from "@/interfaces/persistence/prisma";

describe("item-command-factory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("wires Prisma adapters as the default production runtime", () => {
    const runtime = createProductionItemRuntime(
      mockPrismaClient as unknown as Parameters<typeof createProductionItemRuntime>[0],
    );

    expect(runtime.commandRepository).toBeInstanceOf(PrismaItemCommandRepository);
    expect(runtime.viewRepository).toBeInstanceOf(PrismaItemViewRepository);
    expect(runtime.historyRepository).toBeInstanceOf(PrismaGroupItemHistoryRepository);
    expect(runtime.membershipResolver).toBeInstanceOf(PrismaMembershipResolver);

    expect(prismaItemCommandRepository).toBeInstanceOf(PrismaItemCommandRepository);
    expect(prismaItemViewRepository).toBeInstanceOf(PrismaItemViewRepository);
    expect(prismaGroupItemHistoryRepository).toBeInstanceOf(PrismaGroupItemHistoryRepository);
    expect(prismaMembershipResolver).toBeInstanceOf(PrismaMembershipResolver);
  });

  it("uses Prisma-backed reads instead of the legacy runtime store", async () => {
    mockPrismaClient.item.findUnique.mockResolvedValue(null);

    await findItemById("item-123");

    expect(mockPrismaClient.item.findUnique).toHaveBeenCalledOnce();
  });

  it("uses Prisma-backed deletes instead of the legacy runtime store", async () => {
    mockPrismaClient.item.deleteMany.mockResolvedValue({ count: 1 });

    await removeItem("item-456");

    expect(mockPrismaClient.item.deleteMany).toHaveBeenCalledWith({
      where: { id: "item-456" },
    });
  });

  it("does not expose the in-memory runtime store from production wiring", () => {
    expect("runtimeStore" in itemCommandFactory).toBe(false);
  });

  it("seeds through the production create handler only once", async () => {
    await ensureDevSeed();
    await ensureDevSeed();

    expect(seedDevItemsMock).toHaveBeenCalledTimes(1);
    expect(seedDevItemsMock).toHaveBeenCalledWith(createItemHandler);
  });
});
