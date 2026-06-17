import React from 'react';
import { notFound } from 'next/navigation';
import LayoutWrapper from '@/components/public/layout-wrapper';
import { pageService } from '@/modules/pages';
import { postService } from '@/modules/posts';
import { getSession } from '@/lib/auth';
import SinglePostView from '@/components/public/single-post-view';
import SinglePageView from '@/components/public/single-page-view';
import { settingsService } from '@/modules/settings';

interface StaticPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 0; // Dynamic server rendering

// Dynamic SEO metadata for both posts and pages
export async function generateMetadata({ params }: StaticPageProps) {
  try {
    const { slug } = await params;
    
    // First, check if it's a post
    const post = await postService.getPostBySlug(slug, 'en');
    
    let siteName = 'Blog';
    let siteTitle = 'Blog';
    try {
      const settings = await settingsService.getSettings();
      siteName = settings.site_name || 'Blog';
      siteTitle = settings.site_title || (siteName.toLowerCase().endsWith('blog') ? siteName : `${siteName} Blog`);
    } catch {}

    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (post && post.status === 'published' && !(post.published_at && new Date(post.published_at) > new Date())) {
      const seo = post.seo || {};
      return {
        title: seo.meta_title || `${post.title} | ${siteTitle}`,
        description: seo.meta_description || post.summary || '',
        keywords: seo.meta_keywords || '',
        alternates: {
          canonical: seo.canonical_url || `${siteUrl}/${post.slug}`,
        },
        openGraph: {
          title: seo.og_title || post.title,
          description: seo.og_description || post.summary || '',
          url: `${siteUrl}/${post.slug}`,
          images: [{ url: seo.og_image || post.featured_image_path || '/images/default-blog.jpg' }],
          type: 'article',
          publishedTime: post.published_at || undefined,
        },
        twitter: {
          card: seo.twitter_card || 'summary_large_image',
          title: seo.og_title || post.title,
          description: seo.og_description || post.summary || '',
          images: [seo.og_image || post.featured_image_path || '/images/default-blog.jpg'],
        },
        other: {
          robots: seo.robots_settings || 'index, follow',
        },
      };
    }

    // If not a post, check if it's a page
    const page = await pageService.getPageBySlug(slug, 'en');
    if (page) {
      const seo = page.seo || {};
      return {
        title: seo.meta_title || `${page.title} | ${siteTitle}`,
        description: seo.meta_description || page.title,
        keywords: seo.meta_keywords || '',
        alternates: {
          canonical: seo.canonical_url || `${siteUrl}/${page.slug}`,
        },
        other: {
          robots: seo.robots_settings || 'index, follow',
        },
      };
    }

    return {};
  } catch (e) {
    console.error('Error in root generateMetadata:', e);
    return {};
  }
}

export default async function SlugRouterPage({ params }: StaticPageProps) {
  const { slug } = await params;
  
  let siteName = 'Blog';
  try {
    const settings = await settingsService.getSettings();
    siteName = settings.site_name || 'Blog';
  } catch {}

  // 1. Try resolving as a Post
  const post = await postService.getPostBySlug(slug, 'en');
  if (post && post.status === 'published' && !(post.published_at && new Date(post.published_at) > new Date())) {
    return (
      <LayoutWrapper>
        <SinglePostView post={post} siteName={siteName} />
      </LayoutWrapper>
    );
  }

  // 2. Try resolving as a Page
  const page = await pageService.getPageBySlug(slug, 'en');
  if (page) {
    // Check draft status for pages
    if (page.status === 'draft') {
      const session = await getSession();
      if (!session || (session.role !== 'Super Admin' && session.role !== 'Admin' && session.role !== 'Editor')) {
        notFound();
      }
    }
    return (
      <LayoutWrapper>
        <SinglePageView page={page} />
      </LayoutWrapper>
    );
  }

  // 3. Neither found
  notFound();
}
