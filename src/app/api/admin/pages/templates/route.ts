import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { pageService } from '@/modules/pages';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const templates = await pageService.getTemplates();
    return NextResponse.json(templates);
  } catch (err: any) {
    console.error('Admin GET templates error:', err.message);
    return NextResponse.json({ error: 'Failed to fetch page templates' }, { status: 500 });
  }
}
