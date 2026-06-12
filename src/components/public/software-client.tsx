'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Search, Loader2, Star, Tag, ArrowRight, ExternalLink, SlidersHorizontal, Info } from 'lucide-react';
import MotionWrapper from '@/components/public/motion-wrapper';

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
}

export default function SoftwareClient() {
  const [categories, setCategories] = useState<SoftwareCategory[]>([]);
  const [listings, setListings] = useState<SoftwareListing[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedPricing, setSelectedPricing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [catsRes, listsRes] = await Promise.all([
          fetch('/api/admin/software?type=categories'),
          fetch('/api/admin/software?type=listings')
        ]);
        if (catsRes.ok) setCategories(await catsRes.json());
        if (listsRes.ok) setListings(await listsRes.json());
      } catch (err) {
        console.error('Failed to load software directory data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filter listings
  const filteredListings = listings.filter(item => {
    const matchesCategory = selectedCategory === null || item.category_name === categories.find(c => c.id === selectedCategory)?.name;
    const matchesPricing = selectedPricing === null || item.pricing_model.toLowerCase() === selectedPricing.toLowerCase();
    const matchesSearch = searchQuery.trim() === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.tagline || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesPricing && matchesSearch;
  });

  return (
    <div className="editorial-container py-10 md:py-16 space-y-12 animate-in fade-in duration-300">
      
      {/* Hero Banner Section */}
      <MotionWrapper direction="up">
        <div className="bg-slate-900 rounded-3xl text-white p-8 md:p-16 text-center space-y-6 relative overflow-hidden shadow-lg">
          <div className="absolute top-[-20%] right-[-10%] w-[350px] h-[350px] rounded-full bg-orange-500 blur-[85px] opacity-25" />
          <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Software Directory & Tool Catalog
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Find the Best Publishing SaaS Tools</h1>
          <p className="text-slate-300 text-sm md:text-base max-w-xl mx-auto">
            Compare ratings, reviews, features, and pricing models for leading CMS platforms and utility software.
          </p>
          
          <div className="max-w-lg mx-auto relative mt-2">
            <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search tools by name, features, category..."
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
          <p className="text-slate-500 text-sm font-medium">Loading catalog...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Filters */}
          <div className="space-y-6 lg:col-span-1">
            <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-6 shadow-sm">
              <div className="flex items-center gap-2 pb-3 border-b text-slate-800">
                <SlidersHorizontal className="h-4.5 w-4.5 text-orange-500" />
                <h3 className="font-bold text-sm uppercase tracking-wider">Refine Search</h3>
              </div>

              {/* Pricing Models */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Pricing Model</label>
                <div className="flex flex-col gap-1.5">
                  {[
                    { key: null, label: 'All Pricing Models' },
                    { key: 'free', label: 'Free' },
                    { key: 'freemium', label: 'Freemium' },
                    { key: 'paid', label: 'Paid / Subscription' }
                  ].map(p => (
                    <button
                      key={p.key || 'all'}
                      onClick={() => setSelectedPricing(p.key)}
                      className={`text-xs text-left px-3 py-2 rounded-lg font-semibold transition-colors ${
                        selectedPricing === p.key
                          ? 'bg-orange-50 text-orange-600 font-bold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Category</label>
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`text-xs text-left px-3 py-2 rounded-lg font-semibold transition-colors ${
                      selectedCategory === null
                        ? 'bg-orange-50 text-orange-600 font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`text-xs text-left px-3 py-2 rounded-lg font-semibold transition-colors ${
                        selectedCategory === cat.id
                          ? 'bg-orange-50 text-orange-600 font-bold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Listings Grid */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                {filteredListings.length} Software Found
              </h2>
              <div className="text-xs text-slate-400 font-medium">Sorted by Overall Rating</div>
            </div>

            {filteredListings.length === 0 ? (
              <div className="text-center py-20 bg-white border border-dashed rounded-3xl p-6 text-slate-400 text-sm">
                No software matches the applied filters. Try adjusting your sidebar selection.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredListings.map((item) => (
                  <Card key={item.id} className="hover:border-orange-200 transition-colors shadow-sm flex flex-col justify-between h-full hover:shadow-md bg-white">
                    <div>
                      <CardHeader className="p-6 pb-3 flex flex-row items-start gap-4">
                        <div className="h-12 w-12 rounded-xl overflow-hidden shrink-0 bg-slate-50 border flex items-center justify-center font-bold text-lg text-slate-700">
                          {item.logo_url ? (
                            <img src={item.logo_url} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            item.name.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-extrabold uppercase text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                            {item.category_name || 'Utilities'}
                          </span>
                          <CardTitle className="text-lg font-bold text-slate-900 pt-1">
                            {item.name}
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="px-6 pb-2">
                        <p className="text-xs font-semibold text-slate-700 italic">{item.tagline}</p>
                        <p className="text-slate-550 text-xs mt-2 line-clamp-3 leading-relaxed">
                          {item.description}
                        </p>
                      </CardContent>
                    </div>

                    <div className="px-6 py-4 border-t border-slate-50 bg-slate-50/50 rounded-b-xl flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold text-slate-700">{item.overall_rating ? Number(item.overall_rating).toFixed(1) : '0.0'}</span>
                        <span className="text-[10px] text-slate-400">/ 5.0</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-extrabold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {item.pricing_model}
                        </span>
                        <Link href={`/software/${item.slug}`} className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1">
                          Details <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
