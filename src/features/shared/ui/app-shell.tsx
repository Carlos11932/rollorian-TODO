import type { ReactNode } from 'react';
import { SideNavBar } from './side-nav-bar';
import { TopAppBar } from './top-app-bar';
import { MobileNav } from './mobile-nav';
import { QuickCaptureProvider } from './quick-capture-context';
import { QuickCaptureDialog } from './quick-capture-dialog';
import { KeyboardShortcuts } from './keyboard-shortcuts';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <QuickCaptureProvider>
      {/* Fixed left sidebar — desktop only */}
      <SideNavBar />

      {/* Fixed top bar — offset by sidebar width on desktop */}
      <TopAppBar />

      {/* Main canvas */}
      <main className="lg:ml-64 pt-16 min-h-screen">{children}</main>

      {/* Bottom nav — mobile only */}
      <MobileNav />

      {/* Quick capture modal — rendered at root so it overlays everything */}
      <QuickCaptureDialog />

      {/* Global keyboard shortcuts (Cmd+K) */}
      <KeyboardShortcuts />
    </QuickCaptureProvider>
  );
}
