'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Star, AlertCircle, Plus, Trash, Check, X, Loader2 } from 'lucide-react';

interface Review {
  id?: number;
  user_name: string;
  rating: number;
  review_text?: string;
  pros?: string[];
  cons?: string[];
  created_at?: Date | string;
}

interface SoftwareReviewsProps {
  softwareId: number;
  initialReviews: Review[];
}

export default function SoftwareReviews({ softwareId, initialReviews }: SoftwareReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [userName, setUserName] = useState('');
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  
  // Pros and Cons list additions
  const [proInput, setProInput] = useState('');
  const [conInput, setConInput] = useState('');
  const [pros, setPros] = useState<string[]>([]);
  const [cons, setCons] = useState<string[]>([]);

  // Submission States
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const addPro = () => {
    if (proInput.trim()) {
      setPros([...pros, proInput.trim()]);
      setProInput('');
    }
  };

  const removePro = (idx: number) => {
    setPros(pros.filter((_, i) => i !== idx));
  };

  const addCon = () => {
    if (conInput.trim()) {
      setCons([...cons, conInput.trim()]);
      setConInput('');
    }
  };

  const removeCon = (idx: number) => {
    setCons(cons.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !rating) {
      setError('Name and star rating are required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/admin/software', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'review',
          software_id: softwareId,
          user_name: userName,
          rating,
          review_text: reviewText,
          pros,
          cons
        })
      });

      if (res.ok) {
        const data = await res.json();
        const newReview: Review = {
          id: data.id,
          user_name: userName,
          rating,
          review_text: reviewText,
          pros,
          cons,
          created_at: new Date().toISOString()
        };
        setReviews([newReview, ...reviews]);
        
        // Reset form
        setUserName('');
        setRating(5);
        setReviewText('');
        setPros([]);
        setCons([]);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit review');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 mt-10">
      <div className="border-t pt-8">
        <h3 className="text-xl font-bold text-slate-900">User Reviews ({reviews.length})</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Reviews Feed */}
        <div className="lg:col-span-2 space-y-4">
          {reviews.length === 0 ? (
            <div className="text-center py-12 border rounded-2xl bg-slate-55/20 text-slate-400 text-xs">
              No reviews yet. Be the first to share your experience!
            </div>
          ) : (
            reviews.map((rev, idx) => (
              <div key={rev.id || idx} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{rev.user_name}</h4>
                    <span className="text-[10px] text-slate-400">
                      {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : 'Just now'}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {rev.review_text && (
                  <p className="text-slate-600 text-xs leading-relaxed">{rev.review_text}</p>
                )}

                {/* Pros and Cons */}
                {((rev.pros && rev.pros.length > 0) || (rev.cons && rev.cons.length > 0)) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-50 pt-3">
                    {rev.pros && rev.pros.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                          <Check className="h-3 w-3" /> Pros
                        </span>
                        <ul className="space-y-1">
                          {rev.pros.map((p, pIdx) => (
                            <li key={pIdx} className="text-[11px] text-slate-600 leading-normal flex items-start gap-1">
                              • {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {rev.cons && rev.cons.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-rose-600 flex items-center gap-1">
                          <X className="h-3 w-3" /> Cons
                        </span>
                        <ul className="space-y-1">
                          {rev.cons.map((c, cIdx) => (
                            <li key={cIdx} className="text-[11px] text-slate-600 leading-normal flex items-start gap-1">
                              • {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Submit Review Box */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Write a Review</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Share your feedback to help others</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs p-2.5 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs p-2.5 rounded-lg flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0" />
                <span>Review submitted successfully!</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase">Your Name</label>
              <Input
                placeholder="e.g. Jane Doe"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="h-9 text-xs border-slate-200"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase block">Star Rating</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`h-5 w-5 ${
                        star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase">Review Text</label>
              <Textarea
                placeholder="What did you like or dislike about this software?"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="h-20 text-xs border-slate-200"
              />
            </div>

            {/* Pros builder */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-500 uppercase block">Pros</label>
              <div className="flex gap-1.5">
                <Input
                  placeholder="Add a pro..."
                  value={proInput}
                  onChange={(e) => setProInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPro(); } }}
                  className="h-8 text-[11px] border-slate-200"
                />
                <Button type="button" variant="outline" size="icon" onClick={addPro} className="h-8 w-8 shrink-0">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              {pros.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {pros.map((p, i) => (
                    <span key={i} className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                      {p}
                      <button type="button" onClick={() => removePro(i)} className="text-emerald-500 hover:text-emerald-700">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Cons builder */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-500 uppercase block">Cons</label>
              <div className="flex gap-1.5">
                <Input
                  placeholder="Add a con..."
                  value={conInput}
                  onChange={(e) => setConInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCon(); } }}
                  className="h-8 text-[11px] border-slate-200"
                />
                <Button type="button" variant="outline" size="icon" onClick={addCon} className="h-8 w-8 shrink-0">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              {cons.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {cons.map((c, i) => (
                    <span key={i} className="text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded flex items-center gap-1">
                      {c}
                      <button type="button" onClick={() => removeCon(i)} className="text-rose-500 hover:text-rose-700">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-9 text-xs mt-2"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Submit Review
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
