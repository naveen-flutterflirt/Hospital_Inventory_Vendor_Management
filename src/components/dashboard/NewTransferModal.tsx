import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, Search, CheckCircle, Loader2, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { api, TransferLookupsResponse } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

interface NewTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface TransferLine {
  itemId: number;
  itemCode: string;
  itemName: string;
  quantity: number;
  stock: number;
  uom: string;
}

export default function NewTransferModal({ isOpen, onClose, onSuccess }: NewTransferModalProps) {
  const { showConfirm, toast } = useToast();
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [createdTransferNumber, setCreatedTransferNumber] = useState('');

  // Lookups data
  const [lookups, setLookups] = useState<TransferLookupsResponse | null>(null);
  const [isLoadingLookups, setIsLoadingLookups] = useState(false);

  // Form Fields
  const [fromStore, setFromStore] = useState('Central Warehouse & Main Drug Store');
  const [toStore, setToStore] = useState('Apex Pharmacy & Cold Chain Store');
  const [notes, setNotes] = useState('');

  // Items search & selected lines
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [selectedLines, setSelectedLines] = useState<TransferLine[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSuccess(false);
      setIsSubmitting(false);
      setErrorMessage('');
      setCreatedTransferNumber('');
      setNotes('');
      setItemSearchTerm('');

      // Load stores and items lookups
      loadLookups();
    }
  }, [isOpen]);

  const loadLookups = async () => {
    setIsLoadingLookups(true);
    try {
      const res = await api.transfers.getLookups();
      if (res.success && res.data) {
        setLookups(res.data);
        if (res.data.stores.length >= 2) {
          setFromStore(res.data.stores[0].name);
          setToStore(res.data.stores[1].name);
        }
        // Initial 2 items if empty
        if (res.data.items.length >= 2) {
          setSelectedLines([
            {
              itemId: res.data.items[0].id,
              itemCode: res.data.items[0].item_code,
              itemName: res.data.items[0].name,
              quantity: 50,
              stock: res.data.items[0].stock,
              uom: res.data.items[0].uom || 'units',
            },
            {
              itemId: res.data.items[1].id,
              itemCode: res.data.items[1].item_code,
              itemName: res.data.items[1].name,
              quantity: 20,
              stock: res.data.items[1].stock,
              uom: res.data.items[1].uom || 'units',
            },
          ]);
        }
      }
    } catch (err) {
      console.error('Failed to load transfer lookups:', err);
    } finally {
      setIsLoadingLookups(false);
    }
  };

  const handleAddItem = (item: any) => {
    if (selectedLines.some(l => l.itemId === item.id)) return;
    setSelectedLines(prev => [
      ...prev,
      {
        itemId: item.id,
        itemCode: item.item_code,
        itemName: item.name,
        quantity: 10,
        stock: item.stock,
        uom: item.uom || 'units',
      },
    ]);
    setItemSearchTerm('');
  };

  const handleRemoveLine = (itemId: number) => {
    setSelectedLines(prev => prev.filter(l => l.itemId !== itemId));
  };

  const handleQtyChange = (itemId: number, qty: number) => {
    setSelectedLines(prev =>
      prev.map(l => (l.itemId === itemId ? { ...l, quantity: Math.max(1, qty) } : l))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (fromStore === toStore) {
      setErrorMessage('From Store and To Store cannot be the same');
      return;
    }

    if (selectedLines.length === 0) {
      setErrorMessage('Please add at least one item line to transfer');
      return;
    }

    const totalUnits = selectedLines.reduce((sum, l) => sum + (l.quantity || 0), 0);
    const confirmed = await showConfirm({
      title: 'Initiate Stock Transfer',
      message: `Transfer ${totalUnits} units across ${selectedLines.length} item line(s) from "${fromStore}" to "${toStore}"?`,
      confirmText: 'Dispatch Transfer',
      cancelText: 'Cancel',
      type: 'info',
    });
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      const res = await api.transfers.createTransfer({
        fromStore,
        toStore,
        items: selectedLines.map(l => ({
          itemId: l.itemId,
          itemCode: l.itemCode,
          itemName: l.itemName,
          quantity: l.quantity,
          uom: l.uom,
        })),
        notes: notes.trim() || undefined,
      });

      if (res.success && res.data?.transfer) {
        setCreatedTransferNumber(res.data.transfer.transfer_number);
        setSuccess(true);
        toast.success(`Stock transfer ${res.data.transfer.transfer_number} dispatched successfully!`, 'Transfer Dispatched');
        if (onSuccess) {
          onSuccess();
        }

        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 2200);
      } else {
        setErrorMessage(res.message || 'Failed to initiate stock transfer');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred during transfer';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Filter items matching search
  const filteredSearchItems = lookups?.items.filter(item => {
    if (!itemSearchTerm.trim()) return false;
    const term = itemSearchTerm.toLowerCase();
    return (
      (item.name.toLowerCase().includes(term) || item.item_code.toLowerCase().includes(term)) &&
      !selectedLines.some(l => l.itemId === item.id)
    );
  }) || [];

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/40 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ArrowRightLeft size={18} className="text-[#127670]" /> Stock Transfer
            </h2>
            <p className="text-[13px] text-slate-500">Move inventory between stores or sub-stores</p>
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
            <h3 className="text-lg font-bold text-slate-800">Transfer Initiated</h3>
            <p className="text-[14px] text-slate-600 mt-2">
              <strong className="text-[#127670]">{createdTransferNumber}</strong> has been generated and is awaiting receipt at <span className="font-semibold text-slate-800">{toStore}</span>.
            </p>
            <p className="text-[12px] text-slate-400 mt-2">Status set to &quot;In Transit&quot; with telemetry alert sent.</p>
          </div>
        ) : (
          <form id="transfer-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[13px] flex items-start gap-2 animate-in fade-in">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">From Store</label>
                <select 
                  value={fromStore}
                  onChange={(e) => setFromStore(e.target.value)}
                  disabled={isLoadingLookups}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] cursor-pointer bg-white"
                >
                  {lookups?.stores.map(store => (
                    <option key={store.id} value={store.name}>{store.name}</option>
                  )) || (
                    <>
                      <option>Main Store</option>
                      <option>Apex Pharmacy & Cold Chain Store</option>
                      <option>OT & Critical Care Sub-Store</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">To Store</label>
                <select 
                  value={toStore}
                  onChange={(e) => setToStore(e.target.value)}
                  disabled={isLoadingLookups}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] cursor-pointer bg-white"
                >
                  {lookups?.stores.map(store => (
                    <option key={store.id} value={store.name}>{store.name}</option>
                  )) || (
                    <>
                      <option>Apex Pharmacy & Cold Chain Store</option>
                      <option>ICU Sub-Store & Emergency Stock</option>
                      <option>Main Store</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div className="pt-1">
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Add Formulary Items</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  value={itemSearchTerm}
                  onChange={(e) => setItemSearchTerm(e.target.value)}
                  placeholder="Search item name or code to add..." 
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-md text-[13px] w-full focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
                />
              </div>

              {/* Suggestions dropdown */}
              {filteredSearchItems.length > 0 && (
                <div className="mt-1.5 max-h-36 overflow-y-auto border border-slate-200 rounded-lg bg-white shadow-sm divide-y divide-slate-100">
                  {filteredSearchItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleAddItem(item)}
                      className="p-2.5 px-3 flex items-center justify-between text-[12px] hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div>
                        <span className="font-semibold text-slate-800">{item.name}</span>
                        <span className="block text-[11px] text-slate-400 font-mono">{item.item_code} · Stock: {item.stock}</span>
                      </div>
                      <span className="text-[#127670] font-semibold flex items-center gap-1">
                        <Plus size={14} /> Add
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected items list */}
            <div>
              <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Transfer Items ({selectedLines.length})
              </label>
              <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
                <div className="px-3 py-2 bg-slate-100/70 flex justify-between text-[11px] font-semibold text-slate-500 uppercase">
                  <span>Item & Stock</span>
                  <span>Qty to Transfer</span>
                </div>
                {selectedLines.length > 0 ? (
                  selectedLines.map(line => (
                    <div key={line.itemId} className="p-3 flex items-center justify-between bg-white gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-slate-800 truncate">{line.itemName}</p>
                        <p className="text-[11px] text-slate-400 font-mono">Available: {line.stock} {line.uom}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          min={1}
                          max={line.stock > 0 ? line.stock : 9999}
                          value={line.quantity}
                          onChange={(e) => handleQtyChange(line.itemId, parseInt(e.target.value) || 1)}
                          className="w-16 border border-slate-200 rounded px-2 py-1 text-[13px] text-right focus:outline-none focus:border-[#127670]" 
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(line.itemId)}
                          className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-400 text-[12px]">
                    No items selected. Search and add items above.
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Transfer Notes (Optional)</label>
              <textarea 
                rows={2} 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] resize-none"
                placeholder="Reason for transfer or handling remarks..."
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
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-md text-[13px] font-semibold hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit"
              form="transfer-form"
              disabled={isSubmitting || selectedLines.length === 0}
              className="flex-1 py-2.5 bg-[#125F5C] text-white rounded-md text-[13px] font-semibold hover:bg-[#0f4d4a] shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Initiating...
                </>
              ) : (
                <>
                  <ArrowRightLeft size={16} /> Initiate Transfer
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
