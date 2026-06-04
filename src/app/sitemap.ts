import { MetadataRoute } from 'next';
import { postService } from '@/modules/posts';
import { pageService } from '@/modules/pages';

export const revalidate = 3600; // Cache sitemap for 1 hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // 1. Static Core Paths
  const routes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${siteUrl}/posts`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
  ];

  // 2. Fetch all published blog articles
  try {
    const { posts } = await postService.getPosts({ status: 'published', limit: 100 });
    posts.forEach((post) => {
      routes.push({
        url: `${siteUrl}/posts/${post.slug}`,
        lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      });
    });
  } catch (err) {
    console.error('Error compiling posts for sitemap:', err);
  }

  // 3. Fetch all published static pages
  try {
    const pages = await pageService.getAllPages();
    pages
      .filter((p) => p.status === 'published')
      .forEach((page) => {
        routes.push({
          url: `${siteUrl}/${page.slug}`,
          lastModified: page.updated_at ? new Date(page.updated_at) : new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.5,
        });
      });
  } catch (err) {
    console.error('Error compiling pages for sitemap:', err);
  }

  return routes;
}
