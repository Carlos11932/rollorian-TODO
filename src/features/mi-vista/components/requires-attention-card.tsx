import Link from 'next/link';
import { cn } from '@/lib/cn';
import type { MockItem } from '@/lib/mock/types';

interface RequiresAttentionCardProps {
  items: MockItem[];
}

export function RequiresAttentionCard({ items }: RequiresAttentionCardProps) {
  return (
    <div className="flex flex-col bg-surface-container-low rounded-xl overflow-hidden border-l-2 border-error shrink-0">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-outline-variant/10">
        <span className="material-symbols-outlined text-sm text-error">priority_high</span>
        <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
          Requieren Atención
        </span>
        <span className="ml-auto text-[10px] font-bold text-error bg-error/10 px-1.5 py-0.5 rounded">
          {items.length}
        </span>
      </div>

      {/* Items */}
      <div className="divide-y divide-outline-variant/10">
        {items.map((item) => (
          <Link key={item.id} href={'/tareas/' + item.id} className="block px-4 py-2.5 hover:bg-surface-container-highest/40 transition-colors cursor-pointer">
            <div className="flex items-start gap-2">
              <span
                className={cn(
                  'text-[10px] font-bold uppercase tracking-widest shrink-0 mt-0.5',
                  item.overdueByDays ? 'text-error' : 'text-secondary'
                )}
              >
                {item.overdueByDays
                  ? `+${item.overdueByDays}d`
                  : 'Bloq.'}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-on-surface truncate">{item.title}</p>
                {item.notes && (
                  <p className="text-[11px] text-on-surface-variant/60 truncate mt-0.5">
                    {item.notes}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
