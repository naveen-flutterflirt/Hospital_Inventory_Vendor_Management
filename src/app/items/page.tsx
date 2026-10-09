"use client";

import React, { useState } from 'react';
import Header from '@/components/dashboard/Header';
import { cn } from '@/lib/utils';
import { BarChart, Bar, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import NewPRModal from '@/components/dashboard/NewPRModal';

const batches = [
  { batch: 'CTX2411A', store: 'IP Pharmacy · R2-B4', qty: 120, expiry: 'Dec 2026', mrp: '₹62.00', vendor: 'Aarogya', status: 'Near expiry', statusClass: 'bg-red-100 text-red-700' },
  { batch: 'CTX2502C', store: 'ICU sub-store', qty: 60, expiry: 'Feb 2027', mrp: '₹62.00', vendor: 'Aarogya', status: 'Issue first', statusClass: 'bg-[#1EB4A1]/20 text-[#127670]' },
  { batch: 'CTX2505F', store: 'Central · A1-03', qty: '1,200', expiry: 'May 2027', mrp: '₹64.50', vendor: 'Aarogya', status: 'Available', statusClass: 'bg-slate-100 text-slate-700' },
  { batch: 'CTX2506K', store: 'Wards (4)', qty: 400, expiry: 'Jun 2027', mrp: '₹64.50', vendor: 'Shreeram Dist.', status: 'Available', statusClass: 'bg-slate-100 text-slate-700' },
  { batch: 'CTX2508B', store: 'Central · QC hold', qty: 60, expiry: 'Aug 2027', mrp: '₹64.50', vendor: 'Shreeram Dist.', status: 'QC pending', statusClass: 'bg-[#E89A3C]/20 text-[#E89A3C]' },
];

const consumptionData = [
  { week: 'W1', value: 45 }, { week: 'W2', value: 52 }, { week: 'W3', value: 48 },
  { week: 'W4', value: 60 }, { week: 'W5', value: 58 }, { week: 'W6', value: 65 },
  { week: 'W7', value: 62 }, { week: 'W8', value: 70 }, { week: 'W9', value: 75 },
  { week: 'W10', value: 82 }, { week: 'W11', value: 85 }, { week: 'W12', value: 92 },
];

export default function ItemsAndStockPage() {
  const [prModalOpen, setPrModalOpen] = useState(false);

  return (
    <div className="p-4 pt-16 md:p-8 max-w-[1400px] mx-auto flex flex-col gap-4 font-sans">
      <Header />
      
      {/* Modal */}
      <NewPRModal isOpen={prModalOpen} onClose={() => setPrModalOpen(false)} />

      {/* Item Header Card */}
      <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 p-5 md:p-6 mt-2">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex gap-4 items-start">
            <div className="w-14 h-14 rounded-lg bg-[#127670]/10 flex items-center justify-center flex-shrink-0 text-[#127670] font-bold text-lg">
              Rx
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Inj. Ceftriaxone 1 g</h1>
                <span className="text-[11px] font-semibold text-[#D94432] bg-[#D94432]/10 px-2 py-0.5 rounded cursor-default">Vital · A-class</span>
                <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded cursor-default">Schedule H</span>
                <span className="text-[11px] font-semibold text-[#127670] bg-[#127670]/10 px-2 py-0.5 rounded cursor-default">Patient chargeable</span>
              </div>
              <p className="text-[13px] text-slate-500 leading-relaxed">
                Item code DRG-00412 &middot; Generic: Ceftriaxone sodium &middot; Form: vial &middot; HSN 3004 &middot; GST 12% &middot; UoM: vial (box of 10) &middot; Formulary ✓
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-md text-[13px] font-semibold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">
              Transfer
            </button>
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-md text-[13px] font-semibold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">
              Adjust
            </button>
            <button 
              onClick={() => setPrModalOpen(true)}
              className="px-4 py-2 bg-[#125F5C] text-white rounded-md text-[13px] font-semibold hover:bg-[#0c4240] transition-colors shadow-sm cursor-pointer"
            >
              Raise PR
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total on hand', value: '1,840', sub: 'vials · 6 stores' },
          { label: 'Avg daily use', value: '74', sub: 'last 30 days' },
          { label: 'Cover', value: '24.9 d', sub: 'within target' },
          { label: 'Reorder level / qty', value: '900 / 2,000', sub: 'auto-calculated' },
          { label: 'Last rate', value: '₹38.40', sub: 'Rate contract to Mar-27' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white p-4 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col justify-between">
            <h3 className="text-[13px] text-slate-500 font-medium mb-1">{kpi.label}</h3>
            <p className="text-2xl font-bold text-slate-800 tracking-tight mb-1">{kpi.value}</p>
            <p className="text-[11px] text-slate-400 font-medium">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left Column (Batches Table) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 p-5">
            <h2 className="text-[14px] font-bold text-slate-800 tracking-tight mb-4">Batches — FEFO order (first expiry, first out)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] text-left whitespace-nowrap">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-100 font-medium">
                    <th className="pb-3 pr-4 font-normal">Batch</th>
                    <th className="pb-3 pr-4 font-normal">Store / bin</th>
                    <th className="pb-3 pr-4 font-normal text-right">Qty</th>
                    <th className="pb-3 pr-4 font-normal">Expiry</th>
                    <th className="pb-3 pr-4 font-normal text-right">MRP</th>
                    <th className="pb-3 pr-4 font-normal">Vendor</th>
                    <th className="pb-3 pr-4 font-normal text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-50 last:border-0">
                      <td className="py-3 pr-4 font-semibold text-slate-800">{row.batch}</td>
                      <td className="py-3 pr-4 text-slate-600">{row.store}</td>
                      <td className="py-3 pr-4 text-right font-semibold">{row.qty}</td>
                      <td className="py-3 pr-4 text-slate-600">{row.expiry}</td>
                      <td className="py-3 pr-4 text-right">{row.mrp}</td>
                      <td className="py-3 pr-4 text-slate-600">{row.vendor}</td>
                      <td className="py-3 pr-4 text-center">
                        <span className={cn("px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap", row.statusClass)}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-[13px] text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
              Suggested: <span className="font-semibold text-slate-800">transfer 120 of CTX2411A</span> from IP Pharmacy to ICU (higher use) — saves <span className="font-semibold text-[#127670]">₹4,600</span> of likely expiry.
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          
          {/* Consumption Chart */}
          <div className="bg-white p-5 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100">
            <h2 className="text-[14px] font-bold text-slate-800 tracking-tight mb-4">Consumption — 12 weeks</h2>
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={consumptionData}>
                  <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                  <Bar dataKey="value" fill="#99C9C4" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[12px] text-slate-500 mt-3 font-medium">Trend +18% — monsoon infections; forecast raised reorder qty</p>
          </div>

          {/* Vendors */}
          <div className="bg-white p-5 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100">
            <h2 className="text-[14px] font-bold text-slate-800 tracking-tight mb-4">Approved vendors & rates</h2>
            <div className="space-y-3 text-[13px]">
              <div className="flex justify-between">
                <span className="text-slate-600">Aarogya Pharma (L1)</span>
                <span className="font-semibold text-slate-800">₹38.40</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Shreeram Distributors (L2)</span>
                <span className="font-semibold text-slate-800">₹39.10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Local purchase (last)</span>
                <span className="font-semibold text-[#D94432]">₹46.00</span>
              </div>
            </div>
          </div>

          {/* Movement log */}
          <div className="bg-white p-5 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100">
            <h2 className="text-[14px] font-bold text-slate-800 tracking-tight mb-4">Movement log</h2>
            <div className="space-y-3 text-[12px] text-slate-600 leading-relaxed">
              <p>Today 09:12 &middot; Issued 20 &rarr; Ward 3 (indent W3-1192)</p>
              <p>Today 08:40 &middot; Patient issue 2 &rarr; UHID BLR-0042871 &middot; billed ✓</p>
              <p>Yesterday &middot; GRN 1,200 &middot; PO-24-1102</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
