'use client';

import { useState } from 'react';
import { GroupTaskList } from '../components/group-task-list';
import { ChangeHistoryPanel } from '../components/change-history-panel';
import { GROUP_ITEMS, MOCK_HISTORY, MOCK_USERS } from '@/lib/mock/data';

export function GruposPage() {
  const defaultItem = GROUP_ITEMS[1] ?? GROUP_ITEMS[0];
  const [selectedId, setSelectedId] = useState<string>(defaultItem?.id ?? '');
  const selectedItem = GROUP_ITEMS.find((i) => i.id === selectedId) ?? defaultItem;

  return (
    <div className="px-8 lg:px-12 pt-8 pb-16 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-secondary mb-2">
            <span
              className="material-symbols-outlined text-sm"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_awesome
            </span>
            <span className="text-xs font-bold tracking-widest uppercase">Project Curator</span>
          </div>
          <h2 className="text-4xl font-extrabold text-on-background tracking-tighter mb-4 font-headline">
            Vista de Grupo
          </h2>

          {/* Filters + members */}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="bg-surface-container-high text-on-surface-variant px-4 py-2 rounded-full text-xs font-medium border border-transparent hover:border-primary/30 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">filter_list</span>
              Filtrar por responsable
            </button>
            <button
              type="button"
              className="bg-surface-container-high text-on-surface-variant px-4 py-2 rounded-full text-xs font-medium border border-transparent hover:border-primary/30 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">sort</span>
              Prioridad: Alta
            </button>

            <div className="flex -space-x-2 ml-2">
              {MOCK_USERS.slice(0, 3).map((user) => (
                <div
                  key={user.id}
                  className="w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-bold text-on-surface"
                  style={{ backgroundColor: user.avatarColor ?? '#004f34' }}
                  title={user.name}
                >
                  {user.initials}
                </div>
              ))}
              <div className="w-8 h-8 rounded-full border-2 border-background bg-surface-container-highest flex items-center justify-center text-[10px] font-bold text-primary">
                +{Math.max(0, MOCK_USERS.length - 3)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <GroupTaskList
          items={GROUP_ITEMS}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        {selectedItem && (
          <ChangeHistoryPanel
            entries={MOCK_HISTORY}
            taskTitle={selectedItem.title}
          />
        )}
      </div>
    </div>
  );
}
