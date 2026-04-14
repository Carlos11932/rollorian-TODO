import {
  findActiveGroupMembership,
  type AuthorizationActor,
  type GroupMembership,
} from "../identity";
import { SPACE_TYPE, type GroupId, type UserId } from "../shared";
import type {
  GroupSpaceAccessContext,
  PersonalSpaceAccessContext,
  SpaceAccessContext,
} from "./space-access-context";

export const SPACE_ACCESS_REASON = {
  OWNER: "owner",
  GROUP_MEMBER: "group_member",
  NOT_OWNER: "not_owner",
  NOT_GROUP_MEMBER: "not_group_member",
} as const;

export type SpaceAccessReason =
  (typeof SPACE_ACCESS_REASON)[keyof typeof SPACE_ACCESS_REASON];

export interface SpaceAuthorizationDecision {
  canView: boolean;
  canEdit: boolean;
  groupId: GroupId | null;
  ownerId: UserId | null;
  membership: GroupMembership | null;
  reason: SpaceAccessReason;
}

export interface SpaceAuthorizationRequest {
  actor: AuthorizationActor;
  context: SpaceAccessContext;
}

export interface PersonalSpaceAuthorizationRequest {
  actor: AuthorizationActor;
  context: PersonalSpaceAccessContext;
}

export interface GroupSpaceAuthorizationRequest {
  actor: AuthorizationActor;
  context: GroupSpaceAccessContext;
}

export function authorizePersonalSpaceAccess(
  request: PersonalSpaceAuthorizationRequest,
): SpaceAuthorizationDecision {
  const isOwner = request.actor.userId === request.context.ownerId;

  return {
    canView: isOwner,
    canEdit: isOwner,
    groupId: null,
    ownerId: request.context.ownerId,
    membership: null,
    reason: isOwner ? SPACE_ACCESS_REASON.OWNER : SPACE_ACCESS_REASON.NOT_OWNER,
  };
}

export function authorizeGroupSpaceAccess(
  request: GroupSpaceAuthorizationRequest,
): SpaceAuthorizationDecision {
  const membership = findActiveGroupMembership(
    request.context.memberships,
    request.actor.userId,
    request.context.groupId,
  );

  const isMember = membership !== null;

  return {
    canView: isMember,
    canEdit: isMember,
    groupId: request.context.groupId,
    ownerId: null,
    membership,
    reason: isMember
      ? SPACE_ACCESS_REASON.GROUP_MEMBER
      : SPACE_ACCESS_REASON.NOT_GROUP_MEMBER,
  };
}

export function authorizeSpaceAccess(
  request: SpaceAuthorizationRequest,
): SpaceAuthorizationDecision {
  if (request.context.spaceType === SPACE_TYPE.PERSONAL) {
    return authorizePersonalSpaceAccess({
      actor: request.actor,
      context: request.context,
    });
  }

  return authorizeGroupSpaceAccess({
    actor: request.actor,
    context: request.context,
  });
}
