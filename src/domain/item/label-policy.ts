import { SPACE_TYPE } from "../shared";
import type { ItemScope } from "./scope";

export interface ItemLabel {
  value: string;
}

export interface LabelValidationInput {
  scope: ItemScope;
  labels: readonly string[];
}

export interface LabelValidationResult {
  isValid: boolean;
  labels: readonly ItemLabel[];
  scopeKey: string;
  violations: string[];
}

function normalizeLabelValue(label: string): string {
  return label.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

export function createItemLabel(label: string): ItemLabel {
  const normalizedValue = normalizeLabelValue(label);

  if (normalizedValue.length === 0) {
    throw new Error("Item labels cannot be empty.");
  }

  return {
    value: normalizedValue,
  };
}

export function getItemLabelScopeKey(scope: ItemScope): string {
  if (scope.spaceType === SPACE_TYPE.PERSONAL) {
    return `personal:${scope.ownerId}`;
  }

  return `group:${scope.groupId}`;
}

export function validateItemLabels(
  input: LabelValidationInput,
): LabelValidationResult {
  const violations: string[] = [];
  const labelsByValue = new Map<string, ItemLabel>();

  input.labels.forEach((label) => {
    const normalizedValue = normalizeLabelValue(label);

    if (normalizedValue.length === 0) {
      violations.push("Item labels cannot be empty.");
      return;
    }

    if (!labelsByValue.has(normalizedValue)) {
      labelsByValue.set(normalizedValue, {
        value: normalizedValue,
      });
    }
  });

  return {
    isValid: violations.length === 0,
    labels: [...labelsByValue.values()],
    scopeKey: getItemLabelScopeKey(input.scope),
    violations,
  };
}

export function assertItemLabels(input: LabelValidationInput): void {
  const result = validateItemLabels(input);

  if (!result.isValid) {
    throw new Error(result.violations.join(" "));
  }
}
