import 'server-only';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createGroupId, createUserId, type GroupId, type UserId } from '@/domain/shared';
import { redirect } from 'next/navigation';

export interface ActorContext {
  actorUserId: UserId;
  visibleGroupIds: readonly GroupId[];
}

/**
 * Resolves the actor context from the current NextAuth session.
 * Reads active group memberships from the DB.
 * Redirects to /login if no session exists.
 */
export async function getActorContext(): Promise<ActorContext> {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const memberships = await prisma.membership.findMany({
    where: { userId: session.user.id, isActive: true },
    select: { groupId: true },
  });

  return {
    actorUserId: createUserId(session.user.id),
    visibleGroupIds: memberships.map((m) => createGroupId(m.groupId)),
  };
}

/**
 * Same as getActorContext but returns null instead of redirecting.
 * Use in contexts where redirect is not appropriate (e.g. route handlers).
 */
export async function tryGetActorContext(): Promise<ActorContext | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const memberships = await prisma.membership.findMany({
    where: { userId: session.user.id, isActive: true },
    select: { groupId: true },
  });

  return {
    actorUserId: createUserId(session.user.id),
    visibleGroupIds: memberships.map((m) => createGroupId(m.groupId)),
  };
}
