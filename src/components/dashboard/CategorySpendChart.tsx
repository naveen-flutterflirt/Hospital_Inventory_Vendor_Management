'use client';

import { DashboardCategorySpend } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';

interface CategorySpendChartProps {
  data?: DashboardCategorySpend[];
  loading?: boolean;
}

const fallbackSpend = [
  { name: 'Drugs', value: 48.2, fill: '#125F5C', raw: 4820000 },
  { name: 'Implants', value: 29.9, fill: '#17A392', raw: 2990000 },
  { name: 'Consumables', value: 21.4, fill: '#17A392', raw: 2140000 },
  { name: 'Lab reagents', value: 11.1, fill: '#125F5C', raw: 1110000 },
  { name: 'General', value: 5.8, fill: '#125F5C', raw: 580000 },
];

export default function CategorySpendChart({ data, loading = false }: CategorySpendChartProps) {
  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 h-full flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-12" />
        </div>
        <div className="space-y-4 flex-1 flex flex-col justify-center pb-2">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="flex items-center justify-between gap-3">
              <Skeleton className="h-3.5 w-24 shrink-0" />
              <Skeleton className="h-2 flex-1 rounded-full" />
              <Skeleton className="h-3.5 w-12 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const spendList = data && data.length > 0 ? data : fallbackSpend;
  const maxVal = Math.max(...spendList.map((d) => d.value), 1);

  return (
    <div className="bg-white p-5 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[14px] font-bold text-slate-800 tracking-tight">Spend by category — this month</h2>
      </div>

      <div className="space-y-4 flex-1 flex flex-col justify-center pb-2">
        {spendList.map((item) => {
          const widthPercent = Math.min(100, Math.max(8, (item.value / maxVal) * 100));
          return (
            <div key={item.name} className="flex items-center justify-between">
              <div className="text-[13px] text-slate-600 w-24 truncate font-medium">{item.name}</div>
              <div className="flex-1 mx-3 h-2 bg-slate-100 rounded-full overflow-hidden flex">
                <div 
                  className="h-full rounded-full transition-all duration-500" 
                  style={{ 
                    width: `${widthPercent}%`,
                    backgroundColor: item.fill || '#125F5C' 
                  }}
                />
              </div>
              <div className="text-[13px] font-medium w-14 text-right text-slate-500 shrink-0 font-mono">
                ₹{item.value}L
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
