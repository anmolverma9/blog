import { NextRequest, NextResponse } from 'next/server';
import { getSession, hasPermission } from '@/lib/auth';
import { categoryService } from '@/modules/categories';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !hasPermission(session, 'manage_all_content')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const catId = Number(id);
  if (isNaN(catId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { name, slug, description, parent_id, language_code, translation_group_id } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (parent_id !== undefined) updateData.parent_id = parent_id ? Number(parent_id) : null;
    if (language_code !== undefined) updateData.language_code = language_code;
    if (translation_group_id !== undefined) updateData.translation_group_id = translation_group_id;

    await categoryService.updateCategory(catId, updateData);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Admin PUT category error:', err.message);
    return NextResponse.json({ error: err.message || 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !hasPermission(session, 'manage_all_content')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const catId = Number(id);
  if (isNaN(catId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    await categoryService.deleteCategory(catId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Admin DELETE category error:', err.message);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
