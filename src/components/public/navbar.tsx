'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Sparkles, Menu, X } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <nav className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="bg-orange-500 text-white p-1.5 rounded-lg">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-extrabold text-slate-900 tracking-tight text-xl">
            AppLuxe<span className="text-orange-500 font-medium">Blog</span>
          </span>
        </Link>

        {/* Search Bar (Desktop) */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-sm relative">
          <input
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-full border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        </form>

        {/* Links (Desktop) */}
        <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
          <Link href="/posts" className="hover:text-orange-500 transition-colors">Articles</Link>
          <Link href="/posts?category=technology" className="hover:text-orange-500 transition-colors">Tech</Link>
          <Link href="/posts?category=marketing" className="hover:text-orange-500 transition-colors">Marketing</Link>
          <Link href="/admin" className="text-orange-500 hover:text-orange-600 transition-colors">CMS Login</Link>
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-500 hover:text-slate-900 focus:outline-none"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-100 bg-white px-4 pt-2 pb-6 space-y-4 animate-in slide-in-from-top duration-200">
          {/* Search Mobile */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 bg-slate-50 text-sm"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          </form>

          {/* Links Mobile */}
          <div className="flex flex-col gap-3 font-semibold text-slate-700">
            <Link href="/posts" className="hover:text-orange-500 py-1" onClick={() => setMobileMenuOpen(false)}>All Articles</Link>
            <Link href="/posts?category=technology" className="hover:text-orange-500 py-1" onClick={() => setMobileMenuOpen(false)}>Technology</Link>
            <Link href="/posts?category=marketing" className="hover:text-orange-500 py-1" onClick={() => setMobileMenuOpen(false)}>Marketing</Link>
            <div className="h-px bg-slate-100 my-1" />
            <Link href="/admin" className="text-orange-500 hover:text-orange-600 py-1" onClick={() => setMobileMenuOpen(false)}>Portal Access</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
