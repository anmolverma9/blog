'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Loader2,
  Sparkles,
  Link as LinkIcon,
  Image as ImageIcon,
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
  BookOpen
} from 'lucide-react';
import BlockEditor, { Block, compileBlocksToMarkdown, parseHtmlToBlocks } from './block-editor';
import VisualBuilder from './visual-builder';
import BlocksRenderer from '@/components/public/blocks-renderer';
import VisualRenderer from '@/components/public/visual-renderer';

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

function dataURLtoFile(dataurl: string, filename: string): File | null {
  try {
    const arr = dataurl.split(',');
    if (arr.length < 2) return null;
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const isBase64 = arr[0].indexOf('base64') >= 0;
    let bstr: string;
    if (isBase64) {
      bstr = atob(arr[1]);
    } else {
      bstr = decodeURIComponent(arr[1]);
    }
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const extension = mime.split('/')[1] || 'png';
    return new File([u8arr], `${filename}.${extension}`, { type: mime });
  } catch (e) {
    console.error('Failed to convert base64 data URL to File:', e);
    return null;
  }
}

interface PostEditorProps {
  postId?: number;
}

export default function PostEditor({ postId }: PostEditorProps) {
  const router = useRouter();
  const isEdit = !!postId;

  // Form states
  const [editorType, setEditorType] = useState<'blog' | 'visual'>('blog');
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
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [focusKeyword, setFocusKeyword] = useState('');

  // SEO states
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [metaKeywords, setMetaKeywords] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [robotsSettings, setRobotsSettings] = useState('index, follow');
  const [ogTitle, setOgTitle] = useState('');
  const [ogDescription, setOgDescription] = useState('');

  // Session / Workflow & Revisions
  const [session, setSession] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  // Monetization Custom Meta fields
  const [isSponsored, setIsSponsored] = useState(false);
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorLink, setSponsorLink] = useState('');
  const [premiumPlacement, setPremiumPlacement] = useState(false);
  
  // Custom layout modes
  const [postLayout, setPostLayout] = useState('layout_a');
  const [isFullscreen, setIsFullscreen] = useState(true); // default to true for premium experience!
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isDistractionFree, setIsDistractionFree] = useState(false);
  const [isSplitScreen, setIsSplitScreen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [activeRightSidebarTab, setActiveRightSidebarTab] = useState<'settings' | 'seo' | 'links'>('settings');

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
  const [seoTab, setSeoTab] = useState<'config' | 'audit'>('config');
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
        const [catsRes, tagsRes, mediaRes, sessionRes] = await Promise.all([
          fetch((process.env.NEXT_PUBLIC_APP_URL || '') + '/api/admin/categories'),
          fetch((process.env.NEXT_PUBLIC_APP_URL || '') + '/api/admin/tags'),
          fetch((process.env.NEXT_PUBLIC_APP_URL || '') + '/api/admin/media'),
          fetch((process.env.NEXT_PUBLIC_APP_URL || '') + '/api/auth/session'),
        ]);

        if (catsRes.ok) setCategories(await catsRes.json());
        if (tagsRes.ok) setTags(await tagsRes.json());
        if (mediaRes.ok) setMediaLibrary(await mediaRes.json());
        if (sessionRes.ok) {
          const sData = await sessionRes.json();
          if (sData.session) setSession(sData.session);
        }
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
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/admin/posts/${postId}`);
        if (!res.ok) throw new Error('Failed to load post');

        const post = await res.json();
        setTitle(post.title);
        setSlug(post.slug);
        setSummary(post.summary || '');
        
        const loadedEditorType = (post.meta && post.meta.editor_type) || 'blog';
        setEditorType(loadedEditorType);
        
        let loadedBlocks: Block[] = [];
        if (loadedEditorType === 'visual') {
          setContent(post.meta.editor_blocks || '');
        } else {
          setContent(post.content);
          if (post.meta && post.meta.editor_blocks) {
            try {
              loadedBlocks = JSON.parse(post.meta.editor_blocks);
            } catch (e) {
              console.error('Failed to parse editor blocks:', e);
            }
          }
          
          if (loadedBlocks.length === 0 && post.content) {
            // Check if it's raw HTML from WordPress
            if (post.content.includes('<p>') || post.content.includes('<p ') || post.content.includes('<h2') || post.content.includes('<figure')) {
              loadedBlocks = parseHtmlToBlocks(post.content);
            } else {
              loadedBlocks = post.content.split('\n\n').map((para: string, idx: number) => {
                const id = `legacy-${idx}-${Math.random().toString(36).substr(2, 4)}`;
                if (para.startsWith('## ')) {
                  return { id, type: 'h2', data: { text: para.replace('## ', '') } };
                } else if (para.startsWith('### ')) {
                  return { id, type: 'h3', data: { text: para.replace('### ', '') } };
                } else if (para.startsWith('# ')) {
                  return { id, type: 'h1', data: { text: para.replace('# ', '') } };
                } else {
                  return { id, type: 'paragraph', data: { text: para } };
                }
              });
            }
          }
          
          if (loadedBlocks.length === 0) {
            loadedBlocks = [{ id: 'init-p', type: 'paragraph', data: { text: '' } }];
          }
          setBlocks(loadedBlocks);
        }
        
        if (post.meta && post.meta.focus_keyword) {
          setFocusKeyword(post.meta.focus_keyword);
        }

        // Load workflow and monetization parameters
        if (post.meta) {
          if (post.meta.review_notes) setReviewNotes(post.meta.review_notes);
          setIsSponsored(!!post.meta.is_sponsored);
          setSponsorName(post.meta.sponsor_name || '');
          setSponsorLink(post.meta.sponsor_link || '');
          setPremiumPlacement(!!post.meta.premium_placement);
          setPostLayout(post.meta.post_layout || 'layout_a');
        }

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
  }, [postId, isEdit, router]);

  // Run SEO generator helper
  const handleAutoSeo = async () => {
    if (!title) {
      alert('Please fill in the title first.');
      return;
    }
    setGeneratingSeo(true);
    try {
      const compiled = compileBlocksToMarkdown(blocks);
      const res = await fetch((process.env.NEXT_PUBLIC_APP_URL || '') + '/api/seo/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content: compiled, summary }),
      });

      if (res.ok) {
        const data = await res.json();
        setMetaTitle(data.metaTitle);
        setMetaDescription(data.metaDescription);
        setOgTitle(data.ogTitle);
        setOgDescription(data.ogDescription);
        if (!canonicalUrl) {
          setCanonicalUrl(`/${slug}`);
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
    const compiled = compileBlocksToMarkdown(blocks);
    if (!compiled) {
      alert('Please write some content first.');
      return;
    }
    setAnalyzingLinks(true);
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_APP_URL || '') + '/api/admin/posts/analyze-linking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, content: compiled }),
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
      const res = await fetch((process.env.NEXT_PUBLIC_APP_URL || '') + '/api/admin/media', {
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

  const compileVisualSectionsToMarkdown = (sections: any[]): string => {
    const result: string[] = [];
    (sections || []).forEach(sec => {
      (sec.columns || []).forEach((col: any) => {
        (col.widgets || []).forEach((w: any) => {
          if (w.type === 'heading') {
            result.push(`## ${w.data.text || ''}`);
          } else if (w.type === 'text') {
            result.push(w.data.text || '');
          } else if (w.type === 'list') {
            (w.data.items || []).forEach((item: string) => result.push(`* ${item}`));
          } else if (w.type === 'button') {
            result.push(`[${w.data.text || 'CTA'}](${w.data.url || '#'})`);
          }
        });
      });
    });
    return result.join('\n\n');
  };

  // Submit Handler
  const handleSave = async (statusOverride?: string) => {
    setSaving(true);
    const isVisual = editorType === 'visual';
    let currentBlocks = [...blocks];
    let hasBase64 = false;

    if (!isVisual) {
      // Process and upload any remaining base64 images in blocks first
      for (let i = 0; i < currentBlocks.length; i++) {
        const block = currentBlocks[i];
        if (block.type === 'image' && block.data.url && block.data.url.startsWith('data:image/')) {
          hasBase64 = true;
          try {
            const file = dataURLtoFile(block.data.url, `pasted_image_${Date.now()}`);
            if (file) {
              const formData = new FormData();
              formData.append('file', file);
              const res = await fetch((process.env.NEXT_PUBLIC_APP_URL || '') + '/api/admin/media', {
                method: 'POST',
                body: formData,
              });
              if (res.ok) {
                const data = await res.json();
                currentBlocks[i] = {
                  ...block,
                  data: {
                    ...block.data,
                    url: data.media.file_path,
                    alt: data.media.alt_text || data.media.filename,
                  }
                };
              }
            }
          } catch (err) {
            console.error('Failed to upload base64 image on save:', err);
          }
        }
      }

      if (hasBase64) {
        setBlocks(currentBlocks);
      }
    }

    let compiledContent = '';
    if (isVisual) {
      try {
        const parsed = JSON.parse(content || '{"sections":[]}');
        compiledContent = compileVisualSectionsToMarkdown(parsed.sections);
      } catch (e) {
        console.error('Failed to parse visual content on save', e);
        compiledContent = 'Visual Layout Post';
      }
    } else {
      compiledContent = compileBlocksToMarkdown(currentBlocks);
    }

    if (!title || !slug || !compiledContent) {
      alert('Title, slug, and content are required.');
      setSaving(false);
      return;
    }

    if (statusOverride) {
      setStatus(statusOverride);
    }

    const payload = {
      title,
      slug,
      content: compiledContent,
      summary,
      status: statusOverride || status,
      published_at: publishedAt ? new Date(publishedAt).toISOString().slice(0, 19).replace('T', ' ') : null,
      category_id: categoryId ? Number(categoryId) : null,
      featured_image_id: featuredImageId,
      tagIds: selectedTags,
      meta: {
        editor_type: editorType,
        editor_blocks: isVisual ? content : JSON.stringify(currentBlocks),
        focus_keyword: focusKeyword,
        is_sponsored: isSponsored,
        sponsor_name: isSponsored ? sponsorName : '',
        sponsor_link: isSponsored ? sponsorLink : '',
        premium_placement: premiumPlacement,
        review_notes: reviewNotes,
        post_layout: postLayout,
      },
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
      const url = isEdit
        ? `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/admin/posts/${postId}`
        : `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/admin/posts`;
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

  const getSeoAnalysis = () => {
    const checklist: Array<{ text: string; passed: boolean; desc: string }> = [];
    let score = 10; // base score

    // 1. Title Length Check
    const titleLen = title.length;
    if (titleLen >= 30 && titleLen <= 65) {
      checklist.push({ text: 'Title length is perfect', passed: true, desc: `Recommended: 30-65 chars (current: ${titleLen})` });
      score += 15;
    } else {
      checklist.push({ text: 'Title length is suboptimal', passed: false, desc: `Recommended: 30-65 chars (current: ${titleLen})` });
      if (titleLen > 0) score += 5;
    }

    // 2. Word Count Check
    const wordCount = blocks.reduce((acc, b) => {
      if (b.type === 'paragraph' || b.type === 'h1' || b.type === 'h2' || b.type === 'h3') {
        const text = b.data.text || '';
        return acc + text.trim().split(/\s+/).filter(Boolean).length;
      }
      return acc;
    }, 0);

    if (wordCount >= 600) {
      checklist.push({ text: 'Word count is excellent', passed: true, desc: `Over 600 words (current: ${wordCount})` });
      score += 20;
    } else if (wordCount >= 300) {
      checklist.push({ text: 'Word count is good', passed: true, desc: `300-600 words (current: ${wordCount})` });
      score += 10;
    } else {
      checklist.push({ text: 'Word count is too short', passed: false, desc: `Write at least 300 words to rank well (current: ${wordCount})` });
    }

    // 3. Meta Description Check
    const descLen = metaDescription.length;
    if (descLen >= 110 && descLen <= 160) {
      checklist.push({ text: 'Meta description length is perfect', passed: true, desc: `Recommended: 110-160 chars (current: ${descLen})` });
      score += 15;
    } else {
      checklist.push({ text: 'Meta description length is suboptimal', passed: false, desc: `Recommended: 110-160 chars (current: ${descLen})` });
      if (descLen > 0) score += 5;
    }

    // 4. Headings Checklist
    const hasHeadings = blocks.some(b => b.type === 'h2' || b.type === 'h3');
    if (hasHeadings) {
      checklist.push({ text: 'Has section headings (H2/H3)', passed: true, desc: 'Good structure for readability' });
      score += 10;
    } else {
      checklist.push({ text: 'No section headings (H2/H3)', passed: false, desc: 'Add H2 or H3 headers to break up content' });
    }

    // 5. Image Alt Check
    const hasImageWithAlt = blocks.some(b => b.type === 'image' && b.data.url && b.data.alt);
    if (hasImageWithAlt) {
      checklist.push({ text: 'Has image with alt description', passed: true, desc: 'Great for Google Image search indexing' });
      score += 10;
    } else {
      checklist.push({ text: 'No image with alt description', passed: false, desc: 'Add an image block and enter alt text' });
    }

    // 6. Focus Keyword Check
    if (focusKeyword) {
      const kw = focusKeyword.toLowerCase();
      
      // Keyword in Title
      const inTitle = title.toLowerCase().includes(kw);
      if (inTitle) {
        checklist.push({ text: 'Focus keyword in title', passed: true, desc: 'Keyword found in title' });
        score += 5;
      } else {
        checklist.push({ text: 'Focus keyword missing from title', passed: false, desc: 'Include keyword in the title' });
      }

      // Keyword in Meta Description
      const inDesc = metaDescription.toLowerCase().includes(kw);
      if (inDesc) {
        checklist.push({ text: 'Focus keyword in meta description', passed: true, desc: 'Keyword found in meta description' });
        score += 5;
      } else {
        checklist.push({ text: 'Focus keyword missing from meta description', passed: false, desc: 'Include keyword in the meta description' });
      }

      // Keyword Density
      const bodyText = blocks.map(b => (b.type === 'paragraph' ? (b.data.text || '') : '')).join(' ').toLowerCase();
      const occurrences = bodyText.split(kw).length - 1;
      const density = wordCount > 0 ? (occurrences / wordCount) * 100 : 0;
      
      if (density >= 0.5 && density <= 2.5) {
        checklist.push({ text: 'Focus keyword density is perfect', passed: true, desc: `Density: ${density.toFixed(2)}% (occurrences: ${occurrences})` });
        score += 10;
      } else if (occurrences === 0) {
        checklist.push({ text: 'Focus keyword not found in paragraphs', passed: false, desc: 'Write your keyword in the post body' });
      } else {
        checklist.push({ text: 'Focus keyword density is suboptimal', passed: false, desc: `Density: ${density.toFixed(2)}% (ideal: 0.5%-2.5%)` });
      }
    } else {
      checklist.push({ text: 'No focus keyword configured', passed: false, desc: 'Add a focus keyword to run keyword density audits' });
    }

    return { score: Math.min(100, score), checklist };
  };

  const { score: seoScore, checklist: seoChecklist } = getSeoAnalysis();

  const renderCanvasContent = () => {
    return (
      <div className="space-y-4">
        {/* Editor Title */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Article Title</label>
          <Input
            placeholder="Enter catchy article title..."
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
              placeholder="post-slug-url"
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
              pageId={postId || 'new'}
            />
          </div>
        ) : (
          <div className="space-y-1.5 pt-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">Notion Gutenberg Blocks</label>
            <BlockEditor
              initialBlocks={blocks}
              onChange={setBlocks}
              postId={postId || 'new'}
            />
          </div>
        )}

        {/* Summary field */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Post Excerpt</label>
          <Textarea
            placeholder="Brief overview summary to list on cards..."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="h-16 text-xs border-slate-200 focus:border-orange-500"
          />
        </div>
      </div>
    );
  };

  if (fetchingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
        <p className="text-slate-500 font-medium">Loading post builder...</p>
      </div>
    );
  }

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col h-screen w-screen overflow-hidden font-sans text-slate-800 animate-in fade-in duration-300">
        {/* Fullscreen Header */}
        <div className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
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
              <h2 className="text-sm font-bold text-slate-900 truncate max-w-xs">{title || 'Untitled Post'}</h2>
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
            <Button variant="outline" className="h-9 text-xs border-slate-200 text-slate-700" onClick={() => handleSave()} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              Save Draft
            </Button>
            {session?.role === 'Contributor' ? (
              <Button className="bg-orange-500 hover:bg-orange-600 text-white h-9 text-xs shadow-sm" onClick={() => handleSave('pending_review')} disabled={saving}>
                Submit Review
              </Button>
            ) : (
              <Button className="bg-orange-500 hover:bg-orange-600 text-white h-9 text-xs shadow-sm" onClick={() => handleSave('published')} disabled={saving}>
                Publish
              </Button>
            )}
          </div>
        </div>

        {/* Main Split Panel Workspace */}
        <div className="flex-1 flex overflow-hidden bg-slate-50">
          
          {/* 1. Left Sidebar widgets for Visual Builder (only if visual editor + not focus/quiet modes) */}
          {!isFocusMode && !isDistractionFree && editorType === 'visual' && (
            <div className="w-80 bg-slate-950 border-r border-slate-800 flex flex-col overflow-hidden text-slate-100 shrink-0 select-none">
              <div className="p-4 border-b border-slate-800 font-bold text-xs uppercase tracking-wider text-slate-400">
                Visual Builder Elements
              </div>
              {/* Render visual builder's widget lists helper container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                  Use the elements tool inside the Canvas area below to customize structures. Drag widgets into columns to compose.
                </p>
              </div>
            </div>
          )}

          {/* 2. Center Writing / Building Canvas */}
          <div className="flex-1 flex flex-col overflow-y-auto p-6 items-center">
            {isPreviewMode ? (
              // Live Full Public View Simulation
              <div className="w-full max-w-4xl bg-white border border-slate-200/80 shadow-md rounded-2xl p-8 min-h-[80vh] overflow-y-auto prose prose-slate">
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">{title || 'Untitled Post'}</h1>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase my-4">
                  <span className="text-orange-500">Preview Mode</span>
                  <span>•</span>
                  <span>Draft Preview</span>
                </div>
                {featuredImagePath && (
                  <img src={featuredImagePath} alt="Featured" className="w-full h-64 object-cover rounded-xl my-6" />
                )}
                {editorType === 'visual' ? (
                  <VisualRenderer data={JSON.parse(content || '{"sections":[]}')} />
                ) : (
                  <BlocksRenderer blocks={blocks} />
                )}
              </div>
            ) : isSplitScreen ? (
              // Split Screen Mode: Left Editor Panel, Right Preview Panel
              <div className="w-full h-full flex gap-4 overflow-hidden">
                <div className="flex-1 overflow-y-auto bg-white border rounded-2xl p-6 shadow-sm">
                  {renderCanvasContent()}
                </div>
                <div className="flex-1 overflow-y-auto bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm prose prose-slate">
                  <h1 className="text-2xl font-bold text-slate-900">{title || 'Untitled Post'}</h1>
                  <hr className="my-4" />
                  {editorType === 'visual' ? (
                    <VisualRenderer data={JSON.parse(content || '{"sections":[]}')} />
                  ) : (
                    <BlocksRenderer blocks={blocks} />
                  )}
                </div>
              </div>
            ) : (
              // Regular Focus/Canvas Editor
              <div className={`w-full bg-white border border-slate-200/80 shadow-sm rounded-3xl p-6 md:p-8 min-h-[85vh] h-fit shrink-0 ${editorType === 'blog' ? 'max-w-4xl' : 'max-w-full'}`}>
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
                  Document
                </button>
                <button
                  onClick={() => setActiveRightSidebarTab('seo')}
                  className={`flex-1 text-center py-3 border-b-2 transition-colors ${activeRightSidebarTab === 'seo' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                  SEO Audit
                </button>
                <button
                  onClick={() => setActiveRightSidebarTab('links')}
                  className={`flex-1 text-center py-3 border-b-2 transition-colors ${activeRightSidebarTab === 'links' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                  Links
                </button>
              </div>

              {/* Tab content panel */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                {activeRightSidebarTab === 'settings' && (
                  <>
                    {/* Categories & Tags */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Category</label>
                      <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full h-9 px-2 rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="">Select Category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Tags</label>
                      <div className="flex flex-wrap gap-1 border border-slate-200 p-2 rounded-lg max-h-24 overflow-y-auto bg-slate-50/50">
                        {tags.map((t) => {
                          const selected = selectedTags.includes(t.id);
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => handleTagToggle(t.id)}
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${selected ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-slate-200 text-slate-600'}`}
                            >
                              {t.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Featured Image */}
                    {session?.role !== 'Contributor' && (
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Featured Image</label>
                        {featuredImagePath ? (
                          <div className="relative group border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                            <img src={featuredImagePath} alt="Featured cover" className="w-full h-24 object-cover" />
                            <button
                              type="button"
                              onClick={() => setMediaModalOpen(true)}
                              className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 text-[10px] font-bold flex items-center justify-center transition-all"
                            >
                              Change Image
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setMediaModalOpen(true)}
                            className="w-full h-20 border border-dashed border-slate-200 hover:border-orange-400 rounded-lg flex flex-col items-center justify-center gap-1 text-slate-400"
                          >
                            <ImageIcon className="h-5 w-5" />
                            <span className="text-[10px] font-bold">Select Cover</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Publishing Status */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full h-9 px-2 rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="draft">Draft</option>
                        <option value="pending_review">Pending Review</option>
                        {session?.role !== 'Contributor' && session?.role !== 'Author' && (
                          <>
                            <option value="scheduled">Scheduled</option>
                            <option value="published">Published</option>
                          </>
                        )}
                      </select>
                    </div>

                    {status === 'scheduled' && (
                      <div className="space-y-1.5 animate-in slide-in-from-top-1">
                        <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Scheduled Date</label>
                        <Input
                          type="datetime-local"
                          value={publishedAt}
                          onChange={(e) => setPublishedAt(e.target.value)}
                          className="h-9 border-slate-200 text-xs"
                        />
                      </div>
                    )}

                    {/* Post Layout Selector */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Post Layout style</label>
                      <select
                        value={postLayout}
                        onChange={(e) => setPostLayout(e.target.value)}
                        className="w-full h-9 px-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
                      >
                        <option value="layout_a">Layout A (Detailed + Sticky TOC)</option>
                        <option value="layout_b">Layout B (Clean Minimal Document)</option>
                        <option value="layout_c">Layout C (Split Magazine Style)</option>
                      </select>
                    </div>

                    {/* Monetization checkboxes */}
                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="fs-isSponsored"
                          checked={isSponsored}
                          onChange={(e) => setIsSponsored(e.target.checked)}
                          className="h-3.5 w-3.5 rounded border-slate-350 text-orange-600"
                        />
                        <label htmlFor="fs-isSponsored" className="font-semibold text-slate-700 cursor-pointer">Sponsored Content</label>
                      </div>

                      {isSponsored && (
                        <div className="space-y-2 pl-4 border-l">
                          <Input
                            placeholder="Sponsor Name..."
                            value={sponsorName}
                            onChange={(e) => setSponsorName(e.target.value)}
                            className="h-8 text-xs"
                          />
                          <Input
                            placeholder="Sponsor Link..."
                            value={sponsorLink}
                            onChange={(e) => setSponsorLink(e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="fs-premiumPlacement"
                          checked={premiumPlacement}
                          onChange={(e) => setPremiumPlacement(e.target.checked)}
                          className="h-3.5 w-3.5 rounded border-slate-350 text-orange-600"
                        />
                        <label htmlFor="fs-premiumPlacement" className="font-semibold text-slate-700 cursor-pointer">Premium Placement (Featured)</label>
                      </div>
                    </div>
                  </>
                )}

                {activeRightSidebarTab === 'seo' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">SEO Config</span>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={handleAutoSeo}
                        className="text-orange-500 hover:text-orange-600 font-bold p-0 h-auto gap-0.5 hover:bg-transparent"
                      >
                        <Sparkles className="h-3 w-3" /> Auto Fill
                      </Button>
                    </div>

                    <div className="flex flex-col items-center justify-center p-3 bg-orange-50/50 border border-orange-100 rounded-xl">
                      <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">SEO Score</span>
                      <span className={`text-3xl font-black mt-1 ${seoScore >= 80 ? 'text-emerald-600' : seoScore >= 50 ? 'text-orange-500' : 'text-rose-500'}`}>{seoScore}/100</span>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Focus Keyword</label>
                      <Input
                        placeholder="e.g. Next.js SaaS..."
                        value={focusKeyword}
                        onChange={(e) => setFocusKeyword(e.target.value)}
                        className="h-8 text-xs border-slate-200"
                      />
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

                    <div className="h-px bg-slate-100 my-1" />
                    
                    <p className="font-bold text-slate-500 uppercase tracking-wider text-[9px] mb-1">SEO Audit Checklist</p>
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {seoChecklist.map((item, idx) => (
                        <div key={idx} className="flex gap-1.5 items-start text-[11px] leading-tight">
                          {item.passed ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <p className="font-bold text-slate-700">{item.text}</p>
                            <p className="text-[9px] text-slate-400">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeRightSidebarTab === 'links' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                        <LinkIcon className="h-3 w-3 text-orange-500" /> Link Whisperer
                      </span>
                      <Button
                        variant="outline"
                        size="xs"
                        className="border-orange-100 hover:bg-orange-50 text-[10px] font-bold h-7 px-2 text-orange-600"
                        onClick={handleAnalyzeLinking}
                        disabled={analyzingLinks}
                      >
                        {analyzingLinks ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                        Analyze Link Suggs
                      </Button>
                    </div>

                    <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                      {linkingSuggestions.length === 0 ? (
                        <div className="text-slate-400 italic text-center py-4 bg-slate-50 rounded-xl border border-dashed text-[11px]">
                          Click 'Analyze Link Suggs' to audit references.
                        </div>
                      ) : (
                        linkingSuggestions.map((sug, idx) => (
                          <div key={idx} className="bg-orange-50/30 border border-orange-100 p-2.5 rounded-lg space-y-1">
                            <p className="text-slate-700 leading-normal">
                              Match: <strong className="underline decoration-orange-350">{sug.keyword}</strong>
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">Target: <code className="bg-white border px-1 py-0.5 rounded text-orange-600">/{sug.targetSlug}</code></p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Media Selector Dialog Modal inside fullscreen */}
        <Dialog open={mediaModalOpen} onOpenChange={setMediaModalOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col overflow-hidden bg-white z-50">
            <DialogHeader className="pb-3 border-b">
              <DialogTitle className="text-lg font-bold">Select Media File</DialogTitle>
            </DialogHeader>

            <div className="py-3 border-b flex justify-between items-center px-1 shrink-0">
              <span className="text-xs text-slate-500">Select cover or upload custom files</span>
              <label className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1 shadow-sm">
                {uploadingFile ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
                Upload File
                <input type="file" className="hidden" accept="image/*" onChange={handleMediaUpload} disabled={uploadingFile} />
              </label>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              {mediaLibrary.length === 0 ? (
                <p className="text-center text-slate-400 text-xs py-8">No images found.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {mediaLibrary.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setFeaturedImageId(item.id);
                        setFeaturedImagePath(item.file_path);
                        setMediaModalOpen(false);
                      }}
                      className={`group relative rounded-lg overflow-hidden border-2 aspect-video bg-slate-50 ${featuredImageId === item.id ? 'border-orange-500 ring-2 ring-orange-500/25' : 'border-slate-200'}`}
                    >
                      <img src={item.file_path} alt={item.filename} className="w-full h-full object-cover" />
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Top Banner to enter Fullscreen */}
      <div className="bg-orange-500 text-white rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md shadow-orange-500/10">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-white shrink-0 animate-pulse" />
          <div>
            <h4 className="font-bold text-sm">Experience Fullscreen Editor Workspace</h4>
            <p className="text-xs text-orange-100">Maximize your focus with Split-Screen Previews, focus writing modes, and SEO helpers.</p>
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
              {isEdit ? 'Edit Article' : 'Write New Article'}
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">Scaffold SaaS long-form content optimized for SEO</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-slate-200 text-slate-700 h-10" onClick={() => handleSave()} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            Save Draft
          </Button>
          {session?.role === 'Contributor' ? (
            <Button className="bg-orange-500 hover:bg-orange-600 text-white h-10 shadow-md shadow-orange-500/10" onClick={() => handleSave('pending_review')} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Submit for Review
            </Button>
          ) : (
            <Button className="bg-orange-500 hover:bg-orange-600 text-white h-10 shadow-md shadow-orange-500/10" onClick={() => handleSave('published')} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Publish Post
            </Button>
          )}
        </div>
      </div>

      {/* Warning Banner if Review Notes exist */}
      {reviewNotes && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-800 animate-in fade-in duration-300">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Editorial Feedback / Rejection Notes</h4>
            <p className="text-xs text-amber-700 mt-1 leading-normal">{reviewNotes}</p>
          </div>
        </div>
      )}

      {/* Editor Type Selector Toggle */}
      <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
        <span className="text-xs font-bold text-slate-600 font-sans">Select Post Editor Mode:</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditorType('blog')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${editorType === 'blog' ? 'bg-orange-500 text-white shadow' : 'bg-white border text-slate-600 hover:bg-slate-100'}`}
          >
            Advanced Blog Editor (Gutenberg / Notion)
          </button>
          <button
            type="button"
            onClick={() => setEditorType('visual')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${editorType === 'visual' ? 'bg-orange-500 text-white shadow' : 'bg-white border text-slate-600 hover:bg-slate-100'}`}
          >
            Visual Page Builder (Elementor style)
          </button>
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
                  <span className="px-3 flex items-center text-xs text-slate-400 border-r border-slate-200">/</span>
                  <input
                    placeholder="post-slug"
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
                    pageId={postId || 'new'}
                  />
                </div>
              ) : (
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gutenberg+ Block Content</label>
                  </div>
                  <BlockEditor
                    initialBlocks={blocks}
                    onChange={setBlocks}
                    postId={postId || 'new'}
                  />
                </div>
              )}

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
                        Target Link: <code className="bg-white border px-1.5 py-0.5 rounded text-orange-600">/{sug.targetSlug}</code>
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
                  <option value="pending_review">Pending Review</option>
                  {session?.role !== 'Contributor' && session?.role !== 'Author' && (
                    <>
                      <option value="scheduled">Scheduled</option>
                      <option value="published">Published</option>
                    </>
                  )}
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

              {/* Post Layout Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Post Layout Style</label>
                <select
                  value={postLayout}
                  onChange={(e) => setPostLayout(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value="layout_a">Layout A (Detailed + TOC)</option>
                  <option value="layout_b">Layout B (Minimal)</option>
                  <option value="layout_c">Layout C (Magazine Split)</option>
                </select>
              </div>

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

          {/* Monetization & Promotion Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                Monetization & Promotion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="isSponsored"
                  checked={isSponsored}
                  onChange={(e) => setIsSponsored(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="isSponsored" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Sponsored Content
                </label>
              </div>

              {isSponsored && (
                <div className="space-y-3 pl-6 border-l border-slate-100 animate-in slide-in-from-top-1 duration-150">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Sponsor Name</label>
                    <Input
                      placeholder="e.g. Acme Corp"
                      value={sponsorName}
                      onChange={(e) => setSponsorName(e.target.value)}
                      className="h-9 text-xs border-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Sponsor Link</label>
                    <Input
                      placeholder="e.g. https://acme.com"
                      value={sponsorLink}
                      onChange={(e) => setSponsorLink(e.target.value)}
                      className="h-9 text-xs border-slate-200"
                    />
                  </div>
                </div>
              )}

              <div className="h-px bg-slate-100 my-2" />

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="premiumPlacement"
                  checked={premiumPlacement}
                  onChange={(e) => setPremiumPlacement(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="premiumPlacement" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Premium Placement (Pinned/Featured)
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Featured Image Selector Card */}
          {session?.role !== 'Contributor' && (
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
          )}

          {/* Built-in SEO Override Engine Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 space-y-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-orange-500" />
                  SEO Scoring Engine
                </CardTitle>
                <div className="flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  Score: <span className={seoScore >= 80 ? 'text-emerald-600' : seoScore >= 50 ? 'text-orange-500' : 'text-red-500'}>{seoScore}/100</span>
                </div>
              </div>
              <div className="flex gap-1 border-b border-slate-100 pb-1">
                <button
                  type="button"
                  onClick={() => setSeoTab('config')}
                  className={`text-xs px-2.5 py-1 font-semibold rounded-md transition-colors ${seoTab === 'config' ? 'bg-orange-50 text-orange-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  SEO Config
                </button>
                <button
                  type="button"
                  onClick={() => setSeoTab('audit')}
                  className={`text-xs px-2.5 py-1 font-semibold rounded-md transition-colors ${seoTab === 'audit' ? 'bg-orange-50 text-orange-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  SEO Audit
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {seoTab === 'config' ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Auto generator</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-orange-500 hover:text-orange-600 text-xs font-bold gap-1 p-0 h-auto hover:bg-transparent"
                      onClick={handleAutoSeo}
                      disabled={generatingSeo}
                    >
                      {generatingSeo ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      Generate Fields
                    </Button>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Focus Keyword</label>
                    <Input
                      placeholder="e.g. Next.js SaaS..."
                      value={focusKeyword}
                      onChange={(e) => setFocusKeyword(e.target.value)}
                      className="h-9 text-xs border-slate-200"
                    />
                  </div>

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
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-150 shadow-inner">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SEO Score</span>
                    <span className={`text-4xl font-extrabold mt-1 ${seoScore >= 80 ? 'text-emerald-600' : seoScore >= 50 ? 'text-orange-500' : 'text-red-500'}`}>{seoScore}</span>
                    <span className="text-[9px] text-slate-400 font-semibold mt-1">Aim for 85+ for high rankings</span>
                  </div>

                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {seoChecklist.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs">
                        {item.passed ? (
                          <div className="p-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                            <Check className="h-3 w-3" />
                          </div>
                        ) : (
                          <div className="p-0.5 rounded-full bg-rose-100 text-rose-700 shrink-0 mt-0.5">
                            <AlertCircle className="h-3 w-3" />
                          </div>
                        )}
                        <div>
                          <p className={`font-semibold ${item.passed ? 'text-slate-800' : 'text-slate-500'}`}>{item.text}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5 leading-normal">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                      featuredImageId === item.id ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-slate-200'
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
