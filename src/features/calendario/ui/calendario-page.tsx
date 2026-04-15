'use client';

import { useMemo, useState } from 'react';
import { CalendarGrid } from '../components/calendar-grid';
import { DayAgenda } from '../components/day-agenda';
import type { ItemCardDto } from '@/interfaces/ui/item-card-dto';
import type { CalendarDayData } from '@/features/shared/actions/view-actions';

type SpaceFilter = 'both' | 'personal' | 'group';

interface CalendarioPageProps {
  days: CalendarDayData[];
  monthLabel: string;
  todayDate: number;
  agendaItemsByDay: Record<number, ItemCardDto[]>;
}

export function CalendarioPage({ days, monthLabel, todayDate, agendaItemsByDay }: CalendarioPageProps) {
  const [filter, setFilter] = useState<SpaceFilter>('both');
  const [selectedDate, setSelectedDate] = useState<number>(todayDate);

  const FILTER_OPTIONS: { value: SpaceFilter; label: string }[] = [
    { value: 'both', label: 'Todos' },
    { value: 'personal', label: 'Personal' },
    { value: 'group', label: 'Grupo' },
  ];

  // Filter calendar days' events by spaceType client-side
  const filteredDays = useMemo(() => {
    if (filter === 'both') return days;
    return days.map((day) => ({
      ...day,
      events: day.events.filter((ev) => ev.spaceType === filter),
    }));
  }, [days, filter]);

  // Filter agenda items for selected day
  const agendaItems = useMemo(() => {
    const items = agendaItemsByDay[selectedDate] ?? [];
    if (filter === 'both') return items;
    return items.filter((item) => item.spaceType === filter);
  }, [agendaItemsByDay, selectedDate, filter]);

  const shortMonth = monthLabel.split(' ')[1] ?? '';
  const agendaLabel = selectedDate === todayDate
    ? `Hoy, ${selectedDate} ${shortMonth}`
    : `${selectedDate} ${shortMonth}`;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] px-5 pt-4 pb-4 gap-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-sm font-bold text-on-surface">
          {monthLabel}
        </h2>

        <div className="flex items-center bg-surface-container-low p-0.5 rounded-lg border border-outline-variant/10">
          {FILTER_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={
                filter === value
                  ? 'px-3 py-1 text-xs font-bold rounded-md bg-surface-container-highest text-primary transition-all'
                  : 'px-3 py-1 text-xs font-medium text-on-surface-variant hover:text-on-surface transition-all'
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar grid + agenda */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        <div className="lg:col-span-2 min-h-0">
          <CalendarGrid
            days={filteredDays}
            selectedDate={selectedDate}
            onDayClick={setSelectedDate}
          />
        </div>

        <div className="min-h-0">
          <DayAgenda
            dateLabel={agendaLabel}
            items={agendaItems}
          />
        </div>
      </div>
    </div>
  );
}
