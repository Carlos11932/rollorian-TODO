import Link from 'next/link';
import { cn } from '@/lib/cn';
import { EmptyState } from '@/features/shared/components/empty-state';
import type { MockItem } from '@/lib/mock/types';

type StatusConfig = {
  label: string;
  icon: string;
  color: string;
};

const STATUS_CONFIG: Record<string, StatusConfig> = {
  in_progress: { label: 'En Progreso', icon: 'sync', color: 'text-primary' },
  pending: { label: 'Pendiente', icon: 'schedule', color: 'text-on-surface-variant' },
  blocked: { label: 'Bloqueado', icon: 'block', color: 'text-error' },
  done: { label: 'Completado', icon: 'check_circle', color: 'text-primary' },
  cancelled: { label: 'Cancelado', icon: 'cancel', color: 'text-on-surface-variant' },
};

type PriorityConfig = {
  label: string;
  className: string;
};

const PRIORITY_CONFIG: Record<string, PriorityConfig> = {
  urgent: { label: 'Crítica', className: 'bg-error/10 text-error' },
  high: { label: 'Alta', className: 'bg-secondary/10 text-secondary' },
  medium: { label: 'Media', className: 'bg-primary/10 text-primary' },
  low: { label: 'Baja', className: 'bg-surface-variant text-on-surface-variant' },
};

const PRIORITY_BAR_COLOR: Record<string, string> = {
  urgent: 'bg-error',
  high: 'bg-secondary',
  medium: 'bg-primary',
  low: 'bg-surface-variant',
};

interface GroupTaskListProps {
  items: MockItem[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}

export function GroupTaskList({ items, selectedId, onSelect }: GroupTaskListProps) {
  return (
    <div className="xl:col-span-8 space-y-4">
      {items.length === 0 && (
        <EmptyState
          icon="group"
          title="Sin tareas en este grupo"
          description="Las tareas compartidas con tu grupo aparecerán aquí."
          className="col-span-8"
        />
      )}

      {/* Table header */}
      <div className="grid grid-cols-12 px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant opacity-60">
        <div className="col-span-6">Tarea Compartida</div>
        <div className="col-span-2 text-center">Asignado a</div>
        <div className="col-span-2 text-center">Prioridad</div>
        <div className="col-span-2 text-right">Estado</div>
      </div>

      {items.map((item) => {
        const isSelected = item.id === selectedId;
        const status = STATUS_CONFIG[item.status] ?? (STATUS_CONFIG.pending as StatusConfig);
        const priority = PRIORITY_CONFIG[item.priority] ?? (PRIORITY_CONFIG.medium as PriorityConfig);
        const barColor = PRIORITY_BAR_COLOR[item.priority] ?? 'bg-primary';

        return (
          <div
            key={item.id}
            onClick={() => onSelect?.(item.id)}
            className={cn(
              'group relative bg-surface-container-low hover:bg-surface-container-highest transition-all duration-300 rounded-xl p-1 cursor-pointer',
              isSelected && 'border border-primary/20 shadow-lg shadow-primary/5 bg-surface-container-highest'
            )}
          >
            <div className="grid grid-cols-12 items-center px-5 py-4">
              {/* Title */}
              <div className="col-span-6 flex items-center gap-4">
                <div className={cn('w-1.5 h-10 rounded-full shrink-0', barColor)} />
                <Link href={`/tareas/${item.id}`} className="group/link">
                  <h4 className="text-on-surface font-semibold tracking-tight group-hover/link:text-primary transition-colors">
                    {item.title}
                  </h4>
                  {item.notes && (
                    <p className="text-xs text-on-surface-variant mt-1">{item.notes}</p>
                  )}
                </Link>
              </div>

              {/* Assignee */}
              <div className="col-span-2 flex justify-center">
                {item.assignee ? (
                  <div
                    className="w-8 h-8 rounded-full ring-2 ring-primary/20 flex items-center justify-center text-xs font-bold text-on-surface"
                    style={{ backgroundColor: item.assignee.avatarColor ?? '#004f34' }}
                    title={item.assignee.name}
                  >
                    {item.assignee.initials}
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full ring-2 ring-outline-variant/30 bg-surface-container-highest flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm text-on-surface-variant">
                      person
                    </span>
                  </div>
                )}
              </div>

              {/* Priority */}
              <div className="col-span-2 flex justify-center">
                <span
                  className={cn(
                    'px-3 py-1 rounded-full text-[10px] font-bold uppercase',
                    priority.className
                  )}
                >
                  {priority.label}
                </span>
              </div>

              {/* Status */}
              <div className="col-span-2 text-right">
                <div className={cn('flex items-center justify-end gap-2', status.color)}>
                  <span className="text-xs font-bold">{status.label}</span>
                  <span className="material-symbols-outlined text-sm">{status.icon}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
