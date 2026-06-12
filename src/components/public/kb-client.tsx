'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Search, HelpCircle, Loader2, FileText, ArrowRight, Mail, User, AlertCircle, CheckCircle, MessageSquare } from 'lucide-react';
import MotionWrapper from '@/components/public/motion-wrapper';

interface KBCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

interface KBArticle {
  id: number;
  title: string;
  slug: string;
  content: string;
  category_name?: string;
}

interface Suggestion {
  id: number;
  title: string;
  slug: string;
}

export default function KnowledgeBaseClient() {
  const [categories, setCategories] = useState<KBCategory[]>([]);
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Ticket Form States
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketEmail, setTicketEmail] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketSuggestions, setTicketSuggestions] = useState<Suggestion[]>([]);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<number | null>(null);
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);
  const [ticketError, setTicketError] = useState('');

  // Load Categories & Articles
  useEffect(() => {
    async function fetchData() {
      try {
        const [catsRes, artsRes] = await Promise.all([
          fetch('/api/admin/kb?type=categories'),
          fetch('/api/admin/kb?type=articles')
        ]);
        if (catsRes.ok) setCategories(await catsRes.json());
        if (artsRes.ok) setArticles(await artsRes.json());
      } catch (err) {
        console.error('Failed to load KB data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Fetch Ticket Suggestions on Subject change
  useEffect(() => {
    if (!ticketSubject || ticketSubject.trim().length < 4) {
      setTicketSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/kb?type=related-suggestions&subject=${encodeURIComponent(ticketSubject)}`);
        if (res.ok) {
          const suggestions = await res.json();
          setTicketSuggestions(suggestions);
        }
      } catch (err) {
        console.error('Error fetching ticket suggestions:', err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [ticketSubject]);

  // Submit Ticket
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketEmail || !ticketDescription) {
      setTicketError('Please fill in all ticket fields.');
      return;
    }

    setSubmittingTicket(true);
    setTicketError('');

    try {
      const res = await fetch('/api/admin/kb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ticket',
          subject: ticketSubject,
          description: ticketDescription,
          user_email: ticketEmail,
          article_id: selectedSuggestionId
        })
      });

      if (res.ok) {
        setTicketSuccess(true);
        setTicketSubject('');
        setTicketEmail('');
        setTicketDescription('');
        setTicketSuggestions([]);
        setSelectedSuggestionId(null);
      } else {
        const data = await res.json();
        setTicketError(data.error || 'Failed to submit ticket');
      }
    } catch (err) {
      setTicketError('Network error. Please try again.');
      console.error('Ticket submission error:', err);
    } finally {
      setSubmittingTicket(false);
    }
  };

  // Filters
  const filteredArticles = articles.filter(art => {
    const matchesCategory = selectedCategory === null || art.category_name === categories.find(c => c.id === selectedCategory)?.name;
    const matchesSearch = searchQuery.trim() === '' || 
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="editorial-container py-10 md:py-16 space-y-12 animate-in fade-in duration-300">
      
      {/* Banner Hero */}
      <MotionWrapper direction="up">
        <div className="bg-slate-900 rounded-3xl text-white p-8 md:p-16 text-center space-y-6 relative overflow-hidden shadow-lg">
          <div className="absolute top-[-20%] left-[-10%] w-[300px] h-[300px] rounded-full bg-orange-500 blur-[90px] opacity-25" />
          <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Help Center & Customer Desk
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">How can we help you?</h1>
          <p className="text-slate-300 text-sm md:text-base max-w-xl mx-auto">
            Search our self-service documentation or submit a helpdesk request ticket.
          </p>
          <div className="max-w-lg mx-auto relative mt-2">
            <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search articles (e.g. login, payment, API)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 bg-white text-slate-900 rounded-full border-0 focus-visible:ring-2 focus-visible:ring-orange-500 text-sm shadow-md"
            />
          </div>
        </div>
      </MotionWrapper>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Loading knowledge base...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Content Area (Categories & Articles) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Category selector chips */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Topics</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    selectedCategory === null
                      ? 'bg-orange-500 border-orange-500 text-white shadow-sm shadow-orange-500/15'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  All Articles
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      selectedCategory === cat.id
                        ? 'bg-orange-500 border-orange-500 text-white shadow-sm shadow-orange-500/15'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Articles Grid */}
            <div className="space-y-4">
              <div className="border-b pb-2">
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedCategory === null 
                    ? 'Featured Documentation' 
                    : `${categories.find(c => c.id === selectedCategory)?.name} Articles`
                  }
                </h3>
              </div>

              {filteredArticles.length === 0 ? (
                <div className="text-center py-16 bg-white border rounded-2xl p-6 text-slate-400 text-sm">
                  No articles found matching search criteria.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredArticles.map((art) => (
                    <Link key={art.id} href={`/kb/${art.slug}`}>
                      <Card className="hover:border-orange-200 transition-colors shadow-sm h-full hover:shadow-md">
                        <CardHeader className="p-5 pb-3">
                          <span className="text-[10px] font-extrabold uppercase text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full w-fit">
                            {art.category_name || 'General'}
                          </span>
                          <CardTitle className="text-base font-bold text-slate-900 mt-2 leading-snug line-clamp-2">
                            {art.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-0">
                          <p className="text-slate-500 text-xs line-clamp-3 leading-relaxed mb-4">
                            {art.content.replace(/[#*`_[\]()]/g, '').slice(0, 140)}...
                          </p>
                          <span className="text-xs font-bold text-orange-500 flex items-center gap-1">
                            Read Article <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Helpdesk Ticket Submission form */}
          <div className="space-y-6">
            <Card className="border-slate-200 shadow-md sticky top-6 bg-white">
              <CardHeader className="bg-slate-50 border-b p-5">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-orange-500" />
                  Open Support Ticket
                </CardTitle>
                <CardDescription className="text-xs">
                  Can't find the answer? Ask our developers directly.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                {ticketSuccess ? (
                  <div className="text-center py-8 space-y-4 animate-in zoom-in-95 duration-200">
                    <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-slate-900">Ticket Submitted!</h4>
                      <p className="text-xs text-slate-500 max-w-[200px] mx-auto leading-normal">
                        We will respond to your email shortly.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs border-slate-200 mt-2"
                      onClick={() => setTicketSuccess(false)}
                    >
                      Submit another ticket
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitTicket} className="space-y-4">
                    {ticketError && (
                      <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs p-3 rounded-lg flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{ticketError}</span>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Your Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          type="email"
                          placeholder="you@company.com"
                          value={ticketEmail}
                          onChange={(e) => setTicketEmail(e.target.value)}
                          className="pl-9 h-10 text-xs border-slate-200"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Subject</label>
                      <Input
                        placeholder="Brief summary of the issue..."
                        value={ticketSubject}
                        onChange={(e) => setTicketSubject(e.target.value)}
                        className="h-10 text-xs border-slate-200"
                        required
                      />
                    </div>

                    {/* Dynamic Related Article Suggestions */}
                    {ticketSuggestions.length > 0 && (
                      <div className="bg-orange-50/50 border border-orange-100 p-3.5 rounded-xl space-y-2 animate-in slide-in-from-top-1">
                        <span className="text-[9px] font-extrabold text-orange-600 uppercase tracking-widest block">
                          Recommended self-help articles:
                        </span>
                        <div className="space-y-1.5">
                          {ticketSuggestions.map((sug) => (
                            <button
                              key={sug.id}
                              type="button"
                              onClick={() => {
                                setSelectedSuggestionId(sug.id);
                              }}
                              className={`w-full text-left text-xs p-1.5 rounded transition-all flex items-start gap-2 border ${
                                selectedSuggestionId === sug.id
                                  ? 'bg-orange-100 border-orange-300 text-orange-800 font-semibold shadow-sm'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              <FileText className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-400" />
                              <div>
                                <p className="line-clamp-1">{sug.title}</p>
                                <Link
                                  href={`/kb/${sug.slug}`}
                                  target="_blank"
                                  className="text-[10px] text-orange-600 underline font-normal block mt-0.5 hover:text-orange-700"
                                >
                                  Open article in new tab
                                </Link>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Details</label>
                      <Textarea
                        placeholder="Please provide steps to reproduce, errors seen, or questions..."
                        value={ticketDescription}
                        onChange={(e) => setTicketDescription(e.target.value)}
                        className="h-24 text-xs border-slate-200"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={submittingTicket}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-10 text-xs shadow-md shadow-orange-500/10"
                    >
                      {submittingTicket ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                      Submit Ticket
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

    </div>
  );
}
