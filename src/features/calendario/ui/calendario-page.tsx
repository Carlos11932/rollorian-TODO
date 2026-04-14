'use client';

import { useState } from 'react';
import { CalendarGrid } from '../components/calendar-grid';
import { DayAgenda } from '../components/day-agenda';
import { TODAY_ITEMS, THIS_WEEK_ITEMS } from '@/lib/mock/data';

type SpaceFilter = 'both' | 'personal' | 'group';

// Mock calendar days for October 2023
const CALENDAR_DAYS = [
  // Previous month overflow
  { date: 27, isCurrentMonth: false, events: [] },
  { date: 28, isCurrentMonth: false, events: [] },
  { date: 29, isCurrentMonth: false, events: [] },
  { date: 30, isCurrentMonth: false, events: [] },
  // October days
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

const TODAY_AGENDA_ITEMS = [TODAY_ITEMS[1]!, TODAY_ITEMS[0]!]; // Event first, then task

export function CalendarioPage() {
  const [filter, setFilter] = useState<SpaceFilter>('both');
  const [selectedDate, setSelectedDate] = useState<number>(9);

  const FILTER_OPTIONS: { value: SpaceFilter; label: string }[] = [
    { value: 'both', label: 'Ambos' },
    { value: 'personal', label: 'Personal' },
    { value: 'group', label: 'Grupo' },
  ];

  return (
    <div className="px-8 lg:px-12 pt-8 pb-16 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tighter text-on-surface font-headline">
            Octubre 2023
          </h1>
          <p className="text-on-surface-variant font-body mt-1 text-sm">
            Organiza tu biblioteca de tareas y eventos privados.
          </p>
        </div>

        {/* Space filter */}
        <div className="flex items-center bg-surface-container-low p-1 rounded-full border border-outline-variant/10">
          {FILTER_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={
                filter === value
                  ? 'px-6 py-2 text-sm font-bold rounded-full bg-surface-container-highest text-primary transition-all'
                  : 'px-6 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-all'
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <CalendarGrid
            days={CALENDAR_DAYS}
            selectedDate={selectedDate}
            onDayClick={setSelectedDate}
          />
        </div>

        <div className="lg:col-span-4">
          <DayAgenda
            dateLabel={`Hoy, ${selectedDate} Oct`}
            items={TODAY_AGENDA_ITEMS}
          />
        </div>
      </div>
    </div>
  );
}
