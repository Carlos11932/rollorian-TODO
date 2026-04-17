import { beforeEach, describe, expect, it, vi } from "vitest";

import { createGroupSpaceAccessContext, createPersonalSpaceAccessContext } from "@/domain/access";
import { createGroupMembership } from "@/domain/identity";
import { createGroupItemScope, createPersonalItemScope } from "@/domain/item";
import { createGroupId, createMembershipId, createSpaceId, createUserId } from "@/domain/shared";

const mocks = vi.hoisted(() => ({
  hydrateGroupCommandSpace: vi.fn(),
  hydratePersonalCommandSpace: vi.fn(),
  listMembershipsByGroupId: vi.fn(),
  listVisibleGroupIdsForActor: vi.fn(),
  prisma: {},
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/prisma", () => ({
  prisma: mocks.prisma,
}));

vi.mock("@/interfaces/persistence/prisma", () => {
  class PrismaMembershipResolverError extends Error {
    public constructor(message: string) {
      super(message);
      this.name = "PrismaMembershipResolverError";
    }
  }

  class PrismaMembershipResolver {
    public constructor() {
      return {
        hydrateGroupCommandSpace: mocks.hydrateGroupCommandSpace,
        hydratePersonalCommandSpace: mocks.hydratePersonalCommandSpace,
        listMembershipsByGroupId: mocks.listMembershipsByGroupId,
        listVisibleGroupIdsForActor: mocks.listVisibleGroupIdsForActor,
      };
    }
  }

  return {
    PrismaMembershipResolver,
    PrismaMembershipResolverError,
  };
});

import {
  MOCK_ACTOR,
  MOCK_ACTOR_HEADER,
  MOCK_GROUP_ALPHA_ID,
  MOCK_GROUP_ALPHA_SPACE_ID,
  MOCK_PERSONAL_SPACE_ID,
  MOCK_TEAMMATE_USER_ID,
  createMockGroupCommandSpace,
  createMockPersonalCommandSpace,
  resolveMockActor,
  resolveMockGroupMemberships,
  resolveMockPersonalSpaceId,
  resolveMockVisibleGroupIds,
} from "@/lib/mock/actor";

describe("mock actor prisma-backed resolution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps header-based actor selection for development requests", () => {
    const request = new Request("http://localhost/api/test", {
      headers: {
        [MOCK_ACTOR_HEADER]: MOCK_TEAMMATE_USER_ID,
      },
    });

    expect(resolveMockActor(request).userId).toBe(MOCK_TEAMMATE_USER_ID);
    expect(resolveMockActor(new Request("http://localhost/api/test"))).toBe(MOCK_ACTOR);
  });

  it("delegates visible groups and memberships to the Prisma membership resolver", async () => {
    const visibleGroupIds = [createGroupId("group-alpha"), createGroupId("group-beta")];
    const memberships = [
      createGroupMembership({
        groupId: MOCK_GROUP_ALPHA_ID,
        id: createMembershipId("membership-alpha-user-1"),
        role: "member",
        userId: MOCK_ACTOR.userId,
      }),
    ];

    mocks.listVisibleGroupIdsForActor.mockResolvedValue(visibleGroupIds);
    mocks.listMembershipsByGroupId.mockResolvedValue(memberships);

    await expect(resolveMockVisibleGroupIds(MOCK_ACTOR)).resolves.toEqual(visibleGroupIds);
    await expect(resolveMockGroupMemberships(MOCK_GROUP_ALPHA_ID)).resolves.toEqual(memberships);

    expect(mocks.listVisibleGroupIdsForActor).toHaveBeenCalledWith(MOCK_ACTOR.userId);
    expect(mocks.listMembershipsByGroupId).toHaveBeenCalledWith(MOCK_GROUP_ALPHA_ID);
  });

  it("hydrates personal and group command spaces from persisted Prisma truth", async () => {
    const personalCommandSpace = {
      accessContext: createPersonalSpaceAccessContext({
        ownerId: MOCK_ACTOR.userId,
        spaceId: MOCK_PERSONAL_SPACE_ID,
      }),
      scope: createPersonalItemScope({ ownerId: MOCK_ACTOR.userId }),
    } as const;
    const groupMemberships = [
      createGroupMembership({
        groupId: MOCK_GROUP_ALPHA_ID,
        id: createMembershipId("membership-alpha-user-1"),
        role: "member",
        userId: MOCK_ACTOR.userId,
      }),
    ];
    const groupCommandSpace = {
      accessContext: createGroupSpaceAccessContext({
        groupId: MOCK_GROUP_ALPHA_ID,
        memberships: groupMemberships,
        spaceId: MOCK_GROUP_ALPHA_SPACE_ID,
      }),
      scope: createGroupItemScope({
        groupId: MOCK_GROUP_ALPHA_ID,
        memberships: groupMemberships,
      }),
    } as const;

    mocks.hydratePersonalCommandSpace.mockResolvedValue(personalCommandSpace);
    mocks.hydrateGroupCommandSpace.mockResolvedValue(groupCommandSpace);

    await expect(resolveMockPersonalSpaceId(MOCK_ACTOR.userId)).resolves.toBe(MOCK_PERSONAL_SPACE_ID);
    await expect(
      createMockPersonalCommandSpace(MOCK_ACTOR.userId, MOCK_PERSONAL_SPACE_ID),
    ).resolves.toEqual(personalCommandSpace);
    await expect(
      createMockGroupCommandSpace(MOCK_GROUP_ALPHA_ID, MOCK_GROUP_ALPHA_SPACE_ID),
    ).resolves.toEqual(groupCommandSpace);

    expect(mocks.hydratePersonalCommandSpace).toHaveBeenCalledWith(MOCK_ACTOR.userId);
    expect(mocks.hydrateGroupCommandSpace).toHaveBeenCalledWith(MOCK_GROUP_ALPHA_ID);
  });

  it("fails loudly when requested mock space diverges from persisted space", async () => {
    mocks.hydratePersonalCommandSpace.mockResolvedValue({
      accessContext: createPersonalSpaceAccessContext({
        ownerId: MOCK_ACTOR.userId,
        spaceId: MOCK_PERSONAL_SPACE_ID,
      }),
      scope: createPersonalItemScope({ ownerId: MOCK_ACTOR.userId }),
    });

    await expect(
      createMockPersonalCommandSpace(MOCK_ACTOR.userId, createSpaceId("space-personal-mismatch")),
    ).rejects.toThrow('Requested personal space "space-personal-mismatch" does not match persisted space');
  });

  it("fails loudly when persisted command space hydration is missing", async () => {
    mocks.hydrateGroupCommandSpace.mockResolvedValue(null);

    await expect(createMockGroupCommandSpace(MOCK_GROUP_ALPHA_ID)).rejects.toThrow(
      'Persisted group command space not found for group "group-alpha".',
    );
  });
});
