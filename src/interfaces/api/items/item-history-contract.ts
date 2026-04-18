import {
  GROUP_ITEM_AUDIT_CHANGE_KIND,
  type GroupItemAuditEntry,
} from "@/domain/history";
import type { ActorMetadata } from "@/domain/identity";
import { z } from "zod";
import { groupIdSchema, itemIdSchema, prioritySchema, userIdSchema, versionTokenSchema } from "./item-dto";

const isoDateTimeSchema = z.iso.datetime();

export const actorMetadataDtoSchema = z.object({
  actorId: userIdSchema,
  displayName: z.string().nullable(),
  email: z.email().nullable(),
});

export const groupItemAuditDatesStateDtoSchema = z.object({
  dueAt: isoDateTimeSchema.nullable(),
  endAt: isoDateTimeSchema.nullable(),
  startAt: isoDateTimeSchema.nullable(),
  temporalKind: z.string().trim().min(1),
});

export const groupItemAuditCompletionStateDtoSchema = z.object({
  completedAt: isoDateTimeSchema.nullable(),
  isCompleted: z.boolean(),
});

export const groupItemAuditCancellationStateDtoSchema = z.object({
  canceledAt: isoDateTimeSchema.nullable(),
  isCanceled: z.boolean(),
});

export const groupItemAuditChangeDtoSchema = z.discriminatedUnion("kind", [
  z.object({
    after: z.array(userIdSchema),
    before: z.array(userIdSchema),
    kind: z.literal(GROUP_ITEM_AUDIT_CHANGE_KIND.ASSIGNEES),
  }),
  z.object({
    after: groupItemAuditCancellationStateDtoSchema,
    before: groupItemAuditCancellationStateDtoSchema,
    kind: z.literal(GROUP_ITEM_AUDIT_CHANGE_KIND.CANCELLATION),
  }),
  z.object({
    after: groupItemAuditCompletionStateDtoSchema,
    before: groupItemAuditCompletionStateDtoSchema,
    kind: z.literal(GROUP_ITEM_AUDIT_CHANGE_KIND.COMPLETION),
  }),
  z.object({
    after: groupItemAuditDatesStateDtoSchema,
    before: groupItemAuditDatesStateDtoSchema,
    kind: z.literal(GROUP_ITEM_AUDIT_CHANGE_KIND.DATES),
  }),
  z.object({
    after: z.array(z.string().trim().min(1)),
    before: z.array(z.string().trim().min(1)),
    kind: z.literal(GROUP_ITEM_AUDIT_CHANGE_KIND.LABELS),
  }),
  z.object({
    after: prioritySchema,
    before: prioritySchema,
    kind: z.literal(GROUP_ITEM_AUDIT_CHANGE_KIND.PRIORITY),
  }),
  z.object({
    after: z.string().trim().min(1),
    before: z.string().trim().min(1),
    kind: z.literal(GROUP_ITEM_AUDIT_CHANGE_KIND.STATUS),
  }),
  z.object({
    after: z.string().trim().min(1),
    before: z.string().trim().min(1),
    kind: z.literal(GROUP_ITEM_AUDIT_CHANGE_KIND.TITLE),
  }),
]);

export const groupItemAuditEntryDtoSchema = z.object({
  actor: actorMetadataDtoSchema,
  changedAt: isoDateTimeSchema,
  changes: z.array(groupItemAuditChangeDtoSchema),
  groupId: groupIdSchema,
  itemId: itemIdSchema,
  versionToken: versionTokenSchema,
});

export const itemHistoryDtoSchema = z.object({
  entries: z.array(groupItemAuditEntryDtoSchema),
  itemId: itemIdSchema,
});

export type GroupItemAuditEntryDto = z.infer<typeof groupItemAuditEntryDtoSchema>;
export type ItemHistoryDto = z.infer<typeof itemHistoryDtoSchema>;

function toIsoDateTime(value: Date): string {
  return value.toISOString();
}

function toNullableIsoDateTime(value: Date | null): string | null {
  return value === null ? null : toIsoDateTime(value);
}

function toActorMetadataDto(actor: ActorMetadata) {
  return actorMetadataDtoSchema.parse({
    actorId: actor.actorId,
    displayName: actor.displayName,
    email: actor.email,
  });
}

export function toGroupItemAuditEntryDto(entry: GroupItemAuditEntry): GroupItemAuditEntryDto {
  return groupItemAuditEntryDtoSchema.parse({
    actor: toActorMetadataDto(entry.actor),
    changedAt: toIsoDateTime(entry.changedAt),
    changes: entry.changes.map((change) => {
      switch (change.kind) {
        case GROUP_ITEM_AUDIT_CHANGE_KIND.ASSIGNEES:
        case GROUP_ITEM_AUDIT_CHANGE_KIND.LABELS:
        case GROUP_ITEM_AUDIT_CHANGE_KIND.PRIORITY:
        case GROUP_ITEM_AUDIT_CHANGE_KIND.STATUS:
        case GROUP_ITEM_AUDIT_CHANGE_KIND.TITLE:
          return change;
        case GROUP_ITEM_AUDIT_CHANGE_KIND.DATES:
          return {
            ...change,
            after: {
              dueAt: toNullableIsoDateTime(change.after.dueAt),
              endAt: toNullableIsoDateTime(change.after.endAt),
              startAt: toNullableIsoDateTime(change.after.startAt),
              temporalKind: change.after.temporalKind,
            },
            before: {
              dueAt: toNullableIsoDateTime(change.before.dueAt),
              endAt: toNullableIsoDateTime(change.before.endAt),
              startAt: toNullableIsoDateTime(change.before.startAt),
              temporalKind: change.before.temporalKind,
            },
          };
        case GROUP_ITEM_AUDIT_CHANGE_KIND.COMPLETION:
          return {
            ...change,
            after: {
              completedAt: toNullableIsoDateTime(change.after.completedAt),
              isCompleted: change.after.isCompleted,
            },
            before: {
              completedAt: toNullableIsoDateTime(change.before.completedAt),
              isCompleted: change.before.isCompleted,
            },
          };
        case GROUP_ITEM_AUDIT_CHANGE_KIND.CANCELLATION:
          return {
            ...change,
            after: {
              canceledAt: toNullableIsoDateTime(change.after.canceledAt),
              isCanceled: change.after.isCanceled,
            },
            before: {
              canceledAt: toNullableIsoDateTime(change.before.canceledAt),
              isCanceled: change.before.isCanceled,
            },
          };
      }
    }),
    groupId: entry.groupId,
    itemId: entry.itemId,
    versionToken: entry.versionToken,
  });
}

export function toItemHistoryDto(
  itemId: string,
  entries: readonly GroupItemAuditEntry[],
): ItemHistoryDto {
  return itemHistoryDtoSchema.parse({
    entries: entries.map((entry) => toGroupItemAuditEntryDto(entry)),
    itemId,
  });
}
