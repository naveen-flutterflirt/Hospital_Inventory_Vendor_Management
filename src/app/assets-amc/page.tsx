"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from '@/components/dashboard/Header';
import { cn } from '@/lib/utils';
import { Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, Check, Plus, Wrench, RotateCw, AlertCircle } from 'lucide-react';
import LogMaintenanceModal from '@/components/dashboard/LogMaintenanceModal';
import RegisterAssetModal from '@/components/dashboard/RegisterAssetModal';
import { api, AssetItem, AssetPagination, AssetKpisResponse } from '@/lib/api';
import { SkeletonKpiCards, SkeletonTableRows } from '@/components/ui/Skeleton';

const defaultKpis: AssetKpisResponse = {
  active_assets: { label: 'Active Assets', value: '1,420', sub: 'Capital equipment in use', raw: 1420 },
  amc_expiring_soon: { label: 'AMC Expiring Soon', value: '28', sub: 'Contracts ending in < 30 days', alert: true, raw: 28 },
  open_maintenance: { label: 'Open Maintenance', value: '14', sub: 'Breakdown / Preventive', raw: 14 },
  asset_value: { label: 'Asset Value', value: '₹14.2Cr', sub: 'Net book value', raw: 142000000 },
};

export default function AssetsAmcPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [assetModalOpen, setAssetModalOpen] = useState(false);

  // Live Data State
  const [kpis, setKpis] = useState<AssetKpisResponse>(defaultKpis);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [pagination, setPagination] = useState<AssetPagination>({
    currentPage: 1,
    limit: 12,
    totalItems: 45,
    totalPages: 4,
    showingStart: 1,
    showingEnd: 12,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Debounce search input by 300ms
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setCurrentPage(1); // reset to page 1 on new search
    }, 300);
  };

  // Fetch live KPIs and Assets from PostgreSQL
  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMessage(null);

    try {
      const [kpiRes, assetsRes] = await Promise.allSettled([
        api.assets.getKpis(),
        api.assets.getAssets({
          page: currentPage,
          limit: 12,
          search: debouncedSearch,
          status: activeFilter,
        }),
      ]);

      if (kpiRes.status === 'fulfilled' && kpiRes.value.success && kpiRes.value.data) {
        setKpis(kpiRes.value.data);
      }

      if (assetsRes.status === 'fulfilled' && assetsRes.value.success && assetsRes.value.data) {
        setAssets(assetsRes.value.data.items || []);
        setPagination(assetsRes.value.data.pagination);
      } else if (assetsRes.status === 'rejected') {
        throw new Error('Failed to load assets table data');
      }
    } catch (err: any) {
      console.error('Assets load error:', err);
      setErrorMessage(err.message || 'Could not connect to assets database.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, debouncedSearch, activeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const kpiCards = [
    kpis.active_assets,
    kpis.amc_expiring_soon,
    kpis.open_maintenance,
    kpis.asset_value,
  ];

  const getStatusBadge = (status: string) => {
    if (status === 'Active') {
      return 'bg-[#1EB4A1]/20 text-[#127670]';
    }
    if (status === 'In Maintenance') {
      return 'bg-[#E89A3C]/10 text-[#E89A3C]';
    }
    if (status === 'Out of Service') {
      return 'bg-[#D94432]/10 text-[#D94432]';
    }
    return 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="p-3 sm:p-4 pt-16 md:p-8 max-w-[1400px] mx-auto flex flex-col gap-4 font-sans h-full">
      <Header />
      
      {/* Modals */}
      <LogMaintenanceModal 
        isOpen={maintenanceModalOpen} 
        onClose={() => setMaintenanceModalOpen(false)} 
        onMaintenanceLogged={() => fetchData(true)}
      />
      <RegisterAssetModal 
        isOpen={assetModalOpen} 
        onClose={() => setAssetModalOpen(false)} 
        onAssetRegistered={() => fetchData(true)}
      />

      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mt-1 sm:mt-2">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Assets & AMC
            {loading && <span className="text-[11px] font-normal text-slate-400 animate-pulse">(Connecting to database...)</span>}
          </h1>
          <p className="text-[12px] sm:text-[13px] text-slate-500 mt-0.5 sm:mt-1">Manage capital equipment, track maintenance schedules, and renew contracts.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 text-slate-600 p-2 sm:px-3 sm:py-2.5 rounded-lg text-[13px] font-semibold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer disabled:opacity-50 shrink-0"
            title="Refresh assets data"
          >
            <RotateCw size={15} className={cn(refreshing && "animate-spin text-[#127670]")} />
            <span className="hidden md:inline">Refresh</span>
          </button>
          <button 
            onClick={() => setMaintenanceModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-white border border-slate-200 text-[#2B3F54] px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-[12px] sm:text-[14px] font-semibold hover:bg-slate-50 transition-colors shadow-sm whitespace-nowrap cursor-pointer"
          >
            <Wrench size={15} strokeWidth={2.5} /> Log Maintenance
          </button>
          <button 
            onClick={() => setAssetModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-[#125F5C] text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-[12px] sm:text-[14px] font-semibold hover:bg-[#0c4240] transition-colors shadow-sm whitespace-nowrap cursor-pointer"
          >
            <Plus size={15} strokeWidth={2.5} /> Register Asset
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between gap-2 text-[13px] text-amber-800">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button 
            onClick={() => fetchData(true)} 
            className="text-amber-700 underline font-semibold text-[12px] hover:text-amber-900 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Row */}
      {loading && !refreshing ? (
        <SkeletonKpiCards count={4} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
          {kpiCards.map((kpi, i) => (
            <div key={i} className="bg-white p-3 sm:p-4 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
              <h3 className="text-[11px] sm:text-[13px] text-slate-500 font-medium mb-1 truncate">{kpi.label}</h3>
              <p className={cn("text-lg sm:text-2xl font-bold tracking-tight mb-0.5 sm:mb-1 truncate", kpi.alert ? "text-[#D94432]" : "text-slate-800")}>
                {kpi.value}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">{kpi.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Data Table Section */}
      <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col flex-1 overflow-hidden">
        
        {/* Table Toolbar */}
        <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input 
                type="text" 
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search asset, ID, serial..." 
                className="pl-9 pr-3 py-2 border border-slate-200 rounded-md text-[13px] w-full focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] transition-colors bg-white font-medium placeholder-slate-400"
              />
            </div>
            
            {/* Filter Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 border rounded-md text-[13px] font-semibold transition-colors cursor-pointer whitespace-nowrap",
                  activeFilter !== 'All' 
                    ? "bg-[#1EB4A1]/10 border-[#1EB4A1]/30 text-[#127670]" 
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                <Filter size={14} /> 
                <span className="hidden sm:inline">{activeFilter === 'All' ? 'Filters' : activeFilter}</span>
                <span className="sm:hidden">{activeFilter === 'All' ? 'Filter' : activeFilter}</span>
              </button>
              
              {filtersOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setFiltersOpen(false)} />
                  <div className="absolute top-full right-0 sm:left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-2">
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
                </>
              )}
            </div>

          </div>

          {/* Pagination summary & Controls */}
          <div className="flex items-center justify-between gap-3 text-[12px] sm:text-[13px] font-medium text-slate-500 w-full md:w-auto">
            <span className="truncate">
              Showing {pagination.totalItems > 0 ? pagination.showingStart : 0}-{pagination.showingEnd} of {pagination.totalItems}
            </span>
            <div className="flex gap-1 items-center flex-shrink-0">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
                className="p-1 rounded-md hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-600 cursor-pointer"
                title="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                  <button 
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    disabled={loading}
                    className={cn(
                      "w-6 h-6 rounded-md flex items-center justify-center transition-colors cursor-pointer text-[12px]", 
                      currentPage === page ? "bg-slate-200 text-slate-800 font-bold" : "hover:bg-slate-100 text-slate-600"
                    )}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages || loading}
                className="p-1 rounded-md hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-600 cursor-pointer"
                title="Next page"
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
              {loading && !refreshing ? (
                <SkeletonTableRows rows={8} columns={6} />
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No matching capital assets found. Try adjusting your search or filters.
                  </td>
                </tr>
              ) : (
                assets.map((row) => (
                  <tr key={row.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors cursor-pointer">
                    <td className="py-3 px-4 font-semibold text-[#127670]">{row.asset_tag}</td>
                    <td className="py-3 px-4">
                      <p className="text-slate-800 font-medium">{row.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">{row.serial_no}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{row.department}</td>
                    <td className="py-3 px-4 text-slate-600">{row.vendor_name}</td>
                    <td className={cn(
                      "py-3 px-4 font-medium",
                      row.amc_alert ? 'text-[#D94432]' : 'text-slate-500'
                    )}>
                      {row.amc_expiry}
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn("px-2.5 py-1 rounded-md text-[11px] font-semibold", getStatusBadge(row.status))}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
