import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { settingsService } from '@/modules/settings';
import pool from '@/lib/db';
import { sendAdminSubmissionAlert } from '@/lib/mailer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature') || '';

    // Load Stripe configuration dynamically from settings
    const settings = await settingsService.getSettings();
    const stripeSecretKey = settings.stripe_secret_key;
    const webhookSecret = settings.stripe_webhook_secret;

    if (!stripeSecretKey || !webhookSecret) {
      console.error('Stripe webhook keys are missing in configurations.');
      return NextResponse.json({ error: 'Stripe configuration error' }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey);
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.warn(`[Stripe Webhook Warning] Signature verification failed: ${err.message}`);
      return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 });
    }

    // Process event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const postId = session.metadata?.postId;

      if (postId) {
        console.log(`[Stripe Webhook] Processing successful payment for Post ID: ${postId}`);
        
        // Update post status from 'pending_payment' to 'pending_review'
        const [result]: any = await pool.query(
          "UPDATE posts SET status = 'pending_review' WHERE id = ? AND status = 'pending_payment'",
          [Number(postId)]
        );

        if (result.affectedRows > 0) {
          console.log(`[Stripe Webhook] Post ID: ${postId} status successfully updated to 'pending_review'.`);
          
          // Send email alert to admin
          try {
            const [posts]: any = await pool.query("SELECT title FROM posts WHERE id = ?", [Number(postId)]);
            const [metaRows]: any = await pool.query("SELECT meta_key, meta_value FROM post_meta WHERE post_id = ?", [Number(postId)]);
            
            const postMeta = metaRows.reduce((acc: any, row: any) => {
              acc[row.meta_key] = row.meta_value;
              return acc;
            }, {});

            const title = posts[0]?.title || 'Paid Guest Post';
            const guestName = postMeta.guest_author_name || 'Guest Submitter';
            const guestEmail = postMeta.guest_author_email || '';

            const origin = process.env.NEXT_PUBLIC_APP_URL || `${req.nextUrl.origin}`;
            const dashboardUrl = `${origin}/admin/editorial`;

            sendAdminSubmissionAlert({
              title,
              authorName: guestName,
              authorEmail: guestEmail,
              dashboardUrl
            }).catch(err => console.error('Error sending admin alert:', err));
          } catch (fetchErr: any) {
            console.error('Failed to fetch post details for admin email:', fetchErr.message);
          }
        } else {
          console.warn(`[Stripe Webhook Warning] No matching post found with ID: ${postId} in 'pending_payment' status.`);
        }
      } else {
        console.warn('[Stripe Webhook Warning] No postId found in session metadata.');
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Stripe webhook error:', err.message);
    return NextResponse.json({ error: err.message || 'Webhook internal server error' }, { status: 500 });
  }
}
