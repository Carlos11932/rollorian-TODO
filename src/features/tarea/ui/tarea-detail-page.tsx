'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MetadataPanel } from '../components/metadata-panel';
import { TaskHistorySection } from '../components/task-history-section';
import { MOCK_HISTORY, MOCK_USERS } from '@/lib/mock/data';
import type { MockItem, ItemStatus } from '@/lib/mock/types';
import type { ItemView, TaskItemView } from '@/interfaces/views/item-view';
import { cn } from '@/lib/cn';
import { deleteItemAction } from '@/features/shared/actions/item-actions';

interface TareaDetailPageProps {
  id: string;
  item: ItemView;
}

function itemViewToMockItem(view: ItemView): MockItem {
  const assignee = view.assigneeIds[0]
    ? MOCK_USERS.find((u) => u.id === view.assigneeIds[0])
    : undefined;

  let dueDate: string | undefined;
  if (view.itemType === 'task') {
    const temporal = (view as TaskItemView).temporal;
    if (temporal.kind !== 'undated' && 'dueAt' in temporal && temporal.dueAt) {
      dueDate = (temporal.dueAt as Date).toISOString().slice(0, 10);
    }
  }

  return {
    id: view.id,
    title: view.title,
    notes: view.notes ?? undefined,
    itemType: view.itemType,
    status: view.status as ItemStatus,
    priority: view.priority,
    spaceType: view.spaceType,
    groupId: view.groupId ?? undefined,
    assignee,
    dueDate,
    createdAt: view.createdAt,
    tags: view.labels.map((l) => l.value),
  };
}

export function TareaDetailPage({ id, item: itemView }: TareaDetailPageProps) {
  const router = useRouter();
  const mockItem = itemViewToMockItem(itemView);

  const [description, setDescription] = useState(mockItem.notes ?? '');
  const [tags, setTags] = useState<string[]>(mockItem.tags ?? []);
  const [addingTag, setAddingTag] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [saved, setSaved] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const tagInputRef = useRef<HTMLInputElement>(null);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleDelete() {
    startDeleteTransition(async () => {
      await deleteItemAction(id);
      router.push('/');
    });
  }

  function commitTag() {
    const trimmed = newTag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setNewTag('');
    setAddingTag(false);
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function startAddingTag() {
    setAddingTag(true);
    setTimeout(() => tagInputRef.current?.focus(), 0);
  }

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
            {mockItem.title}
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-4">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors text-error hover:bg-error/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
            {isDeleting ? 'Eliminando…' : 'Eliminar'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={cn(
              'px-4 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors',
              saved
                ? 'bg-surface-container-high text-primary'
                : 'bg-primary text-on-primary hover:bg-primary-fixed'
            )}
          >
            <span className="material-symbols-outlined text-sm">
              {saved ? 'check' : 'save'}
            </span>
            {saved ? 'Guardado' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* Content grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        {/* Left: description + tags + history */}
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

            {mockItem.status === 'blocked' && mockItem.blockedReason && (
              <div className="mt-3 p-3 rounded-lg bg-error-container/10 border border-error/20 flex gap-3">
                <span className="material-symbols-outlined text-error text-sm shrink-0">warning</span>
                <div>
                  <p className="text-error text-xs font-bold">Motivo de bloqueo</p>
                  <p className="text-on-surface-variant text-xs mt-0.5">{mockItem.blockedReason}</p>
                </div>
              </div>
            )}
          </section>

          {/* Tags */}
          <div className="shrink-0">
            <section className="bg-surface-container-low rounded-xl p-4">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">label</span>
                Etiquetas
              </h2>
              <div className="flex flex-wrap gap-1.5 items-center">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="group flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[10px] font-medium border border-outline-variant/15"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-on-surface-variant/60 hover:text-error"
                      aria-label={`Eliminar etiqueta ${tag}`}
                    >
                      <span className="material-symbols-outlined text-[10px]">close</span>
                    </button>
                  </span>
                ))}

                {addingTag ? (
                  <input
                    ref={tagInputRef}
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitTag();
                      if (e.key === 'Escape') { setAddingTag(false); setNewTag(''); }
                    }}
                    onBlur={commitTag}
                    placeholder="Etiqueta..."
                    className="px-2 py-0.5 rounded-full bg-surface-container-highest border border-primary/40 text-[10px] text-on-surface outline-none w-24"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={startAddingTag}
                    className="w-6 h-6 rounded-full border border-dashed border-outline-variant/40 text-on-surface-variant flex items-center justify-center hover:border-primary/50 hover:text-primary transition-colors"
                    aria-label="Añadir etiqueta"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                )}
              </div>
            </section>
          </div>

          {/* History */}
          <TaskHistorySection entries={MOCK_HISTORY} />
        </div>

        {/* Right: metadata */}
        <div className="min-h-0">
          <MetadataPanel item={mockItem} />
        </div>
      </div>
    </div>
  );
}
