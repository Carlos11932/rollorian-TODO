import type { PrismaClient } from "@prisma/client";

import type { GroupCommandSpace, PersonalCommandSpace } from "@/application/commands";
import {
  createGroupSpaceAccessContext,
  createPersonalSpaceAccessContext,
} from "@/domain/access";
import {
  createAuthorizationActor,
  createGroupMembership,
  createUserIdentity,
  type AuthorizationActor,
  type GroupMembership,
} from "@/domain/identity";
import {
  createGroupItemScope,
  createPersonalItemScope,
} from "@/domain/item";
import {
  createGroupId,
  createMembershipId,
  createSpaceId,
  createUserId,
  SPACE_TYPE,
  type GroupId,
  type UserId,
} from "@/domain/shared";

import {
  PRISMA_MEMBERSHIP_ORDER_BY,
  prismaGroupIdentityWithSpaceSelect,
  prismaMembershipAggregateArgs,
  prismaUserIdentitySelect,
  prismaUserIdentityWithPersonalSpaceSelect,
  type PrismaGroupIdentityWithSpaceRow,
  type PrismaMembershipAggregate,
  type PrismaUserIdentityRow,
  type PrismaUserIdentityWithPersonalSpaceRow,
} from "./runtime-aggregates";

type PrismaMembershipResolverClient = Pick<
  PrismaClient,
  "group" | "membership" | "user"
>;

const prismaVisibleGroupMembershipSelect = {
  groupId: true,
} as const;

export class PrismaMembershipResolverError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class PrismaMembershipResolverInvariantError extends PrismaMembershipResolverError {}

function mapPrismaUserIdentityRowToAuthorizationActor(
  row: PrismaUserIdentityRow,
): AuthorizationActor {
  return createAuthorizationActor(
    createUserIdentity({
      displayName: row.name,
      email: row.email,
      id: createUserId(row.id),
    }),
  );
}

function mapPrismaMembershipAggregateToGroupMembership(
  membership: PrismaMembershipAggregate,
): GroupMembership {
  return createGroupMembership({
    groupId: createGroupId(membership.groupId),
    id: createMembershipId(membership.id),
    isActive: membership.isActive,
    role: membership.role,
    userId: createUserId(membership.userId),
  });
}

function assertPersonalSpaceInvariant(
  user: PrismaUserIdentityWithPersonalSpaceRow,
): string {
  const { personalSpace } = user;

  if (personalSpace === null) {
    throw new PrismaMembershipResolverInvariantError(
      `Persisted user ${user.id} is missing a personal space.`,
    );
  }

  if (personalSpace.type !== SPACE_TYPE.PERSONAL || personalSpace.ownerId !== user.id) {
    throw new PrismaMembershipResolverInvariantError(
      `Persisted personal space for user ${user.id} is inconsistent.`,
    );
  }

  return personalSpace.id;
}

function assertGroupSpaceInvariant(group: PrismaGroupIdentityWithSpaceRow): string {
  const { space } = group;

  if (space === null) {
    throw new PrismaMembershipResolverInvariantError(
      `Persisted group ${group.id} is missing a group space.`,
    );
  }

  if (space.type !== SPACE_TYPE.GROUP || space.groupId !== group.id) {
    throw new PrismaMembershipResolverInvariantError(
      `Persisted group space for group ${group.id} is inconsistent.`,
    );
  }

  return space.id;
}

export class PrismaMembershipResolver {
  public constructor(private readonly client: PrismaMembershipResolverClient) {}

  public async findActorByUserId(userId: UserId): Promise<AuthorizationActor | null> {
    const user = await this.client.user.findUnique({
      select: prismaUserIdentitySelect,
      where: { id: userId },
    });

    return user === null ? null : mapPrismaUserIdentityRowToAuthorizationActor(user);
  }

  public async listVisibleGroupIdsForActor(
    actorUserId: UserId,
  ): Promise<readonly GroupId[]> {
    const memberships = await this.client.membership.findMany({
      orderBy: PRISMA_MEMBERSHIP_ORDER_BY,
      select: prismaVisibleGroupMembershipSelect,
      where: {
        isActive: true,
        userId: actorUserId,
      },
    });

    return memberships.map((membership) => createGroupId(membership.groupId));
  }

  public async listMembershipsByGroupId(
    groupId: GroupId,
  ): Promise<readonly GroupMembership[]> {
    const memberships = await this.client.membership.findMany({
      ...prismaMembershipAggregateArgs,
      orderBy: PRISMA_MEMBERSHIP_ORDER_BY,
      where: { groupId },
    });

    return memberships.map((membership) =>
      mapPrismaMembershipAggregateToGroupMembership(membership),
    );
  }

  public async hydratePersonalCommandSpace(
    ownerId: UserId,
  ): Promise<PersonalCommandSpace | null> {
    const user = await this.client.user.findUnique({
      select: prismaUserIdentityWithPersonalSpaceSelect,
      where: { id: ownerId },
    });

    if (user === null) {
      return null;
    }

    const spaceId = createSpaceId(assertPersonalSpaceInvariant(user));

    return {
      accessContext: createPersonalSpaceAccessContext({ ownerId, spaceId }),
      scope: createPersonalItemScope({ ownerId }),
    };
  }

  public async hydrateGroupCommandSpace(
    groupId: GroupId,
  ): Promise<GroupCommandSpace | null> {
    const group = await this.client.group.findUnique({
      select: prismaGroupIdentityWithSpaceSelect,
      where: { id: groupId },
    });

    if (group === null) {
      return null;
    }

    const spaceId = createSpaceId(assertGroupSpaceInvariant(group));
    const memberships = await this.listMembershipsByGroupId(groupId);

    return {
      accessContext: createGroupSpaceAccessContext({
        groupId,
        memberships,
        spaceId,
      }),
      scope: createGroupItemScope({
        groupId,
        memberships,
      }),
    };
  }
}
