import React from 'react';
import Link from 'next/link';
import LayoutWrapper from '@/components/public/layout-wrapper';
import Sidebar from '@/components/public/sidebar';
import HeroSlider from '@/components/public/hero-slider';
import { postService } from '@/modules/posts';
import { categoryService } from '@/modules/categories';
import { buttonVariants } from '@/components/ui/button';
import { ArrowUpRight, Calendar, User, Eye, BookOpen, Clock } from 'lucide-react';

export const revalidate = 0; // Dynamic server rendering

const generatePagination = (currentPage: number, totalPages: number) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }).map((_, i) => i + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, '...', totalPages - 1, totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, 2, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function Homepage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentPage = parseInt(params.page || '1', 10);
  
  // 1. Fetch Categories
  const categories = await categoryService.getAllCategories();

  // 2. Fetch Latest Published Posts (up to 50 for in-memory slicing)
  const { posts: allPosts } = await postService.getPosts({
    status: 'published',
    limit: 50,
  });

  // 3. Fetch Trending Posts for "You Missed" section
  const { posts: trending } = await postService.getPosts({
    status: 'published',
    orderBy: 'random',
    limit: 10,
  });

  // Slices for Hero Section
  const sliderPosts = allPosts.slice(0, 5); // Center: 5 posts in slider
  const leftStackedPosts = allPosts.slice(4, 6); // Left: next 2 posts
  const rightListPosts = allPosts.slice(0, 4); // Right: list of 4 recent posts

  // Paginated Feed Configuration
  const feedLimit = 4;
  const feedOffset = (currentPage - 1) * feedLimit;
  const feedPosts = allPosts.slice(feedOffset, feedOffset + feedLimit);
  const totalFeedPosts = allPosts.length;
  const totalPages = Math.ceil(totalFeedPosts / feedLimit);

  // Sidebar recent posts (top 5 recent)
  const recentPostsForSidebar = allPosts.slice(0, 5);

  return (
    <LayoutWrapper>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-12">
        
        {/* ========================================================
            1. HERO SECTION (3 Columns: Stacked, Slider, Thumbnail List)
           ======================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Column A: Left Stack (2 posts) */}
          <div className="lg:col-span-3 flex flex-col gap-6 justify-between">
            {leftStackedPosts.length === 0 ? (
              <div className="flex-1 min-h-[180px] bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400 text-sm italic">
                No stories loaded
              </div>
            ) : (
              leftStackedPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex-1 min-h-[188px] relative rounded-3xl overflow-hidden shadow-sm group bg-slate-900 border border-slate-100"
                >
                  {/* Background Image */}
                  {post.featured_image_path ? (
                    <img
                      src={post.featured_image_path}
                      alt={post.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-slate-800" />
                  )}
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
                  
                  {/* Text Details */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 space-y-2 text-white z-10">
                    {post.category_name && (
                      <span className="inline-block bg-orange-600 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded">
                        {post.category_name}
                      </span>
                    )}
                    <h3 className="font-bold text-sm sm:text-base leading-snug line-clamp-2 hover:underline">
                      <Link href={`/${post.slug}`}>{post.title}</Link>
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
                      <span className="truncate">By {post.author_name}</span>
                      <span>•</span>
                      <span>{post.published_at ? new Date(post.published_at).toLocaleDateString(undefined, { dateStyle: 'short' }) : ''}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Column B: Center Slider (5 posts) */}
          <div className="lg:col-span-6 flex flex-col justify-stretch">
            <HeroSlider posts={sliderPosts} />
          </div>

          {/* Column C: Right List (4 posts with thumbnails on right) */}
          <div className="lg:col-span-3 bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex flex-col justify-between gap-4">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2">
              Trending Stories
            </h4>
            <div className="flex-1 flex flex-col justify-start gap-4">
              {rightListPosts.length === 0 ? (
                <p className="text-slate-400 text-sm italic">No items found</p>
              ) : (
                rightListPosts.map((post) => (
                  <div key={post.id} className="flex items-center gap-3 justify-between border-b border-slate-50 last:border-0 pb-3 last:pb-0">
                    <div className="min-w-0 flex-1 space-y-1">
                      {post.category_name && (
                        <span className="text-orange-600 font-extrabold text-[10px] uppercase tracking-wider block">
                          {post.category_name}
                        </span>
                      )}
                      <h5 className="font-bold text-slate-800 text-xs leading-snug line-clamp-2 hover:text-orange-600 transition-colors">
                        <Link href={`/${post.slug}`}>{post.title}</Link>
                      </h5>
                      <span className="text-[10px] text-slate-400 font-semibold block">
                        {post.published_at ? new Date(post.published_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                      </span>
                    </div>
                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-50 shrink-0 border border-slate-100">
                      {post.featured_image_path ? (
                        <img src={post.featured_image_path} alt={post.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <BookOpen className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* ========================================================
            2. MAIN FEED & SIDEBAR SECTION
           ======================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Main Feed (Left) */}
          <div className="lg:col-span-8 space-y-8">
            {feedPosts.length === 0 ? (
              <div className="text-center py-20 text-slate-400 bg-white border border-dashed rounded-3xl">
                <p className="font-bold text-slate-600">No Publications Found</p>
                <p className="text-sm mt-1">Please write or import articles in your admin CMS panel.</p>
              </div>
            ) : (
              <div className="space-y-10">
                {feedPosts.map((post) => (
                  <article key={post.id} className="group space-y-4">
                    {/* Featured Image */}
                    <Link href={`/${post.slug}`} className="block aspect-video w-full rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 shadow-sm relative">
                      {post.featured_image_path ? (
                        <img
                          src={post.featured_image_path}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <BookOpen className="h-14 w-14" />
                        </div>
                      )}
                      
                      {/* Floating Category Badge */}
                      {post.category_name && (
                        <span className="absolute top-4 left-4 bg-orange-600 text-white font-extrabold text-[10px] uppercase tracking-wider px-3 py-1 rounded shadow-md">
                          {post.category_name}
                        </span>
                      )}
                    </Link>

                    {/* Meta & Title */}
                    <div className="space-y-2">
                      <h2 className="text-2xl font-black text-slate-900 leading-tight tracking-tight hover:text-orange-600 transition-colors">
                        <Link href={`/${post.slug}`}>{post.title}</Link>
                      </h2>
                      
                      {/* Author & Date Row */}
                      <div className="flex items-center gap-3.5 text-sm font-semibold text-slate-400">
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-orange-500" />
                          By {post.author_name}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-orange-500" />
                          {post.published_at ? new Date(post.published_at).toLocaleDateString(undefined, { dateStyle: 'medium' }) : ''}
                        </span>
                      </div>
                      
                      {/* Excerpt */}
                      <p className="text-slate-500 text-base leading-relaxed line-clamp-3">
                        {post.summary || 'Click to view the full details of this publication.'}
                      </p>
                    </div>
                  </article>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-6 border-t border-slate-100">
                    {generatePagination(currentPage, totalPages).map((item, idx) => {
                      if (item === '...') {
                        return (
                          <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 font-bold">
                            ...
                          </span>
                        );
                      }

                      const pageNum = item as number;
                      const isActive = pageNum === currentPage;
                      
                      return (
                        <Link
                          key={`page-${pageNum}`}
                          href={`/?page=${pageNum}`}
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all shadow-sm ${
                            isActive
                              ? 'bg-orange-600 text-white shadow-orange-600/10'
                              : 'bg-white border border-slate-200 text-slate-600 hover:border-orange-500 hover:text-orange-600'
                          }`}
                        >
                          {pageNum}
                        </Link>
                      );
                    })}

                    {currentPage < totalPages && (
                      <Link
                        href={`/?page=${currentPage + 1}`}
                        className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold hover:border-orange-500 hover:text-orange-600 transition-all shadow-sm"
                      >
                        &gt;
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar (Right) */}
          <div className="lg:col-span-4">
            <Sidebar categories={categories} recentPosts={recentPostsForSidebar} />
          </div>
        </section>

        {/* ========================================================
            3. "YOU MISSED" SECTION
           ======================================================== */}
        <section className="space-y-6 pt-8 border-t border-slate-100">
          <div className="flex items-center">
            <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-black uppercase tracking-wider shadow-sm">
              <ArrowUpRight className="h-3.5 w-3.5" />
              You Missed
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trending.length === 0 ? (
              <div className="col-span-full text-center py-10 text-slate-400 text-sm italic">
                No items seeded
              </div>
            ) : (
              trending.map((post) => (
                <div
                  key={post.id}
                  className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-[300px] relative group"
                >
                  {/* Thumbnail Image */}
                  <div className="aspect-video w-full overflow-hidden bg-slate-50 shrink-0 relative border-b">
                    {post.featured_image_path ? (
                      <img src={post.featured_image_path} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <BookOpen className="h-8 w-8" />
                      </div>
                    )}
                    
                    {/* Floating category badge on top-left of image */}
                    {post.category_name && (
                      <span className="absolute top-3 left-3 bg-orange-600 text-white font-extrabold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded shadow">
                        {post.category_name}
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <h4 className="font-bold text-sm leading-snug text-slate-900 line-clamp-3 hover:text-orange-600 transition-colors">
                      <Link href={`/${post.slug}`}>{post.title}</Link>
                    </h4>

                    {/* Bottom Details + Arrow Icon */}
                    <div className="flex items-center justify-between border-t border-slate-50 pt-2.5">
                      <span className="text-xs text-slate-400 font-semibold">
                        {post.published_at ? new Date(post.published_at).toLocaleDateString(undefined, { dateStyle: 'short' }) : ''}
                      </span>
                      <Link
                        href={`/${post.slug}`}
                        className="w-7 h-7 rounded-full bg-slate-50 border group-hover:bg-orange-600 group-hover:text-white transition-all flex items-center justify-center text-slate-400"
                        aria-label="View Post"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

      </div>
    </LayoutWrapper>
  );
}
