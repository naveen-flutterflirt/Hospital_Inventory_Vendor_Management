"use client";

import React, { useState } from 'react';
import Header from '@/components/dashboard/Header';
import { cn } from '@/lib/utils';
import { Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, Send, ArrowRightLeft } from 'lucide-react';
import NewTransferModal from '@/components/dashboard/NewTransferModal';
import NewIssueModal from '@/components/dashboard/NewIssueModal';

const kpis = [
  { label: 'Pending Fulfillment', value: '24', sub: 'Ward indents', alert: true },
  { label: 'Issued Today', value: '142', sub: 'To patients & wards' },
  { label: 'Store Transfers', value: '8', sub: 'In transit' },
  { label: 'Ward Returns', value: '3', sub: 'Pending restock' },
];

const generateData = () => {
  const types = ['Ward Issue', 'Patient Issue', 'Store Transfer', 'Ward Return'];
  const sources = ['Main Store', 'Pharmacy', 'OT Store', 'Lab Store'];
  const destinations = ['ICU Ward', 'Patient #8892', 'General Ward A', 'Pharmacy', 'Main Store'];
  const statuses = ['Completed', 'In Transit', 'Pending', 'Cancelled'];
  
  return Array.from({ length: 40 }, (_, i) => {
    const type = types[i % types.length];
    const from = sources[i % sources.length];
    const to = destinations[i % destinations.length];
    let status = statuses[i % statuses.length];
    
    if (type === 'Patient Issue') status = 'Completed';
    if (i === 0 || i === 4) status = 'Pending';
    if (i === 1) status = 'In Transit';

    let statusClass = 'bg-slate-100 text-slate-700';
    if (status === 'Completed') statusClass = 'bg-[#1EB4A1]/20 text-[#127670]';
    if (status === 'Pending') statusClass = 'bg-[#E89A3C]/10 text-[#E89A3C]';
    if (status === 'In Transit') statusClass = 'bg-blue-100 text-blue-700';
    if (status === 'Cancelled') statusClass = 'bg-slate-200 text-slate-500 line-through decoration-slate-400';

    const dayOffset = i % 3;
    const timeStr = dayOffset === 0 ? 'Today, 10:30 AM' : dayOffset === 1 ? 'Yesterday' : `${dayOffset} days ago`;

    return {
      id: `TRF-24-${3392 - i}`,
      type,
      from,
      to,
      lines: ((i * 3) % 15) + 1,
      status,
      statusClass,
      date: timeStr,
    };
  });
};

const allTransfers = generateData();

export default function IssuesTransfersPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [issueModalOpen, setIssueModalOpen] = useState(false);

  const itemsPerPage = 12;
  const totalPages = Math.ceil(allTransfers.length / itemsPerPage);
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = allTransfers.slice(startIndex, endIndex);

  return (
    <div className="p-4 pt-16 md:p-8 max-w-[1400px] mx-auto flex flex-col gap-4 font-sans h-full">
      <Header />
      
      {/* Modals */}
      <NewTransferModal isOpen={transferModalOpen} onClose={() => setTransferModalOpen(false)} />
      <NewIssueModal isOpen={issueModalOpen} onClose={() => setIssueModalOpen(false)} />

      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Issues & Transfers</h1>
          <p className="text-[13px] text-slate-500 mt-1">Manage internal stock movements between stores, wards, and patients.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setTransferModalOpen(true)}
            className="flex items-center gap-2 bg-white border border-slate-200 text-[#2B3F54] px-5 py-2.5 rounded-lg text-[14px] font-semibold hover:bg-slate-50 transition-colors shadow-sm whitespace-nowrap cursor-pointer"
          >
            <ArrowRightLeft size={16} strokeWidth={2.5} /> Stock Transfer
          </button>
          <button 
            onClick={() => setIssueModalOpen(true)}
            className="flex items-center gap-2 bg-[#125F5C] text-white px-5 py-2.5 rounded-lg text-[14px] font-semibold hover:bg-[#0c4240] transition-colors shadow-sm whitespace-nowrap cursor-pointer"
          >
            <Send size={16} strokeWidth={2.5} /> Issue Items
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white p-4 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col justify-between">
            <h3 className="text-[13px] text-slate-500 font-medium mb-1">{kpi.label}</h3>
            <p className={cn("text-2xl font-bold tracking-tight mb-1", kpi.alert ? "text-[#D94432]" : "text-slate-800")}>{kpi.value}</p>
            <p className="text-[11px] text-slate-400 font-medium">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Data Table Section */}
      <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col flex-1 overflow-hidden">
        
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search transfer ID, store, or patient..." 
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-md text-[13px] w-full md:w-72 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] transition-colors"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-md text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
              <Filter size={14} /> Filters
            </button>
          </div>
          <div className="flex items-center gap-4 text-[13px] font-medium text-slate-500">
            <span>Showing {startIndex + 1}-{Math.min(endIndex, allTransfers.length)} of {allTransfers.length} records</span>
            <div className="flex gap-1 items-center">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded-md hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-600 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button 
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "w-6 h-6 rounded-md flex items-center justify-center transition-colors cursor-pointer text-[12px]", 
                    currentPage === page ? "bg-slate-200 text-slate-800 font-bold" : "hover:bg-slate-100 text-slate-600"
                  )}
                >
                  {page}
                </button>
              ))}

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded-md hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-600 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-[13px] text-left whitespace-nowrap min-w-[900px]">
            <thead>
              <tr className="text-slate-500 border-b border-slate-100 font-medium bg-slate-50/50">
                <th className="py-3 px-4 font-medium flex items-center gap-1 cursor-pointer hover:text-slate-700">Txn ID <ArrowUpDown size={12} /></th>
                <th className="py-3 px-4 font-medium">Type</th>
                <th className="py-3 px-4 font-medium">From Store</th>
                <th className="py-3 px-4 font-medium">To Store / Patient</th>
                <th className="py-3 px-4 font-medium text-right">Lines</th>
                <th className="py-3 px-4 font-medium">Date</th>
                <th className="py-3 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors cursor-pointer">
                  <td className="py-3 px-4 font-semibold text-[#127670]">{row.id}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      {row.type === 'Store Transfer' && <ArrowRightLeft size={14} className="text-blue-500" />}
                      {row.type === 'Ward Return' && <ChevronLeft size={14} className="text-[#E89A3C]" />}
                      {(row.type === 'Patient Issue' || row.type === 'Ward Issue') && <Send size={14} className="text-[#127670]" />}
                      <span className="text-slate-700 font-medium">{row.type}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">{row.from}</td>
                  <td className="py-3 px-4 text-slate-800 font-medium">{row.to}</td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-800">{row.lines}</td>
                  <td className="py-3 px-4 text-slate-500">{row.date}</td>
                  <td className="py-3 px-4">
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
    </div>
  );
}
