import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  // Support both synchronous and asynchronous params (for Next.js 15+ compatibility)
  const resolvedParams = 'then' in params ? await params : params;
  const filePathArray = resolvedParams.path;
  const filePathStr = filePathArray.join('/');

  // Target live blog URL uploads directory
  const targetUrl = `https://adluxury.com/blog/uploads/${filePathStr}`;

  try {
    const res = await fetch(targetUrl);
    if (!res.ok) {
      return new NextResponse('Not found on live site', { status: 404 });
    }

    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err: any) {
    console.error('Failed to proxy upload image from live server:', err.message);
    return new NextResponse('Error proxying upload from live site', { status: 500 });
  }
}
