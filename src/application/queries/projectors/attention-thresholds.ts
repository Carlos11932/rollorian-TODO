import type { AttentionThresholds } from "./types";

function assertNonNegativeInteger(value: number, fieldName: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${fieldName} must be a non-negative integer.`);
  }
}

export function createAttentionThresholds(
  input: AttentionThresholds,
): AttentionThresholds {
  assertNonNegativeInteger(input.openItemDays, "attention.openItemDays");
  assertNonNegativeInteger(input.postponeCount, "attention.postponeCount");

  return {
    openItemDays: input.openItemDays,
    postponeCount: input.postponeCount,
  };
}
