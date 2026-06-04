'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';

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

  // General states
  const [fetchingData, setFetchingData] = useState(isEdit);
  const [saving, setSaving] = useState(false);

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
        const res = await fetch('/api/admin/pages/templates');
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
        const res = await fetch(`/api/admin/pages/${pageId}`);
        if (!res.ok) throw new Error('Failed to load page');

        const page = await res.json();
        setTitle(page.title);
        setSlug(page.slug);
        setContent(page.content);
        setTemplateId(String(page.template_id));
        setStatus(page.status);

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

  if (fetchingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
        <p className="text-slate-500 font-medium">Loading page builder...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Top Action Bar */}
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

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Page Content (Markdown Support)</label>
                <Textarea
                  placeholder="Design page layout structure and text contents using markdown..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[350px] font-mono text-sm leading-relaxed border-slate-200 focus:border-orange-500 focus:ring-orange-500/20"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar Column */}
        <div className="space-y-6">
          {/* Templates Selector Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider">Page Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            <CardHeader>
              <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider">SEO settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
