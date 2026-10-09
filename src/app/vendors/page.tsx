"use client";

import React, { useState } from 'react';
import Header from '@/components/dashboard/Header';
import { cn } from '@/lib/utils';
import { Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, UserPlus, Star, Check } from 'lucide-react';
import NewVendorModal from '@/components/dashboard/NewVendorModal';

const kpis = [
  { label: 'Active Vendors', value: '184', sub: 'Approved for POs' },
  { label: 'Pending Onboarding', value: '12', sub: 'Document verification' },
  { label: 'Top Performers', value: '45', sub: 'Score > 90%' },
  { label: 'Suspended', value: '3', sub: 'Compliance issues', alert: true },
];

const generateData = () => {
  const vendors = [
    { name: 'Aarogya Pharma Distributors', cat: 'Pharmacy', score: 94, grade: 'A', status: 'Active' },
    { name: 'Kavach Ortho Implants', cat: 'Implants', score: 88, grade: 'B', status: 'Active' },
    { name: 'Sanjeevani Surgicals', cat: 'Consumables', score: 96, grade: 'A', status: 'Active' },
    { name: 'Spectra Bio Reagents', cat: 'Lab Supplies', score: 72, grade: 'C', status: 'Suspended' },
    { name: 'Prakash Health Supplies', cat: 'Consumables', score: 90, grade: 'A', status: 'Active' },
    { name: 'Nova MedEquip Traders', cat: 'Capex', score: null, grade: 'Unrated', status: 'Onboarding' },
    { name: 'LifeCare Logistics', cat: 'Services', score: 82, grade: 'B', status: 'Active' },
    { name: 'Apex Medical Systems', cat: 'Capex', score: 95, grade: 'A', status: 'Active' },
  ];
  
  return Array.from({ length: 42 }, (_, i) => {
    const base = vendors[i % vendors.length];
    const isSpecial = i % 7 === 0;
    const status = isSpecial && base.status === 'Active' ? 'Suspended' : base.status;
    
    let statusClass = 'bg-slate-100 text-slate-700';
    if (status === 'Active') statusClass = 'bg-[#1EB4A1]/20 text-[#127670]';
    if (status === 'Onboarding') statusClass = 'bg-[#E89A3C]/10 text-[#E89A3C]';
    if (status === 'Suspended') statusClass = 'bg-[#D94432]/10 text-[#D94432]';

    return {
      id: `VND-${2000 + i}`,
      name: base.name + (i > 7 ? ` ${Math.floor(i/8) + 1}` : ''),
      category: base.cat,
      contact: `contact@${base.name.toLowerCase().split(' ')[0]}.com`,
      score: base.score,
      grade: base.grade,
      status,
      statusClass,
    };
  });
};

const allVendors = generateData();

export default function VendorsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  
  const itemsPerPage = 12;

  // Apply filters
  const filteredData = allVendors.filter(item => {
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
      <NewVendorModal isOpen={vendorModalOpen} onClose={() => setVendorModalOpen(false)} />

      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Vendor Management</h1>
          <p className="text-[13px] text-slate-500 mt-1">Manage supplier onboarding, compliance, and performance ratings.</p>
        </div>
        <button 
          onClick={() => setVendorModalOpen(true)}
          className="flex items-center gap-2 bg-[#125F5C] text-white px-5 py-2.5 rounded-lg text-[14px] font-semibold hover:bg-[#0c4240] transition-colors shadow-sm whitespace-nowrap cursor-pointer"
        >
          <UserPlus size={16} strokeWidth={2.5} /> Onboard Vendor
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
                placeholder="Search vendor name, ID, or category..." 
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-md text-[13px] w-full md:w-72 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] transition-colors"
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
                  {['All', 'Active', 'Onboarding', 'Suspended'].map(opt => (
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
            <span>Showing {filteredData.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredData.length)} of {filteredData.length} vendors</span>
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
                <th className="py-3 px-4 font-medium flex items-center gap-1 cursor-pointer hover:text-slate-700">Vendor ID <ArrowUpDown size={12} /></th>
                <th className="py-3 px-4 font-medium">Vendor Name</th>
                <th className="py-3 px-4 font-medium">Category</th>
                <th className="py-3 px-4 font-medium">Contact Email</th>
                <th className="py-3 px-4 font-medium">Performance Score</th>
                <th className="py-3 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors cursor-pointer">
                  <td className="py-3 px-4 font-semibold text-slate-500">{row.id}</td>
                  <td className="py-3 px-4 text-slate-800 font-semibold">{row.name}</td>
                  <td className="py-3 px-4 text-slate-600">{row.category}</td>
                  <td className="py-3 px-4 text-slate-500">{row.contact}</td>
                  <td className="py-3 px-4">
                    {row.score ? (
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[11px] font-bold",
                          row.grade === 'A' ? "bg-[#1EB4A1]/10 text-[#127670]" :
                          row.grade === 'B' ? "bg-blue-100 text-blue-700" :
                          "bg-[#D94432]/10 text-[#D94432]"
                        )}>
                          {row.grade}
                        </span>
                        <span className="font-medium text-slate-700 flex items-center gap-1">
                          {row.score} <Star size={12} className={row.grade === 'A' ? "text-[#E89A3C] fill-[#E89A3C]" : "text-slate-300"} />
                        </span>
                      </div>
                    ) : (
                      <span className="text-[12px] font-medium text-slate-400 italic">Unrated</span>
                    )}
                  </td>
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
