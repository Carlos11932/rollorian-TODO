import type { ProjectableItemRecord, AssigneeSummaryProjection } from "./types";

export function projectAssigneeSummary(
  record: ProjectableItemRecord,
): AssigneeSummaryProjection {
  const assigneeCount = record.assigneeIds.length;

  return {
    assigneeCount,
    assigneeIds: record.assigneeIds,
    hasMultipleAssignees: assigneeCount > 1,
    isUnassigned: assigneeCount === 0,
    primaryAssigneeId: assigneeCount === 1 ? record.assigneeIds[0] ?? null : null,
  };
}
