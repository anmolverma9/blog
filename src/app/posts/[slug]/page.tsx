import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import LayoutWrapper from '@/components/public/layout-wrapper';
import Sidebar from '@/components/public/sidebar';
import { postService } from '@/modules/posts';
import { categoryService } from '@/modules/categories';
import { settingsService } from '@/modules/settings';
import { generateArticleSchema, generateFAQSchema, generateReviewSchema, generateBreadcrumbSchema } from '@/lib/seo';
import { Button, buttonVariants } from '@/components/ui/button';
import BlocksRenderer from '@/components/public/blocks-renderer';
import VisualRenderer from '@/components/public/visual-renderer';
import {
  Clock,
  Eye,
  Calendar,
  Share2,
  MessageSquare,
  Sparkles,
  BookOpen,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

interface PostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 0; // Dynamic server rendering

// Generate Dynamic SEO Metadata
export async function generateMetadata({ params }: PostPageProps) {
  try {
    const { slug } = await params;
    const post = await postService.getPostBySlug(slug, 'en');
    if (!post) return {};

    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const seo = post.seo || {};

    let siteTitle = 'Blog';
    try {
      const settings = await settingsService.getSettings();
      const siteName = settings.site_name || 'Blog';
      siteTitle = settings.site_title || (siteName.toLowerCase().endsWith('blog') ? siteName : `${siteName} Blog`);
    } catch {}

    return {
      title: seo.meta_title || `${post.title} | ${siteTitle}`,
      description: seo.meta_description || post.summary || '',
      keywords: seo.meta_keywords || '',
      alternates: {
        canonical: seo.canonical_url || `${siteUrl}/posts/${post.slug}`,
      },
      openGraph: {
        title: seo.og_title || post.title,
        description: seo.og_description || post.summary || '',
        url: `${siteUrl}/posts/${post.slug}`,
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
  } catch (e) {
    console.error('Error generating metadata for post page:', e);
    return {};
  }
}

export default async function SingleBlogPostPage({ params }: PostPageProps) {
  const { slug } = await params;
  
  let siteName = 'Blog';
  try {
    const settings = await settingsService.getSettings();
    siteName = settings.site_name || 'Blog';
  } catch {}

  // Fetch post details (increments view count dynamically)
  const post = await postService.getPostBySlug(slug, 'en');

  if (!post || post.status !== 'published' || (post.published_at && new Date(post.published_at) > new Date())) {
    notFound();
  }

  // Load blocks from post.meta.editor_blocks if it exists
  let blocks: any[] | null = null;
  if (post.meta && post.meta.editor_blocks) {
    try {
      blocks = JSON.parse(post.meta.editor_blocks);
    } catch (e) {
      console.error('Failed to parse blocks inside slug view:', e);
    }
  }

  // Fetch related and sidebar items
  const relatedPosts = await postService.getRelatedPosts(post.id!, 3);
  const categoriesList = await categoryService.getAllCategories();
  
  const { posts: trending } = await postService.getPosts({
    status: 'published',
    orderBy: 'views',
    limit: 5,
  });

  // Table of Contents (TOC) builder: parse H2 headers in markdown
  const headingRegex = /^##\s+(.+)$/gm;
  const headings: Array<{ text: string; id: string }> = [];
  let match;
  // To avoid mutating matching state we can iterate
  const contentText = post.content || '';
  while ((match = headingRegex.exec(contentText)) !== null) {
    const text = match[1];
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    headings.push({ text, id });
  }

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const postUrl = `${siteUrl}/posts/${post.slug}`;

  // Structured Data Schema markup
  const jsonLdSchema = generateArticleSchema({
    title: post.title,
    slug: post.slug,
    summary: post.summary || '',
    published_at: post.published_at || new Date().toISOString(),
    author_name: post.author_name || `${siteName} Editor`,
    featured_image_url: post.featured_image_path || undefined,
    category_name: post.category_name || undefined,
  }, siteName);

  const schemas: any[] = [jsonLdSchema];
  if (blocks) {
    // 1. FAQ Schema
    const faqBlocks = blocks.filter((b: any) => b.type === 'faq');
    if (faqBlocks.length > 0) {
      const allFaqItems = faqBlocks.flatMap((b: any) => b.data.items || []);
      const validItems = allFaqItems.filter((item: any) => item.question && item.answer);
      if (validItems.length > 0) {
        schemas.push(generateFAQSchema(validItems));
      }
    }

    // 2. Review Schema
    const reviewBlocks = blocks.filter((b: any) => b.type === 'review');
    reviewBlocks.forEach((b: any) => {
      if (b.data.productName) {
        schemas.push(generateReviewSchema({
          productName: b.data.productName,
          rating: b.data.rating || 5,
          ratingMax: b.data.ratingMax || 5,
          summary: b.data.summary || '',
          authorName: post.author_name || `${siteName} Editor`,
          buyUrl: b.data.buyUrl
        }));
      }
    });
  }

  // 3. Breadcrumb Schema
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Posts', url: '/posts' },
  ];
  if (post.category_name && post.category_slug) {
    breadcrumbs.push({ name: post.category_name, url: `/categories/${post.category_slug}` });
  }
  breadcrumbs.push({ name: post.title, url: `/posts/${post.slug}` });
  schemas.push(generateBreadcrumbSchema(breadcrumbs));

  return (
    <LayoutWrapper>
      {/* Inject Structured Data Schemas */}
      {schemas.map((schema, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      {post.meta && post.meta.editor_type === 'visual' ? (
        <VisualRenderer data={JSON.parse(post.meta.editor_blocks)} />
      ) : (
        (() => {
          const postLayout = (post.meta && post.meta.post_layout) || 'layout_a';

          // Helper content body renderer
          const renderContentBody = () => {
            if (blocks && blocks.length > 0) {
              return <BlocksRenderer blocks={blocks} />;
            }
            
            // Render HTML if it contains standard HTML tags (like WP imports)
            if (contentText.includes('<p>') || contentText.includes('<p ') || contentText.includes('<h2') || contentText.includes('<figure')) {
              return (
                <div 
                  className="wp-content space-y-6 [&>p]:leading-normal [&>p]:font-normal [&>p]:text-[20px] [&>p]:text-black [&>p]:tracking-[-0.03em] [&>p]:mb-8 [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mt-8 [&>h2]:mb-4 [&>h3]:text-xl [&>h3]:font-bold [&>h3]:mt-6 [&>h3]:mb-3 [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-6 [&>li]:mb-2 [&>figure]:my-8 [&_img]:rounded-2xl"
                  dangerouslySetInnerHTML={{ __html: contentText }}
                />
              );
            }

            return (
              <div className="space-y-6">
                {contentText.split('\n\n').map((para, idx) => {
                  if (para.startsWith('## ')) {
                    const text = para.replace('## ', '');
                    const id = text
                      .toLowerCase()
                      .replace(/[^a-z0-9\s-]/g, '')
                      .replace(/\s+/g, '-')
                      .replace(/-+/g, '-');
                    return (
                      <h2 key={idx} id={id} className="text-xl font-bold text-slate-900 pt-4 mt-6 border-b pb-1.5 scroll-mt-20">
                        {text}
                      </h2>
                    );
                  }
                  if (para.startsWith('### ')) {
                    const text = para.replace('### ', '');
                    return (
                      <h3 key={idx} className="text-base font-bold text-slate-900 pt-2 mt-4">
                        {text}
                      </h3>
                    );
                  }
                  
                  // Video Embed parser helper
                  const ytRegex = /\[video\]\((?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)\)/i;
                  const ytMatch = para.match(ytRegex);
                  if (ytMatch && ytMatch[1]) {
                    const videoId = ytMatch[1];
                    return (
                      <div key={idx} className="aspect-video w-full rounded-2xl overflow-hidden shadow-sm border border-slate-100 my-6 bg-black">
                        <iframe
                          src={`https://www.youtube.com/embed/${videoId}`}
                          title="YouTube video player"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                        />
                      </div>
                    );
                  }

                  // Default paragraph rendering
                  return <p key={idx} className="leading-normal font-normal text-[20px] text-black tracking-[-0.03em] mb-8 whitespace-pre-wrap">{para}</p>;
                })}
              </div>
            );
          };

          // Helper author bio renderer
          const renderAuthorBlock = () => (
            <div className="flex items-center gap-3 py-2">
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold shrink-0">
                {post.author_name ? post.author_name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="text-sm">
                <p className="font-bold text-slate-800">By {post.author_name}</p>
                <p className="text-slate-400 mt-0.5">
                  Published on {post.published_at ? new Date(post.published_at).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Draft'}
                </p>
              </div>
            </div>
          );

          // Helper metadata info renderer
          const renderMetaInfo = () => (
            <div className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase">
              <span className="text-orange-500">{post.category_name || 'General'}</span>
              <span>•</span>
              <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> {post.read_time} min read</span>
              <span>•</span>
              <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" /> {(post.views ?? 0).toLocaleString()} views</span>
            </div>
          );

          // Helper social sharing links renderer
          const renderSocialSharing = () => (
            <div className="border-y border-slate-100 py-4 flex items-center justify-between gap-4 flex-wrap">
              <span className="text-sm font-bold text-slate-500 flex items-center gap-1.5">
                <Share2 className="h-4 w-4 text-orange-500" /> Share This Article:
              </span>
              <div className="flex gap-2">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(postUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                    className: "h-8 text-sm border-slate-200 flex items-center gap-1.5"
                  })}
                >
                  <svg className="h-3.5 w-3.5 fill-current text-[#1DA1F2]" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  Twitter
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                    className: "h-8 text-sm border-slate-200 flex items-center gap-1.5"
                  })}
                >
                  <svg className="h-3.5 w-3.5 fill-current text-[#1877F2]" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/></svg>
                  Facebook
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                    className: "h-8 text-sm border-slate-200 flex items-center gap-1.5"
                  })}
                >
                  <svg className="h-3.5 w-3.5 fill-current text-[#0A66C2]" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>
                  LinkedIn
                </a>
              </div>
            </div>
          );

          // Helper related posts renderer
          const renderRelatedPosts = () => (
            <div className="space-y-4 pt-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-orange-500" />
                Related Articles
              </h3>
              {relatedPosts.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No related articles found.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedPosts.map((rel) => (
                    <div key={rel.id} className="bg-white border rounded-xl overflow-hidden p-3 shadow-sm hover:shadow hover:border-orange-100/50 transition-all flex flex-col justify-between h-[230px]">
                      <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-50 shrink-0">
                        {rel.featured_image_path ? (
                          <img src={rel.featured_image_path} alt={rel.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <BookOpen className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <h4 className="font-semibold text-sm text-slate-900 hover:text-orange-500 transition-colors line-clamp-2 leading-snug mt-2 flex-1">
                        <Link href={`/posts/${rel.slug}`} dangerouslySetInnerHTML={{ __html: rel.title }} />
                      </h4>
                      <Link
                        href={`/posts/${rel.slug}`}
                        className={buttonVariants({
                          variant: "ghost",
                          size: "sm",
                          className: "text-orange-500 text-xs font-bold p-0 justify-start mt-2 hover:bg-transparent flex items-center"
                        })}
                      >
                        Read Article <ArrowRight className="h-3 w-3 ml-0.5" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );

          // Helper comments section renderer
          const renderCommentsSection = () => (
            <div className="border border-slate-100 bg-white p-6 rounded-2xl space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <MessageSquare className="h-4.5 w-4.5 text-orange-500" />
                Comments Section
              </h3>
              <div className="space-y-3.5">
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <p className="text-sm font-bold text-slate-800">Sarah Jenkins</p>
                  <p className="text-slate-500 text-sm leading-normal">
                    This is an incredibly detailed writeup! The repository architecture suggestion makes scaling the blog to marketplace modules look very clean.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <p className="text-sm font-bold text-slate-800">David Miller</p>
                  <p className="text-slate-500 text-sm leading-normal">
                    Great tutorial on raw SQL pool queries in Next.js. The speed is significantly faster than Prisma overhead.
                  </p>
                </div>
              </div>

              {/* Form placeholder */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <p className="text-sm font-bold text-slate-600">Leave a Reply</p>
                <textarea
                  placeholder="Write your comment here..."
                  className="w-full text-sm p-3 rounded-lg border border-slate-200 focus:outline-none focus:border-orange-500 h-20"
                  disabled
                />
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold h-8" disabled>
                  Submit Comment (Future Release)
                </Button>
              </div>
            </div>
          );

          // Layout B: Centered Narrow Minimal Reading Document
          if (postLayout === 'layout_b') {
            return (
              <div className="max-w-3xl mx-auto py-10 animate-in fade-in duration-300 space-y-8">
                <div className="text-center space-y-4">
                  {renderMetaInfo()}
                  <h1 
                    className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight max-w-2xl mx-auto"
                    dangerouslySetInnerHTML={{ __html: post.title }}
                  />
                  {post.summary && <p className="text-slate-500 text-sm max-w-xl mx-auto" dangerouslySetInnerHTML={{ __html: post.summary }} />}
                  <div className="flex justify-center border-y border-slate-100 py-1.5 max-w-md mx-auto">
                    {renderAuthorBlock()}
                  </div>
                </div>

                <div className="rounded-3xl overflow-hidden border border-slate-150 shadow-md bg-slate-50 max-h-[450px]">
                  {post.featured_image_path ? (
                    <img src={post.featured_image_path} alt={post.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="h-64 flex items-center justify-center text-slate-300">
                      <BookOpen className="h-16 w-16" />
                    </div>
                  )}
                </div>

                <div className="prose prose-slate lg:prose-lg max-w-none text-slate-800 leading-relaxed text-base">
                  {renderContentBody()}
                </div>

                <div className="pt-4 space-y-8">
                  {renderSocialSharing()}
                  {renderRelatedPosts()}
                  {renderCommentsSection()}
                </div>
              </div>
            );
          }

          // Layout C: Bold Magazine Split Hero
          if (postLayout === 'layout_c') {
            return (
              <div className="py-10 animate-in fade-in duration-300 space-y-10">
                {/* Hero section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-b border-slate-200 pb-10">
                  <div className="lg:col-span-7 space-y-4">
                    {renderMetaInfo()}
                    <h1 
                      className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-none text-slate-900"
                      dangerouslySetInnerHTML={{ __html: post.title }}
                    />
                    {post.summary && (
                      <p 
                        className="text-base sm:text-lg text-slate-500 leading-relaxed border-l-4 border-orange-500 pl-4 italic"
                        dangerouslySetInnerHTML={{ __html: post.summary }}
                      />
                    )}
                    <div className="pt-2">
                      {renderAuthorBlock()}
                    </div>
                  </div>
                  <div className="lg:col-span-5">
                    <div className="rounded-3xl overflow-hidden border border-slate-100 shadow-2xl aspect-[4/3] bg-slate-50">
                      {post.featured_image_path ? (
                        <img src={post.featured_image_path} alt={post.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <BookOpen className="h-16 w-16" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Body Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="lg:col-span-2 space-y-8">
                    <div className="prose prose-slate lg:prose-lg max-w-none text-slate-700 leading-relaxed text-base">
                      {renderContentBody()}
                    </div>
                    {renderSocialSharing()}
                    {renderRelatedPosts()}
                    {renderCommentsSection()}
                  </div>
                  
                  {/* Sidebar */}
                  <div>
                    <Sidebar categories={categoriesList} recentPosts={trending} />
                  </div>
                </div>
              </div>
            );
          }

          // Layout A (Default): Standard detailed with left TOC and right Sidebar
          return (
            <div className="editorial-container py-10 animate-in fade-in duration-300">
              {/* Ad Block Placeholder (Header) */}
              <div className="bg-slate-100/80 border text-xs font-semibold text-slate-400 py-3 text-center rounded-2xl mb-8 tracking-wider uppercase">
                Advertisement Block
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Main article body */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Header info */}
                  <div className="space-y-4">
                    {renderMetaInfo()}
                    <h1 
                      className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-tight"
                      dangerouslySetInnerHTML={{ __html: post.title }}
                    />

                    {/* Author bio details */}
                    <div className="border-y border-slate-100 py-1">
                      {renderAuthorBlock()}
                    </div>
                  </div>

                  {/* Featured Image */}
                  <div className="rounded-3xl overflow-hidden border border-slate-100 aspect-video bg-slate-50 relative">
                    {post.featured_image_path ? (
                      <img
                        src={post.featured_image_path}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <BookOpen className="h-16 w-16" />
                      </div>
                    )}
                  </div>

                  {/* Layout layout wrapper: TOC + Article content */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Desktop Table of Contents (Left) */}
                    {headings.length > 0 && (
                      <div className="hidden md:block md:col-span-1 space-y-4 h-fit sticky top-20">
                        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                          <TrendingUp className="h-3.5 w-3.5 text-orange-500" />
                          On This Page
                        </h4>
                        <ul className="space-y-2 text-sm font-semibold text-slate-500 border-l border-slate-100 pl-3">
                          {headings.map((heading, idx) => (
                            <li key={idx}>
                              <a
                                href={`#${heading.id}`}
                                className="hover:text-orange-500 block transition-colors py-0.5"
                              >
                                {heading.text}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Content body (Right) */}
                    <div className={`${headings.length > 0 ? 'md:col-span-3' : 'md:col-span-4'} prose prose-slate lg:prose-lg max-w-none text-slate-700 leading-relaxed text-base`}>
                      {renderContentBody()}
                    </div>
                  </div>

                  {renderSocialSharing()}

                  {/* Ad Block Placeholder (Footer) */}
                  <div className="bg-slate-100/80 border text-xs font-semibold text-slate-400 py-6 text-center rounded-2xl tracking-wider uppercase">
                    In-Article Placement Box
                  </div>

                  {renderRelatedPosts()}
                  {renderCommentsSection()}
                </div>

                {/* Right Column: Sidebar */}
                <div>
                  <Sidebar categories={categoriesList} recentPosts={trending} />
                </div>
              </div>
            </div>
          );
        })()
      )}
    </LayoutWrapper>
  );
}
