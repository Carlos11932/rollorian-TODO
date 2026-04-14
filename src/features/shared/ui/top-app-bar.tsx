'use client';

import { usePathname } from 'next/navigation';
import { useQuickCapture } from './quick-capture-context';

const SECTION_TITLES: Record<string, string> = {
  '/': 'Mi Vista',
  '/grupos': 'Grupos',
  '/calendario': 'Calendario',
};

function getSectionTitle(pathname: string): string {
  if (pathname.startsWith('/tareas/')) return 'Detalle de tarea';
  return SECTION_TITLES[pathname] ?? 'rollorian';
}

export function TopAppBar() {
  const pathname = usePathname();
  const { open } = useQuickCapture();

  return (
    <header className="fixed top-0 right-0 left-64 z-50 bg-surface-container-lowest/80 backdrop-blur-xl shadow-2xl shadow-surface-container-lowest/40 flex items-center justify-between px-6 h-16">
      {/* Left: current section title */}
      <h1 className="text-sm font-semibold text-on-surface-variant tracking-wide">
        {getSectionTitle(pathname)}
      </h1>

      {/* Right: new entry + actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={open}
          className="flex items-center gap-2 bg-primary text-on-primary px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-primary-fixed transition-colors"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Nueva entrada
        </button>

        <button
          type="button"
          className="p-2 text-on-surface/60 hover:text-on-surface transition-colors rounded-lg hover:bg-surface-container-high/50"
          aria-label="Notificaciones"
        >
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button
          type="button"
          className="p-2 text-on-surface/60 hover:text-on-surface transition-colors rounded-lg hover:bg-surface-container-high/50"
          aria-label="Configuración"
        >
          <span className="material-symbols-outlined">settings</span>
        </button>
      </div>
    </header>
  );
}
