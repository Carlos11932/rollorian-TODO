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
    <header className="fixed top-0 right-0 left-0 lg:left-64 z-50 bg-surface-container-low/80 backdrop-blur-xl border-b border-[rgba(255,255,255,0.05)] flex items-center justify-between px-6 h-14">
      <h1 className="text-sm font-medium text-on-surface-variant tracking-wide">
        {getSectionTitle(pathname)}
      </h1>

      <div className="hidden lg:flex items-center gap-2">
        <button
          type="button"
          onClick={open}
          className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-md text-sm font-medium hover:bg-primary/15 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Nueva entrada
        </button>
      </div>
    </header>
  );
}
