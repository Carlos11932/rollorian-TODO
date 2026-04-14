import { cn } from '@/lib/cn';
import type { MockItem } from '@/lib/mock/types';

interface DayAgendaProps {
  dateLabel: string;
  items: MockItem[];
}

export function DayAgenda({ dateLabel, items }: DayAgendaProps) {
  return (
    <div className="bg-surface-container-highest/40 backdrop-blur-md rounded-2xl p-6 border border-outline-variant/10 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-on-surface">{dateLabel}</h3>
          <p className="text-xs text-on-surface-variant uppercase tracking-widest font-bold mt-1">
            {items.length} {items.length === 1 ? 'Entrada' : 'Entradas'} para hoy
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <span className="material-symbols-outlined">event_note</span>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-6 flex-1">
        {items.map((item) => (
          <div key={item.id} className="group">
            <p
              className={cn(
                'text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2',
                item.itemType === 'event' ? 'text-secondary' : 'text-primary'
              )}
            >
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  item.itemType === 'event' ? 'bg-secondary' : 'bg-primary'
                )}
              />
              {item.itemType === 'event' ? 'Evento Especial' : 'Tarea Pendiente'}
            </p>

            <div className="bg-surface-container-high/40 p-4 rounded-xl border border-outline-variant/10 group-hover:bg-surface-bright/30 transition-all cursor-pointer">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-on-surface leading-tight">{item.title}</h4>
                {item.time && (
                  <span className="text-[10px] text-on-surface-variant font-medium shrink-0 ml-2">
                    {item.time}
                  </span>
                )}
              </div>
              {item.notes && (
                <p className="text-sm text-tertiary leading-relaxed opacity-80">{item.notes}</p>
              )}
              <div className="flex items-center gap-2 mt-4">
                <span className="material-symbols-outlined text-sm text-primary">local_library</span>
                <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-tighter">
                  {item.spaceType === 'personal' ? 'Personal' : 'Grupo'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add entry CTA */}
      <div className="mt-8">
        <button
          type="button"
          className="w-full py-3 border border-outline-variant/20 rounded-xl text-xs font-bold text-on-surface-variant hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">add_circle</span>
          AGREGAR ENTRADA PARA HOY
        </button>
      </div>
    </div>
  );
}
