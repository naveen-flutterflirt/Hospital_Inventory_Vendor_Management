"use client";

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/dashboard/Header';
import { cn } from '@/lib/utils';
import { 
  Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, 
  ScanLine, Check, RefreshCw, Loader2, AlertCircle, PlusCircle, Download, X 
} from 'lucide-react';
import ScanDeliveryModal from '@/components/dashboard/ScanDeliveryModal';
import GrnDetailsModal from '@/components/dashboard/GrnDetailsModal';
import ManualGrnModal from '@/components/dashboard/ManualGrnModal';
import { api, GrnItem, GrnKpisResponse } from '@/lib/api';
import { SkeletonTableRows } from '@/components/ui/Skeleton';

export default function GrnQcPage() {
  // State for data
  const [kpis, setKpis] = useState<GrnKpisResponse>({
    expectedToday: 12,
    pendingQc: 8,
    qcPassed: 45,
    returnsRejects: 3,
  });
  const [grns, setGrns] = useState<GrnItem[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  // Column Sorting
  const [sortBy, setSortBy] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // Modals
  const [scanModalOpen, setScanModalOpen] = useState<boolean>(false);
  const [manualModalOpen, setManualModalOpen] = useState<boolean>(false);
  const [selectedGrn, setSelectedGrn] = useState<GrnItem | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState<boolean>(false);

  // Debounce search query by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch KPIs
  const loadKpis = useCallback(async () => {
    try {
      const res = await api.grn.getKpis();
      if (res.success && res.data) {
        setKpis(res.data);
      }
    } catch (err) {
      console.error('Failed to load GRN KPIs:', err);
    }
  }, []);

  // Fetch GRNs
  const loadGrns = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await api.grn.getGRNs({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch,
        status: activeFilter,
        sortBy,
        sortOrder,
      });

      if (res.success && res.data) {
        setGrns(res.data.grns);
        setTotalItems(res.data.pagination.total);
        setTotalPages(res.data.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load GRNs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, pageSize, debouncedSearch, activeFilter, sortBy, sortOrder]);

  // Initial and reactive data loading
  useEffect(() => {
    loadKpis();
  }, [loadKpis]);

  useEffect(() => {
    loadGrns();
  }, [loadGrns]);

  const handleRefreshAll = () => {
    loadKpis();
    loadGrns(true);
  };

  const handleRowClick = (grn: GrnItem) => {
    setSelectedGrn(grn);
    setDetailsModalOpen(true);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(column);
      setSortOrder('ASC');
    }
    setCurrentPage(1);
  };

  const renderSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown size={12} className="text-slate-400 opacity-60" />;
    }
    return sortOrder === 'ASC' ? (
      <ArrowUp size={12} className="text-[#127670] font-bold" />
    ) : (
      <ArrowDown size={12} className="text-[#127670] font-bold" />
    );
  };

  const handleKpiFilterClick = (statusKey: string) => {
    if (activeFilter === statusKey) {
      setActiveFilter('All');
    } else {
      setActiveFilter(statusKey);
    }
    setCurrentPage(1);
  };

  const handleExportCsv = () => {
    if (grns.length === 0) return;
    const headers = ['GRN Number', 'PO Reference', 'Vendor', 'Lines', 'Shortage Notes', 'Received Date', 'Status', 'Invoice No', 'Batch Number', 'Temp (°C)', 'Inspector'];
    const rows = grns.map(g => [
      `"${g.grnNumber}"`,
      `"${g.poRef}"`,
      `"${g.vendor}"`,
      g.linesCount,
      `"${g.shortageNotes || '-'}"`,
      `"${g.receivedDate}"`,
      `"${g.status}"`,
      `"${g.invoiceNo || ''}"`,
      `"${g.batchNumber || ''}"`,
      g.temperatureCelsius || 4.2,
      `"${g.inspector || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GRN_Consignments_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startIndex = totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endIndex = Math.min(currentPage * pageSize, totalItems);

  const kpiCards = [
    { label: 'Expected Today', value: String(kpis.expectedToday), sub: 'Advance shipping notices', filter: 'Expected' },
    { label: 'Pending QC', value: String(kpis.pendingQc), sub: 'Awaiting inspection', alert: true, filter: 'Pending QC' },
    { label: 'QC Passed', value: String(kpis.qcPassed), sub: 'Cleared to stock', filter: 'QC Passed' },
    { label: 'Returns / Rejects', value: String(kpis.returnsRejects), sub: 'Debit notes pending', filter: 'Partial Reject' },
  ];

  return (
    <div className="p-4 pt-16 md:p-8 max-w-[1400px] mx-auto flex flex-col gap-4 font-sans h-full">
      <Header />
      
      {/* Modals */}
      <ScanDeliveryModal 
        isOpen={scanModalOpen} 
        onClose={() => setScanModalOpen(false)} 
        onSuccess={handleRefreshAll}
      />

      <ManualGrnModal
        isOpen={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
        onSuccess={handleRefreshAll}
      />

      <GrnDetailsModal
        grnSummary={selectedGrn}
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedGrn(null);
        }}
        onUpdated={handleRefreshAll}
      />

      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Goods Receipt (GRN) & QC</h1>
            <button
              onClick={handleRefreshAll}
              disabled={refreshing}
              className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
              title="Refresh live data"
            >
              <RefreshCw size={15} className={cn(refreshing && "animate-spin text-[#127670]")} />
            </button>
          </div>
          <p className="text-[13px] text-slate-500 mt-1">Receive inbound deliveries, scan GS1 barcodes, and perform QC clearance.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCsv}
            disabled={grns.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-md text-[13px] font-semibold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer disabled:opacity-40"
            title="Download CSV"
          >
            <Download size={15} /> Export CSV
          </button>

          <button
            onClick={() => setManualModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#125F5C]/30 text-[#125F5C] rounded-md text-[13px] font-semibold hover:bg-[#125F5C]/5 transition-colors shadow-sm cursor-pointer"
          >
            <PlusCircle size={15} /> Manual Entry
          </button>

          <button 
            onClick={() => setScanModalOpen(true)}
            className="flex items-center gap-2 bg-[#125F5C] text-white px-4 py-2 rounded-md text-[13px] font-semibold hover:bg-[#0c4240] transition-colors shadow-sm whitespace-nowrap cursor-pointer"
          >
            <ScanLine size={16} strokeWidth={2.5} /> Scan Delivery
          </button>
        </div>
      </div>

      {/* KPI Row (Clickable interactive cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => {
          const isSelected = activeFilter === kpi.filter;
          return (
            <div 
              key={i} 
              onClick={() => handleKpiFilterClick(kpi.filter)}
              className={cn(
                "bg-white p-4 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border transition-all cursor-pointer flex flex-col justify-between group",
                isSelected 
                  ? "border-[#127670] ring-2 ring-[#127670]/20 bg-[#127670]/5" 
                  : "border-slate-100 hover:border-slate-300"
              )}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] text-slate-500 font-medium mb-1 group-hover:text-slate-800 transition-colors">
                  {kpi.label}
                </h3>
                {isSelected && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#127670] text-white">
                    Filtered
                  </span>
                )}
              </div>
              <p className={cn("text-2xl font-bold tracking-tight mb-1", kpi.alert ? "text-[#D94432]" : "text-slate-800")}>
                {kpi.value}
              </p>
              <p className="text-[11px] text-slate-400 font-medium">{kpi.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Data Table Section */}
      <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col flex-1 overflow-hidden">
        
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search GRN, PO, vendor, batch..." 
                className="pl-9 pr-8 py-2 border border-slate-200 rounded-md text-[13px] w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] transition-colors"
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
                  {['All', 'Expected', 'Pending QC', 'QC Passed', 'Partial Reject', 'QC Failed'].map(opt => (
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

            {/* Clear Filter Tag if active */}
            {activeFilter !== 'All' && (
              <button
                onClick={() => {
                  setActiveFilter('All');
                  setCurrentPage(1);
                }}
                className="text-[12px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer bg-slate-100 hover:bg-slate-200 px-2 py-1.5 rounded-md"
              >
                Clear Filter <X size={12} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 text-[13px] font-medium text-slate-500 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span>Show:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-slate-200 rounded px-2 py-1 text-[12px] bg-white cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <span>Showing {startIndex}-{endIndex} of {totalItems} deliveries</span>

            <div className="flex gap-1 items-center">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded-md hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-600 cursor-pointer"
                aria-label="Previous Page"
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
                aria-label="Next Page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto w-full relative min-h-[320px]">
          {loading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10">
              <div className="flex items-center gap-2 text-[#125F5C] font-semibold text-[13px]">
                <Loader2 className="animate-spin" size={20} />
                <span>Loading delivery logs...</span>
              </div>
            </div>
          )}

          <table className="w-full text-[13px] text-left whitespace-nowrap min-w-[900px]">
            <thead>
              <tr className="text-slate-500 border-b border-slate-100 font-medium bg-slate-50/50">
                <th 
                  onClick={() => handleSort('grnNumber')}
                  className="py-3 px-4 font-medium cursor-pointer hover:text-slate-800 select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>GRN / ASN ID</span>
                    {renderSortIcon('grnNumber')}
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('poRef')}
                  className="py-3 px-4 font-medium cursor-pointer hover:text-slate-800 select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Ref. PO</span>
                    {renderSortIcon('poRef')}
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('vendor')}
                  className="py-3 px-4 font-medium cursor-pointer hover:text-slate-800 select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Vendor</span>
                    {renderSortIcon('vendor')}
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('linesCount')}
                  className="py-3 px-4 font-medium text-right cursor-pointer hover:text-slate-800 select-none"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Lines/Items</span>
                    {renderSortIcon('linesCount')}
                  </div>
                </th>

                <th className="py-3 px-4 font-medium select-none">Variance (QC)</th>

                <th 
                  onClick={() => handleSort('receivedDate')}
                  className="py-3 px-4 font-medium cursor-pointer hover:text-slate-800 select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Date</span>
                    {renderSortIcon('receivedDate')}
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('status')}
                  className="py-3 px-4 font-medium cursor-pointer hover:text-slate-800 select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    {renderSortIcon('status')}
                  </div>
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <SkeletonTableRows rows={8} columns={7} />
              ) : grns.length > 0 ? (
                grns.map((row) => (
                  <tr 
                    key={row.id} 
                    onClick={() => handleRowClick(row)}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-semibold text-[#127670] group-hover:underline">
                      {row.grnNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium font-mono text-[12px]">
                      {row.poRef}
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-medium">
                      {row.vendor}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-800">
                      {row.linesCount}
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        "text-[12px] font-medium",
                        row.shortageNotes && row.shortageNotes !== '-' && row.shortageNotes !== 'Full order received'
                          ? 'text-[#D94432] font-semibold' 
                          : 'text-slate-400'
                      )}>
                        {row.shortageNotes || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {row.receivedDate}
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn("px-2.5 py-1 rounded-md text-[11px] font-semibold inline-block", row.statusClass)}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle size={24} className="text-slate-300" />
                      <p className="text-[14px] font-medium text-slate-600">No goods receipts match your criteria</p>
                      <p className="text-[12px] text-slate-400">Try adjusting your search query or status filter.</p>
                    </div>
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
