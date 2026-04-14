import {
  createGroupItemScope,
  createPersonalItemScope,
  validateItemAssignment,
} from "@/domain/item";
import {
  createGroupMembership,
  MEMBERSHIP_ROLE,
} from "@/domain/identity";
import {
  createGroupId,
  createMembershipId,
  createUserId,
} from "@/domain/shared";

describe("assignment policy", () => {
  it("supports unassigned, single-assigned, and multi-assigned group items", () => {
    const groupId = createGroupId("group-1");
    const anaId = createUserId("ana");
    const benId = createUserId("ben");
    const crisId = createUserId("cris");
    const scope = createGroupItemScope({
      groupId,
      memberships: [
        createGroupMembership({
          id: createMembershipId("membership-1"),
          groupId,
          userId: anaId,
          role: MEMBERSHIP_ROLE.OWNER,
        }),
        createGroupMembership({
          id: createMembershipId("membership-2"),
          groupId,
          userId: benId,
        }),
        createGroupMembership({
          id: createMembershipId("membership-3"),
          groupId,
          userId: crisId,
        }),
      ],
    });

    expect(validateItemAssignment({ scope, assigneeIds: [] })).toMatchObject({
      isValid: true,
      assigneeIds: [],
    });

    expect(
      validateItemAssignment({ scope, assigneeIds: [anaId] }),
    ).toMatchObject({
      isValid: true,
      assigneeIds: [anaId],
    });

    expect(
      validateItemAssignment({ scope, assigneeIds: [anaId, benId, anaId] }),
    ).toMatchObject({
      isValid: true,
      assigneeIds: [anaId, benId],
    });
  });

  it("rejects group assignees who are not active members", () => {
    const groupId = createGroupId("group-1");
    const anaId = createUserId("ana");
    const benId = createUserId("ben");
    const outsiderId = createUserId("outsider");
    const scope = createGroupItemScope({
      groupId,
      memberships: [
        createGroupMembership({
          id: createMembershipId("membership-1"),
          groupId,
          userId: anaId,
        }),
        createGroupMembership({
          id: createMembershipId("membership-2"),
          groupId,
          userId: benId,
          isActive: false,
        }),
      ],
    });

    const result = validateItemAssignment({
      scope,
      assigneeIds: [anaId, benId, outsiderId],
    });

    expect(result.isValid).toBe(false);
    expect(result.violations).toContain(
      "Group items may only assign active group members: ben.",
    );
    expect(result.violations).toContain(
      "Group items may only assign active group members: outsider.",
    );
  });

  it("restricts personal-space assignees to the owner only", () => {
    const ownerId = createUserId("owner");
    const teammateId = createUserId("teammate");
    const scope = createPersonalItemScope({ ownerId });

    expect(
      validateItemAssignment({ scope, assigneeIds: [] }),
    ).toMatchObject({
      isValid: true,
      assigneeIds: [],
    });

    expect(
      validateItemAssignment({ scope, assigneeIds: [ownerId] }),
    ).toMatchObject({
      isValid: true,
      assigneeIds: [ownerId],
    });

    const invalidAssignment = validateItemAssignment({
      scope,
      assigneeIds: [ownerId, teammateId],
    });

    expect(invalidAssignment.isValid).toBe(false);
    expect(invalidAssignment.violations).toEqual([
      "Personal items may only assign the personal owner.",
    ]);
  });
});
