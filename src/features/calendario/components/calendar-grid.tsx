'use client';

import { cn } from '@/lib/cn';

interface CalendarEvent {
  id: string;
  label: string;
  type: 'task' | 'event';
  spaceType?: 'personal' | 'group';
}

interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  isToday?: boolean;
  events: CalendarEvent[];
}

interface CalendarGridProps {
  days: CalendarDay[];
  onDayClick?: (date: number) => void;
  selectedDate?: number;
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function CalendarGrid({ days, onDayClick, selectedDate }: CalendarGridProps) {
  return (
    <div className="bg-[rgba(255,255,255,0.02)] rounded-lg overflow-hidden border border-[rgba(255,255,255,0.05)] flex flex-col h-full">
      {/* Day headers */}
      <div className="grid grid-cols-7 bg-[rgba(255,255,255,0.03)] border-b border-[rgba(255,255,255,0.05)] shrink-0">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="py-2 text-center text-[11px] uppercase tracking-widest font-medium text-on-surface-variant/60"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 flex-1">
        {days.map((day, i) => (
          <div
            key={i}
            onClick={() => day.isCurrentMonth && onDayClick?.(day.date)}
            className={cn(
              'border-r border-b border-[rgba(255,255,255,0.03)] p-1.5 transition-colors min-h-0',
              day.isCurrentMonth
                ? 'hover:bg-[rgba(255,255,255,0.03)] cursor-pointer'
                : 'bg-[rgba(0,0,0,0.2)] opacity-40',
              day.isToday && 'bg-[rgba(255,255,255,0.03)] ring-1 ring-inset ring-primary/30',
              selectedDate === day.date && day.isCurrentMonth && 'bg-[rgba(255,255,255,0.05)]'
            )}
          >
            <span
              className={cn(
                'text-xs font-semibold block',
                day.isToday ? 'font-semibold text-primary' : 'text-on-surface'
              )}
            >
              {day.date}
            </span>

            {day.events.length > 0 && (
              <div className="mt-1 flex flex-col gap-0.5">
                {day.events.slice(0, 3).map((ev) => (
                  <div
                    key={ev.id}
                    className={cn(
                      'px-1.5 py-0.5 rounded-sm text-[10px] font-medium border-l-2 truncate leading-tight',
                      ev.type === 'task'
                        ? 'bg-primary/10 text-primary border-primary'
                        : 'bg-secondary/10 text-secondary border-secondary'
                    )}
                  >
                    {ev.label}
                  </div>
                ))}
                {day.events.length > 3 && (
                  <span className="text-[10px] text-on-surface-variant/60 pl-1">
                    +{day.events.length - 3} más
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
