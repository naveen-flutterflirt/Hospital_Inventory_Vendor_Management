"use client";

import { useState, useEffect } from 'react';
import { X, Wrench, CheckCircle, Search, Loader2, AlertCircle } from 'lucide-react';
import { api, AssetItem } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';

interface LogMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMaintenanceLogged?: () => void;
}

export default function LogMaintenanceModal({ isOpen, onClose, onMaintenanceLogged }: LogMaintenanceModalProps) {
  const { showConfirm } = useToast();
  const [assetSearch, setAssetSearch] = useState('AST-24-1000');
  const [selectedAsset, setSelectedAsset] = useState<AssetItem | null>(null);
  const [suggestions, setSuggestions] = useState<AssetItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [maintType, setMaintType] = useState<'preventive' | 'breakdown'>('preventive');
  const [serviceDate, setServiceDate] = useState('');
  const [cost, setCost] = useState('25000');
  const [issueDescription, setIssueDescription] = useState('Quarterly preventive maintenance and electrical safety inspection.');

  useEffect(() => {
    setServiceDate(new Date().toISOString().split('T')[0]);
  }, []);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [assignedVendor, setAssignedVendor] = useState('Apex Medical Systems');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search suggestions on input change
  useEffect(() => {
    if (!assetSearch || assetSearch.length < 2) {
      setSuggestions([]);
      return;
    }

    const t = setTimeout(async () => {
      try {
        const res = await api.assets.searchSuggestions(assetSearch);
        if (res.success && res.data) {
          setSuggestions(res.data);
        }
      } catch (err) {
        console.warn('Autocomplete error:', err);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [assetSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const confirmed = await showConfirm({
      title: 'Log Equipment Maintenance',
      message: `Register ${maintType} service record for ${selectedAsset?.name || assetSearch} (Cost: ₹${parseFloat(cost) || 0})?`,
      confirmText: 'Log Maintenance',
      cancelText: 'Cancel',
      type: maintType === 'breakdown' ? 'warning' : 'info',
    });
    if (!confirmed) return;

    setLoading(true);

    try {
      const response = await api.assets.logMaintenance({
        assetId: selectedAsset ? selectedAsset.id : assetSearch,
        maintenanceType: maintType,
        serviceDate,
        cost: parseFloat(cost) || 0,
        issueDescription,
        vendorName: selectedAsset?.vendor_name || 'Apex Medical Systems',
      });

      if (response.success && response.data) {
        setTicketId(response.data.ticket.ticket_number);
        setAssignedVendor(selectedAsset?.vendor_name || 'AMC Vendor');
        setSuccess(true);
        if (onMaintenanceLogged) {
          onMaintenanceLogged();
        }
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 1800);
      } else {
        throw new Error(response.message || 'Failed to log maintenance record');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error creating maintenance ticket. Please verify asset ID.');
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
            <h3 className="text-lg font-bold text-slate-800">Maintenance Logged!</h3>
            <p className="text-[14px] text-slate-600 mt-2">
              Ticket <span className="font-bold text-[#127670]">{ticketId}</span> has been logged and assigned to <span className="font-medium text-slate-800">{assignedVendor}</span>.
            </p>
          </div>
        ) : (
          <form id="maintenance-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            
            <div className="pt-2 relative">
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Select Asset <span className="text-[#D94432]">*</span></label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  required
                  type="text" 
                  value={assetSearch}
                  onChange={(e) => {
                    setAssetSearch(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Search asset ID (e.g. AST-24-1000) or name..." 
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-md text-[13px] w-full focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] font-medium"
                />
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowSuggestions(false)} />
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-40 max-h-48 overflow-y-auto">
                    {suggestions.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedAsset(item);
                          setAssetSearch(`${item.asset_tag} - ${item.name}`);
                          setShowSuggestions(false);
                        }}
                        className="p-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[12px] text-[#127670]">{item.asset_tag}</span>
                          <span className="text-[11px] text-slate-400">{item.department}</span>
                        </div>
                        <p className="text-[12px] text-slate-800 font-medium truncate">{item.name}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-2">Maintenance Type <span className="text-[#D94432]">*</span></label>
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
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Service Date <span className="text-[#D94432]">*</span></label>
                <input 
                  required
                  type="date" 
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Est. Cost (INR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">₹</span>
                  <input 
                    type="number" 
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
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
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
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
              disabled={loading}
              className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-md text-[13px] font-semibold hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit"
              form="maintenance-form"
              disabled={loading}
              className={cn(
                "flex-1 py-2.5 text-white rounded-md text-[13px] font-semibold shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50",
                maintType === 'breakdown' ? "bg-[#D94432] hover:bg-[#b83829]" : "bg-[#125F5C] hover:bg-[#0f4d4a]"
              )}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Logging...
                </>
              ) : (
                <>
                  <Wrench size={16} /> Log Ticket
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
