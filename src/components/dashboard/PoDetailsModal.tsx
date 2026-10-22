'use client';

import { useState, useEffect } from 'react';
import { 
  X, CheckCircle2, AlertCircle, Truck, ShieldCheck, 
  FileText, Building2, CreditCard, MapPin, Printer, 
  Check, Ban, Loader2
} from 'lucide-react';
import { api, PoDetail, PoItemSummary } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { SkeletonDetailDrawer } from '@/components/ui/Skeleton';

interface PoDetailsModalProps {
  poSummary: PoItemSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export default function PoDetailsModal({ poSummary, isOpen, onClose, onUpdated }: PoDetailsModalProps) {
  const { toast, showConfirm } = useToast();
  const [detail, setDetail] = useState<PoDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (isOpen && poSummary) {
      fetchDetail(poSummary.poNumber || poSummary.id);
    } else {
      setDetail(null);
      setFeedback(null);
    }
  }, [isOpen, poSummary]);

  const fetchDetail = async (idOrNumber: string | number) => {
    setLoading(true);
    try {
      const res = await api.purchaseOrders.getPoById(idOrNumber);
      if (res.success && res.data) {
        setDetail(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch PO details:', err);
      setFeedback({ message: 'Failed to load purchase order details from server.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!detail) return;

    const isCancellation = newStatus === 'Cancelled';
    const confirmed = await showConfirm({
      title: isCancellation ? 'Cancel Purchase Order' : `Update Status: ${newStatus}`,
      message: isCancellation
        ? `Are you sure you want to cancel ${detail.poNumber}? Any linked vendor fulfillment pipelines will be terminated.`
        : `Update ${detail.poNumber} to status "${newStatus}"?`,
      confirmText: isCancellation ? 'Cancel Order' : 'Confirm Status',
      cancelText: 'Go Back',
      type: isCancellation ? 'danger' : 'success',
    });
    if (!confirmed) return;

    setActionLoading(true);
    setFeedback(null);

    try {
      const res = await api.purchaseOrders.updatePoStatus(
        detail.poNumber,
        newStatus,
        `Status updated to ${newStatus} via dashboard`,
        'Dr. Rajesh Verma (Medical Director)'
      );

      if (res.success) {
        setFeedback({ message: `Purchase Order marked as ${newStatus} successfully!`, type: 'success' });
        toast.success(`Purchase Order marked as ${newStatus} successfully!`, 'Status Updated');
        // Refresh local detail and notify parent table
        await fetchDetail(detail.poNumber);
        if (onUpdated) onUpdated();
      } else {
        setFeedback({ message: res.message || 'Failed to update order status.', type: 'error' });
      }
    } catch (err: any) {
      console.error('Update status error:', err);
      setFeedback({ message: err.message || 'Error communicating with database.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  const subtotal = detail?.items?.reduce((acc, it) => acc + (it.quantity * it.unitPrice), 0) || 0;
  const taxTotal = detail?.items?.reduce((acc, it) => acc + (it.quantity * it.unitPrice * (it.taxPercent / 100)), 0) || 0;
  const grandTotal = subtotal + taxTotal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#127670]/10 flex items-center justify-center text-[#127670] font-bold">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  {detail?.poNumber || poSummary?.poNumber || 'Purchase Order'}
                </h2>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[11px] font-semibold border",
                  detail?.statusClass || poSummary?.statusClass || "bg-slate-100 text-slate-700 border-slate-200"
                )}>
                  {detail?.status || poSummary?.status}
                </span>
                {detail?.type && (
                  <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    {detail.type}
                  </span>
                )}
              </div>
              <p className="text-[12px] text-slate-500 mt-0.5 flex items-center gap-2">
                <span>Vendor: <strong className="text-slate-700 font-semibold">{detail?.vendor || poSummary?.vendor}</strong></span>
                <span>•</span>
                <span>Due: <strong className="text-slate-700 font-semibold">{detail?.due || poSummary?.due}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => window.print()}
              title="Print Order Manifest"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              <Printer size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={cn(
            "mx-4 sm:mx-6 mt-4 p-3 rounded-lg text-xs font-semibold flex items-center justify-between border",
            feedback.type === 'success' 
              ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
              : "bg-red-50 text-red-800 border-red-200"
          )}>
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {loading ? (
            <SkeletonDetailDrawer />
          ) : detail ? (
            <>
              {/* Order Stepper Status Preview */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    detail.status === 'Cancelled' ? 'bg-slate-400' : 'bg-emerald-500 animate-pulse'
                  )} />
                  <span className="font-semibold text-slate-700">Contract Lifecycle:</span>
                  <span className="text-slate-500 font-medium">
                    {detail.status === 'Awaiting approval' && 'Awaiting executive authorization & digital sign-off'}
                    {detail.status === 'Dispatched' && 'Transmitted to vendor dock. Awaiting delivery acknowledgement.'}
                    {detail.status === 'Accepted' && 'Vendor confirmed manufacturing / transit schedule.'}
                    {detail.status === 'Overdue' && 'Delivery past SLA window! Urgent follow-up initiated.'}
                    {detail.status === 'Delivered' && 'Goods received at dock. Passed into GRN & QC inspection.'}
                    {detail.status === 'Cancelled' && 'Purchase requisition voided.'}
                  </span>
                </div>
                {detail.approvedBy && (
                  <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-100/60 px-2.5 py-1 rounded-md text-[11px] font-semibold">
                    <ShieldCheck size={14} /> Approved by {detail.approvedBy}
                  </div>
                )}
              </div>

              {/* Vendor & Shipping Specs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vendor Details */}
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 size={14} className="text-[#127670]" /> Vendor Information
                    </h3>
                    <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {detail.vendorCode || 'VENDOR'}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-[12.5px]">
                    <p className="font-bold text-slate-900">{detail.vendor}</p>
                    {detail.vendorCategory && (
                      <p className="text-slate-500 text-[11.5px]">Category: <span className="text-slate-700 font-medium">{detail.vendorCategory}</span></p>
                    )}
                    {detail.vendorGstin && (
                      <p className="text-slate-500 text-[11.5px]">GSTIN: <span className="font-mono text-slate-700 font-medium">{detail.vendorGstin}</span></p>
                    )}
                    <p className="text-slate-500 text-[11.5px]">Email: <span className="text-slate-700">{detail.vendorEmail || 'orders@pharma-distributors.in'}</span></p>
                    <p className="text-slate-500 text-[11.5px]">Phone: <span className="text-slate-700">{detail.vendorPhone || '+91 22 4099 8200'}</span></p>
                    <p className="text-slate-500 text-[11.5px]">Address: <span className="text-slate-700">{detail.vendorAddress || 'Plot 44, MIDC Industrial Area, Mumbai'}</span></p>
                  </div>
                </div>

                {/* Terms & Delivery Destination */}
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin size={14} className="text-[#127670]" /> Logistics & Settlement
                    </h3>
                    <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                      <CreditCard size={12} /> {detail.paymentTerms}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-[12.5px]">
                    <div>
                      <p className="text-slate-400 text-[11px] font-medium">Delivery Destination:</p>
                      <p className="text-slate-700 font-medium text-[12px]">{detail.shippingAddress || 'Central Receiving Dock, Apex Super Specialty Hospital'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[11px] font-medium">Billing Account:</p>
                      <p className="text-slate-700 font-medium text-[12px]">{detail.billingAddress || 'Accounts Dept, Apex Super Specialty Hospital, Main Campus'}</p>
                    </div>
                    {detail.notes && (
                      <div className="pt-1">
                        <p className="text-slate-400 text-[11px] font-medium">Internal Notes:</p>
                        <p className="text-slate-600 italic text-[11.5px] bg-slate-50 p-2 rounded border border-slate-100">{detail.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Manifest Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Itemized Manifest ({detail.items?.length || 0} Line Items)
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium">Values in INR (₹)</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[12.5px]">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 font-semibold text-[11.5px]">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Item Code</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3 text-right">Qty</th>
                        <th className="py-2.5 px-3">UOM</th>
                        <th className="py-2.5 px-3 text-right">Unit Rate (₹)</th>
                        <th className="py-2.5 px-3 text-right">Tax (%)</th>
                        <th className="py-2.5 px-3 text-right">Line Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detail.items && detail.items.length > 0 ? (
                        detail.items.map((it, idx) => (
                          <tr key={it.id || idx} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-2.5 px-3 text-slate-400 font-medium">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-mono font-medium text-slate-700">{it.itemCode}</td>
                            <td className="py-2.5 px-3 font-medium text-slate-900">{it.itemName}</td>
                            <td className="py-2.5 px-3 text-right font-semibold text-slate-800">{it.quantity}</td>
                            <td className="py-2.5 px-3 text-slate-500">{it.uom}</td>
                            <td className="py-2.5 px-3 text-right text-slate-700">₹{it.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="py-2.5 px-3 text-right text-slate-500">{it.taxPercent}%</td>
                            <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                              ₹{it.lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400">
                            No itemized lines recorded for this PO.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Calculation Summary Footer */}
                <div className="bg-slate-50/80 p-4 border-t border-slate-200 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4">
                  <div className="text-[12px] text-slate-500">
                    <span>Terms: </span>
                    <span className="font-semibold text-slate-700">{detail.paymentTerms}</span>
                    <span className="mx-2">•</span>
                    <span>Created: </span>
                    <span className="font-semibold text-slate-700">{new Date(detail.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="w-full sm:w-72 space-y-1.5 text-right text-[12.5px]">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal:</span>
                      <span className="font-medium text-slate-800">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>GST (Taxes):</span>
                      <span className="font-medium text-slate-800">₹{taxTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-1.5 flex justify-between text-sm font-bold text-slate-900">
                      <span>Grand Total:</span>
                      <span className="text-[#127670] text-base font-extrabold">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-500">
              Order not found.
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">PO Control Actions:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {detail?.status === 'Awaiting approval' && (
              <>
                <button
                  type="button"
                  onClick={() => handleStatusUpdate('Cancelled')}
                  disabled={actionLoading}
                  className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <Ban size={14} /> Reject Requisition
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusUpdate('Dispatched')}
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#125F5C] hover:bg-[#0c4240] rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={2.5} />}
                  Approve & Dispatch to Vendor
                </button>
              </>
            )}

            {detail?.status === 'Dispatched' && (
              <>
                <button
                  type="button"
                  onClick={() => handleStatusUpdate('Accepted')}
                  disabled={actionLoading}
                  className="px-3.5 py-2 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 size={14} /> Mark Accepted by Vendor
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusUpdate('Delivered')}
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#125F5C] hover:bg-[#0c4240] rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Truck size={14} strokeWidth={2.5} />}
                  Mark Goods Received (Dock)
                </button>
              </>
            )}

            {detail?.status === 'Accepted' && (
              <button
                type="button"
                onClick={() => handleStatusUpdate('Delivered')}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#125F5C] hover:bg-[#0c4240] rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Truck size={14} strokeWidth={2.5} />}
                Mark Goods Received (Dock)
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
