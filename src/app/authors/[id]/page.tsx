import React from 'react';
import { notFound } from 'next/navigation';
import LayoutWrapper from '@/components/public/layout-wrapper';
import Sidebar from '@/components/public/sidebar';
import { postService } from '@/modules/posts';
import { userService } from '@/modules/users';
import { categoryService } from '@/modules/categories';
import Link from 'next/link';
import { BookOpen, Clock, Eye, Globe } from 'lucide-react';

interface AuthorPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const revalidate = 0; // Dynamic server rendering

export async function generateMetadata({ params }: AuthorPageProps) {
  const { id } = await params;
  const authorId = Number(id);
  if (isNaN(authorId)) return {};

  const author = await userService.getAuthor(authorId);
  if (!author) return {};

  return {
    title: `${author.author_name} | AppLuxe Creator`,
    description: author.bio || `Articles written by ${author.author_name}`,
  };
}

export default async function AuthorProfilePage({ params }: AuthorPageProps) {
  const { id } = await params;
  const authorId = Number(id);
  if (isNaN(authorId)) {
    notFound();
  }

  const author = await userService.getAuthor(authorId);
  if (!author) {
    notFound();
  }

  // Fetch posts written by this author profile
  const { posts } = await postService.getPosts({
    status: 'published',
    authorId: author.id,
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
        {/* Author Bio Banner */}
        <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row items-center gap-6">
          <div className="h-20 w-20 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-extrabold text-2xl shrink-0">
            {author.author_name ? author.author_name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="space-y-2 text-center md:text-left flex-1">
            <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Author Profile</span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">{author.author_name}</h1>
            <p className="text-slate-600 text-xs leading-relaxed max-w-2xl">{author.bio || 'AppLuxe editorial contributor.'}</p>
            
            {/* Social links */}
            <div className="flex gap-2 justify-center md:justify-start pt-2 text-slate-400">
              {author.social_twitter && (
                <a href={`https://twitter.com/${author.social_twitter}`} target="_blank" rel="noopener noreferrer" className="hover:text-orange-500">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
              )}
              {author.social_linkedin && (
                <a href={author.social_linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-orange-500">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>
                </a>
              )}
              {author.social_facebook && (
                <a href={author.social_facebook} target="_blank" rel="noopener noreferrer" className="hover:text-orange-500">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/></svg>
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-base font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
              <BookOpen className="h-4.5 w-4.5 text-orange-500" />
              Articles Written By {author.author_name}
            </h2>

            {posts.length === 0 ? (
              <div className="text-center py-20 bg-white border border-dashed rounded-2xl text-slate-400">
                <BookOpen className="h-8 w-8 mx-auto mb-2.5 text-slate-300" />
                <p className="font-semibold text-slate-600 text-sm">No articles published by this author yet</p>
                <p className="text-xs mt-0.5">Check back later or search for other contributors.</p>
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
                          <span className="text-orange-500">{post.category_name || 'General'}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> {post.read_time} min</span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-lg hover:text-orange-500 transition-colors mt-1.5 tracking-tight">
                          <Link href={`/posts/${post.slug}`}>{post.title}</Link>
                        </h3>
                        <p className="text-slate-500 text-xs line-clamp-2 mt-1.5 leading-relaxed">{post.summary}</p>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2.5 border-t border-slate-50">
                        <span>Views: {(post.views ?? 0).toLocaleString()}</span>
                        <span className="flex items-center gap-1">
                          Published: {post.published_at ? new Date(post.published_at).toLocaleDateString() : ''}
                        </span>
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
