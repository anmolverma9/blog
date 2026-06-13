import React from 'react';
import Link from 'next/link';
import LayoutWrapper from '@/components/public/layout-wrapper';
import Sidebar from '@/components/public/sidebar';
import { postService } from '@/modules/posts';
import { categoryService } from '@/modules/categories';
import { buttonVariants } from '@/components/ui/button';
import { BookOpen, Calendar, Clock, Eye, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';

interface PostsPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    tag?: string;
    page?: string;
  }>;
}

export const revalidate = 0; // Dynamic server rendering

export default async function PublicPostsListingPage({ searchParams }: PostsPageProps) {
  const resolvedParams = await searchParams;
  const search = resolvedParams.q || undefined;
  const categorySlug = resolvedParams.category || undefined;
  const tagSlug = resolvedParams.tag || undefined;
  const page = resolvedParams.page ? Number(resolvedParams.page) : 1;
  const limit = 6;
  const offset = (page - 1) * limit;

  // 1. Fetch filtered posts from services
  const { posts, total } = await postService.getPosts({
    status: 'published',
    search,
    categorySlug,
    tagSlug,
    limit,
    offset,
  });

  // Fetch sidebar data
  const { posts: trending } = await postService.getPosts({
    status: 'published',
    orderBy: 'views',
    limit: 5,
  });
  const categoriesList = await categoryService.getAllCategories();

  const totalPages = Math.ceil(total / limit);

  // Compute pagination parameters URL helpers
  const buildPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams();
    if (search) params.append('q', search);
    if (categorySlug) params.append('category', categorySlug);
    if (tagSlug) params.append('tag', tagSlug);
    params.append('page', String(pageNumber));
    return `/posts?${params.toString()}`;
  };

  return (
    <LayoutWrapper>
      <div className="editorial-container py-10 space-y-8 animate-in fade-in duration-300">
        {/* Active Filter Banners */}
        {(categorySlug || tagSlug || search) && (
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Active Search Filters</span>
              <h1 className="text-xl font-bold text-slate-900 mt-0.5">
                {categorySlug && `Category: ${categorySlug}`}
                {tagSlug && `Tag: #${tagSlug}`}
                {search && `Search query: "${search}"`}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">Found {total} matched article(s)</p>
            </div>
            <Link href="/posts" className={buttonVariants({ variant: "outline", size: "sm", className: "border-orange-200 text-orange-600 hover:bg-orange-100 font-semibold bg-white text-xs h-8" })}>
              Clear Filters
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Posts Grid List */}
          <div className="lg:col-span-2 space-y-8">
            {posts.length === 0 ? (
              <div className="text-center py-24 bg-white border border-dashed rounded-3xl text-slate-400">
                <HelpCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="font-semibold text-slate-600 text-base">No Articles Found</p>
                <p className="text-xs mt-1">We couldn't find any published articles matching your criteria.</p>
                <Link href="/posts" className={buttonVariants({ variant: "outline", size: "sm", className: "mt-4 border-slate-200 text-slate-600" })}>
                  Browse all articles
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {posts.map((post) => (
                    <CardItem key={post.id} post={post} />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-200 pt-6">
                    <p className="text-xs text-slate-500 font-medium">
                      Showing Page {page} of {totalPages} ({total} articles)
                    </p>

                    <div className="flex gap-2">
                      {page > 1 ? (
                        <Link href={buildPageUrl(page - 1)} className={buttonVariants({ variant: "outline", size: "sm", className: "border-slate-200 text-slate-600 flex items-center gap-1" })}>
                          <ChevronLeft className="h-4 w-4" /> Previous
                        </Link>
                      ) : (
                        <span className={buttonVariants({ variant: "outline", size: "sm", className: "border-slate-200 text-slate-400 opacity-50 flex items-center gap-1 cursor-not-allowed pointer-events-none" })}>
                          <ChevronLeft className="h-4 w-4" /> Previous
                        </span>
                      )}

                      {page < totalPages ? (
                        <Link href={buildPageUrl(page + 1)} className={buttonVariants({ variant: "outline", size: "sm", className: "border-slate-200 text-slate-600 flex items-center gap-1" })}>
                          Next <ChevronRight className="h-4 w-4" />
                        </Link>
                      ) : (
                        <span className={buttonVariants({ variant: "outline", size: "sm", className: "border-slate-200 text-slate-400 opacity-50 flex items-center gap-1 cursor-not-allowed pointer-events-none" })}>
                          Next <ChevronRight className="h-4 w-4" />
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar widget */}
          <div>
            <Sidebar categories={categoriesList} recentPosts={trending} />
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}

// Compact Subcard Component
function CardItem({ post }: { post: any }) {
  return (
    <div className="bg-white border border-slate-100/90 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-orange-100 transition-all flex flex-col justify-between h-[360px]">
      <div className="aspect-video relative bg-slate-50 border-b border-slate-100 shrink-0">
        {post.featured_image_path ? (
          <img src={post.featured_image_path} alt={post.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <BookOpen className="h-10 w-10" />
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
            <span className="text-orange-500">{post.category_name || 'General'}</span>
            <span>•</span>
            <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> {post.read_time} min</span>
          </div>
          <h3 className="font-bold text-slate-900 text-base hover:text-orange-500 transition-colors line-clamp-2 leading-snug tracking-tight">
            <Link href={`/posts/${post.slug}`}>{post.title}</Link>
          </h3>
          <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
            {post.summary || 'Read complete details inside...'}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-slate-50 pt-3 text-[10px] text-slate-400 font-semibold">
          <span>By {post.author_name}</span>
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" /> {(post.views ?? 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
