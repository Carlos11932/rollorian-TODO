'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import type { MockItem } from '@/lib/mock/types';

type PriorityOption = 'low' | 'medium' | 'high' | 'urgent';

const PRIORITY_OPTIONS: { value: PriorityOption; label: string }[] = [
  { value: 'low', label: 'Baja' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Crítica' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-on-surface-variant',
  in_progress: 'bg-primary',
  blocked: 'bg-error animate-pulse',
  done: 'bg-primary',
  cancelled: 'bg-on-surface-variant',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En Progreso',
  blocked: 'Bloqueado',
  done: 'Completado',
  cancelled: 'Cancelado',
};

interface MetadataPanelProps {
  item: MockItem;
}

export function MetadataPanel({ item }: MetadataPanelProps) {
  const [priority, setPriority] = useState<PriorityOption>(
    item.priority as PriorityOption
  );

  return (
    <div className="lg:col-span-4 space-y-6">
      {/* Metadata */}
      <section className="bg-surface-container-low rounded-xl p-6 space-y-6">
        {/* Status */}
        <div>
          <label className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest block mb-3">
            Estado
          </label>
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3 bg-surface-container-highest rounded-lg text-sm group"
          >
            <div className="flex items-center gap-3">
              <div
                className={cn('w-2.5 h-2.5 rounded-full', STATUS_COLORS[item.status])}
              />
              <span className="text-on-surface font-semibold">
                {STATUS_LABELS[item.status]}
              </span>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-y-0.5 transition-transform">
              expand_more
            </span>
          </button>
        </div>

        {/* Priority */}
        <div>
          <label className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest block mb-3">
            Prioridad
          </label>
          <div className="flex gap-2">
            {PRIORITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPriority(opt.value)}
                className={cn(
                  'flex-1 py-2 rounded-lg text-xs border transition-all',
                  priority === opt.value
                    ? opt.value === 'urgent'
                      ? 'bg-error/10 text-error border-error/30 font-bold'
                      : opt.value === 'high'
                        ? 'bg-secondary/10 text-secondary border-secondary/30 font-bold'
                        : 'bg-primary/10 text-primary border-primary/30 font-bold'
                    : 'bg-surface-container-highest text-on-surface-variant border-transparent hover:border-outline-variant/40'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Assignee */}
        <div>
          <label className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest block mb-3">
            Asignado a
          </label>
          {item.assignee ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-highest/30 border border-outline-variant/10">
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-on-surface shrink-0"
                style={{ backgroundColor: item.assignee.avatarColor ?? '#004f34' }}
              >
                {item.assignee.initials}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-on-surface">{item.assignee.name}</p>
                <p className="text-xs text-on-surface-variant">Lead Developer</p>
              </div>
              <button
                type="button"
                className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors"
              >
                edit_square
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="w-full p-3 rounded-lg border border-dashed border-outline-variant/40 text-on-surface-variant text-sm hover:border-primary/40 hover:text-primary transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">person_add</span>
              Asignar responsable
            </button>
          )}
        </div>

        {/* Dates */}
        <div className="space-y-4">
          {item.dueDate && (
            <div>
              <label className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest block mb-2">
                Fecha de entrega
              </label>
              <div className="flex items-center gap-3 text-sm text-on-surface bg-surface-container-highest/30 px-3 py-2 rounded-lg">
                <span className="material-symbols-outlined text-sm text-secondary">
                  calendar_today
                </span>
                <span>{item.dueDate}</span>
              </div>
            </div>
          )}
          <div>
            <label className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest block mb-2">
              Creado el
            </label>
            <div className="flex items-center gap-3 text-sm text-on-surface-variant px-3 py-2">
              <span className="material-symbols-outlined text-sm">schedule</span>
              <span>{new Date(item.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="bg-surface-container-low rounded-xl p-6">
        <h2 className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-4">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-surface-container-highest hover:bg-surface-bright transition-all text-on-surface-variant group"
          >
            <span className="material-symbols-outlined mb-2 group-hover:scale-110 transition-transform">
              content_copy
            </span>
            <span className="text-[10px] font-bold uppercase tracking-tight">Duplicar</span>
          </button>
          <button
            type="button"
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-surface-container-highest hover:bg-surface-bright transition-all text-on-surface-variant group"
          >
            <span className="material-symbols-outlined mb-2 group-hover:scale-110 transition-transform">
              archive
            </span>
            <span className="text-[10px] font-bold uppercase tracking-tight">Archivar</span>
          </button>
          <button
            type="button"
            className="col-span-2 flex flex-col items-center justify-center p-4 rounded-xl bg-error/5 hover:bg-error/10 transition-all text-error group"
          >
            <span className="material-symbols-outlined mb-2 group-hover:scale-110 transition-transform">
              delete_sweep
            </span>
            <span className="text-[10px] font-bold uppercase tracking-tight">Eliminar Tarea</span>
          </button>
        </div>
      </section>
    </div>
  );
}
