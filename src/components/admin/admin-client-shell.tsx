'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/admin/sidebar';
import Header from '@/components/admin/header';
import { UserSession } from '@/lib/auth';

interface AdminClientShellProps {
  session: UserSession;
  siteName: string;
  children: React.ReactNode;
}

export default function AdminClientShell({ session, siteName, children }: AdminClientShellProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans relative">
      {/* Mobile Backdrop overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 z-20 md:hidden backdrop-blur-sm" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      {/* Sidebar navigation */}
      <div className={`fixed inset-y-0 left-0 transform ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition duration-300 ease-in-out z-30 shadow-xl md:shadow-none`}>
        <Sidebar session={session} siteName={siteName} onMobileClose={() => setIsMobileOpen(false)} />
      </div>

      {/* Main workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header session={session} siteName={siteName} onMobileMenuClick={() => setIsMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
