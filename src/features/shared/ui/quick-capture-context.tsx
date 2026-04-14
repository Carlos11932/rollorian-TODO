'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface QuickCaptureContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const QuickCaptureContext = createContext<QuickCaptureContextValue | null>(null);

export function useQuickCapture(): QuickCaptureContextValue {
  const ctx = useContext(QuickCaptureContext);
  if (!ctx) throw new Error('useQuickCapture must be used inside QuickCaptureProvider');
  return ctx;
}

interface QuickCaptureProviderProps {
  children: ReactNode;
}

export function QuickCaptureProvider({ children }: QuickCaptureProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <QuickCaptureContext.Provider value={{ isOpen, open, close }}>
      {children}
    </QuickCaptureContext.Provider>
  );
}
