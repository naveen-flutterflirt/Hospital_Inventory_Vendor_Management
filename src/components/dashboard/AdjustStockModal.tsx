'use client';

import { useState } from 'react';
import { X, SlidersHorizontal, Loader2 } from 'lucide-react';
import { api, ItemBatch } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/utils';

interface AdjustStockModalProps {
  itemId: number;
  itemCode: string;
  itemName: string;
  uom: string;
  batches: ItemBatch[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AdjustStockModal({
  itemId,
  itemCode,
  itemName,
  uom,
  batches,
  isOpen,
  onClose,
  onSuccess,
}: AdjustStockModalProps) {
  const { toast, showConfirm } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string>(batches[0] ? String(batches[0].id) : '');
  const [adjustmentType, setAdjustmentType] = useState<'Deduct' | 'Add'>('Deduct');
  const [quantity, setQuantity] = useState<number>(10);
  const [reason, setReason] = useState<string>('Damage / Transit Breakage');
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      toast.error('Adjustment quantity must be greater than zero.', 'Validation Error');
      return;
    }

    const delta = adjustmentType === 'Deduct' ? -quantity : quantity;
    const fullReason = `${reason}${notes ? ` - ${notes}` : ''}`;

    const confirmed = await showConfirm({
      title: 'Confirm Inventory Adjustment',
      message: `Are you sure you want to ${adjustmentType.toLowerCase()} ${quantity} ${uom} for ${itemName}? Reason: "${reason}".`,
      confirmText: 'Adjust Stock',
      cancelText: 'Cancel',
      type: adjustmentType === 'Deduct' ? 'warning' : 'info',
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await api.items.adjustStock(itemId, {
        batchId: selectedBatchId ? parseInt(selectedBatchId, 10) : undefined,
        quantityDelta: delta,
        reason: fullReason,
      });

      if (res.success && res.data) {
        toast.success(
          `Stock adjusted by ${delta > 0 ? `+${delta}` : delta} ${uom}. New total: ${res.data.newOnHand.toLocaleString('en-IN')}`,
          'Stock Adjusted'
        );
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(res.message || 'Failed to adjust stock', 'Error');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error occurred while adjusting stock', 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#127670]/10 flex items-center justify-center text-[#127670]">
              <SlidersHorizontal size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Adjust Stock Quantity</h2>
              <p className="text-[12px] text-slate-500">{itemName} ({itemCode})</p>
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Target Batch */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1">Target Batch</label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] cursor-pointer"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batch} · {b.store} · Available: {b.qty} (Exp: {b.expiry})
                </option>
              ))}
            </select>
          </div>

          {/* Action: Deduct or Add */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1">Adjustment Direction</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType('Deduct')}
                className={cn(
                  "py-2 text-[13px] font-semibold rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1.5",
                  adjustmentType === 'Deduct'
                    ? "bg-rose-50 border-rose-300 text-rose-700 font-bold"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                Deduct / Write-Off (-)
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('Add')}
                className={cn(
                  "py-2 text-[13px] font-semibold rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1.5",
                  adjustmentType === 'Add'
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700 font-bold"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                Add Surplus (+)
              </button>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1">
              Quantity to {adjustmentType} ({uom})
            </label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[14px] font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
            />
          </div>

          {/* Reason Pre-sets */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1">Reason Category</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] cursor-pointer"
            >
              <option value="Damage / Transit Breakage">Damage / Transit Breakage</option>
              <option value="Expiry Date Write-Off">Expiry Date Write-Off</option>
              <option value="Physical Verification Discrepancy">Physical Verification Discrepancy</option>
              <option value="Ward Emergency Return Deficit">Ward Emergency Return Deficit</option>
              <option value="QC Quarantine Write-off">QC Quarantine Write-off</option>
              <option value="Audit Stock Correction">Audit Stock Correction</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1">Additional Notes</label>
            <input
              type="text"
              placeholder="E.g., Approved by Chief Pharmacist post audit..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
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
              className={cn(
                "px-4 py-2 rounded-lg text-[13px] font-semibold text-white shadow-sm transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50",
                adjustmentType === 'Deduct' ? "bg-rose-600 hover:bg-rose-700" : "bg-[#127670] hover:bg-[#0f605b]"
              )}
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Apply Stock Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
