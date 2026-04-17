import Link from 'next/link';
import { cn } from '@/lib/cn';
import { EmptyState } from '@/features/shared/components/empty-state';
import type { ItemCardDto } from '@/interfaces/ui/item-card-dto';

type StatusConfig = {
  label: string;
  icon: string;
  className: string;
};

const STATUS_CONFIG: Record<string, StatusConfig> = {
  pending:     { label: 'Pendiente',  icon: 'schedule',        className: 'bg-on-surface-variant/[0.12] text-on-surface-variant' },
  in_progress: { label: 'En Progreso',icon: 'sync',            className: 'bg-primary/[0.12] text-primary' },
  blocked:     { label: 'Bloqueado',  icon: 'block',           className: 'bg-error/[0.12] text-error' },
  postponed:   { label: 'Pospuesto', icon: 'snooze',           className: 'bg-secondary/[0.12] text-secondary' },
  done:        { label: 'Completado', icon: 'check_circle',    className: 'bg-primary/[0.12] text-primary' },
  canceled:    { label: 'Cancelado',  icon: 'cancel',          className: 'bg-on-surface-variant/[0.12] text-on-surface-variant' },
  scheduled:   { label: 'Programado', icon: 'event',           className: 'bg-primary/[0.12] text-primary' },
  completed:   { label: 'Completado', icon: 'event_available', className: 'bg-primary/[0.12] text-primary' },
};

const PRIORITY_BAR: Record<string, string> = {
  urgent: 'bg-error',
  high: 'bg-secondary',
  medium: 'bg-primary',
  low: 'bg-on-surface-variant/30',
};

const PRIORITY_LABEL: Record<string, { label: string; className: string }> = {
  urgent: { label: 'Crítica', className: 'bg-error/[0.12] text-error' },
  high:   { label: 'Alta',    className: 'bg-secondary/[0.12] text-secondary' },
  medium: { label: 'Media',   className: 'bg-primary/[0.12] text-primary' },
  low:    { label: 'Baja',    className: 'bg-on-surface-variant/[0.12] text-on-surface-variant' },
};

interface GroupTaskListProps {
  items: ItemCardDto[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}

export function GroupTaskList({ items, selectedId, onSelect }: GroupTaskListProps) {
  return (
    <div className="flex flex-col h-full bg-[rgba(255,255,255,0.02)] rounded-lg border border-[rgba(255,255,255,0.05)] overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-12 px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.15em] text-on-surface-variant/40 border-b border-[rgba(255,255,255,0.05)] shrink-0">
        <div className="col-span-6">Tarea</div>
        <div className="col-span-2 text-center">Asignado</div>
        <div className="col-span-2 text-center">Prioridad</div>
        <div className="col-span-2 text-right">Estado</div>
      </div>

      {/* Rows — scrollable */}
      <div className="flex-1 overflow-y-auto hide-scrollbar divide-y divide-[rgba(255,255,255,0.05)]">
        {items.length === 0 ? (
          <EmptyState
            icon="group"
            title="Sin tareas en este grupo"
            description="Las tareas compartidas con tu grupo aparecerán aquí."
          />
        ) : (
          items.map((item) => {
            const isSelected = item.id === selectedId;
            const status = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending!;
            const priority = PRIORITY_LABEL[item.priority] ?? PRIORITY_LABEL.medium!;
            const barColor = PRIORITY_BAR[item.priority] ?? 'bg-primary';

            return (
              <div
                key={item.id}
                onClick={() => onSelect?.(item.id)}
                className={cn(
                  'grid grid-cols-12 items-center px-4 py-2.5 cursor-pointer transition-colors',
                  isSelected
                    ? 'bg-[rgba(255,255,255,0.05)]'
                    : 'hover:bg-[rgba(255,255,255,0.03)]'
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
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-medium text-on-surface"
                      style={{ backgroundColor: item.assignee.avatarColor ?? '#064e3b' }}
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
                  <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium uppercase', priority.className)}>
                    {priority.label}
                  </span>
                </div>

                {/* Status */}
                <div className="col-span-2 flex items-center justify-end gap-1.5">
                  <span className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase', status.className)}>
                    <span className="material-symbols-outlined text-[11px]">{status.icon}</span>
                    {status.label}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
