/**
 * Command + Query handler factory — single DI injection point.
 *
 * Production runtime composes Prisma-backed repositories here.
 * The legacy in-memory runtime store stays exported only for test/fallback compatibility.
 */
import type { PrismaClient } from "@prisma/client";

import {
  AppendOnlyGroupItemAuditRecorder,
  CreateItemCommandHandler,
  ReadItemByIdCommandHandler,
  UpdateItemCommandHandler,
  toItemOutput,
  type ItemOutput,
} from "@/application/commands";
import type { GroupItemAuditEntry } from "@/domain/history";
import {
  GetCalendarViewQueryHandler,
  GetGroupViewQueryHandler,
  GetMyViewQueryHandler,
  GetRequiresAttentionViewQueryHandler,
  GetUndatedViewQueryHandler,
} from "@/application/queries/views";
import { createItemId } from "@/domain/shared";
import {
  PrismaGroupItemHistoryRepository,
  PrismaItemCommandRepository,
  PrismaItemViewRepository,
  PrismaMembershipResolver,
} from "@/interfaces/persistence/prisma";
import { prisma } from "@/lib/prisma";
import { runtimeStore } from "@/lib/runtime-store";
import { seedDevItems } from "@/dev-data/seed";

const IS_DEV = process.env.NODE_ENV !== "production";

type PrismaRuntimeClient = Pick<
  PrismaClient,
  | "$transaction"
  | "account"
  | "group"
  | "groupAuditEntry"
  | "item"
  | "itemAssignee"
  | "itemLabel"
  | "label"
  | "membership"
  | "session"
  | "user"
  | "verificationToken"
>;

export interface ProductionItemRuntime {
  commandRepository: PrismaItemCommandRepository;
  viewRepository: PrismaItemViewRepository;
  historyRepository: PrismaGroupItemHistoryRepository;
  membershipResolver: PrismaMembershipResolver;
  groupItemAuditRecorder: AppendOnlyGroupItemAuditRecorder;
  createItemHandler: CreateItemCommandHandler;
  readItemByIdHandler: ReadItemByIdCommandHandler;
  updateItemHandler: UpdateItemCommandHandler;
  getMyViewHandler: GetMyViewQueryHandler;
  getGroupViewHandler: GetGroupViewQueryHandler;
  getCalendarViewHandler: GetCalendarViewQueryHandler;
  getUndatedViewHandler: GetUndatedViewQueryHandler;
  getAttentionViewHandler: GetRequiresAttentionViewQueryHandler;
  findItemById(id: string): Promise<ItemOutput | null>;
  removeItem(id: string): Promise<void>;
  getHistoryEntries(id: string): Promise<readonly GroupItemAuditEntry[]>;
}

export function createProductionItemRuntime(
  client: PrismaRuntimeClient = prisma,
): ProductionItemRuntime {
  const commandRepository = new PrismaItemCommandRepository(client);
  const viewRepository = new PrismaItemViewRepository(client);
  const historyRepository = new PrismaGroupItemHistoryRepository(client);
  const membershipResolver = new PrismaMembershipResolver(client);
  const groupItemAuditRecorder = new AppendOnlyGroupItemAuditRecorder(historyRepository);

  return {
    commandRepository,
    viewRepository,
    historyRepository,
    membershipResolver,
    groupItemAuditRecorder,
    createItemHandler: new CreateItemCommandHandler(commandRepository),
    readItemByIdHandler: new ReadItemByIdCommandHandler(commandRepository),
    updateItemHandler: new UpdateItemCommandHandler(commandRepository, groupItemAuditRecorder),
    getMyViewHandler: new GetMyViewQueryHandler(viewRepository),
    getGroupViewHandler: new GetGroupViewQueryHandler(viewRepository),
    getCalendarViewHandler: new GetCalendarViewQueryHandler(viewRepository),
    getUndatedViewHandler: new GetUndatedViewQueryHandler(viewRepository),
    getAttentionViewHandler: new GetRequiresAttentionViewQueryHandler(viewRepository),
    async findItemById(id: string): Promise<ItemOutput | null> {
      const record = await commandRepository.findById(createItemId(id));

      return record ? toItemOutput(record) : null;
    },
    async removeItem(id: string): Promise<void> {
      await client.item.deleteMany({
        where: { id: createItemId(id) },
      });
    },
    async getHistoryEntries(id: string): Promise<readonly GroupItemAuditEntry[]> {
      return historyRepository.listByItemId(createItemId(id));
    },
  };
}

export const productionItemRuntime = createProductionItemRuntime();

export const {
  commandRepository: prismaItemCommandRepository,
  viewRepository: prismaItemViewRepository,
  historyRepository: prismaGroupItemHistoryRepository,
  membershipResolver: prismaMembershipResolver,
  groupItemAuditRecorder,
  createItemHandler,
  readItemByIdHandler,
  updateItemHandler,
  getMyViewHandler,
  getGroupViewHandler,
  getCalendarViewHandler,
  getUndatedViewHandler,
  getAttentionViewHandler,
} = productionItemRuntime;

export const getRequiresAttentionHandler = getAttentionViewHandler;

let seeded = false;

export async function ensureDevSeed(): Promise<void> {
  if (!IS_DEV || seeded) {
    return;
  }

  seeded = true;
  await seedDevItems(createItemHandler);
}

export async function findItemById(id: string): Promise<ItemOutput | null> {
  return productionItemRuntime.findItemById(id);
}

export async function removeItem(id: string): Promise<void> {
  await productionItemRuntime.removeItem(id);
}

export async function getHistoryEntries(id: string): Promise<readonly GroupItemAuditEntry[]> {
  return productionItemRuntime.getHistoryEntries(id);
}

// Legacy export kept for test/fallback compatibility only.
export { runtimeStore };
