import { z } from "zod";
import { datedStateSchema, groupIdSchema, itemTypeSchema, prioritySchema, userIdSchema } from "../items";
import { viewSpaceFilterSchema } from "./view-dto";

const isoDateTimeSchema = z.iso.datetime();

export const viewFiltersSchema = z.object({
  assigneeId: userIdSchema.optional(),
  datedState: datedStateSchema.optional(),
  includeCompletedEvents: z.boolean().optional(),
  itemType: itemTypeSchema.optional(),
  label: z.string().trim().min(1).optional(),
  priority: prioritySchema.optional(),
  status: z.string().trim().min(1).optional(),
});

export const getMyViewRequestSchema = z.object({
  query: z.object({
    filters: viewFiltersSchema.optional(),
  }),
});

export const getGroupViewRequestSchema = z.object({
  params: z.object({
    groupId: groupIdSchema,
  }),
  query: z.object({
    filters: viewFiltersSchema.optional(),
  }),
});

export const calendarRangeRequestSchema = z
  .object({
    endAt: isoDateTimeSchema,
    startAt: isoDateTimeSchema,
  })
  .refine(
    (range) => new Date(range.endAt).getTime() >= new Date(range.startAt).getTime(),
    { error: "Calendar range endAt cannot be before startAt." },
  );

export const getCalendarViewRequestSchema = z.object({
  query: z.object({
    filters: viewFiltersSchema.optional(),
    range: calendarRangeRequestSchema,
    spaceFilter: viewSpaceFilterSchema,
  }),
});

export const getUndatedViewRequestSchema = z.object({
  query: z.object({
    filters: viewFiltersSchema.optional(),
    spaceFilter: viewSpaceFilterSchema,
  }),
});

export const getAttentionViewRequestSchema = z.object({
  query: z.object({
    filters: viewFiltersSchema.optional(),
    spaceFilter: viewSpaceFilterSchema,
  }),
});

export type ViewFilters = z.infer<typeof viewFiltersSchema>;
export type GetMyViewRequest = z.infer<typeof getMyViewRequestSchema>;
export type GetGroupViewRequest = z.infer<typeof getGroupViewRequestSchema>;
export type GetCalendarViewRequest = z.infer<typeof getCalendarViewRequestSchema>;
export type GetUndatedViewRequest = z.infer<typeof getUndatedViewRequestSchema>;
export type GetAttentionViewRequest = z.infer<typeof getAttentionViewRequestSchema>;
