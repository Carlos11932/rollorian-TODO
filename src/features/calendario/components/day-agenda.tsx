'use client';

import { cn } from '@/lib/cn';
import type { MockItem } from '@/lib/mock/types';

interface DayAgendaProps {
  dateLabel: string;
  items: MockItem[];
}

export function DayAgenda({ dateLabel, items }: DayAgendaProps) {
  return (
    <div className="bg-surface-container-low rounded-xl overflow-hidden flex flex-col h-full border border-outline-variant/10">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/10 shrink-0">
        <div>
          <p className="text-sm font-bold text-on-surface">{dateLabel}</p>
          <p className="text-xs text-on-surface-variant/60">
            {items.length} {items.length === 1 ? 'entrada' : 'entradas'}
          </p>
        </div>
        <span className="material-symbols-outlined text-base text-primary">event_note</span>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto divide-y divide-outline-variant/10 hide-scrollbar">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-on-surface-variant/40 px-4 py-8">
            <span className="material-symbols-outlined text-2xl">event_available</span>
            <p className="text-xs text-center">Sin entradas para este día</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="px-4 py-3 hover:bg-surface-container-highest/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className={cn(
                    'w-1 h-5 rounded-full shrink-0',
                    item.itemType === 'event' ? 'bg-secondary' : 'bg-primary'
                  )}
                />
                <span
                  className={cn(
                    'text-[11px] font-bold uppercase tracking-wide',
                    item.itemType === 'event' ? 'text-secondary' : 'text-primary'
                  )}
                >
                  {item.itemType === 'event' ? 'Evento' : 'Tarea'}
                </span>
                {item.time && (
                  <span className="text-xs text-on-surface-variant/60 ml-auto">{item.time}</span>
                )}
              </div>

              <p className="text-sm font-semibold text-on-surface leading-snug">{item.title}</p>
              {item.location && (
                <p className="text-xs text-on-surface-variant/60 mt-0.5">{item.location}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
