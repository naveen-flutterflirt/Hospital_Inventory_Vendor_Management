"use client";

import React, { useState } from 'react';
import { X, Calendar, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

interface ScheduleReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScheduled?: () => void;
}

export default function ScheduleReportModal({ isOpen, onClose, onScheduled }: ScheduleReportModalProps) {
  const [reportType, setReportType] = useState('Vendor Performance Summary');
  const [frequency, setFrequency] = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly');
  const [deliveryTime, setDeliveryTime] = useState('08:00');
  const [recipients, setRecipients] = useState('cpo@apexhealth.in, finance@apexhealth.in');
  const [attachPdf, setAttachPdf] = useState(true);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const response = await api.reports.scheduleReport({
        reportType,
        frequency,
        deliveryTime,
        recipients,
        attachPdf,
      });

      if (response.success) {
        setSuccess(true);
        setSuccessMessage(response.message || 'Recurring report scheduled successfully!');
        if (onScheduled) {
          onScheduled();
        }
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 1800);
      } else {
        throw new Error(response.message || 'Failed to save recurring report schedule');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error scheduling report. Please verify recipient emails.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/40 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Calendar size={18} className="text-[#127670]" /> Schedule Automated Report
            </h2>
            <p className="text-[13px] text-slate-500">Automate recurring data exports to email</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1.5 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-[13px] text-red-700">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Body */}
        {success ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95">
            <CheckCircle size={64} className="text-[#1EB4A1] mb-4" />
            <h3 className="text-lg font-bold text-slate-800">Schedule Active!</h3>
            <p className="text-[14px] text-slate-500 mt-2">{successMessage}</p>
          </div>
        ) : (
          <form id="schedule-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Report Type <span className="text-[#D94432]">*</span></label>
              <select 
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                required 
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] cursor-pointer"
              >
                <option value="Vendor Performance Summary">Vendor Performance Summary</option>
                <option value="Inventory Valuation & Stock Cover">Inventory Valuation & Stock Cover</option>
                <option value="AP Aging & Invoices Report">AP Aging & Invoices Report</option>
                <option value="Departmental Consumption Rate">Departmental Consumption Rate</option>
                <option value="AMC Expiry Forecast">AMC Expiry Forecast (Q4)</option>
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Frequency <span className="text-[#D94432]">*</span></label>
              <div className="grid grid-cols-3 gap-3">
                {(['Daily', 'Weekly', 'Monthly'] as const).map((freq) => (
                  <label 
                    key={freq} 
                    className={`border rounded-lg p-2.5 cursor-pointer transition-colors flex items-center justify-center gap-2 hover:bg-slate-50 relative ${frequency === freq ? 'border-[#127670] bg-[#1EB4A1]/10 text-[#127670] font-bold' : 'border-slate-200 text-slate-600 font-semibold'}`}
                  >
                    <input 
                      type="radio" 
                      name="frequency" 
                      value={freq} 
                      checked={frequency === freq}
                      onChange={() => setFrequency(freq)}
                      className="sr-only" 
                    />
                    <span className="text-[13px]">{freq}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Delivery Time <span className="text-[#D94432]">*</span></label>
              <input 
                required
                type="time" 
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Recipients (Email Addresses) <span className="text-[#D94432]">*</span></label>
              <textarea 
                required
                rows={3} 
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] resize-none"
                placeholder="admin@hospital.com, finance@hospital.com (comma separated)"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={attachPdf}
                  onChange={(e) => setAttachPdf(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#127670] focus:ring-[#127670]" 
                />
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
              disabled={loading}
              className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-md text-[13px] font-semibold hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit"
              form="schedule-form"
              disabled={loading}
              className="flex-1 py-2.5 bg-[#125F5C] text-white rounded-md text-[13px] font-semibold hover:bg-[#0f4d4a] shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Calendar size={16} /> Save Schedule
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
