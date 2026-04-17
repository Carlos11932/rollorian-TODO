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
  isAdmin?: boolean;
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
    <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-[11px] font-bold text-primary">
      {initials}
    </div>
  );
}

export function SideNavBar({ user, isAdmin }: SideNavBarProps) {
  const pathname = usePathname();

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

        {isAdmin && (
          <>
            <div className="my-1 border-t border-outline-variant/10" />
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200 rounded-lg',
                pathname === '/admin'
                  ? 'bg-surface-container-high text-primary'
                  : 'text-on-surface/70 hover:bg-surface-container-high/50 hover:text-on-surface'
              )}
            >
              <span
                className="material-symbols-outlined"
                style={
                  pathname === '/admin'
                    ? { fontVariationSettings: "'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 24" }
                    : undefined
                }
              >
                admin_panel_settings
              </span>
              Admin
            </Link>
          </>
        )}
      </nav>

      {/* User section */}
      {user && (
        <div className="border-t border-outline-variant/10 pt-4 flex items-center gap-3 px-1">
          <UserAvatar image={user.image} name={user.name} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-on-surface truncate">{user.name ?? user.email}</p>
            <p className="text-[10px] text-on-surface-variant/50 truncate">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            title="Cerrar sesión"
            className="text-on-surface-variant/40 hover:text-error transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
          </button>
        </div>
      )}
    </aside>
  );
}
