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
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-outline-variant/10 shrink-0">
        <div>
          <p className="text-sm font-bold text-on-surface">{dateLabel}</p>
          <p className="text-[10px] text-on-surface-variant/60 uppercase tracking-widest">
            {items.length} {items.length === 1 ? 'entrada' : 'entradas'}
          </p>
        </div>
        <span className="material-symbols-outlined text-sm text-primary">event_note</span>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto divide-y divide-outline-variant/10 hide-scrollbar">
        {items.map((item) => (
          <div key={item.id} className="px-4 py-3 hover:bg-surface-container-highest/40 transition-colors cursor-pointer">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full shrink-0',
                  item.itemType === 'event' ? 'bg-secondary' : 'bg-primary'
                )}
              />
              <span
                className={cn(
                  'text-[10px] font-bold uppercase tracking-widest',
                  item.itemType === 'event' ? 'text-secondary' : 'text-primary'
                )}
              >
                {item.itemType === 'event' ? 'Evento' : 'Tarea'}
              </span>
              {item.time && (
                <span className="text-[10px] text-on-surface-variant/60 ml-auto">{item.time}</span>
              )}
            </div>

            <p className="text-sm font-medium text-on-surface leading-tight">{item.title}</p>
            {item.location && (
              <p className="text-[11px] text-on-surface-variant/60 mt-0.5">{item.location}</p>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-outline-variant/10 shrink-0">
        <button
          type="button"
          className="flex items-center gap-2 text-xs text-on-surface-variant/50 hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Añadir entrada
        </button>
      </div>
    </div>
  );
}
