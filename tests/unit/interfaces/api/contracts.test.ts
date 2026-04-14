import {
  ITEM_COMMAND_ERROR_CODE,
  toItemOutput,
  type ItemRecord,
} from "@/application/commands";
import { projectItemQueryFacts, type AttentionThresholds } from "@/application/queries/projectors";
import {
  VIEW_SPACE_FILTER,
  type ItemViewRecord,
} from "@/application/queries/views";
import { GROUP_ITEM_AUDIT_CHANGE_KIND, createGroupItemAuditEntry } from "@/domain/history";
import { createActorMetadata, createUserIdentity } from "@/domain/identity";
import {
  createEventCompletedLifecycle,
  createEventItem,
  createEventStartAndEndTemporal,
  createGroupItemScope,
  createTaskBlockedLifecycle,
  createTaskItem,
  createTaskPendingLifecycle,
  createTaskStartEndAndDueTemporal,
  createTaskUndatedTemporal,
  validateItemLabels,
  type ItemLabel,
} from "@/domain/item";
import {
  SPACE_TYPE,
  createGroupId,
  createItemId,
  createSpaceId,
  createUserId,
  createVersionToken,
} from "@/domain/shared";
import {
  calendarRangeRequestSchema,
  itemHistoryResponseSchema,
  itemResponseSchema,
  toAttentionViewResponse,
  toItemCommandResultResponse,
  toItemHistoryEntriesResponse,
} from "@/interfaces/api";

const THRESHOLDS: AttentionThresholds = {
  openItemDays: 7,
  postponeCount: 3,
};

function createLabels(values: readonly string[]): readonly ItemLabel[] {
  const result = validateItemLabels({
    labels: values,
    scope: createGroupItemScope({
      groupId: createGroupId("group-1"),
      memberships: [],
    }),
  });

  if (!result.isValid) {
    throw new Error("Expected valid labels in test fixture.");
  }

  return result.labels;
}

function createTaskRecord(): ItemRecord {
  const ownerId = createUserId("owner-1");

  return {
    assigneeIds: [ownerId],
    groupId: null,
    item: createTaskItem({
      createdAt: new Date("2026-04-10T10:00:00.000Z"),
      id: createItemId("item-task-1"),
      itemType: "task",
      lifecycle: createTaskBlockedLifecycle(),
      notes: "Needs review",
      postponeCount: 2,
      spaceId: createSpaceId("space-personal-1"),
      spaceType: SPACE_TYPE.PERSONAL,
      temporal: createTaskStartEndAndDueTemporal(
        new Date("2026-04-14T09:00:00.000Z"),
        new Date("2026-04-14T10:00:00.000Z"),
        new Date("2026-04-14T18:00:00.000Z"),
      ),
      title: "Prepare launch notes",
      updatedAt: new Date("2026-04-12T10:00:00.000Z"),
    }),
    labels: createLabels(["Launch", "Docs"]),
    ownerId,
    spaceType: SPACE_TYPE.PERSONAL,
  };
}

function createViewRecord(): ItemViewRecord {
  const memberId = createUserId("member-1");
  const itemRecord: ItemRecord = {
    assigneeIds: [memberId],
    groupId: createGroupId("group-1"),
    item: createEventItem({
      createdAt: new Date("2026-04-10T10:00:00.000Z"),
      id: createItemId("item-event-1"),
      itemType: "event",
      lifecycle: createEventCompletedLifecycle(new Date("2026-04-14T11:00:00.000Z")),
      spaceId: createSpaceId("space-group-1"),
      spaceType: SPACE_TYPE.GROUP,
      temporal: createEventStartAndEndTemporal(
        new Date("2026-04-14T09:00:00.000Z"),
        new Date("2026-04-14T10:00:00.000Z"),
      ),
      title: "Sprint review",
      updatedAt: new Date("2026-04-14T11:00:00.000Z"),
    }),
    labels: createLabels(["Ceremony"]),
    ownerId: null,
    spaceType: SPACE_TYPE.GROUP,
  };

  return {
    item: toItemOutput(itemRecord),
    projection: projectItemQueryFacts({
      record: itemRecord,
      referenceDate: new Date("2026-04-14T12:00:00.000Z"),
      thresholds: THRESHOLDS,
    }),
  };
}

describe("API contracts", () => {
  it("serializes stable task item responses with Zod-validated ISO fields", () => {
    const response = toItemCommandResultResponse({
      ok: true,
      value: toItemOutput(createTaskRecord()),
    });

    expect("data" in response).toBe(true);
    expect(itemResponseSchema.parse(response).data.temporal.kind).toBe("start_end_and_due");
    expect(itemResponseSchema.parse(response).data.labels).toEqual([
      { value: "launch" },
      { value: "docs" },
    ]);
  });

  it("preserves optimistic concurrency metadata in conflict errors", () => {
    const response = toItemCommandResultResponse({
      error: {
        actualVersionToken: createVersionToken(4),
        code: ITEM_COMMAND_ERROR_CODE.VERSION_CONFLICT,
        expectedVersionToken: createVersionToken(3),
        message: "Shared item version does not match the expected version.",
      },
      ok: false,
    });

    expect("error" in response).toBe(true);
    if (!("error" in response)) {
      return;
    }

    expect(response.error.code).toBe(ITEM_COMMAND_ERROR_CODE.VERSION_CONFLICT);
    if (response.error.code !== ITEM_COMMAND_ERROR_CODE.VERSION_CONFLICT) {
      return;
    }

    expect(response.error.actualVersionToken).toBe(4);
    expect(response.error.expectedVersionToken).toBe(3);
  });

  it("serializes item history audit entries for shared items", () => {
    const actorId = createUserId("member-1");
    const itemId = createItemId("group-item-1");
    const groupId = createGroupId("group-1");
    const before = {
      assigneeIds: [actorId],
      groupId,
      item: createTaskItem({
        createdAt: new Date("2026-04-10T10:00:00.000Z"),
        id: itemId,
        itemType: "task",
        lifecycle: createTaskPendingLifecycle(),
        spaceId: createSpaceId("space-group-1"),
        spaceType: SPACE_TYPE.GROUP,
        temporal: createTaskUndatedTemporal(),
        title: "Before",
        updatedAt: new Date("2026-04-10T10:00:00.000Z"),
      }),
      labels: createLabels(["Ops"]),
    };
    const after = {
      assigneeIds: [actorId],
      groupId,
      item: createTaskItem({
        createdAt: new Date("2026-04-10T10:00:00.000Z"),
        id: itemId,
        itemType: "task",
        lifecycle: createTaskBlockedLifecycle(),
        spaceId: createSpaceId("space-group-1"),
        spaceType: SPACE_TYPE.GROUP,
        temporal: createTaskUndatedTemporal(),
        title: "After",
        updatedAt: new Date("2026-04-11T10:00:00.000Z"),
      }),
      labels: createLabels(["Ops", "Urgent"]),
    };

    const entry = createGroupItemAuditEntry({
      actor: createActorMetadata(
        createUserIdentity({
          displayName: "Member",
          email: "member@example.com",
          id: actorId,
        }),
      ),
      after,
      before,
    });

    expect(entry).not.toBeNull();
    if (entry === null) {
      return;
    }

    const response = toItemHistoryEntriesResponse(itemId, [entry]);
    const parsed = itemHistoryResponseSchema.parse(response);

    expect(parsed.data.entries[0]?.changes.map((change) => change.kind)).toEqual([
      GROUP_ITEM_AUDIT_CHANGE_KIND.STATUS,
      GROUP_ITEM_AUDIT_CHANGE_KIND.TITLE,
      GROUP_ITEM_AUDIT_CHANGE_KIND.LABELS,
    ]);
  });

  it("validates view payloads and calendar range contracts", () => {
    const response = toAttentionViewResponse(
      {
        items: [createViewRecord()],
        spaceFilter: VIEW_SPACE_FILTER.GROUP,
        totalCount: 1,
      },
      { includeCompletedEvents: true },
    );

    expect(response.data.items[0]?.projection.attention.isOpen).toBe(false);
    expect(response.data.spaceFilter).toBe(VIEW_SPACE_FILTER.GROUP);
    expect(
      calendarRangeRequestSchema.safeParse({
        endAt: "2026-04-13T09:00:00.000Z",
        startAt: "2026-04-14T09:00:00.000Z",
      }).success,
    ).toBe(false);
  });
});
