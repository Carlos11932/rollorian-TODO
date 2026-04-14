import { Skeleton } from '@/features/shared/components/skeleton';

export default function Loading() {
  return (
    <div className="px-8 lg:px-12 pt-8 pb-16 max-w-7xl mx-auto space-y-8 animate-pulse">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-56 rounded-full" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <Skeleton className="h-[520px] rounded-xl" />
        </div>
        <div className="lg:col-span-4">
          <Skeleton className="h-[520px] rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
