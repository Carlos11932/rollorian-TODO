import type { UserId } from "../shared";
import type { UserIdentity } from "./user";

export interface ActorMetadata {
  actorId: UserId;
  displayName: string | null;
  email: string | null;
}

export interface AuthorizationActor {
  userId: UserId;
  metadata: ActorMetadata;
}

export function createActorMetadata(user: UserIdentity): ActorMetadata {
  return {
    actorId: user.id,
    displayName: user.displayName,
    email: user.email,
  };
}

export function createAuthorizationActor(
  user: UserIdentity,
): AuthorizationActor {
  return {
    userId: user.id,
    metadata: createActorMetadata(user),
  };
}
