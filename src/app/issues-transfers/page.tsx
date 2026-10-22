"use client";

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/dashboard/Header';
import { cn } from '@/lib/utils';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  ArrowRightLeft, 
  RefreshCw, 
  Check, 
  X,
  PackageCheck
} from 'lucide-react';
import NewTransferModal from '@/components/dashboard/NewTransferModal';
import NewIssueModal from '@/components/dashboard/NewIssueModal';
import TransferDetailsModal from '@/components/dashboard/TransferDetailsModal';
import { api, StockTransferItem, TransferPagination } from '@/lib/api';
import { SkeletonTableRows, SkeletonKpiCards } from '@/components/ui/Skeleton';

const defaultKpis = [
  { label: 'Pending Fulfillment', value: '24', sub: 'Ward indents', alert: true },
  { label: 'Issued Today', value: '142', sub: 'To patients & wards', alert: false },
  { label: 'Store Transfers', value: '8', sub: 'In transit', alert: false },
  { label: 'Ward Returns', value: '3', sub: 'Pending restock', alert: false },
];

export default function IssuesTransfersPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'DESC' | 'ASC'>('DESC');

  // Modals
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [selectedTransferId, setSelectedTransferId] = useState<number | null>(null);

  // Live State
  const [kpis, setKpis] = useState(defaultKpis);
  const [transfers, setTransfers] = useState<StockTransferItem[]>([]);
  const [pagination, setPagination] = useState<TransferPagination>({
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

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load live KPIs from API
  const fetchKpis = useCallback(async () => {
    try {
      const res = await api.transfers.getKpis();
      if (res.success && res.data) {
        setKpis([
          {
            label: res.data.pending_fulfillment.label,
            value: res.data.pending_fulfillment.value,
            sub: res.data.pending_fulfillment.sub,
            alert: true,
          },
          {
            label: res.data.issued_today.label,
            value: res.data.issued_today.value,
            sub: res.data.issued_today.sub,
            alert: false,
          },
          {
            label: res.data.store_transfers.label,
            value: res.data.store_transfers.value,
            sub: res.data.store_transfers.sub,
            alert: false,
          },
          {
            label: res.data.ward_returns.label,
            value: res.data.ward_returns.value,
            sub: res.data.ward_returns.sub,
            alert: false,
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch transfer KPIs:', err);
    } finally {
      setKpisLoading(false);
    }
  }, []);

  // Load transfers table data from API
  const fetchTransfers = useCallback(async (
    page: number, 
    status: string, 
    type: string, 
    search: string, 
    order: 'DESC' | 'ASC'
  ) => {
    setIsLoading(true);
    try {
      const res = await api.transfers.getTransfers({
        page,
        limit: itemsPerPage,
        status: status !== 'All' ? status : undefined,
        type: type !== 'All' ? type : undefined,
        search: search.trim() || undefined,
        sortBy: 'id',
        sortOrder: order,
      });

      if (res.success && res.data) {
        setTransfers(res.data.items || []);
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
      console.error('Failed to fetch transfers list:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [itemsPerPage]);

  // Refresh both KPIs and table data
  const refreshAllData = useCallback(() => {
    setIsRefreshing(true);
    fetchKpis();
    fetchTransfers(currentPage, statusFilter, typeFilter, debouncedSearch, sortOrder);
  }, [fetchKpis, fetchTransfers, currentPage, statusFilter, typeFilter, debouncedSearch, sortOrder]);

  // Fetch when page, filter, search, or sort changes
  useEffect(() => {
    fetchTransfers(currentPage, statusFilter, typeFilter, debouncedSearch, sortOrder);
  }, [fetchTransfers, currentPage, statusFilter, typeFilter, debouncedSearch, sortOrder]);

  // Initial load for KPIs
  useEffect(() => {
    fetchKpis();
  }, [fetchKpis]);

  // Toggle ID sort order
  const handleSortToggle = () => {
    const nextOrder = sortOrder === 'DESC' ? 'ASC' : 'DESC';
    setSortOrder(nextOrder);
    setCurrentPage(1);
  };

  // Reset all filters
  const resetFilters = () => {
    setStatusFilter('All');
    setTypeFilter('All');
    setSearchTerm('');
    setDebouncedSearch('');
    setCurrentPage(1);
  };

  const hasActiveFilters = statusFilter !== 'All' || typeFilter !== 'All' || searchTerm.trim().length > 0;

  return (
    <div className="p-4 pt-16 md:p-8 max-w-[1400px] mx-auto flex flex-col gap-4 font-sans h-full">
      <Header />
      
      {/* Modals */}
      <NewTransferModal 
        isOpen={transferModalOpen} 
        onClose={() => setTransferModalOpen(false)} 
        onSuccess={refreshAllData}
      />
      <NewIssueModal 
        isOpen={issueModalOpen} 
        onClose={() => setIssueModalOpen(false)} 
        onSuccess={refreshAllData}
      />
      <TransferDetailsModal
        isOpen={selectedTransferId !== null}
        transferId={selectedTransferId}
        onClose={() => setSelectedTransferId(null)}
        onSuccess={refreshAllData}
      />

      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Issues & Transfers</h1>
            <button
              onClick={refreshAllData}
              title="Refresh internal transfers ledger"
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <RefreshCw size={14} className={cn(isRefreshing && "animate-spin text-[#127670]")} />
            </button>
          </div>
          <p className="text-[13px] text-slate-500 mt-1">Manage internal stock movements between stores, wards, and patients.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setTransferModalOpen(true)}
            className="flex items-center gap-2 bg-white border border-slate-200 text-[#2B3F54] px-4 sm:px-5 py-2.5 rounded-lg text-[13px] sm:text-[14px] font-semibold hover:bg-slate-50 transition-colors shadow-sm whitespace-nowrap cursor-pointer"
          >
            <ArrowRightLeft size={16} strokeWidth={2.5} /> Stock Transfer
          </button>
          <button 
            onClick={() => setIssueModalOpen(true)}
            className="flex items-center gap-2 bg-[#125F5C] text-white px-4 sm:px-5 py-2.5 rounded-lg text-[13px] sm:text-[14px] font-semibold hover:bg-[#0c4240] transition-colors shadow-sm whitespace-nowrap cursor-pointer"
          >
            <Send size={16} strokeWidth={2.5} /> Issue Items
          </button>
        </div>
      </div>

      {/* KPI Row */}
      {kpisLoading ? (
        <SkeletonKpiCards count={4} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <div key={i} className="bg-white p-4 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col justify-between">
              <h3 className="text-[13px] text-slate-500 font-medium mb-1">{kpi.label}</h3>
              <p className={cn("text-2xl font-bold tracking-tight mb-1", kpi.alert ? "text-[#D94432]" : "text-slate-800")}>{kpi.value}</p>
              <p className="text-[11px] text-slate-400 font-medium">{kpi.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Data Table Section */}
      <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col flex-1 overflow-hidden">
        
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 md:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search transfer ID, store, or patient..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-md text-[13px] w-full md:w-72 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] transition-colors"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 border rounded-md text-[13px] font-semibold transition-colors cursor-pointer",
                  statusFilter !== 'All' 
                    ? "bg-[#1EB4A1]/10 border-[#1EB4A1]/30 text-[#127670]" 
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                <Filter size={14} /> 
                {statusFilter === 'All' ? 'Filters' : statusFilter}
              </button>

              {filtersOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Status Filter
                  </div>
                  {['All', 'Completed', 'In Transit', 'Pending', 'Cancelled'].map(opt => (
                    <button 
                      key={opt}
                      onClick={() => {
                        setStatusFilter(opt);
                        setCurrentPage(1);
                        setFiltersOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-1.5 text-[13px] flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer",
                        statusFilter === opt ? "text-[#127670] font-semibold bg-[#1EB4A1]/10" : "text-slate-700"
                      )}
                    >
                      <span>{opt}</span>
                      {statusFilter === opt && <Check size={14} className="text-[#127670]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Type Selector Dropdown */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={cn(
                "px-3 py-2 border rounded-md text-[13px] font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] transition-colors cursor-pointer",
                typeFilter !== 'All' ? "border-[#1EB4A1] text-[#127670] font-semibold bg-[#1EB4A1]/10" : "border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              <option value="All">All Types</option>
              <option value="Store Transfer">Store Transfer</option>
              <option value="Ward Issue">Ward Issue</option>
              <option value="Patient Issue">Patient Issue</option>
              <option value="Ward Return">Ward Return</option>
            </select>

            {/* Reset Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer font-medium"
              >
                <X size={13} /> Reset
              </button>
            )}
          </div>

          {/* Pagination Counter & Navigation */}
          <div className="flex items-center gap-4 text-[13px] font-medium text-slate-500">
            <span>
              Showing {pagination.showingStart}-{pagination.showingEnd} of {pagination.totalItems} records
            </span>
            <div className="flex gap-1 items-center">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isLoading}
                className="p-1 rounded-md hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-600 cursor-pointer"
                title="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                // Smart pagination windowing
                let pageNumber = i + 1;
                if (pagination.totalPages > 5 && currentPage > 3) {
                  pageNumber = currentPage - 2 + i;
                  if (pageNumber > pagination.totalPages) {
                    pageNumber = pagination.totalPages - (4 - i);
                  }
                }
                if (pageNumber <= 0 || pageNumber > pagination.totalPages) return null;

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
                title="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto w-full relative min-h-[300px]">
          <table className="w-full text-[13px] text-left whitespace-nowrap min-w-[900px]">
            <thead>
              <tr className="text-slate-500 border-b border-slate-100 font-medium bg-slate-50/50">
                <th 
                  onClick={handleSortToggle}
                  className="py-3 px-4 font-medium flex items-center gap-1 cursor-pointer hover:text-slate-800 transition-colors select-none"
                >
                  Txn ID <ArrowUpDown size={12} className={cn(sortOrder === 'ASC' && "rotate-180")} />
                </th>
                <th className="py-3 px-4 font-medium">Type</th>
                <th className="py-3 px-4 font-medium">From Store</th>
                <th className="py-3 px-4 font-medium">To Store / Patient</th>
                <th className="py-3 px-4 font-medium text-right">Lines</th>
                <th className="py-3 px-4 font-medium">Date</th>
                <th className="py-3 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonTableRows rows={8} columns={7} />
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <PackageCheck size={32} className="text-slate-300" />
                      <p className="font-medium text-slate-600">No stock transfers or issues found</p>
                      <p className="text-xs text-slate-400">Try adjusting your search criteria or status filter.</p>
                      {hasActiveFilters && (
                        <button
                          onClick={resetFilters}
                          className="mt-2 text-xs font-semibold text-[#127670] hover:underline cursor-pointer"
                        >
                          Clear active filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                transfers.map((row) => (
                  <tr 
                    key={row.id} 
                    onClick={() => setSelectedTransferId(row.id)}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    title="Click to view details and update status"
                  >
                    <td className="py-3 px-4 font-semibold text-[#127670] group-hover:underline">
                      {row.transfer_number}
                    </td>
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
                      <span className={cn("px-2.5 py-1 rounded-md text-[11px] font-semibold inline-block", row.status_class)}>
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
