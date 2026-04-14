import { RequiresAttentionCard } from '../components/requires-attention-card';
import { TodaySection } from '../components/today-section';
import { ThisWeekSection } from '../components/this-week-section';
import {
  ATTENTION_ITEMS,
  TODAY_ITEMS,
  THIS_WEEK_ITEMS,
  MOCK_STATS,
} from '@/lib/mock/data';

const WEEK_CARDS = [
  { item: THIS_WEEK_ITEMS[0]!, dayLabel: 'Mar 13' },
  { item: THIS_WEEK_ITEMS[1]!, dayLabel: 'Jue 15' },
  { item: THIS_WEEK_ITEMS[2]!, dayLabel: 'Sáb 17' },
];

export function MiVistaPage() {
  const today = new Date();
  const dateLabel = today.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] px-5 pt-4 pb-4 gap-4 overflow-hidden">
      {/* Compact page header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            {dateLabel}
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-sm text-secondary">inventory_2</span>
          <span className="font-bold text-secondary">{MOCK_STATS.undatedPending}</span>
          <span className="text-on-surface-variant/60">pendientes sin fecha</span>
        </div>
      </div>

      {/* Two-column content — fills remaining height */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        {/* Left: Today tasks */}
        <div className="lg:col-span-2 flex flex-col min-h-0">
          <TodaySection items={TODAY_ITEMS} />
        </div>

        {/* Right: Attention + This Week */}
        <div className="flex flex-col gap-4 min-h-0">
          <RequiresAttentionCard items={ATTENTION_ITEMS} />
          <ThisWeekSection cards={WEEK_CARDS} />
        </div>
      </div>
    </div>
  );
}
