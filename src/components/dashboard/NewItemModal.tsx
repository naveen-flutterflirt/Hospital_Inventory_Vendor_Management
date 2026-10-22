'use client';

import React, { useState } from 'react';
import { X, Plus, Package, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

interface NewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function NewItemModal({ isOpen, onClose, onSuccess }: NewItemModalProps) {
  const { toast, showConfirm } = useToast();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [category, setCategory] = useState('Pharmacy');
  const [form, setForm] = useState('vial');
  const [uom, setUom] = useState('vial (box of 10)');
  const [hsnCode, setHsnCode] = useState('3004');
  const [gstRate, setGstRate] = useState<number>(12);
  const [classVital, setClassVital] = useState('Vital · A-class');
  const [scheduleType, setScheduleType] = useState('Schedule H');
  const [reorderLevel, setReorderLevel] = useState<number>(200);
  const [reorderQty, setReorderQty] = useState<number>(1000);
  const [lastRate, setLastRate] = useState<number>(45);
  const [initialStock, setInitialStock] = useState<number>(500);
  const [binLocation, setBinLocation] = useState('Central Store · A1-01');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Item name is required.', 'Validation Error');
      return;
    }

    const confirmed = await showConfirm({
      title: 'Add Formulary Item',
      message: `Register new formulary item "${name.trim()}" (${category}, Initial stock: ${initialStock} ${uom})?`,
      confirmText: 'Add to Formulary',
      cancelText: 'Cancel',
      type: 'success',
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await api.items.create({
        name,
        genericName: genericName || name,
        category,
        form,
        uom,
        hsnCode,
        gstRate,
        classVital,
        scheduleType,
        reorderLevel,
        reorderQty,
        lastRate,
        initialStock,
        binLocation,
      });

      if (res.success && res.data) {
        toast.success(
          `Item ${res.data.itemCode} (${res.data.name}) added to hospital master formulary!`,
          'Item Created'
        );
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(res.message || 'Failed to create item', 'Error');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error occurred while creating item', 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-2xl max-h-[92vh] rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#127670]/10 flex items-center justify-center text-[#127670]">
              <Package size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Add Formulary Item</h2>
              <p className="text-[12px] text-slate-500">Register new drug, consumable, or implant into hospital master</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                Item Brand / Trade Name <span className="text-[#D94432]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="E.g., Inj. Ceftriaxone 1 g"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1">Generic / Chemical Name</label>
              <input
                type="text"
                placeholder="E.g., Ceftriaxone sodium sterile"
                value={genericName}
                onChange={(e) => setGenericName(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] cursor-pointer"
              >
                <option value="Pharmacy">Pharmacy</option>
                <option value="Consumables">Consumables</option>
                <option value="Implants">Implants</option>
                <option value="Lab Supplies">Lab Supplies</option>
                <option value="Radiology">Radiology</option>
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1">Dosage / Form</label>
              <input
                type="text"
                placeholder="vial, ampoule, unit"
                value={form}
                onChange={(e) => setForm(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1">Unit of Measure (UOM)</label>
              <input
                type="text"
                placeholder="vial (box of 10), unit"
                value={uom}
                onChange={(e) => setUom(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1">Classification</label>
              <select
                value={classVital}
                onChange={(e) => setClassVital(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] cursor-pointer"
              >
                <option value="Vital · A-class">Vital · A-class</option>
                <option value="Essential · B-class">Essential · B-class</option>
                <option value="Desirable · C-class">Desirable · C-class</option>
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1">Drug Schedule</label>
              <select
                value={scheduleType}
                onChange={(e) => setScheduleType(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] cursor-pointer"
              >
                <option value="Schedule H">Schedule H</option>
                <option value="Schedule X">Schedule X</option>
                <option value="Non-Scheduled">Non-Scheduled</option>
                <option value="Critical Implant">Critical Implant</option>
                <option value="In-Vitro Diagnostic">In-Vitro Diagnostic</option>
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1">HSN / GST</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="HSN"
                  value={hsnCode}
                  onChange={(e) => setHsnCode(e.target.value)}
                  className="w-1/2 border border-slate-200 rounded-lg px-2.5 py-2 text-[13px] text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
                />
                <input
                  type="number"
                  placeholder="GST %"
                  value={gstRate}
                  onChange={(e) => setGstRate(parseFloat(e.target.value) || 0)}
                  className="w-1/2 border border-slate-200 rounded-lg px-2.5 py-2 text-[13px] text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1">Reorder Level</label>
              <input
                type="number"
                min={0}
                value={reorderLevel}
                onChange={(e) => setReorderLevel(parseInt(e.target.value, 10) || 0)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1">Reorder Quantity</label>
              <input
                type="number"
                min={1}
                value={reorderQty}
                onChange={(e) => setReorderQty(parseInt(e.target.value, 10) || 1)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1">Last Rate (₹)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={lastRate}
                onChange={(e) => setLastRate(parseFloat(e.target.value) || 0)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-slate-100">
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1">Initial Opening Stock</label>
              <input
                type="number"
                min={0}
                value={initialStock}
                onChange={(e) => setInitialStock(parseInt(e.target.value, 10) || 0)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1">Primary Bin Location</label>
              <input
                type="text"
                placeholder="Central Store · A1-01"
                value={binLocation}
                onChange={(e) => setBinLocation(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[13px] font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-[#127670] hover:bg-[#0f605b] text-white rounded-lg text-[13px] font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              Add to Formulary
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
