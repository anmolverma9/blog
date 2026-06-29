import nodemailer from 'nodemailer';
import { settingsService } from '@/modules/settings';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Global helper to send emails via SMTP settings
export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const settings = await settingsService.getSettings();
    
    const smtpHost = settings.smtp_host;
    const smtpPort = Number(settings.smtp_port || '587');
    const smtpUser = settings.smtp_user;
    const smtpPass = settings.smtp_pass;
    const fromEmail = settings.smtp_from_email || 'noreply@appluxe.com';
    const fromName = settings.smtp_from_name || 'AppLuxe Blog';

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.warn('[Mailer Warning] SMTP is not configured. Email was not sent.');
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // True for 465, false for 587 or 25
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false // Avoid SSL handshake failure issues on custom SMTP host configs
      }
    });

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
    });

    console.log(`[Mailer] Email sent successfully. Message ID: ${info.messageId}`);
    return true;
  } catch (err: any) {
    console.error('[Mailer Error] Failed to send email:', err.message);
    return false;
  }
}

// ── TEMPLATE STYLES AND LAYOUTS ──
const BRAND_COLOR = '#f97316'; // Orange accent

function wrapTemplate(content: string, preheaderText: string = '') {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AppLuxe Editorial Notification</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #334155; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
          .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
          .header { background-color: #0f172a; padding: 32px; text-align: center; position: relative; }
          .header h1 { color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.025em; }
          .content { padding: 40px; line-height: 1.6; }
          .button { display: inline-block; background-color: ${BRAND_COLOR}; color: #ffffff !important; font-weight: bold; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 12px; margin: 24px 0; text-align: center; box-shadow: 0 4px 6px -1px rgba(249, 115, 22, 0.2); }
          .footer { background-color: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8; }
          .footer a { color: #64748b; text-decoration: underline; }
          .preheader { display: none; max-width: 0; max-height: 0; overflow: hidden; opacity: 0; }
          .pill { display: inline-block; background-color: #ffedd5; color: #ea580c; font-size: 10px; font-weight: bold; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 16px; }
          .note-box { background-color: #fef2f2; border: 1px solid #fee2e2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 12px; color: #991b1b; font-size: 13px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <span className="preheader">${preheaderText}</span>
        <div className="container">
          <div className="header">
            <h1>AppLuxe CMS</h1>
          </div>
          <div className="content">
            ${content}
          </div>
          <div className="footer">
            <p>Sent automatically by AppLuxe CMS. Please do not reply directly to this email.</p>
            <p>&copy; ${new Date().getFullYear()} AppLuxe. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Sends a notification email to administrators when a new guest draft is submitted
 */
export async function sendAdminSubmissionAlert({ title, authorName, authorEmail, dashboardUrl }: { title: string, authorName: string, authorEmail: string, dashboardUrl: string }) {
  const html = wrapTemplate(`
    <span className="pill">New Draft Submitted</span>
    <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 800;">A new guest publication is awaiting review</h2>
    <p style="font-size: 14px; color: #475569;">Hello Editorial Team,</p>
    <p style="font-size: 14px; color: #475569;">A new guest post has been successfully submitted and paid for. It is now sitting in your review queue.</p>
    
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 16px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: bold; color: #94a3b8; text-transform: uppercase;">Article Title</p>
      <p style="margin: 0 0 16px 0; font-size: 15px; font-weight: bold; color: #0f172a;">${title}</p>
      
      <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: bold; color: #94a3b8; text-transform: uppercase;">Submitted By</p>
      <p style="margin: 0; font-size: 14px; color: #334155; font-weight: 500;">${authorName} (<a href="mailto:${authorEmail}" style="color: ${BRAND_COLOR};">${authorEmail}</a>)</p>
    </div>

    <div style="text-align: center;">
      <a href="${dashboardUrl}" className="button">Open Editorial Dashboard</a>
    </div>
    
    <p style="font-size: 12px; color: #94a3b8; margin-top: 32px;">You can approve and publish this draft directly to the blog or reject it and send feedback to the guest author.</p>
  `, 'New guest post waiting for review.');

  return sendEmail({
    to: 'editorial@appluxe.com', // fallback or primary admin config email
    subject: `[New Guest Draft] "${title}" is waiting for review`,
    html,
  });
}

/**
 * Sends an email to the guest contributor when their draft is approved and published
 */
export async function sendContributorApprovedAlert({ toEmail, authorName, title, articleUrl }: { toEmail: string, authorName: string, title: string, articleUrl: string }) {
  const html = wrapTemplate(`
    <span className="pill" style="background-color: #ecfdf5; color: #059669;">Approved & Published</span>
    <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 800;">Congratulations! Your article is live!</h2>
    <p style="font-size: 14px; color: #475569;">Hello ${authorName},</p>
    <p style="font-size: 14px; color: #475569;">We are excited to inform you that our editors have reviewed and approved your guest post submission!</p>
    
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 16px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: bold; color: #94a3b8; text-transform: uppercase;">Published Article</p>
      <p style="margin: 0; font-size: 15px; font-weight: bold; color: #0f172a;">${title}</p>
    </div>

    <p style="font-size: 14px; color: #475569;">Your article has been successfully published to our homepage and is ready to be shared with your audience.</p>

    <div style="text-align: center;">
      <a href="${articleUrl}" className="button">View Your Live Article</a>
    </div>
    
    <p style="font-size: 14px; color: #475569;">Thank you for writing for us, and we look forward to your future submissions!</p>
  `, 'Your guest submission is live!');

  return sendEmail({
    to: toEmail,
    subject: `Published: Your article "${title}" is live on AppLuxe!`,
    html,
  });
}

/**
 * Sends an email to the guest contributor when their draft is rejected with notes
 */
export async function sendContributorRejectedAlert({ toEmail, authorName, title, reviewNotes, resubmitUrl }: { toEmail: string, authorName: string, title: string, reviewNotes: string, resubmitUrl: string }) {
  const html = wrapTemplate(`
    <span className="pill" style="background-color: #fef2f2; color: #dc2626;">Revision Required</span>
    <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 800;">Revision requested for your submission</h2>
    <p style="font-size: 14px; color: #475569;">Hello ${authorName},</p>
    <p style="font-size: 14px; color: #475569;">Thank you for submitting your draft, <strong>"${title}"</strong>, to our blog. Our editorial team has reviewed your submission and has requested some changes before we can publish it.</p>
    
    <p style="margin-bottom: 8px; font-size: 14px; font-weight: bold; color: #334155;">Editor Feedback:</p>
    <div className="note-box">
      ${reviewNotes}
    </div>

    <p style="font-size: 14px; color: #475569;">You can revise your article based on the feedback above and submit a corrected draft using the link below:</p>

    <div style="text-align: center;">
      <a href="${resubmitUrl}" className="button" style="background-color: #334155; box-shadow: 0 4px 6px -1px rgba(51, 65, 85, 0.2);">Submit Revised Draft</a>
    </div>
    
    <p style="font-size: 14px; color: #475569;">Please feel free to reach out if you have any questions about the editors' feedback.</p>
  `, 'Review notes for your guest submission.');

  return sendEmail({
    to: toEmail,
    subject: `Revision Requested: Your submission "${title}"`,
    html,
  });
}
