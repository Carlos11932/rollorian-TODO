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
  pending: { label: 'Pendiente', icon: 'schedule', color: 'text-on-surface-variant' },
  in_progress: { label: 'En Progreso', icon: 'sync', color: 'text-primary' },
  blocked: { label: 'Bloqueado', icon: 'block', color: 'text-error' },
  postponed: { label: 'Pospuesto', icon: 'snooze', color: 'text-secondary' },
  done: { label: 'Completado', icon: 'check_circle', color: 'text-primary' },
  canceled: { label: 'Cancelado', icon: 'cancel', color: 'text-on-surface-variant' },
  scheduled: { label: 'Programado', icon: 'event', color: 'text-primary' },
  completed: { label: 'Completado', icon: 'event_available', color: 'text-primary' },
};

const PRIORITY_BAR: Record<string, string> = {
  urgent: 'bg-error',
  high: 'bg-secondary',
  medium: 'bg-primary',
  low: 'bg-on-surface-variant/30',
};

const PRIORITY_LABEL: Record<string, { label: string; className: string }> = {
  urgent: { label: 'Crítica', className: 'bg-error/10 text-error' },
  high: { label: 'Alta', className: 'bg-secondary/10 text-secondary' },
  medium: { label: 'Media', className: 'bg-primary/10 text-primary' },
  low: { label: 'Baja', className: 'bg-surface-container-highest text-on-surface-variant' },
};

interface GroupTaskListProps {
  items: MockItem[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}

export function GroupTaskList({ items, selectedId, onSelect }: GroupTaskListProps) {
  return (
    <div className="flex flex-col h-full bg-surface-container-low rounded-xl overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-12 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] text-on-surface-variant/50 border-b border-outline-variant/10 shrink-0">
        <div className="col-span-6">Tarea</div>
        <div className="col-span-2 text-center">Asignado</div>
        <div className="col-span-2 text-center">Prioridad</div>
        <div className="col-span-2 text-right">Estado</div>
      </div>

      {/* Rows — scrollable */}
      <div className="flex-1 overflow-y-auto hide-scrollbar divide-y divide-outline-variant/10">
        {items.length === 0 ? (
          <EmptyState
            icon="group"
            title="Sin tareas en este grupo"
            description="Las tareas compartidas con tu grupo aparecerán aquí."
          />
        ) : (
          items.map((item) => {
            const isSelected = item.id === selectedId;
            const status = STATUS_CONFIG[item.status] ?? (STATUS_CONFIG.pending as StatusConfig);
            const priority = PRIORITY_LABEL[item.priority] ?? (PRIORITY_LABEL.medium as { label: string; className: string });
            const barColor = PRIORITY_BAR[item.priority] ?? 'bg-primary';

            return (
              <div
                key={item.id}
                onClick={() => onSelect?.(item.id)}
                className={cn(
                  'grid grid-cols-12 items-center px-4 py-2.5 cursor-pointer transition-colors',
                  isSelected
                    ? 'bg-surface-container-highest'
                    : 'hover:bg-surface-container-highest/50'
                )}
              >
                {/* Title */}
                <div className="col-span-6 flex items-center gap-3 min-w-0">
                  <div className={cn('w-1 h-7 rounded-full shrink-0', barColor)} />
                  <Link
                    href={`/tareas/${item.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="group/link min-w-0"
                  >
                    <p className="text-sm font-medium text-on-surface group-hover/link:text-primary transition-colors truncate">
                      {item.title}
                    </p>
                    {item.notes && (
                      <p className="text-[11px] text-on-surface-variant/50 truncate">{item.notes}</p>
                    )}
                  </Link>
                </div>

                {/* Assignee */}
                <div className="col-span-2 flex justify-center">
                  {item.assignee ? (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-on-surface"
                      style={{ backgroundColor: item.assignee.avatarColor ?? '#004f34' }}
                      title={item.assignee.name}
                    >
                      {item.assignee.initials}
                    </div>
                  ) : (
                    <span className="material-symbols-outlined text-sm text-on-surface-variant/30">
                      person
                    </span>
                  )}
                </div>

                {/* Priority */}
                <div className="col-span-2 flex justify-center">
                  <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase', priority.className)}>
                    {priority.label}
                  </span>
                </div>

                {/* Status */}
                <div className="col-span-2 flex items-center justify-end gap-1.5">
                  <span className={cn('text-[11px] font-medium', status.color)}>{status.label}</span>
                  <span className={cn('material-symbols-outlined text-sm', status.color)}>{status.icon}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
