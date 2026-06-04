import { NextRequest, NextResponse } from 'next/server';
import { getSession, hasPermission } from '@/lib/auth';
import { pageService } from '@/modules/pages';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !hasPermission(session, 'manage_all_content')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const pageId = Number(id);
  if (isNaN(pageId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const page = await pageService.getPage(pageId);
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json(page);
  } catch (err: any) {
    console.error('Admin GET page by ID error:', err.message);
    return NextResponse.json({ error: 'Failed to fetch page' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !hasPermission(session, 'manage_all_content')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const pageId = Number(id);
  if (isNaN(pageId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { title, slug, content, template_id, status, language_code, translation_group_id, seo } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (content !== undefined) updateData.content = content;
    if (template_id !== undefined) updateData.template_id = Number(template_id);
    if (status !== undefined) updateData.status = status;
    if (language_code !== undefined) updateData.language_code = language_code;
    if (translation_group_id !== undefined) updateData.translation_group_id = translation_group_id;
    if (seo !== undefined) updateData.seo = seo;

    await pageService.updatePage(pageId, updateData);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Admin PUT page error:', err.message);
    return NextResponse.json({ error: err.message || 'Failed to update page' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !hasPermission(session, 'manage_all_content')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const pageId = Number(id);
  if (isNaN(pageId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    await pageService.deletePage(pageId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Admin DELETE page error:', err.message);
    return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 });
  }
}
