'use client';

import { useState, useEffect } from 'react';
import { 
  X, CheckCircle2, Loader2, ShieldCheck, ShoppingCart, Tag, AlertTriangle
} from 'lucide-react';
import { api, PrDetail, PrItem } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { SkeletonDetailDrawer } from '@/components/ui/Skeleton';

interface PrDetailsModalProps {
  prSummary: PrItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export default function PrDetailsModal({
  prSummary,
  isOpen,
  onClose,
  onUpdated,
}: PrDetailsModalProps) {
  const router = useRouter();
  const { toast, showConfirm } = useToast();
  const [detail, setDetail] = useState<PrDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [rejectMode, setRejectMode] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  useEffect(() => {
    if (isOpen && prSummary) {
      setRejectMode(false);
      setRejectionReason('');
      fetchPrDetail(prSummary.id);
    } else {
      setDetail(null);
    }
  }, [isOpen, prSummary]);

  const fetchPrDetail = async (id: number | string) => {
    setLoading(true);
    try {
      const res = await api.purchaseRequests.getById(id);
      if (res.success && res.data) {
        setDetail(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load PR detail:', err);
      toast.error('Failed to retrieve PR details', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    newStatus: 'Pending L1' | 'Pending CFO' | 'Approved' | 'Rejected',
    reason?: string
  ) => {
    if (!detail) return;

    if (newStatus === 'Rejected') {
      const confirmed = await showConfirm({
        title: 'Reject Requisition',
        message: `Are you sure you want to reject Purchase Request ${detail.prNumber}? Reason: "${reason || 'Unspecified'}". This will notify the department.`,
        confirmText: 'Reject Requisition',
        cancelText: 'Go Back',
        type: 'danger',
      });
      if (!confirmed) return;
    } else if (newStatus === 'Approved') {
      const confirmed = await showConfirm({
        title: 'Approve Requisition',
        message: `Approve requisition ${detail.prNumber} (${detail.department}) for procurement processing?`,
        confirmText: 'Approve PR',
        cancelText: 'Review More',
        type: 'success',
      });
      if (!confirmed) return;
    } else if (newStatus === 'Pending CFO') {
      const confirmed = await showConfirm({
        title: 'Route to CFO',
        message: `Forward requisition ${detail.prNumber} to Chief Financial Officer for high-value financial clearance?`,
        confirmText: 'Route to CFO',
        cancelText: 'Cancel',
        type: 'warning',
      });
      if (!confirmed) return;
    }

    setActionLoading(true);
    try {
      const res = await api.purchaseRequests.updateStatus(detail.id, {
        status: newStatus,
        rejectionReason: reason,
        approvedBy: newStatus === 'Approved' ? 'Medical Director & CFO' : undefined,
      });

      if (res.success) {
        toast.success(
          `Purchase Request ${detail.prNumber} is now ${newStatus}.`,
          `Status Updated: ${newStatus}`
        );
        setRejectMode(false);
        await fetchPrDetail(detail.id);
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

  const handleConvert = async (targetType: 'PO' | 'RFQ') => {
    if (!detail) return;

    const confirmed = await showConfirm({
      title: targetType === 'PO' ? 'Generate Purchase Order' : 'Launch RFQ Tender',
      message: `Generate official ${targetType === 'PO' ? 'Purchase Order' : 'Request for Quotation'} for approved requisition ${detail.prNumber}?`,
      confirmText: targetType === 'PO' ? 'Generate PO' : 'Launch RFQ',
      cancelText: 'Cancel',
      type: 'info',
    });
    if (!confirmed) return;

    setActionLoading(true);
    try {
      const res = await api.purchaseRequests.convert(detail.id, targetType);
      if (res.success && res.data) {
        toast.success(
          res.message || `Successfully generated ${targetType}`,
          'Converted Successfully'
        );
        onClose();
        if (onUpdated) onUpdated();
        router.push(res.data.link);
      } else {
        toast.error(res.message || 'Failed to convert requisition', 'Error');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error converting requisition', 'Error');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen || !prSummary) return null;

  const current = detail || (prSummary as any);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-xs sm:text-[13px] font-bold text-slate-900 bg-slate-200/80 px-2.5 py-1 rounded-md border border-slate-300/50">
              {current.prNumber}
            </span>
            <span className={cn(
              "text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs",
              current.status === 'Approved' && "bg-emerald-50 text-emerald-800 border-emerald-200",
              current.status === 'Rejected' && "bg-rose-50 text-rose-800 border-rose-200",
              (current.status === 'Pending L1' || current.status === 'Pending CFO') && "bg-amber-50 text-amber-800 border-amber-200"
            )}>
              {current.status}
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">&bull;</span>
            <span className="text-xs font-semibold text-slate-600 hidden sm:inline">{current.department}</span>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-full transition-colors cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {loading && !detail ? (
            <SkeletonDetailDrawer />
          ) : (
            <>
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5 font-medium">Department</span>
                  <span className="font-bold text-slate-800 text-[13px]">{current.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 font-medium">Purchase Type</span>
                  <span className="font-semibold text-slate-800">{current.purchaseType || 'Regular PO'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 font-medium">Priority</span>
                  <span className={cn(
                    "font-bold",
                    current.priority === 'Emergency' ? "text-rose-600" : current.priority === 'Urgent' ? "text-amber-600" : "text-slate-700"
                  )}>
                    {current.priority || 'Routine'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 font-medium">Raised By</span>
                  <span className="font-semibold text-slate-800 truncate block">{current.raisedBy}</span>
                </div>
              </div>

              {/* Remarks / Justification */}
              {current.remarks && (
                <div className="p-3 bg-teal-50/40 rounded-xl border border-teal-100/70 text-xs">
                  <span className="font-bold text-[#127670] block mb-1">Requisition Justification:</span>
                  <p className="text-slate-700 leading-relaxed">{current.remarks}</p>
                </div>
              )}

              {/* Rejection notice if any */}
              {current.status === 'Rejected' && current.rejectionReason && (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-rose-800 mb-1">
                    <AlertTriangle size={14} className="text-rose-600" />
                    <span>Rejection Reason:</span>
                  </div>
                  <p className="text-rose-700 leading-relaxed">{current.rejectionReason}</p>
                </div>
              )}

              {/* Converted badges */}
              {current.convertedToPo && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span className="font-bold text-emerald-900">
                      Converted to Purchase Order {current.convertedToPo}
                    </span>
                  </div>
                  <button 
                    onClick={() => { onClose(); router.push('/purchase-orders'); }}
                    className="text-xs font-bold text-[#127670] hover:underline cursor-pointer"
                  >
                    View PO &rarr;
                  </button>
                </div>
              )}

              {current.convertedToRfq && (
                <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag size={16} className="text-teal-600 shrink-0" />
                    <span className="font-bold text-teal-900">
                      Converted to RFQ Tender {current.convertedToRfq}
                    </span>
                  </div>
                  <button 
                    onClick={() => { onClose(); router.push('/rfq-quotes'); }}
                    className="text-xs font-bold text-[#127670] hover:underline cursor-pointer"
                  >
                    View RFQ &rarr;
                  </button>
                </div>
              )}

              {/* Line Items Manifest */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight">
                    Requisition Line Items ({detail?.items?.length || current.itemsCount || 1})
                  </h3>
                  <span className="text-xs font-semibold text-slate-500">
                    Est. Value: <strong className="text-slate-900">{current.estimatedValueFormatted}</strong>
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <th className="py-2.5 px-3">Item Details</th>
                        <th className="py-2.5 px-3 text-right">Qty</th>
                        <th className="py-2.5 px-3 text-right">Est. Rate</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {detail?.items && detail.items.length > 0 ? (
                        detail.items.map((it, idx) => (
                          <tr key={it.id || idx} className="hover:bg-slate-50/60">
                            <td className="py-2.5 px-3">
                              <span className="font-semibold text-slate-800 block truncate">{it.itemName}</span>
                              {it.itemCode && (
                                <span className="font-mono text-[10px] text-slate-400">{it.itemCode}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium">
                              {it.quantity} <span className="text-slate-400 text-[10px]">{it.uom}</span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium text-slate-600">
                              ₹{it.unitRate.toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                              {it.totalAmountFormatted}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-400">
                            Line items loading...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Rejection input form if in rejectMode */}
              {rejectMode && (
                <div className="p-3.5 bg-rose-50/80 rounded-xl border border-rose-200 space-y-2 animate-in fade-in duration-200">
                  <label className="block text-xs font-bold text-rose-900">
                    Provide Reason for Rejection:
                  </label>
                  <textarea
                    rows={2}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="E.g., Disallowed outside budget window or duplicate requisition..."
                    className="w-full text-xs p-2 rounded-lg border border-rose-300 bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setRejectMode(false)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading || !rejectionReason.trim()}
                      onClick={() => handleUpdateStatus('Rejected', rejectionReason)}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer disabled:opacity-50"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between flex-wrap gap-2">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-[13px] font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            {current.status === 'Pending L1' && (
              <>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setRejectMode(true)}
                  className="px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                >
                  Reject
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus('Pending CFO')}
                  className="px-3.5 py-2 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                >
                  Route to CFO
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus('Approved')}
                  className="px-4 py-2 text-xs sm:text-[13px] font-bold text-white bg-[#127670] hover:bg-[#0f605b] rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  <span>Approve PR</span>
                </button>
              </>
            )}

            {current.status === 'Pending CFO' && (
              <>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setRejectMode(true)}
                  className="px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                >
                  Reject
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus('Approved')}
                  className="px-4 py-2 text-xs sm:text-[13px] font-bold text-white bg-[#127670] hover:bg-[#0f605b] rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                  <span>CFO Approval</span>
                </button>
              </>
            )}

            {current.status === 'Approved' && !current.convertedToPo && !current.convertedToRfq && (
              <>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleConvert('RFQ')}
                  className="px-3.5 py-2 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Tag size={13} />
                  <span>Launch RFQ</span>
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleConvert('PO')}
                  className="px-4 py-2 text-xs sm:text-[13px] font-bold text-white bg-[#127670] hover:bg-[#0f605b] rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <ShoppingCart size={14} />}
                  <span>Raise Purchase Order</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
