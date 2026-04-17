import type { ReactNode } from 'react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SideNavBar } from './side-nav-bar';
import { TopAppBar } from './top-app-bar';
import { MobileNav } from './mobile-nav';
import { QuickCaptureProvider } from './quick-capture-context';
import { QuickCaptureDialog } from './quick-capture-dialog';
import { KeyboardShortcuts } from './keyboard-shortcuts';
import type { GroupDto } from '@/interfaces/ui/history-entry-dto';

interface AppShellProps {
  children: ReactNode;
}

const IS_DEV = process.env.NODE_ENV !== 'production';

export async function AppShell({ children }: AppShellProps) {
  const session = await auth();
  const user = session?.user
    ? {
        name: session.user.name ?? null,
        email: session.user.email ?? '',
        image: session.user.image ?? null,
      }
    : null;

  // Fetch real groups in production; dev uses the dialog's built-in mock options
  let groups: GroupDto[] = [];
  if (!IS_DEV && session?.user?.id) {
    const memberships = await prisma.membership.findMany({
      where: { userId: session.user.id, isActive: true },
      include: { group: { select: { id: true, name: true } } },
    });
    groups = memberships.map((m) => ({ id: m.group.id, name: m.group.name }));
  }

  return (
    <QuickCaptureProvider>
      {/* Fixed left sidebar — desktop only */}
      <SideNavBar user={user} isAdmin={session?.user?.role === 'SUPERADMIN'} />

      {/* Fixed top bar — offset by sidebar width on desktop */}
      <TopAppBar />

      {/* Main canvas */}
      <main className="lg:ml-64 pt-16 min-h-screen">{children}</main>

      {/* Bottom nav — mobile only */}
      <MobileNav />

      {/* Quick capture modal — rendered at root so it overlays everything */}
      <QuickCaptureDialog groups={groups} />

      {/* Global keyboard shortcuts (Cmd+K) */}
      <KeyboardShortcuts />
    </QuickCaptureProvider>
  );
}
