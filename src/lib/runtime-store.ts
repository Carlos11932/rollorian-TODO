/**
 * In-memory runtime storage for tests or controlled fallback scenarios only.
 * Production runtime wiring must use Prisma-backed repositories instead.
 */
import { type AppendGroupItemAuditEntryRepository } from "@/application/history";
import {
  toItemOutput,
  type ItemCommandRepository,
  type ItemRecord,
} from "@/application/commands";
import {
  projectItemQueryFacts,
  type AttentionThresholds,
} from "@/application/queries/projectors";
import { type ItemViewQueryRepository, type ItemViewRecord } from "@/application/queries/views";
import { type GroupItemAuditEntry } from "@/domain/history";
import { type ItemId } from "@/domain/shared";

const DEFAULT_REFERENCE_DATE = new Date("2026-04-14T12:00:00.000Z");
const DEFAULT_THRESHOLDS: AttentionThresholds = {
  openItemDays: 7,
  postponeCount: 3,
};

export class InMemoryRuntimeStore
  implements ItemCommandRepository, ItemViewQueryRepository, AppendGroupItemAuditEntryRepository
{
  private readonly records = new Map<string, ItemRecord>();

  private readonly historyEntries: GroupItemAuditEntry[] = [];

  private referenceDate = DEFAULT_REFERENCE_DATE;

  public async append(entry: GroupItemAuditEntry): Promise<void> {
    this.historyEntries.push(entry);
  }

  public async findById(itemId: ItemId): Promise<ItemRecord | null> {
    return this.records.get(itemId) ?? null;
  }

  public async listProjectedItems(): Promise<readonly ItemViewRecord[]> {
    return [...this.records.values()].map((record) => ({
      item: toItemOutput(record),
      projection: projectItemQueryFacts({
        record,
        referenceDate: this.referenceDate,
        thresholds: DEFAULT_THRESHOLDS,
      }),
    }));
  }

  public async listAll(): Promise<readonly ItemRecord[]> {
    return [...this.records.values()];
  }

  public listHistoryEntries(itemId: string): readonly GroupItemAuditEntry[] {
    return this.historyEntries.filter((entry) => entry.itemId === itemId);
  }

  public reset(): void {
    this.records.clear();
    this.historyEntries.length = 0;
    this.referenceDate = DEFAULT_REFERENCE_DATE;
  }

  public async remove(itemId: ItemId): Promise<void> {
    this.records.delete(itemId);
  }

  public async save(record: ItemRecord): Promise<void> {
    this.records.set(record.item.id, record);
  }

  public setReferenceDate(referenceDate: Date): void {
    this.referenceDate = referenceDate;
  }
}

export function createInMemoryRuntimeStore(): InMemoryRuntimeStore {
  return new InMemoryRuntimeStore();
}
