'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { useQuickCapture } from './quick-capture-context';

interface NavItem {
  href: string;
  icon: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', icon: 'dashboard', label: 'Mi Vista' },
  { href: '/grupos', icon: 'group', label: 'Grupos' },
  { href: '/calendario', icon: 'calendar_today', label: 'Calendario' },
];

export function SideNavBar() {
  const pathname = usePathname();
  const { open } = useQuickCapture();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 hidden lg:flex flex-col py-6 px-4 gap-4 z-40 bg-surface-container-lowest shadow-[40px_0_40px_rgba(0,17,12,0.4)]">
      {/* App branding */}
      <div className="flex items-center gap-3 px-2 mb-6">
        <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-primary">checklist</span>
        </div>
        <div>
          <h2 className="text-lg font-black text-primary font-headline tracking-tighter leading-none">
            rollorian
          </h2>
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/60 mt-0.5">
            TODO
          </p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200 rounded-lg',
                isActive
                  ? 'bg-surface-container-high text-primary'
                  : 'text-on-surface/70 hover:bg-surface-container-high/50 hover:text-on-surface'
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
              {label}
            </Link>
          );
        })}
      </nav>

      {/* CTA */}
      <button
        type="button"
        onClick={open}
        className="bg-primary-container text-on-primary hover:bg-primary hover:text-on-primary transition-colors duration-300 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm"
      >
        <span className="material-symbols-outlined text-sm">add</span>
        Nueva entrada
      </button>

    </aside>
  );
}
