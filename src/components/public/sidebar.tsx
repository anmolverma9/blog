import React from 'react';
import Link from 'next/link';
import { Newspaper, LayoutGrid, Search } from 'lucide-react';
import { settingsService } from '@/modules/settings';

interface SidebarProps {
  categories: Array<{ id?: number; name: string; slug: string }>;
  recentPosts: Array<{ id?: number; title: string; slug: string; published_at?: string | null }>;
}

export default async function Sidebar({ categories, recentPosts }: SidebarProps) {
  let siteName = 'Blog';
  try {
    const settings = await settingsService.getSettings();
    siteName = settings.site_name || 'Blog';
  } catch (e) {
    console.error('Failed to load settings in sidebar:', e);
  }

  return (
    <aside className="space-y-8 sticky top-20">
      {/* 1. Search Widget */}
      <div className="space-y-4">
        {/* Header Badge */}
        <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-black uppercase tracking-wider shadow-sm">
          <Search className="h-3.5 w-3.5" />
          Search
        </div>
        
        {/* Search Input & Button Form */}
        <form action="/search" method="GET" className="flex items-center gap-2">
          <input
            name="q"
            placeholder="Search articles..."
            className="flex-1 h-10 px-4 rounded-full border border-slate-200 bg-white text-sm focus:outline-none focus:border-orange-500 transition-colors"
            required
          />
          <button
            type="submit"
            className="h-10 px-5 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold transition-all shadow-md shadow-orange-600/10 shrink-0"
          >
            Search
          </button>
        </form>
      </div>

      {/* 2. Recent Posts Widget */}
      <div className="space-y-4">
        {/* Header Badge */}
        <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-black uppercase tracking-wider shadow-sm">
          <Newspaper className="h-3.5 w-3.5" />
          Recent Posts
        </div>

        {/* List of Recent Posts */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3.5">
          {recentPosts.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No recent posts yet.</p>
          ) : (
            recentPosts.map((post) => (
              <div key={post.id ?? post.slug} className="flex gap-2.5 items-start text-sm border-b border-slate-50 last:border-0 pb-3 last:pb-0">
                <Newspaper className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <Link
                    href={`/${post.slug}`}
                    className="font-bold text-slate-800 hover:text-orange-600 transition-colors line-clamp-2 leading-relaxed"
                  >
                    {post.title}
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. Categories Widget */}
      <div className="space-y-4">
        {/* Header Badge */}
        <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-black uppercase tracking-wider shadow-sm">
          <LayoutGrid className="h-3.5 w-3.5" />
          Categories
        </div>

        {/* List of Categories */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-1">
          {categories.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No categories yet.</p>
          ) : (
            categories
              .filter(cat => cat.slug !== 'all') // exclude helper category if any
              .map((cat) => (
                <Link
                  key={cat.id ?? cat.slug}
                  href={`/posts?category=${cat.slug}`}
                  className="flex items-center gap-2.5 text-sm font-bold text-slate-700 hover:text-orange-600 transition-colors py-2.5 border-b border-slate-50 last:border-0"
                >
                  <LayoutGrid className="h-4 w-4 text-slate-400" />
                  {cat.name}
                </Link>
              ))
          )}
        </div>
      </div>
    </aside>
  );
}
