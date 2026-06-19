'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import { parseInlineMarkdown } from '@/lib/markdown';

interface Heading {
  text: string;
  id: string;
}

interface OnThisPageProps {
  headings: Heading[];
}

export default function OnThisPage({ headings }: OnThisPageProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120; // Offset for sticky headers/navbar
      
      let currentActiveId = '';
      for (const h of headings) {
        const el = document.getElementById(h.id);
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY;
          if (scrollPosition >= top) {
            currentActiveId = h.id;
          } else {
            break;
          }
        }
      }
      
      if (window.scrollY < 100 && headings.length > 0) {
        setActiveId(headings[0].id);
      } else if (currentActiveId) {
        setActiveId(currentActiveId);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Trigger initially on mount

    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <div className="hidden md:block md:col-span-1 space-y-4 h-fit sticky top-20">
      <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
        <TrendingUp className="h-3.5 w-3.5 text-orange-500" />
        On This Page
      </h4>
      <ul className="space-y-2 text-sm font-semibold text-slate-500 border-l border-slate-100 pl-3">
        {headings.map((heading, idx) => {
          const isActive = activeId === heading.id;
          return (
            <li key={idx}>
              <a
                href={`#${heading.id}`}
                className={`block transition-all py-0.5 ${
                  isActive
                    ? 'text-orange-500 border-l-2 border-orange-500 pl-2 -ml-[14px] font-bold'
                    : 'hover:text-orange-500'
                }`}
              >
                {parseInlineMarkdown(heading.text)}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
