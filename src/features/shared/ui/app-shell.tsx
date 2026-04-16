import type { ReactNode } from 'react';
import { auth } from '@/lib/auth';
import { SideNavBar } from './side-nav-bar';
import { TopAppBar } from './top-app-bar';
import { MobileNav } from './mobile-nav';
import { QuickCaptureProvider } from './quick-capture-context';
import { QuickCaptureDialog } from './quick-capture-dialog';
import { KeyboardShortcuts } from './keyboard-shortcuts';

interface AppShellProps {
  children: ReactNode;
}

export async function AppShell({ children }: AppShellProps) {
  const session = await auth();
  const user = session?.user
    ? {
        name: session.user.name ?? null,
        email: session.user.email ?? '',
        image: session.user.image ?? null,
      }
    : null;

  return (
    <QuickCaptureProvider>
      {/* Fixed left sidebar — desktop only */}
      <SideNavBar user={user} />

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
