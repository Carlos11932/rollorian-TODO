import type { ItemOutput } from "@/application/commands";
import {
  EVENT_STATUS,
  EVENT_TEMPORAL_KIND,
  TASK_STATUS,
  TASK_TEMPORAL_KIND,
} from "@/domain/item";
import { ITEM_TYPE, PRIORITY, SPACE_TYPE } from "@/domain/shared";
import { z } from "zod";

export const DATED_STATE = {
  DATED: "dated",
  UNDATED: "undated",
} as const;

export type DatedState = (typeof DATED_STATE)[keyof typeof DATED_STATE];

const isoDateTimeSchema = z.iso.datetime();
const identifierSchema = z.string().trim().min(1);
const labelValueSchema = z.string().trim().min(1);

export const itemIdSchema = identifierSchema;
export const userIdSchema = identifierSchema;
export const groupIdSchema = identifierSchema;
export const spaceIdSchema = identifierSchema;
export const versionTokenSchema = z.number().int().nonnegative();
export const prioritySchema = z.enum([
  PRIORITY.LOW,
  PRIORITY.MEDIUM,
  PRIORITY.HIGH,
  PRIORITY.URGENT,
]);
export const itemTypeSchema = z.enum([ITEM_TYPE.TASK, ITEM_TYPE.EVENT]);
export const spaceTypeSchema = z.enum([SPACE_TYPE.PERSONAL, SPACE_TYPE.GROUP]);
export const taskStatusSchema = z.enum([
  TASK_STATUS.PENDING,
  TASK_STATUS.IN_PROGRESS,
  TASK_STATUS.BLOCKED,
  TASK_STATUS.POSTPONED,
  TASK_STATUS.DONE,
  TASK_STATUS.CANCELED,
]);
export const eventStatusSchema = z.enum([
  EVENT_STATUS.SCHEDULED,
  EVENT_STATUS.COMPLETED,
  EVENT_STATUS.CANCELED,
]);
export const itemStatusSchema = z.union([taskStatusSchema, eventStatusSchema]);
export const datedStateSchema = z.enum([DATED_STATE.DATED, DATED_STATE.UNDATED]);

export const itemLabelDtoSchema = z.object({
  value: labelValueSchema,
});

export const taskTemporalDtoSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal(TASK_TEMPORAL_KIND.UNDATED) }),
  z.object({
    dueAt: isoDateTimeSchema,
    kind: z.literal(TASK_TEMPORAL_KIND.DUE_DATE),
  }),
  z.object({
    kind: z.literal(TASK_TEMPORAL_KIND.START_DATE),
    startAt: isoDateTimeSchema,
  }),
  z.object({
    endAt: isoDateTimeSchema,
    kind: z.literal(TASK_TEMPORAL_KIND.START_AND_END),
    startAt: isoDateTimeSchema,
  }),
  z.object({
    dueAt: isoDateTimeSchema,
    kind: z.literal(TASK_TEMPORAL_KIND.START_AND_DUE),
    startAt: isoDateTimeSchema,
  }),
  z.object({
    dueAt: isoDateTimeSchema,
    endAt: isoDateTimeSchema,
    kind: z.literal(TASK_TEMPORAL_KIND.START_END_AND_DUE),
    startAt: isoDateTimeSchema,
  }),
]);

export const eventTemporalDtoSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal(EVENT_TEMPORAL_KIND.START),
    startAt: isoDateTimeSchema,
  }),
  z.object({
    endAt: isoDateTimeSchema,
    kind: z.literal(EVENT_TEMPORAL_KIND.START_AND_END),
    startAt: isoDateTimeSchema,
  }),
]);

export const taskLifecycleDtoSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal(TASK_STATUS.PENDING) }),
  z.object({ status: z.literal(TASK_STATUS.IN_PROGRESS) }),
  z.object({ status: z.literal(TASK_STATUS.BLOCKED) }),
  z.object({
    postponedUntil: isoDateTimeSchema,
    status: z.literal(TASK_STATUS.POSTPONED),
  }),
  z.object({
    completedAt: isoDateTimeSchema,
    status: z.literal(TASK_STATUS.DONE),
  }),
  z.object({
    canceledAt: isoDateTimeSchema,
    status: z.literal(TASK_STATUS.CANCELED),
  }),
]);

export const eventLifecycleDtoSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal(EVENT_STATUS.SCHEDULED) }),
  z.object({
    completedAt: isoDateTimeSchema,
    status: z.literal(EVENT_STATUS.COMPLETED),
  }),
  z.object({
    canceledAt: isoDateTimeSchema,
    status: z.literal(EVENT_STATUS.CANCELED),
  }),
]);

const itemDtoBaseSchema = z.object({
  assigneeIds: z.array(userIdSchema),
  createdAt: isoDateTimeSchema,
  groupId: groupIdSchema.nullable(),
  id: itemIdSchema,
  labels: z.array(itemLabelDtoSchema),
  notes: z.string().nullable(),
  ownerId: userIdSchema.nullable(),
  postponeCount: z.number().int().nonnegative(),
  priority: prioritySchema,
  spaceId: spaceIdSchema,
  spaceType: spaceTypeSchema,
  title: z.string().trim().min(1),
  updatedAt: isoDateTimeSchema,
  versionToken: versionTokenSchema,
});

export const taskItemDtoSchema = itemDtoBaseSchema.extend({
  itemType: z.literal(ITEM_TYPE.TASK),
  lifecycle: taskLifecycleDtoSchema,
  status: taskStatusSchema,
  temporal: taskTemporalDtoSchema,
});

export const eventItemDtoSchema = itemDtoBaseSchema.extend({
  itemType: z.literal(ITEM_TYPE.EVENT),
  lifecycle: eventLifecycleDtoSchema,
  status: eventStatusSchema,
  temporal: eventTemporalDtoSchema,
});

export const itemDtoSchema = z.discriminatedUnion("itemType", [
  taskItemDtoSchema,
  eventItemDtoSchema,
]);

export type ItemDto = z.infer<typeof itemDtoSchema>;
export type TaskItemDto = z.infer<typeof taskItemDtoSchema>;
export type EventItemDto = z.infer<typeof eventItemDtoSchema>;

function toIsoDateTime(value: Date): string {
  return value.toISOString();
}

function toNullableIsoDateTime(value: Date | null | undefined): string | null {
  return value === null || value === undefined ? null : toIsoDateTime(value);
}

function toTaskTemporalDto(item: Extract<ItemOutput, { itemType: typeof ITEM_TYPE.TASK }>) {
  switch (item.temporal.kind) {
    case TASK_TEMPORAL_KIND.UNDATED:
      return { kind: item.temporal.kind };
    case TASK_TEMPORAL_KIND.DUE_DATE:
      return {
        dueAt: toIsoDateTime(item.temporal.dueAt),
        kind: item.temporal.kind,
      };
    case TASK_TEMPORAL_KIND.START_DATE:
      return {
        kind: item.temporal.kind,
        startAt: toIsoDateTime(item.temporal.startAt),
      };
    case TASK_TEMPORAL_KIND.START_AND_END:
      return {
        endAt: toIsoDateTime(item.temporal.endAt),
        kind: item.temporal.kind,
        startAt: toIsoDateTime(item.temporal.startAt),
      };
    case TASK_TEMPORAL_KIND.START_AND_DUE:
      return {
        dueAt: toIsoDateTime(item.temporal.dueAt),
        kind: item.temporal.kind,
        startAt: toIsoDateTime(item.temporal.startAt),
      };
    case TASK_TEMPORAL_KIND.START_END_AND_DUE:
      return {
        dueAt: toIsoDateTime(item.temporal.dueAt),
        endAt: toIsoDateTime(item.temporal.endAt),
        kind: item.temporal.kind,
        startAt: toIsoDateTime(item.temporal.startAt),
      };
  }
}

function toEventTemporalDto(item: Extract<ItemOutput, { itemType: typeof ITEM_TYPE.EVENT }>) {
  switch (item.temporal.kind) {
    case EVENT_TEMPORAL_KIND.START:
      return {
        kind: item.temporal.kind,
        startAt: toIsoDateTime(item.temporal.startAt),
      };
    case EVENT_TEMPORAL_KIND.START_AND_END:
      return {
        endAt: toIsoDateTime(item.temporal.endAt),
        kind: item.temporal.kind,
        startAt: toIsoDateTime(item.temporal.startAt),
      };
  }
}

function toTaskLifecycleDto(item: Extract<ItemOutput, { itemType: typeof ITEM_TYPE.TASK }>) {
  switch (item.lifecycle.status) {
    case TASK_STATUS.PENDING:
    case TASK_STATUS.IN_PROGRESS:
    case TASK_STATUS.BLOCKED:
      return { status: item.lifecycle.status };
    case TASK_STATUS.POSTPONED:
      return {
        postponedUntil: toIsoDateTime(item.lifecycle.postponedUntil),
        status: item.lifecycle.status,
      };
    case TASK_STATUS.DONE:
      return {
        completedAt: toIsoDateTime(item.lifecycle.completedAt),
        status: item.lifecycle.status,
      };
    case TASK_STATUS.CANCELED:
      return {
        canceledAt: toIsoDateTime(item.lifecycle.canceledAt),
        status: item.lifecycle.status,
      };
  }
}

function toEventLifecycleDto(item: Extract<ItemOutput, { itemType: typeof ITEM_TYPE.EVENT }>) {
  switch (item.lifecycle.status) {
    case EVENT_STATUS.SCHEDULED:
      return { status: item.lifecycle.status };
    case EVENT_STATUS.COMPLETED:
      return {
        completedAt: toIsoDateTime(item.lifecycle.completedAt),
        status: item.lifecycle.status,
      };
    case EVENT_STATUS.CANCELED:
      return {
        canceledAt: toIsoDateTime(item.lifecycle.canceledAt),
        status: item.lifecycle.status,
      };
  }
}

export function toItemDto(item: ItemOutput): ItemDto {
  const base = {
    assigneeIds: [...item.assigneeIds],
    createdAt: toIsoDateTime(item.createdAt),
    groupId: item.groupId,
    id: item.id,
    labels: item.labels.map((label) => ({ value: label.value })),
    notes: item.notes,
    ownerId: item.ownerId,
    postponeCount: item.postponeCount,
    priority: item.priority,
    spaceId: item.spaceId,
    spaceType: item.spaceType,
    title: item.title,
    updatedAt: toIsoDateTime(item.updatedAt),
    versionToken: item.versionToken,
  };

  if (item.itemType === ITEM_TYPE.TASK) {
    return taskItemDtoSchema.parse({
      ...base,
      itemType: ITEM_TYPE.TASK,
      lifecycle: toTaskLifecycleDto(item),
      status: item.status,
      temporal: toTaskTemporalDto(item),
    });
  }

  return eventItemDtoSchema.parse({
    ...base,
    itemType: ITEM_TYPE.EVENT,
    lifecycle: toEventLifecycleDto(item),
    status: item.status,
    temporal: toEventTemporalDto(item),
  });
}

export function toTemporalBoundsDto(temporal: {
  dueAt?: Date | null;
  endAt?: Date | null;
  startAt?: Date | null;
}) {
  return {
    dueAt: toNullableIsoDateTime(temporal.dueAt),
    endAt: toNullableIsoDateTime(temporal.endAt),
    startAt: toNullableIsoDateTime(temporal.startAt),
  };
}
