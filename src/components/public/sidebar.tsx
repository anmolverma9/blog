import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Folder, Eye } from 'lucide-react';

import SidebarNewsletter from './sidebar-newsletter';

interface SidebarProps {
  categories: Array<{ id?: number; name: string; slug: string }>;
  trendingPosts: Array<{ id?: number; title: string; slug: string; views?: number }>;
}

export default function Sidebar({ categories, trendingPosts }: SidebarProps) {
  return (
    <aside className="space-y-6">
      {/* 1. About / Ecosystem Widget */}
      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        <div className="h-2.5 bg-orange-500" />
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800">
            About AppLuxe
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-slate-500 leading-relaxed space-y-2.5">
          <p>
            Welcome to the AppLuxe blog hub! We write about scaling SaaS companies, code architectures, database designs, and marketing automation.
          </p>
          <p className="font-semibold text-slate-700">
            This blog is Phase 1 of a larger modular SaaS ecosystem that includes Helpdesk, Ad Network, and Marketplace.
          </p>
        </CardContent>
      </Card>

      {/* Newsletter Widget */}
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Newsletter Signup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <p className="text-slate-500 text-xs leading-relaxed">
            Get premium articles on SaaS development, SEO tips, and CMS optimizations.
          </p>
          <SidebarNewsletter />
        </CardContent>
      </Card>

      {/* 2. Trending Posts Widget */}
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Trending Articles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {trendingPosts.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No trending posts yet.</p>
          ) : (
            trendingPosts.map((post) => (
              <div key={post.id ?? post.slug} className="group flex gap-2.5 text-xs">
                <FileText className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <Link
                    href={`/posts/${post.slug}`}
                    className="font-semibold text-slate-700 group-hover:text-orange-500 transition-colors line-clamp-2"
                  >
                    {post.title}
                  </Link>
                  <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {(post.views ?? 0).toLocaleString()} views
                  </p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* 3. Categories Widget */}
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Categories
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {categories.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No categories yet.</p>
          ) : (
            categories.map((cat) => (
              <Link
                key={cat.id ?? cat.slug}
                href={`/posts?category=${cat.slug}`}
                className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-orange-500 transition-colors py-1 border-b border-slate-50 last:border-0"
              >
                <Folder className="h-3.5 w-3.5 text-slate-400" />
                {cat.name}
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </aside>
  );
}
