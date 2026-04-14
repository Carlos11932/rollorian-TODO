'use client';

import { useState } from 'react';
import { CalendarGrid } from '../components/calendar-grid';
import { DayAgenda } from '../components/day-agenda';
import { TODAY_ITEMS, THIS_WEEK_ITEMS } from '@/lib/mock/data';

type SpaceFilter = 'both' | 'personal' | 'group';

const CALENDAR_DAYS = [
  { date: 27, isCurrentMonth: false, events: [] },
  { date: 28, isCurrentMonth: false, events: [] },
  { date: 29, isCurrentMonth: false, events: [] },
  { date: 30, isCurrentMonth: false, events: [] },
  { date: 1, isCurrentMonth: true, events: [] },
  { date: 2, isCurrentMonth: true, events: [{ id: 'e1', label: 'Review Design', type: 'task' as const }] },
  { date: 3, isCurrentMonth: true, events: [] },
  { date: 4, isCurrentMonth: true, events: [{ id: 'e2', label: 'Curator Dinner', type: 'event' as const }] },
  { date: 5, isCurrentMonth: true, events: [] },
  { date: 6, isCurrentMonth: true, events: [] },
  { date: 7, isCurrentMonth: true, events: [{ id: 'e3', label: 'Send Report', type: 'task' as const }, { id: 'e4', label: 'Update Vault', type: 'task' as const }] },
  { date: 8, isCurrentMonth: true, events: [] },
  { date: 9, isCurrentMonth: true, isToday: true, events: [{ id: 'e5', label: 'Art Gallery', type: 'event' as const }, { id: 'e6', label: 'Draft Story', type: 'task' as const }] },
  { date: 10, isCurrentMonth: true, events: [] },
  { date: 11, isCurrentMonth: true, events: [] },
  { date: 12, isCurrentMonth: true, events: [] },
  { date: 13, isCurrentMonth: true, events: [{ id: 'e7', label: 'Reunión Patronos', type: 'event' as const }] },
  { date: 14, isCurrentMonth: true, events: [] },
  { date: 15, isCurrentMonth: true, events: [{ id: 'e8', label: 'Auditoría', type: 'task' as const }] },
  { date: 16, isCurrentMonth: true, events: [] },
  { date: 17, isCurrentMonth: true, events: [{ id: 'e9', label: 'Nueva Colección', type: 'task' as const }] },
];

const TODAY_AGENDA_ITEMS = [TODAY_ITEMS[1]!, TODAY_ITEMS[0]!];

export function CalendarioPage() {
  const [filter, setFilter] = useState<SpaceFilter>('both');
  const [selectedDate, setSelectedDate] = useState<number>(9);

  const FILTER_OPTIONS: { value: SpaceFilter; label: string }[] = [
    { value: 'both', label: 'Todos' },
    { value: 'personal', label: 'Personal' },
    { value: 'group', label: 'Grupo' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] px-5 pt-4 pb-4 gap-4 overflow-hidden">
      {/* Compact header */}
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
          Octubre 2023
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
            days={CALENDAR_DAYS}
            selectedDate={selectedDate}
            onDayClick={setSelectedDate}
            filter={filter}
          />
        </div>

        <div className="min-h-0">
          <DayAgenda
            dateLabel={`Hoy, ${selectedDate} Oct`}
            items={TODAY_AGENDA_ITEMS}
          />
        </div>
      </div>
    </div>
  );
}
