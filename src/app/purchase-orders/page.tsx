"use client";

import React, { useState } from 'react';
import Header from '@/components/dashboard/Header';
import { cn } from '@/lib/utils';
import { Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

const kpis = [
  { label: 'Open POs', value: '63', sub: 'In flight' },
  { label: 'Overdue Delivery', value: '9', sub: 'Follow-up required', alert: true },
  { label: 'Received Today', value: '14', sub: 'Pending GRN' },
  { label: 'Awaiting Approval', value: '7', sub: 'Pending signatures' },
];

const generateData = () => {
  const vendors = ['Aarogya Pharma Distributors', 'Kavach Ortho Implants', 'Sanjeevani Surgicals', 'Spectra Bio Reagents', 'Prakash Health Supplies', 'Nova MedEquip Traders'];
  const types = ['Regular PO', 'Rate-contract PO', 'Blanket PO', 'Consignment', 'Capex PO', 'Emergency purchase'];
  const statuses = ['Dispatched', 'Accepted', 'Overdue', 'Awaiting approval', 'Draft'];
  
  return Array.from({ length: 45 }, (_, i) => {
    const vendor = vendors[i % vendors.length];
    const type = types[i % types.length];
    let status = statuses[i % statuses.length];
    
    // Make sure some are overdue to match KPI
    if (i % 7 === 0) status = 'Overdue';

    let statusClass = 'bg-slate-100 text-slate-700';
    if (status === 'Dispatched' || status === 'Accepted') statusClass = 'bg-[#1EB4A1]/20 text-[#127670]';
    if (status === 'Overdue') statusClass = 'bg-[#D94432]/10 text-[#D94432]';
    if (status === 'Awaiting approval') statusClass = 'bg-[#E89A3C]/10 text-[#E89A3C]';

    const daysOffset = (i * 3) % 14;
    const due = status === 'Overdue' 
      ? `${daysOffset + 1} d overdue` 
      : status === 'Dispatched' || status === 'Accepted'
        ? `In ${daysOffset + 1} days`
        : '-';

    return {
      id: `PO-24-${1200 - i}`,
      vendor,
      type,
      items: ((i * 5) % 40) + 1,
      value: `₹${(((i * 13) % 80) + 1).toFixed(1)}L`,
      due,
      status,
      statusClass,
    };
  });
};

const allPOs = generateData();

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const totalPages = Math.ceil(allPOs.length / itemsPerPage);
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = allPOs.slice(startIndex, endIndex);

  return (
    <div className="p-4 pt-16 md:p-8 max-w-[1400px] mx-auto flex flex-col gap-4 font-sans h-full">
      <Header />
      
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Purchase Orders</h1>
          <p className="text-[13px] text-slate-500 mt-1">Manage vendor contracts, deliveries, and approvals.</p>
        </div>
        <button 
          onClick={() => router.push('/rfq-quotes')}
          className="flex items-center gap-2 bg-[#125F5C] text-white px-4 py-2 rounded-md text-[13px] font-semibold hover:bg-[#0c4240] transition-colors shadow-sm whitespace-nowrap cursor-pointer"
        >
          <Plus size={16} strokeWidth={3} /> Create PO
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
                placeholder="Search PO number, vendor..." 
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-md text-[13px] w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] transition-colors"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-md text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
              <Filter size={14} /> Filters
            </button>
          </div>
          <div className="flex items-center gap-4 text-[13px] font-medium text-slate-500">
            <span>Showing {startIndex + 1}-{Math.min(endIndex, allPOs.length)} of {allPOs.length} POs</span>
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
                <th className="py-3 px-4 font-medium flex items-center gap-1 cursor-pointer hover:text-slate-700">PO ID <ArrowUpDown size={12} /></th>
                <th className="py-3 px-4 font-medium">Vendor</th>
                <th className="py-3 px-4 font-medium">PO Type</th>
                <th className="py-3 px-4 font-medium text-right">Items</th>
                <th className="py-3 px-4 font-medium text-right">Value</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Due</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors cursor-pointer">
                  <td className="py-3 px-4 font-semibold text-[#127670]">{row.id}</td>
                  <td className="py-3 px-4 text-slate-800 font-medium">{row.vendor}</td>
                  <td className="py-3 px-4 text-slate-600">{row.type}</td>
                  <td className="py-3 px-4 text-right font-medium text-slate-800">{row.items}</td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-800">{row.value}</td>
                  <td className="py-3 px-4">
                    <span className={cn("px-2.5 py-1 rounded-md text-[11px] font-semibold", row.statusClass)}>
                      {row.status}
                    </span>
                  </td>
                  <td className={cn(
                    "py-3 px-4 font-medium",
                    row.status === 'Overdue' ? 'text-[#D94432]' : 'text-slate-500'
                  )}>{row.due}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
