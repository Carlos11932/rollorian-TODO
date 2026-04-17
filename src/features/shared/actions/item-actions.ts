'use server';

import { createItemId, createGroupId, ITEM_TYPE } from '@/domain/shared';
import type { Priority, ItemType } from '@/domain/shared';
import {
  createTaskUndatedTemporal,
  createTaskDueDateTemporal,
  createEventStartTemporal,
} from '@/domain/item';
import {
  TASK_STATUS,
  EVENT_STATUS,
  createTaskPendingLifecycle,
  createTaskInProgressLifecycle,
  createTaskBlockedLifecycle,
  createTaskPostponedLifecycle,
  createTaskDoneLifecycle,
  createTaskCanceledLifecycle,
  createEventScheduledLifecycle,
  createEventCompletedLifecycle,
  createEventCanceledLifecycle,
} from '@/domain/item';
import type { TaskStatus, EventStatus } from '@/domain/item';
import {
  createItemHandler,
  updateItemHandler,
  findItemById,
  removeItem,
  ensureDevSeed,
} from '@/lib/item-command-factory';
import {
  MOCK_ACTOR,
  MOCK_PERSONAL_COMMAND_SPACE,
  MOCK_USER_ID,
  createMockPersonalCommandSpace,
  createMockGroupCommandSpace,
} from '@/dev-data/actor';
import { SEED_GROUP_IDS, SEED_SPACE_IDS, SEED_USER_IDS } from '@/dev-data/seed';
import { createGroupMembership, MEMBERSHIP_ROLE } from '@/domain/identity';
import { createGroupSpaceAccessContext } from '@/domain/access';
import { createGroupItemScope } from '@/domain/item';
import { createMembershipId, createSpaceId, createUserId } from '@/domain/shared';
import {
  buildPersonalActorAndSpace,
  buildGroupActorAndSpace,
  buildActorAndSpaceForItem,
  personalSpaceId,
  groupSpaceId,
} from '@/lib/session-command-space';
import { toItemView } from '@/interfaces/views/item-view';
import type { ItemView } from '@/interfaces/views/item-view';
import type { ItemCommandSpace } from '@/application/commands/shared';

const IS_DEV = process.env.NODE_ENV !== 'production';

export type ActionResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

/** 'personal' or a real group ID string from the DB */
export type SpaceTarget = 'personal' | string;

// ── Dev-only command space resolver (uses seeded mock data) ────────────────────

async function resolveDevCommandSpace(spaceTarget: SpaceTarget): Promise<ItemCommandSpace> {
  if (spaceTarget === 'personal') return MOCK_PERSONAL_COMMAND_SPACE;

  const groupId =
    spaceTarget === 'group-1' ? SEED_GROUP_IDS.alpha : SEED_GROUP_IDS.producto;
  const spaceId =
    spaceTarget === 'group-1' ? SEED_SPACE_IDS.alpha : SEED_SPACE_IDS.producto;

  return createMockGroupCommandSpace(groupId, spaceId);
}

// ── Actor + Space resolver (IS_DEV-aware) ─────────────────────────────────────

async function resolveActorAndSpace(spaceTarget: SpaceTarget = 'personal') {
  if (IS_DEV) {
    return { actor: MOCK_ACTOR, space: await resolveDevCommandSpace(spaceTarget), actorUserId: MOCK_USER_ID };
  }

  if (spaceTarget === 'personal') {
    return buildPersonalActorAndSpace();
  }

  return buildGroupActorAndSpace(createGroupId(spaceTarget));
}

// ── Actions ────────────────────────────────────────────────────────────────────

export interface CreateItemInput {
  title: string;
  itemType: ItemType;
  priority: Priority;
  date?: string;
  spaceTarget?: SpaceTarget;
}

export async function createItemAction(
  input: CreateItemInput,
): Promise<ActionResult<ItemView>> {
  const resolved = IS_DEV
    ? {
        actor: MOCK_ACTOR,
        actorUserId: MOCK_USER_ID,
        space: await resolveDevCommandSpace(input.spaceTarget ?? 'personal'),
      }
    : await resolveActorAndSpace(input.spaceTarget ?? 'personal');
  const { actor, space, actorUserId } = resolved;

  const itemId = createItemId(crypto.randomUUID());
  const assigneeIds =
    !input.spaceTarget || input.spaceTarget === 'personal' ? [actorUserId] : undefined;

  const result =
    input.itemType === ITEM_TYPE.TASK
      ? await createItemHandler.execute({
          actor,
          itemId,
          title: input.title,
          priority: input.priority,
          space,
          itemType: ITEM_TYPE.TASK,
          temporal: input.date
            ? createTaskDueDateTemporal(new Date(input.date))
            : createTaskUndatedTemporal(),
          assigneeIds,
        })
      : await createItemHandler.execute({
          actor,
          itemId,
          title: input.title,
          priority: input.priority,
          space,
          itemType: ITEM_TYPE.EVENT,
          temporal: createEventStartTemporal(
            input.date ? new Date(input.date) : new Date(),
          ),
          assigneeIds,
        });

  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, value: toItemView(result.value) };
}

export interface UpdateItemStatusInput {
  itemId: string;
  status: TaskStatus | EventStatus;
}

export async function updateItemStatusAction(
  input: UpdateItemStatusInput,
): Promise<ActionResult<ItemView>> {
  await ensureDevSeed();

  const stored = await findItemById(input.itemId);
  if (!stored) return { ok: false, error: `Item not found: ${input.itemId}` };

  const { actor, space } = IS_DEV
    ? { actor: MOCK_ACTOR, space: MOCK_PERSONAL_COMMAND_SPACE }
    : await buildActorAndSpaceForItem(stored);

  const itemIdBranded = createItemId(input.itemId);
  const now = new Date();

  if (stored.itemType === ITEM_TYPE.TASK) {
    const lifecycle = buildTaskLifecycle(input.status as TaskStatus, now);
    if (!lifecycle) return { ok: false, error: `Invalid task status: ${input.status}` };

    const result = await updateItemHandler.execute({
      actor,
      itemId: itemIdBranded,
      space,
      itemType: ITEM_TYPE.TASK,
      lifecycle,
    });
    if (!result.ok) return { ok: false, error: result.error.message };
    return { ok: true, value: toItemView(result.value) };
  }

  const lifecycle = buildEventLifecycle(input.status as EventStatus, now);
  if (!lifecycle) return { ok: false, error: `Invalid event status: ${input.status}` };

  const result = await updateItemHandler.execute({
    actor,
    itemId: itemIdBranded,
    space,
    itemType: ITEM_TYPE.EVENT,
    lifecycle,
  });
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, value: toItemView(result.value) };
}

export interface UpdateItemPriorityInput {
  itemId: string;
  priority: Priority;
}

export async function updateItemPriorityAction(
  input: UpdateItemPriorityInput,
): Promise<ActionResult<ItemView>> {
  await ensureDevSeed();

  const stored = await findItemById(input.itemId);
  if (!stored) return { ok: false, error: `Item not found: ${input.itemId}` };

  const { actor, space } = IS_DEV
    ? { actor: MOCK_ACTOR, space: MOCK_PERSONAL_COMMAND_SPACE }
    : await buildActorAndSpaceForItem(stored);

  const itemIdBranded = createItemId(input.itemId);

  const result = await updateItemHandler.execute({
    actor,
    itemId: itemIdBranded,
    space,
    itemType: stored.itemType,
    priority: input.priority,
  } as Parameters<typeof updateItemHandler.execute>[0]);

  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, value: toItemView(result.value) };
}

export async function getItemByIdAction(
  id: string,
): Promise<ActionResult<ItemView>> {
  await ensureDevSeed();
  const output = await findItemById(id);
  if (!output) return { ok: false, error: `Item not found: ${id}` };
  return { ok: true, value: toItemView(output) };
}

export async function deleteItemAction(
  id: string,
): Promise<ActionResult<void>> {
  await ensureDevSeed();
  await removeItem(id);
  return { ok: true, value: undefined };
}

// ── Lifecycle builders ─────────────────────────────────────────────────────────

function buildTaskLifecycle(status: TaskStatus, now: Date) {
  switch (status) {
    case TASK_STATUS.PENDING: return createTaskPendingLifecycle();
    case TASK_STATUS.IN_PROGRESS: return createTaskInProgressLifecycle();
    case TASK_STATUS.BLOCKED: return createTaskBlockedLifecycle();
    case TASK_STATUS.POSTPONED: return createTaskPostponedLifecycle(now);
    case TASK_STATUS.DONE: return createTaskDoneLifecycle(now);
    case TASK_STATUS.CANCELED: return createTaskCanceledLifecycle(now);
    default: return null;
  }
}

function buildEventLifecycle(status: EventStatus, now: Date) {
  switch (status) {
    case EVENT_STATUS.SCHEDULED: return createEventScheduledLifecycle();
    case EVENT_STATUS.COMPLETED: return createEventCompletedLifecycle(now);
    case EVENT_STATUS.CANCELED: return createEventCanceledLifecycle(now);
    default: return null;
  }
}
