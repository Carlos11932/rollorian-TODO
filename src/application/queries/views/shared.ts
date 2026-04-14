import type { ItemOutput } from "@/application/commands/shared";
import {
  MY_VIEW_MEMBERSHIP,
  QUERY_VISIBILITY_SCOPE,
  type ItemQueryProjection,
} from "@/application/queries/projectors";
import type { GroupId, UserId } from "@/domain/shared";

export const VIEW_SPACE_FILTER = {
  BOTH: "both",
  GROUP: "group",
  PERSONAL: "personal",
} as const;

export type ViewSpaceFilter =
  (typeof VIEW_SPACE_FILTER)[keyof typeof VIEW_SPACE_FILTER];

export interface CalendarRange {
  endAt: Date;
  startAt: Date;
}

export interface ViewActorContext {
  actorUserId: UserId;
  visibleGroupIds: readonly GroupId[];
}

export interface ItemViewRecord {
  item: ItemOutput;
  projection: ItemQueryProjection;
}

export interface ItemViewQueryRepository {
  listProjectedItems(): Promise<readonly ItemViewRecord[]>;
}

export interface ViewResult {
  items: readonly ItemViewRecord[];
  totalCount: number;
}

export function createCalendarRange(startAt: Date, endAt: Date): CalendarRange {
  if (endAt.getTime() < startAt.getTime()) {
    throw new Error("Calendar range endAt cannot be before startAt.");
  }

  return {
    endAt,
    startAt,
  };
}

function hasVisibleGroup(
  visibleGroupIds: readonly GroupId[],
  groupId: GroupId | null,
): groupId is GroupId {
  return groupId !== null && visibleGroupIds.includes(groupId);
}

export function isPersonalItemVisibleToActor(
  record: ItemViewRecord,
  actorUserId: UserId,
): boolean {
  return (
    record.projection.visibility.visibilityScope ===
      QUERY_VISIBILITY_SCOPE.PERSONAL_OWNER &&
    record.projection.visibility.ownerId === actorUserId
  );
}

export function isGroupItemVisibleToActor(
  record: ItemViewRecord,
  visibleGroupIds: readonly GroupId[],
): boolean {
  return (
    record.projection.visibility.visibilityScope ===
      QUERY_VISIBILITY_SCOPE.GROUP_MEMBERS &&
    hasVisibleGroup(visibleGroupIds, record.projection.visibility.groupId)
  );
}

export function matchesViewSpaceFilter(
  record: ItemViewRecord,
  context: ViewActorContext,
  filter: ViewSpaceFilter,
): boolean {
  switch (filter) {
    case VIEW_SPACE_FILTER.PERSONAL:
      return isPersonalItemVisibleToActor(record, context.actorUserId);
    case VIEW_SPACE_FILTER.GROUP:
      return isGroupItemVisibleToActor(record, context.visibleGroupIds);
    case VIEW_SPACE_FILTER.BOTH:
      return (
        isPersonalItemVisibleToActor(record, context.actorUserId) ||
        isGroupItemVisibleToActor(record, context.visibleGroupIds)
      );
  }
}

export function isEligibleForMyView(
  record: ItemViewRecord,
  context: ViewActorContext,
): boolean {
  if (isPersonalItemVisibleToActor(record, context.actorUserId)) {
    return true;
  }

  if (!isGroupItemVisibleToActor(record, context.visibleGroupIds)) {
    return false;
  }

  return (
    record.projection.visibility.myViewMembership ===
      MY_VIEW_MEMBERSHIP.GROUP_ASSIGNEE_OR_UNASSIGNED &&
    (record.projection.assigneeSummary.isUnassigned ||
      record.projection.assigneeSummary.assigneeIds.includes(context.actorUserId))
  );
}

export function isEligibleForGroupView(
  record: ItemViewRecord,
  context: ViewActorContext,
  groupId: GroupId,
): boolean {
  return (
    isGroupItemVisibleToActor(record, context.visibleGroupIds) &&
    record.projection.visibility.groupViewGroupId === groupId
  );
}

export function overlapsCalendarRange(
  record: ItemViewRecord,
  range: CalendarRange,
): boolean {
  const { calendarEndAt, calendarStartAt, isDated } = record.projection.datedSpan;

  if (!isDated || calendarStartAt === null || calendarEndAt === null) {
    return false;
  }

  return (
    calendarStartAt.getTime() <= range.endAt.getTime() &&
    calendarEndAt.getTime() >= range.startAt.getTime()
  );
}

export function isEligibleForUndatedView(
  record: ItemViewRecord,
  context: ViewActorContext,
  filter: ViewSpaceFilter,
): boolean {
  return (
    matchesViewSpaceFilter(record, context, filter) &&
    record.projection.undatedState.isUndated
  );
}

export function isEligibleForAttentionView(
  record: ItemViewRecord,
  context: ViewActorContext,
  filter: ViewSpaceFilter,
): boolean {
  return (
    matchesViewSpaceFilter(record, context, filter) &&
    record.projection.attention.isOpen &&
    record.projection.attention.reasons.length > 0
  );
}
