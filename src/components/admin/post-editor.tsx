'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Loader2,
  Sparkles,
  Link as LinkIcon,
  Image as ImageIcon,
  ArrowLeft,
  Calendar,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

interface Category {
  id: number;
  name: string;
}

interface Tag {
  id: number;
  name: string;
}

interface MediaItem {
  id: number;
  filename: string;
  file_path: string;
}

interface LinkSuggestion {
  keyword: string;
  targetPostId: number;
  targetTitle: string;
  targetSlug: string;
  suggestionText: string;
}

interface PostEditorProps {
  postId?: number;
}

export default function PostEditor({ postId }: PostEditorProps) {
  const router = useRouter();
  const isEdit = !!postId;

  // Form states
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [status, setStatus] = useState('draft');
  const [publishedAt, setPublishedAt] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [featuredImageId, setFeaturedImageId] = useState<number | null>(null);
  const [featuredImagePath, setFeaturedImagePath] = useState<string | null>(null);

  // SEO states
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [metaKeywords, setMetaKeywords] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [robotsSettings, setRobotsSettings] = useState('index, follow');
  const [ogTitle, setOgTitle] = useState('');
  const [ogDescription, setOgDescription] = useState('');

  // Dropdown lists
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([]);

  // Engine suggestions
  const [linkingSuggestions, setLinkingSuggestions] = useState<LinkSuggestion[]>([]);
  const [analyzingLinks, setAnalyzingLinks] = useState(false);
  const [generatingSeo, setGeneratingSeo] = useState(false);

  // General states
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Auto-slugify title
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

  // Load editor options (Categories, Tags, Media)
  useEffect(() => {
    async function loadOptions() {
      try {
        const [catsRes, tagsRes, mediaRes] = await Promise.all([
          fetch('/api/admin/categories'),
          fetch('/api/admin/tags'),
          fetch('/api/admin/media'),
        ]);

        if (catsRes.ok) setCategories(await catsRes.json());
        if (tagsRes.ok) setTags(await tagsRes.json());
        if (mediaRes.ok) setMediaLibrary(await mediaRes.json());
      } catch (err) {
        console.error('Error loading editor options:', err);
      }
    }
    loadOptions();
  }, []);

  // Load post for editing
  useEffect(() => {
    if (!isEdit) return;

    async function loadPost() {
      try {
        const res = await fetch(`/api/admin/posts/${postId}`);
        if (!res.ok) throw new Error('Failed to load post');

        const post = await res.json();
        setTitle(post.title);
        setSlug(post.slug);
        setContent(post.content);
        setSummary(post.summary || '');
        setStatus(post.status);
        if (post.published_at) {
          // Format ISO timestamp to datetime-local string format
          setPublishedAt(new Date(post.published_at).toISOString().slice(0, 16));
        }
        setCategoryId(post.category_id ? String(post.category_id) : '');
        setSelectedTags((post.tags || []).map((t: Tag) => t.id));
        setFeaturedImageId(post.featured_image_id);
        setFeaturedImagePath(post.featured_image_path);

        if (post.seo) {
          setMetaTitle(post.seo.meta_title || '');
          setMetaDescription(post.seo.meta_description || '');
          setMetaKeywords(post.seo.meta_keywords || '');
          setCanonicalUrl(post.seo.canonical_url || '');
          setRobotsSettings(post.seo.robots_settings || 'index, follow');
          setOgTitle(post.seo.og_title || '');
          setOgDescription(post.seo.og_description || '');
        }
      } catch (err) {
        console.error('Error loading post:', err);
        router.push('/admin/posts');
      } finally {
        setFetchingData(false);
      }
    }
    loadPost();
  }, [postId, isEdit]);

  // Run SEO generator helper
  const handleAutoSeo = async () => {
    if (!title) {
      alert('Please fill in the title first.');
      return;
    }
    setGeneratingSeo(true);
    try {
      const res = await fetch('/api/seo/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, summary }),
      });

      if (res.ok) {
        const data = await res.json();
        setMetaTitle(data.metaTitle);
        setMetaDescription(data.metaDescription);
        setOgTitle(data.ogTitle);
        setOgDescription(data.ogDescription);
        if (!canonicalUrl) {
          setCanonicalUrl(`/posts/${slug}`);
        }
      }
    } catch (err) {
      console.error('Failed to generate SEO:', err);
    } finally {
      setGeneratingSeo(false);
    }
  };

  // Run Internal Linking Analysis
  const handleAnalyzeLinking = async () => {
    if (!content) {
      alert('Please write some content first.');
      return;
    }
    setAnalyzingLinks(true);
    try {
      const res = await fetch('/api/admin/posts/analyze-linking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, content }),
      });

      if (res.ok) {
        const data = await res.json();
        setLinkingSuggestions(data);
      }
    } catch (err) {
      console.error('Failed to analyze linking:', err);
    } finally {
      setAnalyzingLinks(false);
    }
  };

  // Upload file inside media selector
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/media', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setMediaLibrary(prev => [data.media, ...prev]);
        setFeaturedImageId(data.media.id);
        setFeaturedImagePath(data.media.file_path);
        setMediaModalOpen(false);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleTagToggle = (tagId: number) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  // Submit Handler
  const handleSave = async () => {
    if (!title || !slug || !content) {
      alert('Title, slug, and content are required.');
      return;
    }

    setSaving(true);
    const payload = {
      title,
      slug,
      content,
      summary,
      status,
      published_at: publishedAt ? new Date(publishedAt).toISOString().slice(0, 19).replace('T', ' ') : null,
      category_id: categoryId ? Number(categoryId) : null,
      featured_image_id: featuredImageId,
      tagIds: selectedTags,
      seo: {
        meta_title: metaTitle,
        meta_description: metaDescription,
        meta_keywords: metaKeywords,
        canonical_url: canonicalUrl,
        robots_settings: robotsSettings,
        og_title: ogTitle,
        og_description: ogDescription,
      },
    };

    try {
      const url = isEdit ? `/api/admin/posts/${postId}` : '/api/admin/posts';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push('/admin/posts');
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save post');
      }
    } catch (err) {
      console.error('Error saving post:', err);
    } finally {
      setSaving(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
        <p className="text-slate-500 font-medium">Loading post builder...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Top action bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-9 w-9 text-slate-500">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {isEdit ? 'Edit Article' : 'Write New Article'}
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">Scaffold SaaS long-form content optimized for SEO</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-slate-200 text-slate-700 h-10" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            Save Draft
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white h-10 shadow-md shadow-orange-500/10" onClick={() => { setStatus('published'); handleSave(); }} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            Publish Post
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left main columns */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Article Title</label>
                <Input
                  placeholder="Enter a catchy title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-11 text-base font-medium border-slate-200 focus:border-orange-500 focus:ring-orange-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">URL Slug</label>
                <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                  <span className="px-3 flex items-center text-xs text-slate-400 border-r border-slate-200">/posts/</span>
                  <input
                    placeholder="post-slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="flex-1 bg-white px-3 text-sm focus:outline-none focus:ring-0 border-0"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Content Body (Markdown Supported)</label>
                </div>
                <Textarea
                  placeholder="Write something amazing. Support markdown formatting..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[400px] font-mono text-sm leading-relaxed border-slate-200 focus:border-orange-500 focus:ring-orange-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Summary / Excerpt</label>
                <Textarea
                  placeholder="Brief summary displayed in post listings..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="h-20 text-sm border-slate-200 focus:border-orange-500 focus:ring-orange-500/20"
                />
              </div>
            </CardContent>
          </Card>

          {/* Internal Linking Engine box */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-orange-500" />
                  Link Whisperer (Internal Linking Engine)
                </CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">Scans post content to find high-impact internal linking opportunities</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-orange-200 text-orange-600 hover:bg-orange-50 text-xs font-bold h-8"
                onClick={handleAnalyzeLinking}
                disabled={analyzingLinks}
              >
                {analyzingLinks ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                Analyze Links
              </Button>
            </CardHeader>
            <CardContent>
              {linkingSuggestions.length === 0 ? (
                <div className="text-slate-400 text-xs text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Click 'Analyze Links' to search for internal link suggestions based on current content body text.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {linkingSuggestions.map((sug, idx) => (
                    <div key={idx} className="bg-orange-50/50 border border-orange-100 p-3 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                      <div className="text-slate-700 leading-normal">
                        <strong>Keyword Match:</strong> <span className="underline decoration-orange-400 font-semibold">{sug.keyword}</span>
                        <p className="text-slate-500 mt-1">{sug.suggestionText}</p>
                      </div>
                      <div className="text-slate-500 font-semibold shrink-0">
                        Target Link: <code className="bg-white border px-1.5 py-0.5 rounded text-orange-600">/posts/{sug.targetSlug}</code>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar column */}
        <div className="space-y-6">
          {/* Post settings Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider">Publish Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published</option>
                </select>
              </div>

              {status === 'scheduled' && (
                <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-150">
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    Scheduled Date
                  </label>
                  <Input
                    type="datetime-local"
                    value={publishedAt}
                    onChange={(e) => setPublishedAt(e.target.value)}
                    className="h-10 border-slate-200"
                  />
                </div>
              )}

              <div className="h-px bg-slate-100" />

              <div className="text-xs text-slate-400 space-y-1 font-medium">
                <p>• Saved drafts are only visible inside CMS</p>
                <p>• Scheduled posts auto-publish on set date</p>
              </div>
            </CardContent>
          </Card>

          {/* Category & Tags Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider">Taxonomy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Tags</label>
                <div className="flex flex-wrap gap-1.5 border border-slate-200 p-2.5 rounded-lg max-h-32 overflow-y-auto">
                  {tags.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">No tags configured</span>
                  ) : (
                    tags.map((t) => {
                      const selected = selectedTags.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleTagToggle(t.id)}
                          className={`px-2 py-0.5 rounded text-xs font-medium border transition-colors ${
                            selected
                              ? 'bg-orange-500 border-orange-500 text-white'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {t.name}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Featured Image Selector Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider">Featured Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {featuredImagePath ? (
                <div className="relative group border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                  <img src={featuredImagePath} alt="Featured cover" className="w-full h-40 object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Button variant="secondary" size="sm" onClick={() => setMediaModalOpen(true)}>
                      Replace Image
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setMediaModalOpen(true)}
                  className="w-full h-32 border-2 border-dashed border-slate-200 hover:border-orange-400 rounded-lg flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <ImageIcon className="h-6 w-6" />
                  <span className="text-xs font-semibold">Select Featured Image</span>
                </button>
              )}
            </CardContent>
          </Card>

          {/* Built-in SEO Override Engine Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider">SEO Engine</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-orange-500 hover:text-orange-600 text-xs font-bold gap-1 p-0 h-auto hover:bg-transparent"
                onClick={handleAutoSeo}
                disabled={generatingSeo}
              >
                {generatingSeo ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                Generate
              </Button>
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
                  placeholder="Meta description (max 160 chars)..."
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className="h-16 text-xs border-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">OG Title</label>
                <Input
                  placeholder="Open Graph title..."
                  value={ogTitle}
                  onChange={(e) => setOgTitle(e.target.value)}
                  className="h-9 text-xs border-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">OG Description</label>
                <Textarea
                  placeholder="Open Graph description..."
                  value={ogDescription}
                  onChange={(e) => setOgDescription(e.target.value)}
                  className="h-16 text-xs border-slate-200"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Media Selector Dialog Modal */}
      <Dialog open={mediaModalOpen} onOpenChange={setMediaModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col overflow-hidden bg-white">
          <DialogHeader className="pb-3 border-b">
            <DialogTitle className="text-lg font-bold">Select Media File</DialogTitle>
          </DialogHeader>

          {/* Upload Button */}
          <div className="py-4 border-b flex justify-between items-center px-1">
            <span className="text-xs text-slate-500">Pick from existing uploads or import a new file</span>
            <label className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-2 rounded-lg cursor-pointer flex items-center gap-1 shadow-sm">
              {uploadingFile ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
              Upload Image
              <input type="file" className="hidden" accept="image/*" onChange={handleMediaUpload} disabled={uploadingFile} />
            </label>
          </div>

          {/* Grid library */}
          <div className="flex-1 overflow-y-auto py-4">
            {mediaLibrary.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">No images in library.</div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                {mediaLibrary.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setFeaturedImageId(item.id);
                      setFeaturedImagePath(item.file_path);
                      setMediaModalOpen(false);
                    }}
                    className={`group relative rounded-lg overflow-hidden border-2 aspect-video bg-slate-50 ${
                      featuredImageId === item.id ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <img src={item.file_path} alt={item.filename} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
