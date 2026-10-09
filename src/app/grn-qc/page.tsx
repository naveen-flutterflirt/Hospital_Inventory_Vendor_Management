"use client";

import React, { useState } from 'react';
import Header from '@/components/dashboard/Header';
import { cn } from '@/lib/utils';
import { Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, ScanLine, Check } from 'lucide-react';
import ScanDeliveryModal from '@/components/dashboard/ScanDeliveryModal';

const kpis = [
  { label: 'Expected Today', value: '12', sub: 'Advance shipping notices' },
  { label: 'Pending QC', value: '8', sub: 'Awaiting inspection', alert: true },
  { label: 'QC Passed', value: '45', sub: 'Cleared to stock' },
  { label: 'Returns / Rejects', value: '3', sub: 'Debit notes pending' },
];

const generateData = () => {
  const vendors = ['Aarogya Pharma Distributors', 'Kavach Ortho Implants', 'Sanjeevani Surgicals', 'Spectra Bio Reagents', 'Prakash Health Supplies'];
  const statuses = ['Expected', 'Pending QC', 'QC Passed', 'Partial Reject', 'QC Failed'];
  
  return Array.from({ length: 32 }, (_, i) => {
    const vendor = vendors[i % vendors.length];
    let status = statuses[i % statuses.length];
    
    // Hardcode some statuses for realism based on index
    if (i === 0 || i === 4) status = 'Expected';
    if (i === 1 || i === 7) status = 'Pending QC';
    if (i === 3) status = 'Partial Reject';
    
    let statusClass = 'bg-slate-100 text-slate-700';
    if (status === 'Expected') statusClass = 'bg-blue-100 text-blue-700';
    if (status === 'Pending QC') statusClass = 'bg-[#E89A3C]/10 text-[#E89A3C]';
    if (status === 'QC Passed') statusClass = 'bg-[#1EB4A1]/20 text-[#127670]';
    if (status === 'Partial Reject' || status === 'QC Failed') statusClass = 'bg-[#D94432]/10 text-[#D94432]';

    const dayOffset = i % 5;
    const date = dayOffset === 0 ? 'Today' : dayOffset === 1 ? 'Yesterday' : `${dayOffset} days ago`;

    return {
      id: `GRN-24-${880 - i}`,
      poRef: `PO-24-${1199 - i}`,
      vendor,
      lines: ((i * 7) % 20) + 1,
      shortage: status === 'Partial Reject' ? `${(i % 5) + 2} items short` : '-',
      date,
      status,
      statusClass,
    };
  });
};

const allGRNs = generateData();

export default function GrnQcPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  
  const itemsPerPage = 10;
  
  // Apply filters
  const filteredData = allGRNs.filter(item => {
    if (activeFilter === 'All') return true;
    return item.status === activeFilter;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  return (
    <div className="p-4 pt-16 md:p-8 max-w-[1400px] mx-auto flex flex-col gap-4 font-sans h-full">
      <Header />
      
      {/* Modals */}
      <ScanDeliveryModal isOpen={scanModalOpen} onClose={() => setScanModalOpen(false)} />

      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Goods Receipt (GRN) & QC</h1>
          <p className="text-[13px] text-slate-500 mt-1">Receive deliveries, scan batches, and perform quality checks.</p>
        </div>
        <button 
          onClick={() => setScanModalOpen(true)}
          className="flex items-center gap-2 bg-[#125F5C] text-white px-4 py-2 rounded-md text-[13px] font-semibold hover:bg-[#0c4240] transition-colors shadow-sm whitespace-nowrap cursor-pointer"
        >
          <ScanLine size={16} strokeWidth={2.5} /> Scan Delivery
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
                placeholder="Search GRN, PO, or vendor..." 
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-md text-[13px] w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] transition-colors"
              />
            </div>
            
            {/* Filter Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 border rounded-md text-[13px] font-semibold transition-colors cursor-pointer",
                  activeFilter !== 'All' 
                    ? "bg-[#1EB4A1]/10 border-[#1EB4A1]/30 text-[#127670]" 
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                <Filter size={14} /> 
                {activeFilter === 'All' ? 'Filters' : activeFilter}
              </button>
              
              {filtersOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-2">
                  {['All', 'Expected', 'Pending QC', 'QC Passed', 'Partial Reject', 'QC Failed'].map(opt => (
                    <button 
                      key={opt}
                      onClick={() => {
                        setActiveFilter(opt);
                        setCurrentPage(1); // Reset page on filter
                        setFiltersOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                    >
                      {opt}
                      {activeFilter === opt && <Check size={14} className="text-[#1EB4A1]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 text-[13px] font-medium text-slate-500">
            <span>Showing {filteredData.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredData.length)} of {filteredData.length} deliveries</span>
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
                <th className="py-3 px-4 font-medium flex items-center gap-1 cursor-pointer hover:text-slate-700">GRN / ASN ID <ArrowUpDown size={12} /></th>
                <th className="py-3 px-4 font-medium">Ref. PO</th>
                <th className="py-3 px-4 font-medium">Vendor</th>
                <th className="py-3 px-4 font-medium text-right">Lines/Items</th>
                <th className="py-3 px-4 font-medium">Variance (QC)</th>
                <th className="py-3 px-4 font-medium">Date</th>
                <th className="py-3 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors cursor-pointer">
                  <td className="py-3 px-4 font-semibold text-[#127670]">{row.id}</td>
                  <td className="py-3 px-4 text-slate-600 font-medium">{row.poRef}</td>
                  <td className="py-3 px-4 text-slate-800 font-medium">{row.vendor}</td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-800">{row.lines}</td>
                  <td className="py-3 px-4">
                    <span className={cn(
                      "text-[12px] font-medium",
                      row.shortage !== '-' ? 'text-[#D94432]' : 'text-slate-400'
                    )}>
                      {row.shortage}
                    </span>
                  </td>
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
