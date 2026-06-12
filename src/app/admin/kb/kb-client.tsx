'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2, Plus, Edit3, Trash2, HelpCircle, FileText, FolderPlus,
  Inbox, CheckCircle, Search, MessageSquare, Check, X
} from 'lucide-react';

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
  category_id: number;
  category_name?: string;
  status: string;
}

interface KBTicket {
  id: number;
  subject: string;
  description: string;
  status: string;
  user_email: string;
  article_title?: string;
  created_at: string;
}

export default function KBClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'articles' | 'categories' | 'tickets'>('articles');

  // KB lists
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [categories, setCategories] = useState<KBCategory[]>([]);
  const [tickets, setTickets] = useState<KBTicket[]>([]);

  // Category Form State
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // Article Form State
  const [artTitle, setArtTitle] = useState('');
  const [artSlug, setArtSlug] = useState('');
  const [artContent, setArtContent] = useState('');
  const [artCategoryId, setArtCategoryId] = useState('');
  const [artStatus, setArtStatus] = useState('draft');
  const [editingArticleId, setEditingArticleId] = useState<number | null>(null);
  const [showArticleForm, setShowArticleForm] = useState(false);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch Data
  const loadKBData = async () => {
    try {
      const catRes = await fetch('/api/admin/kb?type=categories');
      if (catRes.ok) {
        const cData = await catRes.json();
        setCategories(cData);
      }

      const artRes = await fetch('/api/admin/kb?type=articles');
      if (artRes.ok) {
        const aData = await artRes.json();
        setArticles(aData);
      }

      const ticketRes = await fetch('/api/admin/kb?type=tickets');
      if (ticketRes.ok) {
        const tData = await ticketRes.json();
        setTickets(tData);
      }
    } catch (err) {
      console.error('Error loading KB details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKBData();
  }, []);

  // Submit Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName || !catSlug) return alert('Name and Slug are required');

    setSaving(true);
    try {
      const res = await fetch('/api/admin/kb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'category',
          name: catName,
          slug: catSlug,
          description: catDesc,
        }),
      });

      if (res.ok) {
        setCatName('');
        setCatSlug('');
        setCatDesc('');
        loadKBData();
        alert('Category added successfully!');
      } else {
        alert('Failed to save category');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Submit Article
  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artTitle || !artSlug || !artContent || !artCategoryId) {
      return alert('All fields are required');
    }

    setSaving(true);
    const isEdit = editingArticleId !== null;
    try {
      const res = await fetch('/api/admin/kb', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'article',
          id: editingArticleId,
          title: artTitle,
          slug: artSlug,
          content: artContent,
          category_id: artCategoryId,
          status: artStatus,
        }),
      });

      if (res.ok) {
        setArtTitle('');
        setArtSlug('');
        setArtContent('');
        setArtCategoryId('');
        setArtStatus('draft');
        setEditingArticleId(null);
        setShowArticleForm(false);
        loadKBData();
        alert(isEdit ? 'Article updated successfully' : 'Article created successfully');
      } else {
        alert('Failed to save article');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleEditArticle = (art: KBArticle) => {
    setEditingArticleId(art.id);
    setArtTitle(art.title);
    setArtSlug(art.slug);
    setArtContent(art.content);
    setArtCategoryId(art.category_id.toString());
    setArtStatus(art.status);
    setShowArticleForm(true);
  };

  const handleDeleteArticle = async (id: number) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    try {
      const res = await fetch(`/api/admin/kb?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setArticles(articles.filter(a => a.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Close Ticket
  const handleResolveTicket = async (id: number, status: string) => {
    try {
      const res = await fetch('/api/admin/kb', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ticket',
          id,
          status,
        }),
      });
      if (res.ok) {
        loadKBData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter Articles
  const filteredArticles = articles.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
        <p className="text-slate-500 font-medium">Loading Helpdesk Console...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Help Center & Ticketing</h1>
          <p className="text-slate-500 mt-1">Manage documentation pages, categorizations, and customer support tickets.</p>
        </div>
        {!showArticleForm && activeTab === 'articles' && (
          <Button onClick={() => setShowArticleForm(true)} className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-10 px-5 flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> Create Documentation Article
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit border border-slate-200/50 select-none">
        <button onClick={() => { setActiveTab('articles'); setShowArticleForm(false); }} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'articles' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
          <FileText className="h-3.5 w-3.5" /> Articles
        </button>
        <button onClick={() => { setActiveTab('categories'); setShowArticleForm(false); }} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'categories' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
          <FolderPlus className="h-3.5 w-3.5" /> Categories
        </button>
        <button onClick={() => { setActiveTab('tickets'); setShowArticleForm(false); }} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'tickets' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
          <Inbox className="h-3.5 w-3.5" /> Tickets inbox
        </button>
      </div>

      {/* Show article creation/editing form */}
      {showArticleForm && activeTab === 'articles' && (
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800">{editingArticleId ? 'Edit Article' : 'New Article'}</CardTitle>
            <CardDescription className="text-xs">Publish standard guidelines or technical docs.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveArticle} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Article Title</label>
                  <Input value={artTitle} onChange={e => {
                    setArtTitle(e.target.value);
                    if (!editingArticleId) {
                      setArtSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                    }
                  }} placeholder="e.g. How to install SMTP API integrations" className="text-sm border-slate-200" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Slug Identifier</label>
                  <Input value={artSlug} onChange={e => setArtSlug(e.target.value)} placeholder="how-to-install-smtp" className="text-sm border-slate-200" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">KB Category</label>
                  <select
                    value={artCategoryId}
                    onChange={e => setArtCategoryId(e.target.value)}
                    className="w-full h-9 px-2 rounded-lg border border-slate-200 text-xs sm:text-sm"
                  >
                    <option value="">Select Category...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Publish Status</label>
                  <select
                    value={artStatus}
                    onChange={e => setArtStatus(e.target.value)}
                    className="w-full h-9 px-2 rounded-lg border border-slate-200 text-xs sm:text-sm"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Article Content (Markdown supported)</label>
                <Textarea value={artContent} onChange={e => setArtContent(e.target.value)} placeholder="Write technical procedures or help descriptions..." className="text-sm border-slate-200 h-44 font-sans" />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-9 text-xs">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Article'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowArticleForm(false);
                    setEditingArticleId(null);
                  }}
                  className="text-xs h-9 font-semibold text-slate-500"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Articles List */}
      {activeTab === 'articles' && !showArticleForm && (
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-800">Support Articles Catalog</CardTitle>
              <CardDescription className="text-xs">Indexed guidelines matching help categories.</CardDescription>
            </div>
            <div className="flex items-center gap-2 max-w-sm w-full bg-slate-50 border rounded-xl px-2 py-1 select-none">
              <Search className="h-4 w-4 text-slate-400" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} type="text" placeholder="Search documentation..." className="bg-transparent border-0 text-xs text-slate-700 outline-none w-full" />
            </div>
          </CardHeader>
          <CardContent>
            {filteredArticles.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 border border-dashed rounded-xl p-4 text-center">No articles matching your search.</p>
            ) : (
              <div className="space-y-3">
                {filteredArticles.map(art => (
                  <div key={art.id} className="border border-slate-200 rounded-2xl p-4 bg-white flex justify-between items-center gap-4 hover:border-orange-200 transition-colors">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{art.title} <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded ml-1.5">{art.category_name}</span></h4>
                      <p className="text-xs text-slate-400 mt-1">Slug: {art.slug} • Status: <span className={art.status === 'published' ? 'text-emerald-500 font-bold' : 'text-amber-500 font-bold'}>{art.status}</span></p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleEditArticle(art)} variant="ghost" className="text-xs font-bold text-slate-600 h-8">Edit</Button>
                      <Button onClick={() => handleDeleteArticle(art.id)} variant="ghost" className="text-xs font-bold text-red-500 h-8">Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Categories Panel */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 border-slate-200/80 shadow-sm h-fit">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-800">Add KB Category</CardTitle>
              <CardDescription className="text-xs">Setup target categories matching guide directories.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveCategory} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Category Name</label>
                  <Input value={catName} onChange={e => {
                    setCatName(e.target.value);
                    setCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                  }} placeholder="e.g. SMTP Configurations" className="text-sm border-slate-200" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Slug Identifier</label>
                  <Input value={catSlug} onChange={e => setCatSlug(e.target.value)} placeholder="smtp-configurations" className="text-sm border-slate-200" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Description</label>
                  <Textarea value={catDesc} onChange={e => setCatDesc(e.target.value)} placeholder="Brief summary of category scope..." className="text-sm border-slate-200 h-16" />
                </div>
                <Button type="submit" disabled={saving} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-9 text-xs">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Category'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 border-slate-200/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-800">Documentation Categories</CardTitle>
              <CardDescription className="text-xs">Active category folders.</CardDescription>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <p className="text-xs text-slate-400 italic bg-slate-50 border border-dashed rounded-xl p-4 text-center">No categories created yet.</p>
              ) : (
                <div className="space-y-3">
                  {categories.map(c => (
                    <div key={c.id} className="border border-slate-200 rounded-2xl p-4 bg-white hover:border-orange-200 transition-colors">
                      <h4 className="font-bold text-slate-900 text-sm">{c.name}</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{c.description || 'No description configured.'}</p>
                      <p className="text-[10px] font-mono text-slate-400 mt-1">Slug: {c.slug}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tickets Inbox */}
      {activeTab === 'tickets' && (
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800">Customer Support Tickets Inbox</CardTitle>
            <CardDescription className="text-xs">Manage submissions and query tickes issues inbox.</CardDescription>
          </CardHeader>
          <CardContent>
            {tickets.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 border border-dashed rounded-xl p-4 text-center">Your support inbox is empty.</p>
            ) : (
              <div className="space-y-4">
                {tickets.map(ticket => (
                  <div key={ticket.id} className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm flex flex-col md:flex-row justify-between gap-4 hover:border-orange-200 transition-colors">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${ticket.status === 'open' ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                          {ticket.status}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">Logged: {new Date(ticket.created_at).toLocaleString()}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{ticket.subject}</h4>
                      <p className="text-slate-600 text-xs leading-relaxed max-w-2xl whitespace-pre-wrap">{ticket.description}</p>
                      {ticket.article_title && (
                        <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" /> Submitted from article: "{ticket.article_title}"
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 font-bold">Contact Email: <a href={`mailto:${ticket.user_email}`} className="text-orange-500 hover:underline">{ticket.user_email}</a></p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                      {ticket.status === 'open' ? (
                        <Button onClick={() => handleResolveTicket(ticket.id, 'closed')} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-8 text-xs flex items-center gap-1">
                          <Check className="h-3.5 w-3.5" /> Resolve Ticket
                        </Button>
                      ) : (
                        <Button onClick={() => handleResolveTicket(ticket.id, 'open')} variant="ghost" className="text-xs font-bold text-slate-500 hover:text-slate-700 h-8 flex items-center gap-1">
                          <X className="h-3.5 w-3.5" /> Reopen Ticket
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
