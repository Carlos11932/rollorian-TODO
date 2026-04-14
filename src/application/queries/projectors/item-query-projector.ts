import { createAttentionThresholds } from "./attention-thresholds";
import { projectAssigneeSummary } from "./assignee-summary-projector";
import { projectAttentionReasons } from "./attention-reasons-projector";
import { projectDatedSpan } from "./dated-span-projector";
import type { AttentionThresholds, ItemQueryProjection, ProjectableItemRecord } from "./types";
import { projectUndatedState } from "./undated-state-projector";
import { projectVisibility } from "./visibility-projector";

export interface ProjectItemQueryFactsInput {
  record: ProjectableItemRecord;
  referenceDate: Date;
  thresholds: AttentionThresholds;
}

export function projectItemQueryFacts(
  input: ProjectItemQueryFactsInput,
): ItemQueryProjection {
  const thresholds = createAttentionThresholds(input.thresholds);

  return {
    assigneeSummary: projectAssigneeSummary(input.record),
    attention: projectAttentionReasons({
      item: input.record.item,
      referenceDate: input.referenceDate,
      thresholds,
    }),
    datedSpan: projectDatedSpan(input.record.item),
    undatedState: projectUndatedState(input.record.item),
    visibility: projectVisibility(input.record),
  };
}
