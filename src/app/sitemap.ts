import { MetadataRoute } from 'next';
import { postService } from '@/modules/posts';
import { pageService } from '@/modules/pages';
import { categoryService } from '@/modules/categories';
import { tagService } from '@/modules/tags';
import { userService } from '@/modules/users';

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
    const { posts } = await postService.getPosts({ status: 'published', limit: 500 });
    posts.forEach((post) => {
      routes.push({
        url: `${siteUrl}/posts/${post.slug}`,
        lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
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
          priority: 0.6,
        });
      });
  } catch (err) {
    console.error('Error compiling pages for sitemap:', err);
  }

  // 4. Categories sitemap mapping
  try {
    const categories = await categoryService.getAllCategories();
    categories.forEach((cat) => {
      routes.push({
        url: `${siteUrl}/categories/${cat.slug}`,
        lastModified: cat.updated_at ? new Date(cat.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      });
    });
  } catch (err) {
    console.error('Error compiling categories for sitemap:', err);
  }

  // 5. Tags sitemap mapping
  try {
    const tags = await tagService.getAllTags();
    tags.forEach((tag) => {
      routes.push({
        url: `${siteUrl}/tags/${tag.slug}`,
        lastModified: tag.updated_at ? new Date(tag.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.4,
      });
    });
  } catch (err) {
    console.error('Error compiling tags for sitemap:', err);
  }

  // 6. Authors profiles mapping
  try {
    const authors = await userService.getAllAuthors();
    authors.forEach((author) => {
      routes.push({
        url: `${siteUrl}/authors/${author.id}`,
        lastModified: author.updated_at ? new Date(author.updated_at) : new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.4,
      });
    });
  } catch (err) {
    console.error('Error compiling authors for sitemap:', err);
  }

  return routes;
}
