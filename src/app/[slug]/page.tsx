import React from 'react';
import { notFound } from 'next/navigation';
import LayoutWrapper from '@/components/public/layout-wrapper';
import { pageService } from '@/modules/pages';
import { getSession } from '@/lib/auth';
import VisualRenderer from '@/components/public/visual-renderer';

interface StaticPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 0; // Dynamic server rendering

// Dynamic SEO metadata for pages
export async function generateMetadata({ params }: StaticPageProps) {
  const { slug } = await params;
  const page = await pageService.getPageBySlug(slug, 'en');
  if (!page) return {};

  const seo = page.seo || {};
  return {
    title: seo.meta_title || `${page.title} | AppLuxe`,
    description: seo.meta_description || page.title,
    keywords: seo.meta_keywords || '',
    alternates: {
      canonical: seo.canonical_url || `/${page.slug}`,
    },
    other: {
      robots: seo.robots_settings || 'index, follow',
    },
  };
}

export default async function StaticPage({ params }: StaticPageProps) {
  const { slug } = await params;
  const page = await pageService.getPageBySlug(slug, 'en');

  if (!page) {
    notFound();
  }

  // Check draft status
  if (page.status === 'draft') {
    const session = await getSession();
    // Only logged in admins/editors can preview drafts
    if (!session || (session.role !== 'Super Admin' && session.role !== 'Editor')) {
      notFound();
    }
  }

  const templateName = page.template_file_name || 'standard.tsx';
  const isVisual = page.content && page.content.startsWith('{') && page.content.includes('"editor_type":"visual"');

  return (
    <LayoutWrapper>
      {isVisual ? (
        <VisualRenderer data={JSON.parse(page.content)} />
      ) : (
        <>
          {/* Template: Landing Page */}
          {templateName === 'landing.tsx' && (
            <div className="flex-1 animate-in fade-in duration-300">
              <div className="bg-slate-900 text-white py-20 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 to-slate-900/60" />
                <div className="relative z-10 max-w-3xl mx-auto px-4 space-y-4">
                  <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">{page.title}</h1>
                  <p className="text-slate-300 text-sm max-w-lg mx-auto">Discover modular ecosystem features built on standard architectures.</p>
                </div>
              </div>
              <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 prose prose-slate text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                {page.content}
              </div>
            </div>
          )}

          {/* Template: Full Width */}
          {templateName === 'fullwidth.tsx' && (
            <div className="w-full px-6 md:px-12 py-10 max-w-full animate-in fade-in duration-300 space-y-6">
              <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight">{page.title}</h1>
              <div className="h-px bg-slate-100" />
              <div className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                {page.content}
              </div>
            </div>
          )}

          {/* Template: Standard (Default) */}
          {templateName === 'standard.tsx' && (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 animate-in fade-in duration-300 space-y-6">
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
                {page.title}
              </h1>
              <div className="h-px bg-slate-100" />
              <div className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                {page.content}
              </div>
            </div>
          )}
        </>
      )}
    </LayoutWrapper>
  );
}
