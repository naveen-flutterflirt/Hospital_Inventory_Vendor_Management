import React, { useState } from 'react';
import { X, Plus, CheckCircle } from 'lucide-react';

interface RegisterAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RegisterAssetModal({ isOpen, onClose }: RegisterAssetModalProps) {
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
              <Plus size={18} className="text-[#127670]" /> Register Asset
            </h2>
            <p className="text-[13px] text-slate-500">Add a new capital equipment to inventory</p>
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
            <h3 className="text-lg font-bold text-slate-800">Asset Registered</h3>
            <p className="text-[14px] text-slate-500 mt-2">The equipment has been registered in the system with an active AMC contract.</p>
          </div>
        ) : (
          <form id="asset-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Asset Name <span className="text-[#D94432]">*</span></label>
              <input 
                required
                type="text" 
                placeholder="e.g. MRI Scanner 3T" 
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Serial Number <span className="text-[#D94432]">*</span></label>
              <input 
                required
                type="text" 
                placeholder="Manufacturer SN" 
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Department Assignment <span className="text-[#D94432]">*</span></label>
              <select required className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] cursor-pointer">
                <option value="">Select Department...</option>
                <option>Radiology</option>
                <option>ICU</option>
                <option>Operation Theatre</option>
                <option>Pathology Lab</option>
                <option>Cardiology</option>
              </select>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-[14px] font-bold text-slate-800 mb-4">AMC Details</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">AMC Vendor</label>
                  <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] cursor-pointer">
                    <option value="">Select Vendor...</option>
                    <option>Apex Medical Systems</option>
                    <option>Siemens Healthineers</option>
                    <option>Philips Healthcare</option>
                    <option>GE Medical Systems</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">AMC Expiry Date</label>
                  <input 
                    type="date" 
                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
                  />
                </div>
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
              form="asset-form"
              className="flex-1 py-2.5 bg-[#125F5C] text-white rounded-md text-[13px] font-semibold hover:bg-[#0f4d4a] shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Register Asset
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
