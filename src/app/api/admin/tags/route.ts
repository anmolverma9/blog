import { NextRequest, NextResponse } from 'next/server';
import { getSession, hasPermission } from '@/lib/auth';
import { tagService } from '@/modules/tags';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get('lang') || undefined;
    const tags = await tagService.getAllTags(lang);
    return NextResponse.json(tags);
  } catch (err: any) {
    console.error('Admin GET tags error:', err.message);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !hasPermission(session, 'manage_all_content')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { name, slug, description, language_code, translation_group_id } = await req.json();

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const id = await tagService.createTag({
      name,
      slug,
      description,
      language_code: language_code || 'en',
      translation_group_id,
    });

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('Admin POST tag error:', err.message);
    return NextResponse.json({ error: err.message || 'Failed to create tag' }, { status: 500 });
  }
}
