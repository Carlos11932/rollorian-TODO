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
import {
  MOCK_BOOTSTRAP_GROUP_IDS,
  MOCK_BOOTSTRAP_GROUPS,
  MOCK_BOOTSTRAP_SPACE_IDS,
  MOCK_BOOTSTRAP_USER_IDS,
  MOCK_BOOTSTRAP_USERS,
} from "./bootstrap";

export const MOCK_ACTOR_HEADER = "x-rollorian-actor-id";

export const MOCK_USER_ID = createUserId(MOCK_BOOTSTRAP_USER_IDS.DEFAULT);
export const MOCK_TEAMMATE_USER_ID = createUserId(MOCK_BOOTSTRAP_USER_IDS.TEAMMATE);
export const MOCK_GROUP_B_ONLY_USER_ID = createUserId(MOCK_BOOTSTRAP_USER_IDS.GROUP_B_ONLY);
export const MOCK_OUTSIDER_USER_ID = createUserId(MOCK_BOOTSTRAP_USER_IDS.OUTSIDER);

export const MOCK_GROUP_ALPHA_ID = createGroupId(MOCK_BOOTSTRAP_GROUP_IDS.ALPHA);
export const MOCK_GROUP_BETA_ID = createGroupId(MOCK_BOOTSTRAP_GROUP_IDS.BETA);

export const MOCK_PERSONAL_SPACE_ID = createSpaceId(MOCK_BOOTSTRAP_SPACE_IDS.DEFAULT_PERSONAL);
export const MOCK_TEAMMATE_PERSONAL_SPACE_ID = createSpaceId(MOCK_BOOTSTRAP_SPACE_IDS.TEAMMATE_PERSONAL);
export const MOCK_GROUP_B_ONLY_PERSONAL_SPACE_ID = createSpaceId(MOCK_BOOTSTRAP_SPACE_IDS.GROUP_B_ONLY_PERSONAL);
export const MOCK_OUTSIDER_PERSONAL_SPACE_ID = createSpaceId(MOCK_BOOTSTRAP_SPACE_IDS.OUTSIDER_PERSONAL);

export const MOCK_GROUP_ALPHA_SPACE_ID = createSpaceId(MOCK_BOOTSTRAP_SPACE_IDS.GROUP_ALPHA);
export const MOCK_GROUP_BETA_SPACE_ID = createSpaceId(MOCK_BOOTSTRAP_SPACE_IDS.GROUP_BETA);

const mockUsers = new Map<UserId, AuthorizationActor>(
  MOCK_BOOTSTRAP_USERS.map((user) => {
    const userId = createUserId(user.id);

    return [
      userId,
      createAuthorizationActor(
        createUserIdentity({
          displayName: user.displayName,
          email: user.email,
          id: userId,
        }),
      ),
    ];
  }),
);

const membershipsByGroupId = new Map<GroupId, readonly GroupMembership[]>(
  MOCK_BOOTSTRAP_GROUPS.map((group) => {
    const groupId = createGroupId(group.id);

    return [
      groupId,
      group.memberships.map((membership) =>
        createGroupMembership({
          groupId,
          id: createMembershipId(membership.id),
          role: membership.role,
          userId: createUserId(membership.userId),
        }),
      ),
    ];
  }),
);

const personalSpaceIdByUserId = new Map<UserId, SpaceId>(
  MOCK_BOOTSTRAP_USERS.map((user) => [createUserId(user.id), createSpaceId(user.personalSpaceId)]),
);

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
