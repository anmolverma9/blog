import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import LayoutWrapper from '@/components/public/layout-wrapper';
import { kbService } from '@/modules/kb';
import { ArrowLeft, BookOpen, Clock, FileText, HelpCircle, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface KBArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 0; // Dynamic server rendering

export async function generateMetadata({ params }: KBArticlePageProps) {
  const { slug } = await params;
  const article = await kbService.getArticleBySlug(slug);
  if (!article) return {};

  return {
    title: `${article.title} | Help Center`,
    description: article.content.slice(0, 160),
    other: {
      robots: 'index, follow',
    }
  };
}

export default async function KBArticlePage({ params }: KBArticlePageProps) {
  const { slug } = await params;
  const article = await kbService.getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  // Fetch sibling articles in the same category for sidebar
  const categoryArticles = await kbService.getArticles({
    categoryId: article.category_id,
    status: 'published',
    limit: 6
  });

  const sidebarArticles = categoryArticles.filter(art => art.id !== article.id);

  return (
    <LayoutWrapper>
      <div className="editorial-container py-10 md:py-16 animate-in fade-in duration-300">
        
        {/* Back Link */}
        <div className="mb-6">
          <Link href="/kb" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-orange-500 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Knowledge Base
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Article Body */}
          <div className="lg:col-span-2 space-y-6">
            <article className="bg-white border border-slate-100 rounded-3xl p-6 md:p-10 shadow-sm space-y-6">
              <div className="space-y-3">
                <span className="text-[10px] font-extrabold uppercase text-orange-500 bg-orange-50 px-2.5 py-1 rounded-full w-fit">
                  {article.category_name || 'General Help'}
                </span>
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  {article.title}
                </h1>
                <div className="flex items-center gap-2 text-xs text-slate-400 border-b border-slate-50 pb-4">
                  <span>Published in Support Desk</span>
                  <span>•</span>
                  <span>{article.created_at ? new Date(article.created_at).toLocaleDateString() : ''}</span>
                </div>
              </div>

              {/* Render article content */}
              <div className="prose prose-slate max-w-none text-slate-700 text-sm md:text-base leading-relaxed space-y-4 whitespace-pre-wrap">
                {article.content}
              </div>
            </article>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Same Topic Articles */}
            {sidebarArticles.length > 0 && (
              <Card className="border-slate-200 shadow-sm bg-white">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-orange-500" />
                    In This Category
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {sidebarArticles.map((art) => (
                    <Link key={art.id} href={`/kb/${art.slug}`} className="block group">
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-orange-500 transition-colors leading-snug">
                        {art.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                        {art.content.replace(/[#*`_[\]()]/g, '').slice(0, 80)}
                      </p>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Need More Help CTA */}
            <Card className="bg-slate-950 text-white border-0 shadow-md p-6 relative overflow-hidden">
              <div className="absolute top-[-30%] right-[-10%] w-40 h-40 rounded-full bg-orange-500 blur-3xl opacity-35" />
              <div className="relative z-10 space-y-4">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-base">Still need help?</h4>
                  <p className="text-xs text-slate-300 leading-normal">
                    Submit a support ticket and our engineering team will get back to you directly.
                  </p>
                </div>
                <Link
                  href="/kb"
                  className="inline-flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-orange-500/10 w-full"
                >
                  Contact Support
                </Link>
              </div>
            </Card>
          </div>
        </div>

      </div>
    </LayoutWrapper>
  );
}
