import type { PrismaClient } from "@prisma/client";

import { TASK_STATUS, TASK_TEMPORAL_KIND } from "@/domain/item";
import { ITEM_TYPE, PRIORITY, SPACE_TYPE } from "@/domain/shared";
import {
  createItemRequestSchema,
  getItemByIdRequestSchema,
  getItemHistoryRequestSchema,
  itemErrorResponseSchema,
  itemHistoryResponseSchema,
  itemListResponseSchema,
  itemResponseSchema,
  listItemsRequestSchema,
  updateItemRequestSchema,
} from "@/interfaces/api";
import {
  MOCK_BOOTSTRAP_GROUP_IDS,
  MOCK_BOOTSTRAP_SPACE_IDS,
  MOCK_BOOTSTRAP_USER_IDS,
} from "@/lib/mock/bootstrap";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import {
  createDockerPrismaHarness,
  hasConfiguredDatasourceUrl,
  type DockerPrismaHarness,
} from "./prisma-test-harness";

const MOCK_ACTOR_HEADER = "x-rollorian-actor-id";

vi.mock("server-only", () => ({}));

type ApiRuntimeModule = typeof import("@/lib/api-runtime");
type ItemError = z.infer<typeof itemErrorResponseSchema>["error"];
type ValidationItemError = Extract<ItemError, { code: "validation_failed" }>;
type VersionConflictItemError = Extract<ItemError, { code: "version_conflict" }>;

interface ApiResponse<TBody> {
  body: TBody;
  status: number;
}

class PrismaApiClient {
  public constructor(
    private readonly actorId: string,
    private readonly runtime: ApiRuntimeModule,
  ) {}

  public async postItem(request: unknown): Promise<ApiResponse<unknown>> {
    const parsed = createItemRequestSchema.safeParse(request);

    if (!parsed.success) {
      return badRequest(parsed.error.flatten());
    }

    return this.runtime.createItem(this.createRequest(), parsed.data);
  }

  public async getItem(request: unknown): Promise<ApiResponse<unknown>> {
    const parsed = getItemByIdRequestSchema.safeParse(request);

    if (!parsed.success) {
      return badRequest(parsed.error.flatten());
    }

    return this.runtime.getItem(this.createRequest(), parsed.data);
  }

  public async patchItem(request: unknown): Promise<ApiResponse<unknown>> {
    const parsed = updateItemRequestSchema.safeParse(request);

    if (!parsed.success) {
      return badRequest(parsed.error.flatten());
    }

    return this.runtime.updateItem(this.createRequest(), parsed.data);
  }

  public async listItems(request: unknown): Promise<ApiResponse<unknown>> {
    const parsed = listItemsRequestSchema.safeParse(request);

    if (!parsed.success) {
      return badRequest(parsed.error.flatten());
    }

    return this.runtime.listItems(this.createRequest(), parsed.data);
  }

  public async getItemHistory(request: unknown): Promise<ApiResponse<unknown>> {
    const parsed = getItemHistoryRequestSchema.safeParse(request);

    if (!parsed.success) {
      return badRequest(parsed.error.flatten());
    }

    return this.runtime.getItemHistory(this.createRequest(), parsed.data);
  }

  private createRequest(): Request {
    return new Request("http://localhost/api/runtime", {
      headers: new Headers({
        [MOCK_ACTOR_HEADER]: this.actorId,
      }),
    });
  }
}

function badRequest(error: unknown): ApiResponse<{ error: unknown }> {
  return {
    body: { error },
    status: 400,
  };
}

function readItemData(response: ApiResponse<unknown>) {
  expect(response.status).toBeGreaterThanOrEqual(200);
  expect(response.status).toBeLessThan(300);

  return itemResponseSchema.parse(response.body).data;
}

function readItemError(response: ApiResponse<unknown>) {
  expect(response.status).toBeGreaterThanOrEqual(400);
  return itemErrorResponseSchema.parse(response.body).error;
}

function expectValidationError(error: ItemError): ValidationItemError {
  expect(error.code).toBe("validation_failed");
  return error as ValidationItemError;
}

function expectVersionConflictError(error: ItemError): VersionConflictItemError {
  expect(error.code).toBe("version_conflict");
  return error as VersionConflictItemError;
}

async function loadApiRuntimeModule(): Promise<ApiRuntimeModule> {
  return import("@/lib/api-runtime");
}

async function createApiClients() {
  const runtime = await loadApiRuntimeModule();

  return {
    member: new PrismaApiClient(MOCK_BOOTSTRAP_USER_IDS.DEFAULT, runtime),
    teammate: new PrismaApiClient(MOCK_BOOTSTRAP_USER_IDS.TEAMMATE, runtime),
  } as const;
}

async function disconnectRuntimePrisma(): Promise<void> {
  const runtimePrismaModule = await import("@/lib/prisma");
  await runtimePrismaModule.prisma.$disconnect();
}

const describeIfDatabaseConfigured = hasConfiguredDatasourceUrl() ? describe : describe.skip;

describeIfDatabaseConfigured("item API integration (Prisma-backed)", () => {
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
      await disconnectRuntimePrisma();
      await prismaHarness.stop();
    }
  }, 120_000);

  it("runs create/read/update/list flows through the Prisma-backed API harness", async () => {
    const { member } = await createApiClients();

    const created = readItemData(
      await member.postItem({
        body: {
          itemType: ITEM_TYPE.TASK,
          labels: ["phase4-crud"],
          ownerId: MOCK_BOOTSTRAP_USER_IDS.DEFAULT,
          priority: PRIORITY.HIGH,
          spaceId: MOCK_BOOTSTRAP_SPACE_IDS.DEFAULT_PERSONAL,
          spaceType: SPACE_TYPE.PERSONAL,
          temporal: { kind: TASK_TEMPORAL_KIND.UNDATED },
          title: "Verify Prisma-backed create flow",
        },
      }),
    );

    expect(created.versionToken).toBe(0);

    const listed = await member.listItems({
      query: {
        label: "phase4-crud",
        ownerId: MOCK_BOOTSTRAP_USER_IDS.DEFAULT,
        spaceType: SPACE_TYPE.PERSONAL,
      },
    });

    expect(itemListResponseSchema.parse(listed.body).data.items.map((item) => item.id)).toEqual([created.id]);

    const updated = readItemData(
      await member.patchItem({
        body: {
          ownerId: MOCK_BOOTSTRAP_USER_IDS.DEFAULT,
          priority: PRIORITY.URGENT,
          spaceId: MOCK_BOOTSTRAP_SPACE_IDS.DEFAULT_PERSONAL,
          spaceType: SPACE_TYPE.PERSONAL,
          temporal: {
            dueAt: "2026-04-20T18:00:00.000Z",
            kind: TASK_TEMPORAL_KIND.DUE_DATE,
          },
          title: "Verify Prisma-backed update flow",
        },
        params: { itemId: created.id },
      }),
    );

    expect(updated.priority).toBe(PRIORITY.URGENT);
    expect(updated.temporal.kind).toBe(TASK_TEMPORAL_KIND.DUE_DATE);

    const fetched = readItemData(
      await member.getItem({
        params: { itemId: created.id },
        query: {
          ownerId: MOCK_BOOTSTRAP_USER_IDS.DEFAULT,
          spaceId: MOCK_BOOTSTRAP_SPACE_IDS.DEFAULT_PERSONAL,
          spaceType: SPACE_TYPE.PERSONAL,
        },
      }),
    );

    expect(fetched.title).toBe("Verify Prisma-backed update flow");

    const persisted = await prisma.item.findUnique({
      where: { id: created.id },
    });

    expect(persisted?.title).toBe("Verify Prisma-backed update flow");
    expect(persisted?.priority).toBe("urgent");
  }, 30_000);

  it("returns optimistic concurrency conflicts from persisted version checks", async () => {
    const { member, teammate } = await createApiClients();

    const created = readItemData(
      await member.postItem({
        body: {
          groupId: MOCK_BOOTSTRAP_GROUP_IDS.ALPHA,
          itemType: ITEM_TYPE.TASK,
          spaceId: MOCK_BOOTSTRAP_SPACE_IDS.GROUP_ALPHA,
          spaceType: SPACE_TYPE.GROUP,
          temporal: { kind: TASK_TEMPORAL_KIND.UNDATED },
          title: "Concurrency item",
        },
      }),
    );

    const successfulUpdate = readItemData(
      await teammate.patchItem({
        body: {
          expectedVersionToken: created.versionToken,
          groupId: MOCK_BOOTSTRAP_GROUP_IDS.ALPHA,
          itemType: ITEM_TYPE.TASK,
          priority: PRIORITY.HIGH,
          spaceId: MOCK_BOOTSTRAP_SPACE_IDS.GROUP_ALPHA,
          spaceType: SPACE_TYPE.GROUP,
          temporal: { kind: TASK_TEMPORAL_KIND.UNDATED },
          title: "Concurrency item updated",
        },
        params: { itemId: created.id },
      }),
    );

    expect(successfulUpdate.versionToken).toBe(1);

    const staleUpdate = await member.patchItem({
      body: {
        expectedVersionToken: created.versionToken,
        groupId: MOCK_BOOTSTRAP_GROUP_IDS.ALPHA,
        itemType: ITEM_TYPE.TASK,
        spaceId: MOCK_BOOTSTRAP_SPACE_IDS.GROUP_ALPHA,
        spaceType: SPACE_TYPE.GROUP,
        temporal: { kind: TASK_TEMPORAL_KIND.UNDATED },
        title: "Stale write should fail",
      },
      params: { itemId: created.id },
    });

    expect(staleUpdate.status).toBe(409);

    const error = expectVersionConflictError(readItemError(staleUpdate));

    expect(error.actualVersionToken).toBe(1);
    expect(error.expectedVersionToken).toBe(0);
  }, 30_000);

  it("rejects group assignees who are not persisted members", async () => {
    const { member } = await createApiClients();

    const response = await member.postItem({
      body: {
        assigneeIds: [MOCK_BOOTSTRAP_USER_IDS.OUTSIDER],
        groupId: MOCK_BOOTSTRAP_GROUP_IDS.ALPHA,
        itemType: ITEM_TYPE.TASK,
        spaceId: MOCK_BOOTSTRAP_SPACE_IDS.GROUP_ALPHA,
        spaceType: SPACE_TYPE.GROUP,
        temporal: { kind: TASK_TEMPORAL_KIND.UNDATED },
        title: "Reject outsider assignment",
      },
    });

    expect(response.status).toBe(422);

    const error = expectValidationError(readItemError(response));

    expect(error.violations).toContain(
      `Group items may only assign active group members: ${MOCK_BOOTSTRAP_USER_IDS.OUTSIDER}.`,
    );
  }, 30_000);

  it("reuses scoped labels in Postgres without crossing personal and group scopes", async () => {
    const { member } = await createApiClients();

    const first = readItemData(
      await member.postItem({
        body: {
          groupId: MOCK_BOOTSTRAP_GROUP_IDS.ALPHA,
          itemType: ITEM_TYPE.TASK,
          labels: ["Finance"],
          spaceId: MOCK_BOOTSTRAP_SPACE_IDS.GROUP_ALPHA,
          spaceType: SPACE_TYPE.GROUP,
          temporal: { kind: TASK_TEMPORAL_KIND.UNDATED },
          title: "Alpha finance item one",
        },
      }),
    );

    const second = readItemData(
      await member.postItem({
        body: {
          groupId: MOCK_BOOTSTRAP_GROUP_IDS.ALPHA,
          itemType: ITEM_TYPE.TASK,
          labels: [" finance "],
          spaceId: MOCK_BOOTSTRAP_SPACE_IDS.GROUP_ALPHA,
          spaceType: SPACE_TYPE.GROUP,
          temporal: { kind: TASK_TEMPORAL_KIND.UNDATED },
          title: "Alpha finance item two",
        },
      }),
    );

    const alphaFinanceLabels = await prisma.label.findMany({
      where: {
        groupId: MOCK_BOOTSTRAP_GROUP_IDS.ALPHA,
        value: "finance",
      },
    });
    const personalFinanceLabels = await prisma.label.findMany({
      where: {
        ownerId: MOCK_BOOTSTRAP_USER_IDS.DEFAULT,
        value: "finance",
      },
    });
    const linkedLabels = await prisma.itemLabel.findMany({
      orderBy: [{ itemId: "asc" }],
      where: {
        itemId: { in: [first.id, second.id] },
      },
    });

    expect(alphaFinanceLabels).toHaveLength(1);
    expect(personalFinanceLabels).toHaveLength(1);
    expect(linkedLabels).toHaveLength(2);
    expect(new Set(linkedLabels.map((link) => link.labelId))).toEqual(new Set([alphaFinanceLabels[0]?.id]));
  }, 30_000);

  it("reads persisted group history after a simulated runtime reload", async () => {
    const { member, teammate } = await createApiClients();

    const created = readItemData(
      await member.postItem({
        body: {
          groupId: MOCK_BOOTSTRAP_GROUP_IDS.ALPHA,
          itemType: ITEM_TYPE.TASK,
          labels: ["Ops"],
          spaceId: MOCK_BOOTSTRAP_SPACE_IDS.GROUP_ALPHA,
          spaceType: SPACE_TYPE.GROUP,
          temporal: { kind: TASK_TEMPORAL_KIND.UNDATED },
          title: "History persistence item",
        },
      }),
    );

    const updated = readItemData(
      await teammate.patchItem({
        body: {
          assigneeIds: [MOCK_BOOTSTRAP_USER_IDS.TEAMMATE],
          expectedVersionToken: created.versionToken,
          groupId: MOCK_BOOTSTRAP_GROUP_IDS.ALPHA,
          itemType: ITEM_TYPE.TASK,
          labels: ["Ops", "Focus"],
          lifecycle: { status: TASK_STATUS.BLOCKED },
          priority: PRIORITY.HIGH,
          spaceId: MOCK_BOOTSTRAP_SPACE_IDS.GROUP_ALPHA,
          spaceType: SPACE_TYPE.GROUP,
          temporal: { kind: TASK_TEMPORAL_KIND.UNDATED },
          title: "History persistence item updated",
        },
        params: { itemId: created.id },
      }),
    );

    expect(updated.versionToken).toBe(1);

    const persistedAudit = await prisma.groupAuditEntry.findFirst({
      include: {
        changes: {
          orderBy: [{ position: "asc" }],
        },
      },
      where: {
        itemId: created.id,
        versionToken: 1,
      },
    });

    expect(persistedAudit?.actorUserId).toBe(MOCK_BOOTSTRAP_USER_IDS.TEAMMATE);
    expect(persistedAudit?.changes.map((change) => change.kind)).toEqual([
      "status",
      "title",
      "priority",
      "assignees",
      "labels",
    ]);

    vi.resetModules();

    const reloadedClients = await createApiClients();
    const historyResponse = await reloadedClients.member.getItemHistory({
      params: { itemId: created.id },
      query: {
        groupId: MOCK_BOOTSTRAP_GROUP_IDS.ALPHA,
        spaceId: MOCK_BOOTSTRAP_SPACE_IDS.GROUP_ALPHA,
        spaceType: SPACE_TYPE.GROUP,
      },
    });

    expect(historyResponse.status).toBe(200);

    const history = itemHistoryResponseSchema.parse(historyResponse.body);

    expect(history.data.entries).toHaveLength(1);
    expect(history.data.entries[0]?.actor.displayName).toBe("Archive Partner");
    expect(history.data.entries[0]?.versionToken).toBe(1);
    expect(history.data.entries[0]?.changes.map((change) => change.kind)).toEqual([
      "status",
      "title",
      "priority",
      "assignees",
      "labels",
    ]);
  }, 30_000);
});
