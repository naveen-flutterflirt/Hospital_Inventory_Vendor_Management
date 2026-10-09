import React from 'react';

const spendData = [
  { name: 'Drugs', value: 48.2, fill: '#125F5C' },
  { name: 'Implants', value: 29.9, fill: '#17A392' },
  { name: 'Consumables', value: 21.4, fill: '#17A392' },
  { name: 'Lab reagents', value: 11.1, fill: '#125F5C' },
  { name: 'General', value: 5.8, fill: '#125F5C' },
];

export default function CategorySpendChart() {
  return (
    <div className="bg-white p-5 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 h-full flex flex-col">
      <h2 className="text-[14px] font-bold text-slate-800 mb-5 tracking-tight">Spend by category — this month</h2>
      <div className="space-y-4 flex-1 flex flex-col justify-center pb-2">
        {spendData.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="text-[13px] text-slate-600 w-24">{item.name}</div>
            <div className="flex-1 mx-3 h-2 bg-slate-100 rounded-full overflow-hidden flex">
              <div 
                className="h-full rounded-full transition-all duration-500" 
                style={{ 
                  width: `${(item.value / 48.2) * 100}%`,
                  backgroundColor: item.fill 
                }}
              />
            </div>
            <div className="text-[13px] font-medium w-12 text-right text-slate-400">₹{item.value}L</div>
          </div>
        ))}
      </div>
    </div>
  );
}
