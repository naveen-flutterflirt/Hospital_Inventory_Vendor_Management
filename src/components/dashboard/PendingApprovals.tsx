import React from 'react';

export default function PendingApprovals() {
  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Pending approval */}
      <div className="bg-white p-5 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100">
        <h2 className="text-[14px] font-bold text-slate-800 mb-4 tracking-tight">Pending my approval &middot; 7</h2>
        <div className="space-y-3 text-[13px] text-slate-700">
          <div>
            PO-24-1190 &middot; ₹2.3L &middot; Lab
          </div>
          <div>
            Indent ICU-882 &middot; emergency
          </div>
          <div>
            Payment batch &middot; 12 invoices &middot; ₹18.4L
          </div>
        </div>
      </div>

      {/* Unbilled consumption */}
      <div className="bg-[#0A1B22] p-5 rounded-xl shadow-md text-white flex items-center gap-4 flex-1">
        <div className="text-3xl font-bold text-white tracking-tight">₹2.1L</div>
        <div>
          <div className="font-semibold text-[13px]">Unbilled consumption &middot; 7 days</div>
          <div className="text-[11px] text-[#879C9B] mt-1">Issued to patients but not on bill — 23 cases</div>
        </div>
      </div>
    </div>
  );
}
