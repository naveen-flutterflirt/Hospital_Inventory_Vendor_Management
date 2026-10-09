import React, { useState } from 'react';
import { X, ScanLine, CheckCircle, AlertTriangle } from 'lucide-react';

interface ScanDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ScanDeliveryModal({ isOpen, onClose }: ScanDeliveryModalProps) {
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'success' | 'variance'>('idle');

  // Reset state when modal opens
  const handleClose = () => {
    setScanState('idle');
    onClose();
  };

  const simulateScan = () => {
    setScanState('scanning');
    
    // Simulate API delay
    setTimeout(() => {
      // 50% chance of perfect match, 50% chance of variance
      if (Math.random() > 0.5) {
        setScanState('success');
      } else {
        setScanState('variance');
      }
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-opacity p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ScanLine size={18} className="text-[#127670]" /> Scan GS1 Barcode
            </h2>
            <p className="text-[13px] text-slate-500">Capture batch, expiry, and quantity automatically</p>
          </div>
          <button 
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1.5 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          
          {scanState === 'idle' && (
            <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 border border-slate-100">
                <ScanLine size={40} className="text-slate-300" />
              </div>
              <p className="text-[14px] font-semibold text-slate-700 mb-1">Ready to scan</p>
              <p className="text-[12px] text-slate-500 mb-6 text-center px-8">Point your scanner at the GS1 barcode on the package or click below to simulate.</p>
              
              <button 
                onClick={simulateScan}
                className="bg-[#125F5C] text-white px-6 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-[#0f4d4a] transition-colors shadow-sm cursor-pointer"
              >
                Simulate Scan
              </button>
            </div>
          )}

          {scanState === 'scanning' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <ScanLine size={48} className="text-[#1EB4A1] animate-pulse" />
                <div className="absolute inset-0 border-t-2 border-[#125F5C] animate-[bounce_1.5s_infinite]" />
              </div>
              <p className="text-[14px] font-semibold text-slate-700 mt-6">Reading GS1 Data...</p>
              <p className="text-[12px] text-slate-500 mt-1">Extracting batch and expiry</p>
            </div>
          )}

          {scanState === 'success' && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-3 mb-6 p-4 bg-[#1EB4A1]/10 rounded-lg border border-[#1EB4A1]/20">
                <CheckCircle className="text-[#127670]" size={24} />
                <div>
                  <p className="text-[14px] font-bold text-[#127670]">Match Perfect</p>
                  <p className="text-[12px] text-[#127670]/80">Quantities align with PO-24-1199</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Item Details</p>
                  <p className="text-[14px] font-semibold text-slate-800">Paracetamol IV 100 ml</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-[11px] text-slate-500 mb-0.5">Batch No.</p>
                    <p className="text-[13px] font-bold text-slate-800 font-mono">PCM4922A</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-[11px] text-slate-500 mb-0.5">Expiry</p>
                    <p className="text-[13px] font-bold text-slate-800">12/2026</p>
                  </div>
                </div>
                <div className="flex justify-between items-center py-3 border-t border-slate-100 mt-2">
                  <span className="text-[13px] text-slate-500">Ordered Qty:</span>
                  <span className="text-[14px] font-bold text-slate-800">600</span>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span className="text-[13px] text-slate-500">Received Qty:</span>
                  <span className="text-[14px] font-bold text-[#127670]">600</span>
                </div>
              </div>
            </div>
          )}

          {scanState === 'variance' && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-3 mb-6 p-4 bg-[#D94432]/10 rounded-lg border border-[#D94432]/20">
                <AlertTriangle className="text-[#D94432]" size={24} />
                <div>
                  <p className="text-[14px] font-bold text-[#D94432]">Quantity Shortage</p>
                  <p className="text-[12px] text-[#D94432]/80">Variance detected against PO-24-1182</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Item Details</p>
                  <p className="text-[14px] font-semibold text-slate-800">Inj. Ceftriaxone 1 g</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-[11px] text-slate-500 mb-0.5">Batch No.</p>
                    <p className="text-[13px] font-bold text-slate-800 font-mono">CTX2510D</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-[11px] text-slate-500 mb-0.5">Expiry</p>
                    <p className="text-[13px] font-bold text-slate-800">10/2027</p>
                  </div>
                </div>
                <div className="flex justify-between items-center py-3 border-t border-slate-100 mt-2">
                  <span className="text-[13px] text-slate-500">Ordered Qty:</span>
                  <span className="text-[14px] font-bold text-slate-800">2,000</span>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span className="text-[13px] text-slate-500">Received Qty:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-bold text-slate-800">1,960</span>
                    <span className="bg-[#D94432] text-white px-2 py-0.5 rounded text-[11px] font-bold">Short 40</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-[13px] font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          
          {(scanState === 'success' || scanState === 'variance') && (
            <button 
              onClick={() => {
                console.log("Submitted for QC");
                onClose();
              }}
              className="flex-1 py-2.5 bg-[#125F5C] text-white rounded-lg text-[13px] font-semibold hover:bg-[#0f4d4a] shadow-sm transition-colors cursor-pointer"
            >
              Submit for QC
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
