import { CardGridSkeleton, TaskListSkeleton, Skeleton } from '@/features/shared/components/skeleton';

export default function Loading() {
  return (
    <div className="px-8 lg:px-12 pt-8 pb-16 space-y-12 animate-pulse">
      {/* Hero header */}
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-16 w-48 rounded-xl" />
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-4">
          <Skeleton className="h-64 rounded-xl" />
        </div>
        <div className="col-span-12 lg:col-span-8">
          <TaskListSkeleton count={3} />
        </div>
      </div>

      {/* This week */}
      <CardGridSkeleton count={3} />

      {/* Stats */}
      <div className="flex flex-col md:flex-row gap-6">
        <Skeleton className="flex-1 h-36 rounded-2xl" />
        <Skeleton className="w-full md:w-80 h-36 rounded-2xl" />
      </div>
    </div>
  );
}
