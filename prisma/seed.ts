import {
  Prisma,
  PrismaClient,
  type GroupAuditChangeKind,
  type ItemStatus,
  type ItemTemporalKind,
  type Priority,
} from "@prisma/client";
import { pathToFileURL } from "node:url";

import {
  MOCK_BOOTSTRAP_GROUP_IDS,
  MOCK_BOOTSTRAP_GROUPS,
  MOCK_BOOTSTRAP_MEMBERSHIP_IDS,
  MOCK_BOOTSTRAP_SPACE_IDS,
  MOCK_BOOTSTRAP_USER_IDS,
  MOCK_BOOTSTRAP_USERS,
} from "../src/lib/mock/bootstrap";

function createPrismaClient() {
  return new PrismaClient();
}

const GROUP_SEED_DETAILS = {
  [MOCK_BOOTSTRAP_GROUP_IDS.ALPHA]: {
    name: "Archive Circle Alpha",
    slug: "archive-circle-alpha",
  },
  [MOCK_BOOTSTRAP_GROUP_IDS.BETA]: {
    name: "Patrimony Guild Beta",
    slug: "patrimony-guild-beta",
  },
} as const;

const SEED_LABEL_IDS = {
  DEFAULT_FINANCE: "label-personal-user-1-finance",
  DEFAULT_FOCUS: "label-personal-user-1-focus",
  ALPHA_FINANCE: "label-group-alpha-finance",
  ALPHA_OPS: "label-group-alpha-ops",
  BETA_HERITAGE: "label-group-beta-heritage",
} as const;

const SEED_ITEM_IDS = {
  DEFAULT_PERSONAL_TASK: "seed-item-personal-default-task",
  DEFAULT_PERSONAL_EVENT: "seed-item-personal-default-event",
  ALPHA_ASSIGNED_TASK: "seed-item-group-alpha-assigned-task",
  ALPHA_UNASSIGNED_TASK: "seed-item-group-alpha-unassigned-task",
  BETA_ASSIGNED_TASK: "seed-item-group-beta-assigned-task",
} as const;

const SEED_AUDIT_ENTRY_IDS = {
  ALPHA_ASSIGNED_TASK_V1: "seed-audit-group-alpha-assigned-task-v1",
} as const;

const DEFAULT_CREATED_AT = new Date("2026-04-14T08:00:00.000Z");
const DEFAULT_UPDATED_AT = new Date("2026-04-15T08:00:00.000Z");
const PERSONAL_EVENT_START_AT = new Date("2026-04-18T15:00:00.000Z");
const ALPHA_ASSIGNED_TASK_CHANGED_AT = new Date("2026-04-15T10:00:00.000Z");

type TransactionClient = Prisma.TransactionClient;

interface SeedLabelRecord {
  id: string;
  value: string;
  ownerId: string | null;
  groupId: string | null;
}

interface SeedItemRecord {
  id: string;
  spaceId: string;
  spaceType: "personal" | "group";
  ownerId: string | null;
  groupId: string | null;
  itemType: "task" | "event";
  status: ItemStatus;
  priority: Priority;
  title: string;
  notes: string | null;
  temporalKind: ItemTemporalKind;
  startAt: Date | null;
  endAt: Date | null;
  dueAt: Date | null;
  postponedUntil: Date | null;
  completedAt: Date | null;
  canceledAt: Date | null;
  postponeCount: number;
  versionToken: number;
  createdAt: Date;
  updatedAt: Date;
}

interface SeedItemAssigneeRecord {
  itemId: string;
  userId: string;
  membershipId: string;
  createdAt: Date;
}

interface SeedItemLabelRecord {
  itemId: string;
  labelId: string;
  createdAt: Date;
}

interface SeedAuditChangeRecord {
  entryId: string;
  position: number;
  kind: GroupAuditChangeKind;
  beforeStatus?: ItemStatus | null;
  afterStatus?: ItemStatus | null;
  beforePriority?: Priority | null;
  afterPriority?: Priority | null;
  beforeTitle?: string | null;
  afterTitle?: string | null;
  beforeAssigneeIds?: string[];
  afterAssigneeIds?: string[];
  beforeLabelValues?: string[];
  afterLabelValues?: string[];
  beforeTemporalKind?: ItemTemporalKind | null;
  afterTemporalKind?: ItemTemporalKind | null;
  beforeStartAt?: Date | null;
  afterStartAt?: Date | null;
  beforeEndAt?: Date | null;
  afterEndAt?: Date | null;
  beforeDueAt?: Date | null;
  afterDueAt?: Date | null;
  beforeCompletedAt?: Date | null;
  afterCompletedAt?: Date | null;
  beforeIsCompleted?: boolean | null;
  afterIsCompleted?: boolean | null;
  beforeCanceledAt?: Date | null;
  afterCanceledAt?: Date | null;
  beforeIsCanceled?: boolean | null;
  afterIsCanceled?: boolean | null;
}

const SEED_LABELS = [
  {
    groupId: null,
    id: SEED_LABEL_IDS.DEFAULT_FINANCE,
    ownerId: MOCK_BOOTSTRAP_USER_IDS.DEFAULT,
    value: "finance",
  },
  {
    groupId: null,
    id: SEED_LABEL_IDS.DEFAULT_FOCUS,
    ownerId: MOCK_BOOTSTRAP_USER_IDS.DEFAULT,
    value: "focus",
  },
  {
    groupId: MOCK_BOOTSTRAP_GROUP_IDS.ALPHA,
    id: SEED_LABEL_IDS.ALPHA_FINANCE,
    ownerId: null,
    value: "finance",
  },
  {
    groupId: MOCK_BOOTSTRAP_GROUP_IDS.ALPHA,
    id: SEED_LABEL_IDS.ALPHA_OPS,
    ownerId: null,
    value: "ops",
  },
  {
    groupId: MOCK_BOOTSTRAP_GROUP_IDS.BETA,
    id: SEED_LABEL_IDS.BETA_HERITAGE,
    ownerId: null,
    value: "heritage",
  },
] as const satisfies readonly SeedLabelRecord[];

const SEED_ITEMS = [
  {
    canceledAt: null,
    completedAt: null,
    createdAt: DEFAULT_CREATED_AT,
    dueAt: null,
    endAt: null,
    groupId: null,
    id: SEED_ITEM_IDS.DEFAULT_PERSONAL_TASK,
    itemType: "task",
    notes: "Durable baseline task for the default personal workspace.",
    ownerId: MOCK_BOOTSTRAP_USER_IDS.DEFAULT,
    postponeCount: 0,
    postponedUntil: null,
    priority: "high",
    spaceId: MOCK_BOOTSTRAP_SPACE_IDS.DEFAULT_PERSONAL,
    spaceType: "personal",
    startAt: null,
    status: "pending",
    temporalKind: "undated",
    title: "Review Prisma persistence rollout",
    updatedAt: DEFAULT_UPDATED_AT,
    versionToken: 0,
  },
  {
    canceledAt: null,
    completedAt: null,
    createdAt: DEFAULT_CREATED_AT,
    dueAt: null,
    endAt: null,
    groupId: null,
    id: SEED_ITEM_IDS.DEFAULT_PERSONAL_EVENT,
    itemType: "event",
    notes: "Calendar coverage for persisted personal data.",
    ownerId: MOCK_BOOTSTRAP_USER_IDS.DEFAULT,
    postponeCount: 0,
    postponedUntil: null,
    priority: "medium",
    spaceId: MOCK_BOOTSTRAP_SPACE_IDS.DEFAULT_PERSONAL,
    spaceType: "personal",
    startAt: PERSONAL_EVENT_START_AT,
    status: "scheduled",
    temporalKind: "start",
    title: "Persistence alignment check-in",
    updatedAt: DEFAULT_UPDATED_AT,
    versionToken: 0,
  },
  {
    canceledAt: null,
    completedAt: null,
    createdAt: DEFAULT_CREATED_AT,
    dueAt: null,
    endAt: null,
    groupId: MOCK_BOOTSTRAP_GROUP_IDS.ALPHA,
    id: SEED_ITEM_IDS.ALPHA_ASSIGNED_TASK,
    itemType: "task",
    notes: "Assigned sample item with history, labels, and persisted membership linkage.",
    ownerId: null,
    postponeCount: 0,
    postponedUntil: null,
    priority: "urgent",
    spaceId: MOCK_BOOTSTRAP_SPACE_IDS.GROUP_ALPHA,
    spaceType: "group",
    startAt: null,
    status: "blocked",
    temporalKind: "undated",
    title: "Stabilize membership-backed runtime access",
    updatedAt: ALPHA_ASSIGNED_TASK_CHANGED_AT,
    versionToken: 1,
  },
  {
    canceledAt: null,
    completedAt: null,
    createdAt: DEFAULT_CREATED_AT,
    dueAt: null,
    endAt: null,
    groupId: MOCK_BOOTSTRAP_GROUP_IDS.ALPHA,
    id: SEED_ITEM_IDS.ALPHA_UNASSIGNED_TASK,
    itemType: "task",
    notes: "Unassigned group task to preserve visibility scenarios for all members.",
    ownerId: null,
    postponeCount: 0,
    postponedUntil: null,
    priority: "medium",
    spaceId: MOCK_BOOTSTRAP_SPACE_IDS.GROUP_ALPHA,
    spaceType: "group",
    startAt: null,
    status: "pending",
    temporalKind: "undated",
    title: "Review unassigned group visibility rules",
    updatedAt: DEFAULT_UPDATED_AT,
    versionToken: 0,
  },
  {
    canceledAt: null,
    completedAt: null,
    createdAt: DEFAULT_CREATED_AT,
    dueAt: null,
    endAt: null,
    groupId: MOCK_BOOTSTRAP_GROUP_IDS.BETA,
    id: SEED_ITEM_IDS.BETA_ASSIGNED_TASK,
    itemType: "task",
    notes: "Second-group sample item to prove cross-group reachability from memberships.",
    ownerId: null,
    postponeCount: 0,
    postponedUntil: null,
    priority: "high",
    spaceId: MOCK_BOOTSTRAP_SPACE_IDS.GROUP_BETA,
    spaceType: "group",
    startAt: null,
    status: "in_progress",
    temporalKind: "undated",
    title: "Catalog Beta backlog dependencies",
    updatedAt: DEFAULT_UPDATED_AT,
    versionToken: 0,
  },
] as const satisfies readonly SeedItemRecord[];

const SEED_ITEM_ASSIGNEES = [
  {
    createdAt: ALPHA_ASSIGNED_TASK_CHANGED_AT,
    itemId: SEED_ITEM_IDS.ALPHA_ASSIGNED_TASK,
    membershipId: MOCK_BOOTSTRAP_MEMBERSHIP_IDS.ALPHA_TEAMMATE,
    userId: MOCK_BOOTSTRAP_USER_IDS.TEAMMATE,
  },
  {
    createdAt: DEFAULT_UPDATED_AT,
    itemId: SEED_ITEM_IDS.BETA_ASSIGNED_TASK,
    membershipId: MOCK_BOOTSTRAP_MEMBERSHIP_IDS.BETA_GROUP_B_ONLY,
    userId: MOCK_BOOTSTRAP_USER_IDS.GROUP_B_ONLY,
  },
] as const satisfies readonly SeedItemAssigneeRecord[];

const SEED_ITEM_LABELS = [
  {
    createdAt: DEFAULT_UPDATED_AT,
    itemId: SEED_ITEM_IDS.DEFAULT_PERSONAL_TASK,
    labelId: SEED_LABEL_IDS.DEFAULT_FINANCE,
  },
  {
    createdAt: DEFAULT_UPDATED_AT,
    itemId: SEED_ITEM_IDS.DEFAULT_PERSONAL_TASK,
    labelId: SEED_LABEL_IDS.DEFAULT_FOCUS,
  },
  {
    createdAt: ALPHA_ASSIGNED_TASK_CHANGED_AT,
    itemId: SEED_ITEM_IDS.ALPHA_ASSIGNED_TASK,
    labelId: SEED_LABEL_IDS.ALPHA_FINANCE,
  },
  {
    createdAt: ALPHA_ASSIGNED_TASK_CHANGED_AT,
    itemId: SEED_ITEM_IDS.ALPHA_ASSIGNED_TASK,
    labelId: SEED_LABEL_IDS.ALPHA_OPS,
  },
  {
    createdAt: DEFAULT_UPDATED_AT,
    itemId: SEED_ITEM_IDS.ALPHA_UNASSIGNED_TASK,
    labelId: SEED_LABEL_IDS.ALPHA_FINANCE,
  },
  {
    createdAt: DEFAULT_UPDATED_AT,
    itemId: SEED_ITEM_IDS.BETA_ASSIGNED_TASK,
    labelId: SEED_LABEL_IDS.BETA_HERITAGE,
  },
] as const satisfies readonly SeedItemLabelRecord[];

const SEED_AUDIT_CHANGES = [
  {
    afterAssigneeIds: [MOCK_BOOTSTRAP_USER_IDS.TEAMMATE],
    beforeAssigneeIds: [],
    entryId: SEED_AUDIT_ENTRY_IDS.ALPHA_ASSIGNED_TASK_V1,
    kind: "assignees",
    position: 0,
  },
  {
    afterLabelValues: ["finance", "ops"],
    beforeLabelValues: ["finance"],
    entryId: SEED_AUDIT_ENTRY_IDS.ALPHA_ASSIGNED_TASK_V1,
    kind: "labels",
    position: 1,
  },
  {
    afterPriority: "urgent",
    beforePriority: "high",
    entryId: SEED_AUDIT_ENTRY_IDS.ALPHA_ASSIGNED_TASK_V1,
    kind: "priority",
    position: 2,
  },
  {
    afterStatus: "blocked",
    beforeStatus: "pending",
    entryId: SEED_AUDIT_ENTRY_IDS.ALPHA_ASSIGNED_TASK_V1,
    kind: "status",
    position: 3,
  },
  {
    afterTitle: "Stabilize membership-backed runtime access",
    beforeTitle: "Stabilize runtime access",
    entryId: SEED_AUDIT_ENTRY_IDS.ALPHA_ASSIGNED_TASK_V1,
    kind: "title",
    position: 4,
  },
] as const satisfies readonly SeedAuditChangeRecord[];

const SEED_ITEM_ID_VALUES = Object.values(SEED_ITEM_IDS);
const SEED_AUDIT_ENTRY_ID_VALUES = Object.values(SEED_AUDIT_ENTRY_IDS);

async function upsertUsers(tx: TransactionClient) {
  for (const user of MOCK_BOOTSTRAP_USERS) {
    await tx.user.upsert({
      create: {
        createdAt: DEFAULT_CREATED_AT,
        displayName: user.displayName,
        email: user.email,
        id: user.id,
        updatedAt: DEFAULT_UPDATED_AT,
      },
      update: {
        displayName: user.displayName,
        email: user.email,
        updatedAt: DEFAULT_UPDATED_AT,
      },
      where: { id: user.id },
    });
  }
}

async function upsertGroups(tx: TransactionClient) {
  for (const group of MOCK_BOOTSTRAP_GROUPS) {
    const details = GROUP_SEED_DETAILS[group.id];

    await tx.group.upsert({
      create: {
        createdAt: DEFAULT_CREATED_AT,
        id: group.id,
        name: details.name,
        slug: details.slug,
        updatedAt: DEFAULT_UPDATED_AT,
      },
      update: {
        name: details.name,
        slug: details.slug,
        updatedAt: DEFAULT_UPDATED_AT,
      },
      where: { id: group.id },
    });
  }
}

async function upsertSpaces(tx: TransactionClient) {
  for (const user of MOCK_BOOTSTRAP_USERS) {
    await tx.space.upsert({
      create: {
        createdAt: DEFAULT_CREATED_AT,
        id: user.personalSpaceId,
        ownerId: user.id,
        type: "personal",
        updatedAt: DEFAULT_UPDATED_AT,
      },
      update: {
        ownerId: user.id,
        type: "personal",
        updatedAt: DEFAULT_UPDATED_AT,
      },
      where: { id: user.personalSpaceId },
    });
  }

  for (const group of MOCK_BOOTSTRAP_GROUPS) {
    await tx.space.upsert({
      create: {
        createdAt: DEFAULT_CREATED_AT,
        groupId: group.id,
        id: group.spaceId,
        type: "group",
        updatedAt: DEFAULT_UPDATED_AT,
      },
      update: {
        groupId: group.id,
        type: "group",
        updatedAt: DEFAULT_UPDATED_AT,
      },
      where: { id: group.spaceId },
    });
  }
}

async function upsertMemberships(tx: TransactionClient) {
  for (const group of MOCK_BOOTSTRAP_GROUPS) {
    for (const membership of group.memberships) {
      await tx.membership.upsert({
        create: {
          createdAt: DEFAULT_CREATED_AT,
          groupId: group.id,
          id: membership.id,
          isActive: true,
          role: membership.role,
          updatedAt: DEFAULT_UPDATED_AT,
          userId: membership.userId,
        },
        update: {
          groupId: group.id,
          isActive: true,
          role: membership.role,
          updatedAt: DEFAULT_UPDATED_AT,
          userId: membership.userId,
        },
        where: { id: membership.id },
      });
    }
  }
}

async function upsertLabels(tx: TransactionClient) {
  for (const label of SEED_LABELS) {
    await tx.label.upsert({
      create: {
        createdAt: DEFAULT_CREATED_AT,
        groupId: label.groupId,
        id: label.id,
        ownerId: label.ownerId,
        updatedAt: DEFAULT_UPDATED_AT,
        value: label.value,
      },
      update: {
        groupId: label.groupId,
        ownerId: label.ownerId,
        updatedAt: DEFAULT_UPDATED_AT,
        value: label.value,
      },
      where: { id: label.id },
    });
  }
}

async function reseedItems(tx: TransactionClient) {
  await tx.groupAuditEntry.deleteMany({
    where: {
      OR: [
        { id: { in: SEED_AUDIT_ENTRY_ID_VALUES } },
        { itemId: { in: SEED_ITEM_ID_VALUES } },
      ],
    },
  });

  await tx.itemLabel.deleteMany({
    where: {
      itemId: { in: SEED_ITEM_ID_VALUES },
    },
  });

  await tx.itemAssignee.deleteMany({
    where: {
      itemId: { in: SEED_ITEM_ID_VALUES },
    },
  });

  await tx.item.deleteMany({
    where: {
      id: { in: SEED_ITEM_ID_VALUES },
    },
  });

  await tx.item.createMany({
    data: [...SEED_ITEMS],
  });

  await tx.itemAssignee.createMany({
    data: [...SEED_ITEM_ASSIGNEES],
  });

  await tx.itemLabel.createMany({
    data: [...SEED_ITEM_LABELS],
  });

  await tx.groupAuditEntry.create({
    data: {
      actorDisplayName: "Archive Partner",
      actorEmail: "partner@rollorian.dev",
      actorUserId: MOCK_BOOTSTRAP_USER_IDS.TEAMMATE,
      changedAt: ALPHA_ASSIGNED_TASK_CHANGED_AT,
      createdAt: ALPHA_ASSIGNED_TASK_CHANGED_AT,
      groupId: MOCK_BOOTSTRAP_GROUP_IDS.ALPHA,
      id: SEED_AUDIT_ENTRY_IDS.ALPHA_ASSIGNED_TASK_V1,
      itemId: SEED_ITEM_IDS.ALPHA_ASSIGNED_TASK,
      versionToken: 1,
    },
  });

  await tx.groupAuditChange.createMany({
    data: [...SEED_AUDIT_CHANGES],
  });
}

export async function seedDatabase(client: PrismaClient) {
  await client.$transaction(async (tx) => {
    await upsertUsers(tx);
    await upsertGroups(tx);
    await upsertSpaces(tx);
    await upsertMemberships(tx);
    await upsertLabels(tx);
    await reseedItems(tx);
  });
}

async function main() {
  const prisma = createPrismaClient();

  try {
    await seedDatabase(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
    .catch((error: unknown) => {
      console.error("Failed to seed Prisma persistence data.", error);
      process.exitCode = 1;
    });
}
