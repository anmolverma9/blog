import React from 'react';
import Link from 'next/link';
import LayoutWrapper from '@/components/public/layout-wrapper';
import Sidebar from '@/components/public/sidebar';
import { postService } from '@/modules/posts';
import { categoryService } from '@/modules/categories';
import { Button, buttonVariants } from '@/components/ui/button';
import { ArrowRight, BookOpen, Calendar, Eye, Clock, Search } from 'lucide-react';
import MotionWrapper from '@/components/public/motion-wrapper';

export const revalidate = 0; // Dynamic server rendering

export default async function Homepage() {
  // Fetch data directly from MySQL services
  const { posts: latest } = await postService.getPosts({
    status: 'published',
    limit: 5,
  });

  const { posts: trending } = await postService.getPosts({
    status: 'published',
    orderBy: 'views',
    limit: 5,
  });

  const categories = await categoryService.getAllCategories();

  // Pick first published post as Featured Hero
  const featuredPost = latest[0] || null;
  const remainingLatest = latest.slice(1);

  return (
    <LayoutWrapper>
      <div className="editorial-container py-10 md:py-16 space-y-12">
        {/* Hero Section */}
        <MotionWrapper direction="up" duration={0.6}>
          <section className="bg-slate-900 rounded-3xl text-white overflow-hidden relative shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600/30 to-slate-900/80 mix-blend-multiply" />
          {/* Decorative bubble */}
          <div className="absolute top-[-10%] right-[-10%] w-[350px] h-[350px] rounded-full bg-orange-500 blur-[80px] opacity-20" />

          <div className="relative z-10 p-8 md:p-16 max-w-2xl space-y-6">
            <span className="bg-orange-500 text-white font-bold text-xs uppercase tracking-wider px-3 py-1 rounded-full">
              SaaS Ecosystem Phase 1
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Build & Scale Your Digital Presence
            </h1>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Discover advanced tutorials on clean typescript code architectures, database performance scaling, and modern product marketing.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/posts"
                className={buttonVariants({
                  className: "bg-orange-500 hover:bg-orange-600 text-white font-bold h-11 px-6 shadow-lg shadow-orange-500/20 flex items-center"
                })}
              >
                Browse Articles <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        </section>
      </MotionWrapper>

        {/* Featured Post Card */}
        {featuredPost && (
          <MotionWrapper direction="up" delay={0.15} duration={0.6}>
            <section className="space-y-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Featured Story</h2>
              <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow grid grid-cols-1 md:grid-cols-2">
                <div className="aspect-video md:aspect-auto relative bg-slate-50 min-h-[250px]">
                  {featuredPost.featured_image_path ? (
                    <img
                      src={featuredPost.featured_image_path}
                      alt={featuredPost.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <BookOpen className="h-12 w-12" />
                    </div>
                  )}
                </div>
                <div className="p-8 flex flex-col justify-between space-y-6">
                  <div className="space-y-3.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                      <span className="text-orange-500 font-bold uppercase">{featuredPost.category_name || 'General'}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {featuredPost.read_time} min read</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 hover:text-orange-500 transition-colors tracking-tight leading-snug">
                      <Link href={`/posts/${featuredPost.slug}`}>{featuredPost.title}</Link>
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-3">
                      {featuredPost.summary || 'Click to read full details...'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-semibold text-slate-700">By {featuredPost.author_name}</span>
                      <span>•</span>
                      <span>{featuredPost.published_at ? new Date(featuredPost.published_at).toLocaleDateString() : ''}</span>
                    </div>
                    <Link
                      href={`/posts/${featuredPost.slug}`}
                      className={buttonVariants({
                        variant: "ghost",
                        size: "sm",
                        className: "text-orange-500 hover:text-orange-600 font-bold p-0 gap-1 hover:bg-transparent flex items-center"
                      })}
                    >
                      Read Article <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </MotionWrapper>
        )}

        {/* Main Grid: Latest Posts (Left) & Sidebar (Right) */}
        <MotionWrapper direction="up" delay={0.3} duration={0.6}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left Column: Latest Feed */}
            <div className="lg:col-span-2 space-y-8">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-950 tracking-tight flex items-center gap-2">
                  <BookOpen className="h-4.5 w-4.5 text-orange-500" />
                  Latest Publications
                </h2>
                <Link href="/posts" className="text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors">
                  View All Posts
                </Link>
              </div>

              {remainingLatest.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs bg-white rounded-2xl border border-dashed">
                  No further articles found. Check back later!
                </div>
              ) : (
                <div className="space-y-6">
                  {remainingLatest.map((post) => (
                    <div key={post.id} className="bg-white border border-slate-100/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-5">
                      <div className="w-full sm:w-44 aspect-video sm:aspect-square shrink-0 rounded-xl overflow-hidden bg-slate-50 relative">
                        {post.featured_image_path ? (
                          <img
                            src={post.featured_image_path}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <BookOpen className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                            <span className="text-orange-500">{post.category_name || 'General'}</span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> {post.read_time} min</span>
                          </div>
                          <h3 className="font-bold text-slate-900 text-lg hover:text-orange-500 transition-colors tracking-tight">
                            <Link href={`/posts/${post.slug}`}>{post.title}</Link>
                          </h3>
                          <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">
                            {post.summary || 'Click to view full content...'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-50 pt-3 text-[11px] text-slate-400">
                          <span>By {post.author_name}</span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" /> {(post.views ?? 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Sidebar */}
            <div>
              <Sidebar categories={categories} trendingPosts={trending} />
            </div>
          </div>
        </MotionWrapper>
      </div>
    </LayoutWrapper>
  );
}
