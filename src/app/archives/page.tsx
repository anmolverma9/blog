import React from 'react';
import Link from 'next/link';
import LayoutWrapper from '@/components/public/layout-wrapper';
import { postService } from '@/modules/posts';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, BookOpen, ChevronRight } from 'lucide-react';
import { settingsService } from '@/modules/settings';

export const revalidate = 0; // Dynamic server rendering

export async function generateMetadata() {
  let siteTitle = 'Blog';
  try {
    const settings = await settingsService.getSettings();
    const siteName = settings.site_name || 'Blog';
    siteTitle = settings.site_title || (siteName.toLowerCase().endsWith('blog') ? siteName : `${siteName} Blog`);
  } catch {}

  return {
    title: `Content Archives | ${siteTitle}`,
    description: 'Explore the complete timeline of our tutorials, reviews, and insights.',
    other: {
      robots: 'index, follow',
    }
  };
}

export default async function ArchivesPage() {
  const { posts } = await postService.getPosts({
    status: 'published',
    orderBy: 'published_at',
    limit: 200, // Retrieve a comprehensive set for timeline layout
  });

  // Group posts by Year and then by Month
  const yearsMap: Record<number, Record<string, typeof posts>> = {};

  posts.forEach(post => {
    if (!post.published_at) return;
    const date = new Date(post.published_at);
    const year = date.getFullYear();
    const month = date.toLocaleString('default', { month: 'long' });

    if (!yearsMap[year]) {
      yearsMap[year] = {};
    }
    if (!yearsMap[year][month]) {
      yearsMap[year][month] = [];
    }
    yearsMap[year][month].push(post);
  });

  const sortedYears = Object.keys(yearsMap)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <LayoutWrapper>
      <div className="editorial-container py-10 md:py-16 space-y-10 animate-in fade-in duration-300">
        
        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="bg-orange-50 text-orange-600 border border-orange-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Timeline Archives
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Complete Content Archive
          </h1>
          <p className="text-slate-500 text-sm">
            Browse through our published articles in a chronological publication timeline.
          </p>
        </div>

        {sortedYears.length === 0 ? (
          <div className="text-center py-20 bg-white border border-dashed rounded-3xl p-6 text-slate-400 text-sm max-w-lg mx-auto">
            No archived publications found. Check back later!
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-12 relative before:absolute before:inset-0 before:left-4 md:before:left-1/2 before:w-0.5 before:bg-slate-200/60 before:pointer-events-none">
            {sortedYears.map((year) => {
              const monthsMap = yearsMap[year];
              const sortedMonths = Object.keys(monthsMap); // order of discovery/chronological

              return (
                <div key={year} className="space-y-8 relative">
                  
                  {/* Year Node Badge */}
                  <div className="flex md:justify-center relative z-10">
                    <span className="bg-slate-900 text-white font-extrabold text-sm px-5 py-1.5 rounded-full shadow-md">
                      {year}
                    </span>
                  </div>

                  {sortedMonths.map((month) => {
                    const monthPosts = monthsMap[month];

                    return (
                      <div key={month} className="space-y-4">
                        {/* Month Subheading */}
                        <div className="flex md:justify-center pl-6 md:pl-0 relative z-10">
                          <span className="bg-orange-500 text-white font-bold text-xs uppercase tracking-wider px-3.5 py-1 rounded-full shadow-sm">
                            {month}
                          </span>
                        </div>

                        {/* Posts within this Month */}
                        <div className="space-y-4">
                          {monthPosts.map((post, idx) => {
                            const isEven = idx % 2 === 0;

                            return (
                              <div
                                key={post.id}
                                className={`flex flex-col md:flex-row items-start md:items-center relative gap-6 w-full ${
                                  isEven ? 'md:flex-row-reverse' : ''
                                }`}
                              >
                                {/* Connector Dot */}
                                <div className="absolute left-4 md:left-1/2 w-4 h-4 bg-orange-500 rounded-full border-4 border-white shadow-sm -translate-x-1.5 z-10" />

                                {/* Post Card Column */}
                                <div className="w-full md:w-[46%] pl-10 md:pl-0">
                                  <Link href={`/${post.slug}`} className="block group">
                                    <Card className="border-slate-100 hover:border-orange-200 transition-colors shadow-sm bg-white hover:shadow-md">
                                      <CardContent className="p-5 space-y-3">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                                          <span className="text-orange-500">{post.category_name || 'General'}</span>
                                          <span>•</span>
                                          <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> {post.read_time} min</span>
                                        </div>
                                        <h3 className="font-bold text-slate-800 text-sm group-hover:text-orange-500 transition-colors leading-snug">
                                          {post.title}
                                        </h3>
                                        <div className="flex items-center justify-between border-t border-slate-50 pt-2 text-[10px] text-slate-400">
                                          <span>By {post.author_name}</span>
                                          <span className="flex items-center gap-1">
                                            {post.published_at ? new Date(post.published_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : ''}
                                          </span>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </Link>
                                </div>

                                {/* Spacing column for desktop grid alignment */}
                                <div className="hidden md:block w-[46%]" />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </LayoutWrapper>
  );
}
