import React, { useState, useEffect } from 'react';
import { X, UserPlus, Upload, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

interface NewVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function NewVendorModal({ isOpen, onClose, onSuccess }: NewVendorModalProps) {
  const { showConfirm, toast } = useToast();
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [createdVendor, setCreatedVendor] = useState<{ code: string; name: string } | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Pharmacy');
  const [gstin, setGstin] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [hasDocument, setHasDocument] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSuccess(false);
      setIsSubmitting(false);
      setErrorMessage('');
      setCreatedVendor(null);
      setName('');
      setCategory('Pharmacy');
      setGstin('');
      setContactEmail('');
      setPhone('');
      setPaymentTerms('Net 30');
      setHasDocument(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Please enter the vendor company name');
      return;
    }

    if (!gstin.trim()) {
      setErrorMessage('Please enter the Tax ID / GSTIN');
      return;
    }

    const confirmed = await showConfirm({
      title: 'Onboard New Vendor',
      message: `Register supplier "${name.trim()}" (${category}) into hospital approved vendor directory?`,
      confirmText: 'Onboard Vendor',
      cancelText: 'Cancel',
      type: 'success',
    });
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      const res = await api.vendors.createVendor({
        name: name.trim(),
        category,
        gstin: gstin.trim().toUpperCase(),
        contactEmail: contactEmail.trim() || undefined,
        phone: phone.trim() || undefined,
        paymentTerms,
      });

      if (res.success && res.data?.vendor) {
        setCreatedVendor({
          code: res.data.vendor.vendor_code,
          name: res.data.vendor.name,
        });
        setSuccess(true);
        toast.success(`Vendor ${res.data.vendor.name} onboarded successfully!`, 'Vendor Registered');
        if (onSuccess) {
          onSuccess();
        }

        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 2200);
      } else {
        setErrorMessage(res.message || 'Failed to onboard vendor. Please verify details.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred during vendor registration';
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
              <UserPlus size={18} className="text-[#127670]" /> Onboard Vendor
            </h2>
            <p className="text-[13px] text-slate-500">Initiate compliance and verification process</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1.5 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        {success && createdVendor ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95">
            <CheckCircle size={64} className="text-[#1EB4A1] mb-4" />
            <h3 className="text-lg font-bold text-slate-800">Vendor Registered</h3>
            <p className="text-[14px] text-slate-600 mt-2">
              <strong className="text-[#127670]">{createdVendor.code}</strong> ({createdVendor.name}) has been placed into <span className="font-semibold text-[#E89A3C]">&quot;Onboarding&quot;</span> status pending document verification.
            </p>
            <p className="text-[12px] text-slate-400 mt-2">Notification sent to Procurement Compliance Officer.</p>
          </div>
        ) : (
          <form id="vendor-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[13px] flex items-start gap-2 animate-in fade-in">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                Company Name <span className="text-[#D94432]">*</span>
              </label>
              <input 
                required
                type="text" 
                placeholder="e.g. Apex Medical Systems" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] cursor-pointer bg-white"
                >
                  <option value="Pharmacy">Pharmacy</option>
                  <option value="Consumables">Consumables</option>
                  <option value="Implants">Implants</option>
                  <option value="Capex">Capex</option>
                  <option value="Services">Services</option>
                  <option value="Lab Supplies">Lab Supplies</option>
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                  Tax ID / GSTIN <span className="text-[#D94432]">*</span>
                </label>
                <input 
                  required
                  type="text" 
                  placeholder="22AAAAA0000A1Z5" 
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Primary Contact Email</label>
                <input 
                  type="email" 
                  placeholder="sales@company.com" 
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Phone Number</label>
                <input 
                  type="tel" 
                  placeholder="+91 98200 00000" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Payment Terms</label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] cursor-pointer bg-white"
              >
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 45">Net 45</option>
                <option value="Net 60">Net 60</option>
                <option value="Advance">Advance</option>
              </select>
            </div>

            <div className="pt-1">
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Compliance Documents</label>
              <div 
                onClick={() => setHasDocument(!hasDocument)}
                className="border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 p-5 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 border border-slate-100">
                  <Upload size={17} className="text-slate-400" />
                </div>
                <p className="text-[13px] font-semibold text-slate-700">
                  {hasDocument ? 'Compliance dossier attached (trade_license_iso.pdf)' : 'Click to attach trade license & compliance pack'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">Trade license, ISO certs, Bank mandates (PDF)</p>
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
              form="vendor-form"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-[#125F5C] text-white rounded-md text-[13px] font-semibold hover:bg-[#0f4d4a] shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Registering...
                </>
              ) : (
                <>
                  <UserPlus size={16} /> Register Vendor
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
