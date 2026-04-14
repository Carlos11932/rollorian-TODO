'use client';

import { useState } from 'react';
import { MetadataPanel } from '../components/metadata-panel';
import { TaskHistorySection } from '../components/task-history-section';
import { GROUP_ITEMS, MOCK_HISTORY } from '@/lib/mock/data';
import type { MockItem } from '@/lib/mock/types';

interface TareaDetailPageProps {
  id: string;
}

function getMockItem(id: string): MockItem {
  const found = GROUP_ITEMS.find((i) => i.id === id);
  if (found) return found;

  return {
    id,
    title: 'Actualizar motor de renderizado editorial',
    notes:
      'Optimizar la lógica de carga asíncrona para las portadas de libros de alta resolución. El objetivo es reducir el tiempo de bloqueo del hilo principal durante el scroll infinito en la vista de curaduría.',
    itemType: 'task',
    status: 'blocked',
    priority: 'high',
    spaceType: 'personal',
    blockedReason:
      'Esperando aprobación final del departamento de diseño visual sobre el gradiente de placeholder.',
    assignee: { id: 'user-2', name: 'Elena R.', initials: 'ER', avatarColor: '#004f34' },
    dueDate: '24 Oct, 2023',
    createdAt: '2023-10-08T08:00:00Z',
    tags: ['Performance', 'Editorial', 'V1.2'],
  };
}

export function TareaDetailPage({ id }: TareaDetailPageProps) {
  const item = getMockItem(id);
  const [description, setDescription] = useState(item.notes ?? '');

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] px-5 pt-4 pb-4 gap-4 overflow-hidden">
      {/* Compact header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[11px] text-on-surface-variant mb-1">
            <span>Tareas</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-secondary font-medium uppercase">{id}</span>
          </div>
          <h1 className="text-base font-bold text-on-surface font-headline truncate">
            {item.title}
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-4">
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-surface-bright transition-colors text-xs font-semibold flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">share</span>
            Compartir
          </button>
          <button
            type="button"
            className="px-4 py-1.5 rounded-lg bg-primary text-on-primary font-bold text-xs flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">save</span>
            Guardar
          </button>
        </div>
      </div>

      {/* Content grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        {/* Left: description + dependencies + history */}
        <div className="lg:col-span-2 flex flex-col gap-4 min-h-0 overflow-y-auto hide-scrollbar">
          {/* Description */}
          <section className="bg-surface-container-low rounded-xl p-4 shrink-0">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
              Descripción
            </h2>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Añade una descripción detallada..."
              className="w-full bg-surface-container-lowest border border-outline-variant/20 focus:ring-1 focus:ring-primary rounded-lg text-sm text-tertiary p-3 min-h-[100px] leading-relaxed resize-none outline-none"
            />

            {item.status === 'blocked' && item.blockedReason && (
              <div className="mt-3 p-3 rounded-lg bg-error-container/10 border border-error/20 flex gap-3">
                <span className="material-symbols-outlined text-error text-sm shrink-0">warning</span>
                <div>
                  <p className="text-error text-xs font-bold">Motivo de bloqueo</p>
                  <p className="text-on-surface-variant text-xs mt-0.5">{item.blockedReason}</p>
                </div>
              </div>
            )}
          </section>

          {/* Dependencies + Tags row */}
          <div className="grid grid-cols-2 gap-4 shrink-0">
            <section className="bg-surface-container-low rounded-xl p-4">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">link</span>
                Dependencia
              </h2>
              <div className="flex items-center gap-2 p-2.5 bg-surface-container-highest/50 rounded-lg cursor-pointer hover:bg-surface-container-highest transition-colors group">
                <div className="w-1 h-8 bg-secondary rounded-full shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-on-surface truncate">ARC-045: Sistema de Assets</p>
                  <p className="text-[10px] text-on-surface-variant/60 truncate">Finalización de API de texturas</p>
                </div>
              </div>
            </section>

            <section className="bg-surface-container-low rounded-xl p-4">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">label</span>
                Etiquetas
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {item.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[10px] font-medium border border-outline-variant/15"
                  >
                    {tag}
                  </span>
                ))}
                <button
                  type="button"
                  className="w-6 h-6 rounded-full border border-dashed border-outline-variant/40 text-on-surface-variant flex items-center justify-center hover:bg-surface-container-highest transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                </button>
              </div>
            </section>
          </div>

          {/* History */}
          <TaskHistorySection entries={MOCK_HISTORY} />
        </div>

        {/* Right: metadata */}
        <div className="min-h-0">
          <MetadataPanel item={item} />
        </div>
      </div>
    </div>
  );
}
