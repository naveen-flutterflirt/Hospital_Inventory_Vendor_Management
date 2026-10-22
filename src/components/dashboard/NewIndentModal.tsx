'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2, Package, Loader2 } from 'lucide-react';
import { api, IndentLookups } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/utils';

interface NewIndentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface NewIndentItemRow {
  id: string;
  itemId?: number | null;
  itemName: string;
  itemCode: string;
  quantity: number;
  uom: string;
  stockOnHand?: number;
}

export default function NewIndentModal({ isOpen, onClose, onSuccess }: NewIndentModalProps) {
  const { toast, showConfirm } = useToast();
  const [loading, setLoading] = useState(false);
  const [lookups, setLookups] = useState<IndentLookups | null>(null);

  const [requestingDept, setRequestingDept] = useState('ICU');
  const [toStoreName, setToStoreName] = useState('IP Pharmacy');
  const [priority, setPriority] = useState<'Routine' | 'Urgent' | 'Emergency'>('Routine');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<NewIndentItemRow[]>([
    {
      id: '1',
      itemId: null,
      itemName: '',
      itemCode: '',
      quantity: 1,
      uom: 'units',
      stockOnHand: 0,
    },
  ]);

  const loadLookups = useCallback(async () => {
    try {
      const res = await api.indents.getLookups();
      if (res.success && res.data) {
        setLookups(res.data);
        if (res.data.departments.length > 0 && !requestingDept) {
          setRequestingDept(res.data.departments[0]);
        }
        if (res.data.stores.length > 0 && !toStoreName) {
          setToStoreName(res.data.stores[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load indent lookups:', err);
    }
  }, [requestingDept, toStoreName]);

  useEffect(() => {
    if (isOpen) {
      loadLookups();
    }
  }, [isOpen, loadLookups]);

  const handleAddItemRow = (formularyItem?: any) => {
    const newRow: NewIndentItemRow = {
      id: String(Date.now() + Math.random()),
      itemId: formularyItem ? formularyItem.id : null,
      itemName: formularyItem ? formularyItem.name : '',
      itemCode: formularyItem ? formularyItem.itemCode : '',
      quantity: 1,
      uom: formularyItem ? formularyItem.uom : 'units',
      stockOnHand: formularyItem ? formularyItem.stockOnHand : 0,
    };
    setItems(prev => [...prev, newRow]);
  };

  const handleRemoveItemRow = (id: string) => {
    if (items.length === 1) {
      toast.warning('Indent must have at least one item.', 'Minimum 1 Item');
      return;
    }
    setItems(prev => prev.filter(r => r.id !== id));
  };

  const handleUpdateItemRow = (id: string, field: keyof NewIndentItemRow, value: any) => {
    setItems(prev =>
      prev.map(row => {
        if (row.id !== id) return row;
        return { ...row, [field]: value };
      })
    );
  };

  const handleSelectFormularyItem = (rowId: string, item: any) => {
    setItems(prev =>
      prev.map(row => {
        if (row.id !== rowId) return row;
        return {
          ...row,
          itemId: item.id,
          itemName: item.name,
          itemCode: item.itemCode,
          uom: item.uom,
          stockOnHand: item.stockOnHand,
        };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!requestingDept.trim()) {
      toast.error('Please select requesting department.', 'Validation Error');
      return;
    }

    const validItems = items.filter(r => r.itemName.trim().length > 0 && r.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Please specify at least one valid item with name and quantity.', 'Validation Error');
      return;
    }

    const confirmed = await showConfirm({
      title: 'Submit Ward Indent',
      message: `Raise requisition for ${validItems.length} item(s) from ${requestingDept} to ${toStoreName} (${priority} priority)?`,
      confirmText: 'Raise Indent',
      cancelText: 'Cancel',
      type: priority === 'Emergency' ? 'danger' : 'success',
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await api.indents.create({
        requestingDept,
        toStoreName,
        priority,
        notes,
        items: validItems.map(it => ({
          itemId: it.itemId,
          itemName: it.itemName,
          itemCode: it.itemCode,
          quantity: it.quantity,
          uom: it.uom,
        })),
      });

      if (res.success && res.data) {
        toast.success(
          `Indent ${res.data.indentNumber} created successfully! Store notified.`,
          'Indent Raised'
        );
        // Reset form
        setItems([
          {
            id: '1',
            itemId: null,
            itemName: '',
            itemCode: '',
            quantity: 1,
            uom: 'units',
            stockOnHand: 0,
          },
        ]);
        setNotes('');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(res.message || 'Failed to create indent', 'Error');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error occurred while creating indent', 'Error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const departmentsList = lookups?.departments || ['ICU', 'Ward 3', 'OT 1', 'Emergency Dept', 'Pediatrics', 'Dialysis', 'Maternity', 'Cardiology'];
  const storesList = lookups?.stores || ['IP Pharmacy', 'Central Store', 'General Store'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-3xl max-h-[92vh] rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#127670]/10 flex items-center justify-center text-[#127670]">
              <Package size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Raise Ward Indent</h2>
              <p className="text-[12px] text-slate-500">Internal requisition to pharmacy or central store</p>
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Dept & Store & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                Requesting Department <span className="text-[#D94432]">*</span>
              </label>
              <select
                value={requestingDept}
                onChange={(e) => setRequestingDept(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] bg-white cursor-pointer"
              >
                {departmentsList.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                To Store <span className="text-[#D94432]">*</span>
              </label>
              <select
                value={toStoreName}
                onChange={(e) => setToStoreName(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] bg-white cursor-pointer"
              >
                {storesList.map((store) => (
                  <option key={store} value={store}>{store}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Priority</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Routine', 'Urgent', 'Emergency'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={cn(
                      "py-2 text-[12px] font-semibold rounded-lg border transition-all cursor-pointer",
                      priority === p
                        ? p === 'Emergency'
                          ? "bg-[#D94432]/10 border-[#D94432] text-[#D94432]"
                          : p === 'Urgent'
                          ? "bg-[#E89A3C]/10 border-[#E89A3C] text-[#E89A3C]"
                          : "bg-[#127670]/10 border-[#127670] text-[#127670]"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Line Items Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[12px] font-semibold text-slate-700 uppercase tracking-wider">
                Requisition Items ({items.length})
              </label>
              <button
                type="button"
                onClick={() => handleAddItemRow()}
                className="text-[12px] text-[#127670] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> Add Line Item
              </button>
            </div>

            <div className="space-y-2.5">
              {items.map((row, index) => (
                <div 
                  key={row.id} 
                  className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-2.5"
                >
                  <div className="text-[12px] font-bold text-slate-400 w-5 shrink-0 text-center">
                    {index + 1}
                  </div>

                  {/* Item Selection / Input */}
                  <div className="flex-1 w-full sm:w-auto">
                    {lookups?.items && lookups.items.length > 0 ? (
                      <select
                        value={row.itemId ? String(row.itemId) : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) {
                            handleUpdateItemRow(row.id, 'itemId', null);
                            handleUpdateItemRow(row.id, 'itemName', '');
                            handleUpdateItemRow(row.id, 'itemCode', '');
                            return;
                          }
                          const found = lookups.items.find(it => String(it.id) === val);
                          if (found) {
                            handleSelectFormularyItem(row.id, found);
                          }
                        }}
                        className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-[13px] text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-[#127670] cursor-pointer"
                      >
                        <option value="">Select Formulary Item or Type Custom...</option>
                        {lookups.items.map(it => (
                          <option key={it.id} value={it.id}>
                            {it.name} ({it.itemCode}) — In Store: {it.stockOnHand} {it.uom}
                          </option>
                        ))}
                      </select>
                    ) : null}

                    {/* If no itemId or wanting custom item */}
                    {(!row.itemId || !lookups?.items || lookups.items.length === 0) && (
                      <input
                        type="text"
                        placeholder="Enter item name / consumable..."
                        value={row.itemName}
                        onChange={(e) => handleUpdateItemRow(row.id, 'itemName', e.target.value)}
                        className="w-full mt-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[13px] text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-[#127670]"
                      />
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="w-24 shrink-0">
                    <label className="block text-[10px] text-slate-400 font-medium sm:hidden">Qty</label>
                    <input
                      type="number"
                      min={1}
                      placeholder="Qty"
                      value={row.quantity}
                      onChange={(e) => handleUpdateItemRow(row.id, 'quantity', Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-[13px] text-center font-bold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-[#127670]"
                    />
                  </div>

                  {/* UOM */}
                  <div className="w-24 shrink-0">
                    <label className="block text-[10px] text-slate-400 font-medium sm:hidden">UOM</label>
                    <input
                      type="text"
                      placeholder="UOM"
                      value={row.uom}
                      onChange={(e) => handleUpdateItemRow(row.id, 'uom', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-[12px] text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#127670]"
                    />
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveItemRow(row.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Remove Item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
              Ward Requisition Notes & Purpose
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g., Morning emergency crash cart replenishment, post-op dressings..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] resize-none"
            />
          </div>

          {/* Submit & Cancel Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
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
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Package size={15} />}
              Submit Requisition
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
