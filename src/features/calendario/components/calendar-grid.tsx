'use client';

import { cn } from '@/lib/cn';

interface CalendarEvent {
  id: string;
  label: string;
  type: 'task' | 'event';
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
    <div className="bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/10 flex flex-col h-full">
      {/* Day headers */}
      <div className="grid grid-cols-7 bg-surface-container-high/50 border-b border-outline-variant/10 shrink-0">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="py-2 text-center text-[10px] uppercase tracking-widest font-bold text-on-surface-variant"
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
              'border-r border-b border-outline-variant/5 p-1.5 transition-colors',
              day.isCurrentMonth
                ? 'hover:bg-surface-bright/20 cursor-pointer'
                : 'bg-surface-container-lowest/30 opacity-40',
              day.isToday && 'bg-surface-bright/10 ring-1 ring-inset ring-primary/30',
              selectedDate === day.date && day.isCurrentMonth && 'bg-surface-container-highest'
            )}
          >
            <span
              className={cn(
                'text-xs font-medium',
                day.isToday && 'font-bold text-primary'
              )}
            >
              {day.date}
            </span>

            {day.events.length > 0 && (
              <div className="mt-2 flex flex-col gap-1">
                {day.events.slice(0, 3).map((ev) => (
                  <div
                    key={ev.id}
                    className={cn(
                      'px-1.5 py-0.5 rounded text-[10px] font-bold border-l-2 truncate',
                      ev.type === 'task'
                        ? 'bg-primary/10 text-primary border-primary'
                        : 'bg-secondary/10 text-secondary border-secondary'
                    )}
                  >
                    {ev.type === 'task' ? 'T' : 'E'}: {ev.label}
                  </div>
                ))}
                {day.events.length > 3 && (
                  <span className="text-[10px] text-on-surface-variant pl-1">
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
