/**
 * Development in-memory stub for ItemCommandRepository.
 *
 * NOT for production. Swap this for the Prisma implementation
 * in src/lib/item-command-factory.ts when the schema lands.
 */
import type { ItemCommandRepository, ItemRecord } from '@/application/commands/shared';
import type { ItemId } from '@/domain/shared';

export class InMemoryItemRepository implements ItemCommandRepository {
  private readonly store = new Map<string, ItemRecord>();

  async findById(itemId: ItemId): Promise<ItemRecord | null> {
    return this.store.get(itemId) ?? null;
  }

  async save(record: ItemRecord): Promise<void> {
    this.store.set(record.item.id, record);
  }

  /** Exposes all stored records for read-side projections. */
  async listAll(): Promise<readonly ItemRecord[]> {
    return Array.from(this.store.values());
  }

  /** Removes a record by id. No-op if not found. */
  async remove(itemId: ItemId): Promise<void> {
    this.store.delete(itemId);
  }
}
