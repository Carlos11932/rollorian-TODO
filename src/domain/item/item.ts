import {
  DEFAULT_PRIORITY,
  INITIAL_VERSION_TOKEN,
  ITEM_TYPE,
  type ItemId,
  type Priority,
  type SpaceId,
  type SpaceType,
  type VersionToken,
} from "../shared";
import { assertItemInvariants } from "./invariant-policy";
import {
  createEventCanceledLifecycle,
  createEventCompletedLifecycle,
  createEventScheduledLifecycle,
  createTaskCanceledLifecycle,
  createTaskDoneLifecycle,
  createTaskPendingLifecycle,
  type EventLifecycle,
  type TaskLifecycle,
} from "./lifecycle";
import {
  type EventTemporal,
  type TaskTemporal,
  getEventCalendarSpan,
  getTaskCalendarSpan,
  type CalendarSpan,
} from "./temporal";

export interface ItemBase {
  id: ItemId;
  title: string;
  notes: string | null;
  spaceId: SpaceId;
  spaceType: SpaceType;
  priority: Priority;
  postponeCount: number;
  createdAt: Date;
  updatedAt: Date;
  versionToken: VersionToken;
}

export interface TaskItem extends ItemBase {
  itemType: typeof ITEM_TYPE.TASK;
  temporal: TaskTemporal;
  lifecycle: TaskLifecycle;
}

export interface EventItem extends ItemBase {
  itemType: typeof ITEM_TYPE.EVENT;
  temporal: EventTemporal;
  lifecycle: EventLifecycle;
}

export type Item = TaskItem | EventItem;

export interface ItemBaseInput {
  id: ItemId;
  title: string;
  spaceId: SpaceId;
  spaceType: SpaceType;
  notes?: string | null;
  priority?: Priority;
  createdAt?: Date;
  updatedAt?: Date;
  versionToken?: VersionToken;
}

export interface CreateTaskItemInput extends ItemBaseInput {
  itemType: typeof ITEM_TYPE.TASK;
  temporal: TaskTemporal;
  lifecycle?: TaskLifecycle;
  postponeCount?: number;
}

export interface CreateEventItemInput extends ItemBaseInput {
  itemType: typeof ITEM_TYPE.EVENT;
  temporal: EventTemporal;
  lifecycle?: EventLifecycle;
}

export interface UpdateTaskItemInput {
  title?: string;
  notes?: string | null;
  priority?: Priority;
  temporal?: TaskTemporal;
  lifecycle?: TaskLifecycle;
  postponeCount?: number;
  updatedAt?: Date;
  versionToken?: VersionToken;
}

export interface UpdateEventItemInput {
  title?: string;
  notes?: string | null;
  priority?: Priority;
  temporal?: EventTemporal;
  lifecycle?: EventLifecycle;
  updatedAt?: Date;
  versionToken?: VersionToken;
}

function normalizeRequiredText(value: string, fieldName: string): string {
  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    throw new Error(`${fieldName} cannot be empty.`);
  }

  return normalizedValue;
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return null;
  }

  return normalizedValue;
}

function createItemBase(input: ItemBaseInput): ItemBase {
  const createdAt = input.createdAt ?? new Date();
  const updatedAt = input.updatedAt ?? createdAt;

  if (updatedAt < createdAt) {
    throw new Error("Item updatedAt cannot be before createdAt.");
  }

  return {
    id: input.id,
    title: normalizeRequiredText(input.title, "Item title"),
    notes: normalizeOptionalText(input.notes),
    spaceId: input.spaceId,
    spaceType: input.spaceType,
    priority: input.priority ?? DEFAULT_PRIORITY,
    postponeCount: 0,
    createdAt,
    updatedAt,
    versionToken: input.versionToken ?? INITIAL_VERSION_TOKEN,
  };
}

export function createTaskItem(input: CreateTaskItemInput): TaskItem {
  const item: TaskItem = {
    ...createItemBase(input),
    itemType: ITEM_TYPE.TASK,
    temporal: input.temporal,
    lifecycle: input.lifecycle ?? createTaskPendingLifecycle(),
    postponeCount: input.postponeCount ?? 0,
  };

  assertItemInvariants({
    itemType: item.itemType,
    temporal: item.temporal,
    lifecycle: item.lifecycle,
    postponeCount: item.postponeCount,
  });

  return item;
}

export function createEventItem(input: CreateEventItemInput): EventItem {
  const item: EventItem = {
    ...createItemBase(input),
    itemType: ITEM_TYPE.EVENT,
    temporal: input.temporal,
    lifecycle: input.lifecycle ?? createEventScheduledLifecycle(),
    postponeCount: 0,
  };

  assertItemInvariants({
    itemType: item.itemType,
    temporal: item.temporal,
    lifecycle: item.lifecycle,
    postponeCount: item.postponeCount,
  });

  return item;
}

export function updateTaskItem(
  item: TaskItem,
  input: UpdateTaskItemInput,
): TaskItem {
  const updatedItem: TaskItem = {
    ...item,
    title:
      input.title === undefined
        ? item.title
        : normalizeRequiredText(input.title, "Item title"),
    notes:
      input.notes === undefined ? item.notes : normalizeOptionalText(input.notes),
    priority: input.priority ?? item.priority,
    temporal: input.temporal ?? item.temporal,
    lifecycle: input.lifecycle ?? item.lifecycle,
    postponeCount: input.postponeCount ?? item.postponeCount,
    updatedAt: input.updatedAt ?? new Date(),
    versionToken: input.versionToken ?? item.versionToken,
  };

  if (updatedItem.updatedAt < updatedItem.createdAt) {
    throw new Error("Item updatedAt cannot be before createdAt.");
  }

  assertItemInvariants({
    itemType: updatedItem.itemType,
    temporal: updatedItem.temporal,
    lifecycle: updatedItem.lifecycle,
    postponeCount: updatedItem.postponeCount,
  });

  return updatedItem;
}

export function updateEventItem(
  item: EventItem,
  input: UpdateEventItemInput,
): EventItem {
  const updatedItem: EventItem = {
    ...item,
    title:
      input.title === undefined
        ? item.title
        : normalizeRequiredText(input.title, "Item title"),
    notes:
      input.notes === undefined ? item.notes : normalizeOptionalText(input.notes),
    priority: input.priority ?? item.priority,
    temporal: input.temporal ?? item.temporal,
    lifecycle: input.lifecycle ?? item.lifecycle,
    updatedAt: input.updatedAt ?? new Date(),
    versionToken: input.versionToken ?? item.versionToken,
    postponeCount: 0,
  };

  if (updatedItem.updatedAt < updatedItem.createdAt) {
    throw new Error("Item updatedAt cannot be before createdAt.");
  }

  assertItemInvariants({
    itemType: updatedItem.itemType,
    temporal: updatedItem.temporal,
    lifecycle: updatedItem.lifecycle,
    postponeCount: updatedItem.postponeCount,
  });

  return updatedItem;
}

export function markTaskDone(item: TaskItem, completedAt: Date = new Date()): TaskItem {
  return updateTaskItem(item, {
    lifecycle: createTaskDoneLifecycle(completedAt),
    updatedAt: completedAt,
  });
}

export function markEventCompleted(
  item: EventItem,
  completedAt: Date = new Date(),
): EventItem {
  return updateEventItem(item, {
    lifecycle: createEventCompletedLifecycle(completedAt),
    updatedAt: completedAt,
  });
}

export function cancelTaskItem(
  item: TaskItem,
  canceledAt: Date = new Date(),
): TaskItem {
  return updateTaskItem(item, {
    lifecycle: createTaskCanceledLifecycle(canceledAt),
    updatedAt: canceledAt,
  });
}

export function cancelEventItem(
  item: EventItem,
  canceledAt: Date = new Date(),
): EventItem {
  return updateEventItem(item, {
    lifecycle: createEventCanceledLifecycle(canceledAt),
    updatedAt: canceledAt,
  });
}

export function getItemCalendarSpan(item: Item): CalendarSpan | null {
  if (item.itemType === ITEM_TYPE.TASK) {
    return getTaskCalendarSpan(item.temporal);
  }

  return getEventCalendarSpan(item.temporal);
}

export function getItemStatus(item: Item): string {
  return item.lifecycle.status;
}
