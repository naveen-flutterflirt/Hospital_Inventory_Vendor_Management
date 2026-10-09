import React from 'react';
import { cn } from '@/lib/utils';

const reorderAlerts = [
  { item: 'Inj. Noradrenaline 4 mg', store: 'ICU', onHand: 18, cover: '0.8 d', coverColor: 'bg-[#D94432]/10 text-[#D94432]' },
  { item: 'Heparin 5000 IU', store: 'Central', onHand: 140, cover: '2.1 d', coverColor: 'bg-[#E89A3C]/10 text-[#E89A3C]' },
  { item: 'IV cannula 20G', store: 'Wards', onHand: 310, cover: '3.5 d', coverColor: 'bg-[#E89A3C]/10 text-[#E89A3C]' },
  { item: 'Suture 2-0 Vicryl', store: 'OT', onHand: 42, cover: '4.0 d', coverColor: 'bg-[#E89A3C]/10 text-[#E89A3C]' },
];

export default function ReorderAlerts() {
  return (
    <div className="bg-white p-5 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 h-full flex flex-col">
      <h2 className="text-[14px] font-bold text-slate-800 mb-4 tracking-tight">Reorder alerts — vital items</h2>
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-[13px] text-left whitespace-nowrap md:whitespace-normal">
          <thead>
            <tr className="text-slate-500 border-b border-slate-100 font-medium">
              <th className="pb-2 pr-4 font-normal">Item</th>
              <th className="pb-2 pr-4 font-normal">Store</th>
              <th className="pb-2 pr-4 font-normal text-right">On hand</th>
              <th className="pb-2 pr-4 font-normal text-right">Cover</th>
            </tr>
          </thead>
          <tbody>
            {reorderAlerts.map((row, idx) => (
              <tr key={idx} className="border-b border-slate-50 last:border-0">
                <td className="py-2.5 pr-4 text-slate-800">{row.item}</td>
                <td className="py-2.5 pr-4 text-slate-600">{row.store}</td>
                <td className="py-2.5 pr-4 text-right font-semibold">{row.onHand}</td>
                <td className="py-2.5 pr-4 text-right">
                  <span className={cn("px-2 py-0.5 rounded text-[11px] font-semibold", row.coverColor)}>
                    {row.cover}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={() => console.log("Creating Purchase Requisitions for 47 items...")} className="mt-4 bg-[#125F5C] text-white px-4 py-2 rounded-md text-[13px] font-semibold hover:bg-[#0c4240] self-start cursor-pointer transition-colors shadow-sm">
        Auto-create PR for 47 items
      </button>
    </div>
  );
}
