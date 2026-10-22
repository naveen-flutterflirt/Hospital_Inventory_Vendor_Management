"use client";

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/dashboard/Header';
import { cn } from '@/lib/utils';
import { Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, Check, CreditCard, Receipt, RefreshCw } from 'lucide-react';
import LogInvoiceModal from '@/components/dashboard/LogInvoiceModal';
import SettlePaymentModal from '@/components/dashboard/SettlePaymentModal';
import { api, InvoiceItem, InvoicePagination } from '@/lib/api';
import { SkeletonKpiCards, SkeletonTableRows } from '@/components/ui/Skeleton';

const defaultKpis = [
  { label: 'Total Outstanding', value: '₹14.2L', sub: 'Across 45 active invoices', alert: false },
  { label: 'Overdue Payments', value: '₹3.8L', sub: 'Requires immediate action', alert: true },
  { label: 'Awaiting GRN Match', value: '8', sub: '3-way match pending', alert: false },
  { label: 'Processed Today', value: '₹1.1L', sub: 'Synced to accounting', alert: false },
];

export default function InvoicesPaymentsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'DESC' | 'ASC'>('DESC');
  
  const [kpis, setKpis] = useState(defaultKpis);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [pagination, setPagination] = useState<InvoicePagination>({
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

  const [logModalOpen, setLogModalOpen] = useState(false);
  const [settleModalOpen, setSettleModalOpen] = useState(false);

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
      const res = await api.invoices.getKpis();
      if (res.success && res.data) {
        setKpis([
          {
            label: res.data.total_outstanding.label,
            value: res.data.total_outstanding.value,
            sub: res.data.total_outstanding.sub,
            alert: false,
          },
          {
            label: res.data.overdue_payments.label,
            value: res.data.overdue_payments.value,
            sub: res.data.overdue_payments.sub,
            alert: true,
          },
          {
            label: res.data.awaiting_grn_match.label,
            value: res.data.awaiting_grn_match.value,
            sub: res.data.awaiting_grn_match.sub,
            alert: false,
          },
          {
            label: res.data.processed_today.label,
            value: res.data.processed_today.value,
            sub: res.data.processed_today.sub,
            alert: false,
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch invoice KPIs:', err);
    } finally {
      setKpisLoading(false);
    }
  }, []);

  // Load invoices table data from API
  const fetchInvoices = useCallback(async (page: number, filter: string, search: string, order: 'DESC' | 'ASC') => {
    setIsLoading(true);
    try {
      const res = await api.invoices.getInvoices({
        page,
        limit: itemsPerPage,
        status: filter !== 'All' ? filter : undefined,
        search: search.trim() || undefined,
        sortBy: 'id',
        sortOrder: order,
      });

      if (res.success && res.data) {
        setInvoices(res.data.items || []);
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
      console.error('Failed to fetch invoices list:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [itemsPerPage]);

  // Refresh both KPIs and table
  const refreshAllData = useCallback(() => {
    setIsRefreshing(true);
    fetchKpis();
    fetchInvoices(currentPage, activeFilter, debouncedSearch, sortOrder);
  }, [fetchKpis, fetchInvoices, currentPage, activeFilter, debouncedSearch, sortOrder]);

  // Fetch when page, filter, search, or sort changes
  useEffect(() => {
    fetchInvoices(currentPage, activeFilter, debouncedSearch, sortOrder);
  }, [fetchInvoices, currentPage, activeFilter, debouncedSearch, sortOrder]);

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

  return (
    <div className="p-4 pt-16 md:p-8 max-w-[1400px] mx-auto flex flex-col gap-4 font-sans h-full">
      <Header />
      
      {/* Modals */}
      <LogInvoiceModal 
        isOpen={logModalOpen} 
        onClose={() => setLogModalOpen(false)} 
        onSuccess={refreshAllData}
      />
      <SettlePaymentModal 
        isOpen={settleModalOpen} 
        onClose={() => setSettleModalOpen(false)} 
        onSuccess={refreshAllData}
      />

      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Invoices & Payments</h1>
            <button
              onClick={refreshAllData}
              title="Refresh ledger data"
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <RefreshCw size={14} className={cn(isRefreshing && "animate-spin text-[#127670]")} />
            </button>
          </div>
          <p className="text-[13px] text-slate-500 mt-1">Manage accounts payable, 3-way matching, and ledger sync.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setLogModalOpen(true)}
            className="flex items-center gap-2 bg-white border border-slate-200 text-[#2B3F54] px-4 sm:px-5 py-2.5 rounded-lg text-[13px] sm:text-[14px] font-semibold hover:bg-slate-50 transition-colors shadow-sm whitespace-nowrap cursor-pointer"
          >
            <Receipt size={16} strokeWidth={2.5} /> Log Invoice
          </button>
          <button 
            onClick={() => setSettleModalOpen(true)}
            className="flex items-center gap-2 bg-[#125F5C] text-white px-4 sm:px-5 py-2.5 rounded-lg text-[13px] sm:text-[14px] font-semibold hover:bg-[#0c4240] transition-colors shadow-sm whitespace-nowrap cursor-pointer"
          >
            <CreditCard size={16} strokeWidth={2.5} /> Settle Payments
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
                placeholder="Search invoice ID, vendor, or PO..." 
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
                  {['All', 'Pending', 'Processing', 'Overdue', 'Pending GRN', 'Paid'].map(opt => (
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
              )}
            </div>

            {/* Clear filter indicator */}
            {(activeFilter !== 'All' || debouncedSearch) && (
              <button
                onClick={() => {
                  setActiveFilter('All');
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="text-[12px] text-slate-500 hover:text-slate-800 underline underline-offset-2 cursor-pointer"
              >
                Reset filters
              </button>
            )}

          </div>

          {/* Pagination Toolbar Header */}
          <div className="flex items-center justify-between md:justify-end gap-4 text-[13px] font-medium text-slate-500">
            <span>
              {pagination.totalItems > 0 
                ? `Showing ${pagination.showingStart}-${pagination.showingEnd} of ${pagination.totalItems} invoices`
                : 'Showing 0 invoices'}
            </span>
            <div className="flex gap-1 items-center">
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
                  onClick={handleSortToggle}
                  className="py-3 px-4 font-medium flex items-center gap-1 cursor-pointer hover:text-slate-700 select-none"
                  title="Click to toggle sorting"
                >
                  Invoice ID <ArrowUpDown size={12} className={cn("transition-transform", sortOrder === 'ASC' && "rotate-180")} />
                </th>
                <th className="py-3 px-4 font-medium">Vendor</th>
                <th className="py-3 px-4 font-medium">Ref. PO</th>
                <th className="py-3 px-4 font-medium text-right">Amount</th>
                <th className="py-3 px-4 font-medium">Due / Status</th>
                <th className="py-3 px-4 font-medium">AP Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonTableRows rows={8} columns={6} />
              ) : invoices.length > 0 ? (
                invoices.map((row) => (
                  <tr key={row.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#127670]">{row.invoice_number}</td>
                    <td className="py-3 px-4 text-slate-800 font-medium">{row.vendor}</td>
                    <td className="py-3 px-4 text-slate-600">{row.po_ref}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-800">{row.amount_formatted}</td>
                    <td className={cn(
                      "py-3 px-4 font-medium",
                      row.status === 'Overdue' ? 'text-[#D94432]' : row.status === 'Paid' ? 'text-[#127670]' : 'text-slate-500'
                    )}>
                      {row.due_status}
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
                    <p className="text-[14px] font-medium text-slate-600">No invoices match your criteria</p>
                    <p className="text-[12px] text-slate-400 mt-1">Try searching for a different ID, vendor, or changing the filter.</p>
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
