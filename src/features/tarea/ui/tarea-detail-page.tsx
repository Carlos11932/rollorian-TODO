'use client';

import { useState } from 'react';
import { MetadataPanel } from '../components/metadata-panel';
import { TaskHistorySection } from '../components/task-history-section';
import { GROUP_ITEMS, MOCK_HISTORY } from '@/lib/mock/data';
import type { MockItem } from '@/lib/mock/types';

interface TareaDetailPageProps {
  id: string;
}

// Mock: find item by id, fallback to a detailed example
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
    blockedReason: 'Esperando aprobación final del departamento de diseño visual sobre el gradiente de placeholder.',
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
    <div className="max-w-6xl mx-auto px-6 pt-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 text-on-surface-variant text-sm mb-2">
            <span>Tareas</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-secondary font-medium">{id.toUpperCase().replace('-', '-')}</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface font-headline">
            {item.title}
          </h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-surface-container-highest text-on-surface-variant hover:bg-surface-bright transition-colors text-sm font-semibold flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">share</span>
            Compartir
          </button>
          <button
            type="button"
            className="px-6 py-2 rounded-lg bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary-container/20"
          >
            <span
              className="material-symbols-outlined text-sm"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              save
            </span>
            Guardar cambios
          </button>
        </div>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Description */}
          <section className="bg-surface-container-low rounded-xl p-6">
            <h2 className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-4">
              Descripción General
            </h2>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Añade una descripción detallada..."
              className="w-full bg-surface-container-lowest border border-outline-variant/20 focus:ring-1 focus:ring-primary rounded-lg text-tertiary p-4 min-h-[160px] leading-relaxed resize-none text-sm outline-none"
            />

            {/* Blocking warning */}
            {item.status === 'blocked' && item.blockedReason && (
              <div className="mt-6 p-4 rounded-lg bg-error-container/10 border border-error/20 flex gap-4">
                <span
                  className="material-symbols-outlined text-error shrink-0"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  warning
                </span>
                <div>
                  <p className="text-error text-sm font-bold">Motivo de bloqueo</p>
                  <p className="text-on-surface-variant text-sm">{item.blockedReason}</p>
                </div>
              </div>
            )}
          </section>

          {/* Dependencies + Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-container-low rounded-xl p-6">
              <h2 className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">link</span>
                Dependencia
              </h2>
              <div className="flex items-center gap-3 p-3 bg-surface-container-highest/50 rounded-lg hover:bg-surface-container-highest transition-colors cursor-pointer group">
                <div className="w-1.5 h-10 bg-secondary rounded-full shrink-0" />
                <div>
                  <p className="text-on-surface text-sm font-medium">ARC-045: Sistema de Assets</p>
                  <p className="text-on-surface-variant text-xs">Finalización de API de texturas</p>
                </div>
                <span className="material-symbols-outlined ml-auto text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">
                  open_in_new
                </span>
              </div>
            </div>

            <div className="bg-surface-container-low rounded-xl p-6">
              <h2 className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">label</span>
                Etiquetas
              </h2>
              <div className="flex flex-wrap gap-2">
                {item.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-xs font-medium border border-outline-variant/15"
                  >
                    {tag}
                  </span>
                ))}
                <button
                  type="button"
                  className="w-8 h-8 rounded-full border border-dashed border-outline-variant/40 text-on-surface-variant flex items-center justify-center hover:bg-surface-container-highest transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                </button>
              </div>
            </div>
          </div>

          {/* History */}
          <TaskHistorySection entries={MOCK_HISTORY} />
        </div>

        {/* Right column */}
        <MetadataPanel item={item} />
      </div>
    </div>
  );
}
