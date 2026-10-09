import React from 'react';
import { X, Send } from 'lucide-react';

interface NegotiateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NegotiateModal({ isOpen, onClose }: NegotiateModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/40 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Negotiate Rates</h2>
            <p className="text-[13px] text-slate-500">RFQ-24-0318 &middot; OT consumables</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Select Vendor to Negotiate</label>
            <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] cursor-pointer">
              <option>Sanjeevani Surgicals</option>
              <option>Prakash Health Supplies</option>
              <option>Nova MedEquip Traders</option>
            </select>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
            <h3 className="text-[13px] font-bold text-slate-800 mb-3">Target Pricing Request</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[13px] text-slate-600 flex-1 truncate">Surgical gloves 7.0 (pair)</span>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-slate-400">Current: ₹19.4</span>
                  <input type="text" placeholder="Target ₹" className="w-20 border border-slate-200 rounded px-2 py-1 text-[13px] text-right focus:outline-none focus:border-[#127670]" />
                </div>
              </div>
              
              <div className="flex items-center justify-between gap-4">
                <span className="text-[13px] text-slate-600 flex-1 truncate">Suture 2-0 Vicryl</span>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-slate-400">Current: ₹258.0</span>
                  <input type="text" placeholder="Target ₹" className="w-20 border border-slate-200 rounded px-2 py-1 text-[13px] text-right focus:outline-none focus:border-[#127670]" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Message to Vendor</label>
            <textarea 
              rows={4} 
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] resize-none"
              placeholder="E.g., Please match L1 pricing to win the full contract..."
            />
          </div>
          
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-md text-[13px] font-semibold hover:bg-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              console.log("Negotiation request sent");
              onClose();
            }}
            className="flex-1 py-2.5 bg-[#127670] text-white rounded-md text-[13px] font-semibold hover:bg-[#0f605b] shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Send size={14} /> Send Request
          </button>
        </div>

      </div>
    </div>
  );
}
