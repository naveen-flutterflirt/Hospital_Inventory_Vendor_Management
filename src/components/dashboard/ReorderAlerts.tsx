'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { DashboardReorderAlert } from '@/lib/api';
import { AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import NewPRModal from './NewPRModal';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';

interface ReorderAlertsProps {
  alerts?: DashboardReorderAlert[];
  totalBelowReorder?: string | number;
  onAutoCreatePr?: () => void;
  autoCreatingPr?: boolean;
  loading?: boolean;
}

const fallbackAlerts: DashboardReorderAlert[] = [
  { id: 1, item: 'Inj. Noradrenaline 4 mg', code: 'DRG-00201', store: 'ICU', onHand: 18, cover: '0.8 d', coverColor: 'bg-[#D94432]/10 text-[#D94432]', reorderQty: 1000 },
  { id: 2, item: 'Heparin 5000 IU', code: 'DRG-00330', store: 'Central', onHand: 140, cover: '2.1 d', coverColor: 'bg-[#E89A3C]/10 text-[#E89A3C]', reorderQty: 1500 },
  { id: 3, item: 'IV cannula 20G', code: 'CON-00331', store: 'Wards', onHand: 310, cover: '3.5 d', coverColor: 'bg-[#E89A3C]/10 text-[#E89A3C]', reorderQty: 5000 },
  { id: 4, item: 'Suture 2-0 Vicryl', code: 'CON-00940', store: 'OT', onHand: 42, cover: '4.0 d', coverColor: 'bg-[#E89A3C]/10 text-[#E89A3C]', reorderQty: 1000 },
];

export default function ReorderAlerts({
  alerts,
  totalBelowReorder = '47',
  onAutoCreatePr,
  autoCreatingPr = false,
  loading = false,
}: ReorderAlertsProps) {
  const [isPRModalOpen, setIsPRModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 h-full flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-52" />
            </div>
          </div>
          <div className="space-y-3 pb-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 py-2 border-b border-slate-50">
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
                <Skeleton className="h-3.5 w-14" />
                <Skeleton className="h-3.5 w-10 font-mono" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>
      </div>
    );
  }

  const alertList = alerts && alerts.length > 0 ? alerts : fallbackAlerts;

  return (
    <div className="bg-white p-5 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
            <AlertTriangle size={15} className="text-[#D94432]" /> Reorder alerts — vital items
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px] text-left whitespace-nowrap">
            <thead>
              <tr className="text-slate-500 border-b border-slate-100 font-medium">
                <th className="pb-2 pr-4 font-normal">Item</th>
                <th className="pb-2 pr-4 font-normal">Store</th>
                <th className="pb-2 pr-4 font-normal text-right">On hand</th>
                <th className="pb-2 pr-4 font-normal text-right">Cover</th>
              </tr>
            </thead>
            <tbody>
              {alertList.map((row) => (
                <tr key={row.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="py-2.5 pr-4 font-medium">
                    <Link href="/items" className="text-slate-800 hover:text-[#127670] hover:underline cursor-pointer">
                      {row.item}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-4 text-slate-600 font-medium">{row.store}</td>
                  <td className="py-2.5 pr-4 text-right font-bold text-slate-800">{row.onHand.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 pr-4 text-right">
                    <span className={cn("px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap", row.coverColor)}>
                      {row.cover}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="pt-4 flex items-center justify-between gap-3">
        <button 
          type="button"
          disabled={autoCreatingPr}
          onClick={onAutoCreatePr || (() => setIsPRModalOpen(true))} 
          className="bg-[#125F5C] text-white px-4 py-2 rounded-lg text-[13px] font-semibold hover:bg-[#0c4240] cursor-pointer transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
        >
          {autoCreatingPr ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Creating PR...
            </>
          ) : (
            `Auto-create PR for ${totalBelowReorder} items`
          )}
        </button>

        <Link href="/purchase-requests" className="text-[12px] text-slate-500 hover:text-[#127670] font-semibold flex items-center gap-1 cursor-pointer">
          All Requisitions <ArrowRight size={12} />
        </Link>
      </div>

      <NewPRModal 
        isOpen={isPRModalOpen} 
        onClose={() => setIsPRModalOpen(false)} 
      />
    </div>
  );
}
