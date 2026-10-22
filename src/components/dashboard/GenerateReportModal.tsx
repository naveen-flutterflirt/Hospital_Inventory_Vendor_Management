"use client";

import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Download, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

interface GenerateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportGenerated?: () => void;
}

export default function GenerateReportModal({ isOpen, onClose, onReportGenerated }: GenerateReportModalProps) {
  const [dataSource, setDataSource] = useState('Procurement & POs');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [format, setFormat] = useState<'csv' | 'pdf'>('csv');
  const [includeLineDetails, setIncludeLineDetails] = useState(false);
  
  const [status, setStatus] = useState<'idle' | 'generating' | 'success'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date();
    setEndDate(today.toISOString().split('T')[0]);
    const past = new Date();
    past.setDate(past.getDate() - 30);
    setStartDate(past.toISOString().split('T')[0]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatus('generating');

    try {
      const response = await api.reports.generateCustomReport({
        dataSource,
        startDate,
        endDate,
        format,
      });

      if (response.success && response.data) {
        setStatus('success');

        // Automatically trigger browser download of the generated report file
        const downloadUrl = api.reports.getDownloadUrl(response.data.report_code);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', `${response.data.report_code}.${format}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (onReportGenerated) {
          onReportGenerated();
        }

        setTimeout(() => {
          setStatus('idle');
          onClose();
        }, 1800);
      } else {
        throw new Error(response.message || 'Failed to compile custom report');
      }
    } catch (err: any) {
      setStatus('idle');
      setErrorMessage(err.message || 'Error generating report. Please check your parameters.');
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
              <TrendingUp size={18} className="text-[#127670]" /> Generate Custom Report
            </h2>
            <p className="text-[13px] text-slate-500">Create an on-demand clinical data export</p>
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
        {status === 'generating' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95">
            <Loader2 size={48} className="text-[#127670] animate-spin mb-6" />
            <h3 className="text-lg font-bold text-slate-800">Compiling Report Data...</h3>
            <p className="text-[14px] text-slate-500 mt-2">Querying database across hospital departments. This may take a moment.</p>
          </div>
        ) : status === 'success' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95">
            <CheckCircle size={64} className="text-[#1EB4A1] mb-4" />
            <h3 className="text-lg font-bold text-slate-800">Report Ready!</h3>
            <p className="text-[14px] text-slate-500 mt-2">Your report has been generated and the file download has started automatically.</p>
          </div>
        ) : (
          <form id="generate-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Data Source (Module) <span className="text-[#D94432]">*</span></label>
              <select 
                value={dataSource}
                onChange={(e) => setDataSource(e.target.value)}
                required 
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] cursor-pointer"
              >
                <option value="Procurement & POs">Procurement & POs</option>
                <option value="Inventory & Consumption">Inventory & Consumption</option>
                <option value="Accounts Payable">Accounts Payable (Invoices)</option>
                <option value="Vendors & Suppliers">Vendors & Suppliers</option>
                <option value="Asset Registry">Capital Assets & Maintenance</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Start Date <span className="text-[#D94432]">*</span></label>
                <input 
                  required
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">End Date <span className="text-[#D94432]">*</span></label>
                <input 
                  required
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-2">Export Format <span className="text-[#D94432]">*</span></label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`border rounded-lg p-3 cursor-pointer transition-colors flex items-center justify-center gap-2 hover:bg-slate-50 relative ${format === 'csv' ? 'border-[#127670] bg-[#1EB4A1]/10 text-[#127670]' : 'border-slate-200 text-slate-600'}`}>
                  <input 
                    type="radio" 
                    name="format" 
                    value="csv" 
                    checked={format === 'csv'}
                    onChange={() => setFormat('csv')}
                    className="sr-only" 
                  />
                  <span className="text-[13px] font-semibold">CSV (Spreadsheet)</span>
                </label>
                <label className={`border rounded-lg p-3 cursor-pointer transition-colors flex items-center justify-center gap-2 hover:bg-slate-50 relative ${format === 'pdf' ? 'border-[#127670] bg-[#1EB4A1]/10 text-[#127670]' : 'border-slate-200 text-slate-600'}`}>
                  <input 
                    type="radio" 
                    name="format" 
                    value="pdf" 
                    checked={format === 'pdf'}
                    onChange={() => setFormat('pdf')}
                    className="sr-only" 
                  />
                  <span className="text-[13px] font-semibold">PDF Document</span>
                </label>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={includeLineDetails}
                  onChange={(e) => setIncludeLineDetails(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#127670] focus:ring-[#127670]" 
                />
                <span className="text-[13px] font-medium text-slate-700">Include itemized line details (Full catalog)</span>
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
