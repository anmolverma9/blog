import { NextRequest, NextResponse } from 'next/server';

function parseJWTPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payloadB64 = parts[1];
    const base64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = atob(base64);
    // Decode utf-8 characters properly
    const utf8Payload = decodeURIComponent(
      jsonPayload
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(utf8Payload);
  } catch {
    return null;
  }
}

const ROLE_PERMISSIONS_FALLBACK: Record<string, string[]> = {
  'Super Admin': [
    'create_posts', 'edit_posts', 'delete_posts', 'publish_posts',
    'manage_categories', 'manage_media', 'manage_seo', 'manage_redirects',
    'manage_settings', 'manage_users', 'manage_kb', 'manage_software', 'manage_pages'
  ],
  'Admin': [
    'create_posts', 'edit_posts', 'delete_posts', 'publish_posts',
    'manage_categories', 'manage_media', 'manage_kb', 'manage_pages'
  ],
  'Editor': [
    'edit_posts', 'publish_posts', 'manage_categories'
  ],
  'Author': [
    'create_posts', 'edit_posts', 'manage_media'
  ],
  'Contributor': [
    'create_posts', 'edit_posts'
  ],
  'Subscriber': [],
  'Reader': []
};

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', pathname);

  // 1. Skip system files, static assets, public APIs, and uploads
  const isApiAdmin = pathname.startsWith('/api/admin');
  if (
    (pathname.startsWith('/api') && !isApiAdmin) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/uploads') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      }
    });
  }

  // 2. Admin Authentication Route Protection
  const sessionCookie = req.cookies.get('appluxe_session')?.value;
  const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  const isLoginPage = pathname === '/admin/login';

  if (isAdminPath && !isLoginPage) {
    if (!sessionCookie) {
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    const session = parseJWTPayload(sessionCookie);
    if (!session) {
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const res = NextResponse.redirect(new URL('/admin/login', req.url));
      res.cookies.delete('appluxe_session');
      return res;
    }

    // Role and permission validation
    let role = session.role || 'Subscriber';
    if (role === 'Reader') role = 'Subscriber';

    const tokenPermissions: string[] = session.permissions || [];
    const fallbackPerms = ROLE_PERMISSIONS_FALLBACK[role] || [];
    const permissions = Array.from(new Set([...tokenPermissions, ...fallbackPerms]));

    // Subscriber is only allowed to access profile
    if (role === 'Subscriber' && pathname !== '/admin/profile' && pathname !== '/api/admin/profile') {
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/admin/profile', req.url));
    }

    // Granular privilege checks for all non-Super-Admins
    if (role !== 'Super Admin') {
      const checks = [
        { path: '/admin/users', api: '/api/admin/users', perm: 'manage_users' },
        { path: '/admin/settings', api: '/api/admin/settings', perm: 'manage_settings' },
        { path: '/admin/seo', api: '/api/admin/seo', perm: 'manage_seo' },
        { path: '/admin/redirects', api: '/api/admin/redirects', perm: 'manage_redirects' },
        { path: '/admin/software', api: '/api/admin/software', perm: 'manage_software' },
        { path: '/admin/kb', api: '/api/admin/kb', perm: 'manage_kb' },
        { path: '/admin/pages', api: '/api/admin/pages', perm: 'manage_pages' },
        { path: '/admin/categories', api: '/api/admin/categories', perm: 'manage_categories' },
        { path: '/admin/editorial', api: '/api/admin/editorial', perm: 'publish_posts' },
        { path: '/admin/media', api: '/api/admin/media', perm: 'manage_media' },
      ];

      for (const check of checks) {
        const matchesPage = pathname.startsWith(check.path);
        const matchesApi = pathname.startsWith(check.api);
        if ((matchesPage || matchesApi) && !permissions.includes(check.perm)) {
          if (matchesApi) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
          }
          return NextResponse.redirect(new URL('/admin/profile', req.url));
        }
      }

      // Check posts permissions
      const matchesPostPage = pathname.startsWith('/admin/posts');
      const matchesPostApi = pathname.startsWith('/api/admin/posts');
      if ((matchesPostPage || matchesPostApi) && !permissions.includes('edit_posts') && !permissions.includes('create_posts')) {
        if (matchesPostApi) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        return NextResponse.redirect(new URL('/admin/profile', req.url));
      }
    }
  }

  if (isLoginPage && sessionCookie) {
    const session = parseJWTPayload(sessionCookie);
    if (session) {
      if (session.role === 'Subscriber' || session.role === 'Reader') {
        return NextResponse.redirect(new URL('/admin/profile', req.url));
      }
      return NextResponse.redirect(new URL('/admin', req.url));
    }
  }

  // 3. 301 Redirects System (For public pages)
  const isApiRoute = pathname.startsWith('/api');
  if (!isAdminPath && !isApiRoute) {
    try {
      // Fetch check redirect API
      const checkRes = await fetch(
        `${req.nextUrl.origin}/api/redirects/check?url=${encodeURIComponent(pathname)}`
      );

      if (checkRes.ok) {
        const redirect = await checkRes.json();
        if (redirect && redirect.new_url) {
          const statusCode = redirect.status_code === 302 ? 302 : 301;
          return NextResponse.redirect(new URL(redirect.new_url, req.url), statusCode);
        }
      }
    } catch (err) {
      console.error('Proxy redirect check error:', err);
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    }
  });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|uploads).*)',
  ],
};
