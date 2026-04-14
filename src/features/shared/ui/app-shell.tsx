import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
        <header className="mb-10 border-b border-line pb-4">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted">
              Rollorian
            </p>
            <h1 className="text-xl font-semibold">TODO foundation shell</h1>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
