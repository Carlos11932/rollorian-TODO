'use client';

import { useState } from 'react';
import { GroupTaskList } from '../components/group-task-list';
import { ChangeHistoryPanel } from '../components/change-history-panel';
import { MOCK_HISTORY, MOCK_USERS } from '@/dev-data/data';
import { MOCK_GROUPS } from '@/dev-data/data';
import type { ItemCardDto } from '@/interfaces/ui/item-card-dto';

const ACTIVE_GROUP = MOCK_GROUPS[0]!;

interface GruposPageProps {
  items: ItemCardDto[];
}

export function GruposPage({ items }: GruposPageProps) {
  const defaultItem = items[1] ?? items[0];
  const [selectedId, setSelectedId] = useState<string>(defaultItem?.id ?? '');
  const selectedItem = items.find((i) => i.id === selectedId) ?? defaultItem;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] px-5 pt-4 pb-4 gap-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-primary">group</span>
          <h2 className="text-sm font-semibold text-on-surface">{ACTIVE_GROUP.name}</h2>
          <span className="text-[10px] text-on-surface-variant/40 uppercase tracking-widest">
            {items.length} tareas
          </span>
        </div>

        {/* Member avatars */}
        <div className="flex -space-x-1.5">
          {MOCK_USERS.slice(0, 4).map((user) => (
            <div
              key={user.id}
              className="w-7 h-7 rounded-full border-2 border-surface flex items-center justify-center text-[10px] font-medium text-on-surface"
              style={{ backgroundColor: user.avatarColor ?? '#064e3b' }}
              title={user.name}
            >
              {user.initials}
            </div>
          ))}
          {MOCK_USERS.length > 4 && (
            <div className="w-7 h-7 rounded-full border-2 border-surface bg-[rgba(255,255,255,0.08)] flex items-center justify-center text-[10px] font-medium text-primary">
              +{MOCK_USERS.length - 4}
            </div>
          )}
        </div>
      </div>

      {/* Master-detail grid */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-4 min-h-0">
        <div className="xl:col-span-2 min-h-0">
          <GroupTaskList
            items={items}
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
