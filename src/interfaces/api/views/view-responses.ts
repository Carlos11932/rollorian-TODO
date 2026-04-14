import type {
  CalendarViewResult,
  GroupViewResult,
  MyViewResult,
  RequiresAttentionViewResult,
  UndatedViewResult,
} from "@/application/queries/views";
import { z } from "zod";
import { groupIdSchema } from "../items";
import { calendarRangeRequestSchema, type ViewFilters, viewFiltersSchema } from "./view-requests";
import { itemViewRecordDtoSchema, toItemViewRecordDto, viewSpaceFilterSchema } from "./view-dto";

const viewResultBaseSchema = z.object({
  filters: viewFiltersSchema.default({}),
  items: z.array(itemViewRecordDtoSchema),
  totalCount: z.number().int().nonnegative(),
});

export const myViewResponseSchema = z.object({
  data: viewResultBaseSchema,
});

export const groupViewResponseSchema = z.object({
  data: viewResultBaseSchema.extend({
    groupId: groupIdSchema,
  }),
});

export const calendarViewResponseSchema = z.object({
  data: viewResultBaseSchema.extend({
    range: calendarRangeRequestSchema,
    spaceFilter: viewSpaceFilterSchema,
  }),
});

export const undatedViewResponseSchema = z.object({
  data: viewResultBaseSchema.extend({
    spaceFilter: viewSpaceFilterSchema,
  }),
});

export const attentionViewResponseSchema = z.object({
  data: viewResultBaseSchema.extend({
    spaceFilter: viewSpaceFilterSchema,
  }),
});

function toBaseViewData(
  result:
    | MyViewResult
    | GroupViewResult
    | CalendarViewResult
    | UndatedViewResult
    | RequiresAttentionViewResult,
  filters?: ViewFilters,
) {
  return {
    filters: filters ?? {},
    items: result.items.map((item) => toItemViewRecordDto(item)),
    totalCount: result.totalCount,
  };
}

export function toMyViewResponse(result: MyViewResult, filters?: ViewFilters) {
  return myViewResponseSchema.parse({
    data: toBaseViewData(result, filters),
  });
}

export function toGroupViewResponse(result: GroupViewResult, filters?: ViewFilters) {
  return groupViewResponseSchema.parse({
    data: {
      ...toBaseViewData(result, filters),
      groupId: result.groupId,
    },
  });
}

export function toCalendarViewResponse(
  result: CalendarViewResult,
  filters?: ViewFilters,
) {
  return calendarViewResponseSchema.parse({
    data: {
      ...toBaseViewData(result, filters),
      range: {
        endAt: result.range.endAt.toISOString(),
        startAt: result.range.startAt.toISOString(),
      },
      spaceFilter: result.spaceFilter,
    },
  });
}

export function toUndatedViewResponse(
  result: UndatedViewResult,
  filters?: ViewFilters,
) {
  return undatedViewResponseSchema.parse({
    data: {
      ...toBaseViewData(result, filters),
      spaceFilter: result.spaceFilter,
    },
  });
}

export function toAttentionViewResponse(
  result: RequiresAttentionViewResult,
  filters?: ViewFilters,
) {
  return attentionViewResponseSchema.parse({
    data: {
      ...toBaseViewData(result, filters),
      spaceFilter: result.spaceFilter,
    },
  });
}
