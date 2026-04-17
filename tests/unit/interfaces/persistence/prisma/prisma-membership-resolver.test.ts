import type { PrismaClient } from "@prisma/client";

import {
  createGroupId,
  createMembershipId,
  createSpaceId,
  createUserId,
  SPACE_TYPE,
} from "@/domain/shared";
import {
  PrismaMembershipResolver,
  PrismaMembershipResolverInvariantError,
  type PrismaMembershipAggregate,
} from "@/interfaces/persistence/prisma";
import { describe, expect, it, vi } from "vitest";

function createMockClient() {
  return {
    group: {
      findUnique: vi.fn(),
    },
    membership: {
      findMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  };
}

function createMembershipAggregate(
  overrides: Partial<PrismaMembershipAggregate> = {},
): PrismaMembershipAggregate {
  const groupId = overrides.groupId ?? "group-alpha";
  const userId = overrides.userId ?? "user-1";

  return {
    createdAt: new Date("2026-04-15T08:00:00.000Z"),
    group: {
      id: groupId,
      name: `Group ${groupId}`,
      slug: groupId,
      space: {
        createdAt: new Date("2026-04-15T08:00:00.000Z"),
        groupId,
        id: `space-${groupId}`,
        ownerId: null,
        type: SPACE_TYPE.GROUP,
        updatedAt: new Date("2026-04-15T08:00:00.000Z"),
      },
    },
    groupId,
    id: overrides.id ?? `membership-${groupId}-${userId}`,
    isActive: overrides.isActive ?? true,
    role: overrides.role ?? "member",
    updatedAt: new Date("2026-04-15T08:00:00.000Z"),
    user: {
      name: `User ${userId}`,
      email: `${userId}@example.com`,
      id: userId,
    },
    userId,
    ...overrides,
  };
}

describe("PrismaMembershipResolver", () => {
  it("looks up persisted actors by user id", async () => {
    const client = createMockClient();
    const resolver = new PrismaMembershipResolver(client as unknown as PrismaClient);

    client.user.findUnique.mockResolvedValue({
      name: "Curator",
      email: "curator@example.com",
      id: "user-1",
    });

    const actor = await resolver.findActorByUserId(createUserId("user-1"));

    expect(client.user.findUnique).toHaveBeenCalledWith({
      select: {
        name: true,
        email: true,
        id: true,
      },
      where: { id: "user-1" },
    });
    expect(actor).toEqual({
      metadata: {
        actorId: createUserId("user-1"),
        displayName: "Curator",
        email: "curator@example.com",
      },
      userId: createUserId("user-1"),
    });
  });

  it("resolves multi-group visibility from active persisted memberships only", async () => {
    const client = createMockClient();
    const resolver = new PrismaMembershipResolver(client as unknown as PrismaClient);

    client.membership.findMany.mockResolvedValue([
      { groupId: "group-alpha" },
      { groupId: "group-beta" },
    ]);

    const visibleGroupIds = await resolver.listVisibleGroupIdsForActor(
      createUserId("user-1"),
    );

    expect(client.membership.findMany).toHaveBeenCalledWith({
      orderBy: [
        { createdAt: "asc" },
        { userId: "asc" },
        { id: "asc" },
      ],
      select: { groupId: true },
      where: {
        isActive: true,
        userId: "user-1",
      },
    });
    expect(visibleGroupIds).toEqual([
      createGroupId("group-alpha"),
      createGroupId("group-beta"),
    ]);
  });

  it("hydrates group command space with persisted memberships including inactive members", async () => {
    const client = createMockClient();
    const resolver = new PrismaMembershipResolver(client as unknown as PrismaClient);

    client.group.findUnique.mockResolvedValue({
      id: "group-alpha",
      name: "Archive Circle Alpha",
      slug: "archive-circle-alpha",
      space: {
        createdAt: new Date("2026-04-15T08:00:00.000Z"),
        groupId: "group-alpha",
        id: "space-group-alpha",
        ownerId: null,
        type: SPACE_TYPE.GROUP,
        updatedAt: new Date("2026-04-15T08:00:00.000Z"),
      },
    });
    client.membership.findMany.mockResolvedValue([
      createMembershipAggregate({
        groupId: "group-alpha",
        id: "membership-active",
        isActive: true,
        userId: "user-1",
      }),
      createMembershipAggregate({
        groupId: "group-alpha",
        id: "membership-inactive",
        isActive: false,
        userId: "user-2",
      }),
    ]);

    const space = await resolver.hydrateGroupCommandSpace(createGroupId("group-alpha"));

    expect(space).not.toBeNull();
    expect(space?.accessContext.spaceId).toBe(createSpaceId("space-group-alpha"));
    expect(space?.accessContext.memberships).toBe(space?.scope.memberships);
    expect(space?.accessContext.memberships).toEqual([
      {
        groupId: createGroupId("group-alpha"),
        id: createMembershipId("membership-active"),
        isActive: true,
        role: "member",
        userId: createUserId("user-1"),
      },
      {
        groupId: createGroupId("group-alpha"),
        id: createMembershipId("membership-inactive"),
        isActive: false,
        role: "member",
        userId: createUserId("user-2"),
      },
    ]);
  });

  it("fails loudly when a persisted group is missing its space hydration", async () => {
    const client = createMockClient();
    const resolver = new PrismaMembershipResolver(client as unknown as PrismaClient);

    client.group.findUnique.mockResolvedValue({
      id: "group-alpha",
      name: "Archive Circle Alpha",
      slug: "archive-circle-alpha",
      space: null,
    });

    await expect(
      resolver.hydrateGroupCommandSpace(createGroupId("group-alpha")),
    ).rejects.toBeInstanceOf(PrismaMembershipResolverInvariantError);
    expect(client.membership.findMany).not.toHaveBeenCalled();
  });
});
