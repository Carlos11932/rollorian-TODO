'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import { EmptyState } from '@/features/shared/components/empty-state';
import type { MockItem } from '@/lib/mock/types';

interface TodaySectionProps {
  items: MockItem[];
}

const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-error',
  high: 'bg-secondary',
  medium: 'bg-primary',
  low: 'bg-on-surface-variant/40',
};

export function TodaySection({ items }: TodaySectionProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-surface-container-low rounded-xl overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-primary">today</span>
          <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Hoy
          </span>
        </div>
        <span className="text-xs text-on-surface-variant/50">
          {items.length} entrada{items.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Task list — scrollable within the container */}
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {items.length === 0 ? (
          <EmptyState
            icon="today"
            title="Sin entradas para hoy"
            description="Usa Nueva entrada para añadir tareas o eventos al día de hoy."
          />
        ) : (
          <div className="divide-y divide-outline-variant/10">
            {items.map((item) => {
              const isDone = checked.has(item.id);
              const dotColor = PRIORITY_DOT[item.priority] ?? 'bg-primary';
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-highest/50 transition-colors group"
                >
                  {/* Checkbox */}
                  <button
                    type="button"
                    onClick={() => toggle(item.id)}
                    aria-label={isDone ? 'Marcar como pendiente' : 'Marcar como completado'}
                    className={cn(
                      'w-4 h-4 border rounded-full flex items-center justify-center transition-all shrink-0',
                      isDone
                        ? 'border-primary bg-primary/20'
                        : 'border-on-surface-variant/30 hover:border-primary'
                    )}
                  >
                    {isDone && (
                      <span className="material-symbols-outlined text-[10px] text-primary">
                        check
                      </span>
                    )}
                  </button>

                  {/* Priority dot */}
                  <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColor)} />

                  {/* Content */}
                  <Link href={`/tareas/${item.id}`} className="flex-1 min-w-0">
                    <span
                      className={cn(
                        'text-sm font-medium text-on-surface group-hover:text-primary transition-colors block truncate',
                        isDone && 'line-through text-on-surface-variant'
                      )}
                    >
                      {item.title}
                    </span>
                    {(item.location || item.time) && (
                      <span className="text-[11px] text-on-surface-variant/60 block">
                        {[item.time, item.location].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </Link>

                  {/* Tags */}
                  {item.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 rounded bg-primary-container/20 text-primary text-[10px] font-bold uppercase tracking-tighter shrink-0"
                    >
                      {tag}
                    </span>
                  ))}

                  {/* Type icon */}
                  <span className="material-symbols-outlined text-sm text-on-surface-variant/30 shrink-0">
                    {item.itemType === 'event' ? 'event' : 'check_box_outline_blank'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="px-4 py-2.5 border-t border-outline-variant/10 shrink-0">
        <button
          type="button"
          className="flex items-center gap-2 text-xs text-on-surface-variant/50 hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Añadir entrada para hoy
        </button>
      </div>
    </div>
  );
}
