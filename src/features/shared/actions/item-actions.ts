'use server';

import { createItemId } from '@/domain/shared';
import { ITEM_TYPE } from '@/domain/shared';
import type { Priority } from '@/domain/shared';
import type { ItemType } from '@/domain/shared';
import {
  createTaskUndatedTemporal,
  createTaskDueDateTemporal,
  createEventStartTemporal,
} from '@/domain/item';
import type { TaskTemporal, EventTemporal } from '@/domain/item';
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
import { createItemHandler, readItemByIdHandler, updateItemHandler } from '@/lib/item-command-factory';
import { MOCK_ACTOR, MOCK_PERSONAL_COMMAND_SPACE } from '@/lib/mock/actor';
import { toItemView } from '@/interfaces/views/item-view';
import type { ItemView } from '@/interfaces/views/item-view';

export type ActionResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export interface CreateItemInput {
  title: string;
  itemType: ItemType;
  priority: Priority;
  /** Optional ISO date string (YYYY-MM-DD) */
  date?: string;
}

export async function createItemAction(
  input: CreateItemInput,
): Promise<ActionResult<ItemView>> {
  const itemId = createItemId(crypto.randomUUID());

  const result =
    input.itemType === ITEM_TYPE.TASK
      ? await createItemHandler.execute({
          actor: MOCK_ACTOR,
          itemId,
          title: input.title,
          priority: input.priority,
          space: MOCK_PERSONAL_COMMAND_SPACE,
          itemType: ITEM_TYPE.TASK,
          temporal: input.date
            ? createTaskDueDateTemporal(new Date(input.date))
            : createTaskUndatedTemporal(),
        })
      : await createItemHandler.execute({
          actor: MOCK_ACTOR,
          itemId,
          title: input.title,
          priority: input.priority,
          space: MOCK_PERSONAL_COMMAND_SPACE,
          itemType: ITEM_TYPE.EVENT,
          temporal: createEventStartTemporal(
            input.date ? new Date(input.date) : new Date(),
          ),
        });

  if (!result.ok) {
    return { ok: false, error: result.error.message };
  }

  return { ok: true, value: toItemView(result.value) };
}

export interface UpdateItemStatusInput {
  itemId: string;
  status: TaskStatus | EventStatus;
}

export async function updateItemStatusAction(
  input: UpdateItemStatusInput,
): Promise<ActionResult<ItemView>> {
  const itemIdBranded = createItemId(input.itemId);
  const now = new Date();

  // Fetch current item to determine its type
  const readResult = await readItemByIdHandler.execute({
    actor: MOCK_ACTOR,
    itemId: itemIdBranded,
    space: MOCK_PERSONAL_COMMAND_SPACE,
  });

  if (!readResult.ok) {
    return { ok: false, error: readResult.error.message };
  }

  const currentItem = readResult.value;

  if (currentItem.itemType === ITEM_TYPE.TASK) {
    const lifecycle = buildTaskLifecycle(input.status as TaskStatus, now);
    if (!lifecycle) {
      return { ok: false, error: `Invalid task status: ${input.status}` };
    }

    const updateResult = await updateItemHandler.execute({
      actor: MOCK_ACTOR,
      itemId: itemIdBranded,
      space: MOCK_PERSONAL_COMMAND_SPACE,
      itemType: ITEM_TYPE.TASK,
      lifecycle,
    });

    if (!updateResult.ok) {
      return { ok: false, error: updateResult.error.message };
    }

    return { ok: true, value: toItemView(updateResult.value) };
  }

  const lifecycle = buildEventLifecycle(input.status as EventStatus, now);
  if (!lifecycle) {
    return { ok: false, error: `Invalid event status: ${input.status}` };
  }

  const updateResult = await updateItemHandler.execute({
    actor: MOCK_ACTOR,
    itemId: itemIdBranded,
    space: MOCK_PERSONAL_COMMAND_SPACE,
    itemType: ITEM_TYPE.EVENT,
    lifecycle,
  });

  if (!updateResult.ok) {
    return { ok: false, error: updateResult.error.message };
  }

  return { ok: true, value: toItemView(updateResult.value) };
}

export interface UpdateItemPriorityInput {
  itemId: string;
  priority: Priority;
}

export async function updateItemPriorityAction(
  input: UpdateItemPriorityInput,
): Promise<ActionResult<ItemView>> {
  const itemIdBranded = createItemId(input.itemId);

  // Fetch current item to determine its type
  const readResult = await readItemByIdHandler.execute({
    actor: MOCK_ACTOR,
    itemId: itemIdBranded,
    space: MOCK_PERSONAL_COMMAND_SPACE,
  });

  if (!readResult.ok) {
    return { ok: false, error: readResult.error.message };
  }

  const currentItem = readResult.value;
  const itemType = currentItem.itemType;

  const updateResult = await updateItemHandler.execute({
    actor: MOCK_ACTOR,
    itemId: itemIdBranded,
    space: MOCK_PERSONAL_COMMAND_SPACE,
    itemType,
    priority: input.priority,
  } as Parameters<typeof updateItemHandler.execute>[0]);

  if (!updateResult.ok) {
    return { ok: false, error: updateResult.error.message };
  }

  return { ok: true, value: toItemView(updateResult.value) };
}

function buildTaskLifecycle(status: TaskStatus, now: Date) {
  switch (status) {
    case TASK_STATUS.PENDING:
      return createTaskPendingLifecycle();
    case TASK_STATUS.IN_PROGRESS:
      return createTaskInProgressLifecycle();
    case TASK_STATUS.BLOCKED:
      return createTaskBlockedLifecycle();
    case TASK_STATUS.POSTPONED:
      return createTaskPostponedLifecycle(now);
    case TASK_STATUS.DONE:
      return createTaskDoneLifecycle(now);
    case TASK_STATUS.CANCELED:
      return createTaskCanceledLifecycle(now);
    default:
      return null;
  }
}

function buildEventLifecycle(status: EventStatus, now: Date) {
  switch (status) {
    case EVENT_STATUS.SCHEDULED:
      return createEventScheduledLifecycle();
    case EVENT_STATUS.COMPLETED:
      return createEventCompletedLifecycle(now);
    case EVENT_STATUS.CANCELED:
      return createEventCanceledLifecycle(now);
    default:
      return null;
  }
}
