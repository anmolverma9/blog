'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2, Plus, Edit3, Trash2, Layers, Star, ExternalLink, Globe,
  CheckCircle, ThumbsUp, ThumbsDown, Search, ArrowRight
} from 'lucide-react';

interface SoftwareCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

interface SoftwareListing {
  id: number;
  name: string;
  slug: string;
  tagline?: string;
  description: string;
  logo_url?: string;
  website_url?: string;
  pricing_model: string;
  overall_rating: number;
  category_name?: string;
  category_id?: number;
}

interface SoftwareReview {
  id: number;
  software_id: number;
  user_name: string;
  rating: number;
  review_text?: string;
  pros: string[];
  cons: string[];
  created_at: string;
}

export default function SoftwareClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'listings' | 'categories' | 'reviews'>('listings');

  // Directory lists
  const [listings, setListings] = useState<SoftwareListing[]>([]);
  const [categories, setCategories] = useState<SoftwareCategory[]>([]);
  const [reviews, setReviews] = useState<SoftwareReview[]>([]);
  const [selectedSoftwareId, setSelectedSoftwareId] = useState<number | null>(null);

  // Category Form State
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // Listing Form State
  const [listName, setListName] = useState('');
  const [listSlug, setListSlug] = useState('');
  const [listTagline, setListTagline] = useState('');
  const [listDesc, setListDesc] = useState('');
  const [listLogo, setListLogo] = useState('');
  const [listWebsite, setListWebsite] = useState('');
  const [listPricing, setListPricing] = useState('free');
  const [listCategoryId, setListCategoryId] = useState('');
  const [editingListingId, setEditingListingId] = useState<number | null>(null);
  const [showListingForm, setShowListingForm] = useState(false);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch Directory Data
  const loadDirectoryData = async () => {
    try {
      const catRes = await fetch('/api/admin/software?type=categories');
      if (catRes.ok) {
        const cData = await catRes.json();
        setCategories(cData);
      }

      const listRes = await fetch('/api/admin/software?type=listings');
      if (listRes.ok) {
        const lData = await listRes.json();
        setListings(lData);
      }
    } catch (err) {
      console.error('Error loading Software Catalog data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDirectoryData();
  }, []);

  // Fetch reviews when software is selected
  useEffect(() => {
    async function loadReviews() {
      if (selectedSoftwareId === null) return;
      try {
        const res = await fetch(`/api/admin/software?type=reviews&softwareId=${selectedSoftwareId}`);
        if (res.ok) {
          const data = await res.json();
          setReviews(data);
        }
      } catch (err) {
        console.error('Failed to load reviews', err);
      }
    }
    loadReviews();
  }, [selectedSoftwareId]);

  // Submit Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName || !catSlug) return alert('Name and Slug are required');

    setSaving(true);
    try {
      const res = await fetch('/api/admin/software', {
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
        loadDirectoryData();
        alert('Category folder added!');
      } else {
        alert('Failed to save category');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Submit Listing
  const handleSaveListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listName || !listSlug || !listDesc) {
      return alert('Name, slug, and description are required');
    }

    setSaving(true);
    const isEdit = editingListingId !== null;
    try {
      const res = await fetch('/api/admin/software', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'listing',
          id: editingListingId,
          name: listName,
          slug: listSlug,
          tagline: listTagline,
          description: listDesc,
          logo_url: listLogo,
          website_url: listWebsite,
          pricing_model: listPricing,
          category_id: listCategoryId ? Number(listCategoryId) : null,
        }),
      });

      if (res.ok) {
        setListName('');
        setListSlug('');
        setListTagline('');
        setListDesc('');
        setListLogo('');
        setListWebsite('');
        setListPricing('free');
        setListCategoryId('');
        setEditingListingId(null);
        setShowListingForm(false);
        loadDirectoryData();
        alert(isEdit ? 'Software updated successfully' : 'Software added successfully');
      } else {
        alert('Failed to save listing');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleEditListing = (soft: SoftwareListing) => {
    setEditingListingId(soft.id);
    setListName(soft.name);
    setListSlug(soft.slug);
    setListTagline(soft.tagline || '');
    setListDesc(soft.description);
    setListLogo(soft.logo_url || '');
    setListWebsite(soft.website_url || '');
    setListPricing(soft.pricing_model);
    setListCategoryId(soft.category_id ? soft.category_id.toString() : '');
    setShowListingForm(true);
  };

  const handleDeleteListing = async (id: number) => {
    if (!confirm('Are you sure you want to delete this listing? This will delete all its reviews as well.')) return;
    try {
      const res = await fetch(`/api/admin/software?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setListings(listings.filter(s => s.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Moderate Review
  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm('Are you sure you want to delete this review? This will update the overall score average.')) return;
    try {
      const res = await fetch(`/api/admin/software?type=review&id=${reviewId}&softwareId=${selectedSoftwareId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setReviews(reviews.filter(r => r.id !== reviewId));
        // Refresh listing rating score locally
        loadDirectoryData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredListings = listings.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
        <p className="text-slate-500 font-medium">Loading Software Catalog...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Software Directory Catalog</h1>
          <p className="text-slate-500 mt-1">Manage listed SaaS profiles, taxonomy categories, and moderate customer reviews.</p>
        </div>
        {!showListingForm && activeTab === 'listings' && (
          <Button onClick={() => setShowListingForm(true)} className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-10 px-5 flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> Add Software Listing
          </Button>
        )}
      </div>

      {/* Navigation tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit border border-slate-200/50 select-none">
        <button onClick={() => { setActiveTab('listings'); setShowListingForm(false); setSelectedSoftwareId(null); }} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'listings' && selectedSoftwareId === null ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
          <Layers className="h-3.5 w-3.5" /> Listings
        </button>
        <button onClick={() => { setActiveTab('categories'); setShowListingForm(false); setSelectedSoftwareId(null); }} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'categories' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
          <Plus className="h-3.5 w-3.5" /> Catalog Categories
        </button>
        {selectedSoftwareId !== null && (
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-white text-slate-900 shadow-sm border border-slate-200">
            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> Reviews Moderation
          </button>
        )}
      </div>

      {/* Listing Form */}
      {showListingForm && activeTab === 'listings' && (
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800">{editingListingId ? 'Edit Product Listing' : 'New Product Listing'}</CardTitle>
            <CardDescription className="text-xs">Publish a detailed software overview card.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveListing} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Product Name</label>
                  <Input value={listName} onChange={e => {
                    setListName(e.target.value);
                    if (!editingListingId) {
                      setListSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                    }
                  }} placeholder="e.g. Mailchimp Automation" className="text-sm border-slate-200" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Slug Identifier</label>
                  <Input value={listSlug} onChange={e => setListSlug(e.target.value)} placeholder="mailchimp-automation" className="text-sm border-slate-200" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Tagline / Key Feature Summary</label>
                <Input value={listTagline} onChange={e => setListTagline(e.target.value)} placeholder="e.g. Email newsletter automation campaigns for growing SaaS teams." className="text-sm border-slate-200" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Pricing Tier Type</label>
                  <select
                    value={listPricing}
                    onChange={e => setListPricing(e.target.value)}
                    className="w-full h-9 px-2 rounded-lg border border-slate-200 text-xs sm:text-sm"
                  >
                    <option value="free">Free</option>
                    <option value="freemium">Freemium</option>
                    <option value="paid">Paid Subscription</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Catalog Category</label>
                  <select
                    value={listCategoryId}
                    onChange={e => setListCategoryId(e.target.value)}
                    className="w-full h-9 px-2 rounded-lg border border-slate-200 text-xs sm:text-sm"
                  >
                    <option value="">Select Category...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Logo Icon URL</label>
                  <Input value={listLogo} onChange={e => setListLogo(e.target.value)} placeholder="https://domain.com/logo.png" className="text-sm border-slate-200" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Official Website URL</label>
                <Input value={listWebsite} onChange={e => setListWebsite(e.target.value)} placeholder="https://mailchimp.com" className="text-sm border-slate-200" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Detailed Description</label>
                <Textarea value={listDesc} onChange={e => setListDesc(e.target.value)} placeholder="Write full software descriptions, features list, and capabilities..." className="text-sm border-slate-200 h-32" />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-9 text-xs">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Listing'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowListingForm(false);
                    setEditingListingId(null);
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

      {/* Listings List */}
      {activeTab === 'listings' && !showListingForm && selectedSoftwareId === null && (
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-800">Listed Software Directory</CardTitle>
              <CardDescription className="text-xs">SaaS tools catalog listings.</CardDescription>
            </div>
            <div className="flex items-center gap-2 max-w-sm w-full bg-slate-50 border rounded-xl px-2 py-1 select-none">
              <Search className="h-4 w-4 text-slate-400" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} type="text" placeholder="Search catalog..." className="bg-transparent border-0 text-xs text-slate-700 outline-none w-full" />
            </div>
          </CardHeader>
          <CardContent>
            {filteredListings.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 border border-dashed rounded-xl p-4 text-center">No listings found.</p>
            ) : (
              <div className="space-y-3.5">
                {filteredListings.map(soft => (
                  <div key={soft.id} className="border border-slate-200 rounded-3xl p-5 bg-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-orange-200 transition-colors">
                    <div className="flex gap-4">
                      {soft.logo_url ? (
                        <img src={soft.logo_url} alt={soft.name} className="h-12 w-12 rounded-xl object-cover shrink-0 border border-slate-100 bg-slate-50" />
                      ) : (
                        <div className="h-12 w-12 rounded-xl bg-orange-50 text-orange-500 font-bold flex items-center justify-center text-lg shrink-0 border border-orange-100">
                          {soft.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                          {soft.name}
                          <span className="text-[9px] font-bold text-slate-500 uppercase bg-slate-100 px-1.5 py-0.5 rounded">{soft.pricing_model}</span>
                        </h4>
                        <p className="text-slate-500 text-xs leading-normal font-medium">{soft.tagline || 'No tagline configured.'}</p>
                        <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-400">
                          <span className="text-orange-500 uppercase">{soft.category_name || 'General'}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                            {Number(soft.overall_rating).toFixed(1)} / 5.0
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <Button onClick={() => setSelectedSoftwareId(soft.id)} variant="ghost" className="text-xs font-bold text-orange-500 hover:text-orange-600 h-8 flex items-center gap-1">
                        Moderate Reviews <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                      <Button onClick={() => handleEditListing(soft)} variant="ghost" className="text-xs font-bold text-slate-600 h-8">Edit</Button>
                      <Button onClick={() => handleDeleteListing(soft.id)} variant="ghost" className="text-xs font-bold text-red-500 h-8">Delete</Button>
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
              <CardTitle className="text-base font-bold text-slate-800">Add Software Category</CardTitle>
              <CardDescription className="text-xs">Setup target software folders.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveCategory} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Category Name</label>
                  <Input value={catName} onChange={e => {
                    setCatName(e.target.value);
                    setCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                  }} placeholder="e.g. Email Marketing" className="text-sm border-slate-200" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Slug Identifier</label>
                  <Input value={catSlug} onChange={e => setCatSlug(e.target.value)} placeholder="email-marketing" className="text-sm border-slate-200" />
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
              <CardTitle className="text-base font-bold text-slate-800">Catalog Categories</CardTitle>
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

      {/* Reviews Moderation Tab */}
      {selectedSoftwareId !== null && (
        <Card className="border-slate-200/80 shadow-sm animate-in fade-in duration-200">
          <CardHeader className="flex flex-row justify-between items-center pb-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-800">
                User Reviews for: "{listings.find(l => l.id === selectedSoftwareId)?.name}"
              </CardTitle>
              <CardDescription className="text-xs">Moderate user listings reviews.</CardDescription>
            </div>
            <Button onClick={() => setSelectedSoftwareId(null)} variant="ghost" className="text-xs font-bold text-slate-500 h-8">
              Back to Listings
            </Button>
          </CardHeader>
          <CardContent>
            {reviews.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 border border-dashed rounded-xl p-4 text-center">No user reviews submitted yet.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map(rev => (
                  <div key={rev.id} className="border border-slate-200 rounded-3xl p-5 bg-white shadow-sm flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{rev.user_name}</p>
                          <p className="text-[9px] text-slate-400 font-medium">Date: {new Date(rev.created_at).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3.5 w-3.5 ${i < rev.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`} />
                          ))}
                        </div>
                      </div>

                      <p className="text-slate-600 text-xs sm:text-sm leading-relaxed italic whitespace-pre-wrap">{rev.review_text || 'No review text provided.'}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        {rev.pros.length > 0 && (
                          <div className="bg-emerald-50/20 border border-emerald-100 rounded-2xl p-3 text-xs">
                            <p className="font-bold text-emerald-800 flex items-center gap-1 mb-1.5"><ThumbsUp className="h-3.5 w-3.5 text-emerald-600" /> Pros</p>
                            <ul className="space-y-1 text-slate-600 font-medium pl-1">
                              {rev.pros.map((p, i) => <li key={i}>• {p}</li>)}
                            </ul>
                          </div>
                        )}
                        {rev.cons.length > 0 && (
                          <div className="bg-rose-50/20 border border-rose-100 rounded-2xl p-3 text-xs">
                            <p className="font-bold text-rose-800 flex items-center gap-1 mb-1.5"><ThumbsDown className="h-3.5 w-3.5 text-rose-600" /> Cons</p>
                            <ul className="space-y-1 text-slate-600 font-medium pl-1">
                              {rev.cons.map((c, i) => <li key={i}>• {c}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end border-t border-slate-100 pt-3.5">
                      <Button onClick={() => handleDeleteReview(rev.id)} variant="ghost" className="text-xs font-bold text-red-500 hover:text-red-600 h-8 flex items-center gap-1">
                        <Trash2 className="h-3.5 w-3.5" /> Remove Review
                      </Button>
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
