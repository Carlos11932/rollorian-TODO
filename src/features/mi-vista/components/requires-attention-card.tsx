import Link from 'next/link';
import { cn } from '@/lib/cn';
import type { ItemCardDto } from '@/interfaces/ui/item-card-dto';

interface RequiresAttentionCardProps {
  items: ItemCardDto[];
}

export function RequiresAttentionCard({ items }: RequiresAttentionCardProps) {
  return (
    <div className="flex flex-col bg-surface-container-low rounded-xl overflow-hidden border-l-4 border-error shrink-0">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-error/20 bg-error/5">
        <span className="material-symbols-outlined text-base text-error">priority_high</span>
        <span className="text-sm font-bold text-error">Requieren Atención</span>
        <span className="ml-auto text-sm font-black text-error bg-error/15 px-2 py-0.5 rounded-md min-w-[28px] text-center">
          {items.length}
        </span>
      </div>

      {/* Items */}
      <div className="divide-y divide-outline-variant/10">
        {items.map((item) => (
          <Link
            key={item.id}
            href={'/tareas/' + item.id}
            className="flex items-start gap-3 px-4 py-3 hover:bg-surface-container-highest/40 transition-colors cursor-pointer"
          >
            <span
              className={cn(
                'text-xs font-black uppercase tracking-wide shrink-0 mt-0.5 w-10 text-center',
                item.overdueByDays ? 'text-error' : 'text-secondary'
              )}
            >
              {item.overdueByDays ? `+${item.overdueByDays}d` : 'BLQ'}
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-on-surface truncate leading-snug">{item.title}</p>
              {item.notes && (
                <p className="text-xs text-on-surface-variant/60 truncate mt-0.5">{item.notes}</p>
              )}
            </div>

            <span className="material-symbols-outlined text-sm text-on-surface-variant/30 shrink-0 mt-0.5">
              chevron_right
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
