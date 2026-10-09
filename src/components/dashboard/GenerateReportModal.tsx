import React, { useState } from 'react';
import { X, TrendingUp, Download, CheckCircle, Loader2 } from 'lucide-react';

interface GenerateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GenerateReportModal({ isOpen, onClose }: GenerateReportModalProps) {
  const [status, setStatus] = useState<'idle' | 'generating' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('generating');
    setTimeout(() => {
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        onClose();
      }, 2000);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/40 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp size={18} className="text-[#127670]" /> Generate Custom
            </h2>
            <p className="text-[13px] text-slate-500">Create a one-off custom data export</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1.5 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        {status === 'generating' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95">
            <Loader2 size={48} className="text-[#127670] animate-spin mb-6" />
            <h3 className="text-lg font-bold text-slate-800">Compiling Data...</h3>
            <p className="text-[14px] text-slate-500 mt-2">Querying database across departments. This may take a few seconds.</p>
          </div>
        ) : status === 'success' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95">
            <CheckCircle size={64} className="text-[#1EB4A1] mb-4" />
            <h3 className="text-lg font-bold text-slate-800">Report Ready!</h3>
            <p className="text-[14px] text-slate-500 mt-2">Your report has been generated and the download has started automatically.</p>
          </div>
        ) : (
          <form id="generate-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Data Source (Module) <span className="text-[#D94432]">*</span></label>
              <select required className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] cursor-pointer">
                <option value="">Select data source...</option>
                <option>Procurement & POs</option>
                <option>Inventory & Consumption</option>
                <option>Accounts Payable</option>
                <option>Vendor Database</option>
                <option>Asset Registry</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Start Date <span className="text-[#D94432]">*</span></label>
                <input 
                  required
                  type="date" 
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">End Date <span className="text-[#D94432]">*</span></label>
                <input 
                  required
                  type="date" 
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-2">Export Format <span className="text-[#D94432]">*</span></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="border border-slate-200 rounded-lg p-3 cursor-pointer transition-colors flex items-center justify-center gap-2 hover:bg-slate-50 relative has-[:checked]:border-[#127670] has-[:checked]:bg-[#1EB4A1]/5">
                  <input required type="radio" name="format" value="csv" className="sr-only" defaultChecked />
                  <span className="text-[13px] font-semibold text-slate-600">CSV (Excel)</span>
                </label>
                <label className="border border-slate-200 rounded-lg p-3 cursor-pointer transition-colors flex items-center justify-center gap-2 hover:bg-slate-50 relative has-[:checked]:border-[#127670] has-[:checked]:bg-[#1EB4A1]/5">
                  <input required type="radio" name="format" value="pdf" className="sr-only" />
                  <span className="text-[13px] font-semibold text-slate-600">PDF Document</span>
                </label>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-[#127670] focus:ring-[#127670]" />
                <span className="text-[13px] font-medium text-slate-700">Include itemized line details (Large file)</span>
              </label>
            </div>

          </form>
        )}

        {/* Footer */}
        {status === 'idle' && (
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
              form="generate-form"
              className="flex-1 py-2.5 bg-[#125F5C] text-white rounded-md text-[13px] font-semibold hover:bg-[#0f4d4a] shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Download size={16} /> Generate & Download
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
