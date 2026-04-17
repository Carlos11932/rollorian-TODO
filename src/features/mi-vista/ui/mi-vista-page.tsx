import { RequiresAttentionCard } from '../components/requires-attention-card';
import { TodaySection } from '../components/today-section';
import { ThisWeekSection } from '../components/this-week-section';
import { StatPill } from '@/features/shared/components/stat-pill';
import { DateUtils } from '@/lib/date-utils';
import { getTodayViewAction } from '../actions/today-view-action';
import { getRequiresAttentionAction } from '../actions/requires-attention-action';
import { getThisWeekAction } from '../actions/this-week-action';

export async function MiVistaPage() {
  const dateLabel = DateUtils.formatLongDateLabel(new Date());

  const [todayResult, attentionResult, weekResult] = await Promise.all([
    getTodayViewAction(),
    getRequiresAttentionAction(),
    getThisWeekAction(),
  ]);

  const { stats } = todayResult;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] px-5 pt-4 pb-4 gap-4 overflow-hidden">
      {/* Header + stats bar */}
      <div className="flex flex-col gap-2 shrink-0">
        <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
          {dateLabel}
        </h2>

        {/* Stats strip */}
        <div className="flex items-center gap-1 flex-wrap">
          <StatPill icon="checklist" value={stats.totalCount} label="en total" color="text-on-surface-variant" />
          <span className="text-outline-variant/30 text-xs">·</span>
          <StatPill icon="emergency" value={stats.urgentCount} label="urgentes" color="text-error" />
          <span className="text-outline-variant/30 text-xs">·</span>
          <StatPill icon="inventory_2" value={stats.undatedCount} label="sin fecha" color="text-secondary" />
          <span className="text-outline-variant/30 text-xs">·</span>
          <StatPill icon="person_off" value={stats.unassignedGroupCount} label="sin asignar en grupo" color="text-on-surface-variant/60" />
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
