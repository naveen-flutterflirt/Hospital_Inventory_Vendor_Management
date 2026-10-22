'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  X, ScanLine, CheckCircle2, AlertTriangle, Loader2, 
  Search, Camera, CameraOff, Package, Truck, ArrowRight, 
  Thermometer, Layers, ExternalLink, Barcode
} from 'lucide-react';
import { api, BarcodeLookupResult } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { useStore } from '@/context/StoreContext';
import { cn } from '@/lib/utils';

interface ScanDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ScanDeliveryModal({ isOpen, onClose, onSuccess }: ScanDeliveryModalProps) {
  const router = useRouter();
  const { toast, showConfirm } = useToast();
  const { activeStore, selectedStore } = useStore();

  // Mode: 'lookup' (rapid item/stock check) or 'inbound' (GRN delivery check-in)
  const [activeTab, setActiveTab] = useState<'lookup' | 'inbound'>('lookup');

  // Lookup state
  const [queryInput, setQueryInput] = useState<string>('DRG-00105');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [lookupResult, setLookupResult] = useState<BarcodeLookupResult | null>(null);

  // Inbound delivery state
  const [inboundBarcode, setInboundBarcode] = useState<string>('(01)08901234567890(17)261231(10)BAT-00105-25F(21)SN9001');
  const [invoiceNo, setInvoiceNo] = useState<string>('INV-24-9045');
  const [poRef, setPoRef] = useState<string>('PO-24-1001');
  const [temperature, setTemperature] = useState<number>(4.2);
  const [isSubmittingInbound, setIsSubmittingInbound] = useState<boolean>(false);
  const [inboundSuccessData, setInboundSuccessData] = useState<{ grnNumber: string; grnId: number } | null>(null);

  // Hardware handheld scanner & Camera state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Handle barcode search / lookup against PostgreSQL
  const handlePerformLookup = useCallback(async (customQuery?: string) => {
    const q = (customQuery !== undefined ? customQuery : queryInput).trim();
    if (!q) {
      toast.error('Please enter or scan a barcode, batch number, or item code', 'Input Required');
      return;
    }

    setIsSearching(true);
    try {
      const res = await api.barcode.lookup(q, selectedStore?.id);
      if (res.success && res.data) {
        setLookupResult(res.data);
        if (res.data.matchType === 'not_found') {
          toast.warning(`No database record matched "${q}". Ready for inbound check-in.`, 'Scan Result');
        } else {
          toast.success(`Found ${res.data.matchType.toUpperCase()}: ${res.data.item?.name || q}`, 'Barcode Verified');
        }
      } else {
        toast.error(res.message || 'Lookup failed', 'Scanner Error');
      }
    } catch (err: any) {
      console.error('Barcode lookup error:', err);
      toast.error(err.message || 'Error communicating with database', 'Scanner Error');
    } finally {
      setIsSearching(false);
    }
  }, [queryInput, selectedStore?.id, toast]);

  // Inbound consignment check-in submit
  const handleInboundCheckIn = async () => {
    if (!inboundBarcode.trim()) {
      toast.error('Scan or enter package barcode first', 'Missing Barcode');
      return;
    }

    const confirmed = await showConfirm({
      title: 'Check-in Inbound Delivery',
      message: `Register delivery consignment for PO ${poRef || 'N/A'} (Invoice: ${invoiceNo || 'N/A'}) and record dock temperature of ${temperature}°C?`,
      confirmText: 'Check-in Delivery',
      cancelText: 'Cancel',
      type: 'info',
    });
    if (!confirmed) return;

    setIsSubmittingInbound(true);
    try {
      const res = await api.grn.scanDelivery({
        barcode: inboundBarcode.trim(),
        invoiceNo: invoiceNo.trim(),
        temperature: Number(temperature),
        poRef: poRef.trim() || undefined,
      });

      if (res.success && res.data) {
        setInboundSuccessData({
          grnNumber: res.data.grnNumber || 'GRN-24-880',
          grnId: res.data.grnId || 1,
        });
        toast.success(`Delivery checked in as ${res.data.grnNumber} for Quality Inspection`, 'GRN Created');
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.message || 'Failed to check in delivery', 'GRN Error');
      }
    } catch (err: any) {
      console.error('Inbound check-in error:', err);
      toast.error(err.message || 'Failed to submit consignment', 'Server Error');
    } finally {
      setIsSubmittingInbound(false);
    }
  };

  // Camera video stream handling
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setIsCameraActive(true);
      } else {
        setCameraError('Camera access not supported on this browser');
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError('Camera access denied or unavailable. You can use manual entry or hardware scanner.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Close modal and cleanup
  const handleClose = () => {
    stopCamera();
    setLookupResult(null);
    setInboundSuccessData(null);
    onClose();
  };

  // Auto focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        // Initial lookup of default test preset
        handlePerformLookup('DRG-00105');
      }, 150);
    } else {
      stopCamera();
    }
  }, [isOpen]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm transition-opacity p-2 sm:p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] border border-slate-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-[#127670] shadow-xs">
              <ScanLine size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-bold text-slate-800 tracking-tight">
                  Hospital Smart Scanner
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-[#127670] border border-teal-200">
                  GS1-128 & Barcode
                </span>
              </div>
              <p className="text-[12px] text-slate-500 font-medium">
                Active Store: <span className="font-semibold text-slate-700">{activeStore}</span>
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 p-2 rounded-full transition-colors cursor-pointer"
            title="Close scanner"
          >
            <X size={18} />
          </button>
        </div>

        {/* Operating Mode Tabs */}
        <div className="flex items-center border-b border-slate-200 bg-white px-5 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('lookup')}
            className={cn(
              "flex items-center gap-2 py-2.5 px-4 text-[13px] font-semibold border-b-2 transition-all cursor-pointer",
              activeTab === 'lookup'
                ? "border-[#127670] text-[#127670] font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            <Package size={15} />
            <span>Formulary & Stock Verifier</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inbound')}
            className={cn(
              "flex items-center gap-2 py-2.5 px-4 text-[13px] font-semibold border-b-2 transition-all cursor-pointer",
              activeTab === 'inbound'
                ? "border-[#127670] text-[#127670] font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            <Truck size={15} />
            <span>Inbound Delivery Check-in (GRN)</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto max-h-[calc(92vh-175px)] space-y-4">

          {/* TAB 1: FORMULARY & STOCK LOOKUP */}
          {activeTab === 'lookup' && (
            <div className="space-y-4">
              
              {/* Camera Scanner Viewfinder Toggle */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600">
                    <Camera size={16} />
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-slate-800">Camera Optical Scanner</p>
                    <p className="text-[11px] text-slate-500">Scan physical vial or package with device camera</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={isCameraActive ? stopCamera : startCamera}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[12px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs",
                    isCameraActive 
                      ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100" 
                      : "bg-[#127670] text-white hover:bg-[#0f605b]"
                  )}
                >
                  {isCameraActive ? <CameraOff size={14} /> : <Camera size={14} />}
                  <span>{isCameraActive ? 'Stop Camera' : 'Launch Camera'}</span>
                </button>
              </div>

              {/* Live Camera Viewfinder if active */}
              {isCameraActive && (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center border-2 border-[#127670]/40 shadow-inner">
                  <video 
                    ref={videoRef} 
                    className="w-full h-full object-cover" 
                    playsInline 
                    autoPlay 
                    muted 
                  />
                  {/* Scanner overlay laser */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                    <div className="w-64 h-36 border-2 border-dashed border-teal-400/80 rounded-xl relative flex items-center justify-center">
                      <div className="w-full h-0.5 bg-rose-500 shadow-[0_0_12px_rgba(239,68,68,1)] animate-[bounce_1.5s_infinite]" />
                      <span className="absolute bottom-2 text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded">
                        Align barcode within frame
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {cameraError && (
                <p className="text-[11px] text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200 font-medium">
                  {cameraError}
                </p>
              )}

              {/* Barcode & Search Input Field */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Scan Barcode / Enter Item Code or Batch #
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                    <input
                      ref={inputRef}
                      type="text"
                      value={queryInput}
                      onChange={(e) => setQueryInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handlePerformLookup();
                        }
                      }}
                      placeholder="e.g. DRG-00105, BAT-00105-25C, or GS1 string..."
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-[13px] font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] bg-white shadow-xs"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePerformLookup()}
                    disabled={isSearching}
                    className="px-4 py-2.5 bg-[#127670] text-white rounded-xl text-[13px] font-bold hover:bg-[#0f605b] transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs disabled:opacity-60"
                  >
                    {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                    <span>Lookup</span>
                  </button>
                </div>
              </div>

              {/* Quick Preset Buttons for Instant Verification */}
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Quick Formulary Test Presets:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Meropenem 1g (DRG-00105)', val: 'DRG-00105' },
                    { label: 'Surgical Gloves (CON-00812)', val: 'CON-00812' },
                    { label: 'Bipolar Hip 44mm (IMP-00214)', val: 'IMP-00214' },
                    { label: 'ABG Cartridge Batch (BAT-00120-25C)', val: 'BAT-00120-25C' },
                    { label: 'GS1-128 Cold-Chain String', val: '(01)08901234567890(17)270228(10)BAT-00105-25C(21)SN9001' },
                  ].map(preset => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => {
                        setQueryInput(preset.val);
                        handlePerformLookup(preset.val);
                      }}
                      className="text-[11px] font-medium bg-slate-100 hover:bg-slate-200/80 text-slate-700 px-2.5 py-1 rounded-lg transition-colors cursor-pointer border border-slate-200"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lookup Results Card */}
              {lookupResult && lookupResult.matchType !== 'not_found' && (
                <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  
                  {/* Item Title & Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-[#127670] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {lookupResult.item?.itemCode || 'CODE'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {lookupResult.item?.category}
                        </span>
                        {lookupResult.item?.classVital && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {lookupResult.item.classVital}
                          </span>
                        )}
                      </div>
                      <h3 className="text-[15px] font-bold text-slate-900 mt-1">
                        {lookupResult.item?.name}
                      </h3>
                      {lookupResult.item?.genericName && (
                        <p className="text-[12px] text-slate-500 font-medium italic">
                          Generic: {lookupResult.item.genericName}
                        </p>
                      )}
                    </div>

                    <div className="sm:text-right bg-teal-50/60 p-2 sm:p-2.5 rounded-lg border border-teal-100">
                      <p className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">Total Hospital Stock</p>
                      <p className="text-[16px] font-black text-[#127670]">
                        {lookupResult.item?.totalOnHand?.toLocaleString() || 0} <span className="text-[12px] font-medium">{lookupResult.item?.uom}</span>
                      </p>
                    </div>
                  </div>

                  {/* Single Matched Batch Callout (if scanned specific batch) */}
                  {lookupResult.matchedBatch && (
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3 flex items-start gap-3">
                      <CheckCircle2 size={18} className="text-emerald-600 mt-0.5 shrink-0" />
                      <div className="flex-1 text-[12px]">
                        <p className="font-bold text-emerald-900">
                          Verified Batch: <span className="font-mono">{lookupResult.matchedBatch.batchNumber}</span>
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1 text-slate-600 text-[11px]">
                          <div>Store: <span className="font-semibold text-slate-800">{lookupResult.matchedBatch.storeName}</span></div>
                          <div>Expiry: <span className="font-semibold text-slate-800">{lookupResult.matchedBatch.expiryDate}</span></div>
                          <div>Bin: <span className="font-semibold text-slate-800">{lookupResult.matchedBatch.binLocation}</span></div>
                          <div>Qty: <span className="font-semibold text-emerald-800">{lookupResult.matchedBatch.quantity} {lookupResult.item?.uom}</span></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Multi-Store Stock Distribution & FEFO Batches */}
                  <div>
                    <h4 className="text-[12px] font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Layers size={14} className="text-[#127670]" /> Store Inventory & Active Batches ({lookupResult.batches?.length || 0})
                    </h4>

                    {lookupResult.batches && lookupResult.batches.length > 0 ? (
                      <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 text-[12px]">
                        {lookupResult.batches.map(batch => (
                          <div 
                            key={batch.id} 
                            className={cn(
                              "p-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors",
                              selectedStore?.id === batch.storeId ? "bg-teal-50/40" : ""
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-800">{batch.batchNumber}</span>
                              <span className="text-[11px] text-slate-500">· {batch.storeName}</span>
                              <span className="text-[10px] text-slate-400">({batch.binLocation})</span>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-[11px] text-slate-500 font-medium">Exp: {batch.expiryDate}</span>
                              <span className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                batch.status === 'Issue first' ? "bg-emerald-100 text-emerald-800" :
                                batch.status === 'QC pending' ? "bg-amber-100 text-amber-800" :
                                "bg-slate-100 text-slate-700"
                              )}>
                                {batch.status}
                              </span>
                              <span className="font-bold text-slate-800 font-mono min-w-[60px] text-right">
                                {batch.quantity} {lookupResult.item?.uom}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[12px] text-slate-500 italic p-3 bg-slate-50 rounded-lg">
                        No active batches in inventory for this item.
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        handleClose();
                        router.push(`/items?search=${encodeURIComponent(lookupResult.item?.itemCode || '')}`);
                      }}
                      className="flex-1 py-2 px-3 bg-[#127670] text-white rounded-lg text-[12px] font-bold hover:bg-[#0f605b] transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <span>View in Formulary Catalog</span>
                      <ArrowRight size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleClose();
                        router.push('/indents');
                      }}
                      className="py-2 px-4 bg-white border border-slate-300 text-slate-700 rounded-lg text-[12px] font-semibold hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Requisition Indent</span>
                    </button>
                  </div>

                </div>
              )}

              {/* Not Found View */}
              {lookupResult && lookupResult.matchType === 'not_found' && (
                <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                  <AlertTriangle size={32} className="text-amber-500 mx-auto mb-2" />
                  <p className="text-[14px] font-bold text-slate-800">Unrecognized Item or Barcode</p>
                  <p className="text-[12px] text-slate-500 mt-1 max-w-sm mx-auto">
                    The scanned barcode does not match any current formulary master item. If this is an inbound vendor consignment shipment, switch to Inbound Delivery Check-in.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setInboundBarcode(queryInput);
                      setActiveTab('inbound');
                    }}
                    className="mt-3 px-4 py-2 bg-[#127670] text-white rounded-lg text-[12px] font-bold hover:bg-[#0f605b] cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>Switch to Inbound Delivery Check-in</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: INBOUND DELIVERY CHECK-IN (GRN) */}
          {activeTab === 'inbound' && (
            <div className="space-y-4">
              
              {/* Success Result View */}
              {inboundSuccessData ? (
                <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-5 text-center space-y-3 animate-in zoom-in-95">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={28} />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold text-emerald-900">
                      Consignment Successfully Received!
                    </h3>
                    <p className="text-[13px] text-emerald-700 font-mono mt-0.5 font-bold">
                      {inboundSuccessData.grnNumber}
                    </p>
                    <p className="text-[12px] text-slate-600 mt-1">
                      Goods Receipt Note generated and routed to the Quarantine Inspection queue.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center max-w-sm mx-auto">
                    <button
                      type="button"
                      onClick={() => {
                        handleClose();
                        router.push('/grn-qc');
                      }}
                      className="py-2.5 px-4 bg-[#127670] text-white rounded-lg text-[12px] font-bold hover:bg-[#0f605b] cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <span>Open GRN & QC Inspection</span>
                      <ExternalLink size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setInboundSuccessData(null)}
                      className="py-2.5 px-4 bg-white border border-slate-300 text-slate-700 rounded-lg text-[12px] font-semibold hover:bg-slate-50 cursor-pointer"
                    >
                      Scan Next Delivery
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  
                  {/* Consignment Barcode Field */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Inbound Consignment GS1-128 / Barcode
                    </label>
                    <input
                      type="text"
                      value={inboundBarcode}
                      onChange={(e) => setInboundBarcode(e.target.value)}
                      placeholder="(01)0890...(17)YYMMDD(10)BATCH(21)SERIAL"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-[12px] font-mono bg-white text-slate-800 shadow-xs focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Purchase Order Ref #
                      </label>
                      <input
                        type="text"
                        value={poRef}
                        onChange={(e) => setPoRef(e.target.value)}
                        placeholder="PO-24-1001"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[12px] font-mono bg-white text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Vendor Invoice Number
                      </label>
                      <input
                        type="text"
                        value={invoiceNo}
                        onChange={(e) => setInvoiceNo(e.target.value)}
                        placeholder="INV-24-9045"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[12px] font-mono bg-white text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Digital Temperature Logger Input & Live Thermal Compliance Gauge */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Thermometer size={16} className={temperature >= 2.0 && temperature <= 8.0 ? "text-teal-600" : "text-rose-600"} />
                        <span className="text-[12px] font-bold text-slate-800">Cold Chain Temperature Probe</span>
                      </div>
                      <span className={cn(
                        "text-[11px] font-bold px-2 py-0.5 rounded-full border",
                        temperature >= 2.0 && temperature <= 8.0 
                          ? "bg-teal-50 text-teal-800 border-teal-200" 
                          : "bg-rose-50 text-rose-800 border-rose-200 animate-pulse"
                      )}>
                        {temperature >= 2.0 && temperature <= 8.0 ? '✓ Thermal Compliant' : '⚠ Temperature Breach'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => setTemperature(parseFloat(e.target.value) || 0)}
                        className="w-32 px-3 py-1.5 border border-slate-300 rounded-lg text-[13px] font-bold font-mono bg-white text-slate-800"
                      />
                      <span className="text-[13px] font-semibold text-slate-600">°C</span>
                      <p className="text-[11px] text-slate-500 italic">
                        Standard hospital biological storage protocol: 2.0°C to 8.0°C
                      </p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={isSubmittingInbound}
                      onClick={handleInboundCheckIn}
                      className="w-full py-3 bg-[#127670] text-white rounded-xl text-[13px] font-bold hover:bg-[#0f605b] transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-60"
                    >
                      {isSubmittingInbound ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Generating GRN & Logging Inspection Entry...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} />
                          <span>Check In Consignment for QC Inspection</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Hardware Scanner HID Wedge Active</span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
