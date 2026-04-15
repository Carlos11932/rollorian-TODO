/**
 * Shared mapper: ItemViewRecord → ItemCardDto.
 * Used by all feature view actions.
 */
import { ATTENTION_REASON } from '@/application/queries/projectors';
import type { ItemViewRecord } from '@/application/queries/views';
import type { ItemCardDto } from './item-card-dto';
import { DateUtils } from '@/lib/date-utils';

export function toItemCard(record: ItemViewRecord): ItemCardDto {
  const { item, projection } = record;
  const dueAt = projection.datedSpan.dueAt;
  const attentionReasons = projection.attention.reasons;

  const overdueByDays =
    attentionReasons.includes(ATTENTION_REASON.OVERDUE) && dueAt
      ? Math.ceil((Date.now() - dueAt.getTime()) / (1000 * 60 * 60 * 24))
      : undefined;

  return {
    id: item.id,
    title: item.title,
    notes: item.notes ?? undefined,
    itemType: item.itemType,
    status: item.status,
    priority: item.priority,
    spaceType: item.spaceType,
    groupId: item.groupId ?? undefined,
    createdAt: item.createdAt.toISOString(),
    dueDate: dueAt ? DateUtils.formatCompactDate(dueAt) : undefined,
    dueDateRaw: dueAt ? dueAt.toISOString().slice(0, 10) : undefined,
    tags: item.labels.map((l) => l.value),
    overdueByDays,
  };
}
