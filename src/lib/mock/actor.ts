/**
 * Mock runtime identity resolver for App Router handlers.
 * Replace with real session/group membership data when auth is implemented.
 */
import "server-only";

import type { GroupCommandSpace, PersonalCommandSpace } from "@/application/commands";
import { createPersonalSpaceAccessContext } from "@/domain/access";
import {
  createAuthorizationActor,
  createUserIdentity,
  type AuthorizationActor,
  type GroupMembership,
} from "@/domain/identity";
import { createPersonalItemScope } from "@/domain/item";
import {
  createGroupId,
  createSpaceId,
  createUserId,
  type GroupId,
  type SpaceId,
  type UserId,
} from "@/domain/shared";
import {
  PrismaMembershipResolver,
  PrismaMembershipResolverError,
} from "@/interfaces/persistence/prisma";
import { prisma } from "@/lib/prisma";
import {
  MOCK_BOOTSTRAP_GROUP_IDS,
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

const personalSpaceIdByUserId = new Map<UserId, SpaceId>(
  MOCK_BOOTSTRAP_USERS.map((user) => [createUserId(user.id), createSpaceId(user.personalSpaceId)]),
);

const prismaMembershipResolver = new PrismaMembershipResolver(prisma);

function assertPersistedPersonalCommandSpace(
  ownerId: UserId,
  space: PersonalCommandSpace | null,
): PersonalCommandSpace {
  if (space !== null) {
    return space;
  }

  throw new PrismaMembershipResolverError(
    `Persisted personal command space not found for user "${ownerId}".`,
  );
}

function assertPersistedGroupCommandSpace(
  groupId: GroupId,
  space: GroupCommandSpace | null,
): GroupCommandSpace {
  if (space !== null) {
    return space;
  }

  throw new PrismaMembershipResolverError(
    `Persisted group command space not found for group "${groupId}".`,
  );
}

function assertResolvedSpaceId(
  resolvedSpaceId: SpaceId,
  requestedSpaceId: SpaceId | undefined,
  scopeLabel: "personal" | "group",
  scopeId: GroupId | UserId,
): void {
  if (requestedSpaceId === undefined || requestedSpaceId === resolvedSpaceId) {
    return;
  }

  throw new PrismaMembershipResolverError(
    `Requested ${scopeLabel} space "${requestedSpaceId}" does not match persisted space "${resolvedSpaceId}" for "${scopeId}".`,
  );
}

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

export async function resolveMockVisibleGroupIds(
  actor: AuthorizationActor,
): Promise<readonly GroupId[]> {
  return prismaMembershipResolver.listVisibleGroupIdsForActor(actor.userId);
}

export async function resolveMockGroupMemberships(
  groupId: GroupId,
): Promise<readonly GroupMembership[]> {
  return prismaMembershipResolver.listMembershipsByGroupId(groupId);
}

export async function resolveMockPersonalSpaceId(userId: UserId): Promise<SpaceId> {
  const resolvedSpace = assertPersistedPersonalCommandSpace(
    userId,
    await prismaMembershipResolver.hydratePersonalCommandSpace(userId),
  );

  return resolvedSpace.accessContext.spaceId;
}

export async function createMockPersonalCommandSpace(
  ownerId: UserId,
  spaceId: SpaceId = personalSpaceIdByUserId.get(ownerId) ?? createSpaceId(`space-personal-${ownerId}`),
): Promise<PersonalCommandSpace> {
  const resolvedSpace = assertPersistedPersonalCommandSpace(
    ownerId,
    await prismaMembershipResolver.hydratePersonalCommandSpace(ownerId),
  );

  assertResolvedSpaceId(resolvedSpace.accessContext.spaceId, spaceId, "personal", ownerId);

  return resolvedSpace;
}

export async function createMockGroupCommandSpace(
  groupId: GroupId,
  spaceId?: SpaceId,
): Promise<GroupCommandSpace> {
  const resolvedSpace = assertPersistedGroupCommandSpace(
    groupId,
    await prismaMembershipResolver.hydrateGroupCommandSpace(groupId),
  );

  assertResolvedSpaceId(resolvedSpace.accessContext.spaceId, spaceId, "group", groupId);

  return resolvedSpace;
}
