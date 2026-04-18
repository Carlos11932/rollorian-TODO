import "server-only";

import { createUserId } from "@/domain/shared";
import type { ApiRuntimeContext, ApiRuntimeContextResolver } from "@/lib/api-runtime-context";
import { prismaMembershipResolver } from "@/lib/item-command-factory";
import type { AgentContext } from "./context";
import { AgentAuthError } from "./errors";

async function resolveAgentRuntimeContext(
  context: AgentContext,
): Promise<ApiRuntimeContext> {
  const actorUserId = createUserId(context.userId);
  const actor = await prismaMembershipResolver.findActorByUserId(actorUserId);

  if (actor === null) {
    throw new AgentAuthError("Agent owner not found");
  }

  return {
    actor,
    visibleGroupIds: await prismaMembershipResolver.listVisibleGroupIdsForActor(
      actor.userId,
    ),
  };
}

export function createAgentRuntimeContextResolver(
  context: AgentContext,
): ApiRuntimeContextResolver {
  let cachedContextPromise: Promise<ApiRuntimeContext> | null = null;

  return async () => {
    cachedContextPromise ??= resolveAgentRuntimeContext(context);
    return cachedContextPromise;
  };
}
