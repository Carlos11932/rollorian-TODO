'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

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
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar registros..."
            className="bg-surface-container-lowest border border-outline-variant/20 rounded-full py-1.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary w-48 focus:w-64 transition-all duration-300 outline-none text-on-surface placeholder:text-on-surface-variant/60"
          />
        </div>
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
