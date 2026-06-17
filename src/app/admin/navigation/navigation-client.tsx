'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Loader2, 
  Save, 
  CheckCircle, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Edit, 
  Plus, 
  Link2, 
  File, 
  FolderOpen, 
  Tag, 
  Compass,
  Check,
  X
} from 'lucide-react';

interface MenuItem {
  id?: number;
  label: string;
  url: string;
  order_no: number;
}

interface PageItem {
  id: number;
  title: string;
  slug: string;
  status: string;
}

interface CategoryItem {
  id: number;
  name: string;
  slug: string;
}

interface TagItem {
  id: number;
  name: string;
  slug: string;
}

export default function NavigationClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Data states
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);

  // Add Item states
  const [linkType, setLinkType] = useState<'custom' | 'page' | 'category' | 'tag' | 'common'>('custom');
  const [customLabel, setCustomLabel] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [selectedPageId, setSelectedPageId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedTagId, setSelectedTagId] = useState('');
  const [selectedCommonKey, setSelectedCommonKey] = useState('/');

  // Inline Edit states
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editUrl, setEditUrl] = useState('');

  // Fetch all resources
  useEffect(() => {
    async function loadData() {
      try {
        const [menuRes, pagesRes, catsRes, tagsRes] = await Promise.all([
          fetch((process.env.NEXT_PUBLIC_APP_URL || '') + '/api/admin/menus?slug=header'),
          fetch((process.env.NEXT_PUBLIC_APP_URL || '') + '/api/admin/pages'),
          fetch((process.env.NEXT_PUBLIC_APP_URL || '') + '/api/admin/categories'),
          fetch((process.env.NEXT_PUBLIC_APP_URL || '') + '/api/admin/tags')
        ]);

        if (menuRes.ok) {
          const menuData = await menuRes.json();
          setMenuItems(menuData.items || []);
        }
        if (pagesRes.ok) {
          const pagesData = await pagesRes.json();
          // Filter to only allow published pages to be easily linked
          setPages(pagesData.filter((p: PageItem) => p.status === 'published'));
        }
        if (catsRes.ok) {
          setCategories(await catsRes.json());
        }
        if (tagsRes.ok) {
          setTags(await tagsRes.json());
        }
      } catch (err) {
        console.error('Failed to load menu or resource lists:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Handle Adding Item
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();

    let label = '';
    let url = '';

    if (linkType === 'custom') {
      if (!customLabel || !customUrl) return;
      label = customLabel;
      url = customUrl;
    } else if (linkType === 'page') {
      const page = pages.find(p => String(p.id) === selectedPageId);
      if (!page) return;
      label = page.title;
      url = `/${page.slug}`;
    } else if (linkType === 'category') {
      const cat = categories.find(c => String(c.id) === selectedCategoryId);
      if (!cat) return;
      label = cat.name;
      url = `/posts?category=${cat.slug}`;
    } else if (linkType === 'tag') {
      const tagItem = tags.find(t => String(t.id) === selectedTagId);
      if (!tagItem) return;
      label = tagItem.name;
      url = `/posts?tag=${tagItem.slug}`;
    } else if (linkType === 'common') {
      if (selectedCommonKey === '/') {
        label = 'Home';
        url = '/';
      } else if (selectedCommonKey === '/posts') {
        label = 'Articles';
        url = '/posts';
      } else if (selectedCommonKey === '/admin') {
        label = 'Portal';
        url = '/admin';
      }
    }

    const newItem: MenuItem = {
      label: label.trim(),
      url: url.trim(),
      order_no: menuItems.length
    };

    setMenuItems([...menuItems, newItem]);

    // Reset inputs
    setCustomLabel('');
    setCustomUrl('');
    setSelectedPageId('');
    setSelectedCategoryId('');
    setSelectedTagId('');
  };

  // Reordering handler
  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...menuItems];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    // Swap
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    // Re-index order numbers
    const reindexed = newItems.map((item, idx) => ({
      ...item,
      order_no: idx
    }));

    setMenuItems(reindexed);
    if (editingIndex === index) setEditingIndex(targetIndex);
    else if (editingIndex === targetIndex) setEditingIndex(index);
  };

  // Delete handler
  const handleDeleteItem = (index: number) => {
    const filtered = menuItems.filter((_, idx) => idx !== index);
    const reindexed = filtered.map((item, idx) => ({
      ...item,
      order_no: idx
    }));
    setMenuItems(reindexed);
    setEditingIndex(null);
  };

  // Edit inline setup
  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditLabel(menuItems[index].label);
    setEditUrl(menuItems[index].url);
  };

  const saveInlineEdit = (index: number) => {
    if (!editLabel.trim() || !editUrl.trim()) return;
    const updated = [...menuItems];
    updated[index] = {
      ...updated[index],
      label: editLabel.trim(),
      url: editUrl.trim()
    };
    setMenuItems(updated);
    setEditingIndex(null);
  };

  const cancelInlineEdit = () => {
    setEditingIndex(null);
  };

  // Save full menu to DB
  const handleSaveMenu = async () => {
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch((process.env.NEXT_PUBLIC_APP_URL || '') + '/api/admin/menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Header Menu',
          slug: 'header',
          items: menuItems
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        alert('Failed to save header navigation menu');
      }
    } catch (err) {
      console.error('Save menu error:', err);
      alert('Error updating navigation menu settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
        <p className="text-slate-500 font-medium">Loading navigation settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Navigation Configuration</h1>
        <p className="text-slate-500 mt-1">Dynamically manage links, labels, and order for the main website header menu.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Link generator / form selector */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Plus className="h-5 w-5 text-orange-500" />
                Add Link Item
              </CardTitle>
              <CardDescription>Select the link source and specify navigation labels.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddItem} className="space-y-4">
                
                {/* Link Type Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Link Source</label>
                  <select
                    value={linkType}
                    onChange={(e) => setLinkType(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20"
                  >
                    <option value="custom">Custom Link / External URL</option>
                    <option value="page">Static Page</option>
                    <option value="category">Category</option>
                    <option value="tag">Tag</option>
                    <option value="common">Common Views</option>
                  </select>
                </div>

                <div className="h-px bg-slate-100 my-2" />

                {/* Custom Link Fields */}
                {linkType === 'custom' && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Link Label</label>
                      <Input
                        placeholder="e.g. Help Center"
                        value={customLabel}
                        onChange={(e) => setCustomLabel(e.target.value)}
                        className="h-10 border-slate-200 text-sm"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Target URL</label>
                      <Input
                        placeholder="e.g. /support or https://example.com"
                        value={customUrl}
                        onChange={(e) => setCustomUrl(e.target.value)}
                        className="h-10 border-slate-200 text-sm"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Page Fields */}
                {linkType === 'page' && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Select Page</label>
                      {pages.length === 0 ? (
                        <div className="text-xs text-amber-600 bg-amber-50 border border-amber-100 p-2.5 rounded-lg">
                          No published static pages available to select.
                        </div>
                      ) : (
                        <select
                          value={selectedPageId}
                          onChange={(e) => setSelectedPageId(e.target.value)}
                          className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm"
                          required
                        >
                          <option value="">-- Select Page --</option>
                          {pages.map((p) => (
                            <option key={p.id} value={p.id}>{p.title} (/{p.slug})</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                )}

                {/* Category Fields */}
                {linkType === 'category' && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Select Category</label>
                      {categories.length === 0 ? (
                        <div className="text-xs text-amber-600 bg-amber-50 border border-amber-100 p-2.5 rounded-lg">
                          No categories configured.
                        </div>
                      ) : (
                        <select
                          value={selectedCategoryId}
                          onChange={(e) => setSelectedCategoryId(e.target.value)}
                          className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm"
                          required
                        >
                          <option value="">-- Select Category --</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name} (/{c.slug})</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                )}

                {/* Tag Fields */}
                {linkType === 'tag' && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Select Tag</label>
                      {tags.length === 0 ? (
                        <div className="text-xs text-amber-600 bg-amber-50 border border-amber-100 p-2.5 rounded-lg">
                          No tags configured.
                        </div>
                      ) : (
                        <select
                          value={selectedTagId}
                          onChange={(e) => setSelectedTagId(e.target.value)}
                          className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm"
                          required
                        >
                          <option value="">-- Select Tag --</option>
                          {tags.map((t) => (
                            <option key={t.id} value={t.id}>#{t.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                )}

                {/* Common Views Fields */}
                {linkType === 'common' && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Select View</label>
                      <select
                        value={selectedCommonKey}
                        onChange={(e) => setSelectedCommonKey(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm"
                        required
                      >
                        <option value="/">Home Page ( / )</option>
                        <option value="/posts">All Articles ( /posts )</option>
                        <option value="/admin">CMS Portal Login ( /admin )</option>
                      </select>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white w-full h-10 mt-2 text-sm font-bold shadow-md shadow-orange-500/10 flex items-center justify-center gap-1.5"
                  disabled={
                    (linkType === 'custom' && (!customLabel || !customUrl)) ||
                    (linkType === 'page' && !selectedPageId) ||
                    (linkType === 'category' && !selectedCategoryId) ||
                    (linkType === 'tag' && !selectedTagId)
                  }
                >
                  <Plus className="h-4 w-4" />
                  Add to Menu Structure
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Menu item list reordering and edit */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Compass className="h-5 w-5 text-orange-500" />
                Menu Structure
              </CardTitle>
              <CardDescription>Drag, reorder, and refine current header items.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {menuItems.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <p className="font-semibold text-slate-500">Navigation Menu is Empty</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Add links from the panel on the left to start building your dynamic header.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                  {menuItems.map((item, index) => {
                    const isEditing = editingIndex === index;
                    
                    return (
                      <div
                        key={index}
                        className={`group p-3 border rounded-xl flex items-center justify-between gap-4 transition-all duration-150 ${
                          isEditing 
                            ? 'border-orange-200 bg-orange-50/20 shadow-inner' 
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                        }`}
                      >
                        {/* Drag indicator icon placeholder & source tag */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100/60 shrink-0 text-slate-400">
                            {item.url.startsWith('/posts?category') && <FolderOpen className="h-4 w-4 text-emerald-500" />}
                            {item.url.startsWith('/posts?tag') && <Tag className="h-4 w-4 text-purple-500" />}
                            {!item.url.startsWith('/posts?category') && !item.url.startsWith('/posts?tag') && item.url !== '/' && item.url !== '/posts' && item.url !== '/admin' && <File className="h-4 w-4 text-orange-500" />}
                            {(item.url === '/' || item.url === '/posts' || item.url === '/admin') && <Compass className="h-4 w-4 text-sky-500" />}
                          </div>

                          {isEditing ? (
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <Input
                                value={editLabel}
                                onChange={(e) => setEditLabel(e.target.value)}
                                className="h-8 text-xs font-semibold"
                                placeholder="Link Label"
                              />
                              <Input
                                value={editUrl}
                                onChange={(e) => setEditUrl(e.target.value)}
                                className="h-8 text-xs font-mono text-slate-600"
                                placeholder="Target URL"
                              />
                            </div>
                          ) : (
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-800 truncate">{item.label}</p>
                              <p className="text-[10px] font-mono text-slate-400 truncate">{item.url}</p>
                            </div>
                          )}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isEditing ? (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => saveInlineEdit(index)}
                                className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                title="Save changes"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={cancelInlineEdit}
                                className="h-7 w-7 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                title="Cancel"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                disabled={index === 0}
                                onClick={() => moveItem(index, 'up')}
                                className="h-7 w-7 text-slate-400 hover:text-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
                                title="Move Up"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                disabled={index === menuItems.length - 1}
                                onClick={() => moveItem(index, 'down')}
                                className="h-7 w-7 text-slate-400 hover:text-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
                                title="Move Down"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => startEdit(index)}
                                className="h-7 w-7 text-slate-400 hover:text-orange-500 hover:bg-orange-50/50"
                                title="Edit inline"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDeleteItem(index)}
                                className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="h-px bg-slate-100 my-2" />

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Button 
                  onClick={handleSaveMenu} 
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-10 px-5 shadow-md shadow-orange-500/10 flex items-center gap-1.5"
                  disabled={saving}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Menu Setup
                </Button>
                {savedSuccess && (
                  <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-semibold animate-in fade-in duration-300">
                    <CheckCircle className="h-4 w-4" />
                    Header menu published!
                  </div>
                )}
              </div>

            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
