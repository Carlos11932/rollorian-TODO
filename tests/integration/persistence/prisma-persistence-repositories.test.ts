import type { PrismaClient } from "@prisma/client";

import type { GroupItemRecord } from "@/application/commands/shared";
import { GROUP_ITEM_AUDIT_CHANGE_KIND, type GroupItemAuditEntry } from "@/domain/history";
import {
  createItemLabel,
  createTaskDueDateTemporal,
  createTaskPendingLifecycle,
  createTaskItem,
  createTaskUndatedTemporal,
} from "@/domain/item";
import {
  createGroupId,
  createItemId,
  createSpaceId,
  createUserId,
  createVersionToken,
  ITEM_TYPE,
  PRIORITY,
  SPACE_TYPE,
} from "@/domain/shared";
import {
  PrismaGroupItemHistoryRepository,
  PrismaItemCommandRepository,
  PrismaMembershipResolver,
} from "@/interfaces/persistence/prisma";
import {
  MOCK_GROUP_ALPHA_ID,
  MOCK_GROUP_ALPHA_SPACE_ID,
  MOCK_GROUP_BETA_ID,
  MOCK_GROUP_B_ONLY_USER_ID,
  MOCK_OUTSIDER_USER_ID,
  MOCK_TEAMMATE_USER_ID,
  MOCK_USER_ID,
} from "@/lib/mock/actor";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createDockerPrismaHarness,
  type DockerPrismaHarness,
} from "../api/prisma-test-harness";

vi.mock("server-only", () => ({}));

function createGroupTaskRecord(input: {
  itemId: string;
  labels: readonly string[];
  title: string;
  versionToken?: number;
}): GroupItemRecord {
  const createdAt = new Date("2026-04-17T12:00:00.000Z");
  const updatedAt = new Date("2026-04-17T12:00:00.000Z");

  return {
    assigneeIds: [],
    groupId: createGroupId(MOCK_GROUP_ALPHA_ID),
    item: createTaskItem({
      createdAt,
      id: createItemId(input.itemId),
      itemType: ITEM_TYPE.TASK,
      lifecycle: createTaskPendingLifecycle(),
      priority: PRIORITY.MEDIUM,
      spaceId: createSpaceId(MOCK_GROUP_ALPHA_SPACE_ID),
      spaceType: SPACE_TYPE.GROUP,
      temporal: createTaskUndatedTemporal(),
      title: input.title,
      updatedAt,
      versionToken: createVersionToken(input.versionToken ?? 0),
    }),
    labels: input.labels.map((label) => createItemLabel(label)),
    ownerId: null,
    spaceType: SPACE_TYPE.GROUP,
  };
}

describe("Prisma persistence repositories (integration)", () => {
  let prismaHarness: DockerPrismaHarness;
  let prisma: PrismaClient;

  beforeAll(async () => {
    prismaHarness = await createDockerPrismaHarness();
    prisma = prismaHarness.prisma;
  }, 120_000);

  beforeEach(async () => {
    vi.resetModules();
    await prismaHarness.resetDatabase();
  });

  afterAll(async () => {
    if (prismaHarness !== undefined) {
      await prismaHarness.stop();
    }
  }, 120_000);

  it("reconstructs persisted audit entries with ordered semantic changes", async () => {
    const repository = new PrismaGroupItemHistoryRepository(prisma);
    const entry: GroupItemAuditEntry = {
      actor: {
        actorId: createUserId(MOCK_USER_ID),
        displayName: "Curator Snapshot",
        email: "snapshot@rollorian.dev",
      },
      changedAt: new Date("2026-04-17T13:00:00.000Z"),
      changes: [
        {
          after: "Stabilize membership-backed runtime access v2",
          before: "Stabilize membership-backed runtime access",
          kind: GROUP_ITEM_AUDIT_CHANGE_KIND.TITLE,
        },
        {
          after: {
            dueAt: new Date("2026-04-22T12:00:00.000Z"),
            endAt: null,
            startAt: null,
            temporalKind: createTaskDueDateTemporal(new Date("2026-04-22T12:00:00.000Z")).kind,
          },
          before: {
            dueAt: null,
            endAt: null,
            startAt: null,
            temporalKind: createTaskUndatedTemporal().kind,
          },
          kind: GROUP_ITEM_AUDIT_CHANGE_KIND.DATES,
        },
        {
          after: [createUserId(MOCK_TEAMMATE_USER_ID)],
          before: [],
          kind: GROUP_ITEM_AUDIT_CHANGE_KIND.ASSIGNEES,
        },
        {
          after: ["finance", "ops"],
          before: ["finance"],
          kind: GROUP_ITEM_AUDIT_CHANGE_KIND.LABELS,
        },
        {
          after: {
            completedAt: new Date("2026-04-23T09:00:00.000Z"),
            isCompleted: true,
          },
          before: {
            completedAt: null,
            isCompleted: false,
          },
          kind: GROUP_ITEM_AUDIT_CHANGE_KIND.COMPLETION,
        },
      ],
      groupId: createGroupId(MOCK_GROUP_ALPHA_ID),
      itemId: createItemId("seed-item-group-alpha-assigned-task"),
      versionToken: createVersionToken(2),
    };

    await repository.append(entry);

    const entries = await repository.listByItemId(createItemId("seed-item-group-alpha-assigned-task"));
    const appendedEntry = entries.find((candidate) => candidate.versionToken === createVersionToken(2));

    expect(appendedEntry).toEqual({
      actor: {
        actorId: createUserId(MOCK_USER_ID),
        displayName: "Curator Snapshot",
        email: "snapshot@rollorian.dev",
      },
      changedAt: new Date("2026-04-17T13:00:00.000Z"),
      changes: [
        {
          after: "Stabilize membership-backed runtime access v2",
          before: "Stabilize membership-backed runtime access",
          kind: GROUP_ITEM_AUDIT_CHANGE_KIND.TITLE,
        },
        {
          after: {
            dueAt: new Date("2026-04-22T12:00:00.000Z"),
            endAt: null,
            startAt: null,
            temporalKind: "due_date",
          },
          before: {
            dueAt: null,
            endAt: null,
            startAt: null,
            temporalKind: "undated",
          },
          kind: GROUP_ITEM_AUDIT_CHANGE_KIND.DATES,
        },
        {
          after: [createUserId(MOCK_TEAMMATE_USER_ID)],
          before: [],
          kind: GROUP_ITEM_AUDIT_CHANGE_KIND.ASSIGNEES,
        },
        {
          after: ["finance", "ops"],
          before: ["finance"],
          kind: GROUP_ITEM_AUDIT_CHANGE_KIND.LABELS,
        },
        {
          after: {
            completedAt: new Date("2026-04-23T09:00:00.000Z"),
            isCompleted: true,
          },
          before: {
            completedAt: null,
            isCompleted: false,
          },
          kind: GROUP_ITEM_AUDIT_CHANGE_KIND.COMPLETION,
        },
      ],
      groupId: createGroupId(MOCK_GROUP_ALPHA_ID),
      itemId: createItemId("seed-item-group-alpha-assigned-task"),
      versionToken: createVersionToken(2),
    });
  }, 30_000);

  it("resolves persisted membership reachability across multiple groups", async () => {
    const resolver = new PrismaMembershipResolver(prisma);

    const defaultVisibleGroups = await resolver.listVisibleGroupIdsForActor(createUserId(MOCK_USER_ID));
    const outsiderVisibleGroups = await resolver.listVisibleGroupIdsForActor(createUserId(MOCK_OUTSIDER_USER_ID));
    const betaSpace = await resolver.hydrateGroupCommandSpace(createGroupId(MOCK_GROUP_BETA_ID));

    expect(defaultVisibleGroups).toEqual([
      createGroupId(MOCK_GROUP_ALPHA_ID),
      createGroupId(MOCK_GROUP_BETA_ID),
    ]);
    expect(outsiderVisibleGroups).toEqual([]);
    expect(betaSpace?.accessContext.groupId).toBe(createGroupId(MOCK_GROUP_BETA_ID));
    expect(betaSpace?.accessContext.memberships.map((membership) => membership.userId)).toEqual([
      createUserId(MOCK_USER_ID),
      createUserId(MOCK_GROUP_B_ONLY_USER_ID),
    ]);
  }, 30_000);

  it("normalizes and reuses scoped labels through the real Prisma command repository", async () => {
    const repository = new PrismaItemCommandRepository(prisma);

    await repository.save(
      createGroupTaskRecord({
        itemId: "item-group-label-reuse-1",
        labels: [" Finance ", "finance", "Ops"],
        title: "First normalized label item",
      }),
    );
    await repository.save(
      createGroupTaskRecord({
        itemId: "item-group-label-reuse-2",
        labels: ["finance"],
        title: "Second normalized label item",
      }),
    );

    const alphaLabels = await prisma.label.findMany({
      orderBy: [{ value: "asc" }],
      where: { groupId: MOCK_GROUP_ALPHA_ID },
    });
    const personalFinanceLabels = await prisma.label.findMany({
      where: {
        ownerId: MOCK_USER_ID,
        value: "finance",
      },
    });
    const linkedLabels = await prisma.itemLabel.findMany({
      orderBy: [{ itemId: "asc" }, { labelId: "asc" }],
      where: {
        itemId: {
          in: ["item-group-label-reuse-1", "item-group-label-reuse-2"],
        },
      },
    });

    expect(alphaLabels.filter((label) => label.value === "finance")).toHaveLength(1);
    expect(alphaLabels.filter((label) => label.value === "ops")).toHaveLength(1);
    expect(personalFinanceLabels).toHaveLength(1);
    expect(linkedLabels).toHaveLength(3);
    expect(linkedLabels.filter((link) => link.labelId === alphaLabels.find((label) => label.value === "finance")?.id)).toHaveLength(2);
  }, 30_000);
});
