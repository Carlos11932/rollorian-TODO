'use server';

import { ensureDevSeed, getCalendarViewHandler } from '@/lib/item-command-factory';
import { getActorContext } from '@/lib/session-actor';
import { VIEW_SPACE_FILTER } from '@/application/queries/views';
import type { WeekCardDto } from '@/interfaces/ui/item-card-dto';
import { toItemCard } from '@/interfaces/ui/item-card-mapper';
import { DateUtils } from '@/lib/date-utils';

export interface ThisWeekResult {
  cards: WeekCardDto[];
}

export async function getThisWeekAction(): Promise<ThisWeekResult> {
  await ensureDevSeed();
  const actorContext = await getActorContext();

  const result = await getCalendarViewHandler.execute({
    ...actorContext,
    range: { startAt: DateUtils.startOfWeek(), endAt: DateUtils.endOfWeek() },
    spaceFilter: VIEW_SPACE_FILTER.BOTH,
  });

  const sorted = [...result.items].sort((a, b) => {
    const aDate = a.projection.datedSpan.dueAt ?? a.projection.datedSpan.calendarStartAt;
    const bDate = b.projection.datedSpan.dueAt ?? b.projection.datedSpan.calendarStartAt;
    return (aDate?.getTime() ?? 0) - (bDate?.getTime() ?? 0);
  });

  const cards: WeekCardDto[] = sorted.map((record) => {
    const dateRef =
      record.projection.datedSpan.dueAt ??
      record.projection.datedSpan.calendarStartAt ??
      new Date();

    return {
      item: toItemCard(record),
      dayLabel: DateUtils.formatShortDayLabel(dateRef),
    };
  });

  return { cards };
}
