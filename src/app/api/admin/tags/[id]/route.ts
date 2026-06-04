import { NextRequest, NextResponse } from 'next/server';
import { getSession, hasPermission } from '@/lib/auth';
import { tagService } from '@/modules/tags';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !hasPermission(session, 'manage_all_content')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const tagId = Number(id);
  if (isNaN(tagId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { name, slug, description, language_code, translation_group_id } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (language_code !== undefined) updateData.language_code = language_code;
    if (translation_group_id !== undefined) updateData.translation_group_id = translation_group_id;

    await tagService.updateTag(tagId, updateData);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Admin PUT tag error:', err.message);
    return NextResponse.json({ error: err.message || 'Failed to update tag' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !hasPermission(session, 'manage_all_content')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const tagId = Number(id);
  if (isNaN(tagId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    await tagService.deleteTag(tagId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Admin DELETE tag error:', err.message);
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 });
  }
}
