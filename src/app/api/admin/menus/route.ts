import { NextRequest, NextResponse } from 'next/server';
import { getSession, hasPermission } from '@/lib/auth';
import { menuService } from '@/modules/menus';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !hasPermission(session, 'manage_settings')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug') || 'header';

  try {
    const menu = await menuService.getMenuBySlug(slug);
    if (!menu) {
      // Return a blank template menu for this slug if not found yet
      return NextResponse.json({
        name: slug === 'header'
          ? 'Header Menu'
          : slug === 'footer_quick_links'
          ? 'Footer Quick Links'
          : slug === 'footer_legal'
          ? 'Footer Legal Links'
          : slug,
        slug,
        items: []
      });
    }
    return NextResponse.json(menu);
  } catch (err: any) {
    console.error(`Admin GET menu [${slug}] error:`, err.message);
    return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !hasPermission(session, 'manage_settings')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { name, slug, items } = await req.json();

    if (!name || !slug) {
      return NextResponse.json({ error: 'Menu name and slug are required' }, { status: 400 });
    }

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Menu items must be an array' }, { status: 400 });
    }

    // Validate and clean each menu item
    const cleanedItems = items.map((item: any, idx: number) => {
      if (!item.label || !item.url) {
        throw new Error(`Menu item at index ${idx} must have a label and url`);
      }
      return {
        label: String(item.label).trim(),
        url: String(item.url).trim(),
        parent_id: item.parent_id ? Number(item.parent_id) : null,
        order_no: typeof item.order_no === 'number' ? item.order_no : idx,
      };
    });

    await menuService.saveMenu(slug, name, cleanedItems);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Admin POST menu error:', err.message);
    return NextResponse.json({ error: err.message || 'Failed to save menu' }, { status: 500 });
  }
}
