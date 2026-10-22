"use client";

import React, { useState, useEffect } from 'react';
import { X, Plus, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

interface RegisterAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssetRegistered?: () => void;
}

export default function RegisterAssetModal({ isOpen, onClose, onAssetRegistered }: RegisterAssetModalProps) {
  const { showConfirm, toast } = useToast();
  const [name, setName] = useState('');
  const [serialNo, setSerialNo] = useState('');
  const [department, setDepartment] = useState('Radiology');
  const [vendorName, setVendorName] = useState('Apex Medical Systems');
  const [purchaseCost, setPurchaseCost] = useState('4500000');
  const [amcExpiryDate, setAmcExpiryDate] = useState('');
  const [status, setStatus] = useState<'Active' | 'In Maintenance' | 'Out of Service'>('Active');

  useEffect(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    setAmcExpiryDate(d.toISOString().split('T')[0]);
  }, []);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registeredTag, setRegisteredTag] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const confirmed = await showConfirm({
      title: 'Register Biomedical Asset',
      message: `Register capital equipment "${name}" (Serial: ${serialNo || 'N/A'}) to ${department} (Book Value: ₹${parseFloat(purchaseCost) || 0})?`,
      confirmText: 'Register Asset',
      cancelText: 'Cancel',
      type: 'success',
    });
    if (!confirmed) return;

    setLoading(true);

    try {
      const response = await api.assets.registerAsset({
        name,
        serialNo,
        department,
        vendorName,
        purchaseCost: parseFloat(purchaseCost) || 0,
        amcExpiryDate,
        status,
      });

      if (response.success && response.data) {
        setRegisteredTag(response.data.asset_tag);
        setSuccess(true);
        toast.success(`Asset ${response.data.asset_tag} (${name}) registered successfully!`, 'Asset Registered');
        if (onAssetRegistered) {
          onAssetRegistered();
        }
        setTimeout(() => {
          setSuccess(false);
          setName('');
          setSerialNo('');
          onClose();
        }, 1800);
      } else {
        throw new Error(response.message || 'Failed to register capital equipment');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error registering asset. Please check inputs.');
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
              <Plus size={18} className="text-[#127670]" /> Register Asset
            </h2>
            <p className="text-[13px] text-slate-500">Add a new capital equipment to inventory</p>
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
            <h3 className="text-lg font-bold text-slate-800">Asset Registered!</h3>
            <p className="text-[14px] text-slate-600 mt-2">
              Equipment assigned tag <span className="font-bold text-[#127670]">{registeredTag}</span> with an active warranty & AMC contract.
            </p>
          </div>
        ) : (
          <form id="asset-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Asset Name <span className="text-[#D94432]">*</span></label>
              <input 
                required
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. MRI Scanner 3T (Unit 2)" 
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Serial Number <span className="text-[#D94432]">*</span></label>
              <input 
                required
                type="text" 
                value={serialNo}
                onChange={(e) => setSerialNo(e.target.value)}
                placeholder="e.g. SN-0059E78B" 
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Department Assignment <span className="text-[#D94432]">*</span></label>
              <select 
                required 
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] cursor-pointer"
              >
                <option value="Radiology">Radiology</option>
                <option value="ICU">ICU</option>
                <option value="Operation Theatre">Operation Theatre</option>
                <option value="Pathology Lab">Pathology Lab</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Emergency & Trauma">Emergency & Trauma</option>
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Purchase Cost (INR) <span className="text-[#D94432]">*</span></label>
              <input 
                required
                type="number" 
                value={purchaseCost}
                onChange={(e) => setPurchaseCost(e.target.value)}
                placeholder="4500000" 
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
              />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-[14px] font-bold text-slate-800 mb-4">AMC & Contract Details</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">AMC Vendor</label>
                  <select 
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] cursor-pointer"
                  >
                    <option value="Apex Medical Systems">Apex Medical Systems</option>
                    <option value="Siemens Healthineers">Siemens Healthineers</option>
                    <option value="Philips Healthcare">Philips Healthcare</option>
                    <option value="GE Medical Systems">GE Medical Systems</option>
                    <option value="Nova MedEquip Traders">Nova MedEquip Traders</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">AMC Expiry Date</label>
                  <input 
                    type="date" 
                    value={amcExpiryDate}
                    onChange={(e) => setAmcExpiryDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Initial Status</label>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] cursor-pointer"
                  >
                    <option value="Active">Active (Ready for Clinical Use)</option>
                    <option value="In Maintenance">In Maintenance / Calibration</option>
                  </select>
                </div>
              </div>
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
              form="asset-form"
              disabled={loading}
              className="flex-1 py-2.5 bg-[#125F5C] text-white rounded-md text-[13px] font-semibold hover:bg-[#0f4d4a] shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Registering...
                </>
              ) : (
                <>
                  <Plus size={16} /> Register Asset
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
