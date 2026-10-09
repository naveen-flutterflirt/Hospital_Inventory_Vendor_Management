"use client";

import React, { useState } from 'react';
import Header from '@/components/dashboard/Header';
import { Download, Edit3, CheckCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import NegotiateModal from '@/components/dashboard/NegotiateModal';

export default function RfqQuotesPage() {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [isAwarding, setIsAwarding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [negotiateModalOpen, setNegotiateModalOpen] = useState(false);
  
  const handleExport = () => {
    setIsExporting(true);
    
    // Simulate real export generation
    setTimeout(() => {
      // Create a fake CSV blob
      const csvContent = "Item,Qty,Last Price,Sanjeevani Surgicals,Prakash Health,Nova MedEquip\nSurgical gloves,6000,21.0,19.4,20.1,22.0\nSuture 2-0 Vicryl,480,265,258,249,270";
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "RFQ-24-0318-Quotes.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setIsExporting(false);
    }, 1200);
  };

  const handleAward = () => {
    setIsAwarding(true);
    setTimeout(() => {
      setIsAwarding(false);
      setShowSuccess(true);
      
      // Navigate to PO page after a short success message
      setTimeout(() => {
        router.push('/purchase-orders');
      }, 1500);
    }, 1500);
  };

  return (
    <div className="p-4 pt-16 md:p-8 max-w-[1400px] mx-auto flex flex-col gap-4 font-sans">
      <Header />
      
      {/* Modals & Toasts */}
      <NegotiateModal isOpen={negotiateModalOpen} onClose={() => setNegotiateModalOpen(false)} />
      
      {showSuccess && (
        <div className="fixed bottom-4 right-4 bg-[#1EB4A1] text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-5 z-50">
          <CheckCircle size={18} />
          <span className="font-semibold text-sm">Awarded! Routing to Purchase Orders...</span>
        </div>
      )}

      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 mb-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Compare quotes side by side, then raise the PO in one click</h1>
        </div>
      </div>

      {/* Main Quote Comparison Card */}
      <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col overflow-hidden">
        
        {/* RFQ Header Toolbar */}
        <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-2 text-[14px]">
            <span className="font-bold text-slate-900">RFQ-24-0318</span>
            <span className="text-slate-400">&middot;</span>
            <span className="font-medium text-slate-700">OT consumables — quarterly</span>
            <span className="text-slate-400">&middot;</span>
            <span className="text-slate-600">4 vendors invited</span>
            <span className="text-slate-400">&middot;</span>
            <span className="text-slate-600">3 responded</span>
            <span className="text-slate-400">&middot;</span>
            <span className="text-slate-500">closes 9 Oct 17:00</span>
          </div>
          
          <div className="flex items-center gap-3 flex-shrink-0">
            <button 
              onClick={() => setNegotiateModalOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-[14px] font-semibold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer min-w-[120px]"
            >
              <Edit3 size={16} /> Negotiate
            </button>
            <button 
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-[14px] font-semibold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer disabled:opacity-50 min-w-[120px]"
            >
              {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} 
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
            <button 
              onClick={handleAward}
              disabled={isAwarding}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#125F5C] text-white rounded-lg text-[14px] font-semibold hover:bg-[#0f4d4a] transition-colors shadow-sm cursor-pointer disabled:opacity-50 min-w-[190px]"
            >
              {isAwarding ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />} 
              {isAwarding ? 'Processing...' : 'Award & create PO'}
            </button>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-[13px] text-left whitespace-nowrap min-w-[900px]">
            <thead>
              <tr className="text-slate-500 border-b border-slate-100 font-medium">
                <th className="py-4 px-5 font-medium min-w-[200px]">Item</th>
                <th className="py-4 px-4 font-medium text-right">Qty</th>
                <th className="py-4 px-4 font-medium text-right">Last price</th>
                <th className="py-4 px-4 font-medium min-w-[180px]">Sanjeevani Surgicals</th>
                <th className="py-4 px-4 font-medium min-w-[180px]">Prakash Health Supplies</th>
                <th className="py-4 px-4 font-medium min-w-[180px]">Nova MedEquip Traders</th>
                <th className="py-4 px-5 font-medium bg-slate-50/50 min-w-[160px]">Recommended</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {/* Row 1 */}
              <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="py-3 px-5">Surgical gloves 7.0 (pair)</td>
                <td className="py-3 px-4 text-right font-medium">6,000</td>
                <td className="py-3 px-4 text-right text-slate-500">₹21.0</td>
                <td className="py-3 px-4 bg-[#1EB4A1]/10 font-semibold text-[#127670] cursor-pointer hover:bg-[#1EB4A1]/20 transition-colors rounded-sm">₹19.4 <span className="text-[11px] ml-1 opacity-70">&middot; L1</span></td>
                <td className="py-3 px-4 text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors rounded-sm">₹20.1</td>
                <td className="py-3 px-4 text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors rounded-sm">₹22.0</td>
                <td className="py-3 px-5 bg-slate-50/50 font-medium">Sanjeevani</td>
              </tr>
              {/* Row 2 */}
              <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="py-3 px-5">Suture 2-0 Vicryl</td>
                <td className="py-3 px-4 text-right font-medium">480</td>
                <td className="py-3 px-4 text-right text-slate-500">₹265</td>
                <td className="py-3 px-4 text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors rounded-sm">₹258</td>
                <td className="py-3 px-4 bg-[#1EB4A1]/10 font-semibold text-[#127670] cursor-pointer hover:bg-[#1EB4A1]/20 transition-colors rounded-sm">₹249 <span className="text-[11px] ml-1 opacity-70">&middot; L1</span></td>
                <td className="py-3 px-4 text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors rounded-sm">₹270</td>
                <td className="py-3 px-5 bg-slate-50/50 font-medium">Prakash Health</td>
              </tr>
              {/* Row 3 */}
              <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="py-3 px-5">Drape pack, sterile</td>
                <td className="py-3 px-4 text-right font-medium">900</td>
                <td className="py-3 px-4 text-right text-slate-500">₹310</td>
                <td className="py-3 px-4 bg-[#1EB4A1]/10 font-semibold text-[#127670] cursor-pointer hover:bg-[#1EB4A1]/20 transition-colors rounded-sm">₹298 <span className="text-[11px] ml-1 opacity-70">&middot; L1</span></td>
                <td className="py-3 px-4 text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors rounded-sm">₹305</td>
                <td className="py-3 px-4 text-slate-400 italic">No bid</td>
                <td className="py-3 px-5 bg-slate-50/50 font-medium">Sanjeevani</td>
              </tr>
              {/* Row 4 */}
              <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                <td className="py-3 px-5">Skin stapler 35W</td>
                <td className="py-3 px-4 text-right font-medium">120</td>
                <td className="py-3 px-4 text-right text-slate-500">₹780</td>
                <td className="py-3 px-4 text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors rounded-sm">₹765</td>
                <td className="py-3 px-4 text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors rounded-sm">₹772</td>
                <td className="py-3 px-4 bg-[#1EB4A1]/10 font-semibold text-[#127670] cursor-pointer hover:bg-[#1EB4A1]/20 transition-colors rounded-sm">₹740 <span className="text-[11px] ml-1 opacity-70">&middot; L1</span></td>
                <td className="py-3 px-5 bg-slate-50/50 font-medium">
                  Nova MedEquip <span className="ml-2 text-[10px] bg-[#E89A3C]/20 text-[#E89A3C] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">New Vendor</span>
                </td>
              </tr>
              
              {/* Totals & Terms Footer */}
              <tr className="bg-slate-50 border-b border-slate-100">
                <td colSpan={2} className="py-4 px-5 font-bold text-slate-800">Totals & terms</td>
                <td className="py-4 px-4 text-right font-semibold text-slate-800">₹6.27L</td>
                <td className="py-4 px-4">
                  <div className="font-bold text-slate-800">₹6.02L</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">45 d credit &middot; 3 d delivery</div>
                </td>
                <td className="py-4 px-4">
                  <div className="font-bold text-slate-800">₹6.08L</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">30 d &middot; 5 d</div>
                </td>
                <td className="py-4 px-4">
                  <div className="font-bold text-slate-800">Partial</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">60 d &middot; 7 d</div>
                </td>
                <td className="py-4 px-5 font-bold text-[#127670] bg-[#1EB4A1]/5">
                  Save ₹28.4K (4.5%)
                </td>
              </tr>

              {/* Vendor Score Footer */}
              <tr className="bg-white">
                <td colSpan={3} className="py-4 px-5 font-medium text-slate-500">Vendor score</td>
                <td className="py-4 px-4">
                  <span className="text-[11px] font-semibold text-[#127670] bg-[#1EB4A1]/10 px-2 py-1 rounded">A &middot; 94</span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-[11px] font-semibold text-[#127670] bg-[#1EB4A1]/10 px-2 py-1 rounded">A &middot; 90</span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-[11px] font-semibold text-[#E89A3C] bg-[#E89A3C]/10 px-2 py-1 rounded">Unrated</span>
                </td>
                <td className="py-4 px-5 bg-slate-50/50"></td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Bottom Note */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-[12px] text-slate-500 mt-auto">
          Award can split by line (L1 per item) or go to one vendor for logistics. Overriding L1 requires a written reason, logged for audit.
        </div>
      </div>

      {/* Bottom Information Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
        
        {/* Approval Matrix */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
          <h2 className="text-[14px] font-bold text-slate-900 mb-4">Approval matrix (configurable)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] text-left whitespace-nowrap">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200 font-medium">
                  <th className="pb-3 pr-4 font-normal">PO value</th>
                  <th className="pb-3 pr-4 font-normal">Level 1</th>
                  <th className="pb-3 pr-4 font-normal">Level 2</th>
                  <th className="pb-3 font-normal">Level 3</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                <tr className="border-b border-slate-200/60 hover:bg-slate-100 transition-colors">
                  <td className="py-3 pr-4 font-medium">Up to ₹50,000</td>
                  <td className="py-3 pr-4">Purchase officer</td>
                  <td className="py-3 pr-4 text-slate-400">—</td>
                  <td className="py-3 text-slate-400">—</td>
                </tr>
                <tr className="border-b border-slate-200/60 hover:bg-slate-100 transition-colors">
                  <td className="py-3 pr-4 font-medium">₹50,000 – ₹5 L</td>
                  <td className="py-3 pr-4">Purchase head</td>
                  <td className="py-3 pr-4">Department HOD</td>
                  <td className="py-3 text-slate-400">—</td>
                </tr>
                <tr className="border-b border-slate-200/60 hover:bg-slate-100 transition-colors">
                  <td className="py-3 pr-4 font-medium">₹5 L – ₹25 L</td>
                  <td className="py-3 pr-4">Purchase head</td>
                  <td className="py-3 pr-4">CFO</td>
                  <td className="py-3 text-slate-400">—</td>
                </tr>
                <tr className="border-b border-slate-200/60 hover:bg-slate-100 transition-colors">
                  <td className="py-3 pr-4 font-medium">Above ₹25 L / capex</td>
                  <td className="py-3 pr-4">Purchase committee</td>
                  <td className="py-3 pr-4">CFO</td>
                  <td className="py-3">MD / Board</td>
                </tr>
                <tr className="hover:bg-slate-100 transition-colors">
                  <td className="py-3 pr-4 font-medium">Emergency purchase</td>
                  <td className="py-3 pr-4">Duty manager</td>
                  <td colSpan={2} className="py-3">Post-facto review within 48 h</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Purchase types supported */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
          <h2 className="text-[14px] font-bold text-slate-900 mb-4">Purchase types supported</h2>
          <ul className="space-y-3 text-[13px] text-slate-700 leading-relaxed">
            <li><span className="font-bold text-slate-900 mr-1.5">&bull;</span> <span className="font-semibold text-slate-900">Regular PO</span> — from PR or auto-reorder</li>
            <li><span className="font-bold text-slate-900 mr-1.5">&bull;</span> <span className="font-semibold text-slate-900">Rate-contract PO</span> — no RFQ needed within validity</li>
            <li><span className="font-bold text-slate-900 mr-1.5">&bull;</span> <span className="font-semibold text-slate-900">Blanket / scheduled PO</span> — monthly call-offs</li>
            <li><span className="font-bold text-slate-900 mr-1.5">&bull;</span> <span className="font-semibold text-slate-900">Consignment</span> — implants billed only when used</li>
            <li><span className="font-bold text-slate-900 mr-1.5">&bull;</span> <span className="font-semibold text-slate-900">Capex PO</span> — equipment, creates asset on GRN</li>
            <li><span className="font-bold text-slate-900 mr-1.5">&bull;</span> <span className="font-semibold text-slate-900">Service PO</span> — AMC, housekeeping, lab outsourcing</li>
            <li><span className="font-bold text-slate-900 mr-1.5">&bull;</span> <span className="font-semibold text-slate-900">Emergency / local purchase</span> — capped and reviewed</li>
          </ul>
        </div>

      </div>

    </div>
  );
}
