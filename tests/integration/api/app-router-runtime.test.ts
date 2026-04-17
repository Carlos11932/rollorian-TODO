import type { PrismaClient } from "@prisma/client";

import { TASK_STATUS, TASK_TEMPORAL_KIND } from "@/domain/item";
import { ITEM_TYPE, PRIORITY, SPACE_TYPE } from "@/domain/shared";
import {
  groupViewResponseSchema,
  itemHistoryResponseSchema,
  itemResponseSchema,
  myViewResponseSchema,
} from "@/interfaces/api";
import {
  MOCK_ACTOR_HEADER,
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
} from "./prisma-test-harness";

vi.mock("server-only", () => ({}));

interface ItemRouteModule {
  GET(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response>;
  PATCH(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response>;
}

interface ItemHistoryRouteModule {
  GET(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response>;
}

interface ItemsRouteModule {
  POST(request: Request): Promise<Response>;
}

interface MyViewRouteModule {
  GET(request: Request): Promise<Response>;
}

interface GroupViewRouteModule {
  GET(request: Request, context: { params: Promise<{ groupId: string }> }): Promise<Response>;
}

interface RouteModules {
  groupViewRoute: GroupViewRouteModule;
  itemHistoryRoute: ItemHistoryRouteModule;
  itemRoute: ItemRouteModule;
  itemsRoute: ItemsRouteModule;
  myViewRoute: MyViewRouteModule;
}

function createRequest(url: string, init?: RequestInit, actorId = MOCK_USER_ID): Request {
  const headers = new Headers(init?.headers);
  headers.set(MOCK_ACTOR_HEADER, actorId);

  return new Request(url, {
    ...init,
    headers,
  });
}

function routeParams<TParams extends Record<string, string>>(params: TParams): { params: Promise<TParams> } {
  return { params: Promise.resolve(params) };
}

async function readJson(response: Response): Promise<unknown> {
  return response.json() as Promise<unknown>;
}

function parseItem(body: unknown) {
  return itemResponseSchema.parse(body).data;
}

function toViewItemIds(body: unknown): readonly string[] {
  return (body as { data: { items: Array<{ item: { id: string } }> } }).data.items.map((entry) => entry.item.id);
}

async function loadRouteModules(): Promise<RouteModules> {
  const [itemsRoute, itemRoute, itemHistoryRoute, myViewRoute, groupViewRoute] = await Promise.all([
    import("@/app/api/items/route"),
    import("@/app/api/items/[id]/route"),
    import("@/app/api/items/[id]/history/route"),
    import("@/app/api/views/my/route"),
    import("@/app/api/views/groups/[groupId]/route"),
  ]);

  return {
    groupViewRoute,
    itemHistoryRoute,
    itemRoute,
    itemsRoute,
    myViewRoute,
  };
}

async function disconnectRuntimePrisma(): Promise<void> {
  const runtimePrismaModule = await import("@/lib/prisma");
  await runtimePrismaModule.prisma.$disconnect();
}

describe("App Router runtime API (Prisma-backed)", () => {
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

  it("reads persisted group history after module reloads and separate App Router reads", async () => {
    const { itemHistoryRoute, itemRoute, itemsRoute } = await loadRouteModules();

    const createResponse = await itemsRoute.POST(
      createRequest("http://localhost/api/items", {
        body: JSON.stringify({
          groupId: MOCK_GROUP_ALPHA_ID,
          itemType: ITEM_TYPE.TASK,
          labels: ["Ops"],
          spaceId: MOCK_GROUP_ALPHA_SPACE_ID,
          spaceType: SPACE_TYPE.GROUP,
          temporal: { kind: TASK_TEMPORAL_KIND.UNDATED },
          title: "Runtime history item",
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );

    expect(createResponse.status).toBe(201);

    const created = parseItem(await readJson(createResponse));

    const updateResponse = await itemRoute.PATCH(
      createRequest(
        `http://localhost/api/items/${created.id}`,
        {
          body: JSON.stringify({
            assigneeIds: [MOCK_TEAMMATE_USER_ID],
            expectedVersionToken: created.versionToken,
            groupId: MOCK_GROUP_ALPHA_ID,
            itemType: ITEM_TYPE.TASK,
            labels: ["Ops", "Focus"],
            lifecycle: { status: TASK_STATUS.BLOCKED },
            priority: PRIORITY.HIGH,
            spaceId: MOCK_GROUP_ALPHA_SPACE_ID,
            spaceType: SPACE_TYPE.GROUP,
            temporal: { kind: TASK_TEMPORAL_KIND.UNDATED },
            title: "Runtime history item updated",
          }),
          headers: { "content-type": "application/json" },
          method: "PATCH",
        },
        MOCK_TEAMMATE_USER_ID,
      ),
      routeParams({ id: created.id }),
    );

    const updated = parseItem(await readJson(updateResponse));

    expect(updateResponse.status).toBe(200);
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

    expect(persistedAudit?.actorUserId).toBe(MOCK_TEAMMATE_USER_ID);
    expect(persistedAudit?.changes.map((change) => change.kind)).toEqual([
      "status",
      "title",
      "priority",
      "assignees",
      "labels",
    ]);

    vi.resetModules();

    const reloadedRoutes = await loadRouteModules();
    const fetchResponse = await reloadedRoutes.itemRoute.GET(
      createRequest(
        `http://localhost/api/items/${created.id}?groupId=${MOCK_GROUP_ALPHA_ID}&spaceId=${MOCK_GROUP_ALPHA_SPACE_ID}&spaceType=group`,
      ),
      routeParams({ id: created.id }),
    );
    const historyResponse = await reloadedRoutes.itemHistoryRoute.GET(
      createRequest(
        `http://localhost/api/items/${created.id}/history?groupId=${MOCK_GROUP_ALPHA_ID}&spaceId=${MOCK_GROUP_ALPHA_SPACE_ID}&spaceType=group`,
      ),
      routeParams({ id: created.id }),
    );

    expect(parseItem(await readJson(fetchResponse)).title).toBe("Runtime history item updated");
    expect(historyResponse.status).toBe(200);

    const history = itemHistoryResponseSchema.parse(await readJson(historyResponse));

    expect(history.data.entries).toHaveLength(1);
    expect(history.data.entries[0]?.actor.displayName).toBe("Archive Partner");
    expect(history.data.entries[0]?.changes.map((change) => change.kind)).toEqual([
      "status",
      "title",
      "priority",
      "assignees",
      "labels",
    ]);
  }, 30_000);

  it("keeps seeded unassigned group items visible to persisted members in my and group views", async () => {
    const { groupViewRoute, myViewRoute } = await loadRouteModules();

    const seededUnassignedAlphaItem = await prisma.item.findFirst({
      select: { id: true },
      where: {
        assignees: { none: {} },
        groupId: MOCK_GROUP_ALPHA_ID,
        title: "Review unassigned group visibility rules",
      },
    });

    expect(seededUnassignedAlphaItem?.id).toBeDefined();

    const myViewResponse = await myViewRoute.GET(createRequest("http://localhost/api/views/my"));
    const groupViewResponse = await groupViewRoute.GET(
      createRequest(`http://localhost/api/views/groups/${MOCK_GROUP_ALPHA_ID}`),
      routeParams({ groupId: MOCK_GROUP_ALPHA_ID }),
    );
    const outsiderGroupViewResponse = await groupViewRoute.GET(
      createRequest(`http://localhost/api/views/groups/${MOCK_GROUP_ALPHA_ID}`, undefined, MOCK_OUTSIDER_USER_ID),
      routeParams({ groupId: MOCK_GROUP_ALPHA_ID }),
    );

    const myView = myViewResponseSchema.parse(await readJson(myViewResponse));
    const groupView = groupViewResponseSchema.parse(await readJson(groupViewResponse));
    const outsiderGroupView = groupViewResponseSchema.parse(await readJson(outsiderGroupViewResponse));

    expect(toViewItemIds(myView)).toContain(seededUnassignedAlphaItem!.id);
    expect(toViewItemIds(groupView)).toContain(seededUnassignedAlphaItem!.id);
    expect(toViewItemIds(outsiderGroupView)).toEqual([]);
  }, 30_000);

  it("uses persisted memberships for multi-group reachability in App Router group views", async () => {
    const { groupViewRoute } = await loadRouteModules();

    const seededAlphaItem = await prisma.item.findFirst({
      select: { id: true },
      where: {
        groupId: MOCK_GROUP_ALPHA_ID,
        title: "Stabilize membership-backed runtime access",
      },
    });
    const seededBetaItem = await prisma.item.findFirst({
      select: { id: true },
      where: {
        groupId: MOCK_GROUP_BETA_ID,
        title: "Catalog Beta backlog dependencies",
      },
    });

    expect(seededAlphaItem?.id).toBeDefined();
    expect(seededBetaItem?.id).toBeDefined();

    const defaultAlphaViewResponse = await groupViewRoute.GET(
      createRequest(`http://localhost/api/views/groups/${MOCK_GROUP_ALPHA_ID}`),
      routeParams({ groupId: MOCK_GROUP_ALPHA_ID }),
    );
    const defaultBetaViewResponse = await groupViewRoute.GET(
      createRequest(`http://localhost/api/views/groups/${MOCK_GROUP_BETA_ID}`),
      routeParams({ groupId: MOCK_GROUP_BETA_ID }),
    );
    const betaOnlyUserBetaViewResponse = await groupViewRoute.GET(
      createRequest(`http://localhost/api/views/groups/${MOCK_GROUP_BETA_ID}`, undefined, MOCK_GROUP_B_ONLY_USER_ID),
      routeParams({ groupId: MOCK_GROUP_BETA_ID }),
    );
    const outsiderBetaViewResponse = await groupViewRoute.GET(
      createRequest(`http://localhost/api/views/groups/${MOCK_GROUP_BETA_ID}`, undefined, MOCK_OUTSIDER_USER_ID),
      routeParams({ groupId: MOCK_GROUP_BETA_ID }),
    );

    const defaultAlphaView = groupViewResponseSchema.parse(await readJson(defaultAlphaViewResponse));
    const defaultBetaView = groupViewResponseSchema.parse(await readJson(defaultBetaViewResponse));
    const betaOnlyUserBetaView = groupViewResponseSchema.parse(await readJson(betaOnlyUserBetaViewResponse));
    const outsiderBetaView = groupViewResponseSchema.parse(await readJson(outsiderBetaViewResponse));

    expect(defaultAlphaView.data.groupId).toBe(MOCK_GROUP_ALPHA_ID);
    expect(defaultBetaView.data.groupId).toBe(MOCK_GROUP_BETA_ID);
    expect(toViewItemIds(defaultAlphaView)).toContain(seededAlphaItem!.id);
    expect(toViewItemIds(defaultBetaView)).toContain(seededBetaItem!.id);
    expect(toViewItemIds(betaOnlyUserBetaView)).toContain(seededBetaItem!.id);
    expect(toViewItemIds(outsiderBetaView)).toEqual([]);
  }, 30_000);
});
