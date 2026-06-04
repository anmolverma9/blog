import { NextRequest, NextResponse } from 'next/server';
import { getSession, hasPermission } from '@/lib/auth';
import { pageService } from '@/modules/pages';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !hasPermission(session, 'manage_all_content')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const pages = await pageService.getAllPages();
    return NextResponse.json(pages);
  } catch (err: any) {
    console.error('Admin GET pages error:', err.message);
    return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !hasPermission(session, 'manage_all_content')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { title, slug, content, template_id, status, language_code, translation_group_id, seo } = body;

    if (!title || !slug || !content || !template_id) {
      return NextResponse.json({ error: 'Title, slug, content, and template are required' }, { status: 400 });
    }

    const id = await pageService.createPage({
      title,
      slug,
      content,
      template_id: Number(template_id),
      status: status || 'draft',
      language_code: language_code || 'en',
      translation_group_id: translation_group_id || null,
      seo,
    });

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('Admin POST page error:', err.message);
    return NextResponse.json({ error: err.message || 'Failed to create page' }, { status: 500 });
  }
}
