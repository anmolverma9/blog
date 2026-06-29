import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { postService } from '@/modules/posts';
import { userService } from '@/modules/users';
import { settingsService } from '@/modules/settings';
import pool from '@/lib/db';
import Stripe from 'stripe';
import { sendAdminSubmissionAlert } from '@/lib/mailer';

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
    const sessionUser = await getSession();
    let authorId: number | null = null;

    if (sessionUser) {
      const author = await userService.getAuthorByUserId(sessionUser.id);
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

    // Fetch settings to check if guest posting is paid
    const settings = await settingsService.getSettings();
    const isPaid = settings.guest_posting_paid === 'true';

    const newPost = {
      title,
      slug,
      content,
      summary: summary || '',
      status: isPaid ? 'pending_payment' : 'pending_review', // Pending payment if paid, pending review if free
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

    if (isPaid) {
      const stripeSecretKey = settings.stripe_secret_key;
      if (!stripeSecretKey) {
        throw new Error('Stripe is not configured correctly on this server.');
      }

      // Initialize Stripe
      const stripe = new Stripe(stripeSecretKey);
      
      const checkSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Guest Post Submission: ${title}`,
              description: 'Editorial review and publication fee.',
            },
            unit_amount: Math.round(Number(settings.guest_posting_price || '10.00') * 100),
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${req.nextUrl.origin}/posts/submit/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.nextUrl.origin}/posts/submit/cancel`,
        metadata: {
          postId: id.toString(),
        }
      });

      return NextResponse.json({ success: true, sessionId: checkSession.id, checkoutUrl: checkSession.url });
    }

    // Send admin submission email alert for free submissions
    const dashboardUrl = `${req.nextUrl.origin}/admin/editorial`;
    sendAdminSubmissionAlert({
      title,
      authorName: guest_name,
      authorEmail: guest_email,
      dashboardUrl,
    }).catch(err => console.error('Failed to send admin submission email alert:', err.message));

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('Guest submission API error:', err.message);
    return NextResponse.json({ error: err.message || 'Failed to submit guest post' }, { status: 500 });
  }
}
