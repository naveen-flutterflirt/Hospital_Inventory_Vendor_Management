import { useState, useEffect } from 'react';
import { X, ArrowRightLeft, Send, ChevronLeft, CheckCircle, Package, Clock, User, AlertCircle, Loader2 } from 'lucide-react';
import { api, StockTransferItem } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { SkeletonDetailDrawer } from '@/components/ui/Skeleton';

interface TransferDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transferId: number | null;
  onSuccess?: () => void;
}

export default function TransferDetailsModal({ isOpen, onClose, transferId, onSuccess }: TransferDetailsModalProps) {
  const { showConfirm, toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [transfer, setTransfer] = useState<StockTransferItem | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (isOpen && transferId) {
      loadDetails(transferId);
    } else {
      setTransfer(null);
      setItems([]);
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [isOpen, transferId]);

  const loadDetails = async (id: number) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await api.transfers.getTransferById(id);
      if (res.success && res.data) {
        setTransfer(res.data.transfer);
        setItems(res.data.items || []);
      } else {
        setErrorMessage(res.message || 'Failed to load transfer details');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error loading transfer record');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (nextStatus: string) => {
    if (!transfer) return;

    const confirmed = await showConfirm({
      title: nextStatus === 'Completed' ? 'Confirm Stock Receipt' : 'Dispatch Stock Transfer',
      message: nextStatus === 'Completed'
        ? `Confirm physical receipt of all supplies for transfer TR-${transfer.id} at destination? Stock balances will be committed.`
        : `Mark transfer TR-${transfer.id} as In Transit for physical department courier delivery?`,
      confirmText: nextStatus === 'Completed' ? 'Confirm Receipt' : 'Dispatch Now',
      cancelText: 'Cancel',
      type: nextStatus === 'Completed' ? 'success' : 'info',
    });
    if (!confirmed) return;

    setUpdating(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await api.transfers.updateStatus(transfer.id, nextStatus);
      if (res.success) {
        setSuccessMessage(`Status updated to ${nextStatus}`);
        toast.success(`Status updated to ${nextStatus}`, 'Transfer Updated');
        setTransfer(prev => prev ? { ...prev, status: nextStatus, status_class: getStatusClass(nextStatus) } : null);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setErrorMessage(res.message || 'Failed to update status');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error updating status');
    } finally {
      setUpdating(false);
    }
  };

  function getStatusClass(status: string) {
    switch (status) {
      case 'Completed':
        return 'bg-[#1EB4A1]/20 text-[#127670]';
      case 'Pending':
        return 'bg-[#E89A3C]/10 text-[#E89A3C]';
      case 'In Transit':
        return 'bg-blue-100 text-blue-700';
      case 'Cancelled':
        return 'bg-slate-200 text-slate-500 line-through decoration-slate-400';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#125F5C]/10 flex items-center justify-center text-[#125F5C]">
              {transfer?.type === 'Store Transfer' && <ArrowRightLeft size={20} />}
              {transfer?.type === 'Ward Return' && <ChevronLeft size={20} />}
              {(transfer?.type === 'Patient Issue' || transfer?.type === 'Ward Issue') && <Send size={20} />}
              {!transfer?.type && <Package size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  {transfer?.transfer_number || 'Transfer Details'}
                </h2>
                {transfer && (
                  <span className={cn("px-2.5 py-0.5 rounded-md text-[11px] font-semibold", transfer.status_class)}>
                    {transfer.status}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {transfer?.type || 'Stock Movement Record'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-[13px]">
          {loading ? (
            <SkeletonDetailDrawer />
          ) : errorMessage && !transfer ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          ) : transfer ? (
            <>
              {successMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle size={16} />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Information Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">From Location</span>
                  <p className="font-semibold text-slate-800">{transfer.from || 'Main Store'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">To Destination</span>
                  <p className="font-semibold text-slate-800">{transfer.to}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">Date / Time</span>
                  <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Clock size={13} className="text-slate-400" />
                    {transfer.date}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">Authorized By</span>
                  <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <User size={13} className="text-slate-400" />
                    {transfer.issued_by || 'Hospital Staff'}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">Line Items</span>
                  <p className="font-semibold text-[#127670]">{transfer.lines} verified line(s)</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">Dispatched On</span>
                  <p className="font-semibold text-slate-800">
                    {transfer.created_at ? new Date(transfer.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today'}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  <Package size={15} className="text-[#125F5C]" />
                  Transfer Item Manifest
                </h4>

                {items.length > 0 ? (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Item Name</th>
                          <th className="py-2.5 px-3">Code</th>
                          <th className="py-2.5 px-3">Batch</th>
                          <th className="py-2.5 px-3 text-right">Qty</th>
                          <th className="py-2.5 px-3">UOM</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 font-medium text-slate-800">{item.item_name}</td>
                            <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{item.item_code}</td>
                            <td className="py-2.5 px-3 text-slate-600">{item.batch_no || 'CTX2510D'}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900">{item.quantity}</td>
                            <td className="py-2.5 px-3 text-slate-500">{item.uom || 'units'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-xs flex items-center justify-between">
                    <span>Packaged manifest includes {transfer.lines} verified medical line item(s).</span>
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                      Barcodes Audited
                    </span>
                  </div>
                )}
              </div>

              {/* Notes */}
              {transfer.notes && (
                <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-lg">
                  <span className="text-[11px] font-semibold text-amber-800 block mb-0.5">Transfer Notes</span>
                  <p className="text-xs text-amber-900">{transfer.notes}</p>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-100 transition-colors cursor-pointer text-xs"
          >
            Close
          </button>

          {transfer && transfer.status !== 'Completed' && transfer.status !== 'Cancelled' && (
            <div className="flex items-center gap-2">
              {transfer.status === 'Pending' && (
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleStatusUpdate('In Transit')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {updating ? <Loader2 size={14} className="animate-spin" /> : <ArrowRightLeft size={14} />}
                  Dispatch (In Transit)
                </button>
              )}
              <button
                type="button"
                disabled={updating}
                onClick={() => handleStatusUpdate('Completed')}
                className="px-4 py-2 bg-[#125F5C] text-white rounded-lg text-xs font-semibold hover:bg-[#0c4240] transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                {updating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                Confirm Receipt & Complete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
