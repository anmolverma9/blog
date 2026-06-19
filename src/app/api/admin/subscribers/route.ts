import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { newsletterService } from '@/modules/newsletter';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role === 'Subscriber' || session.role === 'Reader') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const subscribers = await newsletterService.getSubscribers();
    return NextResponse.json(subscribers);
  } catch (err: any) {
    console.error('Admin GET subscribers error:', err.message);
    return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 });
  }
}
