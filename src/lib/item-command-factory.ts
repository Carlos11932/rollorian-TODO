/**
 * Command + Query handler factory — single DI injection point.
 *
 * Current: InMemoryItemRepository (dev stub, no cross-request persistence).
 * Next step: replace with PrismaItemRepository when the schema lands.
 * That swap happens ONLY here — command handlers, actions, and routes stay untouched.
 */
import {
  CreateItemCommandHandler,
  ReadItemByIdCommandHandler,
  UpdateItemCommandHandler,
} from '@/application/commands';
import {
  GetMyViewQueryHandler,
  GetRequiresAttentionViewQueryHandler,
  GetCalendarViewQueryHandler,
  GetGroupViewQueryHandler,
} from '@/application/queries/views';
import { InMemoryItemRepository } from '@/interfaces/persistence/in-memory-item-repository';
import { InMemoryItemViewQueryRepository } from '@/interfaces/persistence/in-memory-item-view-repository';
import { seedDevItems } from '@/lib/mock/seed';
import { createItemId } from '@/domain/shared';
import type { ItemOutput } from '@/application/commands/shared';
import { toItemOutput } from '@/application/commands/shared';

// Module-level singletons: survives across requests within the same Node.js process.
// In serverless (Vercel), each cold start gets a fresh instance — expected for a dev stub.
const repository = new InMemoryItemRepository();
const viewRepository = new InMemoryItemViewQueryRepository(repository);

// ── Command handlers ──────────────────────────────────────────────────────────

export const createItemHandler = new CreateItemCommandHandler(repository);
export const readItemByIdHandler = new ReadItemByIdCommandHandler(repository);
export const updateItemHandler = new UpdateItemCommandHandler(repository);

// ── Query handlers ────────────────────────────────────────────────────────────

export const getMyViewHandler = new GetMyViewQueryHandler(viewRepository);
export const getRequiresAttentionHandler = new GetRequiresAttentionViewQueryHandler(viewRepository);
export const getCalendarViewHandler = new GetCalendarViewQueryHandler(viewRepository);
export const getGroupViewHandler = new GetGroupViewQueryHandler(viewRepository);

// ── Dev seed ──────────────────────────────────────────────────────────────────
// Runs once per process (cold start). Data persists across requests in the same instance.

let seeded = false;
export async function ensureDevSeed(): Promise<void> {
  if (seeded) return;
  seeded = true;
  await seedDevItems(createItemHandler);
}

// ── Repository helpers ────────────────────────────────────────────────────────

export async function findItemById(id: string): Promise<ItemOutput | null> {
  const records = await repository.listAll();
  const record = records.find((r) => r.item.id === id);
  if (!record) return null;
  return toItemOutput(record);
}

export async function removeItem(id: string): Promise<void> {
  await repository.remove(createItemId(id));
}
