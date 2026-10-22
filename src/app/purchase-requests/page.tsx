"use client";

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/dashboard/Header';
import { cn } from '@/lib/utils';
import { 
  Search, ArrowUpDown, ChevronLeft, ChevronRight, Plus, 
  RefreshCw, Loader2, AlertCircle, Eye, X
} from 'lucide-react';
import NewPRModal from '@/components/dashboard/NewPRModal';
import PrDetailsModal from '@/components/dashboard/PrDetailsModal';
import { api, PrItem, PrKpiItem } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { SkeletonKpiCards, SkeletonTableRows } from '@/components/ui/Skeleton';

export default function PurchaseRequestsPage() {
  const { toast } = useToast();

  // Data State
  const [kpis, setKpis] = useState<PrKpiItem[]>([]);
  const [prs, setPrs] = useState<PrItem[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);

  // Loading States
  const [loading, setLoading] = useState<boolean>(true);
  const [kpisLoading, setKpisLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filters & Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // Modals
  const [prModalOpen, setPrModalOpen] = useState<boolean>(false);
  const [selectedPrForDetail, setSelectedPrForDetail] = useState<PrItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);

  const itemsPerPage = 10;

  // Load KPI metrics from database
  const loadKpis = useCallback(async () => {
    setKpisLoading(true);
    try {
      const res = await api.purchaseRequests.getKpis();
      if (res.success && res.data) {
        setKpis(res.data);
      }
    } catch (err) {
      console.error('Failed to load PR KPIs:', err);
    } finally {
      setKpisLoading(false);
    }
  }, []);

  // Load Lookups (Departments)
  const loadLookups = useCallback(async () => {
    try {
      const res = await api.purchaseRequests.getLookups();
      if (res.success && res.data?.departments) {
        setDepartments(res.data.departments);
      }
    } catch (err) {
      console.error('Failed to load PR lookups:', err);
    }
  }, []);

  // Load paginated PR list from database
  const loadPurchaseRequests = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.purchaseRequests.getAll({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery,
        status: selectedStatus,
        department: selectedDept,
        sortBy,
        sortOrder,
      });

      if (res.success && res.data) {
        setPrs(res.data.purchaseRequests);
        setTotalPages(res.data.pagination.totalPages || 1);
        setTotalCount(res.data.pagination.total || 0);
      }
    } catch (err) {
      console.error('Failed to load purchase requests:', err);
      toast.error('Could not fetch purchase requests from database.', 'Network Error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, searchQuery, selectedStatus, selectedDept, sortBy, sortOrder, toast]);

  // Initial load
  useEffect(() => {
    loadKpis();
    loadLookups();
  }, [loadKpis, loadLookups]);

  // Reload data when filters change
  useEffect(() => {
    loadPurchaseRequests();
  }, [loadPurchaseRequests]);

  const handleRowClick = (pr: PrItem) => {
    setSelectedPrForDetail(pr);
    setDetailModalOpen(true);
  };

  const handleSortToggle = (column: string) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(column);
      setSortOrder('DESC');
    }
    setCurrentPage(1);
  };

  const handleQuickApprove = async (e: React.MouseEvent, pr: PrItem) => {
    e.stopPropagation();
    try {
      const res = await api.purchaseRequests.updateStatus(pr.id, {
        status: 'Approved',
        approvedBy: 'Procurement Committee',
      });
      if (res.success) {
        toast.success(`Purchase request ${pr.prNumber} approved!`, 'Approved');
        loadKpis();
        loadPurchaseRequests(true);
      } else {
        toast.error(res.message || 'Approval failed', 'Error');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error occurred', 'Error');
    }
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + prs.length;

  return (
    <div className="p-4 pt-16 md:p-8 max-w-[1400px] mx-auto flex flex-col gap-4 font-sans h-full">
      <Header />
      
      {/* Create Requisition Modal */}
      <NewPRModal 
        isOpen={prModalOpen} 
        onClose={() => setPrModalOpen(false)}
        onSuccess={() => {
          loadKpis();
          loadPurchaseRequests(true);
        }} 
      />

      {/* Details & Workflow Modal */}
      <PrDetailsModal
        prSummary={selectedPrForDetail}
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedPrForDetail(null);
        }}
        onUpdated={() => {
          loadKpis();
          loadPurchaseRequests(true);
        }}
      />

      {/* Page Title & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Purchase Requests (PR)</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-[#127670] border border-teal-200/60">
              Live Database
            </span>
          </div>
          <p className="text-[13px] text-slate-500 mt-1">
            Review and approve departmental procurement requisitions before RFQ bidding or PO creation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              loadKpis();
              loadPurchaseRequests(true);
            }}
            disabled={refreshing}
            className="p-2 sm:px-3 sm:py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title="Refresh database records"
          >
            <RefreshCw size={14} className={cn(refreshing && "animate-spin text-[#127670]")} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button 
            type="button"
            onClick={() => setPrModalOpen(true)}
            className="flex items-center gap-2 bg-[#125F5C] hover:bg-[#0c4240] text-white px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors shadow-sm whitespace-nowrap cursor-pointer active:scale-[0.98]"
          >
            <Plus size={16} strokeWidth={2.5} /> 
            <span>Raise PR</span>
          </button>
        </div>
      </div>

      {/* Dynamic KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        {kpisLoading && kpis.length === 0 ? (
          <SkeletonKpiCards count={4} />
        ) : (
          kpis.map((kpi) => (
            <div 
              key={kpi.id || kpi.label} 
              className={cn(
                "bg-white p-4 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border flex flex-col justify-between transition-all",
                kpi.alert ? "border-rose-200/80 bg-rose-50/20" : "border-slate-100"
              )}
            >
              <h3 className="text-[12px] sm:text-[13px] text-slate-500 font-semibold mb-1 truncate">{kpi.label}</h3>
              <p className={cn(
                "text-2xl sm:text-3xl font-extrabold tracking-tight mb-1", 
                kpi.alert ? "text-rose-600" : "text-slate-800"
              )}>
                {kpi.value}
              </p>
              <p className="text-[11px] text-slate-400 font-medium truncate">{kpi.sub}</p>
            </div>
          ))
        )}
      </div>

      {/* Data Table Section */}
      <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col flex-1 overflow-hidden">
        
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 bg-slate-50/40">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search PR number, dept, doctor..." 
                className="pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-xs font-medium w-full sm:w-64 bg-white focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] transition-colors shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Department Filter */}
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-[#127670] cursor-pointer shadow-2xs"
            >
              <option value="All">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1 overflow-x-auto py-0.5">
              {['All', 'Pending L1', 'Pending CFO', 'Approved', 'Rejected'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setSelectedStatus(st);
                    setCurrentPage(1);
                  }}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0",
                    selectedStatus === st
                      ? "bg-[#127670] text-white shadow-2xs"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Pagination Counter */}
          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs font-medium text-slate-500">
            <span>
              Showing {totalCount === 0 ? 0 : startIndex + 1}-{Math.min(endIndex, totalCount)} of {totalCount} PRs
            </span>
            <div className="flex gap-1 items-center">
              <button 
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white transition-colors text-slate-600 cursor-pointer shadow-2xs"
                title="Previous page"
              >
                <ChevronLeft size={15} />
              </button>
              
              <span className="px-2 font-bold text-slate-700">
                {currentPage} / {totalPages}
              </span>

              <button 
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || loading}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white transition-colors text-slate-600 cursor-pointer shadow-2xs"
                title="Next page"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-[13px] text-left whitespace-nowrap">
            <thead>
              <tr className="text-slate-500 border-b border-slate-100 font-semibold bg-slate-50/60 text-xs">
                <th 
                  onClick={() => handleSortToggle('pr_number')} 
                  className="py-3 px-4 cursor-pointer hover:text-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>PR ID</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="py-3 px-4">Source</th>
                <th 
                  onClick={() => handleSortToggle('department')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Cost Center / Dept</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSortToggle('items_count')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-slate-800 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Items</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSortToggle('estimated_value')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-slate-800 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Est. Value</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Raised By</th>
                <th 
                  onClick={() => handleSortToggle('created_at')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Age</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading && <SkeletonTableRows rows={8} columns={9} />}
              {!loading && prs.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle size={32} className="text-slate-300" />
                      <p className="text-sm font-semibold text-slate-600">No purchase requests found</p>
                      <p className="text-xs text-slate-400">Try adjusting your filters or search query.</p>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && prs.length > 0 && prs.map((row) => (
                  <tr 
                    key={row.id} 
                    onClick={() => handleRowClick(row)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-[#127670] group-hover:underline">
                        {row.prNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs">
                      {row.source}
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-semibold">
                      {row.department}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-700">
                      {row.itemsCount}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {row.estimatedValueFormatted}
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[11px] font-bold border inline-block shadow-2xs",
                        row.status === 'Approved' && "bg-emerald-50 text-emerald-800 border-emerald-200",
                        row.status === 'Rejected' && "bg-rose-50 text-rose-800 border-rose-200",
                        (row.status === 'Pending L1' || row.status === 'Pending CFO') && "bg-amber-50 text-amber-800 border-amber-200"
                      )}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        "text-[11px] font-semibold",
                        row.priority === 'Emergency' ? "text-rose-600 font-bold" : row.priority === 'Urgent' ? "text-amber-600 font-bold" : "text-slate-500"
                      )}>
                        {row.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs">
                      {row.raisedBy}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-xs">
                      {row.age}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleRowClick(row)}
                          className="p-1 text-slate-400 hover:text-[#127670] hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="View requisition details"
                        >
                          <Eye size={15} />
                        </button>
                        {row.status === 'Pending L1' && (
                          <button
                            type="button"
                            onClick={(e) => handleQuickApprove(e, row)}
                            className="px-2 py-0.5 text-[11px] font-bold bg-[#127670] hover:bg-[#0f605b] text-white rounded-md transition-colors cursor-pointer shadow-2xs"
                            title="Quick Approve L1"
                          >
                            Approve
                          </button>
                        )}
                        {row.convertedToPo && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200" title={`PO ${row.convertedToPo}`}>
                            PO Issued
                          </span>
                        )}
                        {row.convertedToRfq && (
                          <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200" title={`RFQ ${row.convertedToRfq}`}>
                            RFQ Active
                          </span>
                        )}
                      </div>
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
