import React, { useState } from 'react';
import { X, Send, Search, CheckCircle } from 'lucide-react';

interface NewIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewIssueModal({ isOpen, onClose }: NewIssueModalProps) {
  const [issueType, setIssueType] = useState('ward');
  const [success, setSuccess] = useState(false);

  const handleSubmit = () => {
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
              <Send size={18} className="text-[#127670]" /> Issue Items
            </h2>
            <p className="text-[13px] text-slate-500">Fulfill ward indents or issue to patient</p>
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
            <h3 className="text-lg font-bold text-slate-800">Items Issued Successfully</h3>
            <p className="text-[14px] text-slate-500 mt-2">TRF-24-3402 generated and inventory has been deducted.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-2">Issue Type</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="issueType" 
                    checked={issueType === 'ward'} 
                    onChange={() => setIssueType('ward')}
                    className="accent-[#127670]"
                  />
                  <span className="text-[14px] text-slate-700 font-medium">To Ward</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="issueType" 
                    checked={issueType === 'patient'} 
                    onChange={() => setIssueType('patient')}
                    className="accent-[#127670]"
                  />
                  <span className="text-[14px] text-slate-700 font-medium">To Patient</span>
                </label>
              </div>
            </div>

            {issueType === 'ward' ? (
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Select Ward / Department</label>
                <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] cursor-pointer">
                  <option>ICU Ward</option>
                  <option>General Ward A</option>
                  <option>Emergency Room</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Patient ID / Name</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search patient..." 
                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-md text-[13px] w-full focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
                  />
                </div>
              </div>
            )}

            <div className="pt-2">
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Items to Issue</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Scan barcode or search item..." 
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-md text-[13px] w-full focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
                />
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-lg overflow-hidden">
              <div className="px-3 py-2 border-b border-slate-100 bg-slate-100/50 flex justify-between">
                <span className="text-[12px] font-semibold text-slate-500 uppercase">Item</span>
                <span className="text-[12px] font-semibold text-slate-500 uppercase">Qty</span>
              </div>
              <div className="p-3 flex items-center justify-between bg-white">
                <div>
                  <p className="text-[13px] font-semibold text-slate-700">Inj. Ceftriaxone 1 g</p>
                  <p className="text-[11px] text-slate-400 font-mono">Batch: CTX2510D</p>
                </div>
                <input type="number" defaultValue={2} className="w-16 border border-slate-200 rounded px-2 py-1 text-[13px] text-right focus:outline-none focus:border-[#127670]" />
              </div>
            </div>

          </div>
        )}

        {/* Footer */}
        {!success && (
          <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-md text-[13px] font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              className="flex-1 py-2.5 bg-[#125F5C] text-white rounded-md text-[13px] font-semibold hover:bg-[#0f4d4a] shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Send size={16} /> Issue Items
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
