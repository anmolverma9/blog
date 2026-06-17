'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Loader2,
  Sparkles,
  ArrowLeft,
  Calendar,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Check,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Columns,
  Settings,
  Activity,
  BookOpen,
  Layers,
  Sparkle
} from 'lucide-react';
import VisualBuilder from './visual-builder';
import VisualRenderer from '@/components/public/visual-renderer';

interface PageTemplate {
  id: number;
  name: string;
  file_name: string;
  description: string;
}

interface PageEditorProps {
  pageId?: number;
}

export default function PageEditor({ pageId }: PageEditorProps) {
  const router = useRouter();
  const isEdit = !!pageId;

  // Form states
  const [editorType, setEditorType] = useState<'visual' | 'blog'>('visual');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [templateId, setTemplateId] = useState<string>('');
  const [status, setStatus] = useState('draft');

  // SEO states
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [metaKeywords, setMetaKeywords] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [robotsSettings, setRobotsSettings] = useState('index, follow');
  const [ogTitle, setOgTitle] = useState('');
  const [ogDescription, setOgDescription] = useState('');

  // Dropdown lists
  const [templates, setTemplates] = useState<PageTemplate[]>([]);

  // Workspace View states
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isDistractionFree, setIsDistractionFree] = useState(false);
  const [isSplitScreen, setIsSplitScreen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [activeRightSidebarTab, setActiveRightSidebarTab] = useState<'settings' | 'seo'>('settings');

  // General states
  const [fetchingData, setFetchingData] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [generatingSeo, setGeneratingSeo] = useState(false);

  // Auto-slugify page title
  useEffect(() => {
    if (!isEdit && title) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setSlug(generatedSlug);
    }
  }, [title, isEdit]);

  // Load editor options (Templates)
  useEffect(() => {
    async function loadTemplates() {
      try {
        const res = await fetch((process.env.NEXT_PUBLIC_APP_URL || '') + '/api/admin/pages/templates');
        if (res.ok) {
          const list = await res.json();
          setTemplates(list);
          if (list.length > 0 && !isEdit) {
            setTemplateId(String(list[0].id)); // default to standard template
          }
        }
      } catch (err) {
        console.error('Error loading page templates:', err);
      }
    }
    loadTemplates();
  }, [isEdit]);

  // Load page for editing
  useEffect(() => {
    if (!isEdit) return;

    async function loadPage() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/admin/pages/${pageId}`);
        if (!res.ok) throw new Error('Failed to load page');

        const page = await res.json();
        setTitle(page.title);
        setSlug(page.slug);
        setContent(page.content || '');
        setTemplateId(String(page.template_id));
        setStatus(page.status);
        
        const isVisual = page.content && page.content.startsWith('{') && page.content.includes('"editor_type":"visual"');
        setEditorType(isVisual ? 'visual' : 'blog');

        if (page.seo) {
          setMetaTitle(page.seo.meta_title || '');
          setMetaDescription(page.seo.meta_description || '');
          setMetaKeywords(page.seo.meta_keywords || '');
          setCanonicalUrl(page.seo.canonical_url || '');
          setRobotsSettings(page.seo.robots_settings || 'index, follow');
          setOgTitle(page.seo.og_title || '');
          setOgDescription(page.seo.og_description || '');
        }
      } catch (err) {
        console.error('Error loading page:', err);
        router.push('/admin/pages');
      } finally {
        setFetchingData(false);
      }
    }
    loadPage();
  }, [pageId, isEdit]);

  // AI SEO Generator helper for Pages
  const handleAutoSeo = async () => {
    if (!title) {
      alert('Please fill in the title first.');
      return;
    }
    setGeneratingSeo(true);
    try {
      // Mock page layout compilation or direct prompt parsing
      setMetaTitle(`${title} | Corporate Platform`);
      setMetaDescription(`Learn more about ${title} and explore custom page configurations and layouts on our high-performance SaaS platform.`);
      setOgTitle(`${title} | Corporate Platform`);
      setOgDescription(`Learn more about ${title} and explore custom page configurations and layouts on our high-performance SaaS platform.`);
      if (!canonicalUrl) {
        setCanonicalUrl(`/${slug}`);
      }
    } catch (err) {
      console.error('Failed to generate SEO:', err);
    } finally {
      setGeneratingSeo(false);
    }
  };

  // Submit Handler
  const handleSave = async () => {
    if (!title || !slug || !content || !templateId) {
      alert('Title, slug, content, and template are required.');
      return;
    }

    setSaving(true);
    const payload = {
      title,
      slug,
      content,
      template_id: Number(templateId),
      status,
      seo: {
        meta_title: metaTitle || title,
        meta_description: metaDescription || title,
        meta_keywords: metaKeywords,
        canonical_url: canonicalUrl || `/${slug}`,
        robots_settings: robotsSettings,
        og_title: ogTitle || title,
        og_description: ogDescription || title,
      },
    };

    try {
      const url = isEdit ? `/api/admin/pages/${pageId}` : '/api/admin/pages';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push('/admin/pages');
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save page');
      }
    } catch (err) {
      console.error('Error saving page:', err);
    } finally {
      setSaving(false);
    }
  };

  const renderCanvasContent = () => {
    return (
      <div className="space-y-4">
        {/* Page Title */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Page Title</label>
          <Input
            placeholder="e.g. About Our Mission..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-12 text-xl font-bold border-slate-200 focus:border-orange-500"
          />
        </div>

        {/* Slug line */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">URL Slug Path</label>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-slate-50 text-xs">
            <span className="px-3 flex items-center text-slate-400 border-r border-slate-200">/</span>
            <input
              placeholder="about-us"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="flex-1 bg-white px-3 h-8 focus:outline-none focus:ring-0 border-0"
            />
          </div>
        </div>

        {/* Core Canvas Block Editors */}
        {editorType === 'visual' ? (
          <div className="space-y-1.5 pt-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Visual Canvas</label>
            <VisualBuilder
              initialContent={content && content.startsWith('{') ? content : ''}
              onChange={setContent}
              pageId={pageId || 'new'}
            />
          </div>
        ) : (
          <div className="space-y-1.5 pt-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">Page Content (Markdown Support)</label>
            <Textarea
              placeholder="Design page layout structure and text contents using markdown..."
              value={content && content.startsWith('{') ? '' : content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[450px] font-mono text-sm leading-relaxed border-slate-200 focus:border-orange-500 focus:ring-orange-500/20"
            />
          </div>
        )}
      </div>
    );
  };

  if (fetchingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
        <p className="text-slate-500 font-medium">Loading page builder...</p>
      </div>
    );
  }

  // Fullscreen Workspace Wrapper
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col h-screen w-screen overflow-hidden font-sans text-slate-800 animate-in fade-in duration-300">
        {/* Fullscreen Header */}
        <div className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 animate-in slide-in-from-top-1">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
              title="Exit Fullscreen"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
            <div className="h-4 w-px bg-slate-200" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 truncate max-w-xs">{title || 'Untitled Page'}</h2>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                {status} {saving ? '• Saving...' : '• Autosaved'}
              </span>
            </div>
          </div>

          {/* Mode Toggles */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => { setIsFocusMode(!isFocusMode); if (!isFocusMode) setIsSplitScreen(false); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${isFocusMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              title="Focus Mode"
            >
              <Activity className="h-3.5 w-3.5" />
              Focus
            </button>
            <button
              type="button"
              onClick={() => { setIsDistractionFree(!isDistractionFree); if (!isDistractionFree) setIsFocusMode(false); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${isDistractionFree ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              title="Distraction Free Mode"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Quiet
            </button>
            <button
              type="button"
              onClick={() => { setIsSplitScreen(!isSplitScreen); if (!isSplitScreen) setIsFocusMode(false); setIsPreviewMode(false); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${isSplitScreen ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              title="Split Preview Mode"
            >
              <Columns className="h-3.5 w-3.5" />
              Split
            </button>
            <button
              type="button"
              onClick={() => { setIsPreviewMode(!isPreviewMode); if (!isPreviewMode) setIsSplitScreen(false); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${isPreviewMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              title="Live Preview Mode"
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-9 text-xs border-slate-200 text-slate-700" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              Save Draft
            </Button>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white h-9 text-xs shadow-sm" onClick={() => { setStatus('published'); handleSave(); }} disabled={saving}>
              Publish
            </Button>
          </div>
        </div>

        {/* Main Split Panel Workspace */}
        <div className="flex-1 flex overflow-hidden bg-slate-50">
          
          {/* 1. Left Sidebar elements (Visual builder quick notes/helpers if visible) */}
          {!isFocusMode && !isDistractionFree && editorType === 'visual' && (
            <div className="w-80 bg-slate-950 border-r border-slate-800 flex flex-col overflow-hidden text-slate-100 shrink-0 select-none">
              <div className="p-4 border-b border-slate-800 font-bold text-xs uppercase tracking-wider text-slate-400">
                Visual Builder Guide
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-slate-400">
                <p className="leading-relaxed">
                  You are editing this static page layout inside the visual designer workspace.
                </p>
                <div className="h-px bg-slate-800" />
                <p>• Sections represent blocks of page contents.</p>
                <p>• Columns split horizontal scopes.</p>
                <p>• Double click on Headings or Paragraphs to edit text directly inline in the canvas!</p>
              </div>
            </div>
          )}

          {/* 2. Center Writing / Building Canvas */}
          <div className="flex-1 flex flex-col overflow-y-auto p-6 items-center">
            {isPreviewMode ? (
              // Live Full Public View Simulation
              <div className="w-full max-w-5xl bg-white border border-slate-200/80 shadow-md rounded-2xl p-8 min-h-[80vh] overflow-y-auto prose prose-slate">
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">{title || 'Untitled Page'}</h1>
                <div className="h-px bg-slate-200 my-6" />
                {editorType === 'visual' ? (
                  <VisualRenderer data={JSON.parse(content || '{"sections":[]}')} />
                ) : (
                  <div className="whitespace-pre-wrap">{content}</div>
                )}
              </div>
            ) : isSplitScreen ? (
              // Split Screen Mode: Left Editor Panel, Right Preview Panel
              <div className="w-full h-full flex gap-4 overflow-hidden">
                <div className="flex-1 overflow-y-auto bg-white border rounded-2xl p-6 shadow-sm">
                  {renderCanvasContent()}
                </div>
                <div className="flex-1 overflow-y-auto bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm prose prose-slate">
                  <h1 className="text-2xl font-bold text-slate-900">{title || 'Untitled Page'}</h1>
                  <hr className="my-4" />
                  {editorType === 'visual' ? (
                    <VisualRenderer data={JSON.parse(content || '{"sections":[]}')} />
                  ) : (
                    <div className="whitespace-pre-wrap">{content}</div>
                  )}
                </div>
              </div>
            ) : (
              // Regular Focus/Canvas Editor
              <div className={`w-full bg-white border border-slate-200/80 shadow-sm rounded-3xl p-6 md:p-8 min-h-[85vh] ${editorType === 'blog' ? 'max-w-4xl' : 'max-w-full'}`}>
                {renderCanvasContent()}
              </div>
            )}
          </div>

          {/* 3. Right Publish & Settings & SEO Panel Sidebar (only if not focus/quiet modes) */}
          {!isFocusMode && !isDistractionFree && (
            <div className="w-80 bg-white border-l border-slate-200 flex flex-col overflow-hidden shrink-0 select-none">
              {/* Tab headers */}
              <div className="flex border-b border-slate-200 text-xs font-bold shrink-0">
                <button
                  onClick={() => setActiveRightSidebarTab('settings')}
                  className={`flex-1 text-center py-3 border-b-2 transition-colors ${activeRightSidebarTab === 'settings' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                  Page Specs
                </button>
                <button
                  onClick={() => setActiveRightSidebarTab('seo')}
                  className={`flex-1 text-center py-3 border-b-2 transition-colors ${activeRightSidebarTab === 'seo' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                  SEO Metadata
                </button>
              </div>

              {/* Tab content panel */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                {activeRightSidebarTab === 'settings' && (
                  <>
                    {/* Templates Selector */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Choose Template Mapping</label>
                      <select
                        value={templateId}
                        onChange={(e) => setTemplateId(e.target.value)}
                        className="w-full h-9 px-2 rounded-lg border border-slate-200 bg-white"
                      >
                        {templates.map((t) => (
                          <option key={t.id} value={t.id}>{t.name} ({t.file_name})</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400 leading-normal mt-1">
                        {templates.find((t) => String(t.id) === templateId)?.description || ''}
                      </p>
                    </div>

                    {/* Publishing Status */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full h-9 px-2 rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    </div>
                  </>
                )}

                {activeRightSidebarTab === 'seo' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">SEO Config</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleAutoSeo}
                        className="text-orange-500 hover:text-orange-600 font-bold p-0 h-auto gap-0.5 hover:bg-transparent"
                      >
                        <Sparkles className="h-3 w-3" /> Auto Fill
                      </Button>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Meta Title</label>
                      <Input
                        placeholder="Meta title..."
                        value={metaTitle}
                        onChange={(e) => setMetaTitle(e.target.value)}
                        className="h-8 text-xs border-slate-200"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Meta Description</label>
                      <Textarea
                        placeholder="Meta description (max 160)..."
                        value={metaDescription}
                        onChange={(e) => setMetaDescription(e.target.value)}
                        className="h-14 text-xs border-slate-200"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Keywords</label>
                      <Input
                        placeholder="e.g. products, layout..."
                        value={metaKeywords}
                        onChange={(e) => setMetaKeywords(e.target.value)}
                        className="h-8 text-xs border-slate-200"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback Regular Workspace View if fullscreen = false
  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300 animate-in fade-in duration-300">
      {/* Top Banner to enter Fullscreen */}
      <div className="bg-orange-500 text-white rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md shadow-orange-500/10">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-white shrink-0 animate-pulse" />
          <div>
            <h4 className="font-bold text-sm">Experience Fullscreen Page Workspace</h4>
            <p className="text-xs text-orange-100">Maximize your design output with Live Split-Screen Previews, focus canvas modes, and advanced SEO tools.</p>
          </div>
        </div>
        <Button onClick={() => setIsFullscreen(true)} className="bg-white hover:bg-slate-100 text-orange-600 font-bold px-4 py-2 text-xs shadow rounded-xl">
          Enter Fullscreen Mode
        </Button>
      </div>

      {/* Top action bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-9 w-9 text-slate-500">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {isEdit ? 'Edit Page' : 'Scaffold Static Page'}
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">Scaffold website dynamic pages mapped to templates</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-slate-200 text-slate-700 h-10" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            Save Draft
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white h-10 shadow-md shadow-orange-500/10" onClick={() => { setStatus('published'); handleSave(); }} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            Publish Page
          </Button>
        </div>
      </div>

      {/* Editor Type Selector Toggle */}
      <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
        <span className="text-xs font-bold text-slate-600 font-sans">Select Page Editor Mode:</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditorType('visual')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${editorType === 'visual' ? 'bg-orange-500 text-white shadow' : 'bg-white border text-slate-600 hover:bg-slate-100'}`}
          >
            Visual Page Builder (Elementor style)
          </button>
          <button
            type="button"
            onClick={() => setEditorType('blog')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${editorType === 'blog' ? 'bg-orange-500 text-white shadow' : 'bg-white border text-slate-600 hover:bg-slate-100'}`}
          >
            Advanced Blog Editor (Markdown / Standard)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Page Title</label>
                <Input
                  placeholder="e.g. About Our Platform"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-11 text-base font-medium border-slate-200 focus:border-orange-500 focus:ring-orange-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">URL Path (Slug)</label>
                <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                  <span className="px-3 flex items-center text-xs text-slate-400 border-r border-slate-200">/</span>
                  <input
                    placeholder="about-us"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="flex-1 bg-white px-3 text-sm focus:outline-none focus:ring-0 border-0"
                  />
                </div>
              </div>

              {editorType === 'visual' ? (
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Visual Builder Layout Canvas</label>
                  <VisualBuilder
                    initialContent={content && content.startsWith('{') ? content : ''}
                    onChange={setContent}
                    pageId={pageId || 'new'}
                  />
                </div>
              ) : (
                <div className="space-y-1 pt-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Page Content (Markdown Support)</label>
                  <Textarea
                    placeholder="Design page layout structure and text contents using markdown..."
                    value={content && content.startsWith('{') ? '' : content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[350px] font-mono text-sm leading-relaxed border-slate-200 focus:border-orange-500 focus:ring-orange-500/20"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar Column */}
        <div className="space-y-6">
          {/* Templates Selector Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Choose Template Mapping</label>
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.file_name})</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 leading-normal mt-1.5">
                  {templates.find((t) => String(t.id) === templateId)?.description || ''}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Publish State</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Page SEO override Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="space-y-3 pt-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Meta Title</label>
                <Input
                  placeholder="Meta title..."
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="h-9 text-xs border-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Meta Description</label>
                <Textarea
                  placeholder="Meta description..."
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className="h-16 text-xs border-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Keywords</label>
                <Input
                  placeholder="Comma separated keys..."
                  value={metaKeywords}
                  onChange={(e) => setMetaKeywords(e.target.value)}
                  className="h-9 text-xs border-slate-200"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
