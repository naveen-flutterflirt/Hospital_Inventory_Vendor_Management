'use client';

import { useState, useEffect } from 'react';
import { 
  X, CheckCircle2, Clock, ArrowRight, 
  Loader2, AlertTriangle,
  Building, Package, User, Check
} from 'lucide-react';
import { api, IndentDetail, IndentItem } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { SkeletonDetailDrawer } from '@/components/ui/Skeleton';

interface IndentDetailsModalProps {
  indentSummary: IndentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export default function IndentDetailsModal({
  indentSummary,
  isOpen,
  onClose,
  onUpdated,
}: IndentDetailsModalProps) {
  const router = useRouter();
  const { toast, showConfirm } = useToast();
  const [detail, setDetail] = useState<IndentDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && indentSummary) {
      fetchIndentDetail(indentSummary.id);
    } else {
      setDetail(null);
    }
  }, [isOpen, indentSummary]);

  const fetchIndentDetail = async (id: number | string) => {
    setLoading(true);
    try {
      const res = await api.indents.getById(id);
      if (res.success && res.data) {
        setDetail(res.data);
      } else {
        toast.error('Failed to retrieve indent details', 'Error');
      }
    } catch (err: any) {
      console.error('Failed to load indent detail:', err);
      toast.error(err.message || 'Failed to retrieve indent details', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    newStatus: 'Pending' | 'Processing' | 'Partially Issued' | 'Completed' | 'Cancelled'
  ) => {
    if (!detail) return;

    if (newStatus === 'Completed') {
      const confirmed = await showConfirm({
        title: 'Fulfill & Issue Indent',
        message: `Fulfill indent ${detail.indentNumber} and dispense supplies directly to ${detail.dept}?`,
        confirmText: 'Fulfill & Issue',
        cancelText: 'Cancel',
        type: 'success',
      });
      if (!confirmed) return;
    }

    setActionLoading(true);
    try {
      const res = await api.indents.updateStatus(detail.id, {
        status: newStatus,
        fulfilledBy: newStatus === 'Completed' ? 'Central Store Dispenser' : undefined,
      });

      if (res.success) {
        toast.success(
          `Indent ${detail.indentNumber} is now marked as ${newStatus}.`,
          `Status Updated: ${newStatus}`
        );
        await fetchIndentDetail(detail.id);
        if (onUpdated) onUpdated();
      } else {
        toast.error(res.message || 'Failed to update status', 'Error');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error occurred while updating status', 'Error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEscalate = async () => {
    if (!detail) return;

    const confirmed = await showConfirm({
      title: 'Escalate to Purchase Request',
      message: `Escalate ${detail.indentNumber} into a commercial Purchase Requisition for vendor quotation & purchase?`,
      confirmText: 'Escalate to PR',
      cancelText: 'Cancel',
      type: 'warning',
    });
    if (!confirmed) return;

    setActionLoading(true);
    try {
      const res = await api.indents.escalate(detail.id);
      if (res.success && res.data) {
        toast.success(
          `Indent escalated to Purchase Request ${res.data.prNumber}! Procurement team notified.`,
          'Escalated to PR'
        );
        await fetchIndentDetail(detail.id);
        if (onUpdated) onUpdated();
      } else {
        toast.error(res.message || 'Failed to escalate indent', 'Error');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error occurred during escalation', 'Error');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen || !indentSummary) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#127670]/10 flex items-center justify-center text-[#127670] font-bold">
              <Package size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  {indentSummary.indentNumber}
                </h2>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[11px] font-semibold border",
                  indentSummary.priority === 'Emergency' ? 'bg-[#D94432]/10 text-[#D94432] border-[#D94432]/20' :
                  indentSummary.priority === 'Urgent' ? 'bg-[#E89A3C]/10 text-[#E89A3C] border-[#E89A3C]/20' :
                  'bg-slate-100 text-slate-700 border-slate-200'
                )}>
                  {indentSummary.priority === 'Emergency' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#D94432] mr-1.5 animate-pulse" />}
                  {indentSummary.priority} Priority
                </span>
                <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-semibold", indentSummary.statusClass)}>
                  {detail?.status || indentSummary.status}
                </span>
              </div>
              <p className="text-[12px] text-slate-500 mt-0.5">
                Requisition from <span className="font-semibold text-slate-700">{indentSummary.dept}</span> to <span className="font-semibold text-slate-700">{indentSummary.toStore}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading ? (
            <SkeletonDetailDrawer />
          ) : detail ? (
            <>
              {/* Escalated Banner if applicable */}
              {detail.escalatedToPr && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="text-amber-600 shrink-0" size={18} />
                    <div className="text-[13px] text-amber-900">
                      <span className="font-semibold">Escalated to Purchase Request:</span> Out-of-stock items have been converted to enterprise requisition{' '}
                      <span className="font-bold underline">{detail.escalatedToPr}</span>.
                    </div>
                  </div>
                  <button
                    onClick={() => router.push('/purchase-requests')}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[12px] font-semibold transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    View PRs <ArrowRight size={13} />
                  </button>
                </div>
              )}

              {/* Fulfilled Banner if Completed */}
              {detail.status === 'Completed' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center gap-2.5 text-emerald-900 text-[13px]">
                  <CheckCircle2 className="text-emerald-600 shrink-0" size={18} />
                  <div>
                    <span className="font-semibold">Indent Fully Fulfilled:</span> All requisitioned items have been dispensed by{' '}
                    <span className="font-bold">{detail.fulfilledBy || 'Central Store Dispenser'}</span>.
                  </div>
                </div>
              )}

              {/* Metadata Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 text-[12px]">
                <div>
                  <span className="text-slate-400 block font-medium">Requesting Ward</span>
                  <span className="font-semibold text-slate-800 text-[13px] mt-0.5 block flex items-center gap-1">
                    <Building size={13} className="text-slate-400" /> {detail.dept}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Target Store</span>
                  <span className="font-semibold text-slate-800 text-[13px] mt-0.5 block">
                    {detail.toStore}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Raised By</span>
                  <span className="font-semibold text-slate-800 text-[13px] mt-0.5 block flex items-center gap-1">
                    <User size={13} className="text-slate-400" /> {detail.raisedBy}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Requested Time</span>
                  <span className="font-semibold text-slate-800 text-[13px] mt-0.5 block flex items-center gap-1">
                    <Clock size={13} className="text-slate-400" /> {detail.time}
                  </span>
                </div>
              </div>

              {/* Ward Notes */}
              {detail.notes && (
                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-[12px] text-slate-600">
                  <span className="font-semibold text-blue-900 block mb-0.5">Ward Requisition Notes:</span>
                  {detail.notes}
                </div>
              )}

              {/* Items Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Package size={15} className="text-[#127670]" /> Requisitioned Line Items ({detail.items.length})
                  </h3>
                  <span className="text-[12px] text-slate-500">Live store inventory stock verified</span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-[13px] text-left">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[12px]">
                        <tr>
                          <th className="py-2.5 px-3">Item Details</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3 text-right">Req. Qty</th>
                          <th className="py-2.5 px-3 text-right">Store Stock</th>
                          <th className="py-2.5 px-3 text-right">Issued Qty</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {detail.items.map((it) => {
                          const isLowStock = (it.storeStock ?? 0) < it.quantityRequested;
                          return (
                            <tr key={it.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3 px-3">
                                <div className="font-semibold text-slate-800">{it.itemName}</div>
                                {it.itemCode && (
                                  <div className="text-[11px] font-mono text-slate-400">{it.itemCode}</div>
                                )}
                              </td>
                              <td className="py-3 px-3">
                                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                                  {it.category || 'General'}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right font-bold text-slate-800">
                                {it.quantityRequested} <span className="text-[11px] font-normal text-slate-500">{it.uom}</span>
                              </td>
                              <td className="py-3 px-3 text-right font-semibold">
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[11px]",
                                  isLowStock ? "bg-rose-50 text-rose-700 font-bold" : "bg-emerald-50 text-emerald-700"
                                )}>
                                  {it.storeStock ?? '—'} in store
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right font-medium text-slate-800">
                                {it.quantityIssued} <span className="text-[11px] text-slate-400">{it.uom}</span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-[11px] font-semibold",
                                  it.status === 'Issued' ? "bg-emerald-100 text-emerald-800" :
                                  it.status === 'Partially Issued' ? "bg-blue-100 text-blue-800" :
                                  "bg-amber-100 text-amber-800"
                                )}>
                                  {it.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        {detail && (
          <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="text-[12px] text-slate-500">
              {detail.status === 'Completed' ? (
                <span className="text-emerald-700 font-medium flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-600" /> Completed on {new Date(detail.fulfilledAt || detail.createdAt).toLocaleDateString()}
                </span>
              ) : (
                <span>Change fulfillment status or escalate out-of-stock items to procurement</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-[13px] font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>

              {detail.status !== 'Completed' && (
                <>
                  {!detail.escalatedToPr && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleEscalate}
                      className="px-3.5 py-2 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[13px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <AlertTriangle size={14} />}
                      Escalate to PR
                    </button>
                  )}

                  {detail.status === 'Pending' && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleUpdateStatus('Processing')}
                      className="px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-[13px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Clock size={14} />}
                      Mark Processing
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus('Completed')}
                    className="px-4 py-2 bg-[#127670] hover:bg-[#0f605b] text-white rounded-lg text-[13px] font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    Fulfill & Issue Indent
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
