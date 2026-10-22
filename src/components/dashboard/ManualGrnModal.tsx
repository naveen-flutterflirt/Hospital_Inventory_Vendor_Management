'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, FileText, CheckCircle, Loader2 } from 'lucide-react';
import { api, GrnLookupsResponse } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

interface ManualGrnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ItemLine {
  itemId?: number;
  itemCode: string;
  itemName: string;
  batchNo: string;
  expiryDate: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitPrice: number;
  uom: string;
}

export default function ManualGrnModal({ isOpen, onClose, onSuccess }: ManualGrnModalProps) {
  const { toast, showConfirm } = useToast();
  const [lookups, setLookups] = useState<GrnLookupsResponse | null>(null);
  const [loadingLookups, setLoadingLookups] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form state
  const [vendorId, setVendorId] = useState<number>(1);
  const [poRef, setPoRef] = useState<string>('PO-24-1205');
  const [invoiceNo, setInvoiceNo] = useState<string>('INV-24-9102');
  const [temperature, setTemperature] = useState<number>(4.2);
  const [inspector, setInspector] = useState<string>('Chief Pharmacist QC');
  const [shortageNotes, setShortageNotes] = useState<string>('Full order received');

  const [items, setItems] = useState<ItemLine[]>([
    {
      itemId: 1,
      itemCode: 'DRG-00412',
      itemName: 'Inj. Ceftriaxone 1 g',
      batchNo: 'CTX-4821',
      expiryDate: '12/2027',
      orderedQuantity: 200,
      receivedQuantity: 200,
      unitPrice: 38.4,
      uom: 'vials',
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
      const res = await api.grn.getLookups();
      if (res.success && res.data) {
        setLookups(res.data);
        if (res.data.vendors.length > 0) {
          setVendorId(res.data.vendors[0].id);
        }
        if (res.data.purchaseOrders.length > 0) {
          setPoRef(res.data.purchaseOrders[0].po_number);
        }
      }
    } catch (err) {
      console.error('Failed to load lookups:', err);
    } finally {
      setLoadingLookups(false);
    }
  };

  const handleAddItem = () => {
    const newItem: ItemLine = {
      itemCode: 'DRG-00105',
      itemName: 'Inj. Meropenem 1 g',
      batchNo: `MRP-${Math.floor(1000 + Math.random() * 9000)}`,
      expiryDate: '08/2027',
      orderedQuantity: 100,
      receivedQuantity: 100,
      unitPrice: 185.0,
      uom: 'vials',
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ItemLine, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSelectPredefinedItem = (index: number, itemId: number) => {
    if (!lookups) return;
    const found = lookups.items.find((it) => it.id === itemId);
    if (found) {
      const updated = [...items];
      updated[index] = {
        ...updated[index],
        itemId: found.id,
        itemCode: found.item_code,
        itemName: found.name,
        uom: found.uom,
        unitPrice: found.unit_price,
      };
      setItems(updated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const totalUnits = items.reduce((sum, it) => sum + (Number(it.receivedQuantity) || 0), 0);
    const confirmed = await showConfirm({
      title: 'Log Inbound Delivery (GRN)',
      message: `Register delivery of ${totalUnits} units under PO ${poRef} (Invoice: ${invoiceNo}) into hospital quarantine holding?`,
      confirmText: 'Register GRN',
      cancelText: 'Cancel',
      type: 'info',
    });
    if (!confirmed) return;

    setSubmitting(true);

    try {
      const res = await api.grn.createGrn({
        vendorId,
        poRef,
        invoiceNo,
        temperatureCelsius: Number(temperature),
        inspector,
        shortageNotes,
        items,
      });

      if (res.success) {
        toast.success("Goods Receipt Note created successfully!", "GRN Created");
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(res.message || 'Failed to create goods receipt note', 'GRN Error');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error saving delivery note', 'GRN Error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileText size={18} className="text-[#127670]" /> Manual Goods Receipt Entry (GRN)
            </h2>
            <p className="text-[13px] text-slate-500">Record physical delivery when barcode is unscannable</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1.5 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Top Row: Vendor & PO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Vendor / Supplier
              </label>
              <select
                value={vendorId}
                onChange={(e) => setVendorId(Number(e.target.value))}
                disabled={loadingLookups}
                className="w-full text-[13px] border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#125F5C]/20 cursor-pointer disabled:opacity-50"
              >
                {lookups?.vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.vendor_code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                PO Reference
              </label>
              <input
                type="text"
                value={poRef}
                onChange={(e) => setPoRef(e.target.value)}
                required
                placeholder="e.g. PO-24-1205"
                className="w-full text-[13px] border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#125F5C]/20 font-mono"
              />
            </div>
          </div>

          {/* Second Row: Invoice, Temperature, Inspector */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Vendor Invoice No.
              </label>
              <input
                type="text"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                placeholder="e.g. INV-24-9092"
                className="w-full text-[13px] border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#125F5C]/20 font-mono"
              />
            </div>

            <div>
              <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Cold Chain (°C)
              </label>
              <input
                type="number"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full text-[13px] border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#125F5C]/20"
              />
            </div>

            <div>
              <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Assigned Inspector
              </label>
              <input
                type="text"
                value={inspector}
                onChange={(e) => setInspector(e.target.value)}
                className="w-full text-[13px] border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#125F5C]/20"
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider">
                Consignment Items ({items.length})
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-[12px] font-semibold text-[#127670] hover:text-[#0f4d4a] flex items-center gap-1 cursor-pointer bg-[#1EB4A1]/10 px-2.5 py-1 rounded-md"
              >
                <Plus size={14} /> Add Line Item
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-[12px] border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-2">Batch #</th>
                    <th className="py-2.5 px-2">Expiry</th>
                    <th className="py-2.5 px-2 text-right">Qty</th>
                    <th className="py-2.5 px-2 text-right">Rate</th>
                    <th className="py-2.5 px-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3">
                        {lookups?.items && lookups.items.length > 0 ? (
                          <select
                            value={item.itemId || ''}
                            onChange={(e) => handleSelectPredefinedItem(idx, Number(e.target.value))}
                            className="w-full text-[12px] border border-slate-200 rounded px-2 py-1 bg-white mb-1"
                          >
                            <option value="">Select from catalog...</option>
                            {lookups.items.map((it) => (
                              <option key={it.id} value={it.id}>
                                {it.name} ({it.item_code})
                              </option>
                            ))}
                          </select>
                        ) : null}
                        <input
                          type="text"
                          value={item.itemName}
                          onChange={(e) => handleItemChange(idx, 'itemName', e.target.value)}
                          placeholder="Item Name"
                          className="w-full text-[12px] border border-slate-200 rounded px-2 py-1 bg-white"
                          required
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={item.batchNo}
                          onChange={(e) => handleItemChange(idx, 'batchNo', e.target.value)}
                          placeholder="Batch"
                          className="w-24 text-[12px] border border-slate-200 rounded px-2 py-1 font-mono bg-white"
                          required
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={item.expiryDate}
                          onChange={(e) => handleItemChange(idx, 'expiryDate', e.target.value)}
                          placeholder="MM/YYYY"
                          className="w-20 text-[12px] border border-slate-200 rounded px-2 py-1 bg-white"
                          required
                        />
                      </td>
                      <td className="py-2 px-2 text-right">
                        <input
                          type="number"
                          value={item.receivedQuantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            handleItemChange(idx, 'receivedQuantity', val);
                            handleItemChange(idx, 'orderedQuantity', val);
                          }}
                          className="w-20 text-[12px] border border-slate-200 rounded px-2 py-1 text-right bg-white"
                          required
                        />
                      </td>
                      <td className="py-2 px-2 text-right">
                        <input
                          type="number"
                          step="0.1"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-20 text-[12px] border border-slate-200 rounded px-2 py-1 text-right font-mono bg-white"
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length <= 1}
                          className="text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer p-1"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Shortage & Notes */}
          <div>
            <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
              Shortage / Delivery Notes
            </label>
            <input
              type="text"
              value={shortageNotes}
              onChange={(e) => setShortageNotes(e.target.value)}
              placeholder="e.g. Full order received without discrepancies"
              className="w-full text-[13px] border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#125F5C]/20"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-[13px] font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#125F5C] text-white rounded-lg text-[13px] font-semibold hover:bg-[#0f4d4a] transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Recording Delivery...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  <span>Save Goods Receipt Note</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
