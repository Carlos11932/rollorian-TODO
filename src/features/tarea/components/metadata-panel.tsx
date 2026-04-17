'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import type { MockItem, ItemStatus, MockUser } from '@/dev-data/types';
import { MOCK_USERS, MOCK_GROUPS } from '@/dev-data/data';
import type { GroupMemberDto } from '@/interfaces/ui/history-entry-dto';

type PriorityOption = 'low' | 'medium' | 'high' | 'urgent';

const PRIORITY_OPTIONS: { value: PriorityOption; label: string }[] = [
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Crítica' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-on-surface-variant',
  in_progress: 'bg-primary',
  blocked: 'bg-error animate-pulse',
  postponed: 'bg-secondary',
  done: 'bg-primary',
  canceled: 'bg-on-surface-variant',
  scheduled: 'bg-primary',
  completed: 'bg-primary',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En Progreso',
  blocked: 'Bloqueado',
  postponed: 'Pospuesto',
  done: 'Completado',
  canceled: 'Cancelado',
  scheduled: 'Programado',
  completed: 'Completado',
};

interface MetadataPanelProps {
  item: MockItem;
  /** Real group members from the DB. When provided, replaces MOCK_USERS for the assignee picker. */
  groupMembers?: GroupMemberDto[];
}

const TASK_STATUS_OPTIONS: { value: ItemStatus; label: string }[] = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'in_progress', label: 'En Progreso' },
  { value: 'blocked', label: 'Bloqueado' },
  { value: 'postponed', label: 'Pospuesto' },
  { value: 'done', label: 'Completado' },
  { value: 'canceled', label: 'Cancelado' },
];

const EVENT_STATUS_OPTIONS: { value: ItemStatus; label: string }[] = [
  { value: 'scheduled', label: 'Programado' },
  { value: 'completed', label: 'Completado' },
  { value: 'canceled', label: 'Cancelado' },
];

export function MetadataPanel({ item, groupMembers }: MetadataPanelProps) {
  const [priority, setPriority] = useState<PriorityOption>(item.priority as PriorityOption);
  const [status, setStatus] = useState<ItemStatus>(item.status);
  const [assignee, setAssignee] = useState<MockUser | undefined>(item.assignee);
  const [statusOpen, setStatusOpen] = useState(false);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const assigneeRef = useRef<HTMLDivElement>(null);

  // Use real group members if provided, otherwise fall back to dev mock data
  const candidateUsers: MockUser[] = groupMembers
    ? groupMembers.map((m) => ({ id: m.id, name: m.name, initials: m.initials, avatarColor: undefined }))
    : item.groupId
      ? (MOCK_GROUPS.find((g) => g.id === item.groupId)?.members ?? MOCK_USERS)
      : MOCK_USERS;

  useEffect(() => {
    if (!statusOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setStatusOpen(false);
      }
    }
    const t = setTimeout(() => document.addEventListener('mousedown', onClickOutside), 0);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', onClickOutside); };
  }, [statusOpen]);

  useEffect(() => {
    if (!assigneeOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (assigneeRef.current && !assigneeRef.current.contains(e.target as Node)) {
        setAssigneeOpen(false);
      }
    }
    const t = setTimeout(() => document.addEventListener('mousedown', onClickOutside), 0);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', onClickOutside); };
  }, [assigneeOpen]);

  const statusOptions = item.itemType === 'event' ? EVENT_STATUS_OPTIONS : TASK_STATUS_OPTIONS;

  return (
    <div className="flex flex-col h-full gap-3 overflow-y-auto hide-scrollbar">
      {/* Metadata */}
      <section className="bg-[rgba(255,255,255,0.02)] rounded-lg border border-[rgba(255,255,255,0.05)] p-4 space-y-4 shrink-0">
        {/* Status */}
        <div>
          <label className="text-[10px] font-medium uppercase tracking-widest text-on-surface-variant/50 block mb-2">
            Estado
          </label>
          <div ref={statusRef} className="relative">
            <button
              type="button"
              onClick={() => setStatusOpen((o) => !o)}
              className="w-full flex items-center justify-between px-3 py-2 bg-[rgba(255,255,255,0.03)] rounded-md hover:bg-[rgba(255,255,255,0.05)] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className={cn('w-2 h-2 rounded-full', STATUS_COLORS[status])} />
                <span className="text-on-surface font-medium text-sm">
                  {STATUS_LABELS[status] ?? status}
                </span>
              </div>
              <span className={cn(
                'material-symbols-outlined text-sm text-on-surface-variant transition-transform',
                statusOpen && 'rotate-180'
              )}>
                expand_more
              </span>
            </button>

            {statusOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-high rounded-lg border border-[rgba(255,255,255,0.08)] shadow-xl shadow-black/40 z-10 overflow-hidden">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setStatus(opt.value); setStatusOpen(false); }}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-[rgba(255,255,255,0.05)] transition-colors',
                      status === opt.value && 'text-primary font-medium'
                    )}
                  >
                    <div className={cn('w-2 h-2 rounded-full shrink-0', STATUS_COLORS[opt.value])} />
                    {opt.label}
                    {status === opt.value && (
                      <span className="material-symbols-outlined text-sm text-primary ml-auto">check</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="text-[10px] font-medium uppercase tracking-widest text-on-surface-variant/50 block mb-2">
            Prioridad
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {PRIORITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPriority(opt.value)}
                className={cn(
                  'py-1.5 rounded-md text-[10px] font-medium border transition-all',
                  priority === opt.value
                    ? opt.value === 'urgent'
                      ? 'bg-error/10 text-error border-error/30'
                      : opt.value === 'high'
                        ? 'bg-secondary/10 text-secondary border-secondary/30'
                        : opt.value === 'medium'
                          ? 'bg-primary/10 text-primary border-primary/30'
                          : 'bg-[rgba(255,255,255,0.05)] text-on-surface-variant border-[rgba(255,255,255,0.08)]'
                    : 'bg-[rgba(255,255,255,0.03)] text-on-surface-variant border-transparent hover:border-[rgba(255,255,255,0.08)]'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Assignee — only for group items (personal items are implicitly self-assigned) */}
        {item.spaceType === 'group' && (
        <div>
          <label className="text-[10px] font-medium uppercase tracking-widest text-on-surface-variant/50 block mb-2">
            Asignado
          </label>
          <div ref={assigneeRef} className="relative">
            {assignee ? (
              <button
                type="button"
                onClick={() => setAssigneeOpen((o) => !o)}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-md bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.08)] transition-colors"
              >
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-on-surface shrink-0"
                  style={{ backgroundColor: assignee.avatarColor ?? '#064e3b' }}
                >
                  {assignee.initials}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-bold text-on-surface truncate">{assignee.name}</p>
                </div>
                <span className={cn(
                  'material-symbols-outlined text-sm text-on-surface-variant transition-transform',
                  assigneeOpen && 'rotate-180'
                )}>
                  expand_more
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAssigneeOpen((o) => !o)}
                className="w-full p-2.5 rounded-md border border-dashed border-[rgba(255,255,255,0.08)] text-on-surface-variant text-xs hover:border-primary/40 hover:text-primary transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">person_add</span>
                Asignar responsable
              </button>
            )}

            {assigneeOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-high rounded-lg border border-[rgba(255,255,255,0.08)] shadow-xl shadow-black/40 z-10 overflow-hidden">
                {assignee && (
                  <button
                    type="button"
                    onClick={() => { setAssignee(undefined); setAssigneeOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-on-surface-variant hover:bg-[rgba(255,255,255,0.05)] transition-colors border-b border-[rgba(255,255,255,0.05)]"
                  >
                    <span className="material-symbols-outlined text-sm">person_off</span>
                    Sin asignar
                  </button>
                )}
                {candidateUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => { setAssignee(user); setAssigneeOpen(false); }}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-[rgba(255,255,255,0.05)] transition-colors',
                      assignee?.id === user.id && 'text-primary font-medium'
                    )}
                  >
                    <div
                      className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold text-on-surface shrink-0"
                      style={{ backgroundColor: user.avatarColor ?? '#064e3b' }}
                    >
                      {user.initials}
                    </div>
                    {user.name}
                    {assignee?.id === user.id && (
                      <span className="material-symbols-outlined text-sm text-primary ml-auto">check</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        )}

        {/* Dates */}
        <div className="space-y-2.5">
          {item.dueDate && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1.5">
                Fecha de entrega
              </label>
              <div className="flex items-center gap-2 bg-[rgba(255,255,255,0.03)] px-3 py-2 rounded-md">
                <span className="material-symbols-outlined text-sm text-secondary">calendar_today</span>
                <span className="text-sm text-on-surface">{item.dueDate}</span>
              </div>
            </div>
          )}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1.5">
              Creado el
            </label>
            <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-sm">schedule</span>
              <span>
                {new Date(item.createdAt).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
