import type { GroupId, MembershipId, UserId } from "../shared";

export const MEMBERSHIP_ROLE = {
  OWNER: "owner",
  MEMBER: "member",
} as const;

export type MembershipRole =
  (typeof MEMBERSHIP_ROLE)[keyof typeof MEMBERSHIP_ROLE];

export const membershipRoleValues = Object.values(MEMBERSHIP_ROLE);

export interface GroupMembership {
  id: MembershipId;
  groupId: GroupId;
  userId: UserId;
  role: MembershipRole;
  isActive: boolean;
}

export interface GroupMembershipInput {
  id: MembershipId;
  groupId: GroupId;
  userId: UserId;
  role?: MembershipRole;
  isActive?: boolean;
}

export function createGroupMembership(
  input: GroupMembershipInput,
): GroupMembership {
  return {
    id: input.id,
    groupId: input.groupId,
    userId: input.userId,
    role: input.role ?? MEMBERSHIP_ROLE.MEMBER,
    isActive: input.isActive ?? true,
  };
}

export function isMembershipRole(value: string): value is MembershipRole {
  return membershipRoleValues.includes(value as MembershipRole);
}

export function isActiveGroupMembership(
  membership: GroupMembership,
): boolean {
  return membership.isActive;
}

export function findActiveGroupMembership(
  memberships: readonly GroupMembership[],
  userId: UserId,
  groupId: GroupId,
): GroupMembership | null {
  return (
    memberships.find(
      (membership) =>
        membership.userId === userId &&
        membership.groupId === groupId &&
        isActiveGroupMembership(membership),
    ) ?? null
  );
}
