/**
 * Command handler factory — single DI injection point.
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
import { InMemoryItemRepository } from '@/interfaces/persistence/in-memory-item-repository';

// Module-level singleton: survives across requests within the same Node.js process.
// In serverless (Vercel), each cold start gets a fresh instance — expected for a dev stub.
const repository = new InMemoryItemRepository();

export const createItemHandler = new CreateItemCommandHandler(repository);
export const readItemByIdHandler = new ReadItemByIdCommandHandler(repository);
export const updateItemHandler = new UpdateItemCommandHandler(repository);
