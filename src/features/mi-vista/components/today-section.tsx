'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import { EmptyState } from '@/features/shared/components/empty-state';
import { DateUtils } from '@/lib/date-utils';
import type { ItemCardDto } from '@/interfaces/ui/item-card-dto';

interface TodaySectionProps {
  items: ItemCardDto[];
}

const PRIORITY_BAR: Record<string, string> = {
  urgent: 'bg-error',
  high: 'bg-secondary',
  medium: 'bg-primary',
  low: 'bg-on-surface-variant/30',
};

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  event: { label: 'EVT', color: 'text-secondary' },
  task: { label: 'TAR', color: 'text-on-surface-variant/60' },
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending:     { label: 'Pendiente',  className: 'bg-on-surface-variant/[0.12] text-on-surface-variant' },
  in_progress: { label: 'En curso',   className: 'bg-primary/[0.12] text-primary' },
  blocked:     { label: 'Bloqueado',  className: 'bg-error/[0.12] text-error' },
  postponed:   { label: 'Pospuesto', className: 'bg-secondary/[0.12] text-secondary' },
  done:        { label: 'Hecho',      className: 'bg-primary/[0.12] text-primary' },
  scheduled:   { label: 'Prog.',      className: 'bg-primary/[0.12] text-primary' },
  canceled:    { label: 'Cancelado',  className: 'bg-on-surface-variant/[0.12] text-on-surface-variant' },
};

function DueDateChip({ raw, formatted }: { raw: string; formatted: string }) {
  const semantic = DateUtils.dueSemantic(new Date(raw));
  const colorClass =
    semantic === 'overdue'  ? 'text-error' :
    semantic === 'today'    ? 'text-[color:var(--color-success,#1e8a44)]' :
    semantic === 'tomorrow' ? 'text-[color:var(--color-warning,#b45309)]' :
                              'text-on-surface-variant/60';
  return <span className={cn('text-xs block mt-0.5', colorClass)}>{formatted}</span>;
}

export function TodaySection({ items }: TodaySectionProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('');

  const visible = filter.trim()
    ? items.filter((i) => i.title.toLowerCase().includes(filter.toLowerCase()))
    : items;

  function toggle(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
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
      <div className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant/10 shrink-0">
        <span className="material-symbols-outlined text-base text-primary shrink-0">today</span>
        <span className="text-sm font-bold text-on-surface shrink-0">Hoy</span>
        <span className="text-xs font-semibold text-on-surface-variant/60 shrink-0">
          {visible.length}{visible.length !== items.length ? `/${items.length}` : ''}
        </span>

        {/* Filter input */}
        <div className="flex-1 relative">
          <span className="material-symbols-outlined text-sm text-on-surface-variant/40 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrar..."
            className="w-full bg-transparent border border-outline-variant/20 rounded-lg pl-7 pr-3 py-1 text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/40 transition-colors"
          />
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {visible.length === 0 ? (
          <EmptyState
            icon={filter ? 'search_off' : 'today'}
            title={filter ? 'Sin coincidencias' : 'Sin entradas para hoy'}
            description={
              filter
                ? `Ninguna entrada coincide con "${filter}".`
                : 'Usa Nueva entrada para añadir tareas o eventos al día de hoy.'
            }
          />
        ) : (
          <div className="divide-y divide-outline-variant/10">
            {visible.map((item) => {
              const isDone = checked.has(item.id);
              const barColor = PRIORITY_BAR[item.priority] ?? 'bg-primary';
              const typeConf = TYPE_CONFIG[item.itemType] ?? TYPE_CONFIG.task!;
              return (
                <Link
                  key={item.id}
                  href={`/tareas/${item.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-surface-container-highest/50 transition-colors group"
                >
                  {/* Checkbox — stopPropagation so it doesn't navigate */}
                  <button
                    type="button"
                    onClick={(e) => toggle(item.id, e)}
                    aria-label={isDone ? 'Marcar como pendiente' : 'Marcar como completado'}
                    className={cn(
                      'w-5 h-5 border-2 rounded-full flex items-center justify-center transition-all shrink-0',
                      isDone
                        ? 'border-primary bg-primary/20'
                        : 'border-on-surface-variant/40 hover:border-primary'
                    )}
                  >
                    {isDone && (
                      <span className="material-symbols-outlined text-[11px] text-primary">check</span>
                    )}
                  </button>

                  {/* Priority bar */}
                  <div className={cn('w-1 h-7 rounded-full shrink-0', barColor)} />

                  {/* Type badge */}
                  <span className={cn('text-[11px] font-bold uppercase tracking-wide shrink-0 w-8', typeConf.color)}>
                    {typeConf.label}
                  </span>

                  {/* Content */}
                  <span className="flex-1 min-w-0">
                    <span
                      className={cn(
                        'text-sm font-semibold text-on-surface group-hover:text-primary transition-colors block truncate leading-snug',
                        isDone && 'line-through text-on-surface-variant/60'
                      )}
                    >
                      {item.title}
                    </span>
                    {item.dueDate && item.dueDateRaw && (
                      <DueDateChip raw={item.dueDateRaw} formatted={item.dueDate} />
                    )}
                  </span>

                  {/* Status badge */}
                  {(() => {
                    const badge = STATUS_BADGE[item.status] ?? STATUS_BADGE.pending!;
                    return (
                      <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide shrink-0 hidden sm:block', badge.className)}>
                        {badge.label}
                      </span>
                    );
                  })()}

                  <span className="material-symbols-outlined text-sm text-on-surface-variant/20 shrink-0 group-hover:text-on-surface-variant/50 transition-colors">
                    chevron_right
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
