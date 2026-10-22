"use client";

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/dashboard/Header';
import { cn } from '@/lib/utils';
import { 
  Search, ArrowUpDown, ChevronLeft, ChevronRight, 
  Plus, Loader2, RefreshCw, Package, X
} from 'lucide-react';
import { api, IndentItem, IndentKpiItem } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import IndentDetailsModal from '@/components/dashboard/IndentDetailsModal';
import NewIndentModal from '@/components/dashboard/NewIndentModal';
import { SkeletonKpiCards, SkeletonTableRows } from '@/components/ui/Skeleton';

export default function IndentsPage() {
  const { toast } = useToast();

  // State
  const [indents, setIndents] = useState<IndentItem[]>([]);
  const [kpis, setKpis] = useState<IndentKpiItem[]>([
    { id: 'pending', label: 'Pending Indents', value: '—', sub: 'Action required' },
    { id: 'urgent', label: 'Urgent / Emergency', value: '—', sub: 'High priority', alert: true },
    { id: 'processing', label: 'Processing', value: '—', sub: 'In stores' },
    { id: 'completed', label: 'Completed Today', value: '—', sub: 'Fully issued' },
  ]);

  const [loading, setLoading] = useState<boolean>(true);
  const [kpisLoading, setKpisLoading] = useState<boolean>(true);

  // Filters & Search
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [storeFilter, setStoreFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // Lookups
  const [departments, setDepartments] = useState<string[]>([]);
  const [stores, setStores] = useState<string[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limit] = useState<number>(8);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Modals
  const [selectedIndent, setSelectedIndent] = useState<IndentItem | null>(null);
  const [detailsOpen, setDetailsOpen] = useState<boolean>(false);
  const [newIndentOpen, setNewIndentOpen] = useState<boolean>(false);

  // 1. Fetch KPIs
  const loadKpis = useCallback(async () => {
    setKpisLoading(true);
    try {
      const res = await api.indents.getKpis();
      if (res.success && res.data) {
        setKpis(res.data);
      }
    } catch (err) {
      console.error('Failed to load indent KPIs:', err);
    } finally {
      setKpisLoading(false);
    }
  }, []);

  // 2. Fetch Master Lookups
  const loadLookups = useCallback(async () => {
    try {
      const res = await api.indents.getLookups();
      if (res.success && res.data) {
        setDepartments(res.data.departments || []);
        setStores(res.data.stores || []);
      }
    } catch (err) {
      console.error('Failed to load lookups:', err);
    }
  }, []);

  // 3. Fetch Indents List
  const loadIndents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.indents.getAll({
        page: currentPage,
        limit,
        search,
        status: statusFilter,
        department: deptFilter,
        store: storeFilter,
        priority: priorityFilter,
        sortBy,
        sortOrder,
      });

      if (res.success && res.data) {
        setIndents(res.data.indents);
        setTotalPages(res.data.pagination.totalPages || 1);
        setTotalCount(res.data.pagination.total || 0);
      }
    } catch (err: any) {
      console.error('Failed to load indents:', err);
      toast.error('Failed to load indents from server', 'Error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, search, statusFilter, deptFilter, storeFilter, priorityFilter, sortBy, sortOrder, toast]);

  // Initial load
  useEffect(() => {
    loadKpis();
    loadLookups();
  }, [loadKpis, loadLookups]);

  // Load table data when filters or pagination change
  useEffect(() => {
    loadIndents();
  }, [loadIndents]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(prev => (prev === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortBy(column);
      setSortOrder('DESC');
    }
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setDeptFilter('All');
    setStoreFilter('All');
    setPriorityFilter('All');
    setCurrentPage(1);
  };

  const hasActiveFilters = search || statusFilter !== 'All' || deptFilter !== 'All' || storeFilter !== 'All' || priorityFilter !== 'All';

  const startIndex = (currentPage - 1) * limit;
  const endIndex = Math.min(startIndex + limit, totalCount);

  return (
    <div className="p-3 sm:p-4 pt-16 md:p-8 max-w-[1400px] mx-auto flex flex-col gap-4 font-sans h-full">
      <Header />

      {/* Page Title & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mt-1 sm:mt-2">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">
            Indents (Internal Requisitions)
          </h1>
          <p className="text-[12px] sm:text-[13px] text-slate-500 mt-0.5 sm:mt-1">
            Real-time ward & department requisitions dispatched to pharmacy and central stores.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              loadKpis();
              loadIndents();
            }}
            title="Refresh Data"
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
          >
            <RefreshCw size={16} className={cn(loading && "animate-spin")} />
          </button>

          <button
            onClick={() => setNewIndentOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#127670] hover:bg-[#0f605b] text-white rounded-lg text-[13px] font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Plus size={16} /> Raise Ward Indent
          </button>
        </div>
      </div>

      {/* KPI Row (Live PostgreSQL metrics) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        {kpisLoading && kpis[0]?.value === '—' ? (
          <SkeletonKpiCards count={4} />
        ) : (
          kpis.map((kpi, i) => (
            <div 
              key={kpi.id || i} 
              className="bg-white p-3 sm:p-4 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <h3 className="text-[11px] sm:text-[13px] text-slate-500 font-medium mb-1 truncate">
                {kpi.label}
              </h3>
              <p className={cn(
                "text-lg sm:text-2xl font-bold tracking-tight mb-0.5 sm:mb-1 truncate", 
                kpi.alert ? "text-[#D94432]" : "text-slate-800"
              )}>
                {kpi.value}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
                {kpi.sub}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Data Table Section */}
      <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col flex-1 overflow-hidden">
        {/* Table Toolbar & Search */}
        <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-col gap-3">
          {/* Top row: search + quick filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto flex-1">
              {/* Search input */}
              <div className="relative flex-1 min-w-[200px] md:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search indent ID, dept, notes..."
                  className="pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-[13px] w-full focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] transition-colors"
                />
                {search && (
                  <button
                    onClick={() => {
                      setSearch('');
                      setCurrentPage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Department Dropdown Filter */}
              <select
                value={deptFilter}
                onChange={(e) => {
                  setDeptFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-slate-200 rounded-lg px-2.5 py-2 text-[13px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] cursor-pointer"
              >
                <option value="All">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              {/* Store Dropdown Filter */}
              <select
                value={storeFilter}
                onChange={(e) => {
                  setStoreFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-slate-200 rounded-lg px-2.5 py-2 text-[13px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] cursor-pointer"
              >
                <option value="All">All Stores</option>
                {stores.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-slate-200 rounded-lg px-2.5 py-2 text-[13px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] cursor-pointer"
              >
                <option value="All">All Priorities</option>
                <option value="Emergency">Emergency Only</option>
                <option value="Urgent">Urgent Only</option>
                <option value="Routine">Routine Only</option>
              </select>

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="px-2.5 py-2 text-[12px] font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <X size={13} /> Reset
                </button>
              )}
            </div>

            {/* Pagination stats & quick nav */}
            <div className="flex items-center justify-between md:justify-end gap-3 text-[12px] sm:text-[13px] font-medium text-slate-500 shrink-0">
              <span className="truncate">
                Showing {totalCount > 0 ? startIndex + 1 : 0}-{endIndex} of {totalCount} indents
              </span>

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
                      currentPage === page
                        ? "bg-[#127670] text-white font-bold"
                        : "hover:bg-slate-100 text-slate-600"
                    )}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-1 rounded-md hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-600 cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Status Tabs Bar */}
          <div className="flex items-center gap-1 border-t border-slate-100 pt-2.5 overflow-x-auto no-scrollbar">
            {['All', 'Pending', 'Processing', 'Partially Issued', 'Completed'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setStatusFilter(tab);
                  setCurrentPage(1);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-colors cursor-pointer",
                  statusFilter === tab
                    ? "bg-[#127670]/10 text-[#127670]"
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto flex-1 relative min-h-[300px]">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-xs z-10 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#127670]" />
              <p className="text-sm font-medium text-slate-500">Loading indents from database...</p>
            </div>
          ) : null}

          <table className="w-full text-[13px] text-left whitespace-nowrap">
            <thead>
              <tr className="text-slate-500 border-b border-slate-100 font-medium bg-slate-50/50">
                <th 
                  onClick={() => handleSort('indent_number')}
                  className="py-3 px-4 font-medium cursor-pointer hover:text-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Indent ID <ArrowUpDown size={12} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('requesting_dept')}
                  className="py-3 px-4 font-medium cursor-pointer hover:text-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    From Dept <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="py-3 px-4 font-medium">To Store</th>
                <th 
                  onClick={() => handleSort('items_count')}
                  className="py-3 px-4 font-medium text-right cursor-pointer hover:text-slate-800 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    Items <ArrowUpDown size={12} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('priority')}
                  className="py-3 px-4 font-medium cursor-pointer hover:text-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Priority <ArrowUpDown size={12} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('status')}
                  className="py-3 px-4 font-medium cursor-pointer hover:text-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Status <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="py-3 px-4 font-medium">Raised By</th>
                <th className="py-3 px-4 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonTableRows rows={8} columns={8} />
              ) : indents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-[14px] font-medium text-slate-600">No indents found</p>
                    <p className="text-[12px] text-slate-400 mt-0.5">Try adjusting your filters or raise a new ward indent.</p>
                  </td>
                </tr>
              ) : (
                indents.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => {
                      setSelectedIndent(row);
                      setDetailsOpen(true);
                    }}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-semibold text-[#127670] group-hover:underline flex items-center gap-1.5">
                      {row.indentNumber}
                      {row.escalatedToPr && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800" title={`Escalated to ${row.escalatedToPr}`}>
                          PR
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-medium">
                      {row.dept}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {row.toStore}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-800">
                      {row.items}
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        "flex items-center gap-1.5 text-[12px] font-medium",
                        row.priority === 'Emergency' ? 'text-[#D94432]' : 
                        row.priority === 'Urgent' ? 'text-[#E89A3C]' : 'text-slate-500'
                      )}>
                        {row.priority !== 'Routine' && (
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            row.priority === 'Emergency' ? 'bg-[#D94432] animate-pulse' : 'bg-[#E89A3C]'
                          )} />
                        )}
                        {row.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn("px-2.5 py-1 rounded-md text-[11px] font-semibold", row.statusClass)}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {row.raisedBy}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[12px]">
                      {row.time}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Indent Details Modal */}
      <IndentDetailsModal
        indentSummary={selectedIndent}
        isOpen={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedIndent(null);
        }}
        onUpdated={() => {
          loadKpis();
          loadIndents();
        }}
      />

      {/* Raise New Indent Modal */}
      <NewIndentModal
        isOpen={newIndentOpen}
        onClose={() => setNewIndentOpen(false)}
        onSuccess={() => {
          loadKpis();
          loadIndents();
        }}
      />
    </div>
  );
}
