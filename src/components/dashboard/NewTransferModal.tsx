import React, { useState } from 'react';
import { X, ArrowRightLeft, Search, CheckCircle } from 'lucide-react';


interface NewTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewTransferModal({ isOpen, onClose }: NewTransferModalProps) {
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
              <ArrowRightLeft size={18} className="text-[#127670]" /> Stock Transfer
            </h2>
            <p className="text-[13px] text-slate-500">Move inventory between stores or sub-stores</p>
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
            <h3 className="text-lg font-bold text-slate-800">Transfer Initiated</h3>
            <p className="text-[14px] text-slate-500 mt-2">TRF-24-3401 has been created and is awaiting receiving at the destination store.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">From Store</label>
                <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] cursor-pointer">
                  <option>Main Store</option>
                  <option>Pharmacy</option>
                  <option>OT Store</option>
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">To Store</label>
                <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] cursor-pointer">
                  <option>Pharmacy</option>
                  <option>Lab Store</option>
                  <option>Main Store</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Add Items</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search item name or code..." 
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-md text-[13px] w-full focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
                />
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-lg overflow-hidden">
              <div className="px-3 py-2 border-b border-slate-100 bg-slate-100/50 flex justify-between">
                <span className="text-[12px] font-semibold text-slate-500 uppercase">Item</span>
                <span className="text-[12px] font-semibold text-slate-500 uppercase">Qty</span>
              </div>
              <div className="p-3 flex items-center justify-between border-b border-slate-100 bg-white">
                <div>
                  <p className="text-[13px] font-semibold text-slate-700">Paracetamol IV 100 ml</p>
                  <p className="text-[11px] text-slate-400">Stock: 450</p>
                </div>
                <input type="number" defaultValue={50} className="w-16 border border-slate-200 rounded px-2 py-1 text-[13px] text-right focus:outline-none focus:border-[#127670]" />
              </div>
              <div className="p-3 flex items-center justify-between bg-white">
                <div>
                  <p className="text-[13px] font-semibold text-slate-700">Surgical gloves 7.0</p>
                  <p className="text-[11px] text-slate-400">Stock: 1200</p>
                </div>
                <input type="number" defaultValue={200} className="w-16 border border-slate-200 rounded px-2 py-1 text-[13px] text-right focus:outline-none focus:border-[#127670]" />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Transfer Notes (Optional)</label>
              <textarea 
                rows={3} 
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] resize-none"
                placeholder="Reason for transfer..."
              />
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
              <ArrowRightLeft size={16} /> Initate Transfer
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
