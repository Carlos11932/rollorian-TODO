import Link from 'next/link';
import { cn } from '@/lib/cn';
import type { ItemCardDto } from '@/interfaces/ui/item-card-dto';

interface RequiresAttentionCardProps {
  items: ItemCardDto[];
}

export function RequiresAttentionCard({ items }: RequiresAttentionCardProps) {
  return (
    <div className="flex flex-col bg-[rgba(255,255,255,0.02)] rounded-lg border border-[rgba(255,255,255,0.05)] overflow-hidden border-l-4 border-l-error shrink-0">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[rgba(255,255,255,0.05)] bg-error/5">
        <span className="material-symbols-outlined text-base text-error">priority_high</span>
        <span className="text-sm font-semibold text-error">Requieren Atención</span>
        <span className="ml-auto text-sm font-semibold text-error bg-error/[0.12] px-2 py-0.5 rounded-full min-w-[28px] text-center">
          {items.length}
        </span>
      </div>

      {/* Items */}
      <div className="divide-y divide-[rgba(255,255,255,0.05)]">
        {items.map((item) => (
          <Link
            key={item.id}
            href={'/tareas/' + item.id}
            className="flex items-start gap-3 px-4 py-3 hover:bg-[rgba(255,255,255,0.03)] transition-colors cursor-pointer"
          >
            <span
              className={cn(
                'text-xs font-semibold uppercase tracking-wide shrink-0 mt-0.5 w-10 text-center',
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
