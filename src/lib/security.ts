import { NextRequest } from 'next/server';

// Very simple in-memory store for sliding window rate limiting
const ipRequestLogs: Record<string, number[]> = {};

// Clean up memory every 5 minutes
if (typeof global !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const ip in ipRequestLogs) {
      ipRequestLogs[ip] = ipRequestLogs[ip].filter(timestamp => now - timestamp < 60000);
      if (ipRequestLogs[ip].length === 0) {
        delete ipRequestLogs[ip];
      }
    }
  }, 300000).unref?.();
}

/**
 * Checks if a request violates rate limits (default 60 requests per minute per IP)
 */
export function isRateLimited(req: NextRequest, limit: number = 60): boolean {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || (req as any).ip || 'unknown';
  if (ip === 'unknown') return false;

  const now = Date.now();
  if (!ipRequestLogs[ip]) {
    ipRequestLogs[ip] = [];
  }

  // Filter out timestamps older than 60s
  ipRequestLogs[ip] = ipRequestLogs[ip].filter(timestamp => now - timestamp < 60000);

  if (ipRequestLogs[ip].length >= limit) {
    return true;
  }

  ipRequestLogs[ip].push(now);
  return false;
}

/**
 * Basic HTML/XSS Sanitizer for markdown content and posts.
 * Prevents execution of inline scripts and harmful tags.
 */
export function sanitizeXSS(html: string): string {
  if (!html) return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Strip script tags
    .replace(/onload\s*=\s*"[^"]*"/gi, '')
    .replace(/onerror\s*=\s*"[^"]*"/gi, '')
    .replace(/onclick\s*=\s*"[^"]*"/gi, '')
    .replace(/javascript:/gi, 'no-javascript:');
}

/**
 * Helper to validate email strings.
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Helper to validate slugs (lowercase alphanumeric and hyphens).
 */
export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}
