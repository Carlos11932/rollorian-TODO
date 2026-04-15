import { Prisma } from "@prisma/client";

export const PRISMA_ITEM_ASSIGNEE_ORDER_BY: Prisma.ItemAssigneeOrderByWithRelationInput[] = [
  { createdAt: Prisma.SortOrder.asc },
  { userId: Prisma.SortOrder.asc },
] as const;

export const PRISMA_ITEM_LABEL_ORDER_BY: Prisma.ItemLabelOrderByWithRelationInput[] = [
  { createdAt: Prisma.SortOrder.asc },
  { labelId: Prisma.SortOrder.asc },
] as const;

export const PRISMA_GROUP_AUDIT_CHANGE_ORDER_BY: Prisma.GroupAuditChangeOrderByWithRelationInput[] = [
  { position: Prisma.SortOrder.asc },
] as const;

export const prismaUserIdentitySelect = {
  id: true,
  displayName: true,
  email: true,
} as const satisfies Prisma.UserSelect;

export const prismaSpaceRowSelect = {
  id: true,
  type: true,
  ownerId: true,
  groupId: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.SpaceSelect;

export const prismaGroupIdentityWithSpaceSelect = {
  id: true,
  name: true,
  slug: true,
  space: {
    select: prismaSpaceRowSelect,
  },
} as const satisfies Prisma.GroupSelect;

export const prismaMembershipRowSelect = {
  id: true,
  userId: true,
  groupId: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.MembershipSelect;

export const prismaMembershipAggregateArgs = {
  select: {
    ...prismaMembershipRowSelect,
    user: {
      select: prismaUserIdentitySelect,
    },
    group: {
      select: prismaGroupIdentityWithSpaceSelect,
    },
  },
} as const satisfies Prisma.MembershipDefaultArgs;

export const prismaLabelRowSelect = {
  id: true,
  value: true,
  ownerId: true,
  groupId: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.LabelSelect;

export const prismaItemRowSelect = {
  id: true,
  spaceId: true,
  spaceType: true,
  ownerId: true,
  groupId: true,
  itemType: true,
  status: true,
  priority: true,
  title: true,
  notes: true,
  temporalKind: true,
  startAt: true,
  endAt: true,
  dueAt: true,
  postponedUntil: true,
  completedAt: true,
  canceledAt: true,
  postponeCount: true,
  versionToken: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.ItemSelect;

export const prismaItemAssigneeAggregateArgs = {
  select: {
    itemId: true,
    userId: true,
    membershipId: true,
    createdAt: true,
    user: {
      select: prismaUserIdentitySelect,
    },
    membership: {
      select: prismaMembershipRowSelect,
    },
  },
} as const satisfies Prisma.ItemAssigneeDefaultArgs;

export const prismaItemLabelAggregateArgs = {
  select: {
    itemId: true,
    labelId: true,
    createdAt: true,
    label: {
      select: prismaLabelRowSelect,
    },
  },
} as const satisfies Prisma.ItemLabelDefaultArgs;

export const prismaItemAggregateArgs = {
  select: {
    ...prismaItemRowSelect,
    assignees: {
      orderBy: PRISMA_ITEM_ASSIGNEE_ORDER_BY,
      ...prismaItemAssigneeAggregateArgs,
    },
    labels: {
      orderBy: PRISMA_ITEM_LABEL_ORDER_BY,
      ...prismaItemLabelAggregateArgs,
    },
  },
} as const satisfies Prisma.ItemDefaultArgs;

export const prismaGroupAuditChangeRowSelect = {
  entryId: true,
  position: true,
  kind: true,
  beforeStatus: true,
  afterStatus: true,
  beforePriority: true,
  afterPriority: true,
  beforeTitle: true,
  afterTitle: true,
  beforeAssigneeIds: true,
  afterAssigneeIds: true,
  beforeLabelValues: true,
  afterLabelValues: true,
  beforeTemporalKind: true,
  afterTemporalKind: true,
  beforeStartAt: true,
  afterStartAt: true,
  beforeEndAt: true,
  afterEndAt: true,
  beforeDueAt: true,
  afterDueAt: true,
  beforeCompletedAt: true,
  afterCompletedAt: true,
  beforeIsCompleted: true,
  afterIsCompleted: true,
  beforeCanceledAt: true,
  afterCanceledAt: true,
  beforeIsCanceled: true,
  afterIsCanceled: true,
} as const satisfies Prisma.GroupAuditChangeSelect;

export const prismaGroupAuditEntryRowSelect = {
  id: true,
  groupId: true,
  itemId: true,
  actorUserId: true,
  actorDisplayName: true,
  actorEmail: true,
  versionToken: true,
  changedAt: true,
  createdAt: true,
} as const satisfies Prisma.GroupAuditEntrySelect;

export const prismaGroupAuditEntryAggregateArgs = {
  select: {
    ...prismaGroupAuditEntryRowSelect,
    actor: {
      select: prismaUserIdentitySelect,
    },
    changes: {
      orderBy: PRISMA_GROUP_AUDIT_CHANGE_ORDER_BY,
      select: prismaGroupAuditChangeRowSelect,
    },
  },
} as const satisfies Prisma.GroupAuditEntryDefaultArgs;

export type PrismaUserIdentityRow = Prisma.UserGetPayload<{
  select: typeof prismaUserIdentitySelect;
}>;

export type PrismaSpaceRow = Prisma.SpaceGetPayload<{
  select: typeof prismaSpaceRowSelect;
}>;

export type PrismaGroupIdentityWithSpaceRow = Prisma.GroupGetPayload<{
  select: typeof prismaGroupIdentityWithSpaceSelect;
}>;

export type PrismaMembershipRow = Prisma.MembershipGetPayload<{
  select: typeof prismaMembershipRowSelect;
}>;

export type PrismaMembershipAggregate = Prisma.MembershipGetPayload<
  typeof prismaMembershipAggregateArgs
>;

export type PrismaLabelRow = Prisma.LabelGetPayload<{
  select: typeof prismaLabelRowSelect;
}>;

export type PrismaItemRow = Prisma.ItemGetPayload<{
  select: typeof prismaItemRowSelect;
}>;

export type PrismaItemAssigneeAggregate = Prisma.ItemAssigneeGetPayload<
  typeof prismaItemAssigneeAggregateArgs
>;

export type PrismaItemLabelAggregate = Prisma.ItemLabelGetPayload<
  typeof prismaItemLabelAggregateArgs
>;

export type PrismaItemAggregate = Prisma.ItemGetPayload<typeof prismaItemAggregateArgs>;

export type PrismaGroupAuditChangeRow = Prisma.GroupAuditChangeGetPayload<{
  select: typeof prismaGroupAuditChangeRowSelect;
}>;

export type PrismaGroupAuditEntryRow = Prisma.GroupAuditEntryGetPayload<{
  select: typeof prismaGroupAuditEntryRowSelect;
}>;

export type PrismaGroupAuditEntryAggregate = Prisma.GroupAuditEntryGetPayload<
  typeof prismaGroupAuditEntryAggregateArgs
>;
