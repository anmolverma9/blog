import React from 'react';
import { notFound } from 'next/navigation';
import LayoutWrapper from '@/components/public/layout-wrapper';
import Sidebar from '@/components/public/sidebar';
import { postService } from '@/modules/posts';
import { categoryService } from '@/modules/categories';
import { settingsService } from '@/modules/settings';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, Eye, FolderOpen } from 'lucide-react';

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 0; // Dynamic server rendering

export async function generateMetadata({ params }: CategoryPageProps) {
  try {
    const { slug } = await params;
    const cat = await categoryService.getCategoryBySlug(slug);
    if (!cat) return {};

    let siteTitle = 'Blog';
    try {
      const settings = await settingsService.getSettings();
      const siteName = settings.site_name || 'Blog';
      siteTitle = settings.site_title || (siteName.toLowerCase().endsWith('blog') ? siteName : `${siteName} Blog`);
    } catch {}

    return {
      title: `${cat.name} | ${siteTitle}`,
      description: cat.description || `Articles in category ${cat.name}`,
    };
  } catch (e) {
    console.error('Error generating metadata for category page:', e);
    return {};
  }
}

export default async function CategoryListingPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const cat = await categoryService.getCategoryBySlug(slug);
  if (!cat) {
    notFound();
  }

  // Fetch posts under category
  const { posts } = await postService.getPosts({
    status: 'published',
    categorySlug: slug,
    limit: 10,
  });

  // Sidebar details
  const { posts: trending } = await postService.getPosts({
    status: 'published',
    orderBy: 'views',
    limit: 5,
  });
  const categoriesList = await categoryService.getAllCategories();

  return (
    <LayoutWrapper>
      <div className="editorial-container py-10 space-y-8 animate-in fade-in duration-300">
        {/* Banner */}
        <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm flex items-center gap-4">
          <div className="bg-orange-50 text-orange-600 p-4 rounded-2xl shadow-sm shrink-0">
            <FolderOpen className="h-8 w-8" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category Folder</span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">{cat.name}</h1>
            <p className="text-slate-500 text-xs mt-1 max-w-xl">{cat.description || 'Explore articles sorted under this category.'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6">
            {posts.length === 0 ? (
              <div className="text-center py-20 bg-white border border-dashed rounded-2xl text-slate-400">
                <BookOpen className="h-8 w-8 mx-auto mb-2.5 text-slate-300" />
                <p className="font-semibold text-slate-600 text-sm">No articles in this category yet</p>
                <p className="text-xs mt-0.5">Check back later or browse other tags.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
                  <div key={post.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-5">
                    <div className="w-full sm:w-36 aspect-video sm:aspect-square shrink-0 rounded-xl overflow-hidden bg-slate-50 relative">
                      {post.featured_image_path ? (
                        <img src={post.featured_image_path} alt={post.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <BookOpen className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                          <span className="text-orange-500">{cat.name}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> {post.read_time} min</span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-lg hover:text-orange-500 transition-colors mt-1.5 tracking-tight">
                          <Link href={`/posts/${post.slug}`}>{post.title}</Link>
                        </h3>
                        <p className="text-slate-500 text-xs line-clamp-2 mt-1.5 leading-relaxed">{post.summary}</p>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2.5 border-t border-slate-50">
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
            <Sidebar categories={categoriesList} trendingPosts={trending} />
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}
