"use client";

import React, { useState } from 'react';
import Header from '@/components/dashboard/Header';
import { cn } from '@/lib/utils';
import { Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

const kpis = [
  { label: 'Pending Indents', value: '24', sub: 'Action required' },
  { label: 'Urgent / Emergency', value: '5', sub: 'High priority', alert: true },
  { label: 'Processing', value: '18', sub: 'In stores' },
  { label: 'Completed Today', value: '142', sub: 'Fully issued' },
];

// Generate 25 dummy indents to demonstrate pagination
const generateData = () => {
  const depts = ['ICU', 'Ward 3', 'OT 1', 'Emergency Dept', 'Pediatrics', 'Ward 1', 'Dialysis', 'Maternity', 'Cardiology'];
  const stores = ['IP Pharmacy', 'Central Store'];
  const priorities = ['Routine', 'Urgent', 'Emergency'];
  const statuses = ['Pending', 'Processing', 'Partially Issued', 'Completed'];
  const nurses = ['Nurse R. Sharma', 'Nurse A. Kumar', 'Dr. S. Patil', 'Nurse K. Singh', 'Nurse M. Devi', 'Nurse P. Nair', 'Tech J. Thomas'];
  
  return Array.from({ length: 25 }, (_, i) => {
    const priority = priorities[i % priorities.length];
    const status = statuses[i % statuses.length];
    let statusClass = 'bg-slate-100 text-slate-700';
    if (status === 'Pending') statusClass = priority === 'Emergency' ? 'bg-[#D94432]/10 text-[#D94432]' : 'bg-[#E89A3C]/10 text-[#E89A3C]';
    if (status === 'Processing') statusClass = 'bg-[#E89A3C]/10 text-[#E89A3C]';
    if (status === 'Partially Issued') statusClass = 'bg-blue-100 text-blue-700';
    if (status === 'Completed') statusClass = 'bg-[#1EB4A1]/20 text-[#127670]';

    return {
      id: `IND-24-${1192 - i}`,
      dept: depts[i % depts.length],
      toStore: stores[i % stores.length],
      items: ((i * 7) % 40) + 1, // Deterministic pseudo-random number
      priority,
      status,
      statusClass,
      raisedBy: nurses[i % nurses.length],
      time: `${(i * 15) + 10} mins ago`,
    };
  });
};

const allIndents = generateData();

export default function IndentsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(allIndents.length / itemsPerPage);
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = allIndents.slice(startIndex, endIndex);

  return (
    <div className="p-4 pt-16 md:p-8 max-w-[1400px] mx-auto flex flex-col gap-4 font-sans h-full">
      <Header />
      
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Indents (Internal Requisitions)</h1>
          <p className="text-[13px] text-slate-500 mt-1">Manage and fulfill ward and department requests.</p>
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
                placeholder="Search indent ID, dept..." 
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-md text-[13px] w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] transition-colors"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-md text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              <Filter size={14} /> Filters
            </button>
          </div>
          <div className="flex items-center gap-4 text-[13px] font-medium text-slate-500">
            <span>Showing {startIndex + 1}-{Math.min(endIndex, allIndents.length)} of {allIndents.length} pending</span>
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
                <th className="py-3 px-4 font-medium flex items-center gap-1 cursor-pointer hover:text-slate-700">Indent ID <ArrowUpDown size={12} /></th>
                <th className="py-3 px-4 font-medium">From Dept</th>
                <th className="py-3 px-4 font-medium">To Store</th>
                <th className="py-3 px-4 font-medium text-right">Items</th>
                <th className="py-3 px-4 font-medium">Priority</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Raised By</th>
                <th className="py-3 px-4 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors cursor-pointer">
                  <td className="py-3 px-4 font-semibold text-[#127670]">{row.id}</td>
                  <td className="py-3 px-4 text-slate-800 font-medium">{row.dept}</td>
                  <td className="py-3 px-4 text-slate-600">{row.toStore}</td>
                  <td className="py-3 px-4 text-right font-medium text-slate-800">{row.items}</td>
                  <td className="py-3 px-4">
                    <span className={cn(
                      "flex items-center gap-1.5 text-[12px] font-medium",
                      row.priority === 'Emergency' ? 'text-[#D94432]' : 
                      row.priority === 'Urgent' ? 'text-[#E89A3C]' : 'text-slate-500'
                    )}>
                      {row.priority !== 'Routine' && <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", row.priority === 'Emergency' ? 'bg-[#D94432]' : 'bg-[#E89A3C]')}></span>}
                      {row.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={cn("px-2.5 py-1 rounded-md text-[11px] font-semibold", row.statusClass)}>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{row.raisedBy}</td>
                  <td className="py-3 px-4 text-slate-500">{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
