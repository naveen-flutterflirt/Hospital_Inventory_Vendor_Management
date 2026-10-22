"use client";

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/dashboard/Header';
import { 
  Download, Edit3, Loader2, RefreshCw, 
  ChevronDown, AlertCircle, Award, CheckCircle2, X, Users, Clock,
  ShieldCheck, Layers 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import NegotiateModal from '@/components/dashboard/NegotiateModal';
import { 
  api, RfqSummaryItem, RfqComparisonResponse, RfqConfigResponse 
} from '@/lib/api';
import { cn } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { Skeleton, SkeletonTableRows } from '@/components/ui/Skeleton';

export default function RfqQuotesPage() {
  const router = useRouter();
  const { toast, showConfirm } = useToast();

  // RFQ selection & list state
  const [rfqsList, setRfqsList] = useState<RfqSummaryItem[]>([]);
  const [selectedRfqNumber, setSelectedRfqNumber] = useState<string>('RFQ-24-0318');
  const [comparison, setComparison] = useState<RfqComparisonResponse | null>(null);
  const [config, setConfig] = useState<RfqConfigResponse | null>(null);
  
  // Loading & Action states
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isAwarding, setIsAwarding] = useState<boolean>(false);
  const [awardSuccessMsg, setAwardSuccessMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modals
  const [negotiateModalOpen, setNegotiateModalOpen] = useState<boolean>(false);
  const [selectedAwardVendorId, setSelectedAwardVendorId] = useState<number | null>(null);

  // Load list of RFQs
  const loadRfqs = useCallback(async () => {
    try {
      const res = await api.rfqQuotes.getRfqs();
      if (res.success && res.data && res.data.length > 0) {
        setRfqsList(res.data);
        if (!selectedRfqNumber) {
          setSelectedRfqNumber(res.data[0].rfq_number);
        }
      }
    } catch (err) {
      console.error('Failed to load RFQs list:', err);
    }
  }, [selectedRfqNumber]);

  // Load RFQ Comparison Matrix
  const loadComparison = useCallback(async (rfqNum: string, isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await api.rfqQuotes.getRfqComparison(rfqNum);
      if (res.success && res.data) {
        setComparison(res.data);
        // Default award vendor to the first fully quoting or recommended vendor
        if (res.data.vendors.length > 0) {
          const nonPartial = res.data.vendors.find(v => !v.isPartial);
          setSelectedAwardVendorId(nonPartial ? nonPartial.vendorId : res.data.vendors[0].vendorId);
        }
      }
    } catch (err) {
      console.error('Failed to load RFQ comparison matrix:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load Configuration (Approval Matrix & Supported Purchase Types)
  const loadConfig = useCallback(async () => {
    try {
      const res = await api.rfqQuotes.getConfig();
      if (res.success && res.data) {
        setConfig(res.data);
      }
    } catch (err) {
      console.error('Failed to load config:', err);
    }
  }, []);

  useEffect(() => {
    loadRfqs();
    loadConfig();
  }, [loadRfqs, loadConfig]);

  useEffect(() => {
    if (selectedRfqNumber) {
      loadComparison(selectedRfqNumber);
    }
  }, [selectedRfqNumber, loadComparison]);

  // Handle Export CSV
  const handleExport = () => {
    if (!comparison) return;
    setIsExporting(true);

    try {
      const { rfq, vendors, items } = comparison;
      const vendorHeaders = vendors.map(v => `"${v.vendorName}"`);
      const headers = ['Item Code', 'Item Description', 'Qty', 'UOM', 'Benchmark Rate (₹)', ...vendorHeaders, 'Recommended Vendor'];

      const rows = items.map(it => {
        const vendorRates = vendors.map(v => {
          const q = it.quotes[v.vendorId];
          return q?.isNoBid ? '"No bid"' : `"${q?.unitPrice ?? '-'}"`;
        });

        return [
          `"${it.itemCode}"`,
          `"${it.itemName}"`,
          it.quantity,
          `"${it.uom}"`,
          it.lastPrice,
          ...vendorRates,
          `"${it.recommendedVendorName || '-'}"`,
        ];
      });

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${rfq.rfqNumber}-Comparison-Quotes.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Award and Route to Purchase Orders
  const handleAward = async () => {
    if (!comparison || !selectedAwardVendorId) return;

    const awardedVendor = comparison.vendors.find(v => v.vendorId === selectedAwardVendorId);
    const confirmed = await showConfirm({
      title: 'Award Tender Contract',
      message: `Award contract for tender ${comparison.rfq.rfqNumber} to "${awardedVendor?.vendorName}" at quote value of ₹${(awardedVendor?.totalQuotedAmount || 0).toLocaleString('en-IN')} and generate official Purchase Order?`,
      confirmText: 'Award & Generate PO',
      cancelText: 'Cancel',
      type: 'success',
    });
    if (!confirmed) return;

    setIsAwarding(true);
    setAwardSuccessMsg(null);

    try {
      const res = await api.rfqQuotes.awardAndCreatePo(comparison.rfq.rfqNumber, {
        vendorId: selectedAwardVendorId,
        paymentTerms: awardedVendor?.creditTerms || 'Net 30',
        notes: `Awarded contract from ${comparison.rfq.rfqNumber} tender evaluation.`,
      });

      if (res.success && res.data) {
        setAwardSuccessMsg(`Contract awarded to ${awardedVendor?.vendorName}! Order ${res.data.poNumber} generated.`);
        toast.success(`Contract awarded to ${awardedVendor?.vendorName}! Order ${res.data.poNumber} generated.`, 'Tender Awarded');
        
        // Refresh local data
        await loadComparison(comparison.rfq.rfqNumber, true);
        
        // Route to /purchase-orders after 1.8 seconds so user sees the newly created PO
        setTimeout(() => {
          router.push('/purchase-orders');
        }, 1800);
      } else {
        setToastMsg({ message: res.message || 'Failed to award tender.', type: 'error' });
      }
    } catch (err: any) {
      console.error('Failed to award PO:', err);
      setToastMsg({ message: err.message || 'Network error during tender award.', type: 'error' });
    } finally {
      setIsAwarding(false);
    }
  };

  const handleNegotiatedCallback = (vendorName: string) => {
    setToastMsg({
      message: `Negotiation request sent to ${vendorName}. Status updated to Negotiating.`,
      type: 'success',
    });
    loadComparison(selectedRfqNumber, true);
    setTimeout(() => setToastMsg(null), 5000);
  };

  const rfq = comparison?.rfq;
  const vendors = comparison?.vendors || [];
  const items = comparison?.items || [];
  const totals = comparison?.totals;

  return (
    <div className="p-4 pt-16 md:p-8 max-w-[1400px] mx-auto flex flex-col gap-4 font-sans">
      <Header />
      
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-16 sm:top-20 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in slide-in-from-top-4 duration-300 pointer-events-auto">
          <div className={cn(
            "p-3.5 sm:p-4 rounded-xl shadow-xl border flex items-center justify-between gap-3 text-xs font-semibold backdrop-blur-md",
            toastMsg.type === 'success' 
              ? "bg-emerald-50/95 text-emerald-900 border-emerald-200 shadow-emerald-900/5" 
              : "bg-red-50/95 text-red-900 border-red-200 shadow-red-900/5"
          )}>
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {toastMsg.type === 'success' ? (
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle size={18} className="text-rose-600 shrink-0" />
              )}
              <span className="break-words leading-tight">{toastMsg.message}</span>
            </div>
            <button 
              onClick={() => setToastMsg(null)} 
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors cursor-pointer shrink-0 ml-1"
              title="Close notification"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Award Success Toast Banner */}
      {awardSuccessMsg && (
        <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-300 pointer-events-auto">
          <div className="bg-[#125F5C] text-white p-3.5 sm:p-4 rounded-xl shadow-2xl flex items-center justify-between gap-3 border border-[#1EB4A1]/40 backdrop-blur-md">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-[#1EB4A1]">
                <Award size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-xs sm:text-sm text-white leading-tight break-words">
                  {awardSuccessMsg}
                </p>
                <p className="text-[11px] sm:text-xs text-teal-100/85 mt-0.5 leading-tight truncate">
                  Routing to live Purchase Orders dashboard...
                </p>
              </div>
            </div>
            <button 
              onClick={() => setAwardSuccessMsg(null)}
              className="text-white/70 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-1"
              title="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <NegotiateModal 
        isOpen={negotiateModalOpen} 
        onClose={() => setNegotiateModalOpen(false)}
        rfq={rfq || null}
        vendors={vendors}
        items={items}
        onNegotiated={handleNegotiatedCallback}
      />

      {/* Page Title & RFQ Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 mb-1">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Compare quotes side by side, then raise the PO in one click
          </h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Multi-vendor commercial evaluation matrix with automatic L1 benchmarking.
          </p>
        </div>

        {/* Dynamic RFQ Selector Switcher */}
        {rfqsList.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500 shrink-0">Active RFQ:</span>
            <div className="relative flex-1 sm:flex-initial min-w-0">
              <select
                value={selectedRfqNumber}
                onChange={(e) => setSelectedRfqNumber(e.target.value)}
                className="w-full appearance-none bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] shadow-2xs cursor-pointer truncate max-w-full sm:max-w-xs"
              >
                {rfqsList.map((r) => (
                  <option key={r.id} value={r.rfq_number}>
                    {r.rfq_number} - {r.title}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <button
              onClick={() => loadComparison(selectedRfqNumber, true)}
              disabled={refreshing}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer shrink-0"
              title="Refresh quote data"
            >
              <RefreshCw size={14} className={cn(refreshing && "animate-spin text-[#127670]")} />
            </button>
          </div>
        )}
      </div>

      {/* Main Quote Comparison Card */}
      <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col overflow-hidden">
        
        {/* RFQ Header Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/40">
          {/* Left Side: Title, RFQ Code, Status & Key Telemetry */}
          {loading && !comparison ? (
            <div className="flex flex-col gap-2 min-w-0">
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-6 w-24 rounded-md" />
                <Skeleton className="h-6 w-44 rounded-md" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 min-w-0">
              {/* Row 1: RFQ Code, Title & Status Badge */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-md shadow-2xs tracking-tight">
                  {rfq?.rfqNumber || selectedRfqNumber}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  {rfq?.title || 'OT consumables'}
                </h2>
                {rfq?.status && (
                  <span className={cn(
                    "inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs",
                    rfq.status === 'Awarded'
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  )}>
                    {rfq.status === 'Awarded' ? (
                      <CheckCircle2 size={12} className="text-emerald-600" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    )}
                    <span>{rfq.status}</span>
                  </span>
                )}
              </div>

              {/* Row 2: Structured Metadata with Icons */}
              <div className="flex items-center gap-2.5 sm:gap-3 text-xs text-slate-500 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Users size={13} className="text-slate-400" />
                  <span className="font-semibold text-slate-700">{rfq?.invitedCount || 4}</span>
                  <span>vendors invited</span>
                </div>
                <span className="text-slate-300">&bull;</span>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-500" />
                  <span className="font-semibold text-slate-700">{rfq?.respondedCount || 3}</span>
                  <span>responded</span>
                </div>
                <span className="text-slate-300">&bull;</span>
                <div className="flex items-center gap-1.5">
                  <Clock size={13} className="text-slate-400" />
                  <span>{rfq?.closesAtLabel || 'closes 9 Oct 17:00'}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Right Side: Aligned Action Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
            <button 
              type="button"
              onClick={() => setNegotiateModalOpen(true)}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs sm:text-[13px] font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs cursor-pointer active:scale-[0.98]"
            >
              <Edit3 size={14} className="text-slate-500" /> 
              <span>Negotiate</span>
            </button>
            <button 
              type="button"
              onClick={handleExport}
              disabled={isExporting || loading}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs sm:text-[13px] font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs cursor-pointer disabled:opacity-50 active:scale-[0.98]"
            >
              {isExporting ? <Loader2 size={14} className="animate-spin text-[#127670]" /> : <Download size={14} className="text-slate-500" />} 
              <span>{isExporting ? 'Exporting...' : 'Export'}</span>
            </button>
            {rfq?.status === 'Awarded' ? (
              <div className="flex items-center justify-center gap-1.5 px-4 py-2 sm:py-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-lg text-xs sm:text-[13px] font-bold shadow-2xs">
                <CheckCircle2 size={15} className="text-emerald-600" />
                <span>Tender Awarded</span>
              </div>
            ) : (
              <button 
                type="button"
                onClick={handleAward}
                disabled={isAwarding || loading}
                className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-[#127670] hover:bg-[#0f605b] text-white rounded-lg text-xs sm:text-[13px] font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 active:scale-[0.98]"
              >
                {isAwarding ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Processing Award...</span>
                  </>
                ) : (
                  <>
                    <Award size={15} />
                    <span>Award L1 & Raise PO</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto w-full">
          {loading ? (
            <table className="w-full text-[13px] text-left whitespace-nowrap min-w-[950px]">
              <thead>
                <tr className="text-slate-500 border-b border-slate-100 font-semibold bg-slate-50/30">
                  <th className="py-3.5 px-5 min-w-[220px]">Item</th>
                  <th className="py-3.5 px-4 text-right">Qty</th>
                  <th className="py-3.5 px-4 text-right">Last price</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Vendor Quote 1</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Vendor Quote 2</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Vendor Quote 3</th>
                  <th className="py-3.5 px-5 bg-slate-50/60 min-w-[160px]">Recommended</th>
                </tr>
              </thead>
              <tbody>
                <SkeletonTableRows rows={6} columns={7} />
              </tbody>
            </table>
          ) : (
            <table className="w-full text-[13px] text-left whitespace-nowrap min-w-[950px]">
              <thead>
                <tr className="text-slate-500 border-b border-slate-100 font-semibold bg-slate-50/30">
                  <th className="py-3.5 px-5 min-w-[220px]">Item</th>
                  <th className="py-3.5 px-4 text-right">Qty</th>
                  <th className="py-3.5 px-4 text-right">Last price</th>
                  {vendors.map(v => (
                    <th key={v.vendorId} className="py-3.5 px-4 min-w-[180px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-800">{v.vendorName}</span>
                        {v.isNewVendor && (
                          <span className="text-[10px] bg-[#E89A3C]/20 text-[#E89A3C] px-1.5 py-0.2 rounded font-bold uppercase">
                            New
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="py-3.5 px-5 bg-slate-50/60 min-w-[160px]">Recommended</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 divide-y divide-slate-100">
                {items.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Item Name */}
                    <td className="py-3 px-5">
                      <span className="font-medium text-slate-800">{row.itemName}</span>
                      {row.itemCode && (
                        <span className="block text-[11px] font-mono text-slate-400">{row.itemCode}</span>
                      )}
                    </td>

                    {/* Quantity */}
                    <td className="py-3 px-4 text-right font-medium text-slate-800">
                      {row.quantity.toLocaleString('en-IN')}
                    </td>

                    {/* Last Price Benchmark */}
                    <td className="py-3 px-4 text-right text-slate-500 font-medium">
                      {row.lastPriceFormatted}
                    </td>

                    {/* Dynamic Vendor Quote Cells */}
                    {vendors.map(v => {
                      const quoteInfo = row.quotes[v.vendorId];
                      const isNoBid = quoteInfo?.isNoBid;
                      const isL1 = quoteInfo?.isL1;
                      const displayPrice = quoteInfo?.displayPrice || 'No bid';

                      return (
                        <td 
                          key={v.vendorId}
                          onClick={() => setSelectedAwardVendorId(v.vendorId)}
                          className={cn(
                            "py-3 px-4 transition-colors cursor-pointer rounded-xs",
                            isNoBid && "text-slate-400 italic",
                            isL1 && "bg-[#1EB4A1]/10 font-bold text-[#127670] hover:bg-[#1EB4A1]/20",
                            !isNoBid && !isL1 && "text-slate-600 hover:bg-slate-100"
                          )}
                        >
                          {isNoBid ? (
                            <span>No bid</span>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span>{displayPrice}</span>
                              {isL1 && (
                                <span className="text-[11px] ml-1 opacity-80 font-bold text-[#127670]">
                                  &middot; L1
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* Recommended Column */}
                    <td className="py-3 px-5 bg-slate-50/50 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-800 font-semibold">{row.recommendedVendorName}</span>
                        {row.isNewVendor && (
                          <span className="text-[10px] bg-[#E89A3C]/20 text-[#E89A3C] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">
                            New Vendor
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Totals & Terms Footer */}
                {totals && (
                  <tr className="bg-slate-50 border-t-2 border-slate-200">
                    <td colSpan={2} className="py-4 px-5 font-bold text-slate-800">
                      Totals & terms
                    </td>
                    <td className="py-4 px-4 text-right font-semibold text-slate-800">
                      {totals.benchmarkFormatted}
                    </td>
                    {vendors.map(v => {
                      const vt = totals.vendorTotals[v.vendorId];

                      return (
                        <td key={v.vendorId} className="py-4 px-4">
                          <div className="font-bold text-slate-800">{vt?.displayTotal || '—'}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {vt?.creditTerms || '30 d'} &middot; {vt?.deliveryLead || '5 d'}
                          </div>
                        </td>
                      );
                    })}
                    <td className="py-4 px-5 font-bold text-[#127670] bg-[#1EB4A1]/10">
                      {totals.savingsFormatted}
                    </td>
                  </tr>
                )}

                {/* Vendor Score Footer */}
                <tr className="bg-white border-t border-slate-100">
                  <td colSpan={3} className="py-4 px-5 font-semibold text-slate-500">
                    Vendor score
                  </td>
                  {vendors.map(v => (
                    <td key={v.vendorId} className="py-4 px-4">
                      <span className={cn(
                        "text-[11px] font-semibold px-2 py-1 rounded inline-block",
                        v.vendorScore === 'Unrated'
                          ? "text-[#E89A3C] bg-[#E89A3C]/10"
                          : "text-[#127670] bg-[#1EB4A1]/10"
                      )}>
                        {v.vendorScore}
                      </span>
                    </td>
                  ))}
                  <td className="py-4 px-5 bg-slate-50/50"></td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
        
        {/* Bottom Note */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-[12px] text-slate-500 mt-auto">
          Award can split by line (L1 per item) or go to one vendor for logistics. Overriding L1 requires a written reason, logged for audit.
        </div>
      </div>

      {/* Bottom Information Cards (Dynamic from Database) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-2">
        
        {/* Approval Matrix Card */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#127670] flex items-center justify-center shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h2 className="text-[14px] font-bold text-slate-900 leading-tight">Approval Matrix</h2>
                <p className="text-[11px] text-slate-500">Configurable policy tier governance</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Active Policy
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[13px] text-left whitespace-nowrap">
              <thead>
                <tr className="text-slate-500 border-b border-slate-100 font-semibold text-xs bg-slate-50/50">
                  <th className="py-2.5 px-3 rounded-l-lg">PO Value Tier</th>
                  <th className="py-2.5 px-3">Level 1</th>
                  <th className="py-2.5 px-3">Level 2</th>
                  <th className="py-2.5 px-3 rounded-r-lg">Level 3</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 divide-y divide-slate-100">
                {config?.approvalMatrix && config.approvalMatrix.length > 0 ? (
                  config.approvalMatrix.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-900">{row.po_value_tier}</td>
                      <td className="py-3 px-3 text-slate-600 font-medium">{row.level_1}</td>
                      <td className={cn("py-3 px-3 font-medium", row.level_2 === '—' ? "text-slate-400" : "text-slate-600")}>
                        {row.level_2}
                      </td>
                      <td className={cn("py-3 px-3 font-medium", row.level_3 === '—' ? "text-slate-400" : "text-slate-600")}>
                        {row.level_3}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                      Loading matrix policies...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Purchase Types Supported Card */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#127670] flex items-center justify-center shrink-0">
                <Layers size={18} />
              </div>
              <div>
                <h2 className="text-[14px] font-bold text-slate-900 leading-tight">Purchase Types Supported</h2>
                <p className="text-[11px] text-slate-500">Standard procurement frameworks</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Hospital SCM
            </span>
          </div>

          <div className="space-y-3">
            {config?.purchaseTypes && config.purchaseTypes.length > 0 ? (
              config.purchaseTypes.map((pt) => (
                <div key={pt.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#127670] shrink-0" />
                    <span className="font-bold text-xs text-slate-900">{pt.name}</span>
                  </div>
                  <p className="text-[12px] text-slate-600 mt-1 pl-4 leading-relaxed">
                    {pt.description}
                  </p>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                Loading purchase frameworks...
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
