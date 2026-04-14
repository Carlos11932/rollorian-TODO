'use client';

import { useEffect } from 'react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('[rollorian-todo] Unhandled error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-6 text-center">
      <div className="w-16 h-16 bg-error-container/20 rounded-full flex items-center justify-center">
        <span className="material-symbols-outlined text-error text-3xl">error_outline</span>
      </div>
      <div className="space-y-2 max-w-sm">
        <h2 className="text-xl font-bold text-on-surface">Algo fue mal</h2>
        <p className="text-sm text-on-surface-variant">
          Ha ocurrido un error inesperado. Puedes intentar recargar esta sección.
        </p>
        {error.digest && (
          <p className="text-[10px] text-on-surface-variant/40 font-mono">{error.digest}</p>
        )}
      </div>
      <button
        type="button"
        onClick={reset}
        className="flex items-center gap-2 bg-primary-container text-on-primary px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary transition-colors"
      >
        <span className="material-symbols-outlined text-sm">refresh</span>
        Intentar de nuevo
      </button>
    </div>
  );
}
