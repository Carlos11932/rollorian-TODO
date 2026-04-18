import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createGroupSpaceAccessContext, createPersonalSpaceAccessContext } from "@/domain/access";
import { GROUP_ITEM_AUDIT_CHANGE_KIND } from "@/domain/history";
import { createGroupMembership } from "@/domain/identity";
import {
  EVENT_STATUS,
  TASK_STATUS,
  createEventScheduledLifecycle,
  createEventStartTemporal,
  createGroupItemScope,
  createPersonalItemScope,
  createTaskPendingLifecycle,
  createTaskUndatedTemporal,
} from "@/domain/item";
import {
  ITEM_TYPE,
  PRIORITY,
  SPACE_TYPE,
  createGroupId,
  createItemId,
  createMembershipId,
  createSpaceId,
  createUserId,
  createVersionToken,
} from "@/domain/shared";
import { itemHistoryResponseSchema, itemListResponseSchema, myViewResponseSchema } from "@/interfaces/api";

const mocks = vi.hoisted(() => ({
  createItemHandler: { execute: vi.fn() },
  findItemById: vi.fn(),
  getAttentionViewHandler: { execute: vi.fn() },
  getCalendarViewHandler: { execute: vi.fn() },
  getGroupViewHandler: { execute: vi.fn() },
  getMyViewHandler: { execute: vi.fn() },
  getUndatedViewHandler: { execute: vi.fn() },
  prismaGroupItemHistoryRepository: { listByItemId: vi.fn() },
  prismaItemViewRepository: { listProjectedItems: vi.fn() },
  prismaMembershipResolver: {
    findActorByUserId: vi.fn(),
    hydrateGroupCommandSpace: vi.fn(),
    hydratePersonalCommandSpace: vi.fn(),
    listVisibleGroupIdsForActor: vi.fn(),
  },
  readItemByIdHandler: { execute: vi.fn() },
  resolveMockActor: vi.fn(),
  updateItemHandler: { execute: vi.fn() },
}));

vi.mock("@/lib/item-command-factory", () => ({
  createItemHandler: mocks.createItemHandler,
  findItemById: mocks.findItemById,
  getAttentionViewHandler: mocks.getAttentionViewHandler,
  getCalendarViewHandler: mocks.getCalendarViewHandler,
  getGroupViewHandler: mocks.getGroupViewHandler,
  getMyViewHandler: mocks.getMyViewHandler,
  getUndatedViewHandler: mocks.getUndatedViewHandler,
  prismaGroupItemHistoryRepository: mocks.prismaGroupItemHistoryRepository,
  prismaItemViewRepository: mocks.prismaItemViewRepository,
  prismaMembershipResolver: mocks.prismaMembershipResolver,
  readItemByIdHandler: mocks.readItemByIdHandler,
  updateItemHandler: mocks.updateItemHandler,
}));

vi.mock("@/lib/mock/actor", () => ({
  resolveMockActor: mocks.resolveMockActor,
}));

import * as apiRuntime from "@/lib/api-runtime";
import { getItemHistory, getMyView, listItems, updateItem } from "@/lib/api-runtime";

const actorUserId = createUserId("user-1");
const teammateUserId = createUserId("user-2");
const actor = {
  metadata: {
    actorId: actorUserId,
    displayName: "Curator",
    email: "curator@rollorian.dev",
  },
  userId: actorUserId,
} as const;
const groupAlphaId = createGroupId("group-alpha");
const groupBetaId = createGroupId("group-beta");
const groupAlphaSpaceId = createSpaceId("space-group-alpha");
const personalSpaceId = createSpaceId("space-personal-user-1");
const activeMembership = createGroupMembership({
  groupId: groupAlphaId,
  id: createMembershipId("membership-alpha-user-1"),
  role: "member",
  userId: actorUserId,
});

function createRequest() {
  return new Request("http://localhost/api/test");
}

function createPersonalCommandSpace() {
  return {
    accessContext: createPersonalSpaceAccessContext({
      ownerId: actorUserId,
      spaceId: personalSpaceId,
    }),
    scope: createPersonalItemScope({ ownerId: actorUserId }),
  } as const;
}

function createGroupCommandSpace() {
  return {
    accessContext: createGroupSpaceAccessContext({
      groupId: groupAlphaId,
      memberships: [activeMembership],
      spaceId: groupAlphaSpaceId,
    }),
    scope: createGroupItemScope({
      groupId: groupAlphaId,
      memberships: [activeMembership],
    }),
  } as const;
}

function createTaskOutput(options: {
  groupId?: ReturnType<typeof createGroupId> | null;
  id: string;
  ownerId?: ReturnType<typeof createUserId> | null;
  spaceId: ReturnType<typeof createSpaceId>;
  spaceType: typeof SPACE_TYPE.PERSONAL | typeof SPACE_TYPE.GROUP;
  title: string;
}) {
  return {
    assigneeIds: [],
    createdAt: new Date("2026-04-15T09:00:00.000Z"),
    groupId: options.groupId ?? null,
    id: createItemId(options.id),
    itemType: ITEM_TYPE.TASK,
    labels: [],
    lifecycle: createTaskPendingLifecycle(),
    notes: null,
    ownerId: options.ownerId ?? null,
    postponeCount: 0,
    priority: PRIORITY.MEDIUM,
    spaceId: options.spaceId,
    spaceType: options.spaceType,
    status: TASK_STATUS.PENDING,
    temporal: createTaskUndatedTemporal(),
    title: options.title,
    updatedAt: new Date("2026-04-15T09:00:00.000Z"),
    versionToken: createVersionToken(0),
  } as const;
}

function createEventOutput(id: string) {
  return {
    assigneeIds: [teammateUserId],
    createdAt: new Date("2026-04-15T09:00:00.000Z"),
    groupId: groupAlphaId,
    id: createItemId(id),
    itemType: ITEM_TYPE.EVENT,
    labels: [],
    lifecycle: createEventScheduledLifecycle(),
    notes: null,
    ownerId: null,
    postponeCount: 0,
    priority: PRIORITY.HIGH,
    spaceId: groupAlphaSpaceId,
    spaceType: SPACE_TYPE.GROUP,
    status: EVENT_STATUS.SCHEDULED,
    temporal: createEventStartTemporal(new Date("2026-04-20T09:00:00.000Z")),
    title: "Persisted event",
    updatedAt: new Date("2026-04-15T09:00:00.000Z"),
    versionToken: createVersionToken(2),
  } as const;
}

describe("api-runtime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveMockActor.mockReturnValue(actor);
    mocks.prismaMembershipResolver.findActorByUserId.mockResolvedValue(actor);
  });

  it("lists items from the Prisma view repository with persisted visibility", async () => {
    mocks.prismaMembershipResolver.listVisibleGroupIdsForActor.mockResolvedValue([groupAlphaId]);
    mocks.prismaItemViewRepository.listProjectedItems.mockResolvedValue([
      {
        item: createTaskOutput({
          id: "personal-visible",
          ownerId: actorUserId,
          spaceId: personalSpaceId,
          spaceType: SPACE_TYPE.PERSONAL,
          title: "Personal visible",
        }),
        projection: { visibility: { groupId: null } },
      },
      {
        item: createTaskOutput({
          groupId: groupAlphaId,
          id: "group-visible",
          spaceId: groupAlphaSpaceId,
          spaceType: SPACE_TYPE.GROUP,
          title: "Group visible",
        }),
        projection: { visibility: { groupId: groupAlphaId } },
      },
      {
        item: createTaskOutput({
          groupId: groupBetaId,
          id: "group-hidden",
          spaceId: createSpaceId("space-group-beta"),
          spaceType: SPACE_TYPE.GROUP,
          title: "Group hidden",
        }),
        projection: { visibility: { groupId: groupBetaId } },
      },
    ]);

    const response = await listItems(createRequest(), { query: {} });
    const body = itemListResponseSchema.parse(response.body);

    expect(response.status).toBe(200);
    expect(body.data.items.map((item) => item.id)).toEqual(["personal-visible", "group-visible"]);
    expect(mocks.prismaMembershipResolver.listVisibleGroupIdsForActor).toHaveBeenCalledWith(actorUserId);
    expect(mocks.prismaItemViewRepository.listProjectedItems).toHaveBeenCalledOnce();
  });

  it("passes persisted visible groups into My View queries", async () => {
    mocks.prismaMembershipResolver.listVisibleGroupIdsForActor.mockResolvedValue([groupAlphaId, groupBetaId]);
    mocks.getMyViewHandler.execute.mockResolvedValue({ items: [], totalCount: 0 });

    const response = await getMyView(createRequest(), { query: {} });

    expect(response.status).toBe(200);
    expect(myViewResponseSchema.parse(response.body).data.totalCount).toBe(0);
    expect(mocks.getMyViewHandler.execute).toHaveBeenCalledWith({
      actorUserId,
      visibleGroupIds: [groupAlphaId, groupBetaId],
    });
  });

  it("reads item history from the Prisma audit repository", async () => {
    mocks.prismaMembershipResolver.hydrateGroupCommandSpace.mockResolvedValue(createGroupCommandSpace());
    mocks.readItemByIdHandler.execute.mockResolvedValue({
      ok: true,
      value: createTaskOutput({
        groupId: groupAlphaId,
        id: "item-history-1",
        spaceId: groupAlphaSpaceId,
        spaceType: SPACE_TYPE.GROUP,
        title: "History item",
      }),
    });
    mocks.prismaGroupItemHistoryRepository.listByItemId.mockResolvedValue([
      {
        actor: actor.metadata,
        changedAt: new Date("2026-04-15T10:00:00.000Z"),
        changes: [
          {
            after: TASK_STATUS.BLOCKED,
            before: TASK_STATUS.PENDING,
            kind: GROUP_ITEM_AUDIT_CHANGE_KIND.STATUS,
          },
        ],
        groupId: groupAlphaId,
        itemId: createItemId("item-history-1"),
        versionToken: createVersionToken(1),
      },
    ]);

    const response = await getItemHistory(createRequest(), {
      params: { itemId: "item-history-1" },
      query: {
        groupId: groupAlphaId,
        spaceId: groupAlphaSpaceId,
        spaceType: SPACE_TYPE.GROUP,
      },
    });
    const body = itemHistoryResponseSchema.parse(response.body);

    expect(response.status).toBe(200);
    expect(body.data.entries).toHaveLength(1);
    expect(mocks.prismaGroupItemHistoryRepository.listByItemId).toHaveBeenCalledWith(createItemId("item-history-1"));
  });

  it("resolves update item type from the Prisma-backed read path", async () => {
    mocks.findItemById.mockResolvedValue(createEventOutput("item-event-1"));
    mocks.prismaMembershipResolver.hydrateGroupCommandSpace.mockResolvedValue(createGroupCommandSpace());
    mocks.updateItemHandler.execute.mockResolvedValue({
      ok: true,
      value: createEventOutput("item-event-1"),
    });

    const response = await updateItem(createRequest(), {
      body: {
        expectedVersionToken: 2,
        groupId: groupAlphaId,
        spaceId: groupAlphaSpaceId,
        spaceType: SPACE_TYPE.GROUP,
        title: "Updated persisted event",
      },
      params: { itemId: "item-event-1" },
    });

    expect(response.status).toBe(200);
    expect(mocks.findItemById).toHaveBeenCalledWith("item-event-1");
    expect(mocks.updateItemHandler.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        itemId: createItemId("item-event-1"),
        itemType: ITEM_TYPE.EVENT,
      }),
    );
  });

  it("does not expose resetRuntimeStore from the production runtime module", () => {
    expect("resetRuntimeStore" in apiRuntime).toBe(false);
  });
});
