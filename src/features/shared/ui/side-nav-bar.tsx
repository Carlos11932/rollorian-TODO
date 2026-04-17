'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { signOut } from 'next-auth/react';

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

interface SideNavBarUser {
  name: string | null;
  email: string;
  image: string | null;
}

interface SideNavBarProps {
  user: SideNavBarUser | null;
}

function UserAvatar({ image, name }: { image: string | null; name: string | null }) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt={name ?? ''} className="w-8 h-8 rounded-full object-cover" />;
  }
  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?';
  return (
    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-medium text-primary">
      {initials}
    </div>
  );
}

export function SideNavBar({ user }: SideNavBarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 hidden lg:flex flex-col py-6 px-4 gap-4 z-40 bg-surface-container-low border-r border-outline-variant/60">
      {/* App branding */}
      <div className="flex items-center gap-3 px-2 mb-6">
        <div className="w-9 h-9 bg-primary/10 rounded-md flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-primary text-xl">checklist</span>
        </div>
        <div>
          <h2 className="text-base font-semibold text-on-surface font-headline tracking-tight leading-none">
            rollorian
          </h2>
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/50 mt-0.5">
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
                'group/link flex items-center gap-3 px-3 py-2 text-sm font-medium transition-all duration-150 rounded-md',
                isActive
                  ? 'bg-[rgba(255,255,255,0.05)] text-on-surface'
                  : 'text-on-surface-variant hover:bg-[rgba(255,255,255,0.03)] hover:text-on-surface'
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

      {/* User section */}
      {user && (
        <div className="border-t border-[rgba(255,255,255,0.05)] pt-4 flex items-center gap-3 px-1">
          <UserAvatar image={user.image} name={user.name} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-on-surface truncate">{user.name ?? user.email}</p>
            <p className="text-[10px] text-on-surface-variant/40 truncate">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            title="Cerrar sesión"
            className="text-on-surface-variant/30 hover:text-error transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
          </button>
        </div>
      )}
    </aside>
  );
}
