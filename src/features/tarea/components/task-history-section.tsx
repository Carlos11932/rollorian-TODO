import type { HistoryEntryDto } from '@/interfaces/ui/history-entry-dto';
import { cn } from '@/lib/cn';

const ICON_BG: Record<string, string> = {
  primary: 'bg-[rgba(255,255,255,0.05)]',
  secondary: 'bg-[rgba(255,255,255,0.05)]',
  muted: 'bg-[rgba(255,255,255,0.05)]',
};

const ICON_COLOR: Record<string, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  muted: 'text-on-surface-variant',
};

interface TaskHistorySectionProps {
  entries: HistoryEntryDto[];
}

export function TaskHistorySection({ entries }: TaskHistorySectionProps) {
  if (entries.length === 0) {
    return (
      <section className="bg-[rgba(255,255,255,0.02)] rounded-lg border border-[rgba(255,255,255,0.05)] p-4 shrink-0">
        <h2 className="text-[10px] font-medium uppercase tracking-widest text-on-surface-variant/50 mb-3">
          Historial
        </h2>
        <p className="text-xs text-on-surface-variant/60">Sin cambios registrados aún.</p>
      </section>
    );
  }

  return (
    <section className="bg-surface-container-low rounded-xl p-4 shrink-0">
      <h2 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
        Historial
      </h2>

      <div className="space-y-3 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-[rgba(255,255,255,0.05)]">
        {entries.map((entry) => (
          <div key={entry.id} className="flex gap-3 relative">
            <div
              className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center z-10 border border-surface shrink-0',
                ICON_BG[entry.iconColor]
              )}
            >
              <span
                className={cn('material-symbols-outlined text-[10px]', ICON_COLOR[entry.iconColor])}
              >
                {entry.icon}
              </span>
            </div>
            <div>
              <p className="text-xs text-on-surface leading-relaxed">
                <span className="font-medium">{entry.actor.name}</span>{' '}
                {entry.action}{' '}
                {entry.detail && (
                  <span
                    className={cn(
                      'font-medium',
                      entry.iconColor === 'primary'
                        ? 'text-primary'
                        : entry.iconColor === 'secondary'
                          ? 'text-secondary'
                          : ''
                    )}
                  >
                    {entry.detail}
                  </span>
                )}
              </p>
              <p className="text-[10px] text-on-surface-variant/60 mt-0.5">{entry.timestamp}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
