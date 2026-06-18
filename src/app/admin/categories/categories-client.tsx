'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Trash2, FolderPlus, Tags, Edit2, X } from 'lucide-react';

interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parent_id: number | null;
}

interface TagItem {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

export default function CategoriesClient() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingTags, setLoadingTags] = useState(true);

  // Category Form State
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catParent, setCatParent] = useState('');
  const [creatingCat, setCreatingCat] = useState(false);
  const [editCatId, setEditCatId] = useState<number | null>(null);

  // Tag Form State
  const [tagName, setTagName] = useState('');
  const [tagSlug, setTagSlug] = useState('');
  const [tagDesc, setTagDesc] = useState('');
  const [creatingTag, setCreatingTag] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_APP_URL || '') + '/api/admin/categories');
      if (res.ok) setCategories(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCats(false);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_APP_URL || '') + '/api/admin/tags');
      if (res.ok) setTags(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTags(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchTags();
  }, []);

  // Auto slugify category/tag names
  const handleCatNameChange = (val: string) => {
    setCatName(val);
    setCatSlug(val.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'));
  };

  const handleTagNameChange = (val: string) => {
    setTagName(val);
    setTagSlug(val.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'));
  };

  const handleEditCategory = (cat: CategoryItem) => {
    setEditCatId(cat.id);
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setCatDesc(cat.description || '');
    setCatParent(cat.parent_id?.toString() || '');
  };

  const handleCancelEditCat = () => {
    setEditCatId(null);
    setCatName('');
    setCatSlug('');
    setCatDesc('');
    setCatParent('');
  };

  // Add/Edit Category Handler
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName || !catSlug) return;

    setCreatingCat(true);
    try {
      const method = editCatId ? 'PUT' : 'POST';
      const url = editCatId
        ? `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/admin/categories/${editCatId}`
        : `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/admin/categories`;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: catName,
          slug: catSlug,
          description: catDesc,
          parent_id: catParent || null,
        }),
      });

      if (res.ok) {
        handleCancelEditCat();
        fetchCategories();
      } else {
        const err = await res.json();
        alert(err.error || `Failed to ${editCatId ? 'update' : 'add'} category`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingCat(false);
    }
  };

  // Add Tag Handler
  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName || !tagSlug) return;

    setCreatingTag(true);
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_APP_URL || '') + '/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tagName,
          slug: tagSlug,
          description: tagDesc,
        }),
      });

      if (res.ok) {
        setTagName('');
        setTagSlug('');
        setTagDesc('');
        fetchTags();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add tag');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingTag(false);
    }
  };

  // Delete handlers
  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/admin/categories/${id}`, { method: 'DELETE' });
      if (res.ok) fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTag = async (id: number) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/admin/tags/${id}`, { method: 'DELETE' });
      if (res.ok) fetchTags();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Taxonomies Management</h1>
        <p className="text-slate-500 mt-1">Manage article categories and tagging relationships.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Categories Section */}
        <div className="space-y-6">
          <Card className="border-slate-200/80 shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center gap-2.5 pb-4">
              <FolderPlus className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-lg font-bold">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Form */}
              <form onSubmit={handleAddCategory} className="space-y-3.5 mb-6 p-4 bg-slate-50/50 border rounded-xl">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  {editCatId ? 'Edit Category' : 'Add New Category'}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Name</label>
                    <Input
                      placeholder="e.g. Technology"
                      value={catName}
                      onChange={(e) => handleCatNameChange(e.target.value)}
                      className="h-9 text-xs border-slate-200"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Slug</label>
                    <Input
                      placeholder="technology"
                      value={catSlug}
                      onChange={(e) => setCatSlug(e.target.value)}
                      className="h-9 text-xs border-slate-200"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Parent Category</label>
                    <select
                      value={catParent}
                      onChange={(e) => setCatParent(e.target.value)}
                      className="w-full h-9 px-2 rounded-lg border border-slate-200 bg-white text-xs"
                    >
                      <option value="">None (Top Level)</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Description</label>
                    <Textarea
                      placeholder="Brief details..."
                      value={catDesc}
                      onChange={(e) => setCatDesc(e.target.value)}
                      className="min-h-[60px] text-xs border-slate-200"
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-2">
                  <Button type="submit" size="sm" className="bg-orange-500 hover:bg-orange-600 text-white flex-1 h-9 text-xs font-bold" disabled={creatingCat}>
                    {creatingCat ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (editCatId ? <Edit2 className="h-3.5 w-3.5 mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />)}
                    {editCatId ? 'Update Category' : 'Add Category'}
                  </Button>
                  {editCatId && (
                    <Button type="button" variant="outline" size="sm" onClick={handleCancelEditCat} className="h-9 text-xs font-bold" disabled={creatingCat}>
                      <X className="h-3.5 w-3.5 mr-1" /> Cancel
                    </Button>
                  )}
                </div>
              </form>

              {/* Table */}
              <div className="border border-slate-200/60 rounded-lg overflow-hidden">
                {loadingCats ? (
                  <div className="py-10 text-center"><Loader2 className="h-6 w-6 text-orange-500 animate-spin mx-auto" /></div>
                ) : categories.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs">No categories found.</div>
                ) : (
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-bold text-slate-700 text-xs">Name</TableHead>
                        <TableHead className="font-bold text-slate-700 text-xs">Slug</TableHead>
                        <TableHead className="text-right font-bold text-slate-700 text-xs">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((cat) => (
                        <TableRow key={cat.id} className="hover:bg-slate-50/50">
                          <TableCell className="text-xs font-semibold text-slate-800">
                            {cat.parent_id ? '— ' : ''}{cat.name}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500 font-mono">/{cat.slug}</TableCell>
                          <TableCell className="text-right flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEditCategory(cat)} className="h-7 w-7 text-slate-400 hover:text-blue-500 hover:bg-blue-50">
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(cat.id)} className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tags Section */}
        <div className="space-y-6">
          <Card className="border-slate-200/80 shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center gap-2.5 pb-4">
              <Tags className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-lg font-bold">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Form */}
              <form onSubmit={handleAddTag} className="space-y-3.5 mb-6 p-4 bg-slate-50/50 border rounded-xl">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Add New Tag</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Name</label>
                    <Input
                      placeholder="e.g. Tutorial"
                      value={tagName}
                      onChange={(e) => handleTagNameChange(e.target.value)}
                      className="h-9 text-xs border-slate-200"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Slug</label>
                    <Input
                      placeholder="tutorial"
                      value={tagSlug}
                      onChange={(e) => setTagSlug(e.target.value)}
                      className="h-9 text-xs border-slate-200"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Description</label>
                  <Textarea
                    placeholder="Brief description..."
                    value={tagDesc}
                    onChange={(e) => setTagDesc(e.target.value)}
                    className="min-h-[60px] text-xs border-slate-200"
                  />
                </div>

                <Button type="submit" size="sm" className="bg-orange-500 hover:bg-orange-600 text-white w-full h-9 mt-2 text-xs font-bold" disabled={creatingTag}>
                  {creatingTag ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
                  Add Tag
                </Button>
              </form>

              {/* Table */}
              <div className="border border-slate-200/60 rounded-lg overflow-hidden">
                {loadingTags ? (
                  <div className="py-10 text-center"><Loader2 className="h-6 w-6 text-orange-500 animate-spin mx-auto" /></div>
                ) : tags.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs">No tags found.</div>
                ) : (
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-bold text-slate-700 text-xs">Name</TableHead>
                        <TableHead className="font-bold text-slate-700 text-xs">Slug</TableHead>
                        <TableHead className="text-right font-bold text-slate-700 text-xs">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tags.map((tag) => (
                        <TableRow key={tag.id} className="hover:bg-slate-50/50">
                          <TableCell className="text-xs font-semibold text-slate-800">{tag.name}</TableCell>
                          <TableCell className="text-xs text-slate-500 font-mono">#{tag.slug}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteTag(tag.id)} className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
