import { GET as getAttentionRoute } from "@/app/api/views/attention/route";
import { GET as getCalendarRoute } from "@/app/api/views/calendar/route";
import { GET as getGroupRoute } from "@/app/api/views/groups/[groupId]/route";
import { GET as getItemHistoryRoute } from "@/app/api/items/[id]/history/route";
import { GET as getItemRoute, PATCH as patchItemRoute } from "@/app/api/items/[id]/route";
import { GET as getItemsRoute, POST as postItemRoute } from "@/app/api/items/route";
import { GET as getMyRoute } from "@/app/api/views/my/route";
import { GET as getUndatedRoute } from "@/app/api/views/undated/route";
import { EVENT_STATUS, EVENT_TEMPORAL_KIND, TASK_STATUS, TASK_TEMPORAL_KIND } from "@/domain/item";
import { ITEM_TYPE, PRIORITY, SPACE_TYPE } from "@/domain/shared";
import {
  itemHistoryResponseSchema,
  itemListResponseSchema,
  itemResponseSchema,
  myViewResponseSchema,
  attentionViewResponseSchema,
  calendarViewResponseSchema,
  groupViewResponseSchema,
  undatedViewResponseSchema,
} from "@/interfaces/api";
import { resetRuntimeStore, VIEW_SPACE_FILTER } from "@/lib/api-runtime";
import {
  MOCK_ACTOR_HEADER,
  MOCK_GROUP_ALPHA_ID,
  MOCK_GROUP_ALPHA_SPACE_ID,
  MOCK_GROUP_BETA_ID,
  MOCK_GROUP_BETA_SPACE_ID,
  MOCK_GROUP_B_ONLY_USER_ID,
  MOCK_OUTSIDER_USER_ID,
  MOCK_PERSONAL_SPACE_ID,
  MOCK_TEAMMATE_USER_ID,
  MOCK_USER_ID,
} from "@/lib/mock/actor";

function createRequest(url: string, init?: RequestInit, actorId = MOCK_USER_ID) {
  const headers = new Headers(init?.headers);
  headers.set(MOCK_ACTOR_HEADER, actorId);

  return new Request(url, {
    ...init,
    headers,
  });
}

async function readJson(response: Response) {
  return response.json() as Promise<unknown>;
}

function routeParams<TParams extends Record<string, string>>(params: TParams) {
  return { params: Promise.resolve(params) };
}

function parseItemId(body: unknown) {
  return itemResponseSchema.parse(body).data.id;
}

function toViewItemIds(body: unknown) {
  return (body as { data: { items: Array<{ item: { id: string } }> } }).data.items.map((entry) => entry.item.id);
}

describe("App Router runtime API", () => {
  beforeEach(() => {
    resetRuntimeStore();
  });

  it("serves contract-aligned CRUD, list, and history handlers", async () => {
    const createdResponse = await postItemRoute(
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
    const createdBody = await readJson(createdResponse);
    const created = itemResponseSchema.parse(createdBody).data;

    expect(createdResponse.status).toBe(201);

    const listedResponse = await getItemsRoute(
      createRequest(`http://localhost/api/items?groupId=${MOCK_GROUP_ALPHA_ID}&spaceType=group`),
    );
    expect(itemListResponseSchema.parse(await readJson(listedResponse)).data.items.map((item) => item.id)).toEqual([
      created.id,
    ]);

    const updatedResponse = await patchItemRoute(
      createRequest(
        `http://localhost/api/items/${created.id}`,
        {
          body: JSON.stringify({
            assigneeIds: [MOCK_TEAMMATE_USER_ID],
            expectedVersionToken: created.versionToken,
            groupId: MOCK_GROUP_ALPHA_ID,
            itemType: ITEM_TYPE.TASK,
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
    const updated = itemResponseSchema.parse(await readJson(updatedResponse)).data;

    expect(updatedResponse.status).toBe(200);
    expect(updated.versionToken).toBe(1);

    const fetchedResponse = await getItemRoute(
      createRequest(
        `http://localhost/api/items/${created.id}?groupId=${MOCK_GROUP_ALPHA_ID}&spaceId=${MOCK_GROUP_ALPHA_SPACE_ID}&spaceType=group`,
      ),
      routeParams({ id: created.id }),
    );
    expect(itemResponseSchema.parse(await readJson(fetchedResponse)).data.title).toBe("Runtime history item updated");

    const historyResponse = await getItemHistoryRoute(
      createRequest(
        `http://localhost/api/items/${created.id}/history?groupId=${MOCK_GROUP_ALPHA_ID}&spaceId=${MOCK_GROUP_ALPHA_SPACE_ID}&spaceType=group`,
      ),
      routeParams({ id: created.id }),
    );
    const history = itemHistoryResponseSchema.parse(await readJson(historyResponse));

    expect(historyResponse.status).toBe(200);
    expect(history.data.entries).toHaveLength(1);
    expect(history.data.entries[0]?.changes.map((change) => change.kind)).toEqual([
      "status",
      "title",
      "priority",
      "assignees",
    ]);
  });

  it("serves runtime view routes and keeps access independent from assignment", async () => {
    const personalResponse = await postItemRoute(
      createRequest("http://localhost/api/items", {
        body: JSON.stringify({
          itemType: ITEM_TYPE.TASK,
          ownerId: MOCK_USER_ID,
          spaceId: MOCK_PERSONAL_SPACE_ID,
          spaceType: SPACE_TYPE.PERSONAL,
          temporal: { kind: TASK_TEMPORAL_KIND.UNDATED },
          title: "Personal undated",
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );
    const personalId = parseItemId(await readJson(personalResponse));

    const groupResponse = await postItemRoute(
      createRequest("http://localhost/api/items", {
        body: JSON.stringify({
          assigneeIds: [MOCK_USER_ID],
          groupId: MOCK_GROUP_ALPHA_ID,
          itemType: ITEM_TYPE.TASK,
          spaceId: MOCK_GROUP_ALPHA_SPACE_ID,
          spaceType: SPACE_TYPE.GROUP,
          temporal: { kind: TASK_TEMPORAL_KIND.UNDATED },
          title: "Assigned group item",
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );
    const groupCreated = itemResponseSchema.parse(await readJson(groupResponse)).data;

    const calendarResponse = await postItemRoute(
      createRequest("http://localhost/api/items", {
        body: JSON.stringify({
          groupId: MOCK_GROUP_ALPHA_ID,
          itemType: ITEM_TYPE.EVENT,
          lifecycle: {
            completedAt: "2026-04-14T10:30:00.000Z",
            status: EVENT_STATUS.COMPLETED,
          },
          spaceId: MOCK_GROUP_ALPHA_SPACE_ID,
          spaceType: SPACE_TYPE.GROUP,
          temporal: {
            endAt: "2026-04-14T11:00:00.000Z",
            kind: EVENT_TEMPORAL_KIND.START_AND_END,
            startAt: "2026-04-14T09:00:00.000Z",
          },
          title: "Completed event",
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }, MOCK_TEAMMATE_USER_ID),
    );
    const calendarId = parseItemId(await readJson(calendarResponse));

    const attentionResponse = await postItemRoute(
      createRequest("http://localhost/api/items", {
        body: JSON.stringify({
          groupId: MOCK_GROUP_ALPHA_ID,
          itemType: ITEM_TYPE.TASK,
          lifecycle: { status: TASK_STATUS.BLOCKED },
          spaceId: MOCK_GROUP_ALPHA_SPACE_ID,
          spaceType: SPACE_TYPE.GROUP,
          temporal: { kind: TASK_TEMPORAL_KIND.UNDATED },
          title: "Blocked attention item",
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );
    const attentionId = parseItemId(await readJson(attentionResponse));

    const unassignedResponse = await patchItemRoute(
      createRequest(
        `http://localhost/api/items/${groupCreated.id}`,
        {
          body: JSON.stringify({
            assigneeIds: [],
            expectedVersionToken: groupCreated.versionToken,
            groupId: MOCK_GROUP_ALPHA_ID,
            itemType: ITEM_TYPE.TASK,
            spaceId: MOCK_GROUP_ALPHA_SPACE_ID,
            spaceType: SPACE_TYPE.GROUP,
            temporal: { kind: TASK_TEMPORAL_KIND.UNDATED },
            title: groupCreated.title,
          }),
          headers: { "content-type": "application/json" },
          method: "PATCH",
        },
        MOCK_TEAMMATE_USER_ID,
      ),
      routeParams({ id: groupCreated.id }),
    );
    const unassigned = itemResponseSchema.parse(await readJson(unassignedResponse)).data;

    const myView = myViewResponseSchema.parse(
      await readJson(await getMyRoute(createRequest("http://localhost/api/views/my"))),
    );
    const groupView = groupViewResponseSchema.parse(
      await readJson(
        await getGroupRoute(
          createRequest(`http://localhost/api/views/groups/${MOCK_GROUP_ALPHA_ID}`),
          routeParams({ groupId: MOCK_GROUP_ALPHA_ID }),
        ),
      ),
    );
    const calendarView = calendarViewResponseSchema.parse(
      await readJson(
        await getCalendarRoute(
          createRequest(
            `http://localhost/api/views/calendar?endAt=2026-04-14T23:59:59.999Z&spaceFilter=${VIEW_SPACE_FILTER.BOTH}&startAt=2026-04-14T00:00:00.000Z`,
          ),
        ),
      ),
    );
    const undatedView = undatedViewResponseSchema.parse(
      await readJson(
        await getUndatedRoute(
          createRequest(`http://localhost/api/views/undated?spaceFilter=${VIEW_SPACE_FILTER.BOTH}`),
        ),
      ),
    );
    const attentionView = attentionViewResponseSchema.parse(
      await readJson(
        await getAttentionRoute(
          createRequest(`http://localhost/api/views/attention?spaceFilter=${VIEW_SPACE_FILTER.BOTH}`),
        ),
      ),
    );

    expect(toViewItemIds(myView)).toContain(personalId);
    expect(toViewItemIds(myView)).toContain(unassigned.id);
    expect(toViewItemIds(groupView)).toContain(unassigned.id);
    expect(toViewItemIds(groupView)).toContain(attentionId);
    expect(toViewItemIds(calendarView)).toEqual([calendarId]);
    expect(toViewItemIds(undatedView)).toContain(personalId);
    expect(toViewItemIds(undatedView)).toContain(unassigned.id);
    expect(toViewItemIds(attentionView)).toEqual([attentionId]);

    const stillReadable = await getItemRoute(
      createRequest(
        `http://localhost/api/items/${groupCreated.id}?groupId=${MOCK_GROUP_ALPHA_ID}&spaceId=${MOCK_GROUP_ALPHA_SPACE_ID}&spaceType=group`,
      ),
      routeParams({ id: groupCreated.id }),
    );
    expect(itemResponseSchema.parse(await readJson(stillReadable)).data.id).toBe(groupCreated.id);
  });

  it("supports the runtime scenario where one user belongs to multiple groups", async () => {
    const alphaResponse = await postItemRoute(
      createRequest("http://localhost/api/items", {
        body: JSON.stringify({
          groupId: MOCK_GROUP_ALPHA_ID,
          itemType: ITEM_TYPE.TASK,
          spaceId: MOCK_GROUP_ALPHA_SPACE_ID,
          spaceType: SPACE_TYPE.GROUP,
          temporal: { kind: TASK_TEMPORAL_KIND.UNDATED },
          title: "Alpha item",
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );
    const alphaId = parseItemId(await readJson(alphaResponse));

    const betaResponse = await postItemRoute(
      createRequest("http://localhost/api/items", {
        body: JSON.stringify({
          groupId: MOCK_GROUP_BETA_ID,
          itemType: ITEM_TYPE.TASK,
          spaceId: MOCK_GROUP_BETA_SPACE_ID,
          spaceType: SPACE_TYPE.GROUP,
          temporal: { kind: TASK_TEMPORAL_KIND.UNDATED },
          title: "Beta item",
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }, MOCK_GROUP_B_ONLY_USER_ID),
    );
    const betaId = parseItemId(await readJson(betaResponse));

    const alphaView = groupViewResponseSchema.parse(
      await readJson(
        await getGroupRoute(
          createRequest(`http://localhost/api/views/groups/${MOCK_GROUP_ALPHA_ID}`),
          routeParams({ groupId: MOCK_GROUP_ALPHA_ID }),
        ),
      ),
    );
    const betaView = groupViewResponseSchema.parse(
      await readJson(
        await getGroupRoute(
          createRequest(`http://localhost/api/views/groups/${MOCK_GROUP_BETA_ID}`),
          routeParams({ groupId: MOCK_GROUP_BETA_ID }),
        ),
      ),
    );
    const outsiderBetaView = await getGroupRoute(
      createRequest(`http://localhost/api/views/groups/${MOCK_GROUP_BETA_ID}`, undefined, MOCK_OUTSIDER_USER_ID),
      routeParams({ groupId: MOCK_GROUP_BETA_ID }),
    );

    expect(alphaView.data.groupId).toBe(MOCK_GROUP_ALPHA_ID);
    expect(betaView.data.groupId).toBe(MOCK_GROUP_BETA_ID);
    expect(alphaView.data.items.map((record) => record.item.id)).toEqual([alphaId]);
    expect(betaView.data.items.map((record) => record.item.id)).toEqual([betaId]);
    expect(outsiderBetaView.status).toBe(200);
    expect(toViewItemIds(await readJson(outsiderBetaView))).toEqual([]);
  });
});
