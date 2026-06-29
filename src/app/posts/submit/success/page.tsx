import React from 'react';
import Link from 'next/link';
import Stripe from 'stripe';
import { settingsService } from '@/modules/settings';
import pool from '@/lib/db';
import LayoutWrapper from '@/components/public/layout-wrapper';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, BookOpen } from 'lucide-react';

import { sendAdminSubmissionAlert } from '@/lib/mailer';

interface PageProps {
  searchParams: Promise<{ session_id?: string }> | { session_id?: string };
}

export default async function SubmitSuccessPage({ searchParams }: PageProps) {
  // Await search params to support Next.js async page props
  const resolvedParams = await searchParams;
  const sessionId = resolvedParams?.session_id;

  if (sessionId) {
    try {
      const settings = await settingsService.getSettings();
      const stripeSecretKey = settings.stripe_secret_key;

      if (stripeSecretKey) {
        const stripe = new Stripe(stripeSecretKey);
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === 'paid') {
          const postId = session.metadata?.postId;

          if (postId) {
            console.log(`[Success Page Confirm] Payment verified for Post ID: ${postId}. Updating status.`);
            const [result]: any = await pool.query(
              "UPDATE posts SET status = 'pending_review' WHERE id = ? AND status = 'pending_payment'",
              [Number(postId)]
            );

            if (result.affectedRows > 0) {
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

                const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://appluxe.com/blog';
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
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Error confirming payment session on success page:', err.message);
    }
  }

  return (
    <LayoutWrapper>
      <div className="editorial-container py-20 max-w-md mx-auto text-center animate-in fade-in duration-300">
        <Card className="border-slate-200 shadow-xl rounded-3xl bg-white overflow-hidden">
          <div className="bg-slate-900 text-white p-6 relative">
            <div className="absolute -top-[40%] -right-[10%] w-32 h-32 rounded-full bg-orange-500 blur-2xl opacity-40" />
            <div className="relative z-10 space-y-1">
              <h2 className="text-xl font-bold tracking-tight">Payment Successful!</h2>
              <p className="text-xs text-slate-300">Thank you for your guest post contribution</p>
            </div>
          </div>
          <CardContent className="p-8 space-y-6">
            <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
              <CheckCircle className="h-8 w-8" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-800 text-base">Submission Received</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your payment was processed successfully. Your draft has been forwarded to our editorial team and is now in the review queue. We will contact you once it is approved and published.
              </p>
            </div>

            <div className="h-px bg-slate-100" />

            <div className="flex flex-col gap-2.5">
              <Link href="/" className="w-full">
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-10 text-xs shadow-sm flex items-center justify-center gap-1">
                  Back to Homepage <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <Link href="/posts/submit" className="w-full">
                <Button variant="outline" className="w-full border-slate-200 text-xs h-10 flex items-center justify-center gap-1">
                  <BookOpen className="h-3.5 w-3.5 text-slate-400" /> Submit Another Draft
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </LayoutWrapper>
  );
}
