'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import type { MockHistoryEntry } from '@/lib/mock/types';

const ICON_COLOR_CLASS: Record<string, string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  muted: 'bg-surface-container-highest',
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
  const [comment, setComment] = useState('');

  return (
    <div className="xl:col-span-4">
      <div className="bg-surface-container-low rounded-2xl overflow-hidden flex flex-col h-[600px] border border-outline-variant/10">
        {/* Header */}
        <div className="p-6 bg-surface-container-high border-b border-outline-variant/10">
          <h3 className="text-lg font-bold text-on-surface tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">history</span>
            Historial de Cambios
          </h3>
          <p className="text-xs text-on-surface-variant mt-2">
            Actividad reciente para:{' '}
            <span className="text-primary font-medium italic">{taskTitle}</span>
          </p>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 relative hide-scrollbar">
          <div className="absolute left-9 top-10 bottom-10 w-0.5 bg-outline-variant/20" />

          {entries.map((entry) => (
            <div key={entry.id} className="relative flex gap-4">
              <div
                className={cn(
                  'z-10 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-surface-container-low shrink-0',
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
                  <span className="text-xs font-bold text-primary">{entry.actor.name}</span>
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
                  <div className="mt-2 text-[11px] text-on-surface-variant bg-surface-container-lowest p-2 rounded-lg italic">
                    "{entry.comment}"
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Comment input */}
        <div className="p-4 bg-surface-container-highest/50">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Añadir comentario al historial..."
              className="flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-xs py-2 px-3 focus:ring-1 focus:ring-primary outline-none text-on-surface placeholder:text-on-surface-variant/60"
            />
            <button
              type="button"
              className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-on-primary hover:bg-primary-fixed transition-colors shrink-0"
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
