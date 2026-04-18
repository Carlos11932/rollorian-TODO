'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import type { MockHistoryEntry } from '@/dev-data/types';

const ICON_COLOR_CLASS: Record<string, string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  muted: 'bg-[rgba(255,255,255,0.08)]',
};

const ICON_TEXT_CLASS: Record<string, string> = {
  primary: 'text-on-primary',
  secondary: 'text-on-secondary',
  muted: 'text-on-surface-variant',
};

interface ChangeHistoryPanelProps {
  entries: MockHistoryEntry[];
  taskTitle: string;
}

export function ChangeHistoryPanel({ entries, taskTitle }: ChangeHistoryPanelProps) {
  const [localEntries, setLocalEntries] = useState<MockHistoryEntry[]>(entries);
  const [comment, setComment] = useState('');

  function submitComment() {
    const trimmed = comment.trim();
    if (!trimmed) return;
    const newEntry: MockHistoryEntry = {
      id: `local-${Date.now()}`,
      actor: { id: 'me', name: 'Tú', initials: 'YO' },
      action: trimmed,
      timestamp: 'Ahora',
      icon: 'chat',
      iconColor: 'primary',
    };
    setLocalEntries((prev) => [newEntry, ...prev]);
    setComment('');
  }

  return (
    <div className="xl:col-span-4">
      <div className="bg-[rgba(255,255,255,0.02)] rounded-lg overflow-hidden flex flex-col h-full border border-[rgba(255,255,255,0.05)]">
        {/* Header */}
        <div className="px-4 py-2.5 bg-[rgba(255,255,255,0.03)] border-b border-[rgba(255,255,255,0.05)] shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-primary">history</span>
            <span className="text-xs font-medium uppercase tracking-widest text-on-surface-variant/60">
              Historial
            </span>
          </div>
          <p className="text-[11px] text-on-surface-variant/60 mt-0.5 truncate">
            <span className="text-primary font-medium">{taskTitle}</span>
          </p>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 relative hide-scrollbar">
          <div className="absolute left-9 top-10 bottom-10 w-0.5 bg-[rgba(255,255,255,0.05)]" />

          {localEntries.map((entry) => (
            <div key={entry.id} className="relative flex gap-4">
              <div
                className={cn(
                  'z-10 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-[#0a0a0c] shrink-0',
                  ICON_COLOR_CLASS[entry.iconColor]
                )}
              >
                <span
                  className={cn(
                    'material-symbols-outlined text-[12px]',
                    ICON_TEXT_CLASS[entry.iconColor]
                  )}
                  style={{ fontVariationSettings: "'wght' 700" }}
                >
                  {entry.icon}
                </span>
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-primary">{entry.actor.name}</span>
                  <span className="text-[10px] text-on-surface-variant opacity-60">
                    {entry.timestamp}
                  </span>
                </div>
                <p className="text-sm text-tertiary mt-1">
                  {entry.action}{' '}
                  {entry.detail && (
                    <span
                      className={
                        entry.iconColor === 'primary'
                          ? 'text-primary'
                          : entry.iconColor === 'secondary'
                            ? 'text-secondary'
                            : 'italic underline decoration-primary/30'
                      }
                    >
                      {entry.detail}
                    </span>
                  )}
                  .
                </p>
                {entry.comment && (
                  <div className="mt-2 text-[11px] text-on-surface-variant bg-[rgba(255,255,255,0.02)] p-2 rounded-md italic border border-[rgba(255,255,255,0.05)]">
                    &ldquo;{entry.comment}&rdquo;
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Comment input */}
        <div className="p-4 bg-[rgba(255,255,255,0.02)] border-t border-[rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitComment()}
              placeholder="Añadir comentario al historial..."
              className="flex-1 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-md text-xs py-2 px-3 focus:border-primary/40 outline-none text-on-surface placeholder:text-on-surface-variant/40"
            />
            <button
              type="button"
              onClick={submitComment}
              className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-on-primary hover:bg-primary-fixed transition-colors shrink-0"
              aria-label="Enviar comentario"
            >
              <span className="material-symbols-outlined text-sm">send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
