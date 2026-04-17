'use server';

import { ensureDevSeed, getMyViewHandler } from '@/lib/item-command-factory';
import { getActorContext } from '@/lib/session-actor';
import type { ItemCardDto } from '@/interfaces/ui/item-card-dto';
import { toItemCard } from '@/interfaces/ui/item-card-mapper';
import { DateUtils } from '@/lib/date-utils';

export interface StatsSnapshot {
  totalCount: number;
  undatedCount: number;
  urgentCount: number;
  unassignedGroupCount: number;
}

export interface TodayViewResult {
  items: ItemCardDto[];
  stats: StatsSnapshot;
}

export async function getTodayViewAction(): Promise<TodayViewResult> {
  await ensureDevSeed();
  const actorContext = await getActorContext();

  const result = await getMyViewHandler.execute(actorContext);

  const todayStart = DateUtils.startOfToday();
  const todayEnd = DateUtils.endOfDay(0);

  const todayItems = result.items.filter((record) => {
    const { dueAt, calendarStartAt } = record.projection.datedSpan;
    const ref = dueAt ?? calendarStartAt;
    if (!ref) return false;
    return ref.getTime() >= todayStart.getTime() && ref.getTime() <= todayEnd.getTime();
  });

  const undatedCount = result.items.filter(
    (record) => record.projection.undatedState.isUndated,
  ).length;

  const urgentCount = result.items.filter(
    (record) => record.item.priority === 'urgent',
  ).length;

  const unassignedGroupCount = result.items.filter(
    (record) =>
      record.item.spaceType === 'group' &&
      record.projection.assigneeSummary.isUnassigned,
  ).length;

  return {
    items: todayItems.map(toItemCard),
    stats: {
      totalCount: result.totalCount,
      undatedCount,
      urgentCount,
      unassignedGroupCount,
    },
  };
}
