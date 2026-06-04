import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { postService } from '@/modules/posts';
import { newsletterService } from '@/modules/newsletter';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const blogAnalytics = await postService.getDashboardAnalytics();
    const subscribers = await newsletterService.getSubscribers();
    
    return NextResponse.json({
      ...blogAnalytics,
      totalSubscribers: subscribers.length,
      subscribers: subscribers.slice(0, 5), // Include latest 5 subscribers
    });
  } catch (err: any) {
    console.error('Admin GET analytics error:', err.message);
    return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 });
  }
}
