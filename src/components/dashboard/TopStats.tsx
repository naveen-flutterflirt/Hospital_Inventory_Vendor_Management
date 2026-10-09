import { ArrowDown } from 'lucide-react';

export default function TopStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      <div className="bg-white p-4 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100">
        <div className="text-[13px] text-slate-500 mb-1">Stock value</div>
        <div className="text-[26px] font-bold text-slate-800 leading-none mb-1">₹3.42Cr</div>
        <div className="text-[11px] text-slate-400 mt-2">8,214 SKUs &middot; 14 stores</div>
      </div>
      
      <div className="bg-white p-4 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100">
        <div className="text-[13px] text-slate-500 mb-1">Days of stock</div>
        <div className="text-[26px] font-bold text-slate-800 leading-none mb-1">31</div>
        <div className="text-[11px] text-[#127670] mt-2 flex items-center font-medium">
          <ArrowDown size={12} className="mr-0.5" /> 4 d vs last month
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 border-l-4 border-l-[#D94432]">
        <div className="text-[13px] text-slate-500 mb-1">Below reorder</div>
        <div className="text-[26px] font-bold text-[#D94432] leading-none mb-1">47</div>
        <div className="text-[11px] text-[#D94432] mt-2">6 vital items</div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 border-l-4 border-l-[#D94432]">
        <div className="text-[13px] text-slate-500 mb-1">Near expiry &middot; 90 d</div>
        <div className="text-[26px] font-bold text-[#D94432] leading-none mb-1">₹6.8L</div>
        <div className="text-[11px] text-[#D94432] mt-2">212 batches</div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100">
        <div className="text-[13px] text-slate-500 mb-1">Open POs</div>
        <div className="text-[26px] font-bold text-slate-800 leading-none mb-1">63</div>
        <div className="text-[11px] text-[#D94432] mt-2">9 overdue delivery</div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100">
        <div className="text-[13px] text-slate-500 mb-1">Payables due &middot; 7 d</div>
        <div className="text-[26px] font-bold text-slate-800 leading-none mb-1">₹41.6L</div>
        <div className="text-[11px] text-slate-400 mt-2">38 invoices matched</div>
      </div>
    </div>
  );
}
