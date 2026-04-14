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
    <div className="flex flex-col h-[calc(100vh-4rem)] px-5 pt-4 pb-4 gap-4 overflow-hidden">
      {/* Compact header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Archivo Histórico
          </h2>
          <span className="text-[10px] text-on-surface-variant/40 uppercase tracking-widest">
            · Grupo activo
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Member avatars */}
          <div className="flex -space-x-1.5">
            {MOCK_USERS.slice(0, 3).map((user) => (
              <div
                key={user.id}
                className="w-6 h-6 rounded-full border border-surface flex items-center justify-center text-[9px] font-bold text-on-surface"
                style={{ backgroundColor: user.avatarColor ?? '#004f34' }}
                title={user.name}
              >
                {user.initials}
              </div>
            ))}
            {MOCK_USERS.length > 3 && (
              <div className="w-6 h-6 rounded-full border border-surface bg-surface-container-highest flex items-center justify-center text-[9px] font-bold text-primary">
                +{MOCK_USERS.length - 3}
              </div>
            )}
          </div>

          {/* Filters */}
          <button
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-container-high text-on-surface-variant text-xs font-medium hover:bg-surface-container-highest transition-colors"
          >
            <span className="material-symbols-outlined text-sm">filter_list</span>
            Filtrar
          </button>
        </div>
      </div>

      {/* Master-detail grid */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-4 min-h-0">
        <div className="xl:col-span-2 min-h-0">
          <GroupTaskList
            items={GROUP_ITEMS}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
        {selectedItem && (
          <div className="xl:col-span-1 min-h-0">
            <ChangeHistoryPanel
              entries={MOCK_HISTORY}
              taskTitle={selectedItem.title}
            />
          </div>
        )}
      </div>
    </div>
  );
}
