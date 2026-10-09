"use client";

import React, { useState } from 'react';
import Header from '@/components/dashboard/Header';
import { cn } from '@/lib/utils';
import { Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import NewPRModal from '@/components/dashboard/NewPRModal';

const kpis = [
  { label: 'Pending Approval', value: '14', sub: 'Action required' },
  { label: 'Over Budget', value: '3', sub: 'Needs CFO review', alert: true },
  { label: 'Approved (Ready)', value: '8', sub: 'Awaiting PO / RFQ' },
  { label: 'Rejected', value: '2', sub: 'This month' },
];

const generateData = () => {
  const sources = ['Auto-reorder', 'Manual', 'Indent Escalation'];
  const depts = ['Pharmacy', 'Lab', 'OT', 'Radiology', 'General Admin'];
  const statuses = ['Pending L1', 'Pending CFO', 'Approved', 'Rejected'];
  const users = ['Dr. Menon', 'Naveen K.', 'System', 'Dr. Sharma', 'R. Patel'];
  
  return Array.from({ length: 35 }, (_, i) => {
    const source = sources[i % sources.length];
    const dept = depts[i % depts.length];
    const status = statuses[i % statuses.length];
    
    let statusClass = 'bg-slate-100 text-slate-700';
    if (status === 'Pending L1' || status === 'Pending CFO') statusClass = 'bg-[#E89A3C]/10 text-[#E89A3C]';
    if (status === 'Approved') statusClass = 'bg-[#1EB4A1]/20 text-[#127670]';
    if (status === 'Rejected') statusClass = 'bg-[#D94432]/10 text-[#D94432]';

    return {
      id: `PR-24-${4092 - i}`,
      source,
      dept,
      items: ((i * 3) % 25) + 1,
      estValue: `₹${(((i * 7) % 50) + 2).toFixed(1)}L`,
      status,
      statusClass,
      raisedBy: source === 'Auto-reorder' ? 'System' : users[i % users.length],
      age: `${(i % 5) + 1} day${((i % 5) + 1) > 1 ? 's' : ''}`,
    };
  });
};

const allPRs = generateData();

export default function PurchaseRequestsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [prModalOpen, setPrModalOpen] = useState(false);
  
  const itemsPerPage = 10;
  const totalPages = Math.ceil(allPRs.length / itemsPerPage);
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = allPRs.slice(startIndex, endIndex);

  return (
    <div className="p-4 pt-16 md:p-8 max-w-[1400px] mx-auto flex flex-col gap-4 font-sans h-full">
      <Header />
      
      {/* Modal */}
      <NewPRModal isOpen={prModalOpen} onClose={() => setPrModalOpen(false)} />

      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Purchase Requests (PR)</h1>
          <p className="text-[13px] text-slate-500 mt-1">Review and approve procurement needs before quoting.</p>
        </div>
        <button 
          onClick={() => setPrModalOpen(true)}
          className="flex items-center gap-2 bg-[#125F5C] text-white px-4 py-2 rounded-md text-[13px] font-semibold hover:bg-[#0c4240] transition-colors shadow-sm whitespace-nowrap cursor-pointer"
        >
          <Plus size={16} strokeWidth={3} /> Raise PR
        </button>
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
                placeholder="Search PR number, dept..." 
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-md text-[13px] w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] transition-colors"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-md text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              <Filter size={14} /> Filters
            </button>
          </div>
          <div className="flex items-center gap-4 text-[13px] font-medium text-slate-500">
            <span>Showing {startIndex + 1}-{Math.min(endIndex, allPRs.length)} of {allPRs.length} PRs</span>
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
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-[13px] text-left whitespace-nowrap">
            <thead>
              <tr className="text-slate-500 border-b border-slate-100 font-medium bg-slate-50/50">
                <th className="py-3 px-4 font-medium flex items-center gap-1 cursor-pointer hover:text-slate-700">PR ID <ArrowUpDown size={12} /></th>
                <th className="py-3 px-4 font-medium">Source</th>
                <th className="py-3 px-4 font-medium">Cost Center / Dept</th>
                <th className="py-3 px-4 font-medium text-right">Items</th>
                <th className="py-3 px-4 font-medium text-right">Est. Value</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Raised By</th>
                <th className="py-3 px-4 font-medium">Age</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors cursor-pointer">
                  <td className="py-3 px-4 font-semibold text-[#127670]">{row.id}</td>
                  <td className="py-3 px-4 text-slate-600">{row.source}</td>
                  <td className="py-3 px-4 text-slate-800 font-medium">{row.dept}</td>
                  <td className="py-3 px-4 text-right font-medium text-slate-800">{row.items}</td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-800">{row.estValue}</td>
                  <td className="py-3 px-4">
                    <span className={cn("px-2.5 py-1 rounded-md text-[11px] font-semibold", row.statusClass)}>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{row.raisedBy}</td>
                  <td className="py-3 px-4 text-slate-500">{row.age}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
