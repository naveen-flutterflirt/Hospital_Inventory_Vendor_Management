"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Plus, ChevronLeft, ChevronRight, 
  LayoutDashboard, Package, FileText, ShoppingCart, 
  CheckSquare, Truck, ArrowLeftRight, Users, 
  CreditCard, Shield, BarChart3, Settings, LogOut, UserCircle2, X 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Items & Stock', href: '/items', icon: Package },
  { name: 'Indents', href: '/indents', icon: FileText },
  { name: 'Purchase Requests', href: '/purchase-requests', icon: ShoppingCart },
  { name: 'RFQ & Quotes', href: '/rfq-quotes', icon: FileText },
  { name: 'Purchase Orders', href: '/purchase-orders', icon: CheckSquare },
  { name: 'GRN & QC', href: '/grn-qc', icon: Truck },
  { name: 'Issues & Transfers', href: '/issues-transfers', icon: ArrowLeftRight },
  { name: 'Vendors', href: '/vendors', icon: Users },
  { name: 'Invoices & Payments', href: '/invoices-payments', icon: CreditCard },
  { name: 'Assets & AMC', href: '/assets-amc', icon: Shield },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar({ onCollapse, isCollapsed, onMobileClose }: { onCollapse?: () => void, isCollapsed?: boolean, onMobileClose?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { showConfirm } = useToast();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    setShowUserMenu(false);
    const confirmed = await showConfirm({
      title: 'Sign Out Confirmation',
      message: 'Are you sure you want to end your current session and sign out of the hospital portal?',
      confirmText: 'Sign Out',
      cancelText: 'Stay Signed In',
      type: 'danger',
    });
    if (confirmed) {
      logout();
    }
  };

  return (
    <aside className="w-full bg-[#0A1B22] text-[#879C9B] flex flex-col h-full flex-shrink-0 font-sans shadow-xl transition-all duration-300 overflow-hidden relative">
      <div className={cn("pt-7 pb-4 transition-all duration-300", isCollapsed ? "px-3" : "px-4")}>
        <div className={cn("flex items-center w-full", isCollapsed ? "justify-center flex-col gap-4" : "justify-between gap-2")}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-[#1EB4A1] text-white min-w-6 w-6 h-6 rounded-[4px] flex items-center justify-center font-bold text-sm shadow-md flex-shrink-0">
              <Plus size={16} strokeWidth={3} />
            </div>
            {!isCollapsed && <span className="font-bold text-[14px] text-white tracking-wide truncate transition-all duration-300">[Hospital] Stores</span>}
          </div>
          <div className="flex items-center gap-1">
            {onCollapse && (
              <button 
                onClick={onCollapse} 
                className="hidden md:flex items-center justify-center w-6 h-6 rounded-full bg-white text-slate-800 hover:bg-slate-200 transition-colors shadow-sm flex-shrink-0 cursor-pointer"
              >
                {isCollapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
              </button>
            )}
            {onMobileClose && (
              <button 
                type="button"
                onClick={onMobileClose}
                className="md:hidden flex items-center justify-center w-7 h-7 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close navigation"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-2 scrollbar-none px-3">
        <ul className="space-y-[2px]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={() => {
                    if (onMobileClose) onMobileClose();
                  }}
                  className={cn(
                    "flex items-center transition-all duration-200 cursor-pointer rounded-md group whitespace-nowrap",
                    isCollapsed ? "justify-center p-2 mb-1" : "px-3 py-2 gap-3",
                    isActive 
                      ? "bg-[#16383e] text-white font-medium shadow-sm" 
                      : "text-[#879C9B] hover:bg-[#112d35] hover:text-white"
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon size={isCollapsed ? 20 : 16} className={cn("flex-shrink-0 transition-transform duration-200", !isActive && "group-hover:scale-110")} />
                  {!isCollapsed && <span className="text-[13px]">{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User profile popup menu */}
      {showUserMenu && (
        <div className={cn(
          "absolute bottom-16 bg-[#0E2827] border border-white/15 rounded-xl shadow-2xl p-3 z-50 text-white animate-in fade-in slide-in-from-bottom-2",
          isCollapsed ? "left-2 w-56" : "left-3 right-3"
        )}>
          <div className="flex items-center gap-2.5 pb-2.5 mb-2.5 border-b border-white/10">
            <div className="w-8 h-8 rounded-full bg-[#1EB4A1] text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
              {user?.avatarInitials || "RS"}
            </div>
            <div className="overflow-hidden">
              <div className="text-[13px] font-bold text-white truncate">{user?.name || "Dr. Rajesh Sharma"}</div>
              <div className="text-[11px] text-[#8DCAC1] truncate">{user?.role || "Chief Procurement Officer"}</div>
            </div>
          </div>

          <div className="space-y-1">
            <Link
              href="/settings"
              onClick={() => setShowUserMenu(false)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12px] text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <UserCircle2 size={14} className="text-[#1EB4A1]" />
              Account Settings
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12px] text-rose-300 hover:text-rose-100 hover:bg-rose-500/20 transition-colors cursor-pointer text-left"
            >
              <LogOut size={14} />
              Sign Out to Login
            </button>
          </div>
        </div>
      )}

      {/* Bottom User Profile Section */}
      <div className={cn("pb-5 mt-auto transition-all duration-300", isCollapsed ? "p-3 flex justify-center" : "p-3 px-3")}>
        <div 
          onClick={() => setShowUserMenu(!showUserMenu)}
          className={cn(
            "flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white/5 transition-all cursor-pointer group border border-transparent hover:border-white/10",
            isCollapsed && "justify-center"
          )}
          title={isCollapsed ? `${user?.name || 'Dr. Rajesh Sharma'} (Click for menu)` : undefined}
        >
          <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-tr from-[#125F5C] to-[#1EB4A1] flex items-center justify-center text-white font-bold text-xs shadow-md border border-white/20 group-hover:scale-105 transition-transform">
            {user?.avatarInitials || "RS"}
          </div>

          {!isCollapsed && (
            <div className="flex-1 overflow-hidden leading-tight">
              <p className="text-[12px] font-bold text-white truncate">{user?.name || "Dr. Rajesh Sharma"}</p>
              <p className="text-[10px] text-[#879C9B] truncate">{user?.role || "Chief Procurement"}</p>
            </div>
          )}

          {!isCollapsed && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                logout();
              }}
              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
