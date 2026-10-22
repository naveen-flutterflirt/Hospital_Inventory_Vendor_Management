'use client';

import Link from 'next/link';
import { ArrowRight, Clock, AlertCircle } from 'lucide-react';
import { DashboardPendingApproval } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';

interface PendingApprovalsProps {
  approvals?: DashboardPendingApproval[];
  unbilledConsumption?: {
    value: string;
    title: string;
    desc: string;
    link: string;
  };
  loading?: boolean;
}

const fallbackApprovals: DashboardPendingApproval[] = [
  { id: 'po', title: 'PO-24-1190', amount: '₹2.3L', category: 'Lab Reagents', link: '/purchase-orders' },
  { id: 'indent', title: 'Indent ICU-882', priority: 'Emergency', isEmergency: true, link: '/indents' },
  { id: 'payment', title: 'Payment batch', sub: '12 invoices', amount: '₹18.4L', link: '/invoices-payments' },
];

export default function PendingApprovals({
  approvals,
  unbilledConsumption = {
    value: '₹2.1L',
    title: 'Unbilled consumption · 7 days',
    desc: 'Issued to patients but not on bill — 23 cases',
    link: '/issues-transfers',
  },
  loading = false,
}: PendingApprovalsProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-4 h-full">
        <div className="bg-white p-5 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex-1">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-5 w-20 rounded" />
          </div>
          <div className="space-y-2.5">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3.5 w-16" />
                </div>
                <Skeleton className="h-3.5 w-4 rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#0A1B22] p-5 rounded-xl shadow-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-20 bg-slate-700/60" />
            <div className="space-y-1">
              <Skeleton className="h-3.5 w-44 bg-slate-700/60" />
              <Skeleton className="h-2.5 w-56 bg-slate-700/60" />
            </div>
          </div>
          <Skeleton className="h-4 w-4 rounded-full bg-slate-700/60" />
        </div>
      </div>
    );
  }

  const approvalList = approvals && approvals.length > 0 ? approvals : fallbackApprovals;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Pending approval card */}
      <div className="bg-white p-5 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex-1">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
            <Clock size={16} className="text-[#E89A3C]" /> Pending my approval &middot; {approvalList.length}
          </h2>
          <span className="text-[11px] font-semibold text-[#E89A3C] bg-[#E89A3C]/10 px-2 py-0.5 rounded flex items-center gap-1">
            Action needed
          </span>
        </div>
        
        <div className="space-y-2.5 text-[13px]">
          {approvalList.map((item) => (
            <Link 
              key={item.id}
              href={item.link} 
              className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:border-[#127670]/30 hover:bg-slate-50 transition-all text-slate-700 hover:text-[#127670] group cursor-pointer"
            >
              <div>
                <span className="font-semibold text-slate-800 font-mono text-[12px]">{item.title}</span>
                {item.amount && (
                  <>
                    <span className="text-slate-400 mx-1.5">&middot;</span>
                    <span className="font-semibold text-slate-800">{item.amount}</span>
                  </>
                )}
                {item.sub && (
                  <>
                    <span className="text-slate-400 mx-1.5">&middot;</span>
                    <span className="text-slate-600">{item.sub}</span>
                  </>
                )}
                {item.category && (
                  <>
                    <span className="text-slate-400 mx-1.5">&middot;</span>
                    <span className="text-slate-500">{item.category}</span>
                  </>
                )}
                {item.priority && (
                  <>
                    <span className="text-slate-400 mx-1.5">&middot;</span>
                    <span className={cn(
                      "font-semibold text-[11px] px-1.5 py-0.5 rounded",
                      item.isEmergency ? "bg-[#D94432]/10 text-[#D94432]" : "bg-[#E89A3C]/10 text-[#E89A3C]"
                    )}>
                      {item.priority}
                    </span>
                  </>
                )}
              </div>
              <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-0.5 group-hover:text-[#127670] transition-all" />
            </Link>
          ))}
        </div>
      </div>

      {/* Unbilled consumption card */}
      <Link 
        href={unbilledConsumption.link} 
        className="bg-[#0A1B22] p-5 rounded-xl shadow-md text-white flex items-center justify-between gap-4 hover:bg-[#0e242d] transition-colors group cursor-pointer"
      >
        <div className="flex items-center gap-4">
          <div className="text-3xl font-bold text-white tracking-tight">{unbilledConsumption.value}</div>
          <div>
            <div className="font-semibold text-[13px] text-white flex items-center gap-1.5">
              <AlertCircle size={14} className="text-[#E89A3C]" /> {unbilledConsumption.title}
            </div>
            <div className="text-[11px] text-[#879C9B] mt-0.5">{unbilledConsumption.desc}</div>
          </div>
        </div>
        <ArrowRight size={16} className="text-[#879C9B] group-hover:text-white group-hover:translate-x-1 transition-all" />
      </Link>
    </div>
  );
}
