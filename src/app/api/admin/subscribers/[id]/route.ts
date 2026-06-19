import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { newsletterService } from '@/modules/newsletter';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role === 'Subscriber' || session.role === 'Reader') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const subId = Number(id);
  if (isNaN(subId)) {
    return NextResponse.json({ error: 'Invalid Subscriber ID' }, { status: 400 });
  }

  try {
    const success = await newsletterService.removeSubscriber(subId);
    if (!success) {
      return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Admin DELETE subscriber error:', err.message);
    return NextResponse.json({ error: 'Failed to delete subscriber' }, { status: 500 });
  }
}
