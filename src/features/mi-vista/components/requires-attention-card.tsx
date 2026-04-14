import type { MockItem } from '@/lib/mock/types';

interface RequiresAttentionCardProps {
  items: MockItem[];
}

export function RequiresAttentionCard({ items }: RequiresAttentionCardProps) {
  return (
    <section className="col-span-12 lg:col-span-4 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-error">priority_high</span>
        <h3 className="text-lg font-bold tracking-tight text-on-surface">Requieren Atención</h3>
      </div>

      <div className="flex-1 bg-surface-container-high rounded-xl p-6 border-l-4 border-error shadow-lg shadow-black/20 flex flex-col justify-between">
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id}>
              {index > 0 && <div className="h-px bg-outline-variant/10 mb-4" />}
              <div className="group cursor-pointer">
                {item.overdueByDays ? (
                  <span className="text-[10px] text-error font-bold uppercase tracking-widest block mb-1">
                    Vencido hace {item.overdueByDays} {item.overdueByDays === 1 ? 'día' : 'días'}
                  </span>
                ) : item.status === 'blocked' ? (
                  <span className="text-[10px] text-secondary font-bold uppercase tracking-widest block mb-1">
                    Bloqueado
                  </span>
                ) : null}
                <h4 className="text-on-surface font-semibold leading-tight group-hover:text-primary transition-colors">
                  {item.title}
                </h4>
                {item.notes && (
                  <p className="text-on-surface-variant text-sm mt-2 line-clamp-2">{item.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="mt-8 flex items-center justify-center gap-2 text-sm text-tertiary-fixed font-bold hover:text-secondary transition-colors duration-300"
        >
          Ver todos los bloqueos
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>
    </section>
  );
}
