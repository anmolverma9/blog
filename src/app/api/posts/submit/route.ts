import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { postService } from '@/modules/posts';
import { userService } from '@/modules/users';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, content, summary, category_id, guest_name, guest_email, tagIds } = body;

    if (!title || !content || !guest_name || !guest_email) {
      return NextResponse.json({ error: 'Title, content, guest name, and guest email are required' }, { status: 400 });
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Check if session exists
    const session = await getSession();
    let authorId: number | null = null;

    if (session) {
      const author = await userService.getAuthorByUserId(session.id);
      if (author) {
        authorId = author.id!;
      }
    }

    // Fallback: If not logged in or no author profile, find the first available author
    if (!authorId) {
      const [firstAuthor]: any = await pool.query('SELECT id FROM authors LIMIT 1');
      if (firstAuthor && firstAuthor.length > 0) {
        authorId = firstAuthor[0].id;
      } else {
        // Absolute fallback to 1 if tables are empty
        authorId = 1;
      }
    }

    const newPost = {
      title,
      slug,
      content,
      summary: summary || '',
      status: 'pending_review', // Submitted directly for editorial approval
      author_id: authorId!,
      category_id: category_id ? Number(category_id) : null,
      language_code: 'en',
      meta: {
        editor_type: 'blog',
        editor_blocks: JSON.stringify([{ id: 'para-1', type: 'paragraph', data: { text: content } }]),
        is_guest_submission: 'true',
        guest_author_name: guest_name,
        guest_author_email: guest_email,
        review_notes: '',
      },
      seo: {
        meta_title: title,
        meta_description: summary || '',
        robots_settings: 'index, follow',
      }
    };

    const id = await postService.createPost(newPost, tagIds || []);
    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('Guest submission API error:', err.message);
    return NextResponse.json({ error: err.message || 'Failed to submit guest post' }, { status: 500 });
  }
}
