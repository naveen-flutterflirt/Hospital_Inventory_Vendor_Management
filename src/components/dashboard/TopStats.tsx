'use client';

import { ArrowDown } from 'lucide-react';
import { DashboardTopStats } from '@/lib/api';
import { cn } from '@/lib/utils';
import { SkeletonKpiCards } from '@/components/ui/Skeleton';

interface TopStatsProps {
  stats?: DashboardTopStats;
  loading?: boolean;
}

export default function TopStats({ stats, loading = false }: TopStatsProps) {
  if (loading) {
    return <SkeletonKpiCards count={6} />;
  }

  const stockValue = stats?.stockValue || { label: 'Stock value', value: '₹3.42Cr', sub: '8,214 SKUs · 14 stores' };
  const daysOfStock = stats?.daysOfStock || { label: 'Days of stock', value: '31', sub: '↓ 4 d vs last month', downTrend: true };
  const belowReorder = stats?.belowReorder || { label: 'Below reorder', value: '47', sub: '6 vital items', alert: true };
  const nearExpiry = stats?.nearExpiry || { label: 'Near expiry · 90 d', value: '₹6.8L', sub: '212 batches', alert: true };
  const openPOs = stats?.openPOs || { label: 'Open POs', value: '63', sub: '9 overdue delivery', alert: true };
  const payablesDue = stats?.payablesDue || { label: 'Payables due · 7 d', value: '₹41.6L', sub: '38 invoices matched' };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-4">
      {/* 1. Stock Value */}
      <div className="bg-white p-3 sm:p-4 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="text-[11px] sm:text-[13px] text-slate-500 mb-1 truncate">{stockValue.label}</div>
        <div className="text-lg sm:text-[24px] lg:text-[26px] font-bold text-slate-800 leading-tight mb-1 truncate">
          {stockValue.value}
        </div>
        <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">{stockValue.sub}</div>
      </div>
      
      {/* 2. Days of Stock */}
      <div className="bg-white p-3 sm:p-4 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="text-[11px] sm:text-[13px] text-slate-500 mb-1 truncate">{daysOfStock.label}</div>
        <div className="text-lg sm:text-[24px] lg:text-[26px] font-bold text-slate-800 leading-tight mb-1 truncate">
          {daysOfStock.value}
        </div>
        <div className="text-[10px] sm:text-[11px] text-[#127670] mt-1 flex items-center font-medium truncate">
          <ArrowDown size={12} className="mr-0.5 shrink-0" /> {daysOfStock.sub.replace('↓', '').trim()}
        </div>
      </div>

      {/* 3. Below Reorder */}
      <div className="bg-white p-3 sm:p-4 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 border-l-4 border-l-[#D94432] flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="text-[11px] sm:text-[13px] text-slate-500 mb-1 truncate">{belowReorder.label}</div>
        <div className="text-lg sm:text-[24px] lg:text-[26px] font-bold text-[#D94432] leading-tight mb-1 truncate">
          {belowReorder.value}
        </div>
        <div className="text-[10px] sm:text-[11px] text-[#D94432] mt-1 truncate font-medium">{belowReorder.sub}</div>
      </div>

      {/* 4. Near Expiry · 90 d */}
      <div className="bg-white p-3 sm:p-4 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 border-l-4 border-l-[#D94432] flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="text-[11px] sm:text-[13px] text-slate-500 mb-1 truncate">{nearExpiry.label}</div>
        <div className="text-lg sm:text-[24px] lg:text-[26px] font-bold text-[#D94432] leading-tight mb-1 truncate">
          {nearExpiry.value}
        </div>
        <div className="text-[10px] sm:text-[11px] text-[#D94432] mt-1 truncate font-medium">{nearExpiry.sub}</div>
      </div>

      {/* 5. Open POs */}
      <div className="bg-white p-3 sm:p-4 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="text-[11px] sm:text-[13px] text-slate-500 mb-1 truncate">{openPOs.label}</div>
        <div className="text-lg sm:text-[24px] lg:text-[26px] font-bold text-slate-800 leading-tight mb-1 truncate">
          {openPOs.value}
        </div>
        <div className={cn("text-[10px] sm:text-[11px] mt-1 truncate font-medium", openPOs.alert ? "text-[#D94432]" : "text-slate-400")}>
          {openPOs.sub}
        </div>
      </div>

      {/* 6. Payables Due · 7 d */}
      <div className="bg-white p-3 sm:p-4 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="text-[11px] sm:text-[13px] text-slate-500 mb-1 truncate">{payablesDue.label}</div>
        <div className="text-lg sm:text-[24px] lg:text-[26px] font-bold text-slate-800 leading-tight mb-1 truncate">
          {payablesDue.value}
        </div>
        <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">{payablesDue.sub}</div>
      </div>
    </div>
  );
}
