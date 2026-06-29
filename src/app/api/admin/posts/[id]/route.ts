import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { postService } from '@/modules/posts';
import { userService } from '@/modules/users';
import { sendContributorApprovedAlert, sendContributorRejectedAlert } from '@/lib/mailer';

async function verifyPostAccess(postId: number, session: any) {
  const post = await postService.getPost(postId);
  if (!post) {
    return { status: 404, error: 'Post not found' };
  }

  // If user is Author or Contributor, check if they own the post
  if (session.role === 'Author' || session.role === 'Contributor') {
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
    
    if (status !== undefined) {
      let finalStatus = status;
      if (session.role === 'Author' || session.role === 'Contributor') {
        if (status === 'published' || status === 'approved') {
          finalStatus = 'pending_review';
        }
      }
      updateData.status = finalStatus;
    }
    
    if (category_id !== undefined) updateData.category_id = category_id ? Number(category_id) : null;
    
    if (featured_image_id !== undefined) {
      updateData.featured_image_id = session.role === 'Contributor' ? null : (featured_image_id ? Number(featured_image_id) : null);
    } else if (session.role === 'Contributor') {
      updateData.featured_image_id = null;
    }

    if (body.language_code !== undefined) updateData.language_code = body.language_code;
    if (body.translation_group_id !== undefined) updateData.translation_group_id = body.translation_group_id;
    if (meta !== undefined) updateData.meta = meta;
    if (seo !== undefined) updateData.seo = seo;

    // Check if post is a guest submission to trigger email notifications
    const currentPost = await postService.getPost(postId);
    if (currentPost && currentPost.meta?.is_guest_submission === 'true') {
      const guestEmail = currentPost.meta?.guest_author_email;
      const guestName = currentPost.meta?.guest_author_name || 'Guest Contributor';

      if (updateData.status === 'published' && currentPost.status !== 'published' && guestEmail) {
        const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://appluxe.com/blog';
        const articleUrl = `${origin}/${currentPost.slug}`;
        
        sendContributorApprovedAlert({
          toEmail: guestEmail,
          authorName: guestName,
          title: currentPost.title,
          articleUrl
        }).catch(err => console.error('Error sending approval email:', err.message));
      } else if (updateData.status === 'draft' && currentPost.status === 'pending_review' && guestEmail) {
        const reviewNotes = meta?.review_notes || 'Please revise your content and submit again.';
        const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://appluxe.com/blog';
        const resubmitUrl = `${origin}/posts/submit`;
        
        sendContributorRejectedAlert({
          toEmail: guestEmail,
          authorName: guestName,
          title: currentPost.title,
          reviewNotes,
          resubmitUrl
        }).catch(err => console.error('Error sending rejection email:', err.message));
      }
    }

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
