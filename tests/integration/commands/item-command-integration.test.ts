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
  type GroupSpaceAccessContext,
} from "@/domain/access";
import {
  createAuthorizationActor,
  createGroupMembership,
  createUserIdentity,
} from "@/domain/identity";
import {
  createGroupItemScope,
  createTaskInProgressLifecycle,
  createTaskPendingLifecycle,
  createTaskUndatedTemporal,
  type GroupItemScope,
} from "@/domain/item";
import {
  ITEM_TYPE,
  createGroupId,
  createItemId,
  createMembershipId,
  createSpaceId,
  createUserId,
} from "@/domain/shared";

class InMemoryItemCommandRepository implements ItemCommandRepository {
  private readonly records = new Map<string, ItemRecord>();

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

interface GroupCommandFixture {
  accessContext: GroupSpaceAccessContext;
  actor: ReturnType<typeof createAuthorizationActor>;
  scope: GroupItemScope;
  teammateActor: ReturnType<typeof createAuthorizationActor>;
  teammateId: ReturnType<typeof createUserId>;
}

function createActor(userId: ReturnType<typeof createUserId>, displayName: string) {
  return createAuthorizationActor(createUserIdentity({ id: userId, displayName }));
}

function createGroupFixture(): GroupCommandFixture {
  const groupId = createGroupId("group-integration-1");
  const memberId = createUserId("member-integration-1");
  const teammateId = createUserId("member-integration-2");
  const memberships = [
    createGroupMembership({
      groupId,
      id: createMembershipId("membership-integration-1"),
      userId: memberId,
    }),
    createGroupMembership({
      groupId,
      id: createMembershipId("membership-integration-2"),
      userId: teammateId,
    }),
  ];

  return {
    accessContext: createGroupSpaceAccessContext({
      groupId,
      memberships,
      spaceId: createSpaceId("space-integration-group-1"),
    }),
    actor: createActor(memberId, "Member"),
    scope: createGroupItemScope({ groupId, memberships }),
    teammateActor: createActor(teammateId, "Teammate"),
    teammateId,
  };
}

describe("item command integration", () => {
  it("allows a group member who is not assigned to edit through membership", async () => {
    const repository = new InMemoryItemCommandRepository();
    const auditRepository = new InMemoryGroupItemAuditRepository();
    const fixture = createGroupFixture();
    const createHandler = new CreateItemCommandHandler(repository);

    const created = await createHandler.execute({
      actor: fixture.actor,
      assigneeIds: [fixture.teammateId],
      itemId: createItemId("item-membership-authority-1"),
      itemType: ITEM_TYPE.TASK,
      space: {
        accessContext: fixture.accessContext,
        scope: fixture.scope,
      },
      temporal: createTaskUndatedTemporal(),
      title: "Shared draft",
    });

    expect(created.ok).toBe(true);

    if (!created.ok) {
      return;
    }

    const updateHandler = new UpdateItemCommandHandler(
      repository,
      new AppendOnlyGroupItemAuditRecorder(auditRepository),
    );
    const updated = await updateHandler.execute({
      actor: fixture.actor,
      expectedVersionToken: created.value.versionToken,
      itemId: created.value.id,
      lifecycle: createTaskInProgressLifecycle(),
      space: {
        accessContext: fixture.accessContext,
        scope: fixture.scope,
      },
      temporal: createTaskUndatedTemporal(),
      title: "Shared draft reviewed",
    });

    expect(updated.ok).toBe(true);

    if (!updated.ok) {
      return;
    }

    expect(updated.value.assigneeIds).toEqual([fixture.teammateId]);
    expect(updated.value.status).toBe("in_progress");
    expect(updated.value.title).toBe("Shared draft reviewed");
    expect(auditRepository.entries).toHaveLength(1);
  });

  it("keeps membership-based access after assignment changes remove a member as assignee", async () => {
    const repository = new InMemoryItemCommandRepository();
    const fixture = createGroupFixture();
    const createHandler = new CreateItemCommandHandler(repository);

    const created = await createHandler.execute({
      actor: fixture.actor,
      assigneeIds: [fixture.teammateId],
      itemId: createItemId("item-assignment-access-1"),
      itemType: ITEM_TYPE.TASK,
      space: {
        accessContext: fixture.accessContext,
        scope: fixture.scope,
      },
      temporal: createTaskUndatedTemporal(),
      title: "Assignment should not gate access",
    });

    expect(created.ok).toBe(true);

    if (!created.ok) {
      return;
    }

    const updateHandler = new UpdateItemCommandHandler(repository);
    const reassigned = await updateHandler.execute({
      actor: fixture.teammateActor,
      assigneeIds: [],
      expectedVersionToken: created.value.versionToken,
      itemId: created.value.id,
      lifecycle: createTaskPendingLifecycle(),
      space: {
        accessContext: fixture.accessContext,
        scope: fixture.scope,
      },
      temporal: createTaskUndatedTemporal(),
      title: created.value.title,
    });

    expect(reassigned.ok).toBe(true);

    if (!reassigned.ok) {
      return;
    }

    const readHandler = new ReadItemByIdCommandHandler(repository);
    const readResult = await readHandler.execute({
      actor: fixture.teammateActor,
      itemId: created.value.id,
      space: {
        accessContext: fixture.accessContext,
        scope: fixture.scope,
      },
    });
    const updated = await updateHandler.execute({
      actor: fixture.teammateActor,
      expectedVersionToken: reassigned.value.versionToken,
      itemId: created.value.id,
      lifecycle: createTaskInProgressLifecycle(),
      space: {
        accessContext: fixture.accessContext,
        scope: fixture.scope,
      },
      temporal: createTaskUndatedTemporal(),
      title: "Still editable after unassignment",
    });

    expect(readResult.ok).toBe(true);
    expect(updated.ok).toBe(true);

    if (!readResult.ok || !updated.ok) {
      return;
    }

    expect(readResult.value.assigneeIds).toEqual([]);
    expect(updated.value.assigneeIds).toEqual([]);
    expect(updated.value.title).toBe("Still editable after unassignment");
  });

  it("appends an audit entry for each group edit with actor and version context", async () => {
    const repository = new InMemoryItemCommandRepository();
    const auditRepository = new InMemoryGroupItemAuditRepository();
    const fixture = createGroupFixture();
    const createHandler = new CreateItemCommandHandler(repository);

    const created = await createHandler.execute({
      actor: fixture.actor,
      itemId: createItemId("item-audit-append-1"),
      itemType: ITEM_TYPE.TASK,
      space: {
        accessContext: fixture.accessContext,
        scope: fixture.scope,
      },
      temporal: createTaskUndatedTemporal(),
      title: "Audit me",
    });

    expect(created.ok).toBe(true);

    if (!created.ok) {
      return;
    }

    const updateHandler = new UpdateItemCommandHandler(
      repository,
      new AppendOnlyGroupItemAuditRecorder(auditRepository),
    );

    const firstUpdate = await updateHandler.execute({
      actor: fixture.actor,
      expectedVersionToken: created.value.versionToken,
      itemId: created.value.id,
      lifecycle: createTaskInProgressLifecycle(),
      space: {
        accessContext: fixture.accessContext,
        scope: fixture.scope,
      },
      temporal: createTaskUndatedTemporal(),
      title: "Audit me now",
    });

    expect(firstUpdate.ok).toBe(true);

    if (!firstUpdate.ok) {
      return;
    }

    const secondUpdate = await updateHandler.execute({
      actor: fixture.teammateActor,
      assigneeIds: [fixture.teammateId],
      expectedVersionToken: firstUpdate.value.versionToken,
      itemId: firstUpdate.value.id,
      lifecycle: createTaskInProgressLifecycle(),
      space: {
        accessContext: fixture.accessContext,
        scope: fixture.scope,
      },
      temporal: createTaskUndatedTemporal(),
      title: firstUpdate.value.title,
    });

    expect(secondUpdate.ok).toBe(true);
    expect(auditRepository.entries).toHaveLength(2);
    expect(auditRepository.entries.map((entry) => entry.actor.actorId)).toEqual([
      fixture.actor.userId,
      fixture.teammateActor.userId,
    ]);
    expect(auditRepository.entries.map((entry) => entry.versionToken)).toEqual([1, 2]);
    expect(auditRepository.entries[0]?.changes.map((change) => change.kind)).toEqual([
      GROUP_ITEM_AUDIT_CHANGE_KIND.STATUS,
      GROUP_ITEM_AUDIT_CHANGE_KIND.TITLE,
    ]);
    expect(auditRepository.entries[1]?.changes).toEqual([
      {
        after: [fixture.teammateId],
        before: [],
        kind: GROUP_ITEM_AUDIT_CHANGE_KIND.ASSIGNEES,
      },
    ]);
  });

  it("rejects stale group updates with a version conflict and preserves the stored state", async () => {
    const repository = new InMemoryItemCommandRepository();
    const auditRepository = new InMemoryGroupItemAuditRepository();
    const fixture = createGroupFixture();
    const createHandler = new CreateItemCommandHandler(repository);

    const created = await createHandler.execute({
      actor: fixture.actor,
      itemId: createItemId("item-version-conflict-1"),
      itemType: ITEM_TYPE.TASK,
      space: {
        accessContext: fixture.accessContext,
        scope: fixture.scope,
      },
      temporal: createTaskUndatedTemporal(),
      title: "Concurrent work",
    });

    expect(created.ok).toBe(true);

    if (!created.ok) {
      return;
    }

    const updateHandler = new UpdateItemCommandHandler(
      repository,
      new AppendOnlyGroupItemAuditRecorder(auditRepository),
    );

    const winningUpdate = await updateHandler.execute({
      actor: fixture.teammateActor,
      expectedVersionToken: created.value.versionToken,
      itemId: created.value.id,
      lifecycle: createTaskInProgressLifecycle(),
      space: {
        accessContext: fixture.accessContext,
        scope: fixture.scope,
      },
      temporal: createTaskUndatedTemporal(),
      title: "Concurrent work accepted",
    });

    expect(winningUpdate.ok).toBe(true);

    const staleUpdate = await updateHandler.execute({
      actor: fixture.actor,
      expectedVersionToken: created.value.versionToken,
      itemId: created.value.id,
      lifecycle: createTaskPendingLifecycle(),
      space: {
        accessContext: fixture.accessContext,
        scope: fixture.scope,
      },
      temporal: createTaskUndatedTemporal(),
      title: "Concurrent work lost",
    });

    expect(staleUpdate).toEqual({
      error: {
        actualVersionToken: 1,
        code: ITEM_COMMAND_ERROR_CODE.VERSION_CONFLICT,
        expectedVersionToken: 0,
        message: "Shared item version does not match the expected version.",
      },
      ok: false,
    });

    const readHandler = new ReadItemByIdCommandHandler(repository);
    const persisted = await readHandler.execute({
      actor: fixture.actor,
      itemId: created.value.id,
      space: {
        accessContext: fixture.accessContext,
        scope: fixture.scope,
      },
    });

    expect(persisted.ok).toBe(true);

    if (!persisted.ok) {
      return;
    }

    expect(persisted.value.title).toBe("Concurrent work accepted");
    expect(persisted.value.versionToken).toBe(1);
    expect(auditRepository.entries).toHaveLength(1);
  });

});
