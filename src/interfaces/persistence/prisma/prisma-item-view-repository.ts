import { Prisma, type PrismaClient } from "@prisma/client";

import type { AttentionThresholds } from "@/application/queries/projectors";
import type { ItemViewQueryRepository, ItemViewRecord } from "@/application/queries/views";

import { mapPrismaItemAggregateToItemViewRecord } from "./item-view-record-mapper";
import { prismaItemAggregateArgs } from "./runtime-aggregates";

const DEFAULT_REFERENCE_DATE = new Date("2026-04-14T12:00:00.000Z");

const DEFAULT_THRESHOLDS: AttentionThresholds = {
  openItemDays: 7,
  postponeCount: 3,
};

const PRISMA_ITEM_VIEW_ORDER_BY: Prisma.ItemOrderByWithRelationInput[] = [
  { createdAt: Prisma.SortOrder.asc },
  { id: Prisma.SortOrder.asc },
] as const;

type PrismaItemViewRepositoryClient = Pick<PrismaClient, "item">;

type ReferenceDateInput = Date | (() => Date);

export interface PrismaItemViewRepositoryOptions {
  referenceDate?: ReferenceDateInput;
  thresholds?: AttentionThresholds;
}

function resolveReferenceDate(input: ReferenceDateInput | undefined): Date {
  if (input === undefined) {
    return DEFAULT_REFERENCE_DATE;
  }

  return input instanceof Date ? input : input();
}

export class PrismaItemViewRepository implements ItemViewQueryRepository {
  private readonly referenceDateInput: ReferenceDateInput;

  private readonly thresholds: AttentionThresholds;

  public constructor(
    private readonly client: PrismaItemViewRepositoryClient,
    options: PrismaItemViewRepositoryOptions = {},
  ) {
    this.referenceDateInput = options.referenceDate ?? DEFAULT_REFERENCE_DATE;
    this.thresholds = options.thresholds ?? DEFAULT_THRESHOLDS;
  }

  public async listProjectedItems(): Promise<readonly ItemViewRecord[]> {
    const aggregates = await this.client.item.findMany({
      ...prismaItemAggregateArgs,
      orderBy: PRISMA_ITEM_VIEW_ORDER_BY,
    });
    const referenceDate = resolveReferenceDate(this.referenceDateInput);

    return aggregates.map((aggregate) =>
      mapPrismaItemAggregateToItemViewRecord({
        aggregate,
        referenceDate,
        thresholds: this.thresholds,
      }),
    );
  }
}
