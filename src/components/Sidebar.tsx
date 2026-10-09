"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Plus, ChevronLeft, ChevronRight, 
  LayoutDashboard, Package, FileText, ShoppingCart, 
  CheckSquare, Truck, ArrowLeftRight, Users, 
  CreditCard, Shield, BarChart3, Settings 
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

  return (
    <aside className="w-full bg-[#0A1B22] text-[#879C9B] flex flex-col h-full flex-shrink-0 font-sans shadow-xl transition-all duration-300 overflow-hidden">
      <div className={cn("pt-7 pb-4 transition-all duration-300", isCollapsed ? "px-3" : "px-4")}>
        <div className={cn("flex items-center w-full", isCollapsed ? "justify-center flex-col gap-4" : "justify-between gap-2")}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-[#1EB4A1] text-white min-w-6 w-6 h-6 rounded-[4px] flex items-center justify-center font-bold text-sm shadow-md flex-shrink-0">
              <Plus size={16} strokeWidth={3} />
            </div>
            {!isCollapsed && <span className="font-bold text-[14px] text-white tracking-wide truncate transition-all duration-300">[Hospital] Stores</span>}
          </div>
          {onCollapse && (
            <button 
              onClick={onCollapse} 
              className="hidden md:flex items-center justify-center w-6 h-6 rounded-full bg-white text-slate-800 hover:bg-slate-200 transition-colors shadow-sm flex-shrink-0"
            >
              {isCollapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
            </button>
          )}
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

      <div className={cn("pb-6 mt-auto transition-all duration-300", isCollapsed ? "p-3 flex justify-center" : "p-4 px-5")}>
        <div className="w-8 h-8 flex-shrink-0 rounded-full bg-black flex items-center justify-center text-white font-medium text-sm cursor-pointer hover:bg-gray-900 transition-colors shadow-md border border-white/10 hover:border-white/20">
          N
        </div>
      </div>
    </aside>
  );
}
