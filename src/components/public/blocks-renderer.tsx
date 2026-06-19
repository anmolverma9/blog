'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle, AlertCircle, Info, HelpCircle, Star, ThumbsUp, ThumbsDown,
  ArrowRight, ExternalLink, Play, Check, ChevronDown, ChevronUp, Copy,
  User, List
} from 'lucide-react';
import { parseInlineMarkdown } from '@/lib/markdown';

interface Block {
  id: string;
  type: string;
  data: any;
}

interface BlocksRendererProps {
  blocks: Block[];
}

export default function BlocksRenderer({ blocks }: BlocksRendererProps) {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) return null;

  return (
    <div className="prose prose-slate max-w-none space-y-6">
      {blocks.map((block) => {
        const renderFunc = RENDERERS[block.type];
        if (renderFunc) {
          return <div key={block.id}>{renderFunc(block.data, blocks)}</div>;
        }
        return (
          <div key={block.id} className="text-xs text-red-400 border border-dashed p-2">
            Block type "{block.type}" is unsupported.
          </div>
        );
      })}
    </div>
  );
}

const RENDERERS: Record<string, (data: any, allBlocks?: Block[]) => React.ReactNode> = {
  paragraph: (data) => (
    <p className="leading-normal font-normal text-[20px] text-black tracking-[-0.03em] mb-8 whitespace-pre-wrap">
      {parseInlineMarkdown(data.text)}
    </p>
  ),

  h1: (data) => {
    const id = getHeadingId(data.text);
    return (
      <h1 id={id} className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mt-8 mb-4 scroll-mt-20">
        {parseInlineMarkdown(data.text)}
      </h1>
    );
  },

  h2: (data) => {
    const id = getHeadingId(data.text);
    return (
      <h2 id={id} className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-6 mb-3 border-b pb-2 scroll-mt-20">
        {parseInlineMarkdown(data.text)}
      </h2>
    );
  },

  h3: (data) => {
    const id = getHeadingId(data.text);
    return (
      <h3 id={id} className="text-xl sm:text-2xl font-bold text-slate-900 mt-4 mb-2 scroll-mt-20">
        {parseInlineMarkdown(data.text)}
      </h3>
    );
  },

  image: (data) => (
    <figure className="my-6 text-center space-y-2">
      <div className="rounded-3xl overflow-hidden border border-slate-100 shadow-sm max-h-[550px] bg-slate-50 flex justify-center items-center">
        <img 
          src={data.url} 
          alt={data.alt || 'Article image'} 
          title={data.title || data.alt || 'Article image'} 
          className="max-w-full max-h-full object-contain" 
          loading="lazy" 
        />
      </div>
      {data.caption && (
        <figcaption className="text-xs sm:text-sm text-slate-400 italic font-medium">
          {data.caption}
        </figcaption>
      )}
    </figure>
  ),

  gallery: (data) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 my-6">
      {(data.urls || []).map((url: string, idx: number) => {
        const fallbackText = `Gallery Image ${idx + 1}`;
        return (
          <div key={idx} className="aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50 group">
            <img 
              src={url} 
              alt={data.alt || fallbackText} 
              title={data.title || data.alt || fallbackText} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
            />
          </div>
        );
      })}
    </div>
  ),

  video: (data) => {
    const getVideoEmbedUrl = (url: string) => {
      if (!url) return '';
      // Youtube helper parsing
      const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/i);
      if (ytMatch && ytMatch[1]) {
        return `https://www.youtube.com/embed/${ytMatch[1]}`;
      }
      // Vimeo helper parsing
      const vimeoMatch = url.match(/vimeo\.com\/([0-9]+)/i);
      if (vimeoMatch && vimeoMatch[1]) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
      }
      return url;
    };

    return (
      <figure className="my-6 space-y-2 text-center">
        <div className="aspect-video w-full rounded-3xl overflow-hidden shadow-md border border-slate-100 bg-black">
          <iframe
            src={getVideoEmbedUrl(data.url)}
            title={data.caption || 'Embedded Video'}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
        {data.caption && <figcaption className="text-xs text-slate-400 italic font-medium">{data.caption}</figcaption>}
      </figure>
    );
  },

  faq: (data) => (
    <div className="space-y-3.5 my-6">
      {(data.items || []).map((item: any, idx: number) => (
        <FAQAccordion key={idx} question={item.question} answer={item.answer} />
      ))}
    </div>
  ),

  callout: (data) => {
    const config = {
      info: { bg: 'bg-blue-50/70 border-blue-200 text-blue-900', icon: Info, label: 'Note' },
      warning: { bg: 'bg-yellow-50/70 border-yellow-200 text-yellow-900', icon: AlertCircle, label: 'Warning' },
      success: { bg: 'bg-emerald-50/70 border-emerald-200 text-emerald-900', icon: CheckCircle, label: 'Tip' },
      danger: { bg: 'bg-rose-50/70 border-rose-200 text-rose-900', icon: AlertCircle, label: 'Caution' },
    }[data.type as 'info' | 'warning' | 'success' | 'danger'] || { bg: 'bg-slate-50 border-slate-200 text-slate-900', icon: Info, label: 'Note' };

    const Icon = config.icon;

    return (
      <div className={`border-l-4 p-5 rounded-r-2xl my-6 flex items-start gap-3.5 shadow-sm ${config.bg}`}>
        <Icon className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="space-y-1 text-sm sm:text-base">
          {data.title && <p className="font-bold leading-tight">{parseInlineMarkdown(data.title)}</p>}
          <p className="leading-relaxed opacity-95">{parseInlineMarkdown(data.text)}</p>
        </div>
      </div>
    );
  },

  button: (data) => {
    const alignClass = data.align === 'left' ? 'text-left' : data.align === 'right' ? 'text-right' : 'text-center';
    const btnClass = data.style === 'primary'
      ? 'bg-orange-500 hover:bg-orange-600 text-white font-bold h-11 px-6 shadow-md shadow-orange-500/20'
      : 'border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold bg-white h-11 px-6';

    return (
      <div className={`my-6 ${alignClass}`}>
        <a
          href={data.url || '#'}
          target={data.url?.startsWith('http') ? '_blank' : undefined}
          rel={data.url?.startsWith('http') ? 'noopener noreferrer' : undefined}
          className={`inline-flex items-center gap-1.5 rounded-xl text-sm transition-all ${btnClass}`}
        >
          {data.text}
          {data.url?.startsWith('http') && <ExternalLink className="h-3.5 w-3.5" />}
        </a>
      </div>
    );
  },

  divider: () => <hr className="my-8 border-t border-slate-200/80" />,

  table: (data) => (
    <div className="overflow-x-auto my-6 border border-slate-200 rounded-2xl shadow-sm bg-white">
      <table className="min-w-full text-sm divide-y divide-slate-100">
        <thead>
          <tr className="bg-slate-50/50">
            {(data.headers || []).map((h: string, idx: number) => (
              <th key={idx} className="px-5 py-3 text-left font-bold text-slate-700 tracking-tight">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {(data.rows || []).map((row: string[], rIdx: number) => (
            <tr key={rIdx} className="hover:bg-slate-50/50 transition-colors">
              {row.map((cell: string, cIdx: number) => (
                <td key={cIdx} className="px-5 py-3 text-slate-600 leading-normal">
                  {parseInlineMarkdown(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),

  code: (data) => <CodeHighlightBlock code={data.code} language={data.language} />,

  review: (data) => (
    <div className="border border-slate-200/80 rounded-3xl p-6 my-6 bg-white shadow-sm hover:shadow-md transition-shadow space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3.5">
        <div>
          <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Product Recommendation Review</span>
          <h3 className="text-xl font-bold text-slate-900 mt-0.5">{data.productName}</h3>
        </div>
        <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-xl">
          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
          <span className="text-sm font-extrabold text-amber-800">{data.rating} / {data.ratingMax}</span>
        </div>
      </div>
      <p className="text-sm sm:text-base text-slate-600 leading-relaxed italic whitespace-pre-wrap">{parseInlineMarkdown(data.summary)}</p>
      {data.buyUrl && (
        <a
          href={data.buyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold h-11 px-6 rounded-xl text-sm shadow-md shadow-orange-500/15"
        >
          Check Official Price <ExternalLink className="h-4 w-4" />
        </a>
      )}
    </div>
  ),

  proscons: (data) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
      {/* Pros */}
      <div className="bg-emerald-50/30 border border-emerald-100 rounded-3xl p-5 shadow-inner-sm">
        <h4 className="text-sm font-bold text-emerald-800 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
          <ThumbsUp className="h-4 w-4 text-emerald-600" /> Advantages (Pros)
        </h4>
        <ul className="space-y-2.5 text-slate-700 text-sm">
          {(data.pros || []).filter(Boolean).map((pro: string, idx: number) => (
            <li key={idx} className="flex items-start gap-2.5 leading-normal">
              <span className="text-emerald-500 font-extrabold mt-0.5 shrink-0">✓</span>
              <span>{parseInlineMarkdown(pro)}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Cons */}
      <div className="bg-rose-50/30 border border-rose-100 rounded-3xl p-5 shadow-inner-sm">
        <h4 className="text-sm font-bold text-rose-800 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
          <ThumbsDown className="h-4 w-4 text-rose-600" /> Drawbacks (Cons)
        </h4>
        <ul className="space-y-2.5 text-slate-700 text-sm">
          {(data.cons || []).filter(Boolean).map((con: string, idx: number) => (
            <li key={idx} className="flex items-start gap-2.5 leading-normal">
              <span className="text-rose-500 font-extrabold mt-0.5 shrink-0">✗</span>
              <span>{parseInlineMarkdown(con)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  ),

  comparison: (data) => (
    <div className="overflow-x-auto my-6 border border-slate-200/80 rounded-2xl shadow-sm bg-white">
      <table className="min-w-full text-xs sm:text-sm divide-y divide-slate-100">
        <thead>
          <tr className="bg-slate-50/60 font-bold text-slate-700 border-b">
            {(data.headers || []).map((h: string, idx: number) => (
              <th key={idx} className="px-4 py-3.5 text-left first:font-bold font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {(data.rows || []).map((row: any, rIdx: number) => (
            <tr key={rIdx} className={`hover:bg-slate-50/50 transition-colors ${row.isHighlight ? 'bg-orange-50/20' : ''}`}>
              <td className="px-4 py-3.5 font-bold text-slate-900 border-r border-slate-100/50">
                {row.label}
              </td>
              {(row.values || []).map((cell: string, cIdx: number) => (
                <td key={cIdx} className={`px-4 py-3.5 leading-normal ${row.isHighlight ? 'font-medium text-slate-800' : 'text-slate-500'}`}>
                  {cell === '✓' ? (
                    <span className="text-emerald-600 font-extrabold">✓</span>
                  ) : cell === '✗' ? (
                    <span className="text-rose-500 font-extrabold">✗</span>
                  ) : (
                    parseInlineMarkdown(cell)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),

  authorbox: (data) => (
    <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 border border-slate-100 rounded-3xl p-6 my-6 shadow-sm">
      {data.avatarUrl ? (
        <img src={data.avatarUrl} alt={data.name || 'Author'} className="w-16 h-16 rounded-full object-cover shrink-0 border border-slate-200" />
      ) : (
        <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold shrink-0 text-xl border border-slate-200">
          {data.name ? data.name.charAt(0).toUpperCase() : 'A'}
        </div>
      )}
      <div className="flex-1 space-y-1 text-center sm:text-left">
        <h4 className="font-extrabold text-slate-900 text-base">{data.name || 'Anonymous Author'}</h4>
        <p className="text-slate-600 text-xs sm:text-sm leading-normal">{data.bio || 'Author bio details not configured.'}</p>
        <div className="flex justify-center sm:justify-start gap-3.5 pt-1 text-xs font-semibold">
          {data.twitter && <a href={data.twitter} target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline">Twitter</a>}
          {data.linkedin && <a href={data.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">LinkedIn</a>}
          {data.facebook && <a href={data.facebook} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Facebook</a>}
        </div>
      </div>
    </div>
  ),

  toc: (data, allBlocks) => {
    const headings = (allBlocks || [])
      .filter((b: any) => b.type === 'h2' || b.type === 'h3')
      .map((b: any) => {
        const text = b.data.text || '';
        const id = getHeadingId(text);
        return { text, id, type: b.type };
      });

    if (headings.length === 0) return null;

    return <TableOfContents headings={headings} />;
  },

  schema: (data) => {
    let schemaMarkup: any = null;
    if (data.type === 'faq') {
      const valid = (data.items || []).filter((item: any) => item.question && item.answer);
      if (valid.length > 0) {
        schemaMarkup = {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          'description': 'Frequently Asked Questions',
          'mainEntity': valid.map((item: any) => ({
            '@type': 'Question',
            'name': item.question,
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': item.answer
            }
          }))
        };
      }
    } else if (data.type === 'howto') {
      const valid = (data.items || []).filter((item: any) => item.stepName && item.stepText);
      if (valid.length > 0) {
        schemaMarkup = {
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          'name': data.name || 'Instruction Guide',
          'description': data.description || '',
          'step': valid.map((item: any, idx: number) => ({
            '@type': 'HowToStep',
            'position': idx + 1,
            'name': item.stepName,
            'text': item.stepText
          }))
        };
      }
    } else if (data.type === 'review') {
      schemaMarkup = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': data.productName || 'Product Name',
        'review': {
          '@type': 'Review',
          'author': {
            '@type': 'Person',
            'name': data.authorName || 'Reviewer'
          },
          'reviewRating': {
            '@type': 'Rating',
            'ratingValue': data.rating || 5,
            'bestRating': 5
          },
          'reviewBody': data.summary || ''
        }
      };
    }

    if (!schemaMarkup) return null;

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />
    );
  },
};

// Collapsible FAQ Sub-Component
function FAQAccordion({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-sm hover:border-orange-100/60 transition-colors">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-5 py-4 font-bold text-slate-800 hover:text-orange-500 flex items-center justify-between transition-colors gap-4 text-sm sm:text-base focus:outline-none"
      >
        <span>{parseInlineMarkdown(question)}</span>
        {open ? (
          <ChevronUp className="h-4.5 w-4.5 text-slate-400 shrink-0" />
        ) : (
          <ChevronDown className="h-4.5 w-4.5 text-slate-400 shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3.5 whitespace-pre-wrap animate-in fade-in duration-200">
          {parseInlineMarkdown(answer)}
        </div>
      )}
    </div>
  );
}

// Code Syntax Highlight and copy block
function CodeHighlightBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-2xl overflow-hidden my-6 border border-slate-900 bg-slate-900 text-slate-200">
      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase bg-slate-950 px-4 py-2 select-none border-b border-slate-900">
        <span>{language} code</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-500" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy Code
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto font-mono text-xs sm:text-sm leading-relaxed bg-slate-900/50">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// Active Highlight Table of Contents Component
function TableOfContents({ headings }: { headings: Array<{ text: string; id: string; type: string }> }) {
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
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings]);

  return (
    <div className="border border-slate-200/80 rounded-2xl p-5 my-6 bg-slate-50/50 shadow-sm">
      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-3.5 flex items-center gap-1.5">
        <List className="h-4 w-4 text-orange-500" /> Table of Contents
      </h4>
      <ul className="space-y-2 text-sm text-slate-500 font-semibold pl-2">
        {headings.map((h, i) => {
          const isActive = activeId === h.id;
          return (
            <li key={i} className={h.type === 'h3' ? 'pl-4' : ''}>
              <a
                href={`#${h.id}`}
                className={`transition-colors block py-0.5 leading-snug ${
                  isActive
                    ? 'text-orange-600 font-bold border-l-2 border-orange-500 pl-2 -ml-2.5'
                    : 'hover:text-orange-500'
                }`}
              >
                {parseInlineMarkdown(h.text)}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function getHeadingId(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
