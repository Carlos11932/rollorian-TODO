'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import { EmptyState } from '@/features/shared/components/empty-state';
import type { MockItem } from '@/lib/mock/types';

interface TodaySectionProps {
  items: MockItem[];
  dateLabel: string;
}

export function TodaySection({ items, dateLabel }: TodaySectionProps) {
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
    <section className="col-span-12 lg:col-span-8">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">today</span>
          <h3 className="text-lg font-bold tracking-tight text-on-surface">Hoy</h3>
        </div>
        <span className="text-sm font-medium text-on-surface-variant">{dateLabel}</span>
      </div>

      {items.length === 0 && (
        <EmptyState
          icon="today"
          title="Sin entradas para hoy"
          description="Usa Nueva entrada para añadir tareas o eventos al día de hoy."
        />
      )}

      <div className="space-y-3">
        {items.map((item) => {
          const isDone = checked.has(item.id);
          return (
            <div
              key={item.id}
              className="bg-surface-container-lowest hover:bg-surface-container-highest transition-all duration-300 p-4 rounded-xl flex items-center gap-4 group"
            >
              <button
                type="button"
                onClick={() => toggle(item.id)}
                aria-label={isDone ? 'Marcar como pendiente' : 'Marcar como completado'}
                className={cn(
                  'w-6 h-6 border-2 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0',
                  isDone ? 'border-primary bg-primary/20' : 'border-primary/40 hover:border-primary'
                )}
              >
                <div
                  className={cn(
                    'w-2.5 h-2.5 bg-primary rounded-full transition-transform',
                    isDone ? 'scale-100' : 'scale-0 group-hover:scale-100'
                  )}
                />
              </button>

              <Link href={`/tareas/${item.id}`} className="flex-1 min-w-0 group/link">
                <h4
                  className={cn(
                    'font-medium text-on-surface transition-colors group-hover/link:text-primary',
                    isDone && 'line-through text-on-surface-variant'
                  )}
                >
                  {item.title}
                </h4>
                {(item.location || item.time) && (
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {[item.location, item.time].filter(Boolean).join(' • ')}
                  </p>
                )}
              </Link>

              <div className="flex items-center gap-2 shrink-0">
                {item.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full bg-primary-container/20 text-primary text-[10px] font-bold uppercase tracking-tighter"
                  >
                    {tag}
                  </span>
                ))}
                <button
                  type="button"
                  className="text-on-surface-variant/40 hover:text-on-surface-variant transition-colors"
                  aria-label="Más opciones"
                >
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
