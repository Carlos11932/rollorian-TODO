'use server';

import { ensureDevSeed, getMyViewHandler } from '@/lib/item-command-factory';
import { MOCK_USER_ID } from '@/lib/mock/actor';
import { SEED_GROUP_IDS } from '@/lib/mock/seed';
import type { ItemCardDto } from '@/interfaces/ui/item-card-dto';
import { toItemCard } from '@/interfaces/ui/item-card-mapper';
import { DateUtils } from '@/lib/date-utils';

const ACTOR_CONTEXT = {
  actorUserId: MOCK_USER_ID,
  visibleGroupIds: [SEED_GROUP_IDS.alpha, SEED_GROUP_IDS.producto] as const,
} as const;

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

  const result = await getMyViewHandler.execute(ACTOR_CONTEXT);

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
