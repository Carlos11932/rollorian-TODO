import {
  authorizeGroupSpaceAccess,
  authorizePersonalSpaceAccess,
  createGroupSpaceAccessContext,
  createPersonalSpaceAccessContext,
  SPACE_ACCESS_REASON,
} from "@/domain/access";
import {
  createAuthorizationActor,
  createGroupMembership,
  createUserIdentity,
  MEMBERSHIP_ROLE,
} from "@/domain/identity";
import {
  createGroupId,
  createMembershipId,
  createSpaceId,
  createUserId,
} from "@/domain/shared";

describe("authorization policies", () => {
  it("allows personal access only to the owner", () => {
    const ownerId = createUserId("user-owner");
    const actor = createAuthorizationActor(
      createUserIdentity({ id: ownerId, displayName: "Owner" }),
    );
    const context = createPersonalSpaceAccessContext({
      spaceId: createSpaceId("space-personal"),
      ownerId,
    });

    const decision = authorizePersonalSpaceAccess({ actor, context });

    expect(decision.canView).toBe(true);
    expect(decision.canEdit).toBe(true);
    expect(decision.reason).toBe(SPACE_ACCESS_REASON.OWNER);
  });

  it("allows group members to view and edit regardless of assignee status", () => {
    const actorId = createUserId("user-member");
    const groupId = createGroupId("group-a");
    const actor = createAuthorizationActor(
      createUserIdentity({ id: actorId, displayName: "Member" }),
    );
    const context = createGroupSpaceAccessContext({
      spaceId: createSpaceId("space-group-a"),
      groupId,
      memberships: [
        createGroupMembership({
          id: createMembershipId("membership-1"),
          groupId,
          userId: actorId,
          role: MEMBERSHIP_ROLE.MEMBER,
        }),
      ],
    });

    const decision = authorizeGroupSpaceAccess({ actor, context });

    expect(decision.canView).toBe(true);
    expect(decision.canEdit).toBe(true);
    expect(decision.reason).toBe(SPACE_ACCESS_REASON.GROUP_MEMBER);
    expect(decision.membership?.role).toBe(MEMBERSHIP_ROLE.MEMBER);
  });

  it("denies group access when the user is not an active member", () => {
    const actorId = createUserId("user-outsider");
    const groupId = createGroupId("group-a");
    const actor = createAuthorizationActor(
      createUserIdentity({ id: actorId, displayName: "Outsider" }),
    );
    const context = createGroupSpaceAccessContext({
      spaceId: createSpaceId("space-group-a"),
      groupId,
      memberships: [
        createGroupMembership({
          id: createMembershipId("membership-1"),
          groupId,
          userId: createUserId("another-user"),
        }),
        createGroupMembership({
          id: createMembershipId("membership-2"),
          groupId,
          userId: actorId,
          isActive: false,
        }),
      ],
    });

    const decision = authorizeGroupSpaceAccess({ actor, context });

    expect(decision.canView).toBe(false);
    expect(decision.canEdit).toBe(false);
    expect(decision.reason).toBe(SPACE_ACCESS_REASON.NOT_GROUP_MEMBER);
    expect(decision.membership).toBeNull();
  });
});
