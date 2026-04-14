import { findActiveGroupMembership } from "../identity";
import type { UserId } from "../shared";
import { isGroupItemScope, isPersonalItemScope, type ItemScope } from "./scope";

export interface AssignmentValidationInput {
  scope: ItemScope;
  assigneeIds: readonly UserId[];
}

export interface AssignmentValidationResult {
  isValid: boolean;
  assigneeIds: readonly UserId[];
  violations: string[];
}

function normalizeAssigneeIds(assigneeIds: readonly UserId[]): readonly UserId[] {
  return [...new Set(assigneeIds)];
}

export function validateItemAssignment(
  input: AssignmentValidationInput,
): AssignmentValidationResult {
  const normalizedAssigneeIds = normalizeAssigneeIds(input.assigneeIds);
  const violations: string[] = [];

  if (isPersonalItemScope(input.scope)) {
    const scope = input.scope;
    const hasNonOwnerAssignee = normalizedAssigneeIds.some(
      (assigneeId) => assigneeId !== scope.ownerId,
    );

    if (hasNonOwnerAssignee) {
      violations.push("Personal items may only assign the personal owner.");
    }
  }

  if (isGroupItemScope(input.scope)) {
    const scope = input.scope;
    normalizedAssigneeIds.forEach((assigneeId) => {
      const membership = findActiveGroupMembership(
        scope.memberships,
        assigneeId,
        scope.groupId,
      );

      if (membership === null) {
        violations.push(
          `Group items may only assign active group members: ${assigneeId}.`,
        );
      }
    });
  }

  return {
    isValid: violations.length === 0,
    assigneeIds: normalizedAssigneeIds,
    violations,
  };
}

export function assertItemAssignment(input: AssignmentValidationInput): void {
  const result = validateItemAssignment(input);

  if (!result.isValid) {
    throw new Error(result.violations.join(" "));
  }
}
