'use client';

import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DashboardExpiryBucket } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';

interface ExpiryLadderChartProps {
  data?: DashboardExpiryBucket[];
  eligibleReturnAmount?: string;
  loading?: boolean;
}

const fallbackExpiryData = [
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
  data?: DashboardExpiryBucket[];
}

const CustomTick = (props: CustomTickProps) => {
  const { x, y, payload, data } = props;
  const payloadValue = payload?.value || '';
  const item = (data || fallbackExpiryData).find((d) => d.name === payloadValue);
  
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={15} dy={0} textAnchor="middle" fill="#0f172a" fontSize={12} fontWeight="bold">
        ₹{item?.value}L
      </text>
      <text x={0} y={35} dy={0} textAnchor="middle" fill="#64748b" fontSize={11}>
        {payloadValue}
      </text>
    </g>
  );
};

export default function ExpiryLadderChart({
  data,
  eligibleReturnAmount = '₹1.2L',
  loading = false,
}: ExpiryLadderChartProps) {
  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 h-full flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="flex-1 w-full min-h-[140px] flex items-end justify-around gap-3 px-2 py-4">
          <div className="flex flex-col items-center gap-1.5 w-12">
            <Skeleton className="w-10 h-16 rounded-t" />
            <Skeleton className="w-8 h-2.5" />
          </div>
          <div className="flex flex-col items-center gap-1.5 w-12">
            <Skeleton className="w-10 h-28 rounded-t" />
            <Skeleton className="w-8 h-2.5" />
          </div>
          <div className="flex flex-col items-center gap-1.5 w-12">
            <Skeleton className="w-10 h-32 rounded-t" />
            <Skeleton className="w-8 h-2.5" />
          </div>
          <div className="flex flex-col items-center gap-1.5 w-12">
            <Skeleton className="w-10 h-40 rounded-t" />
            <Skeleton className="w-8 h-2.5" />
          </div>
        </div>
        <div className="mt-4">
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>
    );
  }

  const chartData = data && data.length > 0 ? data : fallbackExpiryData;

  return (
    <div className="bg-white p-5 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[14px] font-bold text-slate-800 tracking-tight">Expiry ladder (value)</h2>
      </div>

      <div className="flex-1 w-full min-h-[140px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, right: 10, left: 10, bottom: 30 }}>
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              interval={0}
              tick={<CustomTick data={chartData} />}
            />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(val: any) => [`₹${val} Lakhs`, 'Stock Value']}
            />
            <Bar dataKey="value" radius={[3, 3, 0, 0]} barSize={36}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-[13px] text-[#0f524e] font-medium bg-[#e6f4f2] px-3 py-3 rounded-md text-center">
        {eligibleReturnAmount} eligible for return to vendor before expiry
      </div>
    </div>
  );
}
