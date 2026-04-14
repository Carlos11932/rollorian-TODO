import Link from 'next/link';
import { cn } from '@/lib/cn';
import type { MockItem } from '@/lib/mock/types';

interface WeekCard {
  item: MockItem;
  dayLabel: string;
}

interface ThisWeekSectionProps {
  cards: WeekCard[];
}

const PRIORITY_COLOR: Record<string, string> = {
  urgent: 'text-error',
  high: 'text-secondary',
  medium: 'text-primary',
  low: 'text-on-surface-variant/40',
};

export function ThisWeekSection({ cards }: ThisWeekSectionProps) {
  return (
    <div className="flex flex-col bg-surface-container-low rounded-xl overflow-hidden flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-outline-variant/10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-secondary">date_range</span>
          <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Esta Semana
          </span>
        </div>
      </div>

      {/* Compact list */}
      <div className="divide-y divide-outline-variant/10 overflow-y-auto hide-scrollbar flex-1">
        {cards.map(({ item, dayLabel }) => (
          <Link
            key={item.id}
            href={'/tareas/' + item.id}
            className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-highest/40 transition-colors cursor-pointer group"
          >
            {/* Day label */}
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50 w-12 shrink-0">
              {dayLabel}
            </span>

            {/* Priority dot */}
            <span
              className={cn(
                'material-symbols-outlined text-sm shrink-0',
                PRIORITY_COLOR[item.priority] ?? 'text-primary'
              )}
            >
              {item.itemType === 'event' ? 'event' : 'radio_button_unchecked'}
            </span>

            {/* Title */}
            <span className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors truncate flex-1">
              {item.title}
            </span>

            {/* Tag */}
            {item.tags?.[0] && (
              <span className="text-[10px] text-on-surface-variant/50 shrink-0 truncate max-w-[60px]">
                {item.tags[0]}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
