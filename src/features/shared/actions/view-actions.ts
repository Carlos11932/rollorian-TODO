'use server';

import {
  ensureDevSeed,
  getMyViewHandler,
  getRequiresAttentionHandler,
  getCalendarViewHandler,
  getGroupViewHandler,
} from '@/lib/item-command-factory';
import { MOCK_USER_ID } from '@/lib/mock/actor';
import { SEED_GROUP_IDS } from '@/lib/mock/seed';
import { createGroupId } from '@/domain/shared';
import { VIEW_SPACE_FILTER } from '@/application/queries/views';
import { ATTENTION_REASON } from '@/application/queries/projectors';
import type { ItemViewRecord } from '@/application/queries/views';
import type { ItemCardDto, WeekCardDto } from '@/interfaces/ui/item-card-dto';
import { DateUtils } from '@/lib/date-utils';

// ── Actor context ─────────────────────────────────────────────────────────────
// Swap with real session when auth lands.

const ACTOR_CONTEXT = {
  actorUserId: MOCK_USER_ID,
  visibleGroupIds: [SEED_GROUP_IDS.alpha, SEED_GROUP_IDS.producto] as const,
} as const;

// ── Mapper ────────────────────────────────────────────────────────────────────

function toItemCard(record: ItemViewRecord): ItemCardDto {
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

// ── View actions ──────────────────────────────────────────────────────────────

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

export interface RequiresAttentionResult {
  items: ItemCardDto[];
}

export async function getRequiresAttentionAction(): Promise<RequiresAttentionResult> {
  await ensureDevSeed();

  const result = await getRequiresAttentionHandler.execute({
    ...ACTOR_CONTEXT,
    spaceFilter: VIEW_SPACE_FILTER.BOTH,
  });

  return { items: result.items.map(toItemCard) };
}

export interface ThisWeekResult {
  cards: WeekCardDto[];
}

export async function getThisWeekAction(): Promise<ThisWeekResult> {
  await ensureDevSeed();

  const result = await getCalendarViewHandler.execute({
    ...ACTOR_CONTEXT,
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

export interface GroupViewResult {
  items: ItemCardDto[];
}

export async function getGroupViewAction(groupId: string): Promise<GroupViewResult> {
  await ensureDevSeed();

  const gid = createGroupId(groupId);

  const result = await getGroupViewHandler.execute({
    ...ACTOR_CONTEXT,
    groupId: gid,
  });

  return { items: result.items.map(toItemCard) };
}

// ── Calendar month view ───────────────────────────────────────────────────────

export interface CalendarEventData {
  id: string;
  label: string;
  type: 'task' | 'event';
  spaceType: 'personal' | 'group';
}

export interface CalendarDayData {
  date: number;
  isCurrentMonth: boolean;
  isToday?: boolean;
  events: CalendarEventData[];
}

export interface CalendarMonthResult {
  days: CalendarDayData[];
  monthLabel: string;
  todayDate: number;
  agendaItemsByDay: Record<number, ItemCardDto[]>;
}

export async function getCalendarMonthAction(
  year?: number,
  month?: number,
): Promise<CalendarMonthResult> {
  await ensureDevSeed();

  const now = new Date();
  const targetYear = year ?? now.getFullYear();
  const targetMonth = month ?? now.getMonth();

  const monthStart = new Date(targetYear, targetMonth, 1);
  const monthEnd = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

  const prevMonthEnd = new Date(targetYear, targetMonth, 0);
  const firstDayOfWeek = monthStart.getDay();

  const result = await getCalendarViewHandler.execute({
    ...ACTOR_CONTEXT,
    range: { startAt: monthStart, endAt: monthEnd },
    spaceFilter: VIEW_SPACE_FILTER.BOTH,
  });

  const eventsByDay = new Map<number, CalendarEventData[]>();
  const agendaItemsByDay: Record<number, ItemCardDto[]> = {};

  for (const record of result.items) {
    const { dueAt, calendarStartAt } = record.projection.datedSpan;
    const refDate = dueAt ?? calendarStartAt;
    if (!refDate) continue;

    const dayNum = refDate.getDate();
    if (!eventsByDay.has(dayNum)) eventsByDay.set(dayNum, []);
    if (!agendaItemsByDay[dayNum]) agendaItemsByDay[dayNum] = [];

    eventsByDay.get(dayNum)!.push({
      id: record.item.id,
      label: record.item.title,
      type: record.item.itemType === 'task' ? 'task' : 'event',
      spaceType: record.item.spaceType,
    });
    agendaItemsByDay[dayNum].push(toItemCard(record));
  }

  const days: CalendarDayData[] = [];
  const todayDate = now.getDate();
  const isCurrentMonth =
    now.getFullYear() === targetYear && now.getMonth() === targetMonth;

  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    days.push({ date: prevMonthEnd.getDate() - i, isCurrentMonth: false, events: [] });
  }

  const daysInMonth = monthEnd.getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({
      date: d,
      isCurrentMonth: true,
      isToday: isCurrentMonth && d === todayDate,
      events: eventsByDay.get(d) ?? [],
    });
  }

  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      days.push({ date: d, isCurrentMonth: false, events: [] });
    }
  }

  const monthLabel = monthStart.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return {
    days,
    monthLabel: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
    todayDate: isCurrentMonth ? todayDate : 1,
    agendaItemsByDay,
  };
}
