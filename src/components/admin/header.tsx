'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserSession } from '@/lib/auth';
import { Button, buttonVariants } from '@/components/ui/button';
import { LogOut, ExternalLink, Menu, Bell, Loader2 } from 'lucide-react';

interface HeaderProps {
  session: UserSession;
  siteName?: string;
}

export default function Header({ session, siteName = 'System' }: HeaderProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/admin/login');
        router.refresh();
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 md:px-8 flex items-center justify-between z-10">
      {/* Search / Breadcrumbs placeholder */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5 text-slate-600" />
        </Button>
        <span className="text-slate-400 text-sm hidden md:inline">Workspace / {siteName} Hub</span>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-3">
        {/* View blog link */}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline", size: "sm", className: "border-slate-200 text-slate-700 hover:text-slate-900 flex items-center gap-1.5 h-9" })}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View Site
        </a>

        {/* Notifications placeholder */}
        <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500 hover:text-slate-900 relative">
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-orange-500 rounded-full" />
        </Button>

        <div className="h-5 w-px bg-slate-200 mx-1" />

        {/* Logout button */}
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-600 hover:text-red-600 hover:bg-red-50 flex items-center gap-1.5 h-9"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <LogOut className="h-3.5 w-3.5" />
          )}
          Sign Out
        </Button>
      </div>
    </header>
  );
}
