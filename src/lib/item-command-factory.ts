/**
 * Command + Query handler factory — single DI injection point.
 *
 * Production runtime now composes Prisma-backed repositories here.
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
} from '@/application/commands';
import {
  GetCalendarViewQueryHandler,
  GetGroupViewQueryHandler,
  GetMyViewQueryHandler,
  GetRequiresAttentionViewQueryHandler,
  GetUndatedViewQueryHandler,
} from '@/application/queries/views';
import { createItemId } from '@/domain/shared';
import {
  PrismaGroupItemHistoryRepository,
  PrismaItemCommandRepository,
  PrismaItemViewRepository,
  PrismaMembershipResolver,
} from '@/interfaces/persistence/prisma';
import { seedDevItems } from '@/lib/mock/seed';
import { prisma } from '@/lib/prisma';
import { runtimeStore } from '@/lib/runtime-store';

type PrismaRuntimeClient = Pick<
  PrismaClient,
  | "$transaction"
  | "group"
  | "groupAuditEntry"
  | "item"
  | "itemAssignee"
  | "itemLabel"
  | "label"
  | "membership"
  | "user"
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
  if (seeded) return;
  seeded = true;
  await seedDevItems(createItemHandler);
}

export async function findItemById(id: string): Promise<ItemOutput | null> {
  return productionItemRuntime.findItemById(id);
}

export async function removeItem(id: string): Promise<void> {
  await productionItemRuntime.removeItem(id);
}

// Legacy export kept for test/fallback compatibility only.
export { runtimeStore };
