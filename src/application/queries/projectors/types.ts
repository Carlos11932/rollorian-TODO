import type { Item } from "@/domain/item";
import type { GroupId, UserId } from "@/domain/shared";

export interface ProjectableItemRecord {
  assigneeIds: readonly UserId[];
  groupId: GroupId | null;
  item: Item;
  ownerId: UserId | null;
  spaceType: "personal" | "group";
}

export const QUERY_VISIBILITY_SCOPE = {
  GROUP_MEMBERS: "group_members",
  PERSONAL_OWNER: "personal_owner",
} as const;

export type QueryVisibilityScope =
  (typeof QUERY_VISIBILITY_SCOPE)[keyof typeof QUERY_VISIBILITY_SCOPE];

export const MY_VIEW_MEMBERSHIP = {
  GROUP_ASSIGNEE_OR_UNASSIGNED: "group_assignee_or_unassigned",
  PERSONAL_OWNER: "personal_owner",
} as const;

export type MyViewMembership =
  (typeof MY_VIEW_MEMBERSHIP)[keyof typeof MY_VIEW_MEMBERSHIP];

export interface VisibilityProjection {
  groupId: GroupId | null;
  groupViewGroupId: GroupId | null;
  myViewMembership: MyViewMembership;
  ownerId: UserId | null;
  visibilityScope: QueryVisibilityScope;
}

export interface DatedSpanProjection {
  calendarEndAt: Date | null;
  calendarStartAt: Date | null;
  dueAt: Date | null;
  isDated: boolean;
}

export interface UndatedStateProjection {
  isUndated: boolean;
}

export interface AssigneeSummaryProjection {
  assigneeCount: number;
  assigneeIds: readonly UserId[];
  hasMultipleAssignees: boolean;
  isUnassigned: boolean;
  primaryAssigneeId: UserId | null;
}

export const ATTENTION_REASON = {
  BLOCKED: "blocked",
  OPEN_TOO_LONG: "open_too_long",
  OVERDUE: "overdue",
  POSTPONED_DUE: "postponed_due",
  POSTPONED_TOO_OFTEN: "postponed_too_often",
} as const;

export type AttentionReason =
  (typeof ATTENTION_REASON)[keyof typeof ATTENTION_REASON];

export interface AttentionThresholds {
  openItemDays: number;
  postponeCount: number;
}

export interface AttentionProjection {
  isOpen: boolean;
  reasons: readonly AttentionReason[];
}

export interface ItemQueryProjection {
  assigneeSummary: AssigneeSummaryProjection;
  attention: AttentionProjection;
  datedSpan: DatedSpanProjection;
  undatedState: UndatedStateProjection;
  visibility: VisibilityProjection;
}
