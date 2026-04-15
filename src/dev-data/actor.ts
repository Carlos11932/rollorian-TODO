/**
 * Mock runtime identity resolver for App Router handlers.
 * Replace with real session/group membership data when auth is implemented.
 */
import {
  createAuthorizationActor,
  createGroupMembership,
  createUserIdentity,
  type AuthorizationActor,
  type GroupMembership,
} from "@/domain/identity";
import { createGroupSpaceAccessContext, createPersonalSpaceAccessContext } from "@/domain/access";
import { createGroupItemScope, createPersonalItemScope } from "@/domain/item";
import {
  createGroupId,
  createMembershipId,
  createSpaceId,
  createUserId,
  type GroupId,
  type SpaceId,
  type UserId,
} from "@/domain/shared";

export const MOCK_ACTOR_HEADER = "x-rollorian-actor-id";

export const MOCK_USER_ID = createUserId("user-1");
export const MOCK_TEAMMATE_USER_ID = createUserId("user-2");
export const MOCK_GROUP_B_ONLY_USER_ID = createUserId("user-3");
export const MOCK_OUTSIDER_USER_ID = createUserId("user-4");

export const MOCK_GROUP_ALPHA_ID = createGroupId("group-alpha");
export const MOCK_GROUP_BETA_ID = createGroupId("group-beta");

export const MOCK_PERSONAL_SPACE_ID = createSpaceId("space-personal-user-1");
export const MOCK_TEAMMATE_PERSONAL_SPACE_ID = createSpaceId("space-personal-user-2");
export const MOCK_GROUP_B_ONLY_PERSONAL_SPACE_ID = createSpaceId("space-personal-user-3");
export const MOCK_OUTSIDER_PERSONAL_SPACE_ID = createSpaceId("space-personal-user-4");

export const MOCK_GROUP_ALPHA_SPACE_ID = createSpaceId("space-group-alpha");
export const MOCK_GROUP_BETA_SPACE_ID = createSpaceId("space-group-beta");

const mockUsers = new Map<UserId, AuthorizationActor>([
  [
    MOCK_USER_ID,
    createAuthorizationActor(
      createUserIdentity({
        displayName: "The Curator",
        email: "curator@rollorian.dev",
        id: MOCK_USER_ID,
      }),
    ),
  ],
  [
    MOCK_TEAMMATE_USER_ID,
    createAuthorizationActor(
      createUserIdentity({
        displayName: "Archive Partner",
        email: "partner@rollorian.dev",
        id: MOCK_TEAMMATE_USER_ID,
      }),
    ),
  ],
  [
    MOCK_GROUP_B_ONLY_USER_ID,
    createAuthorizationActor(
      createUserIdentity({
        displayName: "Patrimony Steward",
        email: "steward@rollorian.dev",
        id: MOCK_GROUP_B_ONLY_USER_ID,
      }),
    ),
  ],
  [
    MOCK_OUTSIDER_USER_ID,
    createAuthorizationActor(
      createUserIdentity({
        displayName: "Outsider",
        email: "outsider@rollorian.dev",
        id: MOCK_OUTSIDER_USER_ID,
      }),
    ),
  ],
]);

const membershipsByGroupId = new Map<GroupId, readonly GroupMembership[]>([
  [
    MOCK_GROUP_ALPHA_ID,
    [
      createGroupMembership({
        groupId: MOCK_GROUP_ALPHA_ID,
        id: createMembershipId("membership-alpha-user-1"),
        userId: MOCK_USER_ID,
      }),
      createGroupMembership({
        groupId: MOCK_GROUP_ALPHA_ID,
        id: createMembershipId("membership-alpha-user-2"),
        userId: MOCK_TEAMMATE_USER_ID,
      }),
    ],
  ],
  [
    MOCK_GROUP_BETA_ID,
    [
      createGroupMembership({
        groupId: MOCK_GROUP_BETA_ID,
        id: createMembershipId("membership-beta-user-1"),
        userId: MOCK_USER_ID,
      }),
      createGroupMembership({
        groupId: MOCK_GROUP_BETA_ID,
        id: createMembershipId("membership-beta-user-3"),
        userId: MOCK_GROUP_B_ONLY_USER_ID,
      }),
    ],
  ],
]);

const personalSpaceIdByUserId = new Map<UserId, SpaceId>([
  [MOCK_USER_ID, MOCK_PERSONAL_SPACE_ID],
  [MOCK_TEAMMATE_USER_ID, MOCK_TEAMMATE_PERSONAL_SPACE_ID],
  [MOCK_GROUP_B_ONLY_USER_ID, MOCK_GROUP_B_ONLY_PERSONAL_SPACE_ID],
  [MOCK_OUTSIDER_USER_ID, MOCK_OUTSIDER_PERSONAL_SPACE_ID],
]);

export const MOCK_ACTOR = mockUsers.get(MOCK_USER_ID)!;

export const MOCK_PERSONAL_ACCESS_CONTEXT = createPersonalSpaceAccessContext({
  ownerId: MOCK_USER_ID,
  spaceId: MOCK_PERSONAL_SPACE_ID,
});

export const MOCK_PERSONAL_SCOPE = createPersonalItemScope({ ownerId: MOCK_USER_ID });

export const MOCK_PERSONAL_COMMAND_SPACE = {
  accessContext: MOCK_PERSONAL_ACCESS_CONTEXT,
  scope: MOCK_PERSONAL_SCOPE,
} as const;

export function resolveMockActor(request: Request): AuthorizationActor {
  const requestedUserId = request.headers.get(MOCK_ACTOR_HEADER);

  if (requestedUserId === null) {
    return MOCK_ACTOR;
  }

  return mockUsers.get(createUserId(requestedUserId)) ?? MOCK_ACTOR;
}

export function resolveMockVisibleGroupIds(actor: AuthorizationActor): readonly GroupId[] {
  return [...membershipsByGroupId.entries()]
    .filter(([, memberships]) => memberships.some((membership) => membership.userId === actor.userId && membership.isActive))
    .map(([groupId]) => groupId);
}

export function resolveMockGroupMemberships(groupId: GroupId): readonly GroupMembership[] {
  return membershipsByGroupId.get(groupId) ?? [];
}

export function resolveMockPersonalSpaceId(userId: UserId): SpaceId {
  return personalSpaceIdByUserId.get(userId) ?? createSpaceId(`space-personal-${userId}`);
}

export function createMockPersonalCommandSpace(ownerId: UserId, spaceId: SpaceId) {
  return {
    accessContext: createPersonalSpaceAccessContext({ ownerId, spaceId }),
    scope: createPersonalItemScope({ ownerId }),
  } as const;
}

export function createMockGroupCommandSpace(groupId: GroupId, spaceId: SpaceId) {
  const memberships = resolveMockGroupMemberships(groupId);

  return {
    accessContext: createGroupSpaceAccessContext({ groupId, memberships, spaceId }),
    scope: createGroupItemScope({ groupId, memberships }),
  } as const;
}
