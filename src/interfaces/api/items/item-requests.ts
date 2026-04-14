import { ITEM_TYPE, SPACE_TYPE } from "@/domain/shared";
import { z } from "zod";
import {
  datedStateSchema,
  eventLifecycleDtoSchema,
  eventTemporalDtoSchema,
  groupIdSchema,
  itemIdSchema,
  itemTypeSchema,
  prioritySchema,
  spaceIdSchema,
  taskLifecycleDtoSchema,
  taskTemporalDtoSchema,
  userIdSchema,
  versionTokenSchema,
} from "./item-dto";

const labelFilterSchema = z.string().trim().min(1);

export const personalItemScopeRequestSchema = z.object({
  ownerId: userIdSchema,
  spaceId: spaceIdSchema,
  spaceType: z.literal(SPACE_TYPE.PERSONAL),
});

export const groupItemScopeRequestSchema = z.object({
  groupId: groupIdSchema,
  spaceId: spaceIdSchema,
  spaceType: z.literal(SPACE_TYPE.GROUP),
});

export const itemScopeRequestSchema = z.discriminatedUnion("spaceType", [
  personalItemScopeRequestSchema,
  groupItemScopeRequestSchema,
]);

const createItemBodyBaseSchema = z.object({
  assigneeIds: z.array(userIdSchema).optional(),
  labels: z.array(labelFilterSchema).optional(),
  notes: z.string().nullable().optional(),
  priority: prioritySchema.optional(),
  title: z.string().trim().min(1),
});

const createTaskItemBodySchema = createItemBodyBaseSchema.extend({
  itemType: z.literal(ITEM_TYPE.TASK),
  lifecycle: taskLifecycleDtoSchema.optional(),
  postponeCount: z.number().int().nonnegative().optional(),
  temporal: taskTemporalDtoSchema,
});

const createEventItemBodySchema = createItemBodyBaseSchema.extend({
  itemType: z.literal(ITEM_TYPE.EVENT),
  lifecycle: eventLifecycleDtoSchema.optional(),
  temporal: eventTemporalDtoSchema,
});

export const createItemRequestBodySchema = z.discriminatedUnion("itemType", [
  createTaskItemBodySchema,
  createEventItemBodySchema,
]);

export const createItemRequestSchema = z.object({
  body: createItemRequestBodySchema.and(itemScopeRequestSchema),
});

const updateItemBodyBaseSchema = z.object({
  assigneeIds: z.array(userIdSchema).optional(),
  expectedVersionToken: versionTokenSchema.optional(),
  labels: z.array(labelFilterSchema).optional(),
  notes: z.string().nullable().optional(),
  priority: prioritySchema.optional(),
  title: z.string().trim().min(1).optional(),
});

const updateTaskItemBodySchema = updateItemBodyBaseSchema.extend({
  itemType: z.literal(ITEM_TYPE.TASK).optional(),
  lifecycle: taskLifecycleDtoSchema.optional(),
  postponeCount: z.number().int().nonnegative().optional(),
  temporal: taskTemporalDtoSchema.optional(),
});

const updateEventItemBodySchema = updateItemBodyBaseSchema.extend({
  itemType: z.literal(ITEM_TYPE.EVENT).optional(),
  lifecycle: eventLifecycleDtoSchema.optional(),
  temporal: eventTemporalDtoSchema.optional(),
});

const updateTaskToEventBodySchema = updateItemBodyBaseSchema.extend({
  itemType: z.literal(ITEM_TYPE.EVENT),
  lifecycle: eventLifecycleDtoSchema.optional(),
  temporal: eventTemporalDtoSchema,
});

const updateEventToTaskBodySchema = updateItemBodyBaseSchema.extend({
  itemType: z.literal(ITEM_TYPE.TASK),
  lifecycle: taskLifecycleDtoSchema.optional(),
  postponeCount: z.number().int().nonnegative().optional(),
  temporal: taskTemporalDtoSchema,
});

export const updateItemRequestSchema = z.object({
  body: z
    .union([
      updateTaskItemBodySchema,
      updateEventItemBodySchema,
      updateTaskToEventBodySchema,
      updateEventToTaskBodySchema,
    ])
    .and(itemScopeRequestSchema),
  params: z.object({
    itemId: itemIdSchema,
  }),
});

export const getItemByIdRequestSchema = z.object({
  params: z.object({
    itemId: itemIdSchema,
  }),
  query: itemScopeRequestSchema,
});

export const listItemsRequestQuerySchema = z.object({
  assigneeId: userIdSchema.optional(),
  datedState: datedStateSchema.optional(),
  groupId: groupIdSchema.optional(),
  includeCompletedEvents: z.boolean().optional(),
  itemType: itemTypeSchema.optional(),
  label: labelFilterSchema.optional(),
  ownerId: userIdSchema.optional(),
  priority: prioritySchema.optional(),
  spaceType: z.enum([SPACE_TYPE.PERSONAL, SPACE_TYPE.GROUP]).optional(),
  status: z.string().trim().min(1).optional(),
});

export const listItemsRequestSchema = z.object({
  query: listItemsRequestQuerySchema,
});

export const getItemHistoryRequestSchema = z.object({
  params: z.object({
    itemId: itemIdSchema,
  }),
  query: groupItemScopeRequestSchema,
});

export type ItemScopeRequest = z.infer<typeof itemScopeRequestSchema>;
export type CreateItemRequest = z.infer<typeof createItemRequestSchema>;
export type UpdateItemRequest = z.infer<typeof updateItemRequestSchema>;
export type GetItemByIdRequest = z.infer<typeof getItemByIdRequestSchema>;
export type ListItemsRequest = z.infer<typeof listItemsRequestSchema>;
export type GetItemHistoryRequest = z.infer<typeof getItemHistoryRequestSchema>;
