'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Mail, Sparkles, Loader2, Check } from 'lucide-react';

interface FooterProps {
  siteName?: string;
}

export default function Footer({ siteName = 'Blog' }: FooterProps) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, sourcePage: 'footer' }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setEmail('');
      } else {
        setError(data.error || 'Failed to subscribe');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand Info */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 text-white">
              <div className="bg-orange-500 text-white p-1 rounded-lg">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <span className="font-extrabold tracking-tight text-lg">
                {(() => {
                  const trimName = siteName.trim();
                  const lastSpaceIndex = trimName.lastIndexOf(' ');
                  if (lastSpaceIndex !== -1) {
                    const main = trimName.substring(0, lastSpaceIndex);
                    const last = trimName.substring(lastSpaceIndex);
                    return (
                      <>
                        {main}<span className="text-orange-500 font-medium">{last}</span>
                      </>
                    );
                  }
                  if (trimName.toLowerCase().endsWith('blog') && trimName.length > 4) {
                    const main = trimName.substring(0, trimName.length - 4);
                    const last = trimName.substring(trimName.length - 4);
                    return (
                      <>
                        {main}<span className="text-orange-500 font-medium">{last}</span>
                      </>
                    );
                  }
                  return trimName;
                })()}
              </span>
            </Link>
            <p className="text-xs leading-relaxed max-w-sm">
              {siteName} delivers high-grade SaaS tutorials, editorial blogs, and resources to help builders scale digital operations.
            </p>
          </div>

          {/* Quick links */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-sm tracking-wider uppercase">Resources</h4>
            <div className="flex flex-col gap-2.5 text-xs">
              <Link href="/about" className="hover:text-white transition-colors">About Us</Link>
              <Link href="/archives" className="hover:text-white transition-colors">Timeline Archives</Link>
              <Link href="/posts/submit" className="hover:text-white transition-colors">Write For Us (Guest Post)</Link>
            </div>
          </div>

          {/* Newsletter Form */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-sm tracking-wider uppercase">Newsletter Signup</h4>
            <p className="text-xs">Get weekly SaaS guides and curated marketing strategies in your inbox.</p>
            
            <form onSubmit={handleSubscribe} className="space-y-2.5">
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter email address..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors h-9"
                  required
                />
                <Button
                  type="submit"
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-9"
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                </Button>
              </div>

              {success && (
                <p className="text-emerald-500 text-[11px] font-semibold flex items-center gap-1 animate-in fade-in duration-300">
                  <Check className="h-3.5 w-3.5" />
                  Successfully subscribed! Welcome aboard.
                </p>
              )}

              {error && (
                <p className="text-red-500 text-[11px] font-semibold">
                  {error}
                </p>
              )}
            </form>
          </div>
        </div>

        <div className="h-px bg-slate-800 my-10" />

        {/* Footer bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <p>© {new Date().getFullYear()} {siteName} ecosystem. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/admin" className="hover:text-white transition-colors">Admin Workspace</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
