import type { GroupMembership } from "../identity";
import { SPACE_TYPE, type GroupId, type UserId } from "../shared";

export interface PersonalItemScope {
  spaceType: typeof SPACE_TYPE.PERSONAL;
  ownerId: UserId;
}

export interface PersonalItemScopeInput {
  ownerId: UserId;
}

export interface GroupItemScope {
  spaceType: typeof SPACE_TYPE.GROUP;
  groupId: GroupId;
  memberships: readonly GroupMembership[];
}

export interface GroupItemScopeInput {
  groupId: GroupId;
  memberships: readonly GroupMembership[];
}

export type ItemScope = PersonalItemScope | GroupItemScope;

export function isPersonalItemScope(scope: ItemScope): scope is PersonalItemScope {
  return scope.spaceType === SPACE_TYPE.PERSONAL;
}

export function isGroupItemScope(scope: ItemScope): scope is GroupItemScope {
  return scope.spaceType === SPACE_TYPE.GROUP;
}

export function createPersonalItemScope(
  input: PersonalItemScopeInput,
): PersonalItemScope {
  return {
    spaceType: SPACE_TYPE.PERSONAL,
    ownerId: input.ownerId,
  };
}

export function createGroupItemScope(input: GroupItemScopeInput): GroupItemScope {
  const hasMembershipOutsideGroup = input.memberships.some(
    (membership) => membership.groupId !== input.groupId,
  );

  if (hasMembershipOutsideGroup) {
    throw new Error(
      "Group item scope only accepts memberships for the same group.",
    );
  }

  return {
    spaceType: SPACE_TYPE.GROUP,
    groupId: input.groupId,
    memberships: input.memberships,
  };
}
