import { Skeleton, TaskListSkeleton } from '@/features/shared/components/skeleton';

export default function Loading() {
  return (
    <div className="px-8 lg:px-12 pt-8 pb-16 space-y-8 animate-pulse">
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-3">
          <Skeleton className="h-9 w-40 rounded-full" />
          <Skeleton className="h-9 w-36 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8">
          <TaskListSkeleton count={4} />
        </div>
        <div className="xl:col-span-4">
          <Skeleton className="h-[600px] rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
