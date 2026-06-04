import { NextRequest, NextResponse } from 'next/server';
import { getSession, hasPermission } from '@/lib/auth';
import { categoryService } from '@/modules/categories';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get('lang') || undefined;
    const categories = await categoryService.getAllCategories(lang);
    return NextResponse.json(categories);
  } catch (err: any) {
    console.error('Admin GET categories error:', err.message);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !hasPermission(session, 'manage_all_content')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { name, slug, description, parent_id, language_code, translation_group_id } = await req.json();

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const id = await categoryService.createCategory({
      name,
      slug,
      description,
      parent_id: parent_id ? Number(parent_id) : null,
      language_code: language_code || 'en',
      translation_group_id,
    });

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('Admin POST category error:', err.message);
    return NextResponse.json({ error: err.message || 'Failed to create category' }, { status: 500 });
  }
}
