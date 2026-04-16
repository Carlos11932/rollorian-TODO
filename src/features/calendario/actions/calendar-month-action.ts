'use server';

import { ensureDevSeed, getCalendarViewHandler } from '@/lib/item-command-factory';
import { getActorContext } from '@/lib/session-actor';
import { VIEW_SPACE_FILTER } from '@/application/queries/views';
import type { ItemCardDto } from '@/interfaces/ui/item-card-dto';
import { toItemCard } from '@/interfaces/ui/item-card-mapper';

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
  const actorContext = await getActorContext();

  const now = new Date();
  const targetYear = year ?? now.getFullYear();
  const targetMonth = month ?? now.getMonth();

  const monthStart = new Date(targetYear, targetMonth, 1);
  const monthEnd = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
  const prevMonthEnd = new Date(targetYear, targetMonth, 0);
  const firstDayOfWeek = monthStart.getDay();

  const result = await getCalendarViewHandler.execute({
    ...actorContext,
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
  const isCurrentMonth = now.getFullYear() === targetYear && now.getMonth() === targetMonth;

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
