/**
 * Command + Query handler factory — single DI injection point.
 *
 * In production: PrismaItemRepository (persistent PostgreSQL).
 * In development: InMemoryRuntimeStore (fast, seeded on first request).
 *
 * All handlers, actions, and routes are unaware of which store is active.
 */
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
import type { GroupItemAuditEntry } from '@/domain/history';
import { prismaItemRepository } from '@/infrastructure/prisma-item-repository';
import { runtimeStore } from '@/lib/runtime-store';
import { seedDevItems } from '@/dev-data/seed';

const IS_DEV = process.env.NODE_ENV !== 'production';

// In dev: use in-memory store (no DB needed, seeded on first request).
// In prod: use Prisma (persistent PostgreSQL).
const activeStore = IS_DEV ? runtimeStore : prismaItemRepository;

const groupItemAuditRecorder = new AppendOnlyGroupItemAuditRecorder(activeStore);

export const createItemHandler = new CreateItemCommandHandler(activeStore);
export const readItemByIdHandler = new ReadItemByIdCommandHandler(activeStore);
export const updateItemHandler = new UpdateItemCommandHandler(activeStore, groupItemAuditRecorder);

export const getMyViewHandler = new GetMyViewQueryHandler(activeStore);
export const getGroupViewHandler = new GetGroupViewQueryHandler(activeStore);
export const getCalendarViewHandler = new GetCalendarViewQueryHandler(activeStore);
export const getUndatedViewHandler = new GetUndatedViewQueryHandler(activeStore);
export const getAttentionViewHandler = new GetRequiresAttentionViewQueryHandler(activeStore);
export const getRequiresAttentionHandler = getAttentionViewHandler;

let seeded = false;

export async function ensureDevSeed(): Promise<void> {
  if (!IS_DEV || seeded) return;
  seeded = true;
  await seedDevItems(createItemHandler);
}

export async function findItemById(id: string): Promise<ItemOutput | null> {
  const record = await activeStore.findById(createItemId(id));
  return record ? toItemOutput(record) : null;
}

export async function removeItem(id: string): Promise<void> {
  await activeStore.remove(createItemId(id));
}

export async function getHistoryEntries(id: string): Promise<readonly GroupItemAuditEntry[]> {
  if (IS_DEV) {
    return runtimeStore.listHistoryEntries(id);
  }
  return prismaItemRepository.listHistoryEntries(id);
}

// Keep runtimeStore export for tests that access it directly
export { runtimeStore };
