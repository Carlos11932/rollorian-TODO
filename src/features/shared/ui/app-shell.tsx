import type { ReactNode } from 'react';
import { SideNavBar } from './side-nav-bar';
import { TopAppBar } from './top-app-bar';
import { MobileNav } from './mobile-nav';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <>
      {/* Fixed left sidebar — desktop only */}
      <SideNavBar />

      {/* Fixed top bar — offset by sidebar width on desktop */}
      <TopAppBar />

      {/* Main canvas */}
      <main className="lg:ml-64 pt-16 min-h-screen">{children}</main>

      {/* Bottom nav — mobile only */}
      <MobileNav />
    </>
  );
}
