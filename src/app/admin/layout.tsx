import type { ReactNode } from 'react';
import { requireSuperAdmin, ForbiddenError } from '@/lib/auth/require-auth';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  try {
    await requireSuperAdmin();
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-4">
          <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-error text-3xl">block</span>
          </div>
          <div className="text-center">
            <h1 className="text-base font-bold text-on-surface">Acceso restringido</h1>
            <p className="text-xs text-on-surface-variant mt-1">No tienes permisos de administrador.</p>
          </div>
        </div>
      );
    }
    throw error;
  }
  return <>{children}</>;
}
