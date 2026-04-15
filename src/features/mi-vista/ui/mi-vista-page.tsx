import { RequiresAttentionCard } from '../components/requires-attention-card';
import { TodaySection } from '../components/today-section';
import { ThisWeekSection } from '../components/this-week-section';
import {
  getTodayViewAction,
  getRequiresAttentionAction,
  getThisWeekAction,
} from '@/features/shared/actions/view-actions';

export async function MiVistaPage() {
  const today = new Date();
  const dateLabel = today.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  const [todayResult, attentionResult, weekResult] = await Promise.all([
    getTodayViewAction(),
    getRequiresAttentionAction(),
    getThisWeekAction(),
  ]);

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
          <span className="font-bold text-secondary">{todayResult.undatedCount}</span>
          <span className="text-on-surface-variant/60">pendientes sin fecha</span>
        </div>
      </div>

      {/* Two-column content — fills remaining height */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        {/* Left: Today tasks */}
        <div className="lg:col-span-2 flex flex-col min-h-0">
          <TodaySection items={todayResult.items} />
        </div>

        {/* Right: Attention + This Week */}
        <div className="flex flex-col gap-4 min-h-0">
          <RequiresAttentionCard items={attentionResult.items} />
          <ThisWeekSection cards={weekResult.cards} />
        </div>
      </div>
    </div>
  );
}
