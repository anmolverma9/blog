'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Menu, X, Bell, Zap } from 'lucide-react';

interface NavbarProps {
  siteName?: string;
  siteLogo?: string;
  siteDescription?: string;
  menuItems?: Array<{
    label: string;
    url: string;
  }>;
  breakingNewsTitle?: string;
}

export default function Navbar({
  siteName = 'Tech Giant World',
  siteLogo = '',
  siteDescription = 'The latest tech news about the world\'s best...',
  menuItems = [],
  breakingNewsTitle = 'Why Social Media Marketing Matters for Modern Business Growth'
}: NavbarProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const d = new Date();
    const day = d.getDate();
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const year = d.getFullYear();
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
    setDateStr(`${day} ${month} ${year}, ${weekday}`);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search.trim())}`);
    }
  };

  const displayLinks = menuItems.length > 0 ? menuItems : [
    { label: 'Home', url: '/' },
    { label: 'Business', url: '/posts?category=business' },
    { label: 'Fashion', url: '/posts?category=fashion' },
    { label: 'Food', url: '/posts?category=food' },
    { label: 'Gadgets', url: '/posts?category=gadgets' },
    { label: 'Health', url: '/posts?category=health' },
    { label: 'Lifestyle', url: '/posts?category=lifestyle' },
    { label: 'News', url: '/posts?category=news' },
    { label: 'Sports', url: '/posts?category=sports' },
    { label: 'Technology', url: '/posts?category=technology' },
    { label: 'Entertainment', url: '/posts?category=entertainment' },
    { label: 'Home Improvement', url: '/posts?category=home-improvement' },
    { label: 'Digital Marketing', url: '/posts?category=digital-marketing' },
  ];

  return (
    <header className="w-full bg-white border-b border-slate-100 z-50">
      {/* 1. Breaking News Bar */}
      <div className="bg-orange-600 text-white text-xs py-2 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Left: Breaking News Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="bg-white text-orange-600 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider text-[10px] flex items-center gap-1 shrink-0">
              <Zap className="h-3.5 w-3.5 fill-current" />
              Breaking
            </span>
            <p className="font-semibold truncate text-[11px] sm:text-xs">
              {breakingNewsTitle}
            </p>
          </div>

          {/* Right: Date & Social Icons */}
          <div className="flex items-center gap-4 shrink-0 text-[11px] sm:text-xs font-semibold">
            <span>{dateStr}</span>
            <span className="text-white/30">|</span>
            <div className="flex items-center gap-3">
              <a href="#" className="hover:text-slate-200 transition-colors" aria-label="Facebook">
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/></svg>
              </a>
              <a href="#" className="hover:text-slate-200 transition-colors" aria-label="Twitter">
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#" className="hover:text-slate-200 transition-colors" aria-label="Instagram">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
              <a href="#" className="hover:text-slate-200 transition-colors" aria-label="YouTube">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
              </a>
              <a href="#" className="hover:text-slate-200 transition-colors" aria-label="Telegram">
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.35-.49.97-.74 3.79-1.65 6.31-2.74 7.57-3.27 3.61-1.5 4.36-1.76 4.85-1.77.11 0 .35.03.5.16.13.12.17.29.18.41-.01.07-.01.14-.02.21z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Middle Brand Title Area */}
      <div className="py-8 px-4 text-center max-w-[1440px] mx-auto flex flex-col items-center">
        <Link href="/" className="inline-block">
          {siteLogo ? (
            <img src={siteLogo} alt={siteName} className="h-16 md:h-20 object-contain mx-auto" />
          ) : (
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
              {siteName}
            </h1>
          )}
        </Link>
        {siteDescription && (
          <p className="text-slate-500 text-xs sm:text-sm mt-3 font-medium tracking-wide">
            {siteDescription}
          </p>
        )}
      </div>

      {/* 3. Navigation Bar */}
      <div className="border-t border-slate-100 bg-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          
          {/* Centered Desktop Menu Links */}
          <div className="hidden lg:flex flex-1 justify-center items-center gap-5 text-xs font-bold text-slate-700 uppercase tracking-wider">
            {displayLinks.map((link, idx) => (
              <Link key={idx} href={link.url} className="hover:text-orange-600 transition-colors py-2">
                {link.label}
              </Link>
            ))}
          </div>

          {/* Subscribe Button (Desktop) */}
          <div className="hidden lg:flex items-center gap-3">
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md shadow-orange-600/10 transition-all">
              <Bell className="h-3.5 w-3.5 fill-current" />
              Subscribe
            </button>
          </div>

          {/* Mobile Navigation Header items */}
          <div className="lg:hidden flex items-center justify-between w-full">
            <Link href="/" className="shrink-0 flex items-center">
              {siteLogo ? (
                <img src={siteLogo} alt={siteName} className="h-8 object-contain" />
              ) : (
                <span className="font-extrabold text-slate-900 text-sm tracking-tight">{siteName}</span>
              )}
            </Link>
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-500 hover:text-slate-900 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* 4. Sub-Navigation / Write for Us */}
        <div className="border-t border-slate-100 bg-slate-50/50 py-2.5 px-4 sm:px-6 lg:px-8">
          <div className="max-w-[1440px] mx-auto flex items-center">
            <Link href="/posts/submit" className="text-xs font-bold text-slate-600 hover:text-orange-600 transition-colors uppercase tracking-wider">
              Write for Us
            </Link>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-100 bg-white px-4 pt-2 pb-6 space-y-4 animate-in slide-in-from-top duration-200">
            {/* Search Mobile */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                placeholder="Search articles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-orange-600"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            </form>

            {/* Links Mobile */}
            <div className="flex flex-col gap-3 font-semibold text-slate-700 text-sm uppercase tracking-wider">
              {displayLinks.map((link, idx) => (
                <Link
                  key={idx}
                  href={link.url}
                  className="hover:text-orange-600 py-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <button className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg bg-orange-600 text-white font-bold mt-2">
                <Bell className="h-4 w-4 fill-current" />
                Subscribe
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
