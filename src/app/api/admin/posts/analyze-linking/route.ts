import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getInternalLinkSuggestions } from '@/lib/linking';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { postId, content } = await req.json();

    if (!content) {
      return NextResponse.json([]);
    }

    const suggestions = await getInternalLinkSuggestions(postId ? Number(postId) : null, content);
    return NextResponse.json(suggestions);
  } catch (err: any) {
    console.error('Analyze linking error:', err.message);
    return NextResponse.json({ error: 'Failed to analyze content linking' }, { status: 500 });
  }
}
