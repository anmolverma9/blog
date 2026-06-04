import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { generateAutoSEOSuggestions } from '@/lib/seo';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, content, summary } = await req.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required for SEO generation' }, { status: 400 });
    }

    const suggestions = generateAutoSEOSuggestions(title, content || '', summary || '');
    return NextResponse.json(suggestions);
  } catch (err: any) {
    console.error('SEO Suggestion error:', err.message);
    return NextResponse.json({ error: 'Failed to generate SEO suggestions' }, { status: 500 });
  }
}
