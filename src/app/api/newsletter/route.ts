import { NextRequest, NextResponse } from 'next/server';
import { newsletterService } from '@/modules/newsletter';
import { isValidEmail } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const { email, sourcePage } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    await newsletterService.subscribe(email, sourcePage || 'website');
    return NextResponse.json({ success: true, message: 'Subscribed successfully!' });
  } catch (err: any) {
    console.error('Newsletter subscribe error:', err.message);
    return NextResponse.json({ error: err.message || 'An error occurred during subscription' }, { status: 400 });
  }
}
