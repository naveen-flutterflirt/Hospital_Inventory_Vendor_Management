import React, { useState } from 'react';
import { X, Receipt, Upload, CheckCircle } from 'lucide-react';

interface LogInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LogInvoiceModal({ isOpen, onClose }: LogInvoiceModalProps) {
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1500);
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
        {success ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95">
            <CheckCircle size={64} className="text-[#1EB4A1] mb-4" />
            <h3 className="text-lg font-bold text-slate-800">Invoice Logged</h3>
            <p className="text-[14px] text-slate-500 mt-2">INV-24-4091 has been added to the Accounts Payable queue pending 3-way match.</p>
          </div>
        ) : (
          <form id="invoice-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Vendor <span className="text-[#D94432]">*</span></label>
              <select required className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] cursor-pointer">
                <option value="">Select Vendor...</option>
                <option>Aarogya Pharma Distributors</option>
                <option>Sanjeevani Surgicals</option>
                <option>Apex Medical Systems</option>
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Reference PO <span className="text-[#D94432]">*</span></label>
              <select required className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] cursor-pointer">
                <option value="">Select Purchase Order...</option>
                <option>PO-24-1200</option>
                <option>PO-24-1198</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Invoice Amount <span className="text-[#D94432]">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">₹</span>
                  <input 
                    required
                    type="number" 
                    placeholder="0.00" 
                    className="pl-7 pr-3 py-2 border border-slate-200 rounded-md text-[14px] w-full text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Due Date <span className="text-[#D94432]">*</span></label>
                <input 
                  required
                  type="date" 
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Upload Invoice Document</label>
              <div className="border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 border border-slate-100">
                  <Upload size={18} className="text-slate-400" />
                </div>
                <p className="text-[13px] font-semibold text-slate-700">Click to upload invoice PDF</p>
                <p className="text-[11px] text-slate-500 mt-1">Maximum file size 5MB</p>
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
              className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-md text-[13px] font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit"
              form="invoice-form"
              className="flex-1 py-2.5 bg-[#125F5C] text-white rounded-md text-[13px] font-semibold hover:bg-[#0f4d4a] shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Receipt size={16} /> Log Invoice
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
