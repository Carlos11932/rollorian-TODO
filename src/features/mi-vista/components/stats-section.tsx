interface StatsSectionProps {
  monthlyProgressPercent: number;
  totalEntries: number;
  activeUsers: number;
}

export function StatsSection({
  monthlyProgressPercent,
  totalEntries,
  activeUsers,
}: StatsSectionProps) {
  return (
    <section className="flex flex-col md:flex-row gap-6">
      {/* Progress card */}
      <div className="flex-1 bg-gradient-to-br from-primary-container to-surface rounded-2xl relative overflow-hidden flex items-center justify-between p-8">
        <div className="relative z-10 space-y-2">
          <h3 className="text-2xl font-bold text-on-surface">Resumen de Curaduría</h3>
          <p className="text-on-surface/70 max-w-md text-sm leading-relaxed">
            Has completado el {monthlyProgressPercent}% de tus objetivos mensuales. El archivo está
            operando con eficiencia óptima.
          </p>
        </div>
        <div className="relative z-10 h-24 w-24 shrink-0 flex items-center justify-center border-4 border-primary rounded-full">
          <span className="text-2xl font-black text-primary">{monthlyProgressPercent}%</span>
        </div>
        {/* Decorative icon */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
          <span className="material-symbols-outlined text-[180px]">auto_awesome</span>
        </div>
      </div>

      {/* Stats card */}
      <div className="w-full md:w-80 shrink-0 bg-surface-container p-8 rounded-2xl border border-outline-variant/10 flex flex-col justify-center gap-4">
        <div className="flex items-center justify-between">
          <span className="text-on-surface-variant font-medium text-sm">Entradas Totales</span>
          <span className="text-secondary font-bold">{totalEntries.toLocaleString('es-ES')}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-on-surface-variant font-medium text-sm">Usuarios Activos</span>
          <span className="text-primary font-bold">{activeUsers}</span>
        </div>
        <div className="h-px bg-outline-variant/10 w-full" />
        <button
          type="button"
          className="w-full py-2 bg-surface-container-highest hover:bg-surface-bright transition-colors rounded-lg text-sm font-bold flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">analytics</span>
          Reporte Detallado
        </button>
      </div>
    </section>
  );
}
