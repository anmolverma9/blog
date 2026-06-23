'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface SearchFormProps {
  variant?: 'sidebar' | 'notfound';
}

export default function SearchForm({ variant = 'sidebar' }: SearchFormProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Dynamically detect base path prefix from browser url pathname
    const pathname = window.location.pathname;
    const isBlogPrefix = pathname.startsWith('/blog');
    const basePath = isBlogPrefix ? '/blog' : '';

    // Direct browser redirect to prevent client-side routing mismatches on proxy setups
    window.location.href = `${basePath}/search?q=${encodeURIComponent(query.trim())}`;
  };

  if (variant === 'notfound') {
    return (
      <form
        onSubmit={handleSubmit}
        className="relative z-10 mt-8 w-full max-w-lg flex gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            id="not-found-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles..."
            autoComplete="off"
            className="w-full h-12 pl-11 pr-4 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 transition-all"
            required
          />
        </div>
        <button
          type="submit"
          className="h-12 px-6 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold transition-all shadow-md shadow-orange-600/20 shrink-0 cursor-pointer"
        >
          Search
        </button>
      </form>
    );
  }

  // Default 'sidebar' variant
  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search articles..."
        className="flex-1 h-10 px-4 rounded-full border border-slate-200 bg-white text-sm focus:outline-none focus:border-orange-500 transition-colors"
        required
      />
      <button
        type="submit"
        className="h-10 px-5 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold transition-all shadow-md shadow-orange-600/10 shrink-0 cursor-pointer"
      >
        Search
      </button>
    </form>
  );
}
