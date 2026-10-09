import React, { useState } from 'react';
import { X, Calendar, CheckCircle } from 'lucide-react';

interface ScheduleReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ScheduleReportModal({ isOpen, onClose }: ScheduleReportModalProps) {
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
              <Calendar size={18} className="text-[#127670]" /> Schedule Report
            </h2>
            <p className="text-[13px] text-slate-500">Automate recurring data exports</p>
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
            <h3 className="text-lg font-bold text-slate-800">Schedule Active</h3>
            <p className="text-[14px] text-slate-500 mt-2">Your report has been scheduled and will be emailed automatically to the designated recipients.</p>
          </div>
        ) : (
          <form id="schedule-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Report Type <span className="text-[#D94432]">*</span></label>
              <select required className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] cursor-pointer">
                <option value="">Select template...</option>
                <option>Vendor Performance Summary</option>
                <option>Inventory Valuation</option>
                <option>AP Aging Report</option>
                <option>Departmental Consumption</option>
                <option>AMC Expiry Forecast</option>
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Frequency <span className="text-[#D94432]">*</span></label>
              <div className="grid grid-cols-3 gap-3">
                {['Daily', 'Weekly', 'Monthly'].map(freq => (
                  <label key={freq} className="border border-slate-200 rounded-lg p-2 cursor-pointer transition-colors flex items-center justify-center gap-2 hover:bg-slate-50 relative has-[:checked]:border-[#127670] has-[:checked]:bg-[#1EB4A1]/5">
                    <input required type="radio" name="frequency" value={freq} className="sr-only" />
                    <span className="text-[13px] font-semibold text-slate-600">{freq}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Delivery Time <span className="text-[#D94432]">*</span></label>
              <input 
                required
                type="time" 
                defaultValue="08:00"
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Recipients (Email Addresses) <span className="text-[#D94432]">*</span></label>
              <textarea 
                required
                rows={3} 
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] resize-none"
                placeholder="admin@hospital.com, finance@hospital.com (comma separated)"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-300 text-[#127670] focus:ring-[#127670]" />
                <span className="text-[13px] font-medium text-slate-700">Attach report as PDF (otherwise CSV)</span>
              </label>
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
              form="schedule-form"
              className="flex-1 py-2.5 bg-[#125F5C] text-white rounded-md text-[13px] font-semibold hover:bg-[#0f4d4a] shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Calendar size={16} /> Save Schedule
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
