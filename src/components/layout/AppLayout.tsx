"use client";

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-full w-full bg-[#F4F7F7] overflow-hidden">
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out md:relative md:translate-x-0 h-full flex-shrink-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "md:w-[72px]" : "md:w-[220px]"
        )}
      >
        <Sidebar onCollapse={() => setIsCollapsed(!isCollapsed)} isCollapsed={isCollapsed} onMobileClose={() => setIsMobileOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
        {/* Mobile Header Toggle & Desktop Collapse Toggle */}
        <div className="md:hidden absolute top-4 left-4 z-30">
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="p-2 bg-white rounded-md shadow-sm border border-slate-200 text-slate-600"
          >
            <Menu size={20} />
          </button>
        </div>
        
        <main className="flex-1 overflow-y-auto h-full">
          {children}
        </main>
      </div>
    </div>
  );
}
