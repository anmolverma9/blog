import { NextRequest, NextResponse } from 'next/server';
import { categoryService } from '@/modules/categories';

// Global CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const lang = searchParams.get('lang') || undefined;

    // Fetch from CategoryService
    const categories = await categoryService.getAllCategories(lang);

    // Map internal DB category fields to clean output fields
    const mappedCategories = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
    }));

    return NextResponse.json(
      {
        categories: mappedCategories,
      },
      {
        headers: corsHeaders,
      }
    );
  } catch (err: any) {
    console.error('Public Categories API GET error:', err.message);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
