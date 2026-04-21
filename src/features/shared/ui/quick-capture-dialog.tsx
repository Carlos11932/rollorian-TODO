'use client';

import { useEffect, useEffectEvent, useRef, useState, useTransition } from 'react';
import { cn } from '@/lib/cn';
import { useQuickCapture } from './quick-capture-context';
import { createItemAction, type SpaceTarget } from '../actions/item-actions';
import type { ItemType } from '@/domain/shared/item-type';
import type { Priority } from '@/domain/shared/priority';
import type { GroupDto } from '@/interfaces/ui/history-entry-dto';

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

// Dev fallback options — only used when no real groups are passed
const DEV_SPACE_OPTIONS: { value: SpaceTarget; label: string; icon: string }[] = [
  { value: 'personal', label: 'Mi Vista', icon: 'person' },
  { value: 'group-1', label: 'Equipo Alpha', icon: 'group' },
  { value: 'group-2', label: 'Producto', icon: 'group' },
];

interface QuickCaptureDialogProps {
  groups?: GroupDto[];
}

export function QuickCaptureDialog({ groups = [] }: QuickCaptureDialogProps) {
  const { isOpen, close } = useQuickCapture();
  const [title, setTitle] = useState('');
  const [itemType, setItemType] = useState<ItemType>('task');
  const [priority, setPriority] = useState<Priority>('medium');
  const [date, setDate] = useState('');
  const [spaceTarget, setSpaceTarget] = useState<SpaceTarget>('personal');
  const [isPending, startTransition] = useTransition();

  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function resetForm() {
    setTitle('');
    setItemType('task');
    setPriority('medium');
    setDate('');
    setSpaceTarget('personal');
  }

  function closeDialog() {
    resetForm();
    close();
  }

  const handleEffectClose = useEffectEvent(() => {
    closeDialog();
  });

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleEffectClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function onClick(e: MouseEvent) {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) handleEffectClose();
    }
    const timer = setTimeout(() => document.addEventListener('mousedown', onClick), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', onClick);
    };
  }, [isOpen]);

  function handleSubmit() {
    if (!title.trim() || isPending) return;
    startTransition(async () => {
      await createItemAction({
        title: title.trim(),
        itemType,
        priority,
        date: date || undefined,
        spaceTarget,
      });
      closeDialog();
    });
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-label="Captura rápida"
        aria-modal="true"
        className="w-full max-w-lg mx-4 bg-surface-container rounded-xl border border-[rgba(255,255,255,0.08)] shadow-2xl shadow-black/60 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">bolt</span>
            <h2 className="text-base font-semibold text-on-surface">Nueva entrada</h2>
          </div>
          <button
            type="button"
            onClick={closeDialog}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Title input */}
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
            placeholder="¿Qué necesitas hacer?"
            className="w-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-md px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:border-primary/40 outline-none transition-all"
          />

          {/* Space selector */}
          <div>
            <p className="text-[10px] font-medium uppercase tracking-widest text-on-surface-variant/50 mb-2">
              Dónde
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(groups.length > 0
                ? [
                    { value: 'personal' as SpaceTarget, label: 'Mi Vista', icon: 'person' },
                    ...groups.map((g) => ({ value: g.id as SpaceTarget, label: g.name, icon: 'group' })),
                  ]
                : DEV_SPACE_OPTIONS
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSpaceTarget(opt.value)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all border',
                    spaceTarget === opt.value
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'text-on-surface-variant border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] hover:text-on-surface'
                  )}
                >
                  <span className="material-symbols-outlined text-sm">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Type + Priority row */}
          <div className="flex items-center gap-4">
            {/* Type toggle */}
            <div className="flex items-center gap-1 bg-[rgba(255,255,255,0.02)] rounded-md p-1 border border-[rgba(255,255,255,0.05)]">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setItemType(opt.value)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                    itemType === opt.value
                      ? 'bg-[rgba(255,255,255,0.05)] text-on-surface'
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
                    'w-7 h-7 rounded-md text-[10px] font-medium uppercase transition-all border',
                    priority === opt.value
                      ? `${opt.color} bg-[rgba(255,255,255,0.05)] border-current`
                      : 'text-on-surface-variant/30 border-transparent hover:border-[rgba(255,255,255,0.08)]'
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
            <kbd className="font-sans">Enter</kbd> guardar · <kbd className="font-sans">Esc</kbd> cerrar
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={closeDialog}
              className="text-sm text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!title.trim() || isPending}
              className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-fixed transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-sm">
                {isPending ? 'sync' : 'add'}
              </span>
              {isPending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
