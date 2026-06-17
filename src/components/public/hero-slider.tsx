'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Calendar, User } from 'lucide-react';

interface PostItem {
  id?: number;
  title: string;
  slug: string;
  summary?: string;
  category_name?: string | null;
  author_name?: string;
  published_at?: string | null;
  featured_image_path?: string | null;
}

interface HeroSliderProps {
  posts: PostItem[];
}

export default function HeroSlider({ posts }: HeroSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (posts.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % posts.length);
    }, 1000); // auto-slide every 1 second
    return () => clearInterval(interval);
  }, [posts.length]);

  if (!posts || posts.length === 0) return null;

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? posts.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % posts.length);
  };

  return (
    <div className="relative w-full h-[400px] rounded-3xl overflow-hidden shadow-lg group bg-slate-900 border border-slate-100">
      {/* Slides Container */}
      <div 
        className="w-full h-full flex transition-transform duration-300 ease-in-out"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {posts.map((post) => (
          <div
            key={post.id ?? post.slug}
            className="w-full h-full shrink-0 relative"
          >
            {/* Background Image */}
            {post.featured_image_path ? (
              <img
                src={post.featured_image_path}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-slate-500">
                No Image
              </div>
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

            {/* Slide Content */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 space-y-3 text-white z-20">
              {post.category_name && (
                <span className="inline-block px-2.5 py-1 rounded bg-orange-600 text-[10px] font-extrabold uppercase tracking-wider">
                  {post.category_name}
                </span>
              )}
              
              <h2 className="text-xl md:text-2xl font-black leading-tight hover:underline">
                <Link href={`/${post.slug}`}>{post.title}</Link>
              </h2>

              <div className="flex items-center gap-4 text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-orange-500" />
                  {post.author_name}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-orange-500" />
                  {post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { dateStyle: 'medium' }) : ''}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {posts.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/40 hover:bg-orange-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/40 hover:bg-orange-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
            aria-label="Next Slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {posts.length > 1 && (
        <div className="absolute bottom-4 right-6 z-30 flex items-center gap-2">
          {posts.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                idx === activeIndex
                  ? 'bg-orange-600 w-5'
                  : 'bg-white/50 hover:bg-white'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
