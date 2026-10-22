'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Base atomic Skeleton block with smooth shimmer gradient
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'skeleton-shimmer animate-pulse rounded-md bg-slate-200/80',
        className
      )}
      {...props}
    />
  );
}

/**
 * Skeleton for Top KPI / Metrics Cards
 */
export function SkeletonKpiCards({ count = 4 }: { count?: number }) {
  return (
    <div className={cn(
      "grid gap-2.5 sm:gap-4",
      count === 6 
        ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-6" 
        : "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4"
    )}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white p-3.5 sm:p-4 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
          <Skeleton className="h-7 sm:h-8 w-28 my-1" />
          <div className="flex items-center gap-2 mt-2">
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for standard Data Table Rows (for direct use inside <tbody>)
 */
export function SkeletonTableRows({
  rows = 5,
  columns = 6,
}: {
  rows?: number;
  columns?: number;
}) {
  const widths = ['w-24', 'w-36', 'w-20', 'w-28', 'w-16', 'w-24', 'w-18'];

  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="border-b border-slate-100/80">
          {Array.from({ length: columns }).map((_, cIdx) => (
            <td key={cIdx} className="py-3.5 px-4">
              {cIdx === 0 ? (
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-20 font-mono" />
                </div>
              ) : cIdx === columns - 1 ? (
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ) : (
                <Skeleton className={cn('h-3.5', widths[cIdx % widths.length])} />
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/**
 * Full Data Table Skeleton (Toolbar + Headers + Animated Rows)
 */
export function SkeletonTable({
  rows = 6,
  columns = 6,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col flex-1 overflow-hidden">
      {/* Table Toolbar Skeleton */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2 flex-1">
          <Skeleton className="h-9 w-60 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>

      {/* Table Header & Rows */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-[13px] text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70">
              {Array.from({ length: columns }).map((_, idx) => (
                <th key={idx} className="py-3 px-4">
                  <Skeleton className="h-3 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <SkeletonTableRows rows={rows} columns={columns} />
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
        <Skeleton className="h-4 w-36" />
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-7 w-12 rounded-md" />
          <Skeleton className="h-7 w-7 rounded-md" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for Chart / Visual Analytics Widget
 */
export function SkeletonChartCard({
  height = 'h-64',
}: {
  height?: string;
}) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-4 w-16 rounded" />
      </div>

      <div className={cn("w-full flex items-end justify-between gap-3 px-2 pt-6 pb-2", height)}>
        {Array.from({ length: 7 }).map((_, idx) => {
          const heights = ['h-32', 'h-48', 'h-24', 'h-52', 'h-40', 'h-56', 'h-36'];
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
              <Skeleton className={cn("w-full rounded-t-md", heights[idx % heights.length])} />
              <Skeleton className="h-2.5 w-8" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Skeleton for Slide-Over Drawer / Inspection Details Modal
 */
export function SkeletonDetailDrawer() {
  return (
    <div className="p-6 space-y-6">
      {/* Header section */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-3.5 w-64" />
        </div>
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>

      {/* Items list skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <div className="border border-slate-100 rounded-xl overflow-hidden">
          <div className="bg-slate-50 p-3 flex justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
          </div>
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="p-3 border-t border-slate-100 flex justify-between items-center">
              <div className="space-y-1">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-2.5 w-24" />
              </div>
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* Action footer */}
      <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Skeleton for Form Modals
 */
export function SkeletonForm({ fields = 4 }: { fields?: number }) {
  return (
    <div className="p-6 space-y-4">
      {Array.from({ length: fields }).map((_, idx) => (
        <div key={idx} className="space-y-1.5">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <div className="pt-4 flex justify-end gap-2.5">
        <Skeleton className="h-9 w-20 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
    </div>
  );
}
