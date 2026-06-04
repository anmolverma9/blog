import { NextRequest, NextResponse } from 'next/server';
import { getSession, hasPermission } from '@/lib/auth';
import { postService } from '@/modules/posts';
import { userService } from '@/modules/users';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const categoryId = searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : undefined;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 20;
    const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : 0;

    let authorId: number | undefined = undefined;

    // If role is Author, they can only see/manage their own posts
    if (session.role === 'Author') {
      const author = await userService.getAuthorByUserId(session.id);
      if (!author) {
        return NextResponse.json({ error: 'Author profile not found' }, { status: 403 });
      }
      authorId = author.id;
    }

    const { posts, total } = await postService.getPosts({
      search,
      status,
      categoryId,
      authorId,
      limit,
      offset,
    });

    return NextResponse.json({ posts, total });
  } catch (err: any) {
    console.error('Admin GET posts error:', err.message);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, slug, content, summary, status, category_id, featured_image_id, tagIds, meta, seo } = body;

    if (!title || !slug || !content) {
      return NextResponse.json({ error: 'Title, slug, and content are required' }, { status: 400 });
    }

    // Identify author profile
    const author = await userService.getAuthorByUserId(session.id);
    if (!author) {
      return NextResponse.json({ error: 'Author profile not found' }, { status: 403 });
    }

    const newPost = {
      title,
      slug,
      content,
      summary,
      status,
      author_id: author.id!,
      category_id: category_id ? Number(category_id) : null,
      featured_image_id: featured_image_id ? Number(featured_image_id) : null,
      language_code: body.language_code || 'en',
      translation_group_id: body.translation_group_id || null,
      meta,
      seo,
    };

    const id = await postService.createPost(newPost, tagIds || []);
    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('Admin POST post error:', err.message);
    return NextResponse.json({ error: err.message || 'Failed to create post' }, { status: 500 });
  }
}
