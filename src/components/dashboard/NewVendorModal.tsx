import React, { useState } from 'react';
import { X, UserPlus, Upload, CheckCircle } from 'lucide-react';

interface NewVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewVendorModal({ isOpen, onClose }: NewVendorModalProps) {
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
        {success ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95">
            <CheckCircle size={64} className="text-[#1EB4A1] mb-4" />
            <h3 className="text-lg font-bold text-slate-800">Vendor Registered</h3>
            <p className="text-[14px] text-slate-500 mt-2">VND-2042 has been placed into &quot;Onboarding&quot; status pending document verification.</p>
          </div>
        ) : (
          <form id="vendor-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Company Name <span className="text-[#D94432]">*</span></label>
              <input 
                required
                type="text" 
                placeholder="e.g. Apex Medical Systems" 
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Category</label>
                <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] cursor-pointer">
                  <option>Pharmacy</option>
                  <option>Consumables</option>
                  <option>Implants</option>
                  <option>Capex</option>
                  <option>Services</option>
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Tax ID / GSTIN <span className="text-[#D94432]">*</span></label>
                <input 
                  required
                  type="text" 
                  placeholder="22AAAAA0000A1Z5" 
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Primary Contact Email</label>
              <input 
                type="email" 
                placeholder="sales@company.com" 
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
              />
            </div>

            <div className="pt-2">
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Compliance Documents</label>
              <div className="border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 border border-slate-100">
                  <Upload size={18} className="text-slate-400" />
                </div>
                <p className="text-[13px] font-semibold text-slate-700">Click to upload or drag and drop</p>
                <p className="text-[11px] text-slate-500 mt-1">Trade license, ISO certs, Bank mandates (PDF)</p>
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
              form="vendor-form"
              className="flex-1 py-2.5 bg-[#125F5C] text-white rounded-md text-[13px] font-semibold hover:bg-[#0f4d4a] shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <UserPlus size={16} /> Register Vendor
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
