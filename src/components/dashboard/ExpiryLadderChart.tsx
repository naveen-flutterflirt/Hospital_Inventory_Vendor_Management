"use client";

import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const expiryData = [
  { name: 'Expired', value: 0.9, fill: '#D94432' },
  { name: '<30 d', value: 1.9, fill: '#E89A3C' },
  { name: '30–60 d', value: 2.1, fill: '#8DCAC1' },
  { name: '60–90 d', value: 2.8, fill: '#8DCAC1' },
];

interface CustomTickProps {
  x?: number;
  y?: number;
  payload?: {
    value: string;
  };
}

const CustomTick = (props: CustomTickProps) => {
  const { x, y, payload } = props;
  const payloadValue = payload?.value || '';
  const data = expiryData.find(d => d.name === payloadValue);
  
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={15} dy={0} textAnchor="middle" fill="#0f172a" fontSize={12} fontWeight="bold">
        ₹{data?.value}L
      </text>
      <text x={0} y={35} dy={0} textAnchor="middle" fill="#64748b" fontSize={11}>
        {payloadValue}
      </text>
    </g>
  );
};

export default function ExpiryLadderChart() {
  return (
    <div className="bg-white p-5 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 h-full flex flex-col">
      <h2 className="text-[14px] font-bold text-slate-800 mb-6 tracking-tight">Expiry ladder (value)</h2>
      <div className="flex-1 w-full min-h-[140px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={expiryData} margin={{ top: 0, right: 10, left: 10, bottom: 30 }}>
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              interval={0}
              tick={<CustomTick />}
            />
            <Tooltip 
              cursor={{fill: 'transparent'}}
              contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="value" radius={[3, 3, 0, 0]} barSize={36}>
              {expiryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 text-[13px] text-[#0f524e] font-medium bg-[#e6f4f2] px-3 py-3 rounded-md text-center">
        ₹1.2L eligible for return to vendor before expiry
      </div>
    </div>
  );
}
