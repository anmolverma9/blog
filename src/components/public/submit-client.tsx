'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Send, Loader2, ArrowLeft, Mail, User, BookOpen, AlertCircle, CheckCircle } from 'lucide-react';
import MotionWrapper from '@/components/public/motion-wrapper';

interface Category {
  id: number;
  name: string;
}

export default function SubmitClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  
  // Submit States
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/admin/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !guestEmail || !title || !content) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/posts/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_name: guestName,
          guest_email: guestEmail,
          title,
          category_id: categoryId ? Number(categoryId) : null,
          summary,
          content
        })
      });

      if (res.ok) {
        setSuccess(true);
        setGuestName('');
        setGuestEmail('');
        setTitle('');
        setCategoryId('');
        setSummary('');
        setContent('');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit article');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="editorial-container py-10 md:py-16 max-w-4xl mx-auto animate-in fade-in duration-300">
      
      {/* Back Link */}
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-orange-500 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
      </div>

      <MotionWrapper direction="up">
        <Card className="border-slate-200 shadow-lg bg-white overflow-hidden rounded-3xl">
          <div className="bg-slate-900 text-white p-8 relative">
            <div className="absolute top-[-40%] right-[-10%] w-60 h-60 rounded-full bg-orange-500 blur-3xl opacity-35" />
            <div className="relative z-10 space-y-3">
              <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Community Publishing
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight">Guest Post Submission</h1>
              <p className="text-slate-300 text-xs md:text-sm max-w-xl">
                Submit your draft article to our editorial team. Once approved, your post will be published on our homepage!
              </p>
            </div>
          </div>

          <CardContent className="p-8">
            {success ? (
              <div className="text-center py-12 space-y-4 animate-in zoom-in-95 duration-200">
                <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h2 className="text-xl font-bold text-slate-900">Submission Received!</h2>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Thank you for contributing. Our editors will review your draft shortly. We will contact you at your email address once it is published or if revision is needed.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="text-xs border-slate-200 mt-4"
                  onClick={() => setSuccess(false)}
                >
                  Submit another article
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs p-3.5 rounded-xl flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Author Details Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="e.g. John Doe"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="pl-9 h-10 text-xs border-slate-200 focus:border-orange-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        type="email"
                        placeholder="e.g. john@example.com"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className="pl-9 h-10 text-xs border-slate-200 focus:border-orange-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-100 my-2" />

                {/* Article Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Article Title *</label>
                  <Input
                    placeholder="Enter a catchy title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-10 text-xs border-slate-200 focus:border-orange-500"
                    required
                  />
                </div>

                {/* Category Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Topic / Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>
                </div>

                {/* Excerpt */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Summary / Excerpt</label>
                  <Textarea
                    placeholder="A short summary of what readers will learn..."
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="h-20 text-xs border-slate-200 focus:border-orange-500"
                  />
                </div>

                {/* Body Content */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Article Content *</label>
                  <Textarea
                    placeholder="Write your article in markdown or plain text..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="h-60 text-xs border-slate-200 focus:border-orange-500 font-mono"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-11 text-xs shadow-md shadow-orange-500/10 flex items-center justify-center gap-1.5"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Submit Draft for Review
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </MotionWrapper>

    </div>
  );
}
