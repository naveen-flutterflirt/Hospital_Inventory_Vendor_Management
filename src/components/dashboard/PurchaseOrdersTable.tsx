import React from 'react';
import { cn } from '@/lib/utils';

const purchaseOrders = [
  { po: 'PO-24-1182', vendor: 'Aarogya Pharma Distributors', items: 34, value: '₹4.6L', due: 'Today', status: 'Dispatched', statusClass: 'bg-blue-100 text-blue-700' },
  { po: 'PO-24-1176', vendor: 'Kavach Ortho Implants', items: 6, value: '₹7.2L', due: 'Consignment', status: 'Accepted', statusClass: 'bg-[#127670]/10 text-[#127670]' },
  { po: 'PO-24-1169', vendor: 'Sanjeevani Surgicals', items: 18, value: '₹1.9L', due: '6 Oct', status: 'Overdue 2 d', statusClass: 'bg-[#D94432]/10 text-[#D94432]' },
  { po: 'PO-24-1190', vendor: 'Spectra Bio Reagents', items: 11, value: '₹2.3L', due: '12 Oct', status: 'Awaiting approval', statusClass: 'bg-[#E89A3C]/10 text-[#E89A3C]' },
];

export default function PurchaseOrdersTable() {
  return (
    <div className="bg-white p-5 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[14px] font-bold text-slate-800 tracking-tight">Purchase orders in flight</h2>
        <button onClick={() => console.log("Viewing all purchase orders")} className="text-[13px] text-[#127670] font-semibold hover:underline cursor-pointer">View all &rarr;</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px] text-left whitespace-nowrap md:whitespace-normal">
          <thead>
            <tr className="text-slate-500 border-b border-slate-100 font-medium">
              <th className="pb-3 pr-4 font-normal">PO</th>
              <th className="pb-3 pr-4 font-normal">Vendor</th>
              <th className="pb-3 pr-4 font-normal text-right">Items</th>
              <th className="pb-3 pr-4 font-normal text-right">Value</th>
              <th className="pb-3 pr-4 font-normal">Due</th>
              <th className="pb-3 pr-4 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {purchaseOrders.map((row, idx) => (
              <tr key={idx} className="border-b border-slate-50 last:border-0">
                <td className="py-3 pr-4 font-semibold text-slate-800">{row.po}</td>
                <td className="py-3 pr-4 text-slate-600">{row.vendor}</td>
                <td className="py-3 pr-4 text-right">{row.items}</td>
                <td className="py-3 pr-4 text-right font-semibold">{row.value}</td>
                <td className="py-3 pr-4 text-slate-600">{row.due}</td>
                <td className="py-3 pr-4">
                  <span className={cn("px-2.5 py-1 rounded-md text-[11px] font-semibold", row.statusClass)}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
