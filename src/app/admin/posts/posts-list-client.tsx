'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Search, Edit, Trash2, Eye, Loader2, RefreshCw, ExternalLink, CheckSquare } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface PostItem {
  id: number;
  title: string;
  slug: string;
  status: string;
  published_at: string | null;
  author_name: string;
  category_name: string | null;
  views: number;
}

export default function PostsListClient() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // New states for Advanced Filters & Bulk Delete
  const [categories, setCategories] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [authorId, setAuthorId] = useState('');
  const [selectedPostIds, setSelectedPostIds] = useState<number[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    async function loadFilters() {
      try {
        const catRes = await fetch((process.env.NEXT_PUBLIC_APP_URL || '') + '/api/admin/categories');
        if (catRes.ok) setCategories(await catRes.json());

        const userRes = await fetch((process.env.NEXT_PUBLIC_APP_URL || '') + '/api/admin/users');
        if (userRes.ok) setAuthors(await userRes.json());
      } catch (err) {
        console.error('Failed to load filters', err);
      }
    }
    loadFilters();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      if (categoryId) params.append('categoryId', categoryId);
      if (authorId) params.append('authorId', authorId);
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/admin/posts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    setSelectedPostIds([]); // Reset selection when filter changes
  }, [status, categoryId, authorId]); // Fetch when filters change, search is handled on submit/debounce

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/admin/posts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPosts(posts.filter(p => p.id !== id));
        setTotal(prev => prev - 1);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete post');
      }
    } catch (err) {
      console.error('Error deleting post:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPostIds(posts.map(p => p.id));
    } else {
      setSelectedPostIds([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedPostIds(prev => [...prev, id]);
    } else {
      setSelectedPostIds(prev => prev.filter(pId => pId !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPostIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedPostIds.length} posts? This action cannot be undone.`)) {
      return;
    }

    setBulkDeleting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/admin/posts`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedPostIds })
      });
      if (res.ok) {
        setPosts(posts.filter(p => !selectedPostIds.includes(p.id)));
        setTotal(prev => prev - selectedPostIds.length);
        setSelectedPostIds([]);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to bulk delete posts');
      }
    } catch (err) {
      console.error('Error bulk deleting posts:', err);
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Articles Management</h1>
          <p className="text-slate-500 mt-1">Create, edit, search, and delete blog articles.</p>
        </div>
        <Link href="/admin/posts/new" className={buttonVariants({ className: "bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/10 flex items-center gap-2" })}>
          <PlusCircle className="h-4 w-4" />
          Create New Article
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex w-full md:max-w-md items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by title, summary or content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 border-slate-200"
            />
          </div>
          <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white h-10">Search</Button>
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {authors.length > 0 && (
            <select
              value={authorId}
              onChange={(e) => setAuthorId(e.target.value)}
              className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="">All Authors</option>
              {authors.map((a: any) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          )}

          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          >
            <option value="">All Categories</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          >
            <option value="">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
          </select>

          <Button variant="outline" size="icon" onClick={fetchPosts} className="h-10 w-10 text-slate-500 border-slate-200">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
            <p className="text-slate-400 text-sm">Loading articles list...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p className="font-semibold text-slate-600">No Articles Found</p>
            <p className="text-sm mt-1">Try resetting filters or write your first post!</p>
          </div>
        ) : (
          <div>
            {selectedPostIds.length > 0 && (
              <div className="bg-red-50 border-b border-red-100 p-3 flex items-center justify-between animate-in slide-in-from-top-2">
                <span className="text-sm font-semibold text-red-700 flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" /> {selectedPostIds.length} posts selected
                </span>
                <Button 
                  onClick={handleBulkDelete} 
                  disabled={bulkDeleting}
                  variant="destructive" 
                  size="sm" 
                  className="h-8 shadow-sm flex items-center gap-1.5"
                >
                  {bulkDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Delete Selected
                </Button>
              </div>
            )}
            <Table>
              <TableHeader className="bg-slate-50/70 border-b border-slate-100">
                <TableRow>
                  <TableHead className="w-[50px] text-center">
                    <Checkbox 
                      checked={posts.length > 0 && selectedPostIds.length === posts.length} 
                      onCheckedChange={(checked) => handleSelectAll(!!checked)} 
                    />
                  </TableHead>
                  <TableHead className="font-bold text-slate-700">Title</TableHead>
                <TableHead className="font-bold text-slate-700">Author</TableHead>
                <TableHead className="font-bold text-slate-700">Category</TableHead>
                <TableHead className="font-bold text-slate-700">Status</TableHead>
                <TableHead className="font-bold text-slate-700">Views</TableHead>
                <TableHead className="font-bold text-slate-700">Published Date</TableHead>
                <TableHead className="text-right font-bold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id} className="hover:bg-slate-50/50">
                  <TableCell className="w-[50px] text-center">
                    <Checkbox 
                      checked={selectedPostIds.includes(post.id)}
                      onCheckedChange={(checked) => handleSelectOne(post.id, !!checked)}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-slate-900 max-w-xs truncate">
                    {post.title}
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">{post.author_name}</TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {post.category_name || <span className="text-slate-400 italic">None</span>}
                  </TableCell>
                  <TableCell>
                    <span className={`capitalize px-2.5 py-1 rounded-full text-xs font-semibold ${
                      post.status === 'published'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : post.status === 'scheduled'
                        ? 'bg-blue-50 text-blue-700 border border-blue-100'
                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {post.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm font-medium">
                    <span className="flex items-center gap-1.5">
                      <Eye className="h-4 w-4 text-slate-400" />
                      {post.views.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString()
                      : <span className="text-slate-400 italic">Not published</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/${post.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={buttonVariants({ variant: "ghost", size: "icon", className: "h-8 w-8 text-slate-500 hover:text-orange-500" })}
                        title="View Public Post"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                      <Link href={`/admin/posts/${post.id}`} className={buttonVariants({ variant: "ghost", size: "icon", className: "h-8 w-8 text-slate-500 hover:text-orange-500" })} title="Edit Post">
                        <Edit className="h-4 w-4" />
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(post.id)}
                        disabled={deletingId === post.id}
                        title="Delete Post"
                      >
                        {deletingId === post.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        )}
      </div>
    </div>
  );
}
