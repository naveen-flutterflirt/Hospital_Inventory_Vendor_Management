import { useState, useEffect } from 'react';
import { X, Receipt, Upload, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { api, InvoiceLookupVendor, InvoiceLookupPo } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

interface LogInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function LogInvoiceModal({ isOpen, onClose, onSuccess }: LogInvoiceModalProps) {
  const { showConfirm } = useToast();
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [createdInvoice, setCreatedInvoice] = useState<{ number: string; amount: number; vendor: string } | null>(null);

  // Lookups data
  const [vendors, setVendors] = useState<InvoiceLookupVendor[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<InvoiceLookupPo[]>([]);
  const [isLoadingLookups, setIsLoadingLookups] = useState(false);

  // Form Fields
  const [vendorName, setVendorName] = useState('');
  const [poRef, setPoRef] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');

  // Set default due date (+15 days) and load lookups when modal opens
  useEffect(() => {
    if (isOpen) {
      setSuccess(false);
      setErrorMessage('');
      setCreatedInvoice(null);

      // Default due date = today + 15 days
      const d = new Date();
      d.setDate(d.getDate() + 15);
      setDueDate(d.toISOString().split('T')[0]);

      // Load lookups
      loadLookups();
    }
  }, [isOpen]);

  const loadLookups = async () => {
    setIsLoadingLookups(true);
    try {
      const res = await api.invoices.getLookups();
      if (res.success && res.data) {
        setVendors(res.data.vendors || []);
        setPurchaseOrders(res.data.purchase_orders || []);
      }
    } catch (err) {
      console.error('Failed to load invoice lookups:', err);
    } finally {
      setIsLoadingLookups(false);
    }
  };

  // When PO is chosen, auto-fill vendor and amount
  const handlePoChange = (poNumber: string) => {
    setPoRef(poNumber);
    const selectedPo = purchaseOrders.find(po => po.po_number === poNumber);
    if (selectedPo) {
      setVendorName(selectedPo.vendor_name);
      if (selectedPo.total_amount && !amount) {
        setAmount(String(selectedPo.total_amount));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Please enter a valid invoice amount greater than 0');
      return;
    }

    if (!vendorName) {
      setErrorMessage('Please select or enter a vendor');
      return;
    }

    if (!poRef) {
      setErrorMessage('Please select or specify a purchase order reference');
      return;
    }

    if (!dueDate) {
      setErrorMessage('Please specify an invoice due date');
      return;
    }

    const confirmed = await showConfirm({
      title: 'Log Commercial Invoice',
      message: `Register invoice for ₹${parsedAmount.toLocaleString('en-IN')} from ${vendorName} against ${poRef}?`,
      confirmText: 'Log Invoice',
      cancelText: 'Cancel',
      type: 'info',
    });
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      const res = await api.invoices.logInvoice({
        vendorName,
        poRef,
        amount: parsedAmount,
        dueDate,
        notes: notes.trim() || undefined,
        documentUrl: documentUrl.trim() || undefined,
      });

      if (res.success && res.data?.invoice) {
        setCreatedInvoice({
          number: res.data.invoice.invoice_number,
          amount: res.data.invoice.amount,
          vendor: res.data.invoice.vendor,
        });
        setSuccess(true);
        if (onSuccess) {
          onSuccess();
        }

        // Auto close after 2.2 seconds
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 2200);
      } else {
        setErrorMessage(res.message || 'Failed to log invoice. Please check the inputs.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
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
              <Receipt size={18} className="text-[#127670]" /> Log Invoice
            </h2>
            <p className="text-[13px] text-slate-500">Record a new vendor invoice for AP</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1.5 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        {success && createdInvoice ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95">
            <CheckCircle size={64} className="text-[#1EB4A1] mb-4" />
            <h3 className="text-lg font-bold text-slate-800">Invoice Logged Successfully</h3>
            <p className="text-[14px] text-slate-600 mt-2">
              <strong className="text-[#127670]">{createdInvoice.number}</strong> (₹{createdInvoice.amount.toLocaleString('en-IN')}) has been registered for <span className="font-semibold text-slate-800">{createdInvoice.vendor}</span>.
            </p>
            <p className="text-[12px] text-slate-400 mt-2">Synced to Accounts Payable queue pending 3-way GRN match.</p>
          </div>
        ) : (
          <form id="invoice-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[13px] flex items-start gap-2 animate-in fade-in">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                Reference PO <span className="text-[#D94432]">*</span>
              </label>
              <select 
                required 
                value={poRef}
                onChange={(e) => handlePoChange(e.target.value)}
                disabled={isLoadingLookups}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] cursor-pointer bg-white"
              >
                <option value="">{isLoadingLookups ? 'Loading Purchase Orders...' : 'Select Purchase Order...'}</option>
                {purchaseOrders.map((po) => (
                  <option key={po.id} value={po.po_number}>
                    {po.po_number} - {po.vendor_name} ({po.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                Vendor <span className="text-[#D94432]">*</span>
              </label>
              <select 
                required 
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                disabled={isLoadingLookups}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] cursor-pointer bg-white"
              >
                <option value="">{isLoadingLookups ? 'Loading Vendors...' : 'Select Vendor...'}</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.name}>
                    {v.name} ({v.payment_terms || 'Net 30'})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                  Invoice Amount <span className="text-[#D94432]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">₹</span>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    min="1"
                    placeholder="0.00" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-7 pr-3 py-2 border border-slate-200 rounded-md text-[14px] w-full text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                  Due Date <span className="text-[#D94432]">*</span>
                </label>
                <input 
                  required
                  type="date" 
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                Notes / Line Item Summary
              </label>
              <textarea
                rows={2}
                placeholder="Optional notes or delivery remarks..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] resize-none"
              />
            </div>

            <div className="pt-1">
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Invoice Document</label>
              <div 
                onClick={() => setDocumentUrl('https://hospital-documents.local/invoices/uploaded-doc.pdf')}
                className="border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 p-5 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 border border-slate-100">
                  <Upload size={17} className="text-slate-400" />
                </div>
                <p className="text-[13px] font-semibold text-slate-700">
                  {documentUrl ? 'Document attached (uploaded-doc.pdf)' : 'Click to attach invoice PDF / scan'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">Maximum file size 5MB • Formats: PDF, PNG, JPG</p>
              </div>
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
              form="invoice-form"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-[#125F5C] text-white rounded-md text-[13px] font-semibold hover:bg-[#0f4d4a] shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Logging...
                </>
              ) : (
                <>
                  <Receipt size={16} /> Log Invoice
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
