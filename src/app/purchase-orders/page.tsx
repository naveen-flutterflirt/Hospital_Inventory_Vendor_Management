"use client";

import { useState, useEffect, useCallback, Fragment } from 'react';
import Header from '@/components/dashboard/Header';
import { cn } from '@/lib/utils';
import { 
  Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, 
  Plus, RefreshCw, Loader2, Download, X, CheckCircle2, AlertCircle, ShoppingCart 
} from 'lucide-react';
import { api, PoItemSummary, PoKpisResponse } from '@/lib/api';
import PoDetailsModal from '@/components/dashboard/PoDetailsModal';
import CreatePoModal from '@/components/dashboard/CreatePoModal';
import { SkeletonTableRows } from '@/components/ui/Skeleton';

export default function PurchaseOrdersPage() {
  // KPI state initialized with standard metrics
  const [kpis, setKpis] = useState<PoKpisResponse>({
    open_pos: { label: 'Open POs', value: '63', sub: 'In flight', raw: 63 },
    overdue_delivery: { label: 'Overdue Delivery', value: '9', sub: 'Follow-up required', alert: true, raw: 9 },
    received_today: { label: 'Received Today', value: '14', sub: 'Pending GRN', raw: 14 },
    awaiting_approval: { label: 'Awaiting Approval', value: '7', sub: 'Pending signatures', raw: 7 },
  });

  // Table state
  const [orders, setOrders] = useState<PoItemSummary[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(12);
  const [activeStatus, setActiveStatus] = useState<string>('All');
  const [activeType, setActiveType] = useState<string>('All');
  const [activeKpiKey, setActiveKpiKey] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  // Column Sorting
  const [sortBy, setSortBy] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // Modals & Notifications
  const [selectedPo, setSelectedPo] = useState<PoItemSummary | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState<boolean>(false);
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Debounce search query by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load KPIs
  const loadKpis = useCallback(async () => {
    try {
      const res = await api.purchaseOrders.getKpis();
      if (res.success && res.data) {
        setKpis(res.data);
      }
    } catch (err) {
      console.error('Failed to load PO KPIs:', err);
    }
  }, []);

  // Load Purchase Orders
  const loadPurchaseOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await api.purchaseOrders.getPurchaseOrders({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch,
        status: activeStatus,
        type: activeType,
        sortBy,
        sortOrder,
      });

      if (res.success && res.data) {
        setOrders(res.data.orders);
        setTotalItems(res.data.pagination.total);
        setTotalPages(res.data.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load purchase orders from API:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, pageSize, debouncedSearch, activeStatus, activeType, sortBy, sortOrder]);

  // Initial and reactive data fetching
  useEffect(() => {
    loadKpis();
  }, [loadKpis]);

  useEffect(() => {
    loadPurchaseOrders();
  }, [loadPurchaseOrders]);

  // Handle Sort column click
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(prev => (prev === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortBy(column);
      setSortOrder('ASC');
    }
    setCurrentPage(1);
  };

  const renderSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown size={12} className="opacity-40" />;
    }
    return sortOrder === 'ASC' ? (
      <ArrowUp size={12} className="text-[#127670] font-bold" />
    ) : (
      <ArrowDown size={12} className="text-[#127670] font-bold" />
    );
  };

  // Handle Click on KPI card
  const handleKpiClick = (kpiKey: string) => {
    if (activeKpiKey === kpiKey) {
      // Toggle off
      setActiveKpiKey(null);
      setActiveStatus('All');
    } else {
      setActiveKpiKey(kpiKey);
      if (kpiKey === 'overdue_delivery') {
        setActiveStatus('Overdue');
      } else if (kpiKey === 'awaiting_approval') {
        setActiveStatus('Awaiting approval');
      } else if (kpiKey === 'received_today') {
        setActiveStatus('Delivered');
      } else {
        setActiveStatus('All');
      }
    }
    setCurrentPage(1);
  };

  // Export current filtered list as CSV
  const handleExportCsv = () => {
    if (orders.length === 0) return;

    const headers = ['PO Number', 'Vendor', 'PO Type', 'Items Count', 'Value', 'Status', 'Due Date', 'Payment Terms', 'Created At'];
    const rows = orders.map(o => [
      `"${o.poNumber}"`,
      `"${o.vendor.replace(/"/g, '""')}"`,
      `"${o.type}"`,
      o.items,
      `"${o.value}"`,
      `"${o.status}"`,
      `"${o.due}"`,
      `"${o.paymentTerms}"`,
      `"${new Date(o.createdAt).toLocaleDateString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Purchase_Orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Callback when a new PO is generated
  const handlePoCreated = (newPoNumber: string) => {
    setToast({
      message: `Purchase Order ${newPoNumber} created successfully!`,
      type: 'success',
    });
    loadKpis();
    loadPurchaseOrders(true);
    setTimeout(() => setToast(null), 5000);
  };

  // Callback when status is updated in details modal
  const handlePoUpdated = () => {
    loadKpis();
    loadPurchaseOrders(true);
  };

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + orders.length;

  return (
    <div className="p-3 sm:p-4 pt-16 md:p-8 max-w-[1400px] mx-auto flex flex-col gap-4 font-sans h-full">
      <Header />

      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-16 sm:top-20 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in slide-in-from-top-4 duration-300 pointer-events-auto">
          <div className={cn(
            "p-3.5 sm:p-4 rounded-xl shadow-xl border flex items-center justify-between gap-3 text-xs font-semibold backdrop-blur-md",
            toast.type === 'success' 
              ? "bg-emerald-50/95 text-emerald-900 border-emerald-200 shadow-emerald-900/5" 
              : "bg-red-50/95 text-red-900 border-red-200 shadow-red-900/5"
          )}>
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {toast.type === 'success' ? (
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle size={18} className="text-rose-600 shrink-0" />
              )}
              <span className="break-words leading-tight">{toast.message}</span>
            </div>
            <button 
              onClick={() => setToast(null)} 
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors cursor-pointer shrink-0 ml-1"
              title="Close notification"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Page Title & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mt-1 sm:mt-2">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Purchase Orders</h1>
          <p className="text-[12px] sm:text-[13px] text-slate-500 mt-0.5 sm:mt-1">
            Manage vendor contracts, logistics SLA, and procurement authorizations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => {
              loadKpis();
              loadPurchaseOrders(true);
            }}
            disabled={refreshing}
            className="flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Refresh database records"
          >
            <RefreshCw size={14} className={cn(refreshing && "animate-spin text-[#127670]")} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Export to CSV"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button 
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-[#125F5C] text-white px-4 py-2 sm:py-2.5 rounded-lg text-[13px] sm:text-[14px] font-semibold hover:bg-[#0c4240] transition-colors shadow-sm whitespace-nowrap cursor-pointer flex-1 sm:flex-initial"
          >
            <Plus size={16} strokeWidth={3} /> Create PO
          </button>
        </div>
      </div>

      {/* Dynamic KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        {Object.entries(kpis).map(([key, kpi]) => {
          const isActive = activeKpiKey === key;

          return (
            <div 
              key={key} 
              onClick={() => handleKpiClick(key)}
              className={cn(
                "bg-white p-3 sm:p-4 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border flex flex-col justify-between hover:shadow-md transition-all cursor-pointer relative overflow-hidden",
                isActive 
                  ? "border-[#127670] ring-2 ring-[#127670]/20 bg-[#127670]/5" 
                  : "border-slate-100 hover:border-slate-200"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-[11px] sm:text-[13px] text-slate-500 font-medium truncate">{kpi.label}</h3>
                {isActive && (
                  <span className="text-[10px] font-bold text-[#127670] bg-[#127670]/10 px-1.5 py-0.5 rounded">
                    Filtered
                  </span>
                )}
              </div>
              <p className={cn(
                "text-lg sm:text-2xl font-bold tracking-tight mb-0.5 sm:mb-1 truncate", 
                kpi.alert ? "text-[#D94432]" : "text-slate-800"
              )}>
                {kpi.value}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">{kpi.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Data Table Section */}
      <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col flex-1 overflow-hidden">
        
        {/* Table Toolbar */}
        <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Search Input with Clear Button */}
            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search PO number, vendor, type..." 
                className="pl-9 pr-8 py-2 border border-slate-200 rounded-md text-[13px] w-full focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Toggle Filters Dropdown Button */}
            <button 
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 border rounded-md text-[13px] font-semibold transition-colors cursor-pointer shrink-0",
                filtersOpen || activeStatus !== 'All' || activeType !== 'All'
                  ? "border-[#127670] text-[#127670] bg-[#127670]/5"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              <Filter size={14} /> Filters
              {(activeStatus !== 'All' || activeType !== 'All') && (
                <span className="w-2 h-2 rounded-full bg-[#127670]" />
              )}
            </button>
          </div>

          {/* Pagination Counter & Page Selector */}
          <div className="flex items-center justify-between gap-3 text-[12px] sm:text-[13px] font-medium text-slate-500 w-full md:w-auto">
            <span className="truncate">
              Showing {totalItems > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, totalItems)} of {totalItems} POs
            </span>
            <div className="flex gap-1 items-center">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
                className="p-1 rounded-md hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-600 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              
              {/* Up to 5 visible page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => Math.abs(page - currentPage) <= 2 || page === 1 || page === totalPages)
                .map((page, idx, arr) => (
                  <Fragment key={page}>
                    {idx > 0 && arr[idx - 1] !== page - 1 && (
                      <span className="px-1 text-slate-400">...</span>
                    )}
                    <button 
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        "w-6 h-6 rounded-md flex items-center justify-center transition-colors cursor-pointer text-[12px]", 
                        currentPage === page ? "bg-slate-200 text-slate-800 font-bold" : "hover:bg-slate-100 text-slate-600"
                      )}
                    >
                      {page}
                    </button>
                  </Fragment>
                ))}

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || loading}
                className="p-1 rounded-md hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-600 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Drawer / Controls */}
        {filtersOpen && (
          <div className="p-3 sm:p-4 bg-slate-50/70 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in duration-200 text-xs">
            {/* Status Filter */}
            <div>
              <label className="block text-slate-500 font-medium mb-1">Status Filter</label>
              <select
                value={activeStatus}
                onChange={(e) => {
                  setActiveStatus(e.target.value);
                  setActiveKpiKey(null);
                  setCurrentPage(1);
                }}
                className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#127670] cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Dispatched">Dispatched</option>
                <option value="Accepted">Accepted</option>
                <option value="Overdue">Overdue</option>
                <option value="Awaiting approval">Awaiting approval</option>
                <option value="Delivered">Delivered</option>
                <option value="Draft">Draft</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* PO Type Filter */}
            <div>
              <label className="block text-slate-500 font-medium mb-1">PO Type Filter</label>
              <select
                value={activeType}
                onChange={(e) => {
                  setActiveType(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#127670] cursor-pointer"
              >
                <option value="All">All PO Types</option>
                <option value="Regular PO">Regular PO</option>
                <option value="Rate-contract PO">Rate-contract PO</option>
                <option value="Blanket PO">Blanket PO</option>
                <option value="Consignment">Consignment</option>
                <option value="Capex PO">Capex PO</option>
                <option value="Emergency purchase">Emergency purchase</option>
              </select>
            </div>

            {/* Page Size Filter */}
            <div>
              <label className="block text-slate-500 font-medium mb-1">Items Per Page</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#127670] cursor-pointer"
              >
                <option value={10}>10 records</option>
                <option value={12}>12 records (default)</option>
                <option value={25}>25 records</option>
                <option value={50}>50 records</option>
              </select>
            </div>
          </div>
        )}

        {/* Table Content */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-[13px] text-left whitespace-nowrap min-w-[900px]">
            <thead>
              <tr className="text-slate-500 border-b border-slate-100 font-medium bg-slate-50/50">
                <th 
                  onClick={() => handleSort('poNumber')}
                  className="py-3 px-4 font-medium flex items-center gap-1.5 cursor-pointer hover:text-slate-700 select-none"
                >
                  PO ID {renderSortIcon('poNumber')}
                </th>
                <th 
                  onClick={() => handleSort('vendor')}
                  className="py-3 px-4 font-medium cursor-pointer hover:text-slate-700 select-none"
                >
                  <div className="flex items-center gap-1.5">
                    Vendor {renderSortIcon('vendor')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('type')}
                  className="py-3 px-4 font-medium cursor-pointer hover:text-slate-700 select-none"
                >
                  <div className="flex items-center gap-1.5">
                    PO Type {renderSortIcon('type')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('items')}
                  className="py-3 px-4 font-medium text-right cursor-pointer hover:text-slate-700 select-none"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    Items {renderSortIcon('items')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('value')}
                  className="py-3 px-4 font-medium text-right cursor-pointer hover:text-slate-700 select-none"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    Value {renderSortIcon('value')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('status')}
                  className="py-3 px-4 font-medium cursor-pointer hover:text-slate-700 select-none"
                >
                  <div className="flex items-center gap-1.5">
                    Status {renderSortIcon('status')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('due')}
                  className="py-3 px-4 font-medium cursor-pointer hover:text-slate-700 select-none"
                >
                  <div className="flex items-center gap-1.5">
                    Due {renderSortIcon('due')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonTableRows rows={8} columns={7} />
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShoppingCart size={32} className="text-slate-300" />
                      <p className="text-sm font-semibold text-slate-600">No Purchase Orders Found</p>
                      <p className="text-xs text-slate-400">No records matched your search query or filters.</p>
                      {(activeStatus !== 'All' || activeType !== 'All' || searchQuery) && (
                        <button
                          onClick={() => {
                            setActiveStatus('All');
                            setActiveType('All');
                            setSearchQuery('');
                            setActiveKpiKey(null);
                          }}
                          className="mt-2 text-xs font-semibold text-[#127670] hover:underline cursor-pointer"
                        >
                          Clear All Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((row) => (
                  <tr 
                    key={row.poNumber || row.id} 
                    onClick={() => {
                      setSelectedPo(row);
                      setDetailsModalOpen(true);
                    }}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-semibold text-[#127670] group-hover:underline">
                      {row.poNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-medium">
                      <div>{row.vendor}</div>
                      {row.vendorCode && (
                        <div className="text-[11px] font-mono text-slate-400">{row.vendorCode}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{row.type}</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-800">{row.items}</td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-800">{row.value}</td>
                    <td className="py-3 px-4">
                      <span className={cn("px-2.5 py-1 rounded-md text-[11px] font-semibold border border-transparent", row.statusClass)}>
                        {row.status}
                      </span>
                    </td>
                    <td className={cn(
                      "py-3 px-4 font-medium",
                      row.status === 'Overdue' ? 'text-[#D94432]' : 'text-slate-500'
                    )}>
                      {row.due}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PO Details Modal */}
      <PoDetailsModal
        poSummary={selectedPo}
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedPo(null);
        }}
        onUpdated={handlePoUpdated}
      />

      {/* Create PO Modal */}
      <CreatePoModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handlePoCreated}
      />
    </div>
  );
}
