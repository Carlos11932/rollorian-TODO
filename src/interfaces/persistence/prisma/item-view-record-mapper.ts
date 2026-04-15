import { toItemOutput } from "@/application/commands";
import {
  projectItemQueryFacts,
  type AttentionThresholds,
} from "@/application/queries/projectors";
import type { ItemViewRecord } from "@/application/queries/views";
import type { PrismaItemAggregate } from "./runtime-aggregates";
import { mapPrismaItemAggregateToItemRecord } from "./item-record-mapper";

export interface MapPrismaItemAggregateToItemViewRecordInput {
  aggregate: PrismaItemAggregate;
  referenceDate: Date;
  thresholds: AttentionThresholds;
}

export function mapPrismaItemAggregateToItemViewRecord(
  input: MapPrismaItemAggregateToItemViewRecordInput,
): ItemViewRecord {
  const record = mapPrismaItemAggregateToItemRecord(input.aggregate);

  return {
    item: toItemOutput(record),
    projection: projectItemQueryFacts({
      record,
      referenceDate: input.referenceDate,
      thresholds: input.thresholds,
    }),
  };
}
