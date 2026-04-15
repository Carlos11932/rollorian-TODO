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
import type { MockItem } from '@/lib/mock/types';

// ── Actor context ─────────────────────────────────────────────────────────────
// Swap with real session when auth lands.

const ACTOR_CONTEXT = {
  actorUserId: MOCK_USER_ID,
  visibleGroupIds: [SEED_GROUP_IDS.alpha, SEED_GROUP_IDS.producto] as const,
} as const;

// ── Mapper ────────────────────────────────────────────────────────────────────

function toMockItem(record: ItemViewRecord): MockItem {
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
    status: item.status as MockItem['status'],
    priority: item.priority,
    spaceType: item.spaceType,
    groupId: item.groupId ?? undefined,
    createdAt: item.createdAt.toISOString(),
    dueDate: dueAt?.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }),
    tags: item.labels.map((l) => l.value),
    overdueByDays,
  };
}

// ── Date range helpers ────────────────────────────────────────────────────────

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDayOffset(offsetDays: number): Date {
  const d = startOfToday();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfWeek(): Date {
  const d = startOfToday();
  const day = d.getDay(); // 0 = Sun
  d.setDate(d.getDate() - day);
  return d;
}

function endOfWeek(): Date {
  const d = startOfWeek();
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

// ── View actions ──────────────────────────────────────────────────────────────

export interface TodayViewResult {
  items: MockItem[];
  undatedCount: number;
}

export async function getTodayViewAction(): Promise<TodayViewResult> {
  await ensureDevSeed();

  const result = await getMyViewHandler.execute(ACTOR_CONTEXT);

  const todayStart = startOfToday();
  const todayEnd = endOfDayOffset(0);

  const todayItems = result.items.filter((record) => {
    const { dueAt, calendarStartAt } = record.projection.datedSpan;
    const ref = dueAt ?? calendarStartAt;
    if (!ref) return false;
    return ref.getTime() >= todayStart.getTime() && ref.getTime() <= todayEnd.getTime();
  });

  const undatedItems = result.items.filter(
    (record) => record.projection.undatedState.isUndated,
  );

  return {
    items: todayItems.map(toMockItem),
    undatedCount: undatedItems.length,
  };
}

export interface RequiresAttentionResult {
  items: MockItem[];
}

export async function getRequiresAttentionAction(): Promise<RequiresAttentionResult> {
  await ensureDevSeed();

  const result = await getRequiresAttentionHandler.execute({
    ...ACTOR_CONTEXT,
    spaceFilter: VIEW_SPACE_FILTER.BOTH,
  });

  return { items: result.items.map(toMockItem) };
}

export interface WeekCard {
  item: MockItem;
  dayLabel: string;
}

export interface ThisWeekResult {
  cards: WeekCard[];
}

const WEEKDAY_SHORT: Record<number, string> = {
  0: 'Dom', 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb',
};

function formatDayLabel(date: Date): string {
  const day = date.getDay();
  const dayNum = date.getDate();
  const month = date.toLocaleDateString('es-ES', { month: 'short' });
  return `${WEEKDAY_SHORT[day]} ${dayNum} ${month}`;
}

export async function getThisWeekAction(): Promise<ThisWeekResult> {
  await ensureDevSeed();

  const result = await getCalendarViewHandler.execute({
    ...ACTOR_CONTEXT,
    range: { startAt: startOfWeek(), endAt: endOfWeek() },
    spaceFilter: VIEW_SPACE_FILTER.BOTH,
  });

  // Sort by due date ascending
  const sorted = [...result.items].sort((a, b) => {
    const aDate = a.projection.datedSpan.dueAt ?? a.projection.datedSpan.calendarStartAt;
    const bDate = b.projection.datedSpan.dueAt ?? b.projection.datedSpan.calendarStartAt;
    return (aDate?.getTime() ?? 0) - (bDate?.getTime() ?? 0);
  });

  const cards: WeekCard[] = sorted.map((record) => {
    const dateRef =
      record.projection.datedSpan.dueAt ??
      record.projection.datedSpan.calendarStartAt ??
      new Date();

    return {
      item: toMockItem(record),
      dayLabel: formatDayLabel(dateRef),
    };
  });

  return { cards };
}

export interface GroupViewResult {
  items: MockItem[];
}

export async function getGroupViewAction(groupId: string): Promise<GroupViewResult> {
  await ensureDevSeed();

  const gid = createGroupId(groupId);

  const result = await getGroupViewHandler.execute({
    ...ACTOR_CONTEXT,
    groupId: gid,
  });

  return { items: result.items.map(toMockItem) };
}

// ── Calendar month view ───────────────────────────────────────────────────────

export interface CalendarDayData {
  date: number;
  isCurrentMonth: boolean;
  isToday?: boolean;
  events: { id: string; label: string; type: 'task' | 'event' }[];
}

export interface CalendarMonthResult {
  days: CalendarDayData[];
  monthLabel: string;
  todayDate: number;
  agendaItemsByDay: Record<number, MockItem[]>;
}

export async function getCalendarMonthAction(
  year?: number,
  month?: number,
): Promise<CalendarMonthResult> {
  await ensureDevSeed();

  const now = new Date();
  const targetYear = year ?? now.getFullYear();
  const targetMonth = month ?? now.getMonth(); // 0-indexed

  const monthStart = new Date(targetYear, targetMonth, 1);
  const monthEnd = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

  // Prev month tail days for the first grid row
  const prevMonthEnd = new Date(targetYear, targetMonth, 0);
  const firstDayOfWeek = monthStart.getDay(); // 0 = Sun

  const result = await getCalendarViewHandler.execute({
    ...ACTOR_CONTEXT,
    range: { startAt: monthStart, endAt: monthEnd },
    spaceFilter: VIEW_SPACE_FILTER.BOTH,
  });

  // Group events by day-of-month
  const eventsByDay = new Map<number, { id: string; label: string; type: 'task' | 'event' }[]>();
  const agendaItemsByDay: Record<number, MockItem[]> = {};

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
    });
    agendaItemsByDay[dayNum].push(toMockItem(record));
  }

  const days: CalendarDayData[] = [];
  const todayDate = now.getDate();
  const isCurrentMonth =
    now.getFullYear() === targetYear && now.getMonth() === targetMonth;

  // Leading days from previous month
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    days.push({
      date: prevMonthEnd.getDate() - i,
      isCurrentMonth: false,
      events: [],
    });
  }

  // Current month days
  const daysInMonth = monthEnd.getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({
      date: d,
      isCurrentMonth: true,
      isToday: isCurrentMonth && d === todayDate,
      events: eventsByDay.get(d) ?? [],
    });
  }

  // Trailing days from next month to complete the last row
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
