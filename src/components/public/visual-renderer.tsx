'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, ChevronDown, ChevronUp, Search, MessageSquare, Play, Mail, Phone, Globe } from 'lucide-react';
import MotionWrapper from './motion-wrapper';

interface Widget {
  id: string;
  type: string;
  data: Record<string, any>;
  settings: Record<string, any>;
}

interface Column {
  id: string;
  width: string;
  widgets: Widget[];
  settings: Record<string, any>;
}

interface Section {
  id: string;
  type: string;
  columns: Column[];
  settings: Record<string, any>;
}

interface VisualRendererProps {
  data: {
    editor_type: string;
    sections: Section[];
  };
}

export default function VisualRenderer({ data }: VisualRendererProps) {
  if (!data || !Array.isArray(data.sections)) return null;

  return (
    <div className="w-full overflow-x-hidden">
      {data.sections.map((section) => {
        // Enforce animations if specified
        const animation = section.settings.animationName || 'none';
        
        const content = (
          <div
            key={section.id}
            style={getSectionStyles(section.settings)}
            className={getSectionClasses(section.settings)}
          >
            <div className="max-w-[1440px] mx-auto px-4 grid grid-cols-1 md:grid-flow-col gap-8 items-start">
              {section.columns.map((column) => (
                <div
                  key={column.id}
                  style={getColumnStyles(column.settings)}
                  className={getColumnClasses(column, column.settings)}
                >
                  <div className="space-y-5">
                    {column.widgets.map((widget) => {
                      const widgetAnim = widget.settings.animationName || 'none';
                      const widgetMarkup = (
                        <div
                          key={widget.id}
                          style={getWidgetStyles(widget.settings)}
                          className={getWidgetClasses(widget.settings)}
                        >
                          {renderPublicWidget(widget)}
                        </div>
                      );

                      if (widgetAnim !== 'none') {
                        return (
                          <MotionWrapper
                            key={widget.id}
                            direction={widgetAnim === 'slide-up' ? 'up' : widgetAnim === 'slide-down' ? 'down' : 'fade'}
                            duration={0.5}
                          >
                            {widgetMarkup}
                          </MotionWrapper>
                        );
                      }

                      return widgetMarkup;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

        if (animation !== 'none') {
          return (
            <MotionWrapper
              key={section.id}
              direction={animation === 'slide-up' ? 'up' : animation === 'slide-down' ? 'down' : 'fade'}
              duration={0.6}
            >
              {content}
            </MotionWrapper>
          );
        }

        return content;
      })}
    </div>
  );
}

// Styling utilities for Sections
function getSectionStyles(settings: any): React.CSSProperties {
  const styles: React.CSSProperties = {};
  if (settings.backgroundType === 'gradient' && settings.backgroundGradient) {
    styles.backgroundImage = settings.backgroundGradient;
  } else if (settings.backgroundColor) {
    styles.backgroundColor = settings.backgroundColor;
  }
  return styles;
}

function getSectionClasses(settings: any): string {
  const classes = ['w-full transition-all duration-350'];
  classes.push(settings.paddingTop || 'py-12');
  classes.push(settings.paddingBottom || 'py-12');
  classes.push(settings.paddingLeft || 'px-4');
  if (settings.borderRadius) classes.push(settings.borderRadius);
  if (settings.boxShadow) classes.push(settings.boxShadow);
  if (settings.glassmorphism) {
    classes.push('backdrop-blur-lg bg-white/10 border-y border-white/20');
  }
  if (settings.customClasses) {
    classes.push(settings.customClasses);
  }

  // Responsive hiding
  if (settings.responsiveShowDesktop === false) classes.push('lg:hidden');
  if (settings.responsiveShowTablet === false) classes.push('md:max-lg:hidden');
  if (settings.responsiveShowMobile === false) classes.push('max-md:hidden');

  return classes.filter(Boolean).join(' ');
}

// Styling utilities for Columns
function getColumnStyles(settings: any): React.CSSProperties {
  return {};
}

function getColumnClasses(column: Column, settings: any): string {
  const widthMap: Record<string, string> = {
    'w-full': 'col-span-12 w-full',
    'w-1/2': 'md:col-span-6 w-full',
    'w-1/3': 'md:col-span-4 w-full',
    'w-2/3': 'md:col-span-8 w-full',
    'w-1/4': 'md:col-span-3 w-full',
  };
  const classes = [widthMap[column.width] || 'col-span-12'];
  if (settings.paddingTop) classes.push(settings.paddingTop);
  if (settings.paddingBottom) classes.push(settings.paddingBottom);
  if (settings.paddingLeft) classes.push(settings.paddingLeft);
  if (settings.glassmorphism) {
    classes.push('backdrop-blur-md bg-white/20 border border-white/20 rounded-2xl p-4');
  }
  if (settings.customClasses) {
    classes.push(settings.customClasses);
  }
  return classes.filter(Boolean).join(' ');
}

// Styling utilities for Widgets
function getWidgetStyles(settings: any): React.CSSProperties {
  const styles: React.CSSProperties = {};
  if (settings.colorHex) {
    styles.color = settings.colorHex;
  } else if (settings.color && settings.color.startsWith('#')) {
    styles.color = settings.color;
  }
  return styles;
}

function getWidgetClasses(settings: any): string {
  const classes = ['w-full transition-all'];
  classes.push(settings.marginBottom || 'mb-4');
  if (settings.paddingLeft) classes.push(settings.paddingLeft);
  if (settings.fontSize) classes.push(settings.fontSize);
  if (settings.fontWeight) classes.push(settings.fontWeight);
  if (settings.glassmorphism) {
    classes.push('backdrop-blur-sm bg-white/10 border border-white/10 p-3.5 rounded-xl');
  }
  if (settings.customClasses) {
    classes.push(settings.customClasses);
  }
  return classes.filter(Boolean).join(' ');
}

// Render dynamic widget on public page view
function renderPublicWidget(widget: Widget) {
  const data = widget.data;
  const settings = widget.settings;
  const alignClass = settings.align === 'center' ? 'text-center' : settings.align === 'right' ? 'text-right' : 'text-left';

  switch (widget.type) {
    case 'heading': {
      const Tag = (data.tag || 'h2') as any;
      const fontStyle = settings.fontSize || 'text-2xl font-bold';
      const weightStyle = settings.fontWeight || 'font-bold';
      const colorStyle = settings.colorHex ? '' : (settings.color || 'text-slate-900');
      return (
        <Tag
          style={settings.colorHex ? { color: settings.colorHex } : undefined}
          className={`${fontStyle} ${weightStyle} ${colorStyle} ${alignClass} tracking-tight leading-tight`}
        >
          {data.text}
        </Tag>
      );
    }

    case 'text': {
      const fontStyle = settings.fontSize || 'text-sm sm:text-base';
      const weightStyle = settings.fontWeight || 'font-normal';
      const colorStyle = settings.colorHex ? '' : (settings.color || 'text-slate-600');
      return (
        <p
          style={settings.colorHex ? { color: settings.colorHex } : undefined}
          className={`leading-relaxed ${fontStyle} ${weightStyle} ${colorStyle} ${alignClass} whitespace-pre-wrap`}
        >
          {data.text}
        </p>
      );
    }

    case 'button': {
      const btnStyle = data.style === 'secondary'
        ? 'border-2 border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
        : data.style === 'dark'
        ? 'bg-slate-950 text-white hover:bg-slate-850'
        : 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20';

      return (
        <div className={alignClass}>
          <a
            href={data.url || '#'}
            className={`inline-flex items-center justify-center font-bold px-6 py-2.5 rounded-xl text-sm transition-all duration-200 cursor-pointer ${btnStyle}`}
          >
            {data.text || 'Submit'}
          </a>
        </div>
      );
    }

    case 'image':
      if (!data.url) return null;
      return (
        <figure className={`flex flex-col items-center ${alignClass} my-2`}>
          <div className="rounded-3xl overflow-hidden border border-slate-100 shadow-md bg-slate-50 max-h-[500px]">
            <img src={data.url} alt={data.alt || 'Page visual asset'} className="max-w-full max-h-full object-contain" />
          </div>
          {data.caption && <figcaption className="text-xs text-slate-400 italic mt-2 font-medium">{data.caption}</figcaption>}
        </figure>
      );

    case 'video': {
      if (!data.url) return null;
      const getEmbed = (url: string) => {
        const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/i);
        if (yt && yt[1]) return `https://www.youtube.com/embed/${yt[1]}`;
        const vimeo = url.match(/vimeo\.com\/([0-9]+)/i);
        if (vimeo && vimeo[1]) return `https://player.vimeo.com/video/${vimeo[1]}`;
        return url;
      };

      return (
        <div className="aspect-video w-full rounded-3xl overflow-hidden shadow-xl border border-slate-100 bg-black my-4">
          <iframe
            src={getEmbed(data.url)}
            title="Visual Embed Video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      );
    }

    case 'icon':
      return (
        <div className={`flex ${alignClass === 'text-center' ? 'justify-center' : alignClass === 'text-right' ? 'justify-end' : 'justify-start'} py-2`}>
          <div className={`h-11 w-11 rounded-2xl bg-orange-50 border border-orange-100/50 flex items-center justify-center ${settings.color || 'text-orange-500'}`}>
            <Globe className="h-5 w-5" />
          </div>
        </div>
      );

    case 'list':
      return (
        <ul className="space-y-2.5 text-sm sm:text-base text-slate-600 list-disc pl-5">
          {(data.items || []).map((li: string, idx: number) => (
            <li key={idx} className="leading-relaxed">{li}</li>
          ))}
        </ul>
      );

    case 'divider':
      return <hr className="my-6 border-t border-slate-200/80" />;

    case 'spacer':
      return <div className={settings.height || 'h-8'} />;

    case 'rating':
      return (
        <div className={`flex items-center gap-0.5 ${alignClass === 'text-center' ? 'justify-center' : alignClass === 'text-right' ? 'justify-end' : 'justify-start'}`}>
          {Array.from({ length: data.max || 5 }).map((_, i) => (
            <Star key={i} className={`h-4.5 w-4.5 ${i < (data.rating || 5) ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`} />
          ))}
        </div>
      );

    case 'faq':
    case 'accordion':
      return (
        <div className="space-y-3">
          {(data.items || []).map((item: any, idx: number) => (
            <PublicAccordionItem key={idx} question={item.question} answer={item.answer} />
          ))}
        </div>
      );

    case 'tabs':
      return <PublicTabsWidget tabs={data.tabs || []} />;

    case 'pricing_table':
      return <PublicPricingTable tiers={data.tiers || []} />;

    case 'blog_posts':
      return <PublicBlogGrid count={data.count || 3} />;

    case 'contact_form':
      return <PublicContactForm />;

    case 'comments':
      return null;

    case 'custom_html':
      return <div dangerouslySetInnerHTML={{ __html: data.code || '' }} />;

    default:
      return null;
  }
}

// Collapsible FAQ Accordion for public page
function PublicAccordionItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-sm hover:border-orange-100/60 transition-colors duration-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-5 py-4 font-bold text-slate-800 hover:text-orange-500 flex items-center justify-between transition-colors gap-4 text-sm sm:text-base focus:outline-none"
      >
        <span>{question}</span>
        {open ? <ChevronUp className="h-4.5 w-4.5 text-slate-400 shrink-0" /> : <ChevronDown className="h-4.5 w-4.5 text-slate-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-4 text-xs sm:text-sm text-slate-500 leading-relaxed border-t border-slate-50 pt-3 whitespace-pre-wrap animate-in fade-in duration-200">
          {answer}
        </div>
      )}
    </div>
  );
}

// Interactive Tabs Sub-component for public view
function PublicTabsWidget({ tabs }: { tabs: Array<{ title: string; content: string }> }) {
  const [activeIdx, setActiveIdx] = useState(0);
  if (tabs.length === 0) return null;
  return (
    <div className="space-y-4 my-4">
      <div className="flex border-b border-slate-100 overflow-x-auto gap-2">
        {tabs.map((tab, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIdx(idx)}
            className={`px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition-all ${activeIdx === idx ? 'border-orange-500 text-orange-500' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            {tab.title}
          </button>
        ))}
      </div>
      <div className="text-xs sm:text-sm text-slate-600 leading-relaxed p-4 bg-slate-50/50 rounded-2xl border border-slate-100 whitespace-pre-wrap animate-in fade-in duration-150">
        {tabs[activeIdx]?.content}
      </div>
    </div>
  );
}

// Pricing Tiers Sub-component
function PublicPricingTable({ tiers }: { tiers: Array<{ name: string; price: string; features: string[]; link?: string }> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
      {tiers.map((tier, idx) => (
        <div key={idx} className="border border-slate-200 rounded-3xl p-6 bg-white shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="space-y-4">
            <h4 className="text-base font-bold text-slate-800 uppercase tracking-wider">{tier.name}</h4>
            <p className="text-3xl font-extrabold text-slate-900">{tier.price}</p>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-500">
              {tier.features.map((f, i) => <li key={i} className="flex items-center gap-1.5"><span className="text-orange-500">✓</span> {f}</li>)}
            </ul>
          </div>
          <a href={tier.link || '#'} className="w-full bg-slate-900 text-white font-bold text-center py-2.5 rounded-xl text-xs sm:text-sm mt-6 hover:bg-slate-850 inline-block transition-colors">
            Get Started
          </a>
        </div>
      ))}
    </div>
  );
}

// Contact Form Sub-component
function PublicContactForm() {
  return (
    <form className="bg-slate-50/70 border border-slate-100 p-6 rounded-3xl space-y-4 my-4" onSubmit={e => e.preventDefault()}>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">First Name</label>
          <input type="text" className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs sm:text-sm bg-white" placeholder="First Name" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
          <input type="email" className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs sm:text-sm bg-white" placeholder="you@domain.com" />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase">Your Message</label>
        <textarea className="w-full h-24 rounded-lg border border-slate-200 p-3 text-xs sm:text-sm bg-white" placeholder="Brief details about your request..." />
      </div>
      <button className="bg-orange-500 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl hover:bg-orange-600 transition-colors shadow-md shadow-orange-500/10">
        Send Message
      </button>
    </form>
  );
}

// Blog Grid Sub-component mapping
function PublicBlogGrid({ count }: { count: number }) {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    async function loadRecent() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/admin/posts?limit=${count}`);
        if (res.ok) {
          const data = await res.json();
          setPosts(data.posts || []);
        }
      } catch (e) {
        console.error('Failed to load blog post preview widget', e);
      }
    }
    loadRecent();
  }, [count]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
      {posts.length === 0 ? (
        Array.from({ length: count }).map((_, i) => (
          <div key={i} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 h-44 animate-pulse" />
        ))
      ) : (
        posts.map((post) => (
          <div key={post.id} className="border border-slate-200/80 rounded-2xl overflow-hidden p-4 bg-white shadow-sm flex flex-col justify-between h-52 hover:shadow-md transition-shadow">
            <div>
              <span className="text-[9px] font-bold text-orange-500 uppercase">{post.category_name || 'Technology'}</span>
              <h5 className="font-bold text-slate-900 text-sm mt-1 line-clamp-2 leading-snug">{post.title}</h5>
              <p className="text-slate-500 text-[11px] mt-1.5 line-clamp-3">{post.summary || post.content}</p>
            </div>
            <Link href={`/${post.slug}`} className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-0.5 mt-2">
              Read Article →
            </Link>
          </div>
        ))
      )}
    </div>
  );
}

// Comments Preview
function PublicCommentsPreview() {
  return (
    <div className="border border-slate-100 bg-white p-5 rounded-2xl space-y-3.5 my-4 shadow-sm">
      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5"><MessageSquare className="h-4 w-4 text-orange-500" /> Readers comments</h4>
      <div className="p-3 bg-slate-50 rounded-xl">
        <p className="text-[11px] font-bold text-slate-800">Sarah Connor</p>
        <p className="text-slate-500 text-xs mt-0.5">This platform has visual page features far exceeding standard WordPress Gutenberg layouts.</p>
      </div>
      <div className="p-3 bg-slate-50 rounded-xl">
        <p className="text-[11px] font-bold text-slate-800">John Miller</p>
        <p className="text-slate-500 text-xs mt-0.5">Custom styling gradient selections render page speeds with absolute zero shift.</p>
      </div>
    </div>
  );
}
