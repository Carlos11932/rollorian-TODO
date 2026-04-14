import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 px-6 py-12 text-center rounded-xl border border-outline-variant/10 bg-surface-container-low',
        className
      )}
    >
      {icon && (
        <span className="material-symbols-outlined text-4xl text-on-surface-variant" aria-hidden="true">
          {icon}
        </span>
      )}
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-bold text-on-surface">{title}</h3>
        {description && <p className="text-sm text-on-surface-variant max-w-xs">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
