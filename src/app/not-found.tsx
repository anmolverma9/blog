import React from 'react';
import Link from 'next/link';
import LayoutWrapper from '@/components/public/layout-wrapper';
import { postService } from '@/modules/posts';
import { categoryService } from '@/modules/categories';
import SearchForm from '@/components/public/search-form';
import { ArrowUpRight, BookOpen, Home, Search } from 'lucide-react';

export const metadata = {
  title: '404 – Page Not Found',
  description: 'The page you were looking for could not be found.',
};

export default async function NotFound() {
  // Fetch latest articles and categories for the helpful section
  const { posts: latestPosts } = await postService.getPosts({
    status: 'published',
    orderBy: 'published_at',
    limit: 4,
  });

  const categories = await categoryService.getAllCategories();
  const popularCategories = categories.slice(0, 8);

  return (
    <LayoutWrapper>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-16">

        {/* ── Hero 404 Block ── */}
        <section className="relative flex flex-col items-center text-center overflow-hidden rounded-3xl bg-slate-900 py-20 px-6 shadow-xl">
          {/* Decorative blobs */}
          <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-orange-500 opacity-10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-orange-600 opacity-10 blur-3xl" />

          {/* 404 Number */}
          <p className="relative z-10 text-[clamp(6rem,20vw,14rem)] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-orange-400 to-orange-600 select-none">
            404
          </p>

          {/* Message */}
          <h1 className="relative z-10 text-xl md:text-2xl font-extrabold text-white mt-4">
            Oops! That page can’t be found.
          </h1>
          <p className="relative z-10 mt-3 text-slate-400 text-sm max-w-md leading-relaxed">
            The URL you visited may have been moved, deleted, or never existed. Try searching for what you need or browse our latest articles below.
          </p>

          {/* Search Bar */}
          <SearchForm variant="notfound" />

          {/* Quick Actions */}
          <div className="relative z-10 mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              id="not-found-home-btn"
              href="/"
              className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-white text-slate-900 text-sm font-bold hover:bg-orange-50 transition-colors shadow-sm"
            >
              <Home className="h-4 w-4 text-orange-600" />
              Go to Home
            </Link>
            <Link
              id="not-found-archives-btn"
              href="/archives"
              className="inline-flex items-center gap-2 h-10 px-5 rounded-full border border-white/20 text-white text-sm font-semibold hover:border-orange-500 hover:text-orange-400 transition-colors"
            >
              Browse Archives
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* ── Latest Articles ── */}
        {latestPosts.length > 0 && (
          <section className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-black uppercase tracking-wider shadow-sm">
                <BookOpen className="h-3.5 w-3.5" />
                Latest Articles
              </div>
              <Link
                href="/"
                className="text-sm font-semibold text-slate-500 hover:text-orange-600 transition-colors flex items-center gap-1"
              >
                View all <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {latestPosts.map((post) => (
                <article
                  key={post.id}
                  className="group bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md hover:border-orange-100 transition-all flex flex-col"
                >
                  {/* Thumbnail */}
                  <Link
                    href={`/${post.slug}`}
                    className="block aspect-video w-full overflow-hidden bg-slate-50 border-b border-slate-100 relative shrink-0"
                  >
                    {post.featured_image_path ? (
                      <img
                        src={post.featured_image_path}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <BookOpen className="h-8 w-8" />
                      </div>
                    )}
                    {post.category_name && (
                      <span className="absolute top-3 left-3 bg-orange-600 text-white text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded shadow">
                        {post.category_name}
                      </span>
                    )}
                  </Link>

                  {/* Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <h3 className="font-bold text-sm text-slate-900 leading-snug line-clamp-3 hover:text-orange-600 transition-colors">
                      <Link href={`/${post.slug}`}>{post.title}</Link>
                    </h3>
                    <div className="flex items-center justify-between border-t border-slate-50 pt-2.5">
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {post.published_at
                          ? new Date(post.published_at).toLocaleDateString(undefined, {
                              dateStyle: 'medium',
                            })
                          : ''}
                      </span>
                      <Link
                        href={`/${post.slug}`}
                        className="w-7 h-7 rounded-full bg-slate-50 border group-hover:bg-orange-600 group-hover:text-white transition-all flex items-center justify-center text-slate-400"
                        aria-label={`Read ${post.title}`}
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ── Popular Categories ── */}
        {popularCategories.length > 0 && (
          <section className="space-y-6 pb-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-black uppercase tracking-wider shadow-sm">
              Popular Categories
            </div>

            <div className="flex flex-wrap gap-3">
              {popularCategories.map((cat) => (
                <Link
                  key={cat.id ?? cat.slug}
                  id={`not-found-category-${cat.slug}`}
                  href={`/category/${cat.slug}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-slate-200 text-slate-700 text-sm font-bold hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50 transition-all shadow-sm"
                >
                  {cat.name}
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-50" />
                </Link>
              ))}
            </div>
          </section>
        )}

      </div>
    </LayoutWrapper>
  );
}
