'use client';

import { useQuickCapture } from './quick-capture-context';

export function Fab() {
  const { open } = useQuickCapture();

  return (
    <button
      type="button"
      onClick={open}
      aria-label="Nueva entrada"
      className="lg:hidden fixed bottom-24 right-6 w-14 h-14 bg-primary rounded-full shadow-lg shadow-primary/20 flex items-center justify-center text-on-primary group hover:scale-105 transition-all duration-200 z-50"
    >
      <span className="material-symbols-outlined text-3xl group-hover:rotate-90 transition-transform duration-300">
        add
      </span>
    </button>
  );
}
