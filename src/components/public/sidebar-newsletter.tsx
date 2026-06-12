'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Mail, Check, AlertCircle } from 'lucide-react';

export default function SidebarNewsletter() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, sourcePage: 'sidebar' }),
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
    <div className="space-y-3">
      {success ? (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center space-y-2 text-emerald-800 animate-in zoom-in-95 duration-150">
          <div className="mx-auto w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
            <Check className="h-4 w-4" />
          </div>
          <p className="text-xs font-bold">Successfully Subscribed!</p>
          <p className="text-[10px] text-emerald-700 leading-normal">
            Thanks for subscribing to our SaaS publishing updates.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubscribe} className="space-y-2.5">
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 text-[10px] p-2 rounded-lg flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              type="email"
              placeholder="Enter your email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9 h-10 text-xs border-slate-200 focus-visible:ring-orange-500 bg-white"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-10 text-xs shadow-sm shadow-orange-500/10"
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
            Subscribe Updates
          </Button>
        </form>
      )}
    </div>
  );
}
