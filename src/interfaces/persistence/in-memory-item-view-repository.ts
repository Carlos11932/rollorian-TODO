/**
 * Read-side repository for view queries.
 *
 * Wraps the same InMemoryItemRepository store, applies domain projectors
 * to produce ItemViewRecord[] for query handlers.
 *
 * Swap point: replace with a Prisma read model when persistence lands.
 */
import { projectItemQueryFacts } from '@/application/queries/projectors';
import type { ItemViewQueryRepository, ItemViewRecord } from '@/application/queries/views/shared';
import { toItemOutput } from '@/application/commands/shared';
import type { InMemoryItemRepository } from './in-memory-item-repository';

const DEFAULT_THRESHOLDS = {
  openItemDays: 14,
  postponeCount: 3,
} as const;

export class InMemoryItemViewQueryRepository implements ItemViewQueryRepository {
  public constructor(private readonly repository: InMemoryItemRepository) {}

  async listProjectedItems(): Promise<readonly ItemViewRecord[]> {
    const records = await this.repository.listAll();
    const referenceDate = new Date();

    return records.map((record) => {
      const projection = projectItemQueryFacts({
        record,
        referenceDate,
        thresholds: DEFAULT_THRESHOLDS,
      });

      return {
        item: toItemOutput(record),
        projection,
      };
    });
  }
}
