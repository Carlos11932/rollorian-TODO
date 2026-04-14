'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { useQuickCapture } from './quick-capture-context';
import type { ItemType } from '@/domain/shared/item-type';
import type { Priority } from '@/domain/shared/priority';

const TYPE_OPTIONS: { value: ItemType; label: string; icon: string }[] = [
  { value: 'task', label: 'Tarea', icon: 'check_circle' },
  { value: 'event', label: 'Evento', icon: 'event' },
];

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: 'low', label: 'Baja', color: 'text-on-surface-variant' },
  { value: 'medium', label: 'Media', color: 'text-primary' },
  { value: 'high', label: 'Alta', color: 'text-secondary' },
  { value: 'urgent', label: 'Crítica', color: 'text-error' },
];

export function QuickCaptureDialog() {
  const { isOpen, close } = useQuickCapture();
  const [title, setTitle] = useState('');
  const [itemType, setItemType] = useState<ItemType>('task');
  const [priority, setPriority] = useState<Priority>('medium');
  const [date, setDate] = useState('');

  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setTitle('');
      setItemType('task');
      setPriority('medium');
      setDate('');
    }
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, close]);

  // Outside click to close
  useEffect(() => {
    if (!isOpen) return;
    function onClick(e: MouseEvent) {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) close();
    }
    const timer = setTimeout(() => document.addEventListener('mousedown', onClick), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', onClick);
    };
  }, [isOpen, close]);

  function handleSubmit() {
    if (!title.trim()) return;
    // TODO: connect to POST /items when backend is ready
    console.log('New item:', { title: title.trim(), itemType, priority, date: date || undefined });
    close();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-label="Captura rápida"
        aria-modal="true"
        className="w-full max-w-lg mx-4 bg-surface-container-low rounded-2xl border border-outline-variant/20 shadow-2xl shadow-black/40 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-outline-variant/10">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">bolt</span>
            <h2 className="text-base font-bold text-on-surface font-headline">Nueva entrada</h2>
          </div>
          <button
            type="button"
            onClick={close}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Title input */}
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
            placeholder="¿Qué necesitas hacer?"
            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/50 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
          />

          {/* Type + Priority row */}
          <div className="flex items-center gap-4">
            {/* Type toggle */}
            <div className="flex items-center gap-1 bg-surface-container-lowest rounded-xl p-1 border border-outline-variant/10">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setItemType(opt.value)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    itemType === opt.value
                      ? 'bg-primary-container text-on-primary-container font-bold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  )}
                >
                  <span className="material-symbols-outlined text-sm">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Priority */}
            <div className="flex items-center gap-1">
              {PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPriority(opt.value)}
                  title={opt.label}
                  className={cn(
                    'w-7 h-7 rounded-lg text-[10px] font-bold uppercase transition-all border',
                    priority === opt.value
                      ? `${opt.color} bg-surface-container-highest border-current`
                      : 'text-on-surface-variant/40 border-transparent hover:border-outline-variant/30'
                  )}
                >
                  {opt.label[0]}
                </button>
              ))}
              <span className="text-[10px] text-on-surface-variant ml-1">prioridad</span>
            </div>
          </div>

          {/* Optional date */}
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-sm text-on-surface-variant">calendar_today</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent border-none text-sm text-on-surface-variant focus:text-on-surface outline-none cursor-pointer [color-scheme:dark]"
            />
            {!date && (
              <span className="text-xs text-on-surface-variant/50 -ml-2">Sin fecha</span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 pb-5 pt-1">
          <p className="text-[11px] text-on-surface-variant/50">
            <kbd className="font-sans">Enter</kbd> para guardar · <kbd className="font-sans">Esc</kbd> para cerrar
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={close}
              className="text-sm text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!title.trim()}
              className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary-fixed transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
