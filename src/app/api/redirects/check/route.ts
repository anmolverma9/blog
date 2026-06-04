import { NextRequest, NextResponse } from 'next/server';
import { redirectService } from '@/modules/redirects';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const redirect = await redirectService.checkRedirect(url);
    return NextResponse.json(redirect || null);
  } catch (err: any) {
    console.error('Redirect check API error:', err.message);
    return NextResponse.json(null);
  }
}
