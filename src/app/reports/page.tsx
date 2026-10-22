"use client";

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/dashboard/Header';
import { cn } from '@/lib/utils';
import { Download, FileText, TrendingUp, DollarSign, Package, Users, Calendar, RotateCw, AlertCircle } from 'lucide-react';
import ScheduleReportModal from '@/components/dashboard/ScheduleReportModal';
import GenerateReportModal from '@/components/dashboard/GenerateReportModal';
import { api, ReportKpisResponse, GeneratedReportItem } from '@/lib/api';
import { Skeleton, SkeletonKpiCards } from '@/components/ui/Skeleton';

interface TrendItem {
  month: string;
  spend: number;
  po: number;
  spend_formatted: string;
  po_formatted: string;
}

const defaultTrends: TrendItem[] = [
  { month: 'Jan', spend: 65, po: 45, spend_formatted: '₹65L', po_formatted: '45 POs' },
  { month: 'Feb', spend: 59, po: 40, spend_formatted: '₹59L', po_formatted: '40 POs' },
  { month: 'Mar', spend: 80, po: 65, spend_formatted: '₹80L', po_formatted: '65 POs' },
  { month: 'Apr', spend: 81, po: 70, spend_formatted: '₹81L', po_formatted: '70 POs' },
  { month: 'May', spend: 56, po: 48, spend_formatted: '₹56L', po_formatted: '48 POs' },
  { month: 'Jun', spend: 55, po: 45, spend_formatted: '₹55L', po_formatted: '45 POs' },
  { month: 'Jul', spend: 40, po: 35, spend_formatted: '₹40L', po_formatted: '35 POs' },
  { month: 'Aug', spend: 75, po: 60, spend_formatted: '₹75L', po_formatted: '60 POs' },
  { month: 'Sep', spend: 90, po: 85, spend_formatted: '₹90L', po_formatted: '85 POs' },
  { month: 'Oct', spend: 24.1, po: 5, spend_formatted: '₹24.1L', po_formatted: '5 POs' },
];

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [kpis, setKpis] = useState<ReportKpisResponse | null>(null);
  const [trends, setTrends] = useState<TrendItem[]>(defaultTrends);
  const [maxSpend, setMaxSpend] = useState<number>(100);
  const [maxPo, setMaxPo] = useState<number>(100);
  const [reportsList, setReportsList] = useState<GeneratedReportItem[]>([]);

  const [downloadingCode, setDownloadingCode] = useState<string | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);

  const fetchReportsData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    setErrorMessage(null);

    try {
      const [kpiRes, trendRes, reportsRes] = await Promise.allSettled([
        api.reports.getKpis(),
        api.reports.getTrends(),
        api.reports.getGeneratedReports(),
      ]);

      if (kpiRes.status === 'fulfilled' && kpiRes.value.success && kpiRes.value.data) {
        setKpis(kpiRes.value.data);
      }

      if (trendRes.status === 'fulfilled' && trendRes.value.success && trendRes.value.data) {
        setTrends(trendRes.value.data.data || defaultTrends);
        setMaxSpend(trendRes.value.data.max_spend || 100);
        setMaxPo(trendRes.value.data.max_po || 100);
      }

      if (reportsRes.status === 'fulfilled' && reportsRes.value.success && reportsRes.value.data) {
        setReportsList(reportsRes.value.data);
      }
    } catch (err: any) {
      console.error('Failed to load reports data:', err);
      setErrorMessage(err.message || 'Could not fetch live report metrics from server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReportsData();
  }, [fetchReportsData]);

  const handleDownload = (code: string, format = 'csv') => {
    setDownloadingCode(code);
    try {
      const downloadUrl = api.reports.getDownloadUrl(code);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${code}.${format.toLowerCase()}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download trigger error:', err);
    } finally {
      setTimeout(() => {
        setDownloadingCode(null);
      }, 1500);
    }
  };

  const kpiCards = [
    {
      label: kpis?.total_spend.label || 'Total Spend (YTD)',
      value: kpis?.total_spend.value || '₹24.1L',
      sub: kpis?.total_spend.sub || '+12% vs last year',
      icon: DollarSign,
      color: 'text-[#127670]',
      bg: 'bg-[#1EB4A1]/10',
    },
    {
      label: kpis?.pos_generated.label || 'POs Generated',
      value: kpis?.pos_generated.value || '5',
      sub: kpis?.pos_generated.sub || 'Avg ₹482K per PO',
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      label: kpis?.inventory_value.label || 'Inventory Value',
      value: kpis?.inventory_value.value || '₹11.6L',
      sub: kpis?.inventory_value.sub || 'Across 3 stores',
      icon: Package,
      color: 'text-[#E89A3C]',
      bg: 'bg-[#E89A3C]/10',
    },
    {
      label: kpis?.active_vendors.label || 'Active Vendors',
      value: kpis?.active_vendors.value || '6',
      sub: kpis?.active_vendors.sub || 'Avg Score: 91%',
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
  ];

  return (
    <div className="p-3 sm:p-4 pt-16 md:p-8 max-w-[1400px] mx-auto flex flex-col gap-4 sm:gap-6 font-sans h-full">
      <Header />
      
      {/* Modals */}
      <ScheduleReportModal 
        isOpen={scheduleModalOpen} 
        onClose={() => setScheduleModalOpen(false)} 
        onScheduled={() => fetchReportsData(true)}
      />
      <GenerateReportModal 
        isOpen={generateModalOpen} 
        onClose={() => setGenerateModalOpen(false)} 
        onReportGenerated={() => fetchReportsData(true)}
      />

      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mt-1 sm:mt-2">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Reports & Analytics
            {loading && <span className="text-[11px] font-normal text-slate-400 animate-pulse">(Connecting to database...)</span>}
          </h1>
          <p className="text-[12px] sm:text-[13px] text-slate-500 mt-0.5 sm:mt-1">
            Real-time procurement insights, clinical consumption rates, and verified data exports.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          <button
            onClick={() => fetchReportsData(true)}
            disabled={refreshing}
            className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 text-slate-600 p-2 sm:px-3.5 sm:py-2.5 rounded-lg text-[13px] font-semibold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer disabled:opacity-50 shrink-0"
            title="Refresh analytics data"
          >
            <RotateCw size={15} className={cn(refreshing && "animate-spin text-[#127670]")} />
            <span className="hidden md:inline">Refresh</span>
          </button>
          <button 
            onClick={() => setScheduleModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-white border border-slate-200 text-[#2B3F54] px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-[12px] sm:text-[14px] font-semibold hover:bg-slate-50 transition-colors shadow-sm whitespace-nowrap cursor-pointer"
          >
            <Calendar size={15} strokeWidth={2.5} /> Schedule Report
          </button>
          <button 
            onClick={() => setGenerateModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-[#125F5C] text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-[12px] sm:text-[14px] font-semibold hover:bg-[#0c4240] transition-colors shadow-sm whitespace-nowrap cursor-pointer"
          >
            <TrendingUp size={15} strokeWidth={2.5} /> Generate Custom
          </button>
        </div>
      </div>

      {/* Error Banner if any */}
      {errorMessage && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between gap-2 text-[13px] text-amber-800">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button 
            onClick={() => fetchReportsData(true)} 
            className="text-amber-700 underline font-semibold text-[12px] hover:text-amber-900 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Row */}
      {loading && !refreshing ? (
        <SkeletonKpiCards count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {kpiCards.map((kpi, i) => (
            <div key={i} className="bg-white p-3.5 sm:p-5 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col justify-between gap-3 sm:gap-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className={cn("p-2 rounded-lg", kpi.bg)}>
                  <kpi.icon size={18} className={kpi.color} strokeWidth={2.5} />
                </div>
                <TrendingUp size={15} className="text-[#1EB4A1]" />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold tracking-tight text-slate-800 mb-0.5 truncate">
                  {kpi.value}
                </p>
                <h3 className="text-[11px] sm:text-[13px] text-slate-500 font-semibold mb-0.5 truncate">{kpi.label}</h3>
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">{kpi.sub}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CSS Dual-Series Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 p-6 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
            <div>
              <h3 className="text-[15px] font-bold text-slate-800">Procurement Volume & Spend</h3>
              <p className="text-[12px] text-slate-500 mt-1">Monthly trend across all hospital departments & suppliers</p>
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

          <div className="flex-1 flex items-end gap-2 sm:gap-4 h-64 mt-auto pt-8">
            {loading && !refreshing ? (
              Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div className="w-full flex justify-center items-end gap-1 h-[85%]">
                    <Skeleton className="w-[40%] rounded-t-sm" style={{ height: `${30 + (i % 5) * 12}%` }} />
                    <Skeleton className="w-[40%] rounded-t-sm opacity-60" style={{ height: `${20 + (i % 4) * 14}%` }} />
                  </div>
                  <Skeleton className="h-2.5 w-6" />
                </div>
              ))
            ) : (
              trends.map((data, i) => {
                const spendHeight = Math.max(6, Math.min(85, (data.spend / (maxSpend || 100)) * 85));
                const poHeight = Math.max(6, Math.min(85, (data.po / (maxPo || 100)) * 85));

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="w-full flex justify-center items-end gap-1 h-[85%] relative">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-10 bg-slate-800 text-white text-[11px] font-medium py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-md">
                        {data.spend_formatted} / {data.po_formatted}
                      </div>
                      
                      <div 
                        className="w-[40%] bg-[#127670] rounded-t-sm transition-all duration-500 hover:opacity-85" 
                        style={{ height: `${spendHeight}%` }}
                        title={`Spend: ${data.spend_formatted}`}
                      ></div>
                      <div 
                        className="w-[40%] bg-[#1EB4A1]/40 rounded-t-sm transition-all duration-500 hover:opacity-85" 
                        style={{ height: `${poHeight}%` }}
                        title={`Volume: ${data.po_formatted}`}
                      ></div>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{data.month}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Generated Reports List */}
        <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-bold text-slate-800">Generated Reports</h3>
              <p className="text-[12px] text-slate-500 mt-1">Download live data files (CSV / PDF)</p>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {reportsList.length} Files
            </span>
          </div>
          
          <div className="flex flex-col flex-1 overflow-y-auto max-h-[380px]">
            {loading && !refreshing ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 border-b border-slate-50 last:border-0 flex items-center justify-between">
                  <div className="flex items-start gap-3 min-w-0 pr-2">
                    <Skeleton className="w-4 h-4 rounded mt-0.5 shrink-0" />
                    <div>
                      <Skeleton className="h-4 w-36 mb-1.5" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-3.5 w-12 rounded" />
                        <Skeleton className="h-3.5 w-8 rounded" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  </div>
                  <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                </div>
              ))
            ) : reportsList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-[13px]">
                No generated reports found. Click &quot;Generate Custom&quot; to export data.
              </div>
            ) : null}

            {reportsList.map((report) => (
              <div key={report.id} className="p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors flex items-center justify-between group">
                <div className="flex items-start gap-3 min-w-0 pr-2">
                  <div className="mt-0.5 text-slate-400 shrink-0">
                    <FileText size={16} strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-slate-800 group-hover:text-[#127670] transition-colors truncate">
                      {report.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        {report.type}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#127670] bg-[#1EB4A1]/10 px-1.5 py-0.5 rounded">
                        {report.format || 'CSV'}
                      </span>
                      <span className="text-[11px] text-slate-400">{report.size}</span>
                      <span className="text-[11px] text-slate-400">· {report.date}</span>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleDownload(report.report_code, report.format || 'CSV')}
                  disabled={downloadingCode === report.report_code}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-[#127670] hover:bg-[#1EB4A1]/10 transition-colors cursor-pointer shrink-0"
                  title={`Download ${report.format || 'CSV'}`}
                >
                  {downloadingCode === report.report_code ? (
                    <div className="w-4 h-4 border-2 border-[#127670] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download size={16} strokeWidth={2.5} />
                  )}
                </button>
              </div>
            ))}
          </div>
          
          <div className="p-3 border-t border-slate-100 mt-auto">
            <button 
              onClick={() => setGenerateModalOpen(true)}
              className="w-full py-2 text-[13px] font-semibold text-[#127670] hover:bg-[#1EB4A1]/10 rounded-md transition-colors cursor-pointer"
            >
              + Create New Data Export
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
