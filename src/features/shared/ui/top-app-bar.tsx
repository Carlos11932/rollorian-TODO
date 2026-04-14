'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { useQuickCapture } from './quick-capture-context';

interface TopNavItem {
  href: string;
  label: string;
}

const TOP_NAV_ITEMS: TopNavItem[] = [
  { href: '/', label: 'Mi Vista' },
  { href: '/proyectos', label: 'Proyectos' },
  { href: '/archivo', label: 'Archivo' },
];

export function TopAppBar() {
  const pathname = usePathname();
  const { open } = useQuickCapture();

  return (
    <header className="fixed top-0 right-0 left-64 z-50 bg-surface-container-lowest/80 backdrop-blur-xl shadow-2xl shadow-surface-container-lowest/40 flex justify-between items-center px-8 h-16">
      {/* Left: brand + sub-nav */}
      <div className="flex items-center gap-8">
        <h1 className="text-2xl font-bold tracking-tighter text-primary font-headline">
          rollorian
        </h1>
        <nav className="hidden md:flex gap-6">
          {TOP_NAV_ITEMS.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'text-sm py-1 transition-colors duration-300',
                  isActive
                    ? 'text-primary font-bold border-b-2 border-primary'
                    : 'text-on-surface/60 hover:text-on-surface font-medium'
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right: search + actions */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={open}
          className="relative flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/20 rounded-full py-1.5 pl-3 pr-4 text-sm text-on-surface-variant/60 hover:border-outline-variant/50 hover:text-on-surface-variant transition-all duration-200 w-52"
          aria-label="Buscar o crear entrada (⌘K)"
        >
          <span className="material-symbols-outlined text-sm">search</span>
          <span className="flex-1 text-left text-sm">Buscar registros...</span>
          <kbd className="hidden md:inline text-[10px] font-sans bg-surface-container-high px-1.5 py-0.5 rounded text-on-surface-variant/40 border border-outline-variant/20">
            ⌘K
          </kbd>
        </button>
        <div className="flex gap-1">
          <button
            type="button"
            className="p-2 text-on-surface/60 hover:text-on-surface transition-colors duration-300 rounded-lg hover:bg-surface-container-high/50"
            aria-label="Notificaciones"
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button
            type="button"
            className="p-2 text-on-surface/60 hover:text-on-surface transition-colors duration-300 rounded-lg hover:bg-surface-container-high/50"
            aria-label="Configuración"
          >
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
      </div>
    </header>
  );
}
