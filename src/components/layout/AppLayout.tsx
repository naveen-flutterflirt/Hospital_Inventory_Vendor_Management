"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Menu, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  // Route protection: If unauthenticated and not on /login, redirect to /login
  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== '/login') {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  // If on login page, render clean full-screen view without sidebar
  if (pathname === '/login') {
    return <main className="h-full w-full overflow-y-auto">{children}</main>;
  }

  return (
    <div className="flex h-full w-full bg-[#F4F7F7] overflow-hidden relative">
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
          "fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out md:relative md:translate-x-0 h-full flex-shrink-0 w-[260px] max-w-[85vw]",
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
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className="p-2 bg-white rounded-md shadow-sm border border-slate-200 text-slate-600 cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>
        
        <main id="main-content" className="flex-1 overflow-y-auto h-full scroll-smooth overscroll-contain">
          {children}
        </main>
      </div>

      {/* Auth loading or redirecting backdrop overlay if not authenticated */}
      {(!isAuthenticated || isLoading) && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#08181E] text-white">
          <div className="w-12 h-12 rounded-xl bg-[#1EB4A1] flex items-center justify-center font-bold text-xl shadow-lg mb-4 animate-pulse">
            <Plus size={24} strokeWidth={3} />
          </div>
          <p className="text-[14px] font-semibold text-slate-300">Authenticating Hospital Console...</p>
        </div>
      )}
    </div>
  );
}
