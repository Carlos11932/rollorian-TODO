import type { MockHistoryEntry } from '@/lib/mock/types';
import { cn } from '@/lib/cn';

const ICON_BG: Record<string, string> = {
  primary: 'bg-surface-bright',
  secondary: 'bg-surface-bright',
  muted: 'bg-surface-bright',
};

const ICON_COLOR: Record<string, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  muted: 'text-on-surface-variant',
};

interface TaskHistorySectionProps {
  entries: MockHistoryEntry[];
}

export function TaskHistorySection({ entries }: TaskHistorySectionProps) {
  return (
    <section className="bg-surface-container-low rounded-xl p-6">
      <h2 className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-6">
        Historial de Cambios
      </h2>

      <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-outline-variant/20">
        {entries.map((entry) => (
          <div key={entry.id} className="flex gap-4 relative">
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center z-10 border border-background shrink-0',
                ICON_BG[entry.iconColor]
              )}
            >
              <span
                className={cn('material-symbols-outlined text-[12px]', ICON_COLOR[entry.iconColor])}
              >
                {entry.icon}
              </span>
            </div>
            <div>
              <p className="text-sm text-on-surface">
                <span className="font-bold">{entry.actor.name}</span> {entry.action}{' '}
                {entry.detail && (
                  <span
                    className={cn(
                      'font-medium',
                      entry.iconColor === 'primary'
                        ? 'text-error'
                        : entry.iconColor === 'secondary'
                          ? 'text-secondary'
                          : ''
                    )}
                  >
                    {entry.detail}
                  </span>
                )}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">{entry.timestamp}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
