import { RequiresAttentionCard } from '../components/requires-attention-card';
import { TodaySection } from '../components/today-section';
import { ThisWeekSection } from '../components/this-week-section';
import { StatsSection } from '../components/stats-section';
import {
  ATTENTION_ITEMS,
  TODAY_ITEMS,
  THIS_WEEK_ITEMS,
  MOCK_STATS,
} from '@/lib/mock/data';

const WEEK_CARDS = [
  { item: THIS_WEEK_ITEMS[0]!, dayLabel: 'Martes 13' },
  { item: THIS_WEEK_ITEMS[1]!, dayLabel: 'Jueves 15' },
  { item: THIS_WEEK_ITEMS[2]!, dayLabel: 'Sábado 17' },
];

export function MiVistaPage() {
  return (
    <div className="px-8 lg:px-12 pt-8 pb-16 space-y-12">
      {/* Hero header */}
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h2 className="text-4xl font-extrabold tracking-tight text-on-surface font-headline">
            Mi Vista
          </h2>
          <p className="text-tertiary font-medium opacity-80">
            Bienvenidos de nuevo al Archivo, Curador.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-surface-container-low p-2 px-4 rounded-xl border border-outline-variant/10">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">
              Sin Fecha
            </span>
            <span className="text-xl font-bold text-secondary">
              {MOCK_STATS.undatedPending} Pendientes
            </span>
          </div>
          <span className="material-symbols-outlined text-secondary text-3xl">inventory_2</span>
        </div>
      </div>

      {/* Bento: Attention + Today */}
      <div className="grid grid-cols-12 gap-8">
        <RequiresAttentionCard items={ATTENTION_ITEMS} />
        <TodaySection items={TODAY_ITEMS} dateLabel="Lunes, 12 de Octubre" />
      </div>

      {/* Esta Semana */}
      <ThisWeekSection cards={WEEK_CARDS} />

      {/* Stats */}
      <StatsSection
        monthlyProgressPercent={MOCK_STATS.monthlyProgressPercent}
        totalEntries={MOCK_STATS.totalEntries}
        activeUsers={MOCK_STATS.activeUsers}
      />
    </div>
  );
}
