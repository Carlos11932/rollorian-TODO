import { createGroupItemAuditEntry, GROUP_ITEM_AUDIT_CHANGE_KIND } from "@/domain/history";
import { createAuthorizationActor, createUserIdentity } from "@/domain/identity";
import {
  createEventCanceledLifecycle,
  createEventItem,
  createEventStartAndEndTemporal,
  createEventScheduledLifecycle,
  createItemLabel,
} from "@/domain/item";
import {
  ITEM_TYPE,
  SPACE_TYPE,
  createGroupId,
  createItemId,
  createSpaceId,
  createUserId,
  createVersionToken,
} from "@/domain/shared";

describe("group item audit", () => {
  it("captures date and cancellation diffs for shared items", () => {
    const actor = createAuthorizationActor(
      createUserIdentity({
        displayName: "Member",
        id: createUserId("member-1"),
      }),
    );
    const groupId = createGroupId("group-1");
    const itemId = createItemId("item-1");
    const spaceId = createSpaceId("space-group-1");
    const beforeStartAt = new Date("2026-04-14T09:00:00.000Z");
    const beforeEndAt = new Date("2026-04-14T10:00:00.000Z");
    const afterStartAt = new Date("2026-04-14T11:00:00.000Z");
    const afterEndAt = new Date("2026-04-14T12:00:00.000Z");
    const canceledAt = new Date("2026-04-14T08:30:00.000Z");

    const entry = createGroupItemAuditEntry({
      actor: actor.metadata,
      after: {
        assigneeIds: [actor.userId],
        groupId,
        item: createEventItem({
          createdAt: new Date("2026-04-10T00:00:00.000Z"),
          id: itemId,
          itemType: ITEM_TYPE.EVENT,
          lifecycle: createEventCanceledLifecycle(canceledAt),
          spaceId,
          spaceType: SPACE_TYPE.GROUP,
          temporal: createEventStartAndEndTemporal(afterStartAt, afterEndAt),
          title: "Incident review",
          updatedAt: canceledAt,
          versionToken: createVersionToken(2),
        }),
        labels: [createItemLabel("Ops")],
      },
      before: {
        assigneeIds: [actor.userId],
        groupId,
        item: createEventItem({
          createdAt: new Date("2026-04-10T00:00:00.000Z"),
          id: itemId,
          itemType: ITEM_TYPE.EVENT,
          lifecycle: createEventScheduledLifecycle(),
          spaceId,
          spaceType: SPACE_TYPE.GROUP,
          temporal: createEventStartAndEndTemporal(beforeStartAt, beforeEndAt),
          title: "Incident review",
          updatedAt: new Date("2026-04-10T00:00:00.000Z"),
          versionToken: createVersionToken(1),
        }),
        labels: [createItemLabel("Ops")],
      },
    });

    expect(entry).not.toBeNull();
    expect(entry?.changes).toEqual([
      {
        after: "canceled",
        before: "scheduled",
        kind: GROUP_ITEM_AUDIT_CHANGE_KIND.STATUS,
      },
      {
        after: {
          dueAt: null,
          endAt: afterEndAt,
          startAt: afterStartAt,
          temporalKind: "start_and_end",
        },
        before: {
          dueAt: null,
          endAt: beforeEndAt,
          startAt: beforeStartAt,
          temporalKind: "start_and_end",
        },
        kind: GROUP_ITEM_AUDIT_CHANGE_KIND.DATES,
      },
      {
        after: {
          canceledAt,
          isCanceled: true,
        },
        before: {
          canceledAt: null,
          isCanceled: false,
        },
        kind: GROUP_ITEM_AUDIT_CHANGE_KIND.CANCELLATION,
      },
    ]);
    expect(entry?.versionToken).toBe(2);
    expect(entry?.changedAt).toEqual(canceledAt);
  });
});
