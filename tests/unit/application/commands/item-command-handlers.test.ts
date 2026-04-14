import {
  CreateItemCommandHandler,
  ITEM_COMMAND_ERROR_CODE,
  ReadItemByIdCommandHandler,
  UpdateItemCommandHandler,
  type ItemCommandRepository,
  type ItemRecord,
} from "@/application/commands";
import {
  AppendOnlyGroupItemAuditRecorder,
  type AppendGroupItemAuditEntryRepository,
} from "@/application/history";
import { GROUP_ITEM_AUDIT_CHANGE_KIND, type GroupItemAuditEntry } from "@/domain/history";
import {
  createGroupSpaceAccessContext,
  createPersonalSpaceAccessContext,
  type GroupSpaceAccessContext,
  type PersonalSpaceAccessContext,
} from "@/domain/access";
import {
  createAuthorizationActor,
  createGroupMembership,
  createUserIdentity,
} from "@/domain/identity";
import {
  createEventStartTemporal,
  createTaskDoneLifecycle,
  createGroupItemScope,
  createTaskPendingLifecycle,
  createTaskUndatedTemporal,
  type GroupItemScope,
  type PersonalItemScope,
} from "@/domain/item";
import { createPersonalItemScope } from "@/domain/item/scope";
import {
  ITEM_TYPE,
  createGroupId,
  createItemId,
  createMembershipId,
  createSpaceId,
  createUserId,
  createVersionToken,
} from "@/domain/shared";

class InMemoryItemCommandRepository implements ItemCommandRepository {
  private readonly records = new Map<string, ItemRecord>();

  public constructor(initialRecords: readonly ItemRecord[] = []) {
    initialRecords.forEach((record) => {
      this.records.set(record.item.id, record);
    });
  }

  public async findById(itemId: ReturnType<typeof createItemId>): Promise<ItemRecord | null> {
    return this.records.get(itemId) ?? null;
  }

  public async save(record: ItemRecord): Promise<void> {
    this.records.set(record.item.id, record);
  }
}

class InMemoryGroupItemAuditRepository
  implements AppendGroupItemAuditEntryRepository
{
  public readonly entries: GroupItemAuditEntry[] = [];

  public async append(entry: GroupItemAuditEntry): Promise<void> {
    this.entries.push(entry);
  }
}

interface PersonalCommandSpaceFixture {
  actor: ReturnType<typeof createAuthorizationActor>;
  ownerId: ReturnType<typeof createUserId>;
  scope: PersonalItemScope;
  accessContext: PersonalSpaceAccessContext;
}

interface GroupCommandSpaceFixture {
  actor: ReturnType<typeof createAuthorizationActor>;
  accessContext: GroupSpaceAccessContext;
  groupId: ReturnType<typeof createGroupId>;
  memberId: ReturnType<typeof createUserId>;
  outsiderActor: ReturnType<typeof createAuthorizationActor>;
  scope: GroupItemScope;
  teammateId: ReturnType<typeof createUserId>;
}

function createActor(userId: ReturnType<typeof createUserId>, displayName: string) {
  return createAuthorizationActor(createUserIdentity({ id: userId, displayName }));
}

function createPersonalFixture(): PersonalCommandSpaceFixture {
  const ownerId = createUserId("owner-1");

  return {
    accessContext: createPersonalSpaceAccessContext({
      ownerId,
      spaceId: createSpaceId("space-personal-1"),
    }),
    actor: createActor(ownerId, "Owner"),
    ownerId,
    scope: createPersonalItemScope({ ownerId }),
  };
}

function createGroupFixture(): GroupCommandSpaceFixture {
  const groupId = createGroupId("group-1");
  const memberId = createUserId("member-1");
  const teammateId = createUserId("member-2");
  const outsiderId = createUserId("outsider-1");
  const memberships = [
    createGroupMembership({
      groupId,
      id: createMembershipId("membership-1"),
      userId: memberId,
    }),
    createGroupMembership({
      groupId,
      id: createMembershipId("membership-2"),
      userId: teammateId,
    }),
  ];

  return {
    accessContext: createGroupSpaceAccessContext({
      groupId,
      memberships,
      spaceId: createSpaceId("space-group-1"),
    }),
    actor: createActor(memberId, "Member"),
    groupId,
    memberId,
    outsiderActor: createActor(outsiderId, "Outsider"),
    scope: createGroupItemScope({
      groupId,
      memberships,
    }),
    teammateId,
  };
}

describe("item command handlers", () => {
  it("creates a personal task using access, assignment, and label policies", async () => {
    const repository = new InMemoryItemCommandRepository();
    const fixture = createPersonalFixture();
    const handler = new CreateItemCommandHandler(repository);

    const result = await handler.execute({
      actor: fixture.actor,
      assigneeIds: [fixture.ownerId],
      itemId: createItemId("item-personal-1"),
      itemType: ITEM_TYPE.TASK,
      labels: [" Finance ", "finance"],
      space: {
        accessContext: fixture.accessContext,
        scope: fixture.scope,
      },
      temporal: createTaskUndatedTemporal(),
      title: "Pay taxes",
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.value.spaceType).toBe("personal");
    expect(result.value.assigneeIds).toEqual([fixture.ownerId]);
    expect(result.value.labels).toEqual([{ value: "finance" }]);
    expect(result.value.status).toBe("pending");
  });

  it("rejects group creation when a non-member is assigned", async () => {
    const repository = new InMemoryItemCommandRepository();
    const fixture = createGroupFixture();
    const handler = new CreateItemCommandHandler(repository);

    const result = await handler.execute({
      actor: fixture.actor,
      assigneeIds: [fixture.memberId, createUserId("outsider-2")],
      itemId: createItemId("item-group-invalid-1"),
      itemType: ITEM_TYPE.TASK,
      space: {
        accessContext: fixture.accessContext,
        scope: fixture.scope,
      },
      temporal: createTaskUndatedTemporal(),
      title: "Coordinate budget",
    });

    expect(result).toEqual({
      error: {
        code: ITEM_COMMAND_ERROR_CODE.VALIDATION_FAILED,
        message: "Item assignment violates the current space policy.",
        violations: [
          "Group items may only assign active group members: outsider-2.",
        ],
      },
      ok: false,
    });
  });

  it("updates a shared item when the expected version matches", async () => {
    const fixture = createGroupFixture();
    const seedRepository = new InMemoryItemCommandRepository();
    const auditRepository = new InMemoryGroupItemAuditRepository();
    const createHandler = new CreateItemCommandHandler(seedRepository);

    const created = await createHandler.execute({
      actor: fixture.actor,
      assigneeIds: [fixture.memberId],
      itemId: createItemId("item-group-1"),
      itemType: ITEM_TYPE.TASK,
      labels: ["Ops"],
      space: {
        accessContext: fixture.accessContext,
        scope: fixture.scope,
      },
      temporal: createTaskUndatedTemporal(),
      title: "Initial title",
    });

    expect(created.ok).toBe(true);

    const handler = new UpdateItemCommandHandler(
      seedRepository,
      new AppendOnlyGroupItemAuditRecorder(auditRepository),
    );
    const result = await handler.execute({
      actor: fixture.actor,
      assigneeIds: [fixture.memberId, fixture.teammateId],
      expectedVersionToken: created.ok ? created.value.versionToken : undefined,
      itemId: createItemId("item-group-1"),
      labels: ["Ops", "Q2"],
      lifecycle: createTaskPendingLifecycle(),
      space: {
        accessContext: fixture.accessContext,
        scope: fixture.scope,
      },
      temporal: createTaskUndatedTemporal(),
      title: "Updated title",
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.value.versionToken).toBe(1);
    expect(result.value.assigneeIds).toEqual([
      fixture.memberId,
      fixture.teammateId,
    ]);
    expect(result.value.labels).toEqual([{ value: "ops" }, { value: "q2" }]);
    expect(result.value.title).toBe("Updated title");
    expect(auditRepository.entries).toHaveLength(1);
    expect(auditRepository.entries[0]?.versionToken).toBe(1);
    expect(auditRepository.entries[0]?.actor.actorId).toBe(fixture.memberId);
    expect(auditRepository.entries[0]?.changes).toEqual([
      {
        after: "Updated title",
        before: "Initial title",
        kind: GROUP_ITEM_AUDIT_CHANGE_KIND.TITLE,
      },
      {
        after: [fixture.memberId, fixture.teammateId],
        before: [fixture.memberId],
        kind: GROUP_ITEM_AUDIT_CHANGE_KIND.ASSIGNEES,
      },
      {
        after: ["ops", "q2"],
        before: ["ops"],
        kind: GROUP_ITEM_AUDIT_CHANGE_KIND.LABELS,
      },
    ]);
  });

  it("appends a new audit entry for each tracked shared mutation", async () => {
    const fixture = createGroupFixture();
    const repository = new InMemoryItemCommandRepository();
    const auditRepository = new InMemoryGroupItemAuditRepository();
    const createHandler = new CreateItemCommandHandler(repository);

    const created = await createHandler.execute({
      actor: fixture.actor,
      assigneeIds: [fixture.memberId],
      itemId: createItemId("item-group-history-1"),
      itemType: ITEM_TYPE.TASK,
      space: {
        accessContext: fixture.accessContext,
        scope: fixture.scope,
      },
      temporal: createTaskUndatedTemporal(),
      title: "Prepare launch",
    });

    expect(created.ok).toBe(true);

    if (!created.ok) {
      return;
    }

    const handler = new UpdateItemCommandHandler(
      repository,
      new AppendOnlyGroupItemAuditRecorder(auditRepository),
    );

    const firstUpdate = await handler.execute({
      actor: fixture.actor,
      expectedVersionToken: created.value.versionToken,
      itemId: created.value.id,
      lifecycle: createTaskPendingLifecycle(),
      priority: "high",
      space: {
        accessContext: fixture.accessContext,
        scope: fixture.scope,
      },
      temporal: createTaskUndatedTemporal(),
      title: created.value.title,
    });

    expect(firstUpdate.ok).toBe(true);

    if (!firstUpdate.ok) {
      return;
    }

    const secondUpdate = await handler.execute({
      actor: fixture.actor,
      expectedVersionToken: firstUpdate.value.versionToken,
      itemId: firstUpdate.value.id,
      lifecycle: createTaskDoneLifecycle(new Date("2026-04-14T12:00:00.000Z")),
      space: {
        accessContext: fixture.accessContext,
        scope: fixture.scope,
      },
      temporal: createTaskUndatedTemporal(),
      title: firstUpdate.value.title,
    });

    expect(secondUpdate.ok).toBe(true);
    expect(auditRepository.entries).toHaveLength(2);
    expect(auditRepository.entries[0]?.changes).toEqual([
      {
        after: "high",
        before: "medium",
        kind: GROUP_ITEM_AUDIT_CHANGE_KIND.PRIORITY,
      },
    ]);
    expect(auditRepository.entries[1]?.changes).toEqual([
      {
        after: "done",
        before: "pending",
        kind: GROUP_ITEM_AUDIT_CHANGE_KIND.STATUS,
      },
      {
        after: {
          completedAt: new Date("2026-04-14T12:00:00.000Z"),
          isCompleted: true,
        },
        before: {
          completedAt: null,
          isCompleted: false,
        },
        kind: GROUP_ITEM_AUDIT_CHANGE_KIND.COMPLETION,
      },
    ]);
  });

  it("does not emit group audit entries for personal item mutations", async () => {
    const repository = new InMemoryItemCommandRepository();
    const auditRepository = new InMemoryGroupItemAuditRepository();
    const fixture = createPersonalFixture();
    const createHandler = new CreateItemCommandHandler(repository);

    const created = await createHandler.execute({
      actor: fixture.actor,
      assigneeIds: [fixture.ownerId],
      itemId: createItemId("item-personal-audit-1"),
      itemType: ITEM_TYPE.TASK,
      space: {
        accessContext: fixture.accessContext,
        scope: fixture.scope,
      },
      temporal: createTaskUndatedTemporal(),
      title: "Personal work",
    });

    expect(created.ok).toBe(true);

    if (!created.ok) {
      return;
    }

    const handler = new UpdateItemCommandHandler(
      repository,
      new AppendOnlyGroupItemAuditRecorder(auditRepository),
    );

    const result = await handler.execute({
      actor: fixture.actor,
      itemId: created.value.id,
      lifecycle: createTaskPendingLifecycle(),
      priority: "urgent",
      space: {
        accessContext: fixture.accessContext,
        scope: fixture.scope,
      },
      temporal: createTaskUndatedTemporal(),
      title: "Personal work updated",
    });

    expect(result.ok).toBe(true);
    expect(auditRepository.entries).toEqual([]);
  });

  it("rejects shared updates when the optimistic version is stale", async () => {
    const fixture = createGroupFixture();
    const repository = new InMemoryItemCommandRepository();
    const createHandler = new CreateItemCommandHandler(repository);

    await createHandler.execute({
      actor: fixture.actor,
      itemId: createItemId("item-group-2"),
      itemType: ITEM_TYPE.EVENT,
      space: {
        accessContext: fixture.accessContext,
        scope: fixture.scope,
      },
      temporal: createEventStartTemporal(new Date("2026-04-14T09:00:00.000Z")),
      title: "Standup",
    });

    const handler = new UpdateItemCommandHandler(repository);
    const result = await handler.execute({
      actor: fixture.actor,
      expectedVersionToken: createVersionToken(7),
      itemId: createItemId("item-group-2"),
      itemType: ITEM_TYPE.EVENT,
      space: {
        accessContext: fixture.accessContext,
        scope: fixture.scope,
      },
      temporal: createEventStartTemporal(new Date("2026-04-14T10:00:00.000Z")),
      title: "Standup moved",
    });

    expect(result.ok).toBe(false);

    if (result.ok) {
      return;
    }

    expect(result.error.code).toBe(ITEM_COMMAND_ERROR_CODE.VERSION_CONFLICT);
    expect(result.error.actualVersionToken).toBe(0);
  });

  it("enforces access rules on read-by-id", async () => {
    const fixture = createGroupFixture();
    const repository = new InMemoryItemCommandRepository();
    const createHandler = new CreateItemCommandHandler(repository);

    await createHandler.execute({
      actor: fixture.actor,
      itemId: createItemId("item-group-3"),
      itemType: ITEM_TYPE.TASK,
      space: {
        accessContext: fixture.accessContext,
        scope: fixture.scope,
      },
      temporal: createTaskUndatedTemporal(),
      title: "Shared task",
    });

    const handler = new ReadItemByIdCommandHandler(repository);
    const outsiderResult = await handler.execute({
      actor: fixture.outsiderActor,
      itemId: createItemId("item-group-3"),
      space: {
        accessContext: fixture.accessContext,
        scope: fixture.scope,
      },
    });

    expect(outsiderResult).toEqual({
      error: {
        code: ITEM_COMMAND_ERROR_CODE.ACCESS_DENIED,
        message: "Actor is not allowed to access this item.",
      },
      ok: false,
    });
  });
});
