'use client';

import { useQuickCapture } from './quick-capture-context';

export function Fab() {
  const { open } = useQuickCapture();

  return (
    <button
      type="button"
      onClick={open}
      aria-label="Nueva entrada"
      className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-br from-primary to-primary-container rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center text-on-primary group hover:scale-110 transition-all duration-300 z-50"
    >
      <span className="material-symbols-outlined text-3xl group-hover:rotate-90 transition-transform duration-500">
        add
      </span>
    </button>
  );
}
