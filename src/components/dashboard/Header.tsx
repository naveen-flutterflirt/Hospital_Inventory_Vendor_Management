import React, { useState } from 'react';
import { Search, ChevronDown, Plus } from 'lucide-react';
import NewIndentModal from './NewIndentModal';

export default function Header() {
  const [storeOpen, setStoreOpen] = useState(false);
  const [activeStore, setActiveStore] = useState('All');
  const [isIndentModalOpen, setIsIndentModalOpen] = useState(false);

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 relative z-50">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Inventory overview</h1>
        <p className="text-[13px] text-slate-500 mt-1 font-medium">Thursday, 8 Oct &middot; All stores &middot; All branches</p>
      </div>
      
      <div className="flex items-center gap-2.5 flex-wrap md:flex-nowrap w-full lg:w-auto">
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search item, batch, PO, vendor..." 
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-md text-[13px] w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] shadow-sm placeholder-slate-400 font-medium"
          />
        </div>
        
        <div className="relative flex-1 md:flex-none">
          <button 
            onClick={() => setStoreOpen(!storeOpen)} 
            className="w-full md:w-auto flex justify-center items-center gap-2 border border-slate-200 bg-white px-3 py-2 rounded-md text-[13px] font-semibold hover:bg-slate-50 cursor-pointer transition-colors shadow-sm text-slate-700"
          >
            Store: {activeStore} <ChevronDown size={14} className="text-slate-500" />
          </button>
          
          {storeOpen && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-slate-200 shadow-lg rounded-md overflow-hidden z-50 py-1 text-[13px]">
              {['All', 'Central', 'ICU', 'Wards', 'OT'].map(store => (
                <div 
                  key={store}
                  onClick={() => { setActiveStore(store); setStoreOpen(false); }}
                  className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-slate-700 font-medium"
                >
                  {store}
                </div>
              ))}
            </div>
          )}
        </div>

        <button 
          onClick={() => console.log('Scan opened')} 
          className="flex items-center gap-2 border border-slate-200 bg-white px-4 py-2 rounded-md text-[13px] font-semibold hover:bg-slate-50 cursor-pointer transition-colors shadow-sm text-slate-700"
        >
          Scan
        </button>
        
        <button 
          onClick={() => setIsIndentModalOpen(true)} 
          className="flex items-center gap-1.5 bg-[#127670] text-white px-4 py-2 rounded-md text-[13px] font-semibold hover:bg-[#0f605b] cursor-pointer transition-colors shadow-sm"
        >
          <Plus size={16} /> New indent
        </button>
      </div>

      <NewIndentModal 
        isOpen={isIndentModalOpen} 
        onClose={() => setIsIndentModalOpen(false)} 
      />
    </div>
  );
}
