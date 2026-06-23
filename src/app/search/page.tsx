import React from 'react';
import Link from 'next/link';
import LayoutWrapper from '@/components/public/layout-wrapper';
import Sidebar from '@/components/public/sidebar';
import { postService } from '@/modules/posts';
import { categoryService } from '@/modules/categories';
import { buttonVariants } from '@/components/ui/button';
import { BookOpen, Clock, Eye, HelpCircle } from 'lucide-react';

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export const revalidate = 0; // Dynamic server rendering

export default async function SearchResultsPage({ searchParams }: SearchPageProps) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || '';

  // Query database using search — newest first
  const { posts, total } = await postService.getPosts({
    status: 'published',
    search: query || undefined,
    orderBy: 'published_at',
    limit: 10,
  });

  // Sidebar details — latest posts
  const { posts: trending } = await postService.getPosts({
    status: 'published',
    orderBy: 'published_at',
    limit: 10,
  });
  const categoriesList = await categoryService.getAllCategories();

  return (
    <LayoutWrapper>
      <div className="editorial-container py-10 space-y-8 animate-in fade-in duration-300">
        {/* Banner */}
        <div className="bg-slate-900 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-sm">
          <div className="absolute -top-[20%] -right-[10%] w-64 h-64 bg-orange-500 rounded-full blur-3xl opacity-20" />
          <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Search Results Workspace</span>
          <h1 className="text-2xl font-bold mt-1">
            {query ? `Search Results for: "${query}"` : 'Please enter a search query'}
          </h1>
          <p className="text-xs text-slate-300 mt-1">Found {total} matched article(s)</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6">
            {posts.length === 0 ? (
              <div className="text-center py-20 bg-white border border-dashed rounded-2xl text-slate-400">
                <HelpCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="font-semibold text-slate-600 text-sm">No matched results</p>
                <p className="text-xs mt-1">Try testing other keywords like SaaS, Database, or code patterns.</p>
                <Link href="/posts" className={buttonVariants({ variant: "outline", size: "sm", className: "mt-4 border-slate-200 text-slate-600" })}>
                  Browse all articles
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow hover:border-orange-100/50 transition-all flex gap-4">
                    <div className="w-24 md:w-32 aspect-video bg-slate-50 rounded-lg overflow-hidden shrink-0">
                      {post.featured_image_path ? (
                        <img src={post.featured_image_path} alt={post.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <BookOpen className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-orange-500 uppercase">{post.category_name || 'General'}</span>
                        <h3 className="font-bold text-slate-900 text-sm md:text-base hover:text-orange-500 transition-colors truncate mt-0.5">
                          <Link href={`/${post.slug}`}>{post.title}</Link>
                        </h3>
                        <p className="text-slate-500 text-xs line-clamp-1 mt-1 leading-normal">{post.summary}</p>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-slate-50">
                        <span>By {post.author_name}</span>
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {(post.views ?? 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Sidebar categories={categoriesList} recentPosts={trending} />
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}
