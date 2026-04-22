'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

const NAV_ITEMS = [
  { href: '/', icon: 'dashboard', label: 'Mi Vista' },
  { href: '/grupos', icon: 'group', label: 'Grupos' },
  { href: '/calendario', icon: 'calendar_today', label: 'Calendario' },
  { href: '/settings', icon: 'settings', label: 'Ajustes' },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 w-full h-16 bg-surface-container-low/90 backdrop-blur-xl border-t border-[rgba(255,255,255,0.05)] flex justify-around items-center px-4 z-50 pb-[env(safe-area-inset-bottom)]">
      {NAV_ITEMS.map(({ href, icon, label }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-1 transition-colors',
              isActive ? 'text-primary' : 'text-on-surface/60'
            )}
          >
            <span
              className="material-symbols-outlined"
              style={
                isActive
                  ? { fontVariationSettings: "'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 24" }
                  : undefined
              }
            >
              {icon}
            </span>
            <span className={cn('text-[10px]', isActive ? 'font-bold' : 'font-medium')}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
