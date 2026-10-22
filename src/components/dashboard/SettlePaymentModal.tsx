import React, { useState, useEffect } from 'react';
import { X, CreditCard, CheckCircle, Search, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, PendingSettlementItem } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

interface SettlePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SettlePaymentModal({ isOpen, onClose, onSuccess }: SettlePaymentModalProps) {
  const { showConfirm, toast } = useToast();
  const [success, setSuccess] = useState(false);
  const [method, setMethod] = useState<'bank' | 'cheque'>('bank');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [settledData, setSettledData] = useState<{ txnRef: string; amount: string; invoiceNumber: string } | null>(null);

  // Pending invoices
  const [pendingInvoices, setPendingInvoices] = useState<PendingSettlementItem[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<PendingSettlementItem | null>(null);

  // Form Fields
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [notes, setNotes] = useState('');

  // Initial load on open
  useEffect(() => {
    if (isOpen) {
      setSuccess(false);
      setErrorMessage('');
      setSettledData(null);
      setPaymentRef('');
      setNotes('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      loadPendingInvoices('');
    }
  }, [isOpen]);

  // Debounced search for pending invoices
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      loadPendingInvoices(searchTerm);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, isOpen]);

  const loadPendingInvoices = async (query: string) => {
    setIsLoadingInvoices(true);
    try {
      const res = await api.invoices.getPendingSettlement(query);
      if (res.success && res.data) {
        setPendingInvoices(res.data);
        // If nothing is selected and we have items, auto-select the first one if initial load
        if (!selectedInvoice && res.data.length > 0 && !query) {
          setSelectedInvoice(res.data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load pending settlement invoices:', err);
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedInvoice) {
      setErrorMessage('Please select an unsettled invoice to process payment');
      return;
    }

    if (!paymentRef.trim()) {
      setErrorMessage(method === 'bank' ? 'Bank reference (UTR) is required' : 'Cheque number is required');
      return;
    }

    if (!paymentDate) {
      setErrorMessage('Please select a valid payment date');
      return;
    }

    const confirmed = await showConfirm({
      title: 'Authorize Invoice Settlement',
      message: `Authorize disbursement of ${selectedInvoice.amount_formatted || selectedInvoice.amount} via ${method === 'bank' ? 'Bank Transfer (NEFT/RTGS)' : 'Cheque'} to ${selectedInvoice.vendor_name}? Reference: "${paymentRef.trim()}".`,
      confirmText: 'Authorize Payment',
      cancelText: 'Cancel',
      type: 'success',
    });
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      const res = await api.invoices.settlePayment({
        invoiceId: selectedInvoice.id,
        paymentMethod: method === 'bank' ? 'Bank Transfer (UTR)' : 'Cheque',
        paymentRef: paymentRef.trim(),
        paymentDate,
        notes: notes.trim() || undefined,
      });

      if (res.success && res.data?.payment) {
        setSettledData({
          txnRef: res.data.payment.transaction_ref,
          amount: res.data.payment.amount_formatted,
          invoiceNumber: res.data.payment.invoice_number,
        });
        setSuccess(true);
        toast.success(`Payment of ${res.data.payment.amount_formatted} settled (Txn: ${res.data.payment.transaction_ref})`, 'Payment Disbursed');
        if (onSuccess) {
          onSuccess();
        }

        // Auto close after 2.2 seconds
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 2200);
      } else {
        setErrorMessage(res.message || 'Payment processing failed. Please try again.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred during payment settlement';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/40 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <CreditCard size={18} className="text-[#127670]" /> Settle Payment
            </h2>
            <p className="text-[13px] text-slate-500">Process and sync payment to accounting</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1.5 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        {success && settledData ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95">
            <CheckCircle size={64} className="text-[#1EB4A1] mb-4" />
            <h3 className="text-lg font-bold text-slate-800">Payment Processed</h3>
            <p className="text-[14px] text-slate-600 mt-2">
              <strong className="text-[#127670]">{settledData.amount}</strong> settled for invoice <span className="font-semibold text-slate-800">{settledData.invoiceNumber}</span>.
            </p>
            <p className="text-[12px] text-slate-400 mt-2">
              Ledger transaction ref: <span className="font-mono text-slate-600">{settledData.txnRef}</span> • Synced to Accounts Payable
            </p>
          </div>
        ) : (
          <form id="payment-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[13px] flex items-start gap-2 animate-in fade-in">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Search & Select Pending Invoice</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search invoice by ID or Vendor..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-md text-[13px] w-full focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
                />
                {isLoadingInvoices && (
                  <Loader2 size={16} className="animate-spin text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                )}
              </div>

              {/* Suggestions / Pending List Dropdown */}
              {pendingInvoices.length > 0 && (
                <div className="mt-1.5 max-h-36 overflow-y-auto border border-slate-200 rounded-lg bg-white shadow-sm divide-y divide-slate-100">
                  {pendingInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      onClick={() => setSelectedInvoice(inv)}
                      className={cn(
                        "p-2.5 px-3 text-left cursor-pointer transition-colors flex items-center justify-between text-[12px]",
                        selectedInvoice?.id === inv.id ? "bg-[#1EB4A1]/10 text-[#127670] font-semibold" : "hover:bg-slate-50 text-slate-700"
                      )}
                    >
                      <div>
                        <span className="font-semibold">{inv.invoice_number}</span> • {inv.vendor_name}
                        <span className="block text-[11px] text-slate-400">{inv.due_status}</span>
                      </div>
                      <div className="text-right font-bold text-slate-800">
                        {inv.amount_formatted}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Invoice Card */}
            {selectedInvoice ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-[13px] font-bold text-[#127670]">{selectedInvoice.invoice_number}</p>
                    <p className="text-[12px] font-medium text-slate-700 mt-0.5">{selectedInvoice.vendor_name}</p>
                  </div>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[11px] font-bold",
                    selectedInvoice.status === 'Overdue' ? "bg-[#D94432]/10 text-[#D94432]" : "bg-[#E89A3C]/10 text-[#E89A3C]"
                  )}>
                    {selectedInvoice.status}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                  <span className="text-[13px] text-slate-500">Total Amount Due</span>
                  <span className="text-[18px] font-bold text-slate-800">{selectedInvoice.amount_formatted}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-[13px]">
                No invoice selected. Search or pick from above.
              </div>
            )}

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-2">Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                <label className={cn(
                  "border rounded-lg p-3 cursor-pointer transition-colors flex flex-col items-center justify-center gap-1",
                  method === 'bank' ? "border-[#127670] bg-[#1EB4A1]/5" : "border-slate-200 hover:bg-slate-50"
                )}>
                  <input type="radio" name="method" checked={method === 'bank'} onChange={() => setMethod('bank')} className="sr-only" />
                  <span className={cn("text-[13px] font-semibold", method === 'bank' ? "text-[#127670]" : "text-slate-600")}>Bank Transfer</span>
                </label>
                <label className={cn(
                  "border rounded-lg p-3 cursor-pointer transition-colors flex flex-col items-center justify-center gap-1",
                  method === 'cheque' ? "border-[#127670] bg-[#1EB4A1]/5" : "border-slate-200 hover:bg-slate-50"
                )}>
                  <input type="radio" name="method" checked={method === 'cheque'} onChange={() => setMethod('cheque')} className="sr-only" />
                  <span className={cn("text-[13px] font-semibold", method === 'cheque' ? "text-[#127670]" : "text-slate-600")}>Cheque</span>
                </label>
              </div>
            </div>

            {method === 'bank' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                    Bank Reference No. (UTR) <span className="text-[#D94432]">*</span>
                  </label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. HDFC-UTR-99881122" 
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
                  />
                </div>
              </div>
            )}

            {method === 'cheque' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                    Cheque Number <span className="text-[#D94432]">*</span>
                  </label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. CHQ-481920" 
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                Payment Date <span className="text-[#D94432]">*</span>
              </label>
              <input 
                required
                type="date" 
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                Remarks / Payment Notes
              </label>
              <input 
                type="text" 
                placeholder="Optional payment notes or accounting tag" 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
              />
            </div>

          </form>
        )}

        {/* Footer */}
        {!success && (
          <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-md text-[13px] font-semibold hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit"
              form="payment-form"
              disabled={isSubmitting || !selectedInvoice}
              className="flex-1 py-2.5 bg-[#125F5C] text-white rounded-md text-[13px] font-semibold hover:bg-[#0f4d4a] shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <CreditCard size={16} /> Process Payment
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
