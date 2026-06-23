import { NextRequest, NextResponse } from 'next/server';
import { postService } from '@/modules/posts';

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

    // Parse pagination parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '6', 10)));
    const offset = (page - 1) * limit;

    // Parse filters
    const search = searchParams.get('search') || searchParams.get('q') || undefined;
    const category = searchParams.get('category') || undefined;
    const categoryIdVal = searchParams.get('categoryId');
    const categoryId = categoryIdVal ? parseInt(categoryIdVal, 10) : undefined;
    const lang = searchParams.get('lang') || 'en';

    // Parse sorting
    const orderBy = searchParams.get('orderBy') || 'published_at';
    const order = (searchParams.get('order') || 'desc').toLowerCase();

    // Map order fields to the repository syntax
    let orderByOption = 'published_at_desc';
    if (orderBy === 'views') {
      orderByOption = order === 'asc' ? 'views_asc' : 'views_desc';
    } else if (orderBy === 'published_at') {
      orderByOption = order === 'asc' ? 'published_at_asc' : 'published_at_desc';
    } else if (orderBy === 'created_at') {
      orderByOption = order === 'asc' ? 'created_at_asc' : 'created_at_desc';
    } else if (orderBy === 'title') {
      orderByOption = order === 'asc' ? 'title_asc' : 'title_desc';
    } else if (orderBy === 'random') {
      orderByOption = 'random';
    }

    // Fetch from PostService
    const { posts, total } = await postService.getPosts({
      status: 'published',
      categoryId,
      categorySlug: category,
      search,
      lang,
      limit,
      offset,
      orderBy: orderByOption,
    });

    // Base URL construction for absolute URLs
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

    // Map internal DB objects to a clean external JSON API format
    const mappedPosts = posts.map((post) => {
      const imagePath = post.featured_image_path;
      const imageUrl = imagePath
        ? imagePath.startsWith('http')
          ? imagePath
          : `${appUrl.replace(/\/$/, '')}${imagePath}`
        : null;

      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        summary: post.summary || '',
        published_at: post.published_at,
        read_time: post.read_time || 0,
        views: post.views || 0,
        language_code: post.language_code,
        author: {
          name: post.author_name || 'Admin',
        },
        category: post.category_id
          ? {
              id: post.category_id,
              name: post.category_name,
              slug: post.category_slug,
            }
          : null,
        featured_image: imagePath
          ? {
              path: imagePath,
              url: imageUrl,
            }
          : null,
        url: `${appUrl.replace(/\/$/, '')}/${post.slug}`,
      };
    });

    // Build pagination response details
    const totalPages = Math.ceil(total / limit);
    const pagination = {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };

    return NextResponse.json(
      {
        posts: mappedPosts,
        pagination,
      },
      {
        headers: corsHeaders,
      }
    );
  } catch (err: any) {
    console.error('Public Posts API GET error:', err.message);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
