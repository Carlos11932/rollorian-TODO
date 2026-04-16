import 'server-only';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import {
  createAuthorizationActor,
  createGroupMembership,
  createUserIdentity,
  MEMBERSHIP_ROLE,
  type AuthorizationActor,
} from '@/domain/identity';
import { createGroupSpaceAccessContext, createPersonalSpaceAccessContext } from '@/domain/access';
import { createGroupItemScope, createPersonalItemScope } from '@/domain/item';
import {
  createGroupId,
  createMembershipId,
  createSpaceId,
  createUserId,
  SPACE_TYPE,
  type GroupId,
  type SpaceId,
  type UserId,
} from '@/domain/shared';
import type { ItemCommandSpace } from '@/application/commands/shared';

export interface SessionActorAndSpace {
  actor: AuthorizationActor;
  space: ItemCommandSpace;
  actorUserId: UserId;
}

/** Derive a stable personal spaceId from the user's DB id. */
export function personalSpaceId(userId: string): SpaceId {
  return createSpaceId(`space-personal-${userId}`);
}

/** Derive a stable group spaceId from the group's DB id. */
export function groupSpaceId(groupId: string): SpaceId {
  return createSpaceId(`space-group-${groupId}`);
}

/** Build actor + personal command space from the current session. */
export async function buildPersonalActorAndSpace(
  spaceId?: SpaceId,
): Promise<SessionActorAndSpace> {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const userId = createUserId(session.user.id);
  const actor = createAuthorizationActor(
    createUserIdentity({
      id: userId,
      displayName: session.user.name ?? 'Usuario',
      email: session.user.email ?? '',
    }),
  );

  const sid = spaceId ?? personalSpaceId(session.user.id);
  return {
    actor,
    actorUserId: userId,
    space: {
      accessContext: createPersonalSpaceAccessContext({ ownerId: userId, spaceId: sid }),
      scope: createPersonalItemScope({ ownerId: userId }),
    },
  };
}

/** Build actor + group command space from the current session + DB memberships. */
export async function buildGroupActorAndSpace(
  groupId: GroupId,
  spaceId?: SpaceId,
): Promise<SessionActorAndSpace> {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const userId = createUserId(session.user.id);
  const actor = createAuthorizationActor(
    createUserIdentity({
      id: userId,
      displayName: session.user.name ?? 'Usuario',
      email: session.user.email ?? '',
    }),
  );

  const dbMemberships = await prisma.groupMembership.findMany({
    where: { groupId: groupId as string, isActive: true },
    select: { id: true, userId: true, role: true },
  });

  const memberships = dbMemberships.map((m) =>
    createGroupMembership({
      id: createMembershipId(m.id),
      groupId,
      userId: createUserId(m.userId),
      role: m.role === 'owner' ? MEMBERSHIP_ROLE.OWNER : MEMBERSHIP_ROLE.MEMBER,
    }),
  );

  const sid = spaceId ?? groupSpaceId(groupId as string);
  return {
    actor,
    actorUserId: userId,
    space: {
      accessContext: createGroupSpaceAccessContext({ spaceId: sid, groupId, memberships }),
      scope: createGroupItemScope({ groupId, memberships }),
    },
  };
}

/**
 * Build actor + command space from the current session, given an item's stored
 * spaceType, spaceId, ownerId, and groupId. Use this for update/delete operations
 * where the item already exists in the store.
 */
export async function buildActorAndSpaceForItem(item: {
  spaceType: string;
  spaceId: string;
  ownerId: string | null;
  groupId: string | null;
}): Promise<SessionActorAndSpace> {
  const sid = createSpaceId(item.spaceId);

  if (item.spaceType === SPACE_TYPE.GROUP && item.groupId) {
    return buildGroupActorAndSpace(createGroupId(item.groupId), sid);
  }

  return buildPersonalActorAndSpace(sid);
}
