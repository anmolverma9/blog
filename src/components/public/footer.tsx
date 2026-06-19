'use client';

import React, { useState } from 'react';
import { ArrowUp, Mail, Check, AlertCircle, Loader2 } from 'lucide-react';

interface FooterProps {
  siteName?: string;
  siteLogo?: string;
  siteDescription?: string;
}

export default function Footer({
  siteName = 'Tech Giant World',
  siteLogo = '',
  siteDescription = 'The latest tech news about the world\'s best...'
}: FooterProps) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch((process.env.NEXT_PUBLIC_APP_URL || '') + '/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, sourcePage: 'footer' }),
      });

      if (res.ok) {
        setSuccess(true);
        setEmail('');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to subscribe');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-[#0f172a] text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Section - 3 Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 items-start">
          
          {/* Left Column: Brand Logo & Tagline */}
          <div className="text-center md:text-left space-y-2">
            {siteLogo ? (
              <img src={siteLogo} alt={siteName} className="h-12 md:h-14 object-contain mx-auto md:mx-0 mb-3" />
            ) : (
              <h2 className="text-white text-3xl font-black tracking-tight">
                {siteName}
              </h2>
            )}
            <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed max-w-sm">
              {siteDescription}
            </p>
          </div>

          {/* Middle Column: Newsletter Form */}
          <div className="space-y-3.5" id="footer-newsletter-section">
            <h3 className="text-white text-sm font-bold uppercase tracking-wider text-center md:text-left">
              Subscribe to Newsletter
            </h3>
            {success ? (
              <div className="bg-emerald-950/40 border border-emerald-900 rounded-2xl p-4 text-center space-y-2 text-emerald-400 animate-in zoom-in-95 duration-150">
                <div className="mx-auto w-8 h-8 bg-emerald-900 text-emerald-400 rounded-full flex items-center justify-center">
                  <Check className="h-4 w-4" />
                </div>
                <p className="text-xs font-bold">Successfully Subscribed!</p>
                <p className="text-[10px] text-emerald-500 leading-normal">
                  Thanks for subscribing to our advertising and publishing updates.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2.5">
                {error && (
                  <div className="bg-rose-950/40 border border-rose-900 text-rose-400 text-[10px] p-2 rounded-lg flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      id="footer-newsletter-email"
                      placeholder="Enter your email address..."
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-200 text-xs focus:outline-none focus:border-orange-500 transition-colors"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="h-10 px-5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-md shadow-orange-600/10 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Subscribe
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right Column: Social Media Icons in Circles */}
          <div className="flex items-center justify-center md:justify-end gap-3 self-center md:self-start">
            <a
              href="#"
              className="w-9 h-9 rounded-full bg-slate-800 hover:bg-orange-600 hover:text-white transition-all duration-150 flex items-center justify-center text-slate-300"
              aria-label="Facebook"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/></svg>
            </a>
            <a
              href="#"
              className="w-9 h-9 rounded-full bg-slate-800 hover:bg-orange-600 hover:text-white transition-all duration-150 flex items-center justify-center text-slate-300"
              aria-label="X (Twitter)"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a
              href="#"
              className="w-9 h-9 rounded-full bg-slate-800 hover:bg-orange-600 hover:text-white transition-all duration-150 flex items-center justify-center text-slate-300"
              aria-label="Instagram"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
            <a
              href="#"
              className="w-9 h-9 rounded-full bg-slate-800 hover:bg-orange-600 hover:text-white transition-all duration-150 flex items-center justify-center text-slate-300"
              aria-label="YouTube"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
            </a>
            <a
              href="#"
              className="w-9 h-9 rounded-full bg-slate-800 hover:bg-orange-600 hover:text-white transition-all duration-150 flex items-center justify-center text-slate-300"
              aria-label="Telegram"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.35-.49.97-.74 3.79-1.65 6.31-2.74 7.57-3.27 3.61-1.5 4.36-1.76 4.85-1.77.11 0 .35.03.5.16.13.12.17.29.18.41-.01.07-.01.14-.02.21z"/></svg>
            </a>
          </div>
        </div>

        {/* Separator Line */}
        <div className="h-px bg-slate-800 w-full" />

        {/* Bottom Section */}
        <div className="flex items-center justify-between pt-8 gap-4 text-xs font-semibold text-slate-500 flex-wrap">
          <p>
            Copyright © All rights reserved | by {siteName}.
          </p>

          {/* Scroll to Top Button */}
          <button
            onClick={scrollToTop}
            className="w-9 h-9 rounded-lg bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center shadow-lg shadow-orange-600/20 transition-all cursor-pointer"
            title="Scroll to Top"
            aria-label="Scroll to Top"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </footer>
  );
}
