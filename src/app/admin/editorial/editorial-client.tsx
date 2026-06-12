'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Check, X, Eye, FileText, AlertCircle, MessageSquare } from 'lucide-react';

interface PostPending {
  id: number;
  title: string;
  slug: string;
  content: string;
  summary: string;
  status: string;
  author_name: string;
  category_name?: string;
  updated_at: string;
}

export default function EditorialClient() {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PostPending[]>([]);
  const [selectedPost, setSelectedPost] = useState<PostPending | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // Fetch pending review posts
  const loadPendingPosts = async () => {
    try {
      const res = await fetch('/api/admin/posts?status=pending_review');
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error('Failed to load pending posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingPosts();
  }, []);

  // Approve Post (Publish)
  const handleApprove = async (postId: number) => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'published',
          published_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        }),
      });

      if (res.ok) {
        setSelectedPost(null);
        loadPendingPosts();
        alert('Post published successfully!');
      } else {
        alert('Failed to publish post');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  // Reject Post (Return to Draft with Notes)
  const handleReject = async (postId: number) => {
    if (!reviewNotes.trim()) {
      return alert('Please provide review notes explaining the rejection.');
    }

    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'draft',
          meta: {
            review_notes: reviewNotes,
            rejected_at: new Date().toISOString(),
          },
        }),
      });

      if (res.ok) {
        setReviewNotes('');
        setSelectedPost(null);
        loadPendingPosts();
        alert('Post returned to contributor as draft.');
      } else {
        alert('Failed to update post status');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
        <p className="text-slate-500 font-medium">Loading Editorial Queue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Editorial Approval Board</h1>
        <p className="text-slate-500 mt-1">Review publications submitted by contributors and authors prior to catalog listing.</p>
      </div>

      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-800">Review Queue</CardTitle>
          <CardDescription className="text-xs">Posts currently in the `pending_review` status.</CardDescription>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs bg-slate-50 border border-dashed rounded-xl">
              No publications awaiting approval. All clean!
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-orange-200 transition-colors">
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-orange-500 uppercase bg-orange-50 px-2 py-0.5 rounded">
                      {post.category_name || 'General'}
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-sm">{post.title}</h4>
                    <p className="text-slate-500 text-xs leading-normal font-medium max-w-xl">{post.summary || 'No summary preview configured.'}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Submitted by: <span className="text-slate-600 font-bold">{post.author_name}</span> • Last Update: {new Date(post.updated_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2 shrink-0 self-end sm:self-center">
                    <Button onClick={() => setSelectedPost(post)} className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-8 text-xs flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" /> Read & Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog modal */}
      {selectedPost && (
        <Dialog open={true} onOpenChange={() => setSelectedPost(null)}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto rounded-3xl font-sans bg-white border border-slate-200 text-slate-900">
            <DialogHeader className="border-b pb-4">
              <span className="text-[9px] font-bold text-orange-500 uppercase bg-orange-50 px-2 py-0.5 rounded w-fit">
                Pending Approval
              </span>
              <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 mt-1">{selectedPost.title}</DialogTitle>
              <DialogDescription className="text-xs">
                Author: {selectedPost.author_name} • Slug: /posts/{selectedPost.slug}
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 space-y-6">
              {/* Summary Preview */}
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5 text-orange-500" /> Summary Preview</p>
                <p className="text-slate-600 text-xs mt-1.5 leading-relaxed font-semibold italic">{selectedPost.summary || 'No summary preview provided.'}</p>
              </div>

              {/* Content Body */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><FileText className="h-3.5 w-3.5 text-orange-500" /> Article Content</p>
                <div className="border border-slate-200/80 rounded-2xl p-5 bg-white prose max-w-none text-xs sm:text-sm leading-relaxed max-h-96 overflow-y-auto whitespace-pre-wrap font-sans text-slate-700">
                  {selectedPost.content}
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Action Decision Form */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5 text-slate-400" /> Reviewer Notes (Required for rejection)</label>
                  <Textarea
                    value={reviewNotes}
                    onChange={e => setReviewNotes(e.target.value)}
                    placeholder="Provide revision instructions or correction requests for the contributor..."
                    className="text-xs border-slate-200 h-20"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    onClick={() => handleApprove(selectedPost.id)}
                    disabled={processing}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-9 text-xs flex items-center gap-1.5"
                  >
                    <Check className="h-4 w-4" /> Approve & Publish
                  </Button>
                  <Button
                    onClick={() => handleReject(selectedPost.id)}
                    disabled={processing}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold h-9 text-xs flex items-center gap-1.5"
                  >
                    <X className="h-4 w-4" /> Reject (Return Draft)
                  </Button>
                  <Button
                    onClick={() => setSelectedPost(null)}
                    variant="ghost"
                    className="text-xs h-9 font-semibold text-slate-500 hover:text-slate-700"
                  >
                    Close Preview
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
