import React, { useState } from 'react';
import { X, Wrench, CheckCircle, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LogMaintenanceModal({ isOpen, onClose }: LogMaintenanceModalProps) {
  const [success, setSuccess] = useState(false);
  const [maintType, setMaintType] = useState('preventive');

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
              <Wrench size={18} className="text-[#127670]" /> Log Maintenance
            </h2>
            <p className="text-[13px] text-slate-500">Record scheduled PMs or breakdown tickets</p>
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
            <h3 className="text-lg font-bold text-slate-800">Maintenance Logged</h3>
            <p className="text-[14px] text-slate-500 mt-2">Ticket TKT-8842 has been created and assigned to the AMC vendor.</p>
          </div>
        ) : (
          <form id="maintenance-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            
            <div className="pt-2">
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Select Asset <span className="text-[#D94432]">*</span></label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  required
                  type="text" 
                  placeholder="Search asset ID or name..." 
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-md text-[13px] w-full focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-2">Maintenance Type</label>
              <div className="grid grid-cols-2 gap-3">
                <label className={cn(
                  "border rounded-lg p-3 cursor-pointer transition-colors flex flex-col items-center justify-center gap-1",
                  maintType === 'preventive' ? "border-[#127670] bg-[#1EB4A1]/5" : "border-slate-200 hover:bg-slate-50"
                )}>
                  <input type="radio" name="maintType" checked={maintType === 'preventive'} onChange={() => setMaintType('preventive')} className="sr-only" />
                  <span className={cn("text-[13px] font-semibold", maintType === 'preventive' ? "text-[#127670]" : "text-slate-600")}>Preventive (PM)</span>
                </label>
                <label className={cn(
                  "border rounded-lg p-3 cursor-pointer transition-colors flex flex-col items-center justify-center gap-1",
                  maintType === 'breakdown' ? "border-[#D94432] bg-[#D94432]/5" : "border-slate-200 hover:bg-slate-50"
                )}>
                  <input type="radio" name="maintType" checked={maintType === 'breakdown'} onChange={() => setMaintType('breakdown')} className="sr-only" />
                  <span className={cn("text-[13px] font-semibold", maintType === 'breakdown' ? "text-[#D94432]" : "text-slate-600")}>Breakdown</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Date</label>
                <input 
                  required
                  type="date" 
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Est. Cost (Optional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">₹</span>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    className="pl-7 pr-3 py-2 border border-slate-200 rounded-md text-[14px] w-full text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Description / Issue Notes <span className="text-[#D94432]">*</span></label>
              <textarea 
                required
                rows={4} 
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] resize-none"
                placeholder="Describe the maintenance performed or the breakdown issue..."
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
              form="maintenance-form"
              className={cn(
                "flex-1 py-2.5 text-white rounded-md text-[13px] font-semibold shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2",
                maintType === 'breakdown' ? "bg-[#D94432] hover:bg-[#b83829]" : "bg-[#125F5C] hover:bg-[#0f4d4a]"
              )}
            >
              <Wrench size={16} /> Log Ticket
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
