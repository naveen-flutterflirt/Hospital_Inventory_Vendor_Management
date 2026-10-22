'use client';

import { useState, useEffect } from 'react';
import { 
  X, CheckCircle, AlertTriangle, ShieldCheck, Thermometer, 
  FileText, Truck, User, Printer, Loader2
} from 'lucide-react';
import { api, GrnDetail, GrnItem, GrnLineItem } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { SkeletonDetailDrawer } from '@/components/ui/Skeleton';

interface GrnDetailsModalProps {
  grnSummary: GrnItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export default function GrnDetailsModal({ grnSummary, isOpen, onClose, onUpdated }: GrnDetailsModalProps) {
  const { toast, showConfirm } = useToast();
  const [detail, setDetail] = useState<GrnDetail | null>(null);
  const [items, setItems] = useState<GrnLineItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [inspectorName, setInspectorName] = useState<string>('Chief Pharmacist QC');
  const [qcNotes, setQcNotes] = useState<string>('');
  const [debitNoteRef, setDebitNoteRef] = useState<string>('');

  useEffect(() => {
    if (isOpen && grnSummary?.id) {
      fetchGrnDetail(grnSummary.id);
    } else {
      setDetail(null);
      setItems([]);
      setActionSuccess(null);
    }
  }, [isOpen, grnSummary]);

  const fetchGrnDetail = async (id: number) => {
    setLoading(true);
    try {
      const res = await api.grn.getGrnById(id);
      if (res.success && res.data) {
        setDetail(res.data);
        setItems(res.data.items || []);
        setInspectorName(res.data.inspector || 'Chief Pharmacist QC');
        setQcNotes(res.data.qcNotes || '');
        setDebitNoteRef(res.data.debitNoteRef || `DN-24-${Math.floor(1000 + Math.random() * 9000)}`);
      }
    } catch (err) {
      console.error('Failed to load GRN detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleItemQtyChange = (index: number, acceptedVal: number) => {
    const updated = [...items];
    const it = updated[index];
    const max = it.receivedQuantity;
    const accepted = Math.max(0, Math.min(max, acceptedVal));
    const rejected = max - accepted;

    updated[index] = {
      ...it,
      acceptedQuantity: accepted,
      rejectedQuantity: rejected,
      qcStatus: rejected > 0 ? (accepted > 0 ? 'Partial' : 'Failed') : 'Passed',
    };
    setItems(updated);
  };

  const handleDecision = async (explicitDecision?: 'Passed' | 'Rejected') => {
    if (!detail) return;

    // Calculate decision based on item lines or explicit action
    let decision: 'Passed' | 'Partial' | 'Rejected' = explicitDecision || 'Passed';

    if (!explicitDecision) {
      const totalAccepted = items.reduce((sum, it) => sum + it.acceptedQuantity, 0);
      const totalRejected = items.reduce((sum, it) => sum + it.rejectedQuantity, 0);

      if (totalRejected === 0) {
        decision = 'Passed';
      } else if (totalAccepted === 0) {
        decision = 'Rejected';
      } else {
        decision = 'Partial';
      }
    }

    const isPartialOrRejected = decision === 'Partial' || decision === 'Rejected';
    const totalRejectedCount = items.reduce((sum, it) => sum + it.rejectedQuantity, 0);
    const totalAcceptedCount = items.reduce((sum, it) => sum + it.acceptedQuantity, 0);

    const confirmed = await showConfirm({
      title: isPartialOrRejected ? 'Confirm QC Exception & Debit Note' : 'Approve QC & Stock Clearance',
      message: isPartialOrRejected
        ? `Consignment has ${totalRejectedCount} rejected units. Confirm recording QC ${decision} and issuing Debit Note ${debitNoteRef}?`
        : `Approve quality inspection for ${detail.grnNumber} (${totalAcceptedCount} units) and clear to active formulary stock?`,
      confirmText: isPartialOrRejected ? 'Issue Debit Note & Clear' : 'Approve QC & Clear Stock',
      cancelText: 'Cancel',
      type: isPartialOrRejected ? 'warning' : 'success',
    });
    if (!confirmed) return;

    setSubmitting(true);
    setActionSuccess(null);

    try {
      const res = await api.grn.processQc(detail.id, {
        decision,
        inspector: inspectorName || 'Chief Pharmacist QC',
        qcNotes: qcNotes || (decision === 'Passed' ? 'Batch chemistry compliant. Cold-chain unbroken.' : 'Physical count/cold-chain variance recorded.'),
        debitNoteRef: (decision === 'Partial' || decision === 'Rejected') ? debitNoteRef : undefined,
        itemDecisions: items.map((it) => ({
          id: it.id,
          acceptedQuantity: it.acceptedQuantity,
          rejectedQuantity: it.rejectedQuantity,
          qcStatus: it.qcStatus,
        })),
      });

      if (res.success) {
        setActionSuccess(
          decision === 'Passed'
            ? 'Consignment approved & inventory cleared to active stock!'
            : `QC inspection recorded: ${decision === 'Partial' ? 'Partial Reject' : 'QC Failed'}. Debit note ${debitNoteRef} issued to vendor.`
        );
        toast.success(
          decision === 'Passed'
            ? 'Consignment approved & inventory cleared to active stock!'
            : `QC inspection recorded: ${decision === 'Partial' ? 'Partial Reject' : 'QC Failed'}. Debit note ${debitNoteRef} issued to vendor.`,
          'QC Inspection Updated'
        );
        await fetchGrnDetail(detail.id);
        if (onUpdated) {
          onUpdated();
        }
      } else {
        toast.error(res.message || 'Failed to record QC decision', 'QC Error');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error executing QC decision', 'QC Error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !grnSummary) return null;

  const current = detail || (grnSummary as any);
  const isColdChainSafe = (current.temperatureCelsius || 4.2) <= 8.0;
  const isInspectable = current.status === 'Pending QC' || current.status === 'Expected';

  const totalRejectedCount = items.reduce((acc, it) => acc + (it.rejectedQuantity || 0), 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#125F5C]/10 text-[#125F5C] flex items-center justify-center font-bold">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">{current.grnNumber}</h2>
                <span className={`text-[12px] font-semibold px-2.5 py-0.5 rounded-full ${current.statusClass}`}>
                  {current.status}
                </span>
                {current.debitNoteRef && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-rose-100 text-rose-700">
                    Debit Note: {current.debitNoteRef}
                  </span>
                )}
              </div>
              <p className="text-[12px] text-slate-500 flex items-center gap-2 mt-0.5">
                <span>PO: <strong className="text-slate-700 font-mono">{current.poRef}</strong></span>
                <span>•</span>
                <span>Received: {current.receivedDate}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Print Goods Receipt & QC Note"
            >
              <Printer size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {actionSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-[13px] font-medium animate-in fade-in">
              <CheckCircle className="text-emerald-600 flex-shrink-0" size={18} />
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 text-[11px] font-medium uppercase tracking-wider mb-1">
                <Truck size={14} /> Vendor
              </div>
              <p className="text-[13px] font-bold text-slate-800 truncate">{current.vendor}</p>
              <p className="text-[11px] text-slate-400">Code: {detail?.vendorCode || 'VND-STD'}</p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 text-[11px] font-medium uppercase tracking-wider mb-1">
                <FileText size={14} /> Inbound Invoice
              </div>
              <p className="text-[13px] font-bold text-slate-800 font-mono truncate">{current.invoiceNo || 'INV-PENDING'}</p>
              <p className="text-[11px] text-slate-400">Batch: {current.batchNumber || 'B-9021'}</p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 text-[11px] font-medium uppercase tracking-wider mb-1">
                <Thermometer size={14} /> Cold Chain
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[14px] font-bold ${isColdChainSafe ? 'text-teal-700' : 'text-rose-600'}`}>
                  {current.temperatureCelsius}°C
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${isColdChainSafe ? 'bg-teal-100 text-teal-800' : 'bg-rose-100 text-rose-800'}`}>
                  {isColdChainSafe ? 'Compliant' : 'Breach'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Target: 2.0°C – 8.0°C</p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 text-[11px] font-medium uppercase tracking-wider mb-1">
                <User size={14} /> Assigned QC Lead
              </div>
              <p className="text-[13px] font-bold text-slate-800 truncate">{current.inspector || 'Unassigned'}</p>
              <p className="text-[11px] text-slate-400">Expiry: {current.expiryDate || 'N/A'}</p>
            </div>
          </div>

          {/* Variance / Shortage Alert if any */}
          {current.shortageNotes && current.shortageNotes !== '-' && current.shortageNotes !== 'Full order received' && (
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-[13px] font-bold text-amber-900">Delivery Variance / Notes</p>
                <p className="text-[12px] text-amber-800 mt-0.5">{current.shortageNotes}</p>
              </div>
            </div>
          )}

          {/* Line Items Manifest Table */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-[14px] font-bold text-slate-800 flex items-center gap-2">
                <span>Received Consignment Manifest</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {items.length || current.linesCount || 1} lines
                </span>
              </h3>

              {isInspectable && (
                <span className="text-[11px] text-slate-500">
                  You can adjust Accepted / Rejected quantities for each line before clearance.
                </span>
              )}
            </div>

            {loading ? (
              <SkeletonDetailDrawer />
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[12px] border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-4">Item Code & Name</th>
                        <th className="py-2.5 px-3">Batch & Expiry</th>
                        <th className="py-2.5 px-3 text-right">Ordered</th>
                        <th className="py-2.5 px-3 text-right">Received</th>
                        <th className="py-2.5 px-3 text-right">Accepted</th>
                        <th className="py-2.5 px-3 text-right">Rejected</th>
                        <th className="py-2.5 px-3 text-right">Rate</th>
                        <th className="py-2.5 px-4 text-center">QC Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.length > 0 ? (
                        items.map((it, idx) => (
                          <tr key={it.id || idx} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4">
                              <p className="font-semibold text-slate-800 text-[13px]">{it.itemName}</p>
                              <p className="text-[11px] font-mono text-slate-400">{it.itemCode} • {it.uom}</p>
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-mono font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] block w-fit">
                                {it.batchNo}
                              </span>
                              <span className="text-[11px] text-slate-500 mt-0.5 block">Exp: {it.expiryDate}</span>
                            </td>
                            <td className="py-3 px-3 text-right font-medium text-slate-600">
                              {it.orderedQuantity.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-slate-800">
                              {it.receivedQuantity.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-teal-700">
                              {isInspectable ? (
                                <input
                                  type="number"
                                  min={0}
                                  max={it.receivedQuantity}
                                  value={it.acceptedQuantity}
                                  onChange={(e) => handleItemQtyChange(idx, parseInt(e.target.value) || 0)}
                                  className="w-16 text-right px-1.5 py-0.5 border border-slate-300 rounded font-bold text-teal-700 bg-white"
                                />
                              ) : (
                                it.acceptedQuantity.toLocaleString()
                              )}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-rose-600">
                              {it.rejectedQuantity > 0 ? it.rejectedQuantity.toLocaleString() : '-'}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-slate-600">
                              ₹{it.unitPrice.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                it.qcStatus === 'Passed' ? 'bg-emerald-100 text-emerald-800' :
                                it.qcStatus === 'Failed' ? 'bg-rose-100 text-rose-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {it.qcStatus}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-6 text-center text-slate-400">
                            No individual line items parsed for this delivery note.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Inspector Notes & Sign-off */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
            <h4 className="text-[13px] font-bold text-slate-800">Quality Inspection Audit Log</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Inspector Name
                </label>
                <input
                  type="text"
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  className="w-full text-[13px] border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#125F5C]/20"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Debit Note Reference (If Rejected)
                </label>
                <input
                  type="text"
                  value={debitNoteRef}
                  onChange={(e) => setDebitNoteRef(e.target.value)}
                  placeholder="DN-24-XXXX"
                  className="w-full text-[13px] border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#125F5C]/20 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Remarks / Clearance Details
                </label>
                <input
                  type="text"
                  value={qcNotes}
                  onChange={(e) => setQcNotes(e.target.value)}
                  placeholder="e.g. Visual integrity verified, compliant"
                  className="w-full text-[13px] border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#125F5C]/20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-[13px] font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {isInspectable && (
              <>
                <button
                  disabled={submitting}
                  onClick={() => handleDecision('Rejected')}
                  className="px-4 py-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[13px] font-semibold hover:bg-rose-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Full Consignment Reject
                </button>

                <button
                  disabled={submitting}
                  onClick={() => handleDecision()}
                  className="px-5 py-2 bg-[#125F5C] text-white rounded-lg text-[13px] font-semibold hover:bg-[#0f4d4a] transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>Processing Clearance...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      <span>
                        {totalRejectedCount > 0 ? 'Confirm Partial Clearance & Debit Note' : 'Approve QC & Clear to Stock'}
                      </span>
                    </>
                  )}
                </button>
              </>
            )}

            {!isInspectable && (
              <div className="flex items-center gap-1.5 text-teal-700 font-bold text-[13px] bg-teal-50 px-3.5 py-1.5 rounded-lg border border-teal-200">
                <CheckCircle size={16} />
                <span>Cleared to Active Formulary Stock</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
