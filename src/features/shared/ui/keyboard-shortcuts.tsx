'use client';

import { useEffect } from 'react';
import { useQuickCapture } from './quick-capture-context';

export function KeyboardShortcuts() {
  const { open } = useQuickCapture();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Cmd+K (Mac) / Ctrl+K (Win/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        open();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return null;
}
