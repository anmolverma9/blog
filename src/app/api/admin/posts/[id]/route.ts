import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { postService } from '@/modules/posts';
import { userService } from '@/modules/users';

async function verifyPostAccess(postId: number, session: any) {
  const post = await postService.getPost(postId);
  if (!post) {
    return { status: 404, error: 'Post not found' };
  }

  // If user is Author, check if they own the post
  if (session.role === 'Author') {
    const author = await userService.getAuthorByUserId(session.id);
    if (!author || post.author_id !== author.id) {
      return { status: 403, error: 'Forbidden: You can only access your own posts' };
    }
  }

  return { post };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const postId = Number(id);
  if (isNaN(postId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const access = await verifyPostAccess(postId, session);
    if (access.error) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    return NextResponse.json(access.post);
  } catch (err: any) {
    console.error('Admin GET single post error:', err.message);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const postId = Number(id);
  if (isNaN(postId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const access = await verifyPostAccess(postId, session);
    if (access.error) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const body = await req.json();
    const { title, slug, content, summary, status, category_id, featured_image_id, tagIds, meta, seo } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (content !== undefined) updateData.content = content;
    if (summary !== undefined) updateData.summary = summary;
    if (status !== undefined) updateData.status = status;
    if (category_id !== undefined) updateData.category_id = category_id ? Number(category_id) : null;
    if (featured_image_id !== undefined) updateData.featured_image_id = featured_image_id ? Number(featured_image_id) : null;
    if (body.language_code !== undefined) updateData.language_code = body.language_code;
    if (body.translation_group_id !== undefined) updateData.translation_group_id = body.translation_group_id;
    if (meta !== undefined) updateData.meta = meta;
    if (seo !== undefined) updateData.seo = seo;

    await postService.updatePost(postId, updateData, tagIds);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Admin PUT single post error:', err.message);
    return NextResponse.json({ error: err.message || 'Failed to update post' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const postId = Number(id);
  if (isNaN(postId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const access = await verifyPostAccess(postId, session);
    if (access.error) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    await postService.deletePost(postId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Admin DELETE single post error:', err.message);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
