import { Skeleton, SkeletonKpiCards, SkeletonTable } from '@/components/ui/Skeleton';

export default function RootLoading() {
  return (
    <div className="p-3 sm:p-4 pt-16 md:p-8 max-w-[1400px] mx-auto flex flex-col gap-4 font-sans animate-in fade-in duration-200">
      {/* Top Header Placeholder */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-slate-100">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-3.5 w-72" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      {/* 4 Core KPI Cards */}
      <SkeletonKpiCards count={4} />

      {/* Main Table Grid Skeleton */}
      <SkeletonTable rows={7} columns={6} />
    </div>
  );
}
