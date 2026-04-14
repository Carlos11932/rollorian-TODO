/**
 * Command handler factory — single DI injection point.
 *
 * Current: InMemoryItemRepository (dev stub, no cross-request persistence).
 * Next step: replace with PrismaItemRepository when the schema lands.
 * That swap happens ONLY here — command handlers, actions, and routes stay untouched.
 */
import {
  AppendOnlyGroupItemAuditRecorder,
  CreateItemCommandHandler,
  ReadItemByIdCommandHandler,
  UpdateItemCommandHandler,
} from '@/application/commands';
import {
  GetCalendarViewQueryHandler,
  GetGroupViewQueryHandler,
  GetMyViewQueryHandler,
  GetRequiresAttentionViewQueryHandler,
  GetUndatedViewQueryHandler,
} from '@/application/queries/views';
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

export { runtimeStore };
