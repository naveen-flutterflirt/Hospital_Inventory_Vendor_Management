"use client";

import React, { useState } from 'react';
import Header from '@/components/dashboard/Header';
import { cn } from '@/lib/utils';
import { Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, Check, Plus, Wrench } from 'lucide-react';
import LogMaintenanceModal from '@/components/dashboard/LogMaintenanceModal';
import RegisterAssetModal from '@/components/dashboard/RegisterAssetModal';

const kpis = [
  { label: 'Active Assets', value: '1,420', sub: 'Capital equipment in use' },
  { label: 'AMC Expiring Soon', value: '28', sub: 'Contracts ending in < 30 days', alert: true },
  { label: 'Open Maintenance', value: '14', sub: 'Breakdown / Preventive' },
  { label: 'Asset Value', value: '₹14.2Cr', sub: 'Net book value' },
];

// generateData was replaced by generateDeterministicData

// Fix the random serial number to be deterministic for hydration safety
const generateDeterministicData = () => {
  const departments = ['Radiology', 'ICU', 'Operation Theatre', 'Pathology Lab', 'Cardiology'];
  const vendors = ['Apex Medical Systems', 'Siemens Healthineers', 'Philips Healthcare', 'GE Medical Systems', 'Nova MedEquip Traders'];
  const equipment = ['MRI Scanner', 'Ventilator V60', 'Surgical Table Pro', 'Hematology Analyzer', 'ECG Machine 12-lead'];
  const statuses = ['Active', 'In Maintenance', 'Out of Service'];
  
  return Array.from({ length: 45 }, (_, i) => {
    const equip = equipment[i % equipment.length];
    const dept = departments[i % departments.length];
    const vendor = vendors[i % vendors.length];
    let status = statuses[i % statuses.length];
    
    // Distribute statuses realistically
    if (i % 7 === 0) status = 'In Maintenance';
    else if (i % 20 === 0) status = 'Out of Service';
    else status = 'Active';

    let statusClass = 'bg-slate-100 text-slate-700';
    if (status === 'Active') statusClass = 'bg-[#1EB4A1]/20 text-[#127670]';
    if (status === 'In Maintenance') statusClass = 'bg-[#E89A3C]/10 text-[#E89A3C]';
    if (status === 'Out of Service') statusClass = 'bg-[#D94432]/10 text-[#D94432]';

    const dayOffset = (i * 14) % 180;
    const amcExpiry = i % 8 === 0 
      ? `Expires in ${((i % 5) + 1)} days` 
      : `Valid for ${dayOffset + 30} days`;

    return {
      id: `AST-24-${1000 + i}`,
      name: equip + (i > 4 ? ` (Unit ${Math.floor(i/5) + 1})` : ''),
      serialNo: `SN-` + (i * 1234567).toString(16).padStart(8, '0').toUpperCase(),
      dept,
      vendor,
      amcExpiry,
      amcAlert: i % 8 === 0,
      status,
      statusClass,
    };
  });
};

const allAssets = generateDeterministicData();

export default function AssetsAmcPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [assetModalOpen, setAssetModalOpen] = useState(false);

  const itemsPerPage = 12;

  // Apply filters
  const filteredData = allAssets.filter(item => {
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
      <LogMaintenanceModal isOpen={maintenanceModalOpen} onClose={() => setMaintenanceModalOpen(false)} />
      <RegisterAssetModal isOpen={assetModalOpen} onClose={() => setAssetModalOpen(false)} />

      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Assets & AMC</h1>
          <p className="text-[13px] text-slate-500 mt-1">Manage capital equipment, track maintenance schedules, and renew contracts.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMaintenanceModalOpen(true)}
            className="flex items-center gap-2 bg-white border border-slate-200 text-[#2B3F54] px-5 py-2.5 rounded-lg text-[14px] font-semibold hover:bg-slate-50 transition-colors shadow-sm whitespace-nowrap cursor-pointer"
          >
            <Wrench size={16} strokeWidth={2.5} /> Log Maintenance
          </button>
          <button 
            onClick={() => setAssetModalOpen(true)}
            className="flex items-center gap-2 bg-[#125F5C] text-white px-5 py-2.5 rounded-lg text-[14px] font-semibold hover:bg-[#0c4240] transition-colors shadow-sm whitespace-nowrap cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.5} /> Register Asset
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
                placeholder="Search asset name, ID, or serial..." 
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
                  {['All', 'Active', 'In Maintenance', 'Out of Service'].map(opt => (
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
            <span>Showing {filteredData.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredData.length)} of {filteredData.length} assets</span>
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
                <th className="py-3 px-4 font-medium flex items-center gap-1 cursor-pointer hover:text-slate-700">Asset ID <ArrowUpDown size={12} /></th>
                <th className="py-3 px-4 font-medium">Asset Name / Serial</th>
                <th className="py-3 px-4 font-medium">Department</th>
                <th className="py-3 px-4 font-medium">AMC Vendor</th>
                <th className="py-3 px-4 font-medium">AMC Expiry</th>
                <th className="py-3 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors cursor-pointer">
                  <td className="py-3 px-4 font-semibold text-[#127670]">{row.id}</td>
                  <td className="py-3 px-4">
                    <p className="text-slate-800 font-medium">{row.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">{row.serialNo}</p>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{row.dept}</td>
                  <td className="py-3 px-4 text-slate-600">{row.vendor}</td>
                  <td className={cn(
                    "py-3 px-4 font-medium",
                    row.amcAlert ? 'text-[#D94432]' : 'text-slate-500'
                  )}>
                    {row.amcAlert ? <span className="flex items-center gap-1">{row.amcExpiry}</span> : row.amcExpiry}
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
