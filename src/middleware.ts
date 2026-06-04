import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', pathname);

  // 1. Skip system files, static assets, APIs, and uploads
  if (
    pathname.startsWith('/api') ||
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
  const isAdminPath = pathname.startsWith('/admin');
  const isLoginPage = pathname === '/admin/login';

  if (isAdminPath && !isLoginPage) {
    if (!sessionCookie) {
      // Redirect to login page
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  if (isLoginPage && sessionCookie) {
    // If already logged in, redirect to admin home
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  // 3. 301 Redirects System (For public pages)
  if (!isAdminPath) {
    try {
      // Fetch check redirect API
      const checkRes = await fetch(
        `${req.nextUrl.origin}/api/redirects/check?url=${encodeURIComponent(pathname)}`
      );

      if (checkRes.ok) {
        const redirect = await checkRes.json();
        if (redirect && redirect.new_url) {
          const statusCode = redirect.status_code === 302 ? 302 : 301;
          
          // Redirect to the new URL
          return NextResponse.redirect(new URL(redirect.new_url, req.url), statusCode);
        }
      }
    } catch (err) {
      console.error('Middleware redirect check error:', err);
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
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
