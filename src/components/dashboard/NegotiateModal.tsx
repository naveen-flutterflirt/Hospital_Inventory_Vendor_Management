'use client';

import { useState, useEffect } from 'react';
import { X, Send, Loader2, AlertCircle } from 'lucide-react';
import { api, RfqHeader, RfqVendorQuote, RfqComparisonItem } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

interface NegotiateModalProps {
  isOpen: boolean;
  onClose: () => void;
  rfq: RfqHeader | null;
  vendors: RfqVendorQuote[];
  items: RfqComparisonItem[];
  onNegotiated?: (vendorName: string) => void;
}

export default function NegotiateModal({
  isOpen,
  onClose,
  rfq,
  vendors,
  items,
  onNegotiated,
}: NegotiateModalProps) {
  const { showConfirm } = useToast();
  const [selectedVendorId, setSelectedVendorId] = useState<number | ''>('');
  const [targetRates, setTargetRates] = useState<Record<number, string>>({});
  const [message, setMessage] = useState<string>('Please match L1 pricing to win the full tender contract for this quarter.');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && vendors && vendors.length > 0) {
      if (!selectedVendorId || !vendors.some(v => v.vendorId === selectedVendorId)) {
        setSelectedVendorId(vendors[0].vendorId);
      }
      // Initialize target rates from items
      const initial: Record<number, string> = {};
      items.forEach(it => {
        if (it.targetPrice) {
          initial[it.id] = String(it.targetPrice);
        }
      });
      setTargetRates(initial);
      setErrorMsg(null);
    }
  }, [isOpen, vendors, items]);

  if (!isOpen) return null;

  const currentVendor = vendors.find(v => v.vendorId === selectedVendorId);

  const handleTargetChange = (itemId: number, val: string) => {
    setTargetRates(prev => ({ ...prev, [itemId]: val }));
  };

  const handleSend = async () => {
    if (!rfq || !selectedVendorId) {
      setErrorMsg('Please select a vendor.');
      return;
    }

    const confirmed = await showConfirm({
      title: 'Dispatch Counter-Offer Request',
      message: `Send revised target rate request to ${currentVendor?.vendorName || 'selected vendor'} for RFQ ${rfq.rfqNumber}?`,
      confirmText: 'Transmit Request',
      cancelText: 'Cancel',
      type: 'info',
    });
    if (!confirmed) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const formattedTargets = Object.entries(targetRates)
        .filter(([_, rate]) => rate && !isNaN(Number(rate)) && Number(rate) > 0)
        .map(([itemIdStr, rateStr]) => ({
          rfqItemId: Number(itemIdStr),
          targetRate: Number(rateStr),
        }));

      const res = await api.rfqQuotes.negotiate(rfq.rfqNumber || rfq.id, {
        vendorId: Number(selectedVendorId),
        message,
        targetRates: formattedTargets,
      });

      if (res.success) {
        if (onNegotiated) {
          onNegotiated(currentVendor?.vendorName || 'Vendor');
        }
        onClose();
      } else {
        setErrorMsg(res.message || 'Failed to dispatch negotiation request.');
      }
    } catch (err: any) {
      console.error('Failed to negotiate:', err);
      setErrorMsg(err.message || 'Server error occurred during negotiation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:px-6 sm:py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800">Negotiate Rates</h2>
            <p className="text-xs sm:text-[13px] text-slate-500">
              {rfq?.rfqNumber || 'RFQ'} &middot; {rfq?.title || 'Consumables'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-lg text-xs font-semibold bg-red-50 text-red-800 border border-red-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
              Select Vendor to Negotiate
            </label>
            <select 
              value={selectedVendorId}
              onChange={(e) => setSelectedVendorId(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] cursor-pointer bg-white"
            >
              {vendors.map((v) => (
                <option key={v.vendorId} value={v.vendorId}>
                  {v.vendorName} ({v.totalQuotedAmount ? `₹${(v.totalQuotedAmount / 100000).toFixed(2)}L` : 'Partial'})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3 border-b border-slate-200/60 pb-2">
              <h3 className="text-[13px] font-bold text-slate-800">Target Pricing Request</h3>
              <span className="text-[11px] text-slate-500 font-medium">Values in INR (₹)</span>
            </div>
            
            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
              {items.map((it) => {
                const quoteInfo = it.quotes[Number(selectedVendorId)];
                const currentDisplay = quoteInfo?.displayPrice || 'No bid';

                return (
                  <div key={it.id} className="flex items-center justify-between gap-3 text-xs bg-white p-2.5 rounded-lg border border-slate-100 shadow-2xs">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{it.itemName}</p>
                      <p className="text-[11px] text-slate-400">Qty: {it.quantity.toLocaleString('en-IN')} {it.uom}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[11.5px] text-slate-500 bg-slate-50 px-2 py-1 rounded font-medium border border-slate-100">
                        {currentDisplay}
                      </span>
                      <input 
                        type="number" 
                        step="0.1"
                        placeholder="Target ₹" 
                        value={targetRates[it.id] || ''}
                        onChange={(e) => handleTargetChange(it.id, e.target.value)}
                        className="w-20 border border-slate-200 rounded-md px-2 py-1 text-xs text-right font-medium text-slate-800 focus:outline-none focus:border-[#127670] bg-white" 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
              Message to Vendor
            </label>
            <textarea 
              rows={4} 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] resize-none"
              placeholder="E.g., Please match L1 pricing to win the full contract..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 flex gap-3">
          <button 
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-white transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleSend}
            disabled={submitting}
            className="flex-1 py-2.5 bg-[#127670] text-white rounded-lg text-xs font-bold hover:bg-[#0f605b] shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send size={14} />
                <span>Send Request</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
