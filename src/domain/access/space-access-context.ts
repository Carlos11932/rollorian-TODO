import { SPACE_TYPE, type GroupId, type SpaceId, type UserId } from "../shared";
import type { GroupMembership } from "../identity";

export interface PersonalSpaceAccessContext {
  spaceId: SpaceId;
  spaceType: typeof SPACE_TYPE.PERSONAL;
  ownerId: UserId;
}

export interface PersonalSpaceAccessContextInput {
  spaceId: SpaceId;
  ownerId: UserId;
}

export interface GroupSpaceAccessContext {
  spaceId: SpaceId;
  spaceType: typeof SPACE_TYPE.GROUP;
  groupId: GroupId;
  memberships: readonly GroupMembership[];
}

export interface GroupSpaceAccessContextInput {
  spaceId: SpaceId;
  groupId: GroupId;
  memberships: readonly GroupMembership[];
}

export type SpaceAccessContext =
  | PersonalSpaceAccessContext
  | GroupSpaceAccessContext;

export function createPersonalSpaceAccessContext(
  input: PersonalSpaceAccessContextInput,
): PersonalSpaceAccessContext {
  return {
    spaceId: input.spaceId,
    spaceType: SPACE_TYPE.PERSONAL,
    ownerId: input.ownerId,
  };
}

export function createGroupSpaceAccessContext(
  input: GroupSpaceAccessContextInput,
): GroupSpaceAccessContext {
  const hasMembershipOutsideGroup = input.memberships.some(
    (membership) => membership.groupId !== input.groupId,
  );

  if (hasMembershipOutsideGroup) {
    throw new Error(
      "Group space access context only accepts memberships for the same group.",
    );
  }

  return {
    spaceId: input.spaceId,
    spaceType: SPACE_TYPE.GROUP,
    groupId: input.groupId,
    memberships: input.memberships,
  };
}
