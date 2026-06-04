import { NextRequest, NextResponse } from 'next/server';
import { getSession, hasPermission } from '@/lib/auth';
import { redirectService } from '@/modules/redirects';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !hasPermission(session, 'manage_settings')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const redirects = await redirectService.getAllRedirects();
    return NextResponse.json(redirects);
  } catch (err: any) {
    console.error('Admin GET redirects error:', err.message);
    return NextResponse.json({ error: 'Failed to fetch redirects' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !hasPermission(session, 'manage_settings')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { old_url, new_url, status_code } = await req.json();

    if (!old_url || !new_url) {
      return NextResponse.json({ error: 'Old URL and New URL are required' }, { status: 400 });
    }

    const id = await redirectService.createRedirect({
      old_url,
      new_url,
      status_code: status_code ? Number(status_code) : 301,
    });

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('Admin POST redirect error:', err.message);
    return NextResponse.json({ error: err.message || 'Failed to create redirect' }, { status: 500 });
  }
}
