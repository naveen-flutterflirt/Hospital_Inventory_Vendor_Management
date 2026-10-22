'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Loader2, ShoppingCart } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { api, PrLookups } from '@/lib/api';

interface NewPRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormItemLine {
  itemId?: number;
  itemName: string;
  itemCode: string;
  quantity: number;
  unitRate: number;
  uom: string;
}

export default function NewPRModal({ isOpen, onClose, onSuccess }: NewPRModalProps) {
  const { toast, showConfirm } = useToast();

  const [lookups, setLookups] = useState<PrLookups | null>(null);
  const [_loadingLookups, setLoadingLookups] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State
  const [department, setDepartment] = useState<string>('Pharmacy');
  const [purchaseType, setPurchaseType] = useState<string>('Regular PO');
  const [priority, setPriority] = useState<string>('Routine');
  const [remarks, setRemarks] = useState<string>('');
  const [items, setItems] = useState<FormItemLine[]>([
    {
      itemId: undefined,
      itemName: '',
      itemCode: '',
      quantity: 1,
      unitRate: 0,
      uom: 'units',
    },
  ]);

  useEffect(() => {
    if (isOpen) {
      loadLookups();
    }
  }, [isOpen]);

  const loadLookups = async () => {
    setLoadingLookups(true);
    try {
      const res = await api.purchaseRequests.getLookups();
      if (res.success && res.data) {
        setLookups(res.data);
        if (res.data.departments?.length > 0 && !department) {
          setDepartment(res.data.departments[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load PR lookups:', err);
    } finally {
      setLoadingLookups(false);
    }
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        itemId: undefined,
        itemName: '',
        itemCode: '',
        quantity: 10,
        unitRate: 100,
        uom: 'units',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      toast.warning('At least one item line is required.', 'Item Required');
      return;
    }
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleItemSelect = (index: number, itemId: number) => {
    const selected = lookups?.items.find((it) => it.id === itemId);
    if (!selected) return;

    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        itemId: selected.id,
        itemName: selected.name,
        itemCode: selected.itemCode,
        quantity: copy[index]?.quantity || 10,
        unitRate: selected.unitRate || 100,
        uom: selected.uom || 'units',
      };
      return copy;
    });
  };

  const handleFieldChange = (
    index: number,
    field: keyof FormItemLine,
    value: any
  ) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: value,
      };
      return copy;
    });
  };

  const totalEstimatedValue = items.reduce(
    (acc, it) => acc + (it.quantity || 0) * (it.unitRate || 0),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!department) {
      toast.error('Please select a department / cost center.', 'Validation Error');
      return;
    }

    const invalidItem = items.find((it) => !it.itemName.trim() || it.quantity <= 0);
    if (invalidItem) {
      toast.error('Please ensure all items have valid names and positive quantities.', 'Validation Error');
      return;
    }

    const confirmed = await showConfirm({
      title: 'Submit Purchase Request',
      message: `Submit requisition for ${department} with ${items.length} line item(s) (Est: ₹${totalEstimatedValue.toLocaleString('en-IN')}) for administrative approval?`,
      confirmText: 'Submit Requisition',
      cancelText: 'Cancel',
      type: 'success',
    });
    if (!confirmed) return;

    setSubmitting(true);
    try {
      const res = await api.purchaseRequests.create({
        department,
        purchaseType,
        priority,
        source: 'Manual',
        remarks,
        items: items.map((it) => ({
          itemId: it.itemId,
          itemName: it.itemName,
          itemCode: it.itemCode,
          quantity: Number(it.quantity),
          unitRate: Number(it.unitRate),
          uom: it.uom,
        })),
      });

      if (res.success && res.data) {
        toast.success(
          `Requisition ${res.data.prNumber} generated for ${department} (₹${totalEstimatedValue.toLocaleString('en-IN')}).`,
          'Purchase Request Created'
        );
        onClose();
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.message || 'Failed to create purchase request.', 'Error');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error occurred while saving requisition.', 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const departmentsList = lookups?.departments || [
    'Pharmacy', 'OT', 'Lab', 'Radiology', 'ICU', 'General Admin', 'Cardiology', 'Dialysis'
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">Raise Purchase Request (PR)</h2>
            <p className="text-xs text-slate-500">Initiate official procurement requisition with live database inventory</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-full transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Department & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Cost Center / Department <span className="text-rose-500">*</span>
              </label>
              <select 
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] cursor-pointer shadow-2xs"
              >
                {departmentsList.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Priority
              </label>
              <div className="flex items-center gap-4 pt-1.5">
                {['Routine', 'Urgent', 'Emergency'].map((p) => (
                  <label key={p} className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                    <input 
                      type="radio" 
                      name="priority" 
                      value={p}
                      checked={priority === p}
                      onChange={(e) => setPriority(e.target.value)}
                      className={p === 'Emergency' ? "accent-rose-600" : "accent-[#127670]"}
                    />
                    <span className={p === 'Emergency' ? "text-rose-600 font-semibold" : ""}>{p}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Purchase Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Purchase Framework
            </label>
            <div className="flex flex-wrap gap-4">
              {['Regular PO', 'Rate Contract', 'Emergency'].map((pt) => (
                <label key={pt} className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input 
                    type="radio" 
                    name="purchaseType" 
                    value={pt}
                    checked={purchaseType === pt}
                    onChange={(e) => setPurchaseType(e.target.value)}
                    className="accent-[#127670]"
                  />
                  <span>{pt}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Items Table Builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700">
                Requisition Items <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-xs font-semibold text-[#127670] hover:text-[#0c4240] cursor-pointer"
              >
                <Plus size={14} /> Add Line Item
              </button>
            </div>

            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {items.map((line, idx) => (
                <div 
                  key={idx} 
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center gap-2.5 text-xs shadow-2xs"
                >
                  {/* Select or type item */}
                  <div className="flex-1 w-full sm:w-auto min-w-0">
                    {lookups?.items && lookups.items.length > 0 ? (
                      <select
                        value={line.itemId || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) handleItemSelect(idx, Number(val));
                        }}
                        className="w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:border-[#127670] mb-1 cursor-pointer truncate"
                      >
                        <option value="">-- Choose from Hospital Formulary --</option>
                        {lookups.items.map((it) => (
                          <option key={it.id} value={it.id}>
                            {it.name} ({it.itemCode}) - ₹{it.unitRate}
                          </option>
                        ))}
                      </select>
                    ) : null}

                    <input 
                      type="text" 
                      placeholder="Item name / specification"
                      value={line.itemName}
                      onChange={(e) => handleFieldChange(idx, 'itemName', e.target.value)}
                      className="w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800 bg-white focus:outline-none focus:border-[#127670]"
                      required
                    />
                  </div>

                  {/* Quantity & Unit Rate */}
                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                    <div className="w-20">
                      <input 
                        type="number" 
                        min="1"
                        placeholder="Qty"
                        value={line.quantity || ''}
                        onChange={(e) => handleFieldChange(idx, 'quantity', parseInt(e.target.value || '1', 10))}
                        className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-xs text-right font-medium text-slate-800 bg-white focus:outline-none focus:border-[#127670]"
                      />
                    </div>

                    <div className="w-24">
                      <input 
                        type="number" 
                        step="0.1"
                        min="0"
                        placeholder="Rate ₹"
                        value={line.unitRate || ''}
                        onChange={(e) => handleFieldChange(idx, 'unitRate', parseFloat(e.target.value || '0'))}
                        className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-xs text-right font-medium text-slate-800 bg-white focus:outline-none focus:border-[#127670]"
                      />
                    </div>

                    <div className="w-20 text-right font-bold text-slate-800 shrink-0">
                      ₹{((line.quantity || 0) * (line.unitRate || 0)).toLocaleString('en-IN')}
                    </div>

                    <button 
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer shrink-0 ml-1"
                      title="Remove item"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Estimated Sum */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-teal-50/60 border border-teal-100 mt-2.5 text-xs">
              <span className="font-semibold text-slate-600">Total Estimated Requisition Value:</span>
              <span className="font-bold text-sm text-[#127670]">
                ₹{totalEstimatedValue.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Justification / Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Clinical / Administrative Justification
            </label>
            <textarea 
              rows={3} 
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] resize-none"
              placeholder="E.g., Required to meet minimum stock buffer for upcoming surgical schedule..."
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-[#127670] hover:bg-[#0f605b] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Submitting PR...</span>
                </>
              ) : (
                <>
                  <ShoppingCart size={15} />
                  <span>Submit Purchase Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
