import React, { useState, useEffect } from 'react';
import { X, Send, Search, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { api, TransferLookupsResponse } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

interface NewIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function NewIssueModal({ isOpen, onClose, onSuccess }: NewIssueModalProps) {
  const { showConfirm, toast } = useToast();
  const [issueType, setIssueType] = useState<'ward' | 'patient'>('ward');
  const [qty, setQty] = useState(2);
  const [searchTerm, setSearchTerm] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [createdIssueNumber, setCreatedIssueNumber] = useState('');

  // Lookups data
  const [lookups, setLookups] = useState<TransferLookupsResponse | null>(null);
  const [isLoadingLookups, setIsLoadingLookups] = useState(false);

  // Targets
  const [selectedWard, setSelectedWard] = useState('ICU Ward');
  const [patientSearch, setPatientSearch] = useState('Patient #8892');

  // Selected Item
  const [selectedItem, setSelectedItem] = useState<{
    id: number;
    name: string;
    code: string;
    stock: number;
    batchNo: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSuccess(false);
      setIsSubmitting(false);
      setErrorMessage('');
      setCreatedIssueNumber('');
      setIssueType('ward');
      setSelectedWard('ICU Ward');
      setPatientSearch('Patient #8892');
      setQty(2);
      setSearchTerm('');

      loadLookups();
    }
  }, [isOpen]);

  const loadLookups = async () => {
    setIsLoadingLookups(true);
    try {
      const res = await api.transfers.getLookups();
      if (res.success && res.data) {
        setLookups(res.data);
        if (res.data.wards.length > 0) {
          setSelectedWard(res.data.wards[0]);
        }
        if (res.data.items.length > 0) {
          setSelectedItem({
            id: res.data.items[0].id,
            name: res.data.items[0].name,
            code: res.data.items[0].item_code,
            stock: res.data.items[0].stock,
            batchNo: 'CTX2510D',
          });
        }
      }
    } catch (err) {
      console.error('Failed to load issue lookups:', err);
    } finally {
      setIsLoadingLookups(false);
    }
  };

  const handleSelectItem = (item: any) => {
    setSelectedItem({
      id: item.id,
      name: item.name,
      code: item.item_code,
      stock: item.stock,
      batchNo: 'CTX2510D',
    });
    setSearchTerm('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedItem) {
      setErrorMessage('Please select an item to issue');
      return;
    }

    if (qty <= 0) {
      setErrorMessage('Quantity must be at least 1');
      return;
    }

    const target = issueType === 'ward' ? selectedWard : patientSearch;
    if (!target.trim()) {
      setErrorMessage(issueType === 'ward' ? 'Please select a ward' : 'Please specify a patient');
      return;
    }

    const confirmed = await showConfirm({
      title: issueType === 'ward' ? 'Dispense to Ward' : 'Dispense to Patient',
      message: `Dispense ${qty} units of ${selectedItem.name} (Batch: ${selectedItem.batchNo}) to ${target.trim()}?`,
      confirmText: 'Dispense Stock',
      cancelText: 'Cancel',
      type: 'info',
    });
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      const res = await api.transfers.createIssue({
        issueType,
        target: target.trim(),
        fromStore: 'Apex Pharmacy & Cold Chain Store',
        items: [
          {
            itemId: selectedItem.id,
            itemCode: selectedItem.code,
            itemName: selectedItem.name,
            quantity: qty,
            batchNo: selectedItem.batchNo,
          },
        ],
      });

      if (res.success && res.data?.transfer) {
        setCreatedIssueNumber(res.data.transfer.transfer_number);
        setSuccess(true);
        toast.success(`Dispensed ${qty} units of ${selectedItem.name} to ${target}`, 'Stock Dispensed');
        if (onSuccess) {
          onSuccess();
        }

        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 2200);
      } else {
        setErrorMessage(res.message || 'Failed to issue items');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred during item issue';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Filter items matching search
  const filteredSearchItems = lookups?.items.filter(item => {
    if (!searchTerm.trim()) return false;
    const term = searchTerm.toLowerCase();
    return item.name.toLowerCase().includes(term) || item.item_code.toLowerCase().includes(term);
  }) || [];

  return (
    <div 
      className="fixed inset-0 z-[100] flex justify-end bg-slate-900/40 backdrop-blur-sm transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Send size={18} className="text-[#127670]" /> Issue Items
            </h2>
            <p className="text-[13px] text-slate-500">Fulfill ward indents or issue to patient</p>
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
            <h3 className="text-lg font-bold text-slate-800">Items Issued Successfully</h3>
            <p className="text-[14px] text-slate-600 mt-2">
              <strong className="text-[#127670]">{createdIssueNumber}</strong> generated and inventory has been deducted.
            </p>
            <p className="text-[12px] text-slate-400 mt-2">Status marked as &quot;Completed&quot; with telemetry audit trail.</p>
          </div>
        ) : (
          <form id="issue-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[13px] flex items-start gap-2 animate-in fade-in">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-2">Issue Type</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="issueType" 
                    checked={issueType === 'ward'} 
                    onChange={() => setIssueType('ward')}
                    className="accent-[#127670] cursor-pointer"
                  />
                  <span className="text-[14px] text-slate-700 font-medium">To Ward</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="issueType" 
                    checked={issueType === 'patient'} 
                    onChange={() => setIssueType('patient')}
                    className="accent-[#127670] cursor-pointer"
                  />
                  <span className="text-[14px] text-slate-700 font-medium">To Patient</span>
                </label>
              </div>
            </div>

            {issueType === 'ward' ? (
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Select Ward / Department</label>
                <select 
                  value={selectedWard}
                  onChange={(e) => setSelectedWard(e.target.value)}
                  disabled={isLoadingLookups}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] cursor-pointer bg-white"
                >
                  {lookups?.wards.map(ward => (
                    <option key={ward} value={ward}>{ward}</option>
                  )) || (
                    <>
                      <option>ICU Ward</option>
                      <option>General Ward A</option>
                      <option>Emergency Room</option>
                    </>
                  )}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Patient ID / Name</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    placeholder="Search patient ID or case..." 
                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-md text-[13px] w-full focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
                  />
                </div>
                {lookups?.patients && lookups.patients.length > 0 && (
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {lookups.patients.map(p => (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => setPatientSearch(p.id)}
                        className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                      >
                        {p.id}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="pt-1">
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Items to Issue</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Scan barcode or search formulary item..." 
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-md text-[13px] w-full focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
                />
              </div>

              {filteredSearchItems.length > 0 && (
                <div className="mt-1.5 max-h-36 overflow-y-auto border border-slate-200 rounded-lg bg-white shadow-sm divide-y divide-slate-100">
                  {filteredSearchItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectItem(item)}
                      className="p-2.5 px-3 flex items-center justify-between text-[12px] hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div>
                        <span className="font-semibold text-slate-800">{item.name}</span>
                        <span className="block text-[11px] text-slate-400 font-mono">{item.item_code} · Stock: {item.stock}</span>
                      </div>
                      <span className="text-[#127670] font-semibold">Select</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedItem && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-3 py-2 border-b border-slate-200 bg-slate-100/70 flex justify-between">
                  <span className="text-[12px] font-semibold text-slate-500 uppercase">Selected Item</span>
                  <span className="text-[12px] font-semibold text-slate-500 uppercase">Quantity</span>
                </div>
                <div className="p-3 flex items-center justify-between bg-white">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-[13px] font-semibold text-slate-800 truncate">{selectedItem.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Batch: {selectedItem.batchNo} · Available: {selectedItem.stock}
                    </p>
                  </div>
                  <input 
                    type="number" 
                    min={1}
                    max={selectedItem.stock > 0 ? selectedItem.stock : 9999}
                    value={qty} 
                    onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 border border-slate-200 rounded px-2 py-1 text-[13px] text-right focus:outline-none focus:border-[#127670]" 
                  />
                </div>
              </div>
            )}

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
              form="issue-form"
              disabled={isSubmitting || !selectedItem}
              className="flex-1 py-2.5 bg-[#125F5C] text-white rounded-md text-[13px] font-semibold hover:bg-[#0f4d4a] shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Issuing...
                </>
              ) : (
                <>
                  <Send size={16} /> Issue Items
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
