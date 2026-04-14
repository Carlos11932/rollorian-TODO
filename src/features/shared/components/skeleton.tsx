import { cn } from '@/lib/cn';

const VARIANTS = {
  text: 'text',
  card: 'card',
  circle: 'circle',
  task: 'task',
} as const;

type SkeletonVariant = (typeof VARIANTS)[keyof typeof VARIANTS];

interface SkeletonProps {
  variant?: SkeletonVariant;
  className?: string;
}

export function Skeleton({ variant = 'text', className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse bg-white/5 rounded',
        variant === 'text' && 'h-4 w-full',
        variant === 'card' && 'h-40 w-full rounded-xl',
        variant === 'circle' && 'h-10 w-10 rounded-full shrink-0',
        variant === 'task' && 'h-16 w-full rounded-xl',
        className
      )}
    />
  );
}

export function TaskListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant="task" />
      ))}
    </div>
  );
}

export function CardGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant="card" />
      ))}
    </div>
  );
}
