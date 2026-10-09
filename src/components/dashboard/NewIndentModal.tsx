import React from 'react';
import { X } from 'lucide-react';

interface NewIndentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewIndentModal({ isOpen, onClose }: NewIndentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Panel */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Create New Indent</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body (Form) */}
        <div className="p-6 overflow-y-auto space-y-5">
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Requesting Store / Department</label>
            <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]">
              <option>ICU</option>
              <option>OT</option>
              <option>Wards</option>
              <option>Central</option>
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Priority</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-[14px] text-slate-700 cursor-pointer">
                <input type="radio" name="priority" defaultChecked className="accent-[#127670]" /> Routine
              </label>
              <label className="flex items-center gap-2 text-[14px] text-slate-700 cursor-pointer">
                <input type="radio" name="priority" className="accent-[#127670]" /> Urgent
              </label>
              <label className="flex items-center gap-2 text-[14px] text-[#D94432] font-medium cursor-pointer">
                <input type="radio" name="priority" className="accent-[#D94432]" /> Emergency
              </label>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Items to Indent</label>
            <div className="border border-slate-200 rounded-md p-3 bg-slate-50 text-[13px] text-slate-500 text-center border-dashed">
              Search and add items to this list...
            </div>
          </div>
          
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Additional Notes</label>
            <textarea 
              rows={3} 
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] resize-none"
              placeholder="E.g., Required for upcoming surgery block..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              alert("Indent submitted successfully!");
              onClose();
            }}
            className="px-4 py-2 bg-[#127670] text-white rounded-md text-[13px] font-semibold hover:bg-[#0f605b] shadow-sm transition-colors"
          >
            Submit Indent
          </button>
        </div>
      </div>
    </div>
  );
}
