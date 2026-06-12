import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { kbService } from '@/modules/kb';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'articles';
    const categoryId = searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : undefined;
    const search = searchParams.get('search') || undefined;

    // Public actions or admin queries
    if (type === 'categories') {
      const categories = await kbService.getCategories();
      return NextResponse.json(categories);
    }

    if (type === 'related-suggestions') {
      const subject = searchParams.get('subject') || '';
      const suggestions = await kbService.getRelatedSupportSuggestions(subject);
      return NextResponse.json(suggestions);
    }

    // Require session for tickets and admin listing
    const session = await getSession();
    if (!session) {
      // Public articles list is allowed
      if (type === 'articles') {
        const articles = await kbService.getArticles({ categoryId, status: 'published', search });
        return NextResponse.json(articles);
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (type === 'tickets') {
      const tickets = await kbService.getTickets();
      return NextResponse.json(tickets);
    }

    // Default admin listing (all articles including drafts)
    const articles = await kbService.getArticles({ categoryId, search });
    return NextResponse.json(articles);
  } catch (err: any) {
    console.error('KB GET error:', err.message);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type } = body;

    // Public ticket creation
    if (type === 'ticket') {
      const { subject, description, user_email, article_id } = body;
      if (!subject || !description || !user_email) {
        return NextResponse.json({ error: 'Subject, description, and email are required' }, { status: 400 });
      }
      const ticketId = await kbService.createTicket({
        subject,
        description,
        user_email,
        article_id: article_id ? Number(article_id) : null,
      });
      return NextResponse.json({ success: true, id: ticketId });
    }

    // Other actions require session
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (type === 'category') {
      const { name, slug, description } = body;
      if (!name || !slug) {
        return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
      }
      const catId = await kbService.createCategory({ name, slug, description });
      return NextResponse.json({ success: true, id: catId });
    }

    if (type === 'article') {
      const { title, slug, content, category_id, status } = body;
      if (!title || !slug || !content || !category_id) {
        return NextResponse.json({ error: 'Missing required article fields' }, { status: 400 });
      }
      const artId = await kbService.createArticle({
        title,
        slug,
        content,
        category_id: Number(category_id),
        status: status || 'draft',
      });
      return NextResponse.json({ success: true, id: artId });
    }

    return NextResponse.json({ error: 'Invalid operation type' }, { status: 400 });
  } catch (err: any) {
    console.error('KB POST error:', err.message);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { type, id } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    if (type === 'ticket') {
      const { status } = body;
      await kbService.updateTicketStatus(Number(id), status || 'closed');
      return NextResponse.json({ success: true });
    }

    if (type === 'article') {
      const { title, slug, content, category_id, status } = body;
      await kbService.updateArticle(Number(id), {
        title,
        slug,
        content,
        category_id: category_id ? Number(category_id) : undefined,
        status,
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid update type' }, { status: 400 });
  } catch (err: any) {
    console.error('KB PUT error:', err.message);
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await kbService.deleteArticle(Number(id));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('KB DELETE error:', err.message);
    return NextResponse.json({ error: 'Failed to delete article' }, { status: 500 });
  }
}
