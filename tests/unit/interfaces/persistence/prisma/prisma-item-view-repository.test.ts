import type { PrismaClient } from "@prisma/client";

import {
  MY_VIEW_MEMBERSHIP,
  QUERY_VISIBILITY_SCOPE,
} from "@/application/queries/projectors";
import { PRIORITY, SPACE_TYPE } from "@/domain/shared";
import {
  PrismaItemViewRepository,
  type PrismaItemAggregate,
} from "@/interfaces/persistence/prisma";
import { describe, expect, it, vi } from "vitest";

function createMockClient() {
  return {
    item: {
      findMany: vi.fn(),
    },
  };
}

function createItemAggregate(
  overrides: Partial<PrismaItemAggregate> = {},
): PrismaItemAggregate {
  const id = overrides.id ?? "item-1";
  const createdAt = overrides.createdAt ?? new Date("2026-04-10T08:00:00.000Z");
  const updatedAt = overrides.updatedAt ?? createdAt;
  const spaceType = overrides.spaceType ?? SPACE_TYPE.PERSONAL;

  return {
    assignees: overrides.assignees ?? [],
    canceledAt: overrides.canceledAt ?? null,
    completedAt: overrides.completedAt ?? null,
    createdAt,
    dueAt: overrides.dueAt ?? null,
    endAt: overrides.endAt ?? null,
    groupId: overrides.groupId ?? null,
    id,
    itemType: overrides.itemType ?? "task",
    labels: overrides.labels ?? [],
    notes: overrides.notes ?? null,
    ownerId: overrides.ownerId ?? (spaceType === SPACE_TYPE.PERSONAL ? "user-1" : null),
    postponedUntil: overrides.postponedUntil ?? null,
    postponeCount: overrides.postponeCount ?? 0,
    priority: overrides.priority ?? PRIORITY.MEDIUM,
    spaceId: overrides.spaceId ?? "space-personal-1",
    spaceType,
    startAt: overrides.startAt ?? null,
    status: overrides.status ?? "pending",
    temporalKind: overrides.temporalKind ?? "undated",
    title: overrides.title ?? `Title ${id}`,
    updatedAt,
    versionToken: overrides.versionToken ?? 0,
  };
}

describe("PrismaItemViewRepository", () => {
  it("loads projected items with stable visibility facts across multiple groups", async () => {
    const client = createMockClient();
    const repository = new PrismaItemViewRepository(client as unknown as PrismaClient);

    client.item.findMany.mockResolvedValue([
      createItemAggregate({
        id: "personal-item",
        ownerId: "user-1",
        spaceId: "space-personal-1",
        spaceType: SPACE_TYPE.PERSONAL,
      }),
      createItemAggregate({
        assignees: [
          {
            createdAt: new Date("2026-04-10T09:00:00.000Z"),
            itemId: "group-alpha-item",
            membership: {
              createdAt: new Date("2026-04-09T09:00:00.000Z"),
              groupId: "group-alpha",
              id: "membership-alpha-user-2",
              isActive: true,
              role: "member",
              updatedAt: new Date("2026-04-09T09:00:00.000Z"),
              userId: "user-2",
            },
            membershipId: "membership-alpha-user-2",
            user: {
              displayName: "User 2",
              email: "user-2@example.com",
              id: "user-2",
            },
            userId: "user-2",
          },
        ],
        groupId: "group-alpha",
        id: "group-alpha-item",
        ownerId: null,
        spaceId: "space-group-alpha",
        spaceType: SPACE_TYPE.GROUP,
      }),
      createItemAggregate({
        groupId: "group-beta",
        id: "group-beta-item",
        ownerId: null,
        spaceId: "space-group-beta",
        spaceType: SPACE_TYPE.GROUP,
      }),
    ]);

    const records = await repository.listProjectedItems();

    expect(client.item.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      }),
    );
    expect(records).toHaveLength(3);
    expect(records.map((record) => record.projection.visibility.groupId)).toEqual([
      null,
      "group-alpha",
      "group-beta",
    ]);
    expect(records.map((record) => record.projection.visibility.groupViewGroupId)).toEqual([
      null,
      "group-alpha",
      "group-beta",
    ]);
    expect(records[0]?.projection.visibility).toEqual({
      groupId: null,
      groupViewGroupId: null,
      myViewMembership: MY_VIEW_MEMBERSHIP.PERSONAL_OWNER,
      ownerId: "user-1",
      visibilityScope: QUERY_VISIBILITY_SCOPE.PERSONAL_OWNER,
    });
    expect(records[1]?.projection.visibility).toEqual({
      groupId: "group-alpha",
      groupViewGroupId: "group-alpha",
      myViewMembership: MY_VIEW_MEMBERSHIP.GROUP_ASSIGNEE_OR_UNASSIGNED,
      ownerId: null,
      visibilityScope: QUERY_VISIBILITY_SCOPE.GROUP_MEMBERS,
    });
    expect(records[2]?.projection.visibility).toEqual({
      groupId: "group-beta",
      groupViewGroupId: "group-beta",
      myViewMembership: MY_VIEW_MEMBERSHIP.GROUP_ASSIGNEE_OR_UNASSIGNED,
      ownerId: null,
      visibilityScope: QUERY_VISIBILITY_SCOPE.GROUP_MEMBERS,
    });
  });

  it("keeps unassigned group items eligible for my view and attention/dated filters", async () => {
    const client = createMockClient();
    const repository = new PrismaItemViewRepository(client as unknown as PrismaClient, {
      referenceDate: new Date("2026-04-14T12:00:00.000Z"),
    });

    client.item.findMany.mockResolvedValue([
      createItemAggregate({
        createdAt: new Date("2026-04-01T08:00:00.000Z"),
        dueAt: new Date("2026-04-14T09:00:00.000Z"),
        groupId: "group-alpha",
        id: "unassigned-overdue-item",
        ownerId: null,
        spaceId: "space-group-alpha",
        spaceType: SPACE_TYPE.GROUP,
        temporalKind: "due_date",
      }),
    ]);

    const [record] = await repository.listProjectedItems();

    expect(record).toBeDefined();
    expect(record?.projection.assigneeSummary).toEqual({
      assigneeCount: 0,
      assigneeIds: [],
      hasMultipleAssignees: false,
      isUnassigned: true,
      primaryAssigneeId: null,
    });
    expect(record?.projection.visibility.myViewMembership).toBe(
      MY_VIEW_MEMBERSHIP.GROUP_ASSIGNEE_OR_UNASSIGNED,
    );
    expect(record?.projection.datedSpan).toEqual({
      calendarEndAt: new Date("2026-04-14T09:00:00.000Z"),
      calendarStartAt: new Date("2026-04-14T09:00:00.000Z"),
      dueAt: new Date("2026-04-14T09:00:00.000Z"),
      isDated: true,
    });
    expect(record?.projection.attention).toEqual({
      isOpen: true,
      reasons: ["overdue", "open_too_long"],
    });
  });
});
