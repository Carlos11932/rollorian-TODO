'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import type { MockItem } from '@/lib/mock/types';

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
}

export function MetadataPanel({ item }: MetadataPanelProps) {
  const [priority, setPriority] = useState<PriorityOption>(item.priority as PriorityOption);

  return (
    <div className="flex flex-col h-full gap-3 overflow-y-auto hide-scrollbar">
      {/* Metadata */}
      <section className="bg-surface-container-low rounded-xl p-4 space-y-4 shrink-0">
        {/* Status */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">
            Estado
          </label>
          <button
            type="button"
            className="w-full flex items-center justify-between px-3 py-2 bg-surface-container-high rounded-lg group"
          >
            <div className="flex items-center gap-2.5">
              <div className={cn('w-2 h-2 rounded-full', STATUS_COLORS[item.status])} />
              <span className="text-on-surface font-medium text-sm">
                {STATUS_LABELS[item.status] ?? item.status}
              </span>
            </div>
            <span className="material-symbols-outlined text-sm text-on-surface-variant group-hover:translate-y-0.5 transition-transform">
              expand_more
            </span>
          </button>
        </div>

        {/* Priority */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">
            Prioridad
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {PRIORITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPriority(opt.value)}
                className={cn(
                  'py-1.5 rounded-lg text-[10px] font-bold border transition-all',
                  priority === opt.value
                    ? opt.value === 'urgent'
                      ? 'bg-error/10 text-error border-error/30'
                      : opt.value === 'high'
                        ? 'bg-secondary/10 text-secondary border-secondary/30'
                        : opt.value === 'medium'
                          ? 'bg-primary/10 text-primary border-primary/30'
                          : 'bg-surface-container-highest text-on-surface-variant border-outline-variant/40'
                    : 'bg-surface-container-high text-on-surface-variant border-transparent hover:border-outline-variant/30'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Assignee */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">
            Asignado
          </label>
          {item.assignee ? (
            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-surface-container-high/50 border border-outline-variant/10">
              <div
                className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-on-surface shrink-0"
                style={{ backgroundColor: item.assignee.avatarColor ?? '#004f34' }}
              >
                {item.assignee.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-on-surface truncate">{item.assignee.name}</p>
              </div>
              <button
                type="button"
                className="material-symbols-outlined text-sm text-on-surface-variant hover:text-primary transition-colors"
              >
                edit_square
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="w-full p-2.5 rounded-lg border border-dashed border-outline-variant/40 text-on-surface-variant text-xs hover:border-primary/40 hover:text-primary transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">person_add</span>
              Asignar responsable
            </button>
          )}
        </div>

        {/* Dates */}
        <div className="space-y-2.5">
          {item.dueDate && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1.5">
                Fecha de entrega
              </label>
              <div className="flex items-center gap-2 bg-surface-container-high/30 px-3 py-2 rounded-lg">
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

      {/* Quick actions */}
      <section className="bg-surface-container-low rounded-xl p-4 shrink-0">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
          Acciones
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="flex items-center justify-center gap-1.5 p-3 rounded-lg bg-surface-container-high hover:bg-surface-bright transition-all text-on-surface-variant text-xs font-medium"
          >
            <span className="material-symbols-outlined text-sm">content_copy</span>
            Duplicar
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-1.5 p-3 rounded-lg bg-surface-container-high hover:bg-surface-bright transition-all text-on-surface-variant text-xs font-medium"
          >
            <span className="material-symbols-outlined text-sm">archive</span>
            Archivar
          </button>
          <button
            type="button"
            className="col-span-2 flex items-center justify-center gap-1.5 p-3 rounded-lg bg-error/5 hover:bg-error/10 transition-all text-error text-xs font-medium"
          >
            <span className="material-symbols-outlined text-sm">delete_sweep</span>
            Eliminar
          </button>
        </div>
      </section>
    </div>
  );
}
