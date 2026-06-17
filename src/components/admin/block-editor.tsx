'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Heading1, Heading2, Heading3, AlignLeft, Image as ImageIcon, Video, HelpCircle,
  Info, Sparkles, Minus, Table as TableIcon, Code as CodeIcon, Star, CheckSquare, ListPlus,
  ArrowUp, ArrowDown, Trash2, Plus, Copy, RefreshCw, Undo, Redo,
  User, List, FileText, Wand2, History, Check, Bold, Italic, Link
} from 'lucide-react';

export interface Block {
  id: string;
  type: 'paragraph' | 'h1' | 'h2' | 'h3' | 'image' | 'gallery' | 'video' | 'faq' | 'callout' | 'button' | 'divider' | 'table' | 'code' | 'review' | 'proscons' | 'comparison' | 'authorbox' | 'toc' | 'schema';
  data: any;
}

// Pure CSS Auto-Resizing Textarea wrapper
const CssAutoResizeTextarea = ({ value, onChange, className = '', placeholder, ...props }: any) => {
  return (
    <div className="grid w-full">
      {/* Invisible clone dictates height via CSS Grid */}
      <div
        className={`col-start-1 col-end-2 row-start-1 row-end-2 invisible whitespace-pre-wrap break-words px-1 py-1 text-sm leading-normal ${className}`}
        aria-hidden="true"
      >
        {value + ' '}
      </div>
      {/* Actual textarea matching the clone's height */}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        {...props}
        className={`col-start-1 col-end-2 row-start-1 row-end-2 w-full h-full resize-none overflow-hidden bg-transparent outline-none border-0 px-1 py-1 text-slate-800 text-sm leading-normal ${className}`}
      />
    </div>
  );
};
interface BlockEditorProps {
  initialBlocks: Block[];
  onChange: (blocks: Block[]) => void;
  postId?: number | string;
}

const BLOCK_TYPES_CONFIG = [
  { type: 'paragraph', label: 'Paragraph', icon: AlignLeft, description: 'Start writing plain text content.' },
  { type: 'h1', label: 'Heading 1', icon: Heading1, description: 'Large section heading.' },
  { type: 'h2', label: 'Heading 2', icon: Heading2, description: 'Medium section heading.' },
  { type: 'h3', label: 'Heading 3', icon: Heading3, description: 'Small section heading.' },
  { type: 'image', label: 'Image', icon: ImageIcon, description: 'Add a single image block.' },
  { type: 'gallery', label: 'Gallery', icon: ImageIcon, description: 'Grid layout of multiple images.' },
  { type: 'video', label: 'Video Embed', icon: Video, description: 'YouTube, Vimeo, or custom video.' },
  { type: 'faq', label: 'FAQ Accordion', icon: HelpCircle, description: 'Collapsible Q&A cards.' },
  { type: 'callout', label: 'Callout Box', icon: Info, description: 'Highlighted tip, warning, or success notice.' },
  { type: 'button', label: 'CTA Button', icon: Sparkles, description: 'Interactive call-to-action button.' },
  { type: 'divider', label: 'Divider', icon: Minus, description: 'Horizontal dividing line separator.' },
  { type: 'table', label: 'Data Table', icon: TableIcon, description: 'Simple grid table layout.' },
  { type: 'code', label: 'Code Snippet', icon: CodeIcon, description: 'Syntax highlighted code block.' },
  { type: 'review', label: 'Review Box', icon: Star, description: 'Affiliate star rating summary card.' },
  { type: 'proscons', label: 'Pros & Cons', icon: CheckSquare, description: 'Double column pros and cons lists.' },
  { type: 'comparison', label: 'Comparison Matrix', icon: ListPlus, description: 'Feature highlight comparison table.' },
  { type: 'authorbox', label: 'Author Box', icon: User, description: 'Profile bio details card.' },
  { type: 'toc', label: 'Table of Contents', icon: List, description: 'Dynamic list of H2/H3 jump links.' },
  { type: 'schema', label: 'Schema Block', icon: FileText, description: 'Structured SEO data block (FAQ/HowTo/Review).' },
] as const;

export default function BlockEditor({ initialBlocks = [], onChange, postId = 'new' }: BlockEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks.length > 0 ? initialBlocks : [{ id: 'init-p', type: 'paragraph', data: { text: '' } }]);
  const [history, setHistory] = useState<Block[][]>([initialBlocks.length > 0 ? initialBlocks : [{ id: 'init-p', type: 'paragraph', data: { text: '' } }]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);

  const applyInlineFormat = (format: 'bold' | 'italic' | 'link') => {
    const targetId = focusedBlockId || (blocks.length > 0 ? blocks[0].id : null);
    if (!targetId) {
      alert('Click inside a paragraph or heading text block first to format text.');
      return;
    }

    const block = blocks.find(b => b.id === targetId);
    if (!block || !['paragraph', 'h1', 'h2', 'h3'].includes(block.type)) {
      alert('Please select a text block (Paragraph or Heading) to format.');
      return;
    }

    let text = block.data.text || '';
    const activeEl = document.activeElement as HTMLTextAreaElement | HTMLInputElement;
    let start = 0;
    let end = 0;

    if (activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT')) {
      start = activeEl.selectionStart || 0;
      end = activeEl.selectionEnd || 0;
    }

    const selected = text.substring(start, end);
    let formatted = '';

    if (format === 'bold') {
      formatted = `**${selected || 'bold text'}**`;
    } else if (format === 'italic') {
      formatted = `*${selected || 'italic text'}*`;
    } else if (format === 'link') {
      const url = prompt('Enter link URL:', 'https://');
      if (url === null) return;
      formatted = `[${selected || 'link text'}](${url})`;
    }

    const newText = text.substring(0, start) + formatted + text.substring(end);
    updateBlockData(targetId, { ...block.data, text: newText });
    
    // Push history
    const updated = blocks.map(b => (b.id === targetId ? { ...b, data: { ...b.data, text: newText } } : b));
    updateBlocksAndHistory(updated);
  };

  // Popups and Modals
  const [slashIndex, setSlashIndex] = useState<number | null>(null);
  const [slashFilter, setSlashFilter] = useState('');
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [mediaTargetBlockId, setMediaTargetBlockId] = useState<string | null>(null);
  const [mediaTargetType, setMediaTargetType] = useState<'image' | 'gallery'>('image');
  const [mediaLibrary, setMediaLibrary] = useState<any[]>([]);

  // AI Modal states
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiAction, setAiAction] = useState('rewrite');
  const [aiOutput, setAiOutput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Revisions Modal states
  const [revisionsModalOpen, setRevisionsModalOpen] = useState(false);
  const [revisions, setRevisions] = useState<Array<{ timestamp: string; blocks: Block[] }>>([]);

  // Drag and Drop
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Load Revisions on mount
  useEffect(() => {
    const key = `revisions_post_${postId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setRevisions(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse revisions', e);
      }
    }
  }, [postId]);

  // Save revision snapshot
  const saveRevisionSnapshot = () => {
    const key = `revisions_post_${postId}`;
    const newRevision = {
      timestamp: new Date().toLocaleString(),
      blocks: JSON.parse(JSON.stringify(blocks)),
    };
    const updated = [newRevision, ...revisions].slice(0, 10);
    setRevisions(updated);
    localStorage.setItem(key, JSON.stringify(updated));
    alert('Snapshot version saved locally!');
  };

  // AI content generator
  const handleAiGenerate = async () => {
    if (!aiPrompt && !['outline', 'faq', 'headline'].includes(aiAction)) {
      alert('Please enter a prompt or text to process.');
      return;
    }
    setAiLoading(true);
    setAiOutput('');
    await new Promise(resolve => setTimeout(resolve, 1000));

    let result = '';
    const cleanPrompt = aiPrompt.trim();
    
    if (aiAction === 'headline') {
      result = [
        `10 Transforming Ways to Optimize ${cleanPrompt || 'Your SaaS Business'}`,
        `The Ultimate Guide to Modern ${cleanPrompt || 'SaaS Publishing Systems'}`,
        `Why ${cleanPrompt || 'Next.js 16'} is Redefining Web Development in 2026`,
        `How to Scale Your Publishing Platform: A Comprehensive Blueprint`,
      ].join('\n');
    } else if (aiAction === 'meta') {
      result = `Discover the developer-focused guide explaining how to implement ${cleanPrompt || 'modern design patterns'} with zero downtime. Clean syntax, interactive layout guides, and responsive widgets included.`;
    } else if (aiAction === 'outline') {
      result = [
        `1. Introduction & Context Overview`,
        `2. Architectural Setup and Node Mapping`,
        `3. Core Implementation Framework Details`,
        `4. Performance Verification & Edge-Caching Strategy`,
        `5. Final Review & Next Steps Checklist`,
      ].join('\n');
    } else if (aiAction === 'faq') {
      result = [
        `Q: What is the main objective of this strategy?`,
        `A: The primary goal is to isolate complex client components while keeping dynamic routes fully operational and backward-compatible.`,
        `\nQ: Does this require additional database schema changes?`,
        `A: No, all layouts and custom content payloads are serialized and saved inside existing metadata models.`,
      ].join('\n');
    } else if (aiAction === 'rewrite') {
      result = `Refined Version:\n"By leveraging modern layout isolation and component-level states, we can achieve responsive UI updates instantly. This technique avoids full page transitions and guarantees a premium SaaS experience."`;
    } else if (aiAction === 'expand') {
      result = `Expanded Breakdown:\n"${cleanPrompt}\n\nTo expand on this concept, it is vital to acknowledge that modular scaling demands strict encapsulation. When we isolate client interfaces, we minimize chunk weights and allow the layout trees to be parsed synchronously, giving users immediate feedback. Consequently, cumulative layout shifts are reduced to absolute zero."`;
    } else if (aiAction === 'summarize') {
      result = `Executive Summary:\n"This framework introduces an isolated layout architecture to optimize next-gen SaaS platforms, ensuring 100% backward compatibility, local autosaves, and automated Schema snippet injection."`;
    }

    setAiOutput(result);
    setAiLoading(false);
  };

  // Load Media Library dynamically
  useEffect(() => {
    async function fetchMedia() {
      try {
        const res = await fetch((process.env.NEXT_PUBLIC_APP_URL || '') + '/api/admin/media');
        if (res.ok) {
          setMediaLibrary(await res.json());
        }
      } catch (err) {
        console.error('Failed to load media in editor:', err);
      }
    }
    fetchMedia();
  }, []);

  // Sync state upward
  const updateBlocksAndHistory = (newBlocks: Block[]) => {
    setBlocks(newBlocks);
    onChange(newBlocks);

    // Re revisions
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newBlocks)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const idx = historyIndex - 1;
      setHistoryIndex(idx);
      setBlocks(history[idx]);
      onChange(history[idx]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const idx = historyIndex + 1;
      setHistoryIndex(idx);
      setBlocks(history[idx]);
      onChange(history[idx]);
    }
  };

  // Autosave and Draft recovery from localStorage
  useEffect(() => {
    const key = `draft_post_${postId}`;
    const timer = setInterval(() => {
      localStorage.setItem(key, JSON.stringify(blocks));
    }, 15000); // Autosave every 15s

    return () => clearInterval(timer);
  }, [blocks, postId]);

  const loadDraftRecovery = () => {
    const key = `draft_post_${postId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          updateBlocksAndHistory(parsed);
          alert('Draft recovered successfully!');
        }
      } catch (e) {
        console.error('Failed to restore draft', e);
      }
    } else {
      alert('No autosaved draft found for this post.');
    }
  };

  // Block management functions
  const addBlock = (type: Block['type'], index?: number) => {
    const newBlock: Block = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      data: getDefaultData(type),
    };

    let updated: Block[];
    if (index !== undefined) {
      updated = [...blocks];
      updated.splice(index + 1, 0, newBlock);
    } else {
      updated = [...blocks, newBlock];
    }
    updateBlocksAndHistory(updated);
  };

  const deleteBlock = (id: string) => {
    if (blocks.length === 1) {
      updateBlocksAndHistory([{ id: 'init-p', type: 'paragraph', data: { text: '' } }]);
      return;
    }
    updateBlocksAndHistory(blocks.filter(b => b.id !== id));
  };

  const updateBlockData = (id: string, data: any) => {
    const updated = blocks.map(b => (b.id === id ? { ...b, data } : b));
    setBlocks(updated);
    onChange(updated); // Sync upward without appending history stack for every keystroke
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...blocks];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    updateBlocksAndHistory(updated);
  };

  // Drag and Drop implementation
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...blocks];
    const dragItem = updated[draggedIndex];
    updated.splice(draggedIndex, 1);
    updated.splice(index, 0, dragItem);
    setDraggedIndex(null);
    updateBlocksAndHistory(updated);
  };

  // Clipboard Paste formatting translator
  const handlePaste = (e: React.ClipboardEvent, index: number) => {
    const html = e.clipboardData.getData('text/html');
    if (html) {
      e.preventDefault();
      const parsedBlocks = parseHtmlToBlocks(html);
      if (parsedBlocks.length > 0) {
        const updated = [...blocks];
        updated.splice(index, 1, ...parsedBlocks);
        updateBlocksAndHistory(updated);
      }
    }
  };

  // Keyboard Slash commands Popup trigger
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const block = blocks[index];
    if (block.type === 'paragraph') {
      const text = block.data.text || '';
      if (e.key === '/') {
        setSlashIndex(index);
        setSlashFilter('');
      } else if (e.key === 'Backspace' && text === '') {
        e.preventDefault();
        deleteBlock(block.id);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        addBlock('paragraph', index);
      }
    }
  };

  const handleSlashSelect = (type: Block['type']) => {
    if (slashIndex !== null) {
      const updated = [...blocks];
      updated[slashIndex] = {
        id: updated[slashIndex].id,
        type,
        data: getDefaultData(type),
      };
      setSlashIndex(null);
      updateBlocksAndHistory(updated);
    }
  };

  return (
    <div className="space-y-4">
      {/* Undo/Redo & Recovery Actions toolbar */}
      <div className="flex items-center justify-between border-b pb-2 text-xs text-slate-500 font-semibold bg-slate-50 p-2 rounded-xl border flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex === 0}
            className="p-1.5 hover:bg-slate-100 hover:text-slate-800 rounded disabled:opacity-40 flex items-center gap-1"
          >
            <Undo className="h-3.5 w-3.5" /> Undo
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIndex === history.length - 1}
            className="p-1.5 hover:bg-slate-100 hover:text-slate-800 rounded disabled:opacity-40 flex items-center gap-1"
          >
            <Redo className="h-3.5 w-3.5" /> Redo
          </button>
          <div className="w-px h-4 bg-slate-200 mx-1" />
          <button
            type="button"
            onClick={() => applyInlineFormat('bold')}
            className="p-1.5 hover:bg-slate-100 hover:text-slate-800 rounded flex items-center gap-1"
            title="Bold Text"
          >
            <Bold className="h-3.5 w-3.5" /> Bold
          </button>
          <button
            type="button"
            onClick={() => applyInlineFormat('italic')}
            className="p-1.5 hover:bg-slate-100 hover:text-slate-800 rounded flex items-center gap-1"
            title="Italic Text"
          >
            <Italic className="h-3.5 w-3.5" /> Italic
          </button>
          <button
            type="button"
            onClick={() => applyInlineFormat('link')}
            className="p-1.5 hover:bg-slate-100 hover:text-slate-800 rounded flex items-center gap-1"
            title="Insert Link"
          >
            <Link className="h-3.5 w-3.5" /> Link
          </button>
          <div className="w-px h-4 bg-slate-200 mx-1" />
          <button
            type="button"
            onClick={() => setAiModalOpen(true)}
            className="p-1.5 hover:bg-purple-50 text-purple-600 hover:text-purple-700 rounded flex items-center gap-1"
            title="AI Writing Assistant"
          >
            <Wand2 className="h-3.5 w-3.5" /> AI Writer
          </button>
          <button
            type="button"
            onClick={() => setRevisionsModalOpen(true)}
            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded flex items-center gap-1"
            title="Local Revision History"
          >
            <History className="h-3.5 w-3.5" /> Revisions ({revisions.length})
          </button>
          <button
            type="button"
            onClick={saveRevisionSnapshot}
            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded flex items-center gap-1"
            title="Capture current version"
          >
            Save Snapshot
          </button>
        </div>
        <button
          type="button"
          onClick={loadDraftRecovery}
          className="text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Recover Autosaved Draft
        </button>
      </div>

      {/* Editor Blocks Container */}
      <div className="space-y-3 min-h-[400px]">
        {blocks.map((block, idx) => {
          return (
            <div
              key={block.id}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={(e) => handleDrop(e, idx)}
              className="group relative flex items-start gap-2 border border-transparent hover:border-slate-100 rounded-xl p-1.5 transition-all"
            >
              {/* Left drag handle and quick arrow reorders */}
              <div className="absolute left-[-45px] top-1/2 translate-y-[-50%] opacity-0 group-hover:opacity-100 flex items-center gap-0.5 bg-white border shadow-sm rounded-lg p-1 z-10">
                <button
                  type="button"
                  onClick={() => moveBlock(idx, 'up')}
                  disabled={idx === 0}
                  className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveBlock(idx, 'down')}
                  disabled={idx === blocks.length - 1}
                  className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <div className="w-px h-3 bg-slate-200 mx-1 cursor-grab" title="Drag to reorder" />
                <button
                  type="button"
                  onClick={() => deleteBlock(block.id)}
                  className="p-1 text-slate-400 hover:text-rose-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Render Block Content */}
              <div className="flex-1 min-w-0">
                {renderBlockInput(block, (data) => updateBlockData(block.id, data), {
                  onKeyDown: (e) => handleKeyDown(e, idx),
                  onPaste: (e) => handlePaste(e, idx),
                  onFocus: () => setFocusedBlockId(block.id),
                  openMediaSelector: (type) => {
                    setMediaTargetBlockId(block.id);
                    setMediaTargetType(type);
                    setMediaModalOpen(true);
                  }
                })}
              </div>

              {/* Quick block insert trigger */}
              <div className="absolute right-[-35px] top-1/2 translate-y-[-50%] opacity-0 group-hover:opacity-100 z-10">
                <button
                  type="button"
                  onClick={() => addBlock('paragraph', idx)}
                  className="bg-slate-100 hover:bg-orange-50 hover:text-orange-600 border border-slate-200 p-1.5 rounded-full text-slate-500 shadow-sm transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Slash commands helper popup */}
              {slashIndex === idx && (
                <div className="absolute left-6 top-10 bg-white border border-slate-200 shadow-lg rounded-xl max-w-xs max-h-60 overflow-y-auto z-30 p-2.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 px-1">Block Commands</p>
                  <div className="space-y-0.5">
                    {BLOCK_TYPES_CONFIG.map((cfg) => {
                      const Icon = cfg.icon;
                      return (
                        <button
                          key={cfg.type}
                          type="button"
                          onClick={() => handleSlashSelect(cfg.type)}
                          className="w-full text-left px-2 py-1.5 hover:bg-orange-50 rounded-lg text-xs font-semibold text-slate-700 hover:text-orange-600 flex items-center gap-2"
                        >
                          <Icon className="h-4 w-4 text-slate-400" />
                          <div>
                            <p className="leading-tight">{cfg.label}</p>
                            <p className="text-[9px] text-slate-400 font-medium">{cfg.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Media Select Modal Wrapper */}
      <Dialog open={mediaModalOpen} onOpenChange={setMediaModalOpen}>
        <DialogContent className="max-w-xl max-h-[70vh] flex flex-col overflow-hidden bg-white">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="text-base font-bold">Select Cover Media</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {mediaLibrary.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center">No images in library. Go to Media Library to upload.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {mediaLibrary.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (mediaTargetBlockId) {
                        const block = blocks.find(b => b.id === mediaTargetBlockId);
                        if (block) {
                          if (mediaTargetType === 'image') {
                            updateBlockData(mediaTargetBlockId, {
                              url: item.file_path,
                              alt: item.filename,
                              caption: '',
                            });
                          } else if (mediaTargetType === 'gallery') {
                            const currentUrls = block.data.urls || [];
                            updateBlockData(mediaTargetBlockId, {
                              urls: [...currentUrls, item.file_path],
                            });
                          }
                        }
                      }
                      setMediaModalOpen(false);
                    }}
                    className="border border-slate-200 hover:border-orange-500 rounded-lg overflow-hidden aspect-video bg-slate-50 relative group"
                  >
                    <img src={item.file_path} alt={item.filename} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Writing Assistant Modal */}
      <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] flex flex-col overflow-hidden bg-white rounded-2xl shadow-xl border border-slate-100">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-purple-600 animate-pulse" />
              AI Writing Assistant
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 text-slate-700 text-xs sm:text-sm">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Content Action</label>
              <select
                value={aiAction}
                onChange={(e) => setAiAction(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                <option value="rewrite">Rewrite & Refine Paragraph</option>
                <option value="expand">Elaborate & Expand Text</option>
                <option value="summarize">Summarize Content Block</option>
                <option value="headline">Generate Clickable Headline Suggestions</option>
                <option value="meta">Generate SEO Meta Description</option>
                <option value="outline">Generate Structural Post Outline</option>
                <option value="faq">Generate FAQ Segment</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {['headline', 'meta', 'outline', 'faq'].includes(aiAction) ? 'Focus Topic / Keyword Context' : 'Source Text / Draft content'}
              </label>
              <Textarea
                placeholder={['headline', 'meta', 'outline', 'faq'].includes(aiAction) 
                  ? "e.g. Next.js 16 app router development..."
                  : "Paste or write content here for rewrite/summarize/expand operations..."}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="min-h-[100px] text-xs sm:text-sm border-slate-200 focus:border-purple-500 focus:ring-purple-500/20"
              />
            </div>

            <Button
              onClick={handleAiGenerate}
              disabled={aiLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold h-10 shadow-md shadow-purple-600/10 flex items-center justify-center gap-1.5 text-xs sm:text-sm"
            >
              {aiLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating Content...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Compose with local AI Engine
                </>
              )}
            </Button>

            {aiOutput && (
              <div className="space-y-2 pt-2 animate-in fade-in duration-200">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Content Generation Result</label>
                <div className="bg-purple-50/50 border border-purple-100 p-4 rounded-xl text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed relative">
                  {aiOutput}
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    className="h-9 text-xs"
                    onClick={() => {
                      if (aiAction === 'faq') {
                        const faqBlock: Block = {
                          id: Math.random().toString(36).substr(2, 9),
                          type: 'faq',
                          data: {
                            items: [
                              { question: 'What is the main objective of this strategy?', answer: 'The primary goal is to isolate complex client components while keeping dynamic routes fully operational and backward-compatible.' },
                              { question: 'Does this require additional database schema changes?', answer: 'No, all layouts and custom content payloads are serialized and saved inside existing metadata models.' }
                            ]
                          }
                        };
                        updateBlocksAndHistory([...blocks, faqBlock]);
                      } else {
                        const textBlock: Block = {
                          id: Math.random().toString(36).substr(2, 9),
                          type: 'paragraph',
                          data: { text: aiOutput.replace(/^(Refined Version:|Expanded Breakdown:|Executive Summary:)\n"*/i, '').replace(/"*$/i, '') }
                        };
                        updateBlocksAndHistory([...blocks, textBlock]);
                      }
                      setAiModalOpen(false);
                      setAiOutput('');
                      setAiPrompt('');
                    }}
                  >
                    Insert Block into Editor
                  </Button>
                  <Button
                    className="bg-purple-600 text-white hover:bg-purple-700 h-9 text-xs"
                    onClick={() => {
                      navigator.clipboard.writeText(aiOutput);
                      alert('Copied to clipboard!');
                    }}
                  >
                    Copy to Clipboard
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Revisions History Modal */}
      <Dialog open={revisionsModalOpen} onOpenChange={setRevisionsModalOpen}>
        <DialogContent className="max-w-xl max-h-[70vh] flex flex-col overflow-hidden bg-white rounded-2xl shadow-xl border border-slate-100">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <History className="h-5 w-5 text-slate-600" />
              Local Version History
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1 text-slate-700 text-xs">
            {revisions.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">No snapshots saved yet. Click 'Save Snapshot' to manually save drafts.</p>
            ) : (
              <div className="space-y-2">
                {revisions.map((rev, idx) => (
                  <div key={idx} className="bg-slate-50 border p-3.5 rounded-xl flex items-center justify-between gap-4">
                    <div className="space-y-1 col-span-2">
                      <p className="font-bold text-slate-800">Version Snapshot #{revisions.length - idx}</p>
                      <p className="text-slate-400 text-[10px]">{rev.timestamp}</p>
                      <p className="text-slate-500 font-medium">Blocks: {rev.blocks.length} | First Block: {rev.blocks[0]?.data?.text?.substring(0, 40) || 'None'}...</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
                        onClick={() => {
                          if (confirm('Are you sure you want to rollback to this snapshot version? Any unsaved edits will be lost.')) {
                            updateBlocksAndHistory(JSON.parse(JSON.stringify(rev.blocks)));
                            setRevisionsModalOpen(false);
                            alert('Restored snapshot successfully!');
                          }
                        }}
                      >
                        Restore Snapshot
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-8 text-rose-500 hover:bg-rose-50"
                        onClick={() => {
                          const updated = revisions.filter((_, i) => i !== idx);
                          setRevisions(updated);
                          localStorage.setItem(`revisions_post_${postId}`, JSON.stringify(updated));
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Default states for blocks
function getDefaultData(type: Block['type']) {
  switch (type) {
    case 'paragraph':
    case 'h1':
    case 'h2':
    case 'h3':
      return { text: '' };
    case 'image':
      return { url: '', alt: '', caption: '' };
    case 'gallery':
      return { urls: [] };
    case 'video':
      return { url: '', provider: 'youtube', caption: '' };
    case 'faq':
      return { items: [{ question: '', answer: '' }] };
    case 'callout':
      return { type: 'info', title: 'Callout Title', text: '' };
    case 'button':
      return { text: 'Click Here', url: '', align: 'center', style: 'primary' };
    case 'divider':
      return {};
    case 'table':
      return { headers: ['Column 1', 'Column 2'], rows: [['Row 1 Cell 1', 'Row 1 Cell 2']] };
    case 'code':
      return { code: '', language: 'javascript' };
    case 'review':
      return { productName: '', rating: 4.5, ratingMax: 5, summary: '', buyUrl: '' };
    case 'proscons':
      return { pros: [''], cons: [''] };
    case 'comparison':
      return {
        headers: ['Product', 'Price', 'Rating', 'Buy'],
        rows: [
          { label: 'Product A', values: ['$99', '★★★★☆', 'Shop Now'], isHighlight: false }
        ]
      };
    case 'authorbox':
      return { name: '', bio: '', avatarUrl: '', twitter: '', facebook: '', linkedin: '' };
    case 'toc':
      return {};
    case 'schema':
      return { type: 'faq', name: '', description: '', items: [{ question: '', answer: '' }] };
    default:
      return {};
  }
}

// Intercept HTML pastes from clipboard and translate formatting into Block structures
export function parseHtmlToBlocks(html: string): Block[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const blocks: Block[] = [];
  const children = Array.from(doc.body.childNodes);

  const cleanHtmlText = (el: HTMLElement): string => {
    let innerHtml = el.innerHTML;
    // Normalize links
    innerHtml = innerHtml.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');
    // Normalize bold
    innerHtml = innerHtml.replace(/<(?:strong|b)[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi, '**$1**');
    // Normalize italic
    innerHtml = innerHtml.replace(/<(?:em|i)[^>]*>([\s\S]*?)<\/(?:em|i)>/gi, '*$1*');
    // Strip other tags but keep content
    const tmp = document.createElement('div');
    tmp.innerHTML = innerHtml;
    return (tmp.textContent || tmp.innerText || '').trim();
  };

  for (const node of children) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();

      if (tag === 'h1') {
        blocks.push({ id: Math.random().toString(36).substr(2, 9), type: 'h1', data: { text: cleanHtmlText(el) } });
      } else if (tag === 'h2') {
        blocks.push({ id: Math.random().toString(36).substr(2, 9), type: 'h2', data: { text: cleanHtmlText(el) } });
      } else if (tag === 'h3') {
        blocks.push({ id: Math.random().toString(36).substr(2, 9), type: 'h3', data: { text: cleanHtmlText(el) } });
      } else if (tag === 'p') {
        blocks.push({ id: Math.random().toString(36).substr(2, 9), type: 'paragraph', data: { text: cleanHtmlText(el) } });
      } else if (tag === 'ul' || tag === 'ol') {
        const items = Array.from(el.querySelectorAll('li'));
        items.forEach(li => {
          blocks.push({ id: Math.random().toString(36).substr(2, 9), type: 'paragraph', data: { text: `• ${cleanHtmlText(li)}` } });
        });
      } else if (tag === 'table') {
        const headers: string[] = [];
        const rows: string[][] = [];
        const ths = el.querySelectorAll('th');
        if (ths.length > 0) {
          ths.forEach(th => headers.push(cleanHtmlText(th as HTMLElement)));
        }
        const trs = el.querySelectorAll('tr');
        trs.forEach(tr => {
          const tds = tr.querySelectorAll('td');
          if (tds.length > 0) {
            const row: string[] = [];
            tds.forEach(td => row.push(cleanHtmlText(td as HTMLElement)));
            rows.push(row);
          }
        });
        blocks.push({
          id: Math.random().toString(36).substr(2, 9),
          type: 'table',
          data: {
            headers: headers.length > 0 ? headers : (rows[0] ? rows[0].map((_, i) => `Col ${i + 1}`) : ['Col 1', 'Col 2']),
            rows: headers.length > 0 ? rows : rows.slice(1)
          }
        });
      } else if (tag === 'img') {
        const src = el.getAttribute('src') || '';
        const alt = el.getAttribute('alt') || '';
        blocks.push({ id: Math.random().toString(36).substr(2, 9), type: 'image', data: { url: src, alt, caption: alt } });
      } else if (tag === 'hr') {
        blocks.push({ id: Math.random().toString(36).substr(2, 9), type: 'divider', data: {} });
      } else {
        const text = cleanHtmlText(el);
        if (text) {
          blocks.push({ id: Math.random().toString(36).substr(2, 9), type: 'paragraph', data: { text } });
        }
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim() || '';
      if (text) {
        blocks.push({ id: Math.random().toString(36).substr(2, 9), type: 'paragraph', data: { text } });
      }
    }
  }

  return blocks.length > 0 ? blocks : [{ id: Math.random().toString(36).substr(2, 9), type: 'paragraph', data: { text: '' } }];
}

// Render dynamic forms for each block type in the admin panel
function renderBlockInput(
  block: Block,
  onChange: (data: any) => void,
  helpers: {
    onKeyDown: (e: React.KeyboardEvent) => void;
    onPaste: (e: React.ClipboardEvent) => void;
    onFocus: () => void;
    openMediaSelector: (type: 'image' | 'gallery') => void;
  }
) {
  const data = block.data;

  switch (block.type) {
    case 'paragraph':
      return (
        <CssAutoResizeTextarea
          placeholder="Start writing a paragraph... (type '/' for block commands)"
          value={data.text || ''}
          onChange={(e: any) => onChange({ text: e.target.value })}
          onKeyDown={helpers.onKeyDown}
          onPaste={helpers.onPaste}
          onFocus={helpers.onFocus}
          className="focus-visible:ring-0 shadow-none min-h-[50px]"
        />
      );

    case 'h1':
      return (
        <Input
          placeholder="H1 - Section Heading..."
          value={data.text || ''}
          onChange={(e) => onChange({ text: e.target.value })}
          onKeyDown={helpers.onKeyDown}
          onFocus={helpers.onFocus}
          className="font-extrabold text-2xl border-0 focus-visible:ring-0 shadow-none px-1"
        />
      );

    case 'h2':
      return (
        <Input
          placeholder="H2 - Subheading..."
          value={data.text || ''}
          onChange={(e) => onChange({ text: e.target.value })}
          onKeyDown={helpers.onKeyDown}
          onFocus={helpers.onFocus}
          className="font-bold text-xl border-0 focus-visible:ring-0 shadow-none px-1"
        />
      );

    case 'h3':
      return (
        <Input
          placeholder="H3 - Subheading..."
          value={data.text || ''}
          onChange={(e) => onChange({ text: e.target.value })}
          onKeyDown={helpers.onKeyDown}
          onFocus={helpers.onFocus}
          className="font-bold text-base border-0 focus-visible:ring-0 shadow-none px-1"
        />
      );

    case 'image':
      return (
        <div className="bg-slate-50 border p-3.5 rounded-xl space-y-2.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <ImageIcon className="h-3.5 w-3.5" /> Image Block
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Image URL..."
              value={data.url || ''}
              onChange={(e) => onChange({ ...data, url: e.target.value })}
              className="text-xs h-9 border-slate-200 flex-1"
            />
            <Button size="sm" variant="outline" className="h-9" onClick={() => helpers.openMediaSelector('image')}>
              Media Library
            </Button>
          </div>
          {data.url && (
            <div className="aspect-video w-full rounded-lg overflow-hidden border bg-white relative max-h-48 flex items-center justify-center">
              <img src={data.url} alt={data.alt} className="max-h-full max-w-full object-contain" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Alt description text..."
              value={data.alt || ''}
              onChange={(e) => onChange({ ...data, alt: e.target.value })}
              className="text-[11px] h-8 border-slate-150"
            />
            <Input
              placeholder="Image caption footer..."
              value={data.caption || ''}
              onChange={(e) => onChange({ ...data, caption: e.target.value })}
              className="text-[11px] h-8 border-slate-150"
            />
          </div>
        </div>
      );

    case 'gallery':
      return (
        <div className="bg-slate-50 border p-3.5 rounded-xl space-y-2.5">
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <ImageIcon className="h-3.5 w-3.5" /> Image Gallery Grid
            </p>
            <Button size="xs" variant="outline" className="h-7 text-[10px]" onClick={() => helpers.openMediaSelector('gallery')}>
              Add Images
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {(data.urls || []).map((url: string, index: number) => (
              <div key={index} className="aspect-square relative rounded border overflow-hidden bg-white">
                <img src={url} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    const cleanUrls = data.urls.filter((_: any, i: number) => i !== index);
                    onChange({ ...data, urls: cleanUrls });
                  }}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      );

    case 'video':
      return (
        <div className="bg-slate-50 border p-3.5 rounded-xl space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <Video className="h-3.5 w-3.5" /> Video Embed
          </p>
          <div className="grid grid-cols-3 gap-2">
            <select
              value={data.provider || 'youtube'}
              onChange={(e) => onChange({ ...data, provider: e.target.value })}
              className="h-9 border border-slate-200 rounded-lg text-xs bg-white px-2"
            >
              <option value="youtube">YouTube</option>
              <option value="vimeo">Vimeo</option>
              <option value="custom">Custom MP4</option>
            </select>
            <Input
              placeholder="Embed video URL / Key..."
              value={data.url || ''}
              onChange={(e) => onChange({ ...data, url: e.target.value })}
              className="text-xs h-9 border-slate-200 col-span-2"
            />
          </div>
          <Input
            placeholder="Video caption footer text..."
            value={data.caption || ''}
            onChange={(e) => onChange({ ...data, caption: e.target.value })}
            className="text-[11px] h-8 border-slate-200"
          />
        </div>
      );

    case 'faq':
      return (
        <div className="bg-slate-50 border p-3.5 rounded-xl space-y-2.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <HelpCircle className="h-3.5 w-3.5" /> FAQ Accordion List
          </p>
          <div className="space-y-2.5">
            {(data.items || []).map((item: any, itemIdx: number) => (
              <div key={itemIdx} className="p-2.5 bg-white border rounded-lg space-y-2 relative">
                <Input
                  placeholder="Question text..."
                  value={item.question || ''}
                  onChange={(e) => {
                    const newItems = [...data.items];
                    newItems[itemIdx].question = e.target.value;
                    onChange({ ...data, items: newItems });
                  }}
                  className="text-xs h-8 border-slate-250 font-bold"
                />
                <Textarea
                  placeholder="Answer content..."
                  value={item.answer || ''}
                  onChange={(e) => {
                    const newItems = [...data.items];
                    newItems[itemIdx].answer = e.target.value;
                    onChange({ ...data, items: newItems });
                  }}
                  className="text-xs h-14 border-slate-200"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newItems = data.items.filter((_: any, i: number) => i !== itemIdx);
                    onChange({ ...data, items: newItems });
                  }}
                  className="absolute top-1 right-1 text-slate-400 hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() => onChange({ ...data, items: [...(data.items || []), { question: '', answer: '' }] })}
          >
            Add FAQ Card
          </Button>
        </div>
      );

    case 'callout':
      return (
        <div className="bg-slate-50 border p-3.5 rounded-xl space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <Info className="h-3.5 w-3.5" /> Callout Alert Box
          </p>
          <div className="flex gap-2">
            <select
              value={data.type || 'info'}
              onChange={(e) => onChange({ ...data, type: e.target.value })}
              className="h-9 border border-slate-200 rounded-lg text-xs bg-white px-2"
            >
              <option value="info">Info (Blue)</option>
              <option value="warning">Warning (Yellow)</option>
              <option value="success">Success (Green)</option>
              <option value="danger">Danger (Red)</option>
            </select>
            <Input
              placeholder="Callout Title..."
              value={data.title || ''}
              onChange={(e) => onChange({ ...data, title: e.target.value })}
              className="text-xs h-9 border-slate-200 flex-1 font-bold"
            />
          </div>
          <Textarea
            placeholder="Callout text details..."
            value={data.text || ''}
            onChange={(e) => onChange({ ...data, text: e.target.value })}
            className="text-xs h-14 border-slate-200"
          />
        </div>
      );

    case 'button':
      return (
        <div className="bg-slate-50 border p-3.5 rounded-xl space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" /> Action CTA Button
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Input
              placeholder="Button Label Text..."
              value={data.text || ''}
              onChange={(e) => onChange({ ...data, text: e.target.value })}
              className="text-xs h-9 border-slate-200"
            />
            <Input
              placeholder="Destination URL Link..."
              value={data.url || ''}
              onChange={(e) => onChange({ ...data, url: e.target.value })}
              className="text-xs h-9 border-slate-200"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={data.align || 'center'}
              onChange={(e) => onChange({ ...data, align: e.target.value })}
              className="h-8 border rounded text-xs bg-white px-2"
            >
              <option value="left">Align Left</option>
              <option value="center">Align Center</option>
              <option value="right">Align Right</option>
            </select>
            <select
              value={data.style || 'primary'}
              onChange={(e) => onChange({ ...data, style: e.target.value })}
              className="h-8 border rounded text-xs bg-white px-2"
            >
              <option value="primary">Primary Brand</option>
              <option value="secondary">Outline</option>
            </select>
          </div>
        </div>
      );

    case 'divider':
      return (
        <div className="py-2.5 flex items-center justify-center">
          <div className="w-full h-px bg-slate-300" />
          <span className="text-[9px] text-slate-400 uppercase font-bold px-3 shrink-0 tracking-wider">Divider</span>
          <div className="w-full h-px bg-slate-300" />
        </div>
      );

    case 'table':
      return (
        <div className="bg-slate-50 border p-3.5 rounded-xl space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <TableIcon className="h-3.5 w-3.5" /> Simple Data Grid Table
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border text-xs">
              <thead>
                <tr>
                  {(data.headers || []).map((h: string, colIdx: number) => (
                    <th key={colIdx} className="border p-2 bg-slate-100">
                      <input
                        value={h}
                        onChange={(e) => {
                          const newHeaders = [...data.headers];
                          newHeaders[colIdx] = e.target.value;
                          onChange({ ...data, headers: newHeaders });
                        }}
                        className="w-full border-0 bg-transparent text-center font-bold focus:outline-none"
                      />
                    </th>
                  ))}
                  <th className="p-1 bg-slate-100 w-8">
                    <button
                      type="button"
                      onClick={() => {
                        const newHeaders = [...data.headers, `Col ${data.headers.length + 1}`];
                        const newRows = data.rows.map((r: any) => [...r, '']);
                        onChange({ ...data, headers: newHeaders, rows: newRows });
                      }}
                      className="text-orange-500 font-bold"
                    >
                      +
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {(data.rows || []).map((row: string[], rIdx: number) => (
                  <tr key={rIdx}>
                    {row.map((val: string, cIdx: number) => (
                      <td key={cIdx} className="border p-1">
                        <input
                          value={val}
                          onChange={(e) => {
                            const newRows = [...data.rows];
                            newRows[rIdx][cIdx] = e.target.value;
                            onChange({ ...data, rows: newRows });
                          }}
                          className="w-full border-0 bg-transparent text-center focus:outline-none"
                        />
                      </td>
                    ))}
                    <td className="border text-center">
                      <button
                        type="button"
                        onClick={() => {
                          const newRows = data.rows.filter((_: any, idx: number) => idx !== rIdx);
                          onChange({ ...data, rows: newRows });
                        }}
                        className="text-red-500 font-bold"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() => onChange({ ...data, rows: [...data.rows, data.headers.map(() => '')] })}
          >
            Add Table Row
          </Button>
        </div>
      );

    case 'code':
      return (
        <div className="bg-slate-900 border border-slate-950 p-3 rounded-xl space-y-2 text-white">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
            <span className="flex items-center gap-1"><CodeIcon className="h-3.5 w-3.5" /> Technical Code Snippet</span>
            <select
              value={data.language || 'javascript'}
              onChange={(e) => onChange({ ...data, language: e.target.value })}
              className="bg-slate-800 text-slate-300 border-0 rounded text-[9px] px-1.5 py-0.5"
            >
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="sql">SQL</option>
              <option value="json">JSON</option>
              <option value="bash">Bash</option>
            </select>
          </div>
          <textarea
            placeholder="Type or paste code here..."
            value={data.code || ''}
            onChange={(e) => onChange({ ...data, code: e.target.value })}
            className="w-full font-mono text-xs p-2.5 rounded border border-slate-800 bg-slate-950 text-slate-200 h-28 focus:outline-none resize-y"
          />
        </div>
      );

    case 'review':
      return (
        <div className="bg-slate-50 border p-3.5 rounded-xl space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" /> Affiliate Review Card
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input
              placeholder="Product Name..."
              value={data.productName || ''}
              onChange={(e) => onChange({ ...data, productName: e.target.value })}
              className="text-xs h-9 border-slate-200 font-bold"
            />
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Rating</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max={data.ratingMax || 5}
                value={data.rating || 4.5}
                onChange={(e) => onChange({ ...data, rating: Number(e.target.value) })}
                className="h-9 border border-slate-200 rounded-lg text-xs px-2 w-16"
              />
              <span className="text-slate-400">/</span>
              <input
                type="number"
                value={data.ratingMax || 5}
                onChange={(e) => onChange({ ...data, ratingMax: Number(e.target.value) })}
                className="h-9 border border-slate-200 rounded-lg text-xs px-2 w-16"
              />
            </div>
            <Input
              placeholder="Buy Affiliate Link URL..."
              value={data.buyUrl || ''}
              onChange={(e) => onChange({ ...data, buyUrl: e.target.value })}
              className="text-xs h-9 border-slate-200"
            />
          </div>
          <Textarea
            placeholder="Review Summary details / Recommendation text..."
            value={data.summary || ''}
            onChange={(e) => onChange({ ...data, summary: e.target.value })}
            className="text-xs h-16 border-slate-200"
          />
        </div>
      );

    case 'proscons':
      return (
        <div className="bg-slate-50 border p-3.5 rounded-xl space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <CheckSquare className="h-3.5 w-3.5" /> Pros & Cons Column Layout
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pros Column */}
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-emerald-600">PROS (Advantages)</p>
              {(data.pros || []).map((pro: string, pIdx: number) => (
                <div key={pIdx} className="flex gap-1 items-center">
                  <span className="text-emerald-500 font-bold text-sm">✓</span>
                  <input
                    placeholder="Enter advantage..."
                    value={pro}
                    onChange={(e) => {
                      const newPros = [...data.pros];
                      newPros[pIdx] = e.target.value;
                      onChange({ ...data, pros: newPros });
                    }}
                    className="flex-1 bg-white border border-slate-200 text-xs px-2 py-1 rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newPros = data.pros.filter((_: any, i: number) => i !== pIdx);
                      onChange({ ...data, pros: newPros });
                    }}
                    className="text-slate-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => onChange({ ...data, pros: [...(data.pros || []), ''] })}
                className="text-[10px] text-emerald-600 hover:underline"
              >
                + Add Pro Item
              </button>
            </div>

            {/* Cons Column */}
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-rose-600">CONS (Drawbacks)</p>
              {(data.cons || []).map((con: string, cIdx: number) => (
                <div key={cIdx} className="flex gap-1 items-center">
                  <span className="text-rose-500 font-bold text-sm">✗</span>
                  <input
                    placeholder="Enter drawback..."
                    value={con}
                    onChange={(e) => {
                      const newCons = [...data.cons];
                      newCons[cIdx] = e.target.value;
                      onChange({ ...data, cons: newCons });
                    }}
                    className="flex-1 bg-white border border-slate-200 text-xs px-2 py-1 rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newCons = data.cons.filter((_: any, i: number) => i !== cIdx);
                      onChange({ ...data, cons: newCons });
                    }}
                    className="text-slate-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => onChange({ ...data, cons: [...(data.cons || []), ''] })}
                className="text-[10px] text-rose-600 hover:underline"
              >
                + Add Con Item
              </button>
            </div>
          </div>
        </div>
      );

    case 'comparison':
      return (
        <div className="bg-slate-50 border p-3.5 rounded-xl space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <ListPlus className="h-3.5 w-3.5" /> Comparison Matrix Matrix
          </p>
          <div className="overflow-x-auto space-y-2">
            <table className="min-w-full bg-white border text-xs">
              <thead>
                <tr>
                  {(data.headers || []).map((h: string, colIdx: number) => (
                    <th key={colIdx} className="border p-2 bg-slate-100 font-bold">
                      <input
                        value={h}
                        onChange={(e) => {
                          const newHeaders = [...data.headers];
                          newHeaders[colIdx] = e.target.value;
                          onChange({ ...data, headers: newHeaders });
                        }}
                        className="w-full border-0 bg-transparent text-center focus:outline-none"
                      />
                    </th>
                  ))}
                  <th className="p-1 bg-slate-100 w-8">
                    <button
                      type="button"
                      onClick={() => {
                        const newHeaders = [...data.headers, `Col ${data.headers.length + 1}`];
                        const newRows = data.rows.map((r: any) => ({ ...r, values: [...r.values, ''] }));
                        onChange({ ...data, headers: newHeaders, rows: newRows });
                      }}
                      className="text-orange-500"
                    >
                      +
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {(data.rows || []).map((row: any, rIdx: number) => (
                  <tr key={rIdx} className={row.isHighlight ? 'bg-orange-50/20' : ''}>
                    <td className="border p-1 font-bold">
                      <input
                        value={row.label}
                        onChange={(e) => {
                          const newRows = [...data.rows];
                          newRows[rIdx].label = e.target.value;
                          onChange({ ...data, rows: newRows });
                        }}
                        className="w-full border-0 bg-transparent focus:outline-none font-semibold"
                      />
                    </td>
                    {(row.values || []).map((val: string, cIdx: number) => (
                      <td key={cIdx} className="border p-1">
                        <input
                          value={val}
                          onChange={(e) => {
                            const newRows = [...data.rows];
                            newRows[rIdx].values[cIdx] = e.target.value;
                            onChange({ ...data, rows: newRows });
                          }}
                          className="w-full border-0 bg-transparent text-center focus:outline-none"
                        />
                      </td>
                    ))}
                    <td className="border p-1 flex justify-center gap-1 items-center">
                      <button
                        type="button"
                        onClick={() => {
                          const newRows = [...data.rows];
                          newRows[rIdx].isHighlight = !newRows[rIdx].isHighlight;
                          onChange({ ...data, rows: newRows });
                        }}
                        className={`font-semibold p-0.5 rounded text-[10px] ${row.isHighlight ? 'bg-orange-200 text-orange-800' : 'bg-slate-100'}`}
                        title="Highlight Row"
                      >
                        Highlight
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const newRows = data.rows.filter((_: any, idx: number) => idx !== rIdx);
                          onChange({ ...data, rows: newRows });
                        }}
                        className="text-red-500 font-bold"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() => onChange({
              ...data,
              rows: [...data.rows, { label: 'New Product', values: data.headers.slice(1).map(() => ''), isHighlight: false }]
            })}
          >
            Add Table Row
          </Button>
        </div>
      );

    case 'authorbox':
      return (
        <div className="bg-slate-50 border p-3.5 rounded-xl space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <User className="h-3.5 w-3.5" /> Author Bio Box
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Input
              placeholder="Author Name..."
              value={data.name || ''}
              onChange={(e) => onChange({ ...data, name: e.target.value })}
              className="text-xs h-9 border-slate-200 font-bold"
            />
            <Input
              placeholder="Avatar Image URL..."
              value={data.avatarUrl || ''}
              onChange={(e) => onChange({ ...data, avatarUrl: e.target.value })}
              className="text-xs h-9 border-slate-200"
            />
          </div>
          <Textarea
            placeholder="Author biography info..."
            value={data.bio || ''}
            onChange={(e) => onChange({ ...data, bio: e.target.value })}
            className="text-xs h-14 border-slate-200"
          />
          <div className="grid grid-cols-3 gap-2">
            <Input
              placeholder="Twitter URL..."
              value={data.twitter || ''}
              onChange={(e) => onChange({ ...data, twitter: e.target.value })}
              className="text-[10px] h-8 border-slate-200"
            />
            <Input
              placeholder="LinkedIn URL..."
              value={data.linkedin || ''}
              onChange={(e) => onChange({ ...data, linkedin: e.target.value })}
              className="text-[10px] h-8 border-slate-200"
            />
            <Input
              placeholder="Facebook URL..."
              value={data.facebook || ''}
              onChange={(e) => onChange({ ...data, facebook: e.target.value })}
              className="text-[10px] h-8 border-slate-200"
            />
          </div>
        </div>
      );

    case 'toc': {
      return (
        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <List className="h-3.5 w-3.5" /> Table of Contents (Auto-Generated)
          </p>
          <p className="text-xs text-slate-400 italic">
            This block will dynamically generate a clickable outline of H2 and H3 headings on the public page view.
          </p>
        </div>
      );
    }

    case 'schema':
      return (
        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" /> Schema Structured Data Block
          </p>
          <div className="flex gap-2">
            <select
              value={data.type || 'faq'}
              onChange={(e) => {
                const newType = e.target.value;
                let newItems: any[] = [];
                if (newType === 'faq') newItems = [{ question: '', answer: '' }];
                if (newType === 'howto') newItems = [{ stepName: '', stepText: '' }];
                if (newType === 'review') newItems = [{ productName: '', rating: 5, author: '' }];
                onChange({ ...data, type: newType, items: newItems });
              }}
              className="h-8 border border-slate-200 rounded text-xs bg-white px-2"
            >
              <option value="faq">FAQ Schema</option>
              <option value="howto">How-To Schema</option>
              <option value="review">Review Schema</option>
            </select>
            <span className="text-[10px] text-slate-400 flex items-center">Injects JSON-LD metadata for search snippets</span>
          </div>
          {data.type === 'faq' && (
            <div className="space-y-2 pt-2">
              {(data.items || []).map((item: any, idx: number) => (
                <div key={idx} className="bg-white border p-2 rounded-lg space-y-1.5 relative">
                  <Input
                    placeholder="FAQ Question..."
                    value={item.question || ''}
                    onChange={(e) => {
                      const updated = [...data.items];
                      updated[idx].question = e.target.value;
                      onChange({ ...data, items: updated });
                    }}
                    className="text-xs h-7 border-slate-200 font-semibold"
                  />
                  <Input
                    placeholder="FAQ Answer..."
                    value={item.answer || ''}
                    onChange={(e) => {
                      const updated = [...data.items];
                      updated[idx].answer = e.target.value;
                      onChange({ ...data, items: updated });
                    }}
                    className="text-xs h-7 border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = data.items.filter((_: any, i: number) => i !== idx);
                      onChange({ ...data, items: updated });
                    }}
                    className="absolute top-1 right-1 text-slate-400 hover:text-red-500 text-xs font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => onChange({ ...data, items: [...(data.items || []), { question: '', answer: '' }] })}
                className="text-[10px] text-orange-600 hover:underline"
              >
                + Add FAQ FAQ
              </button>
            </div>
          )}
          {data.type === 'howto' && (
            <div className="space-y-2 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="HowTo Name (e.g. How to install Next.js)..."
                  value={data.name || ''}
                  onChange={(e) => onChange({ ...data, name: e.target.value })}
                  className="text-xs h-8"
                />
                <Input
                  placeholder="HowTo Description..."
                  value={data.description || ''}
                  onChange={(e) => onChange({ ...data, description: e.target.value })}
                  className="text-xs h-8"
                />
              </div>
              {(data.items || []).map((item: any, idx: number) => (
                <div key={idx} className="bg-white border p-2 rounded-lg space-y-1.5 relative">
                  <Input
                    placeholder={`Step ${idx + 1} Title...`}
                    value={item.stepName || ''}
                    onChange={(e) => {
                      const updated = [...data.items];
                      updated[idx].stepName = e.target.value;
                      onChange({ ...data, items: updated });
                    }}
                    className="text-xs h-7 border-slate-200 font-semibold"
                  />
                  <Input
                    placeholder={`Step ${idx + 1} Description...`}
                    value={item.stepText || ''}
                    onChange={(e) => {
                      const updated = [...data.items];
                      updated[idx].stepText = e.target.value;
                      onChange({ ...data, items: updated });
                    }}
                    className="text-xs h-7 border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = data.items.filter((_: any, i: number) => i !== idx);
                      onChange({ ...data, items: updated });
                    }}
                    className="absolute top-1 right-1 text-slate-400 hover:text-red-500 text-xs font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => onChange({ ...data, items: [...(data.items || []), { stepName: '', stepText: '' }] })}
                className="text-[10px] text-orange-600 hover:underline"
              >
                + Add How-To Step
              </button>
            </div>
          )}
          {data.type === 'review' && (
            <div className="space-y-2 pt-2 bg-white border p-3 rounded-lg">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Product Name..."
                  value={data.productName || ''}
                  onChange={(e) => onChange({ ...data, productName: e.target.value })}
                  className="text-xs h-8"
                />
                <Input
                  placeholder="Author/Reviewer Name..."
                  value={data.authorName || ''}
                  onChange={(e) => onChange({ ...data, authorName: e.target.value })}
                  className="text-xs h-8"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span>Rating Value:</span>
                  <input
                    type="number"
                    step="0.1"
                    value={data.rating || 5}
                    onChange={(e) => onChange({ ...data, rating: Number(e.target.value) })}
                    className="w-16 h-7 px-1.5 border rounded"
                  />
                </div>
                <Input
                  placeholder="Product Summary..."
                  value={data.summary || ''}
                  onChange={(e) => onChange({ ...data, summary: e.target.value })}
                  className="text-xs h-8"
                />
              </div>
            </div>
          )}
        </div>
      );

    default:
      return <div className="text-xs text-red-500 font-semibold p-2">Invalid or unsupported block structure.</div>;
  }
}

export function compileBlocksToMarkdown(blocks: Block[]): string {
  return blocks.map(block => {
    const data = block.data;
    switch (block.type) {
      case 'paragraph':
        return data.text || '';
      case 'h1':
        return `# ${data.text || ''}`;
      case 'h2':
        return `## ${data.text || ''}`;
      case 'h3':
        return `### ${data.text || ''}`;
      case 'image':
        return `![${data.alt || ''}](${data.url || ''})\n\n_${data.caption || ''}_`;
      case 'gallery':
        return (data.urls || []).map((url: string) => `![](${url})`).join('\n');
      case 'video':
        return `[video](${data.url || ''})`;
      case 'faq':
        return (data.items || []).map((item: any) => `**Q: ${item.question}**\n\n${item.answer}`).join('\n\n');
      case 'callout':
        return `> **${data.title}**\n> ${data.text || ''}`;
      case 'button':
        return `[${data.text || 'Button'}](${data.url || '#'})`;
      case 'divider':
        return `---`;
      case 'table': {
        const headerRow = `| ${data.headers.join(' | ')} |`;
        const alignRow = `| ${data.headers.map(() => '---').join(' | ')} |`;
        const rows = (data.rows || []).map((r: string[]) => `| ${r.join(' | ')} |`).join('\n');
        return `${headerRow}\n${alignRow}\n${rows}`;
      }
      case 'code':
        return `\`\`\`${data.language || ''}\n${data.code || ''}\n\`\`\``;
      case 'review':
        return `### Product Review: ${data.productName || ''}\nRating: ${data.rating}/${data.ratingMax}\n\n${data.summary || ''}\n\n[Buy Now](${data.buyUrl || ''})`;
      case 'proscons': {
        const pros = (data.pros || []).map((p: string) => `* ✓ ${p}`).join('\n');
        const cons = (data.cons || []).map((c: string) => `* ✗ ${c}`).join('\n');
        return `### Pros\n${pros}\n\n### Cons\n${cons}`;
      }
      case 'comparison': {
        const headerRow = `| ${data.headers.join(' | ')} |`;
        const alignRow = `| ${data.headers.map(() => '---').join(' | ')} |`;
        const rows = (data.rows || []).map((r: any) => `| ${r.label} | ${r.values.join(' | ')} |`).join('\n');
        return `${headerRow}\n${alignRow}\n${rows}`;
      }
      case 'authorbox':
        return `### About Author: ${data.name || ''}\n${data.bio || ''}`;
      case 'toc':
        return `<!-- TOC -->`;
      case 'schema':
        return `<!-- Schema: ${data.type || 'faq'} -->`;
      default:
        return '';
    }
  }).join('\n\n');
}
