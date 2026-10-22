"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, ChevronDown, Plus, ScanLine, Bell, 
  Check, ShieldAlert, FileText, CheckCircle2, Activity, X, Loader2,
  Building2, Globe
} from 'lucide-react';
import NewIndentModal from './NewIndentModal';
import ScanDeliveryModal from './ScanDeliveryModal';
import { cn } from '@/lib/utils';
import { api, NotificationItem } from '@/lib/api';
import { useStore } from '@/context/StoreContext';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  hideNewIndent?: boolean;
}

const fallbackNotifications: NotificationItem[] = [
  {
    id: 1,
    title: 'ICU Buffer Stockout Alert',
    desc: 'Meropenem 1g Inj fell below safety threshold (8 vials left in ICU store). Immediate re-order recommended.',
    time: '12m ago',
    type: 'critical',
    category: 'inventory',
    link: '/items',
    read: false,
  },
  {
    id: 2,
    title: 'PO Authorization Required',
    desc: 'PR-2026-089 (₹1.85L) awaiting CPO digital signature approval for emergency surgical sutures.',
    time: '45m ago',
    type: 'warning',
    category: 'procurement',
    link: '/purchase-orders',
    read: false,
  },
  {
    id: 3,
    title: 'GRN Inspection Released',
    desc: 'Batch #B-9021 passed cold-chain assay and quarantine release into Central Pharmacy formulary.',
    time: '2h ago',
    type: 'success',
    category: 'quality',
    link: '/grn-qc',
    read: false,
  },
  {
    id: 4,
    title: 'Cold-Chain Telemetry Stable',
    desc: 'Main biological vaccine refrigerator telemetry verified stable at 3.8°C with zero drift.',
    time: '4h ago',
    type: 'info',
    category: 'telemetry',
    link: '/assets-amc',
    read: true,
  },
];

export default function Header({ title = 'Inventory overview', subtitle, hideNewIndent = false }: HeaderProps) {
  const router = useRouter();

  const [storeOpen, setStoreOpen] = useState(false);
  const { stores, activeStore, setActiveStore, getStoreDisplayName } = useStore();
  const [isIndentModalOpen, setIsIndentModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const storeDropdownRef = useRef<HTMLDivElement>(null);
  const notificationsDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click or page scroll without blocking mouse wheel/touch
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (storeDropdownRef.current && !storeDropdownRef.current.contains(event.target as Node)) {
        setStoreOpen(false);
      }
      if (notificationsDropdownRef.current && !notificationsDropdownRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }

    function handleScroll(e: Event) {
      const target = e.target as HTMLElement;
      // If scroll is inside the open dropdown menu itself, allow it to scroll
      if (storeDropdownRef.current && storeDropdownRef.current.contains(target)) {
        return;
      }
      if (notificationsDropdownRef.current && notificationsDropdownRef.current.contains(target)) {
        return;
      }
      // When page scrolls, auto-close floating menus
      setStoreOpen(false);
      setNotificationsOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  // Dynamic Navbar Notifications State
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(fallbackNotifications);
  const [unreadCount, setUnreadCount] = useState<number>(3);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  // Fetch notifications from live PostgreSQL API
  const fetchNotifications = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const response = await api.notifications.getNotifications();
      if (response.success && response.data) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unread_count ?? 0);
      }
    } catch (error) {
      console.warn('Live notifications fetch fallback:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  // Initial load and periodic polling every 45s for real-time telemetry alerts
  useEffect(() => {
    fetchNotifications(true);

    const intervalId = setInterval(() => {
      fetchNotifications(false);
    }, 45000);

    return () => clearInterval(intervalId);
  }, [fetchNotifications]);

  // Mark all alerts as read
  const markAllRead = async () => {
    setMarkingAll(true);
    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      await api.notifications.markAllRead();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      // Re-fetch in case of failure
      fetchNotifications(false);
    } finally {
      setMarkingAll(false);
    }
  };

  // Mark a single notification as read & navigate to target module
  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.read) {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await api.notifications.markAsRead(item.id);
      } catch (err) {
        console.error('Failed to mark notification read:', err);
      }
    }

    // If notification has a deep link, close dropdown and navigate
    if (item.link) {
      setNotificationsOpen(false);
      router.push(item.link);
    }
  };

  const defaultSubtitle = `All stores · Central Campus & Sub-stores`;

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 relative z-50" suppressHydrationWarning>
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">{title}</h1>
        <p className="text-[13px] text-slate-500 mt-1 font-medium">
          {subtitle || defaultSubtitle}
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto" suppressHydrationWarning>
        {/* Global Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search item, batch, PO, vendor..." 
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-md text-[13px] w-full focus:outline-none focus:ring-2 focus:ring-[#127670]/20 focus:border-[#127670] shadow-sm placeholder-slate-400 font-medium bg-white"
          />
        </div>
        
        {/* Controls row */}
        <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-between sm:justify-start">
          {/* Store Selection Dropdown */}
          <div ref={storeDropdownRef} className="relative flex-1 sm:flex-none">
            <button 
              type="button"
              onClick={() => setStoreOpen(!storeOpen)} 
              className="w-full sm:w-auto flex justify-center items-center gap-1 sm:gap-2 border border-slate-200 bg-white px-2.5 sm:px-3 py-2 rounded-md text-[12px] sm:text-[13px] font-semibold hover:bg-slate-50 cursor-pointer transition-colors shadow-sm text-slate-700"
            >
              <span className="truncate max-w-[85px] sm:max-w-none">Store: {getStoreDisplayName(activeStore)}</span>
              <ChevronDown size={14} className="text-slate-500 shrink-0" />
            </button>
            
            {storeOpen && (
              <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-1 w-72 sm:w-80 bg-white border border-slate-200 shadow-2xl rounded-xl overflow-hidden z-50 py-1.5 text-[13px] animate-in fade-in zoom-in-95 max-h-[min(420px,80vh)] flex flex-col">
                <div className="px-3.5 py-2 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                    <div>
                      <p className="text-[12px] font-bold text-slate-800">Switch Inventory Store</p>
                      <p className="text-[10px] text-slate-500">Filters stock, indents &amp; FEFO batches</p>
                    </div>
                    <span className="text-[10px] font-bold bg-teal-100 text-[#127670] px-2 py-0.5 rounded-full">
                      {stores.length} Stores
                    </span>
                  </div>

                  {/* All Stores Option */}
                  <div 
                    onClick={() => { setActiveStore('All'); setStoreOpen(false); }}
                    className={cn(
                      "px-3.5 py-2.5 hover:bg-slate-50 cursor-pointer font-medium flex items-center justify-between transition-colors border-b border-slate-100",
                      activeStore === 'All' ? "text-[#127670] bg-teal-50/50 font-bold" : "text-slate-700"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                        <Globe size={14} />
                      </div>
                      <div>
                        <p className="text-[12px] font-bold">All Stores (Multi-Store Campus)</p>
                        <p className="text-[10px] text-slate-400">Aggregated Central &amp; Sub-store view</p>
                      </div>
                    </div>
                    {activeStore === 'All' && <Check size={14} className="text-[#127670] shrink-0" />}
                  </div>

                  {/* Real Database Stores List */}
                  <div className="flex-1 overflow-y-auto overscroll-contain divide-y divide-slate-100">
                    {stores.map(st => {
                      const isSelected = activeStore === st.name || activeStore === st.code;
                      const typeColor = 
                        st.store_type === 'Pharmacy' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                        st.store_type === 'Central' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        st.store_type === 'ICU' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        st.store_type === 'OT' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-slate-100 text-slate-700 border-slate-200';

                      return (
                        <div 
                          key={st.id}
                          onClick={() => { setActiveStore(st.name); setStoreOpen(false); }}
                          className={cn(
                            "px-3.5 py-2.5 hover:bg-slate-50 cursor-pointer font-medium flex items-center justify-between transition-colors",
                            isSelected ? "text-[#127670] bg-teal-50/60 font-bold" : "text-slate-700"
                          )}
                        >
                          <div className="flex items-start gap-2.5 min-w-0 pr-2">
                            <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center text-[#127670] mt-0.5 shrink-0">
                              <Building2 size={13} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-[12px] font-bold truncate text-slate-800">{st.name}</p>
                                <span className={cn("text-[9px] font-bold px-1.5 py-0.2 rounded border", typeColor)}>
                                  {st.store_type}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {st.branch} · {st.total_stock?.toLocaleString() || 0} units
                              </p>
                            </div>
                          </div>
                          {isSelected && <Check size={14} className="text-[#127670] shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
            )}
          </div>

          {/* Scan Button */}
          <button 
            type="button"
            onClick={() => setIsScanModalOpen(true)} 
            className="flex items-center gap-1 sm:gap-1.5 border border-slate-200 bg-white px-2.5 sm:px-3.5 py-2 rounded-md text-[12px] sm:text-[13px] font-semibold hover:bg-slate-50 cursor-pointer transition-colors shadow-sm text-slate-700 shrink-0"
          >
            <ScanLine size={15} className="text-[#127670]" /> 
            <span>Scan</span>
          </button>

          {/* Dynamic Navbar Notifications Bell */}
          <div ref={notificationsDropdownRef} className="relative shrink-0" suppressHydrationWarning>
            <button
              type="button"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className={cn(
                "relative p-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-sm cursor-pointer",
                notificationsOpen && "bg-slate-100 text-[#127670] border-[#127670]/30"
              )}
              title="Hospital Notifications & Telemetry Alerts"
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-sm">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Popover Dropdown */}
            {notificationsOpen && (
              <div className="fixed inset-x-3 top-20 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 bg-white border border-slate-200 shadow-2xl rounded-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 max-h-[82vh] flex flex-col">
                  {/* Header */}
                  <div className="p-3 sm:p-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[13px] sm:text-[14px] text-slate-800">Hospital Notifications</span>
                      {unreadCount > 0 ? (
                        <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {unreadCount} unread
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          All clear
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllRead}
                          disabled={markingAll}
                          className="text-[11px] font-semibold text-[#127670] hover:underline cursor-pointer flex items-center gap-1 disabled:opacity-50"
                        >
                          {markingAll ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Check size={12} />
                          )}
                          Mark all read
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setNotificationsOpen(false)}
                        className="sm:hidden p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
                        title="Close notifications"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Notification Items List */}
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[60vh] sm:max-h-80">
                    {loading && notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                        <Loader2 size={24} className="text-[#127670] animate-spin" />
                        <span className="text-[12px]">Connecting to hospital telemetry...</span>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400">
                        <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2 opacity-80" />
                        <p className="text-[13px] font-semibold text-slate-700">No new alerts</p>
                        <p className="text-[11px] text-slate-400 mt-1">All clinical inventory thresholds and supply pipelines are operating normally.</p>
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleNotificationClick(item)}
                          className={cn(
                            "p-3 sm:p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-2.5 sm:gap-3 group relative",
                            !item.read ? "bg-teal-50/25" : "bg-white"
                          )}
                        >
                          <div className="mt-0.5 flex-shrink-0">
                            {item.type === 'critical' && <ShieldAlert size={16} className="text-rose-600" />}
                            {item.type === 'warning' && <FileText size={16} className="text-amber-600" />}
                            {item.type === 'success' && <CheckCircle2 size={16} className="text-emerald-600" />}
                            {item.type === 'info' && <Activity size={16} className="text-[#127670]" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className={cn("text-[12px] truncate", !item.read ? "font-bold text-slate-900 group-hover:text-[#127670]" : "font-medium text-slate-700")}>
                                {item.title}
                              </p>
                              <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">{item.time}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">
                              {item.desc}
                            </p>
                            {item.link && (
                              <span className="inline-block mt-1 text-[10px] font-semibold text-[#127670] group-hover:underline">
                                View details &rarr;
                              </span>
                            )}
                          </div>

                          {!item.read && (
                            <span className="w-2 h-2 rounded-full bg-[#127670] mt-1.5 flex-shrink-0 animate-pulse" />
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-2 border-t border-slate-100 bg-slate-50 text-center flex items-center justify-center gap-1.5 flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[11px] font-medium text-slate-500">Live Hospital Telemetry Active</span>
                  </div>
                </div>
            )}
          </div>
          
          {/* New Indent Button */}
          {!hideNewIndent && (
            <button 
              type="button"
              onClick={() => setIsIndentModalOpen(true)} 
              className="flex items-center gap-1 sm:gap-1.5 bg-[#127670] text-white px-2.5 sm:px-4 py-2 rounded-md text-[12px] sm:text-[13px] font-semibold hover:bg-[#0f605b] cursor-pointer transition-colors shadow-sm whitespace-nowrap shrink-0"
            >
              <Plus size={15} /> 
              <span>New indent</span>
            </button>
          )}
        </div>
      </div>

      <NewIndentModal 
        isOpen={isIndentModalOpen} 
        onClose={() => setIsIndentModalOpen(false)} 
      />

      <ScanDeliveryModal 
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
      />
    </div>
  );
}
