import type { MockItem } from '@/lib/mock/types';

interface WeekCard {
  item: MockItem;
  dayLabel: string;
}

interface ThisWeekSectionProps {
  cards: WeekCard[];
}

export function ThisWeekSection({ cards }: ThisWeekSectionProps) {
  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">date_range</span>
          <h3 className="text-lg font-bold tracking-tight text-on-surface">Esta Semana</h3>
        </div>
        <button
          type="button"
          className="text-xs font-bold text-on-surface-variant hover:text-primary transition-colors"
        >
          PLANIFICACIÓN COMPLETA
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map(({ item, dayLabel }) => (
          <div
            key={item.id}
            className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/5 hover:border-primary/20 transition-all duration-500 hover:scale-[1.02] cursor-pointer relative overflow-hidden group"
          >
            {/* Glow decoration */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all pointer-events-none" />

            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest block mb-4">
              {dayLabel}
            </span>
            <h4 className="text-on-surface font-semibold mb-2">{item.title}</h4>
            {item.notes && (
              <p className="text-sm text-tertiary opacity-70 leading-relaxed mb-4">{item.notes}</p>
            )}

            <div className="flex items-center gap-2 mt-auto">
              {item.tags?.map((tag) => (
                <span key={tag} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-[10px] text-on-surface-variant font-medium">{tag}</span>
                </span>
              ))}
              {item.tags?.[0] === 'Evento Principal' && (
                <span
                  className="material-symbols-outlined text-sm text-secondary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
