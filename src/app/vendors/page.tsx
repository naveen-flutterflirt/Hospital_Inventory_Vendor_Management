"use client";

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/dashboard/Header';
import { cn } from '@/lib/utils';
import { Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, UserPlus, Star, Check, RefreshCw } from 'lucide-react';
import NewVendorModal from '@/components/dashboard/NewVendorModal';
import { api, VendorItem, VendorPagination } from '@/lib/api';
import { SkeletonKpiCards, SkeletonTableRows } from '@/components/ui/Skeleton';

const defaultKpis = [
  { label: 'Active Vendors', value: '184', sub: 'Approved for POs', alert: false },
  { label: 'Pending Onboarding', value: '12', sub: 'Document verification', alert: false },
  { label: 'Top Performers', value: '45', sub: 'Score > 90%', alert: false },
  { label: 'Suspended', value: '3', sub: 'Compliance issues', alert: true },
];

export default function VendorsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

  const [kpis, setKpis] = useState(defaultKpis);
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [pagination, setPagination] = useState<VendorPagination>({
    currentPage: 1,
    limit: 12,
    totalItems: 0,
    totalPages: 1,
    showingStart: 0,
    showingEnd: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [kpisLoading, setKpisLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const itemsPerPage = 12;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch KPI statistics
  const fetchKpis = useCallback(async () => {
    try {
      const res = await api.vendors.getKpis();
      if (res.success && res.data) {
        setKpis([
          {
            label: res.data.active_vendors.label,
            value: res.data.active_vendors.value,
            sub: res.data.active_vendors.sub,
            alert: false,
          },
          {
            label: res.data.pending_onboarding.label,
            value: res.data.pending_onboarding.value,
            sub: res.data.pending_onboarding.sub,
            alert: false,
          },
          {
            label: res.data.top_performers.label,
            value: res.data.top_performers.value,
            sub: res.data.top_performers.sub,
            alert: false,
          },
          {
            label: res.data.suspended.label,
            value: res.data.suspended.value,
            sub: res.data.suspended.sub,
            alert: true,
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch vendor KPIs:', err);
    } finally {
      setKpisLoading(false);
    }
  }, []);

  // Fetch paginated vendors list
  const fetchVendors = useCallback(async (
    page: number,
    filter: string,
    search: string,
    sort: string,
    order: 'ASC' | 'DESC'
  ) => {
    setIsLoading(true);
    try {
      const res = await api.vendors.getVendors({
        page,
        limit: itemsPerPage,
        status: filter !== 'All' ? filter : undefined,
        search: search.trim() || undefined,
        sortBy: sort,
        sortOrder: order,
      });

      if (res.success && res.data) {
        setVendors(res.data.items || []);
        setPagination(res.data.pagination || {
          currentPage: page,
          limit: itemsPerPage,
          totalItems: res.data.items?.length || 0,
          totalPages: 1,
          showingStart: 1,
          showingEnd: res.data.items?.length || 0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch vendors formulary:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [itemsPerPage]);

  // Refresh both metrics and table
  const refreshAllData = useCallback(() => {
    setIsRefreshing(true);
    fetchKpis();
    fetchVendors(currentPage, activeFilter, debouncedSearch, sortBy, sortOrder);
  }, [fetchKpis, fetchVendors, currentPage, activeFilter, debouncedSearch, sortBy, sortOrder]);

  // Trigger query on parameter change
  useEffect(() => {
    fetchVendors(currentPage, activeFilter, debouncedSearch, sortBy, sortOrder);
  }, [fetchVendors, currentPage, activeFilter, debouncedSearch, sortBy, sortOrder]);

  // Initial load
  useEffect(() => {
    fetchKpis();
  }, [fetchKpis]);

  // Sort toggle handler
  const handleSortToggle = (column: string) => {
    if (sortBy === column) {
      setSortOrder(prev => (prev === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortBy(column);
      setSortOrder('ASC');
    }
    setCurrentPage(1);
  };

  return (
    <div className="p-3 sm:p-4 pt-16 md:p-8 max-w-[1400px] mx-auto flex flex-col gap-4 font-sans h-full">
      <Header />
      
      {/* Modal */}
      <NewVendorModal 
        isOpen={vendorModalOpen} 
        onClose={() => setVendorModalOpen(false)} 
        onSuccess={refreshAllData}
      />

      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mt-1 sm:mt-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Vendor Management</h1>
            <button
              onClick={refreshAllData}
              title="Refresh vendor metrics"
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <RefreshCw size={14} className={cn(isRefreshing && "animate-spin text-[#127670]")} />
            </button>
          </div>
          <p className="text-[12px] sm:text-[13px] text-slate-500 mt-0.5 sm:mt-1">
            Manage supplier onboarding, compliance, and performance ratings.
          </p>
        </div>
        <button 
          onClick={() => setVendorModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#125F5C] text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-[13px] sm:text-[14px] font-semibold hover:bg-[#0c4240] transition-colors shadow-sm whitespace-nowrap cursor-pointer w-full sm:w-auto"
        >
          <UserPlus size={16} strokeWidth={2.5} /> Onboard Vendor
        </button>
      </div>

      {/* KPI Row */}
      {kpisLoading ? (
        <SkeletonKpiCards count={4} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
          {kpis.map((kpi, i) => (
            <div key={i} className="bg-white p-3 sm:p-4 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
              <h3 className="text-[11px] sm:text-[13px] text-slate-500 font-medium mb-1 truncate">{kpi.label}</h3>
              <p className={cn("text-lg sm:text-2xl font-bold tracking-tight mb-0.5 sm:mb-1 truncate", kpi.alert ? "text-[#D94432]" : "text-slate-800")}>{kpi.value}</p>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">{kpi.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Data Table Section */}
      <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col flex-1 overflow-hidden">
        
        {/* Table Toolbar */}
        <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input 
                type="text" 
                placeholder="Search vendor name, ID, or category..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 border border-slate-200 rounded-md text-[13px] w-full focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] transition-colors"
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
                    {['All', 'Active', 'Onboarding', 'Suspended'].map(opt => (
                      <button 
                        key={opt}
                        onClick={() => {
                          setActiveFilter(opt);
                          setCurrentPage(1);
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

            {/* Reset filter button */}
            {(activeFilter !== 'All' || debouncedSearch) && (
              <button
                onClick={() => {
                  setActiveFilter('All');
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="text-[12px] text-slate-500 hover:text-slate-800 underline underline-offset-2 cursor-pointer whitespace-nowrap"
              >
                Reset filters
              </button>
            )}

          </div>

          {/* Pagination Toolbar Header */}
          <div className="flex items-center justify-between md:justify-end gap-3 text-[12px] sm:text-[13px] font-medium text-slate-500 w-full md:w-auto">
            <span className="truncate">
              {pagination.totalItems > 0
                ? `Showing ${pagination.showingStart}-${pagination.showingEnd} of ${pagination.totalItems}`
                : 'Showing 0 vendors'}
            </span>
            <div className="flex gap-1 items-center flex-shrink-0">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || isLoading}
                className="p-1 rounded-md hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-600 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNumber = i + 1;
                if (pagination.totalPages > 5 && currentPage > 3) {
                  pageNumber = Math.min(currentPage - 2 + i, pagination.totalPages - 4 + i);
                }
                return (
                  <button 
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={cn(
                      "w-6 h-6 rounded-md flex items-center justify-center transition-colors cursor-pointer text-[12px]", 
                      currentPage === pageNumber ? "bg-slate-200 text-slate-800 font-bold" : "hover:bg-slate-100 text-slate-600"
                    )}
                  >
                    {pageNumber}
                  </button>
                );
              })}

              <button 
                onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage >= pagination.totalPages || isLoading}
                className="p-1 rounded-md hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-600 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto w-full relative">
          <table className="w-full text-[13px] text-left whitespace-nowrap min-w-[900px]">
            <thead>
              <tr className="text-slate-500 border-b border-slate-100 font-medium bg-slate-50/50">
                <th 
                  onClick={() => handleSortToggle('id')}
                  className="py-3 px-4 font-medium flex items-center gap-1 cursor-pointer hover:text-slate-700 select-none"
                  title="Sort by Vendor ID"
                >
                  Vendor ID <ArrowUpDown size={12} className={cn("transition-transform", sortBy === 'id' && sortOrder === 'DESC' && "rotate-180 text-[#127670]")} />
                </th>
                <th 
                  onClick={() => handleSortToggle('name')}
                  className="py-3 px-4 font-medium cursor-pointer hover:text-slate-700 select-none"
                  title="Sort by Vendor Name"
                >
                  Vendor Name
                </th>
                <th className="py-3 px-4 font-medium">Category</th>
                <th className="py-3 px-4 font-medium">Contact Email</th>
                <th 
                  onClick={() => handleSortToggle('score')}
                  className="py-3 px-4 font-medium cursor-pointer hover:text-slate-700 select-none"
                  title="Sort by Performance Score"
                >
                  Performance Score
                </th>
                <th className="py-3 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonTableRows rows={8} columns={6} />
              ) : vendors.length > 0 ? (
                vendors.map((row) => (
                  <tr key={row.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-500">{row.vendor_code}</td>
                    <td className="py-3 px-4 text-slate-800 font-semibold">{row.name}</td>
                    <td className="py-3 px-4 text-slate-600">{row.category}</td>
                    <td className="py-3 px-4 text-slate-500">{row.contact}</td>
                    <td className="py-3 px-4">
                      {row.score !== null ? (
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[11px] font-bold",
                            row.grade_class
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
                      <span className={cn("px-2.5 py-1 rounded-md text-[11px] font-semibold", row.status_class)}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <p className="text-[14px] font-medium text-slate-600">No vendors match your search or filter</p>
                    <p className="text-[12px] text-slate-400 mt-1">Try clearing filters or searching with a different term.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
