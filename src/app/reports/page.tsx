"use client";

import React, { useState } from 'react';
import Header from '@/components/dashboard/Header';
import { cn } from '@/lib/utils';
import { Download, FileText, TrendingUp, DollarSign, Package, Users, Calendar } from 'lucide-react';
import ScheduleReportModal from '@/components/dashboard/ScheduleReportModal';
import GenerateReportModal from '@/components/dashboard/GenerateReportModal';

const kpis = [
  { label: 'Total Spend (YTD)', value: '₹4.2Cr', sub: '+12% vs last year', icon: DollarSign, color: 'text-[#127670]', bg: 'bg-[#1EB4A1]/10' },
  { label: 'POs Generated', value: '1,842', sub: 'Avg ₹22K per PO', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
  { label: 'Inventory Value', value: '₹85.4L', sub: 'Across 3 stores', icon: Package, color: 'text-[#E89A3C]', bg: 'bg-[#E89A3C]/10' },
  { label: 'Active Vendors', value: '184', sub: 'Avg Score: 88%', icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
];

const generatedReports = [
  { id: 'RPT-8442', name: 'Q3 Vendor Performance Analysis', type: 'Vendor Management', date: 'Oct 08, 2024', size: '2.4 MB' },
  { id: 'RPT-8441', name: 'Monthly Inventory Valuation', type: 'Inventory', date: 'Oct 01, 2024', size: '1.1 MB' },
  { id: 'RPT-8440', name: 'AP Aging Summary', type: 'Finance', date: 'Sep 30, 2024', size: '840 KB' },
  { id: 'RPT-8439', name: 'Departmental Consumption Rate', type: 'Analytics', date: 'Sep 28, 2024', size: '3.2 MB' },
  { id: 'RPT-8438', name: 'AMC Expiry Forecast (Q4)', type: 'Assets', date: 'Sep 25, 2024', size: '1.5 MB' },
];

const chartData = [
  { month: 'Jan', spend: 65, po: 45 },
  { month: 'Feb', spend: 59, po: 40 },
  { month: 'Mar', spend: 80, po: 65 },
  { month: 'Apr', spend: 81, po: 70 },
  { month: 'May', spend: 56, po: 48 },
  { month: 'Jun', spend: 55, po: 45 },
  { month: 'Jul', spend: 40, po: 35 },
  { month: 'Aug', spend: 75, po: 60 },
  { month: 'Sep', spend: 90, po: 85 },
  { month: 'Oct', spend: 100, po: 95 },
];

export default function ReportsPage() {
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);

  const handleDownload = (id: string) => {
    setIsExporting(id);
    setTimeout(() => {
      setIsExporting(null);
    }, 1500);
  };

  return (
    <div className="p-4 pt-16 md:p-8 max-w-[1400px] mx-auto flex flex-col gap-6 font-sans h-full">
      <Header />
      
      {/* Modals */}
      <ScheduleReportModal isOpen={scheduleModalOpen} onClose={() => setScheduleModalOpen(false)} />
      <GenerateReportModal isOpen={generateModalOpen} onClose={() => setGenerateModalOpen(false)} />

      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-[13px] text-slate-500 mt-1">Generate comprehensive insights across procurement, inventory, and finance.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setScheduleModalOpen(true)}
            className="flex items-center gap-2 bg-white border border-slate-200 text-[#2B3F54] px-5 py-2.5 rounded-lg text-[14px] font-semibold hover:bg-slate-50 transition-colors shadow-sm whitespace-nowrap cursor-pointer"
          >
            <Calendar size={16} strokeWidth={2.5} /> Schedule Report
          </button>
          <button 
            onClick={() => setGenerateModalOpen(true)}
            className="flex items-center gap-2 bg-[#125F5C] text-white px-5 py-2.5 rounded-lg text-[14px] font-semibold hover:bg-[#0c4240] transition-colors shadow-sm whitespace-nowrap cursor-pointer"
          >
            <TrendingUp size={16} strokeWidth={2.5} /> Generate Custom
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white p-5 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col gap-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className={cn("p-2.5 rounded-lg", kpi.bg)}>
                <kpi.icon size={20} className={kpi.color} strokeWidth={2.5} />
              </div>
              <TrendingUp size={16} className="text-[#1EB4A1]" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-800 mb-0.5">{kpi.value}</p>
              <h3 className="text-[13px] text-slate-500 font-semibold mb-1">{kpi.label}</h3>
              <p className="text-[11px] text-slate-400 font-medium">{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CSS Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-[15px] font-bold text-slate-800">Procurement Volume & Spend</h3>
              <p className="text-[12px] text-slate-500 mt-1">Monthly trend across all hospital departments</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-[#127670]"></div>
                <span className="text-[12px] font-medium text-slate-600">Spend (₹ Lakhs)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-[#1EB4A1]/40"></div>
                <span className="text-[12px] font-medium text-slate-600">PO Volume</span>
              </div>
            </div>
          </div>

          <div className="flex-1 flex items-end gap-2 sm:gap-4 h-64 mt-auto">
            {chartData.map((data, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="w-full flex justify-center items-end gap-1 h-[85%] relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 bg-slate-800 text-white text-[11px] font-medium py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                    ₹{data.spend}L / {data.po} POs
                  </div>
                  
                  <div 
                    className="w-[40%] bg-[#127670] rounded-t-sm transition-all duration-500 hover:opacity-80" 
                    style={{ height: `${data.spend}%` }}
                  ></div>
                  <div 
                    className="w-[40%] bg-[#1EB4A1]/40 rounded-t-sm transition-all duration-500 hover:opacity-80" 
                    style={{ height: `${data.po}%` }}
                  ></div>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{data.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Reports List */}
        <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-[15px] font-bold text-slate-800">Generated Reports</h3>
            <p className="text-[12px] text-slate-500 mt-1">Recently exported data files</p>
          </div>
          
          <div className="flex flex-col flex-1 overflow-y-auto">
            {generatedReports.map((report, i) => (
              <div key={i} className="p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors flex items-center justify-between group">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-slate-400">
                    <FileText size={16} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-slate-800 group-hover:text-[#127670] transition-colors">{report.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{report.type}</span>
                      <span className="text-[11px] text-slate-400">{report.date}</span>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleDownload(report.id)}
                  disabled={isExporting === report.id}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-[#127670] hover:bg-[#1EB4A1]/10 transition-colors cursor-pointer"
                  title="Download PDF"
                >
                  {isExporting === report.id ? (
                    <div className="w-4 h-4 border-2 border-[#127670] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download size={16} strokeWidth={2.5} />
                  )}
                </button>
              </div>
            ))}
          </div>
          
          <div className="p-3 border-t border-slate-100 mt-auto">
            <button className="w-full py-2 text-[13px] font-semibold text-[#127670] hover:bg-[#1EB4A1]/10 rounded-md transition-colors cursor-pointer">
              View All Reports
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
