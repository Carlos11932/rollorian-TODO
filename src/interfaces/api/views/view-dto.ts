import {
  ATTENTION_REASON,
  MY_VIEW_MEMBERSHIP,
  QUERY_VISIBILITY_SCOPE,
  type AttentionProjection,
  type AssigneeSummaryProjection,
  type DatedSpanProjection,
  type ItemQueryProjection,
  type VisibilityProjection,
} from "@/application/queries/projectors";
import { VIEW_SPACE_FILTER, type ItemViewRecord } from "@/application/queries/views";
import { z } from "zod";
import { groupIdSchema, itemDtoSchema, toItemDto, toTemporalBoundsDto, userIdSchema } from "../items";

export const attentionReasonSchema = z.enum([
  ATTENTION_REASON.BLOCKED,
  ATTENTION_REASON.OPEN_TOO_LONG,
  ATTENTION_REASON.OVERDUE,
  ATTENTION_REASON.POSTPONED_DUE,
  ATTENTION_REASON.POSTPONED_TOO_OFTEN,
]);

export const queryVisibilityScopeSchema = z.enum([
  QUERY_VISIBILITY_SCOPE.GROUP_MEMBERS,
  QUERY_VISIBILITY_SCOPE.PERSONAL_OWNER,
]);

export const myViewMembershipSchema = z.enum([
  MY_VIEW_MEMBERSHIP.GROUP_ASSIGNEE_OR_UNASSIGNED,
  MY_VIEW_MEMBERSHIP.PERSONAL_OWNER,
]);

export const viewSpaceFilterSchema = z.enum([
  VIEW_SPACE_FILTER.BOTH,
  VIEW_SPACE_FILTER.GROUP,
  VIEW_SPACE_FILTER.PERSONAL,
]);

export const visibilityProjectionDtoSchema = z.object({
  groupId: groupIdSchema.nullable(),
  groupViewGroupId: groupIdSchema.nullable(),
  myViewMembership: myViewMembershipSchema,
  ownerId: userIdSchema.nullable(),
  visibilityScope: queryVisibilityScopeSchema,
});

export const datedSpanProjectionDtoSchema = z.object({
  calendarEndAt: z.iso.datetime().nullable(),
  calendarStartAt: z.iso.datetime().nullable(),
  dueAt: z.iso.datetime().nullable(),
  isDated: z.boolean(),
});

export const assigneeSummaryProjectionDtoSchema = z.object({
  assigneeCount: z.number().int().nonnegative(),
  assigneeIds: z.array(userIdSchema),
  hasMultipleAssignees: z.boolean(),
  isUnassigned: z.boolean(),
  primaryAssigneeId: userIdSchema.nullable(),
});

export const attentionProjectionDtoSchema = z.object({
  isOpen: z.boolean(),
  reasons: z.array(attentionReasonSchema),
});

export const itemQueryProjectionDtoSchema = z.object({
  assigneeSummary: assigneeSummaryProjectionDtoSchema,
  attention: attentionProjectionDtoSchema,
  datedSpan: datedSpanProjectionDtoSchema,
  undatedState: z.object({
    isUndated: z.boolean(),
  }),
  visibility: visibilityProjectionDtoSchema,
});

export const itemViewRecordDtoSchema = z.object({
  item: itemDtoSchema,
  projection: itemQueryProjectionDtoSchema,
});

export type ViewSpaceFilterDto = z.infer<typeof viewSpaceFilterSchema>;
export type ItemViewRecordDto = z.infer<typeof itemViewRecordDtoSchema>;

function toVisibilityProjectionDto(projection: VisibilityProjection) {
  return visibilityProjectionDtoSchema.parse(projection);
}

function toDatedSpanProjectionDto(projection: DatedSpanProjection) {
  return datedSpanProjectionDtoSchema.parse({
    calendarEndAt: projection.calendarEndAt?.toISOString() ?? null,
    calendarStartAt: projection.calendarStartAt?.toISOString() ?? null,
    ...toTemporalBoundsDto({ dueAt: projection.dueAt }),
    isDated: projection.isDated,
  });
}

function toAssigneeSummaryProjectionDto(projection: AssigneeSummaryProjection) {
  return assigneeSummaryProjectionDtoSchema.parse(projection);
}

function toAttentionProjectionDto(projection: AttentionProjection) {
  return attentionProjectionDtoSchema.parse(projection);
}

function toItemQueryProjectionDto(projection: ItemQueryProjection) {
  return itemQueryProjectionDtoSchema.parse({
    assigneeSummary: toAssigneeSummaryProjectionDto(projection.assigneeSummary),
    attention: toAttentionProjectionDto(projection.attention),
    datedSpan: toDatedSpanProjectionDto(projection.datedSpan),
    undatedState: projection.undatedState,
    visibility: toVisibilityProjectionDto(projection.visibility),
  });
}

export function toItemViewRecordDto(record: ItemViewRecord): ItemViewRecordDto {
  return itemViewRecordDtoSchema.parse({
    item: toItemDto(record.item),
    projection: toItemQueryProjectionDto(record.projection),
  });
}
