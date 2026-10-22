'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Trash2, ShoppingCart, Calendar, Building2, 
  CreditCard, MapPin, FileText, CheckCircle2, AlertCircle, Loader2 
} from 'lucide-react';
import { api, PoLookupsResponse } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

interface CreatePoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPoNumber: string) => void;
}

interface FormItem {
  itemId?: number;
  itemCode: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
  uom: string;
}

export default function CreatePoModal({ isOpen, onClose, onSuccess }: CreatePoModalProps) {
  const { showConfirm } = useToast();
  const [lookups, setLookups] = useState<PoLookupsResponse | null>(null);
  const [loadingLookups, setLoadingLookups] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [vendorId, setVendorId] = useState<number | ''>('');
  const [poType, setPoType] = useState<string>('Regular PO');
  const [paymentTerms, setPaymentTerms] = useState<string>('Net 30');
  const [dueDate, setDueDate] = useState<string>('In 7 days');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>('');
  const [shippingAddress, setShippingAddress] = useState<string>(
    'Central Receiving Dock, Apex Super Specialty Hospital, Main Campus'
  );
  const [billingAddress, setBillingAddress] = useState<string>(
    'Accounts Dept, Apex Super Specialty Hospital, Main Campus'
  );
  const [notes, setNotes] = useState<string>('');

  // Items list
  const [items, setItems] = useState<FormItem[]>([
    {
      itemCode: 'MED-CIP-500',
      itemName: 'Ciprofloxacin 500mg Tablets',
      quantity: 50,
      unitPrice: 140,
      taxPercent: 12,
      uom: 'Boxes',
    },
  ]);

  useEffect(() => {
    if (isOpen) {
      loadLookups();
      // Calculate a default expected delivery date (7 days from now)
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setExpectedDeliveryDate(d.toISOString().split('T')[0]);
    } else {
      setErrorMsg(null);
    }
  }, [isOpen]);

  const loadLookups = async () => {
    setLoadingLookups(true);
    try {
      const res = await api.purchaseOrders.getLookups();
      if (res.success && res.data) {
        setLookups(res.data);
        if (res.data.vendors.length > 0 && !vendorId) {
          setVendorId(res.data.vendors[0].id);
          if (res.data.vendors[0].payment_terms) {
            setPaymentTerms(res.data.vendors[0].payment_terms);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load PO lookups:', err);
      setErrorMsg('Failed to fetch lookup catalog from database.');
    } finally {
      setLoadingLookups(false);
    }
  };

  const handleVendorChange = (id: number) => {
    setVendorId(id);
    const selected = lookups?.vendors.find((v) => v.id === id);
    if (selected?.payment_terms) {
      setPaymentTerms(selected.payment_terms);
    }
  };

  const handleSelectItemFromCatalog = (index: number, itemId: number) => {
    const it = lookups?.items.find((x) => x.id === itemId);
    if (!it) return;

    const updated = [...items];
    updated[index] = {
      ...updated[index],
      itemId: it.id,
      itemCode: it.item_code,
      itemName: it.name,
      unitPrice: Number(it.unit_price) || updated[index].unitPrice,
      uom: it.uom || updated[index].uom,
    };
    setItems(updated);
  };

  const handleAddItem = () => {
    // If catalog items exist, pick the first one not already added, or default
    const firstCatalog = lookups?.items?.[items.length % (lookups?.items?.length || 1)];
    setItems([
      ...items,
      {
        itemId: firstCatalog?.id,
        itemCode: firstCatalog?.item_code || 'ITEM-NEW',
        itemName: firstCatalog?.name || 'Medical Consumables',
        quantity: 20,
        unitPrice: Number(firstCatalog?.unit_price) || 250,
        taxPercent: 12,
        uom: firstCatalog?.uom || 'units',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      setErrorMsg('A Purchase Order must have at least one line item.');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemFieldChange = (index: number, field: keyof FormItem, val: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };
    setItems(updated);
  };

  const calculateSubtotal = () => {
    return items.reduce((acc, it) => acc + (it.quantity * it.unitPrice), 0);
  };

  const calculateTax = () => {
    return items.reduce((acc, it) => acc + (it.quantity * it.unitPrice * (it.taxPercent / 100)), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId) {
      setErrorMsg('Please select a vendor.');
      return;
    }

    if (items.length === 0) {
      setErrorMsg('Please add at least one line item.');
      return;
    }

    for (const it of items) {
      if (!it.itemCode || !it.itemName) {
        setErrorMsg('All line items must have a code and name.');
        return;
      }
      if (it.quantity <= 0) {
        setErrorMsg('Quantity must be greater than 0.');
        return;
      }
      if (it.unitPrice < 0) {
        setErrorMsg('Unit price cannot be negative.');
        return;
      }
    }

    const selectedVendor = lookups?.vendors.find(v => v.id === Number(vendorId));
    const grandTotal = calculateSubtotal() + calculateTax();
    const confirmed = await showConfirm({
      title: 'Issue Purchase Order',
      message: `Create and issue official purchase order to ${selectedVendor?.name || 'the selected vendor'} for ₹${grandTotal.toLocaleString('en-IN')} (${items.length} line items)?`,
      confirmText: 'Generate Order',
      cancelText: 'Cancel',
      type: 'success',
    });
    if (!confirmed) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await api.purchaseOrders.createPurchaseOrder({
        vendorId: Number(vendorId),
        poType,
        paymentTerms,
        dueDate,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        shippingAddress,
        billingAddress,
        notes,
        items,
      });

      if (res.success && res.data) {
        onSuccess(res.data.poNumber);
        onClose();
      } else {
        setErrorMsg(res.message || 'Failed to create purchase order.');
      }
    } catch (err: any) {
      console.error('Failed to create PO:', err);
      setErrorMsg(err.message || 'Network error occurred while saving PO.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const subtotal = calculateSubtotal();
  const tax = calculateTax();
  const grandTotal = subtotal + tax;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#127670]/10 flex items-center justify-center text-[#127670]">
              <ShoppingCart size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Create Purchase Order</h2>
              <p className="text-[12px] text-slate-500 mt-0.5">Generate enterprise procurement contract and manifest</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-lg text-xs font-semibold bg-red-50 text-red-800 border border-red-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Form Body */}
        <form id="create-po-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {loadingLookups ? (
            <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
              <Loader2 size={24} className="animate-spin text-[#127670]" />
              <span className="text-xs font-medium">Loading catalog masters...</span>
            </div>
          ) : (
            <>
              {/* Top Controls Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
                {/* Vendor Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Building2 size={13} className="text-[#127670]" /> Vendor *
                  </label>
                  <select
                    value={vendorId}
                    onChange={(e) => handleVendorChange(Number(e.target.value))}
                    required
                    className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] cursor-pointer"
                  >
                    <option value="" disabled>Select Vendor</option>
                    {lookups?.vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.vendor_code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* PO Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <FileText size={13} className="text-[#127670]" /> PO Type *
                  </label>
                  <select
                    value={poType}
                    onChange={(e) => setPoType(e.target.value)}
                    required
                    className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] cursor-pointer"
                  >
                    {(lookups?.types || ['Regular PO', 'Rate-contract PO', 'Blanket PO', 'Consignment', 'Capex PO', 'Emergency purchase']).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Payment Terms */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <CreditCard size={13} className="text-[#127670]" /> Payment Terms
                  </label>
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="e.g. Net 30, Advance 50%"
                    className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
                  />
                </div>

                {/* Due Date SLA */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Calendar size={13} className="text-[#127670]" /> Due SLA
                  </label>
                  <input
                    type="text"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    placeholder="e.g. In 7 days, In 14 days"
                    className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
                  />
                </div>

                {/* Expected Delivery Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                    className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] cursor-pointer"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Order Notes / Tender Ref
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Rate contract Q3-FY26"
                    className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
                  />
                </div>
              </div>

              {/* Delivery & Billing Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <MapPin size={12} className="text-slate-400" /> Shipping Dock Address
                  </label>
                  <textarea
                    rows={2}
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Building2 size={12} className="text-slate-400" /> Billing Address
                  </label>
                  <textarea
                    rows={2}
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] resize-none"
                  />
                </div>
              </div>

              {/* Line Items Section */}
              <div className="border border-slate-200 rounded-xl overflow-hidden pt-1">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Line Items Manifest ({items.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1 text-xs font-semibold text-[#127670] hover:text-[#0c4240] bg-white border border-[#127670]/30 hover:border-[#127670] px-3 py-1 rounded-md transition-colors shadow-2xs cursor-pointer"
                  >
                    <Plus size={14} /> Add Item
                  </button>
                </div>

                <div className="overflow-x-auto p-2">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-500 font-semibold border-b border-slate-200/80">
                        <th className="py-2 px-2.5">Catalog Quick-Pick</th>
                        <th className="py-2 px-2.5">Item Code</th>
                        <th className="py-2 px-2.5">Item Name</th>
                        <th className="py-2 px-2.5 w-20">Qty</th>
                        <th className="py-2 px-2.5 w-20">UOM</th>
                        <th className="py-2 px-2.5 w-28 text-right">Unit Rate (₹)</th>
                        <th className="py-2 px-2.5 w-20 text-right">Tax (%)</th>
                        <th className="py-2 px-2.5 w-28 text-right">Total (₹)</th>
                        <th className="py-2 px-2 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((it, idx) => {
                        const lineTax = (it.unitPrice * it.taxPercent) / 100;
                        const lineTot = it.quantity * (it.unitPrice + lineTax);

                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            {/* Catalog selector */}
                            <td className="py-2 px-2.5">
                              <select
                                onChange={(e) => handleSelectItemFromCatalog(idx, Number(e.target.value))}
                                value={it.itemId || ''}
                                className="w-full text-[11px] font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded px-2 py-1.5 focus:outline-none cursor-pointer"
                              >
                                <option value="">-- Catalog Item --</option>
                                {lookups?.items.map((cat) => (
                                  <option key={cat.id} value={cat.id}>
                                    {cat.name} ({cat.item_code})
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Item Code */}
                            <td className="py-2 px-2.5">
                              <input
                                type="text"
                                value={it.itemCode}
                                onChange={(e) => handleItemFieldChange(idx, 'itemCode', e.target.value)}
                                required
                                className="w-full font-mono text-xs text-slate-800 border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-[#127670]"
                              />
                            </td>

                            {/* Item Name */}
                            <td className="py-2 px-2.5">
                              <input
                                type="text"
                                value={it.itemName}
                                onChange={(e) => handleItemFieldChange(idx, 'itemName', e.target.value)}
                                required
                                className="w-full text-xs text-slate-800 border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-[#127670]"
                              />
                            </td>

                            {/* Quantity */}
                            <td className="py-2 px-2.5">
                              <input
                                type="number"
                                min={1}
                                value={it.quantity}
                                onChange={(e) => handleItemFieldChange(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                                required
                                className="w-full text-xs text-right font-semibold text-slate-800 border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-[#127670]"
                              />
                            </td>

                            {/* UOM */}
                            <td className="py-2 px-2.5">
                              <input
                                type="text"
                                value={it.uom}
                                onChange={(e) => handleItemFieldChange(idx, 'uom', e.target.value)}
                                className="w-full text-xs text-slate-600 border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-[#127670]"
                              />
                            </td>

                            {/* Unit Price */}
                            <td className="py-2 px-2.5">
                              <input
                                type="number"
                                min={0}
                                step={0.5}
                                value={it.unitPrice}
                                onChange={(e) => handleItemFieldChange(idx, 'unitPrice', Math.max(0, parseFloat(e.target.value) || 0))}
                                required
                                className="w-full text-xs text-right text-slate-800 border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-[#127670]"
                              />
                            </td>

                            {/* Tax % */}
                            <td className="py-2 px-2.5">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={it.taxPercent}
                                onChange={(e) => handleItemFieldChange(idx, 'taxPercent', Math.max(0, parseFloat(e.target.value) || 0))}
                                className="w-full text-xs text-right text-slate-600 border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-[#127670]"
                              />
                            </td>

                            {/* Line Total */}
                            <td className="py-2 px-2.5 text-right font-semibold text-slate-900">
                              ₹{lineTot.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>

                            {/* Delete line */}
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                title="Remove line item"
                                className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Calculation summary */}
                <div className="bg-slate-50/80 p-3.5 border-t border-slate-200 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-3 text-xs">
                  <div className="text-slate-500">
                    All items will be registered under contract manifest upon generation.
                  </div>
                  <div className="space-y-1 text-right w-64">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal:</span>
                      <span className="font-medium text-slate-800">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Total GST:</span>
                      <span className="font-medium text-slate-800">₹{tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-1 flex justify-between font-bold text-slate-900 text-sm">
                      <span>Estimated Value:</span>
                      <span className="text-[#127670] font-extrabold">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </form>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-po-form"
            disabled={submitting || loadingLookups}
            className="flex items-center gap-2 bg-[#125F5C] text-white px-5 py-2 rounded-lg text-xs font-bold hover:bg-[#0c4240] transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Generating Order...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={15} />
                <span>Create Purchase Order</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
