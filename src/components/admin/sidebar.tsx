'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserSession } from '@/lib/auth';
import {
  LayoutDashboard,
  FileText,
  Files,
  FolderOpen,
  Image,
  Shuffle,
  Settings,
  Sparkles,
  Menu,
  UserCircle,
  Type,
  Search,
  HelpCircle,
  Layers,
  CheckSquare
} from 'lucide-react';

interface SidebarProps {
  session: UserSession;
}

export default function Sidebar({ session }: SidebarProps) {
  const pathname = usePathname();

  const isSuperAdminOrEditor = session.role === 'Super Admin' || session.role === 'Editor';

  const menuItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, show: true },
    { label: 'Posts', href: '/admin/posts', icon: FileText, show: true },
    { label: 'Editorial Queue', href: '/admin/editorial', icon: CheckSquare, show: isSuperAdminOrEditor },
    { label: 'Pages', href: '/admin/pages', icon: Files, show: isSuperAdminOrEditor },
    { label: 'Categories & Tags', href: '/admin/categories', icon: FolderOpen, show: isSuperAdminOrEditor },
    { label: 'Media Library', href: '/admin/media', icon: Image, show: true },
    { label: 'Navigation', href: '/admin/navigation', icon: Menu, show: isSuperAdminOrEditor },
    { label: 'Knowledge Base', href: '/admin/kb', icon: HelpCircle, show: true },
    { label: 'Software Directory', href: '/admin/software', icon: Layers, show: isSuperAdminOrEditor },
    { label: '301 Redirects', href: '/admin/redirects', icon: Shuffle, show: isSuperAdminOrEditor },
    { label: 'SEO Center', href: '/admin/seo', icon: Search, show: isSuperAdminOrEditor },
    { label: 'Settings', href: '/admin/settings', icon: Settings, show: isSuperAdminOrEditor },
    { label: 'Typography', href: '/admin/settings/typography', icon: Type, show: isSuperAdminOrEditor },
    { label: 'My Profile', href: '/admin/profile', icon: UserCircle, show: true },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col h-full z-20">
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-slate-200/80 flex items-center gap-2">
        <div className="bg-orange-500 text-white p-1.5 rounded-lg">
          <Sparkles className="h-5 w-5" />
        </div>
        <span className="font-bold text-slate-900 tracking-tight text-lg">AppLuxe CMS</span>
      </div>

      {/* Menu links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {menuItems
          .filter(item => item.show)
          .map((item) => {
            const Icon = item.icon;
            // Check if current path matches item href (exact match for dashboard and general settings, prefix match for others)
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : item.href === '/admin/settings'
                  ? pathname === '/admin/settings'
                  : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-orange-50 text-orange-600 shadow-sm border border-orange-100/50'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950 border border-transparent'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-orange-600' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}
      </nav>

      {/* User Session card in sidebar footer */}
      <div className="p-4 border-t border-slate-200/80 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-sm">
            {session.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-800 truncate">{session.name}</p>
            <p className="text-[10px] text-slate-500 font-medium truncate uppercase tracking-wider">{session.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
