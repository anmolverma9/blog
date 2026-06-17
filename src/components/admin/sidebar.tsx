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
  Users,
  Type,
  Search,
  HelpCircle,
  Layers,
  CheckSquare,
  Database
} from 'lucide-react';

interface SidebarProps {
  session: UserSession;
  siteName?: string;
  onMobileClose?: () => void;
}

export default function Sidebar({ session, siteName = 'System', onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  // Helper to check permissions safely
  const hasPerm = (perm: string) => {
    if (session.role === 'Super Admin') return true;
    return Array.isArray(session.permissions) && session.permissions.includes(perm);
  };

  const isSubscriber = session.role === 'Subscriber' || session.role === 'Reader';

  const menuItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, show: !isSubscriber },
    { label: 'Posts', href: '/admin/posts', icon: FileText, show: hasPerm('create_posts') || hasPerm('edit_posts') },
    { label: 'Editorial Queue', href: '/admin/editorial', icon: CheckSquare, show: hasPerm('publish_posts') },
    { label: 'Pages', href: '/admin/pages', icon: Files, show: hasPerm('manage_pages') },
    { label: 'Categories & Tags', href: '/admin/categories', icon: FolderOpen, show: hasPerm('manage_categories') },
    { label: 'Media Library', href: '/admin/media', icon: Image, show: hasPerm('manage_media') },
    { label: 'Users & Roles', href: '/admin/users', icon: Users, show: hasPerm('manage_users') },
    { label: 'Navigation', href: '/admin/navigation', icon: Menu, show: hasPerm('manage_pages') },
    { label: '301 Redirects', href: '/admin/redirects', icon: Shuffle, show: hasPerm('manage_redirects') },
    { label: 'SEO Center', href: '/admin/seo', icon: Search, show: hasPerm('manage_seo') },
    { label: 'Import WP', href: '/admin/import', icon: Database, show: hasPerm('manage_settings') },
    { label: 'Settings', href: '/admin/settings', icon: Settings, show: hasPerm('manage_settings') },
    { label: 'Typography', href: '/admin/settings/typography', icon: Type, show: hasPerm('manage_settings') },
    { label: 'My Profile', href: '/admin/profile', icon: UserCircle, show: true },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col h-full z-20">
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-slate-200/80 flex items-center gap-2">
        <div className="bg-orange-500 text-white p-1.5 rounded-lg">
          <Sparkles className="h-5 w-5" />
        </div>
        <span className="font-bold text-slate-900 tracking-tight text-lg">{siteName} CMS</span>
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
                onClick={onMobileClose}
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
