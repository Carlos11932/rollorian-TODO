import "server-only";

import type { AuthorizationActor } from "@/domain/identity";
import { createUserId, type GroupId } from "@/domain/shared";
import { UnauthorizedError } from "@/lib/auth/require-auth";
import { prismaMembershipResolver } from "@/lib/item-command-factory";

export interface ApiRuntimeContext {
  actor: AuthorizationActor;
  visibleGroupIds: readonly GroupId[];
}

export type ApiRuntimeContextResolver = (
  request: Request,
) => Promise<ApiRuntimeContext>;

async function resolveTestRuntimeContext(
  request: Request,
): Promise<ApiRuntimeContext> {
  const { resolveMockActor } = await import("@/lib/mock/actor");
  const selectedActor = resolveMockActor(request);
  const actor =
    (await prismaMembershipResolver.findActorByUserId(selectedActor.userId)) ??
    selectedActor;

  return {
    actor,
    visibleGroupIds: await prismaMembershipResolver.listVisibleGroupIdsForActor(
      actor.userId,
    ),
  };
}

export async function resolveSessionRuntimeContext(
  request: Request,
): Promise<ApiRuntimeContext> {
  if (process.env["NODE_ENV"] === "test") {
    return resolveTestRuntimeContext(request);
  }

  const { auth } = await import("@/lib/auth");
  const session = await auth();
  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }

  const actorUserId = createUserId(session.user.id);
  const actor = await prismaMembershipResolver.findActorByUserId(actorUserId);

  if (actor === null) {
    throw new UnauthorizedError();
  }

  return {
    actor,
    visibleGroupIds: await prismaMembershipResolver.listVisibleGroupIdsForActor(
      actor.userId,
    ),
  };
}
