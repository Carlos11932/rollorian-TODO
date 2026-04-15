/**
 * Command + Query handler factory — single DI injection point.
 *
 * Current: in-memory runtime store (dev stub, no cross-request persistence).
 * Next step: replace with Prisma-backed repositories when the persistence slice lands.
 * That swap happens ONLY here — command handlers, actions, and routes stay untouched.
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
import { seedDevItems } from '@/dev-data/seed';
import { runtimeStore } from '@/lib/runtime-store';

const groupItemAuditRecorder = new AppendOnlyGroupItemAuditRecorder(runtimeStore);

export const createItemHandler = new CreateItemCommandHandler(runtimeStore);
export const readItemByIdHandler = new ReadItemByIdCommandHandler(runtimeStore);
export const updateItemHandler = new UpdateItemCommandHandler(runtimeStore, groupItemAuditRecorder);

export const getMyViewHandler = new GetMyViewQueryHandler(runtimeStore);
export const getGroupViewHandler = new GetGroupViewQueryHandler(runtimeStore);
export const getCalendarViewHandler = new GetCalendarViewQueryHandler(runtimeStore);
export const getUndatedViewHandler = new GetUndatedViewQueryHandler(runtimeStore);
export const getAttentionViewHandler = new GetRequiresAttentionViewQueryHandler(runtimeStore);
export const getRequiresAttentionHandler = getAttentionViewHandler;

const IS_DEV = process.env.NODE_ENV !== 'production';
let seeded = false;

export async function ensureDevSeed(): Promise<void> {
  if (!IS_DEV || seeded) return;
  seeded = true;
  await seedDevItems(createItemHandler);
}

export async function findItemById(id: string): Promise<ItemOutput | null> {
  const record = await runtimeStore.findById(createItemId(id));
  return record ? toItemOutput(record) : null;
}

export async function removeItem(id: string): Promise<void> {
  await runtimeStore.remove(createItemId(id));
}

export { runtimeStore };
