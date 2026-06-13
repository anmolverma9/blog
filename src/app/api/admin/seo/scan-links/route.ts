import { NextRequest, NextResponse } from 'next/server';
import { getSession, hasPermission } from '@/lib/auth';
import pool from '@/lib/db';
import { settingsService } from '@/modules/settings';

export const maxDuration = 60; // Allow long execution times for link audits

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !hasPermission(session, 'manage_settings')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch settings for dynamic User-Agent
    let siteName = 'Blog';
    try {
      const settings = await settingsService.getSettings();
      siteName = settings.site_name || 'Blog';
    } catch {}

    // 1. Fetch published posts and pages
    const [posts]: any = await pool.query('SELECT id, title, slug, content FROM posts WHERE status = "published"');
    const [pages]: any = await pool.query('SELECT id, title, slug, content FROM pages WHERE status = "published"');

    // 2. Fetch all valid post slugs and page slugs to cross-reference
    const validPostSlugs = new Set<string>(posts.map((p: any) => String(p.slug || '').toLowerCase()));
    const validPageSlugs = new Set<string>(pages.map((p: any) => String(p.slug || '').toLowerCase()));

    const auditedLinks: any[] = [];
    const brokenLinks: any[] = [];
    let linkCount = 0;

    const linkRegex = /href=["']([^"']+)["']|\]\(([^)]+)\)/gi;

    // Helper to scan a content body
    async function scanContent(entityId: number, entityType: 'post' | 'page', title: string, content: string) {
      let match;
      while ((match = linkRegex.exec(content)) !== null) {
        const url = match[1] || match[2];
        if (!url || url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:')) {
          continue;
        }

        linkCount++;
        let isBroken = false;
        let statusCode = 200;
        let errorMsg = '';
        let fixSuggestion = '';

        const cleanUrl = url.trim();

        // Check relative internal links
        if (cleanUrl.startsWith('/')) {
          const pathParts = cleanUrl.split('?')[0].split('#')[0].split('/');
          const slug = pathParts[pathParts.length - 1];

          if (cleanUrl.startsWith('/posts/')) {
            if (!validPostSlugs.has(slug.toLowerCase())) {
              isBroken = true;
              statusCode = 404;
              errorMsg = 'Internal post slug not found';
              // Suggest closest match
              const closest = Array.from(validPostSlugs).find(s => s.includes(slug.toLowerCase()) || slug.toLowerCase().includes(s));
              fixSuggestion = closest ? `Change link to /posts/${closest}` : 'Redirect to posts archive or delete link';
            }
          } else {
            // General page checks
            if (slug && !validPageSlugs.has(slug.toLowerCase()) && slug.toLowerCase() !== 'posts' && slug.toLowerCase() !== 'search') {
              isBroken = true;
              statusCode = 404;
              errorMsg = 'Internal page slug not found';
              const closest = Array.from(validPageSlugs).find(s => s.includes(slug.toLowerCase()) || slug.toLowerCase().includes(s));
              fixSuggestion = closest ? `Change link to /${closest}` : 'Create redirection rule';
            }
          }
        } else if (cleanUrl.startsWith('http')) {
          // Check external links with a short timeout fetch
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout

            const res = await fetch(cleanUrl, {
              method: 'HEAD',
              headers: { 'User-Agent': `Mozilla/5.0 ${siteName} Link Checker` },
              signal: controller.signal,
            }).catch(() => {
              // Retry with GET if HEAD fails
              return fetch(cleanUrl, {
                method: 'GET',
                headers: { 'User-Agent': `Mozilla/5.0 ${siteName} Link Checker` },
                signal: controller.signal,
              });
            });

            clearTimeout(timeoutId);
            statusCode = res.status;
            if (res.status >= 400) {
              isBroken = true;
              errorMsg = `HTTP Error Status: ${res.status}`;
              fixSuggestion = 'Configure a 301 redirect or update the external reference';
            }
          } catch (err: any) {
            isBroken = true;
            statusCode = 0;
            errorMsg = err.name === 'AbortError' ? 'Timeout abort (link slow)' : err.message || 'Connection Refused';
            fixSuggestion = 'Remove broken external anchor or check server hostname settings';
          }
        }

        if (isBroken) {
          brokenLinks.push({
            url: cleanUrl,
            entityId,
            entityType,
            entityTitle: title,
            statusCode,
            error: errorMsg,
            suggestion: fixSuggestion,
          });
        }
      }
    }

    // Scan all posts content
    for (const post of posts) {
      await scanContent(post.id, 'post', post.title, post.content);
    }

    // Scan all pages content
    for (const page of pages) {
      await scanContent(page.id, 'page', page.title, page.content);
    }

    return NextResponse.json({
      success: true,
      scannedLinksCount: linkCount,
      brokenLinks,
    });
  } catch (err: any) {
    console.error('Link Scanner API error:', err.message);
    return NextResponse.json({ error: 'Failed to complete link scan' }, { status: 500 });
  }
}
