import React, { useState } from 'react';
import { X, CreditCard, CheckCircle, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettlePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettlePaymentModal({ isOpen, onClose }: SettlePaymentModalProps) {
  const [success, setSuccess] = useState(false);
  const [method, setMethod] = useState('bank');

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
        {success ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95">
            <CheckCircle size={64} className="text-[#1EB4A1] mb-4" />
            <h3 className="text-lg font-bold text-slate-800">Payment Processed</h3>
            <p className="text-[14px] text-slate-500 mt-2">₹45,200.00 settled and synced to AP ledger successfully.</p>
          </div>
        ) : (
          <form id="payment-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            
            <div className="pt-2">
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Select Pending Invoice</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search invoice by ID or Vendor..." 
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-md text-[13px] w-full focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
                />
              </div>
            </div>

            {/* Selected Invoice Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-[13px] font-bold text-[#127670]">INV-24-4081</p>
                  <p className="text-[12px] font-medium text-slate-700 mt-0.5">Sanjeevani Surgicals</p>
                </div>
                <span className="bg-[#E89A3C]/10 text-[#E89A3C] px-2 py-0.5 rounded text-[11px] font-bold">Pending</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                <span className="text-[13px] text-slate-500">Total Amount Due</span>
                <span className="text-[18px] font-bold text-slate-800">₹45,200.00</span>
              </div>
            </div>

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
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Bank Reference No. (UTR) <span className="text-[#D94432]">*</span></label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. N000000000001" 
                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
                  />
                </div>
              </div>
            )}

            {method === 'cheque' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Cheque Number <span className="text-[#D94432]">*</span></label>
                  <input 
                    required
                    type="text" 
                    placeholder="6-digit cheque number" 
                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Payment Date <span className="text-[#D94432]">*</span></label>
              <input 
                required
                type="date" 
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
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
              className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-md text-[13px] font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit"
              form="payment-form"
              className="flex-1 py-2.5 bg-[#125F5C] text-white rounded-md text-[13px] font-semibold hover:bg-[#0f4d4a] shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <CreditCard size={16} /> Process Payment
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
