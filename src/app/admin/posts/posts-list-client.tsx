'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Search, Edit, Trash2, Eye, Loader2, RefreshCw } from 'lucide-react';

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

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      
      const res = await fetch(`/api/admin/posts?${params.toString()}`);
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
  }, [status]); // Fetch when status changes, search is handled on submit/debounce

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
      const res = await fetch(`/api/admin/posts/${id}`, { method: 'DELETE' });
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

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
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
          <Table>
            <TableHeader className="bg-slate-50/70 border-b border-slate-100">
              <TableRow>
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
                      <Link href={`/admin/posts/${post.id}`} className={buttonVariants({ variant: "ghost", size: "icon", className: "h-8 w-8 text-slate-500 hover:text-orange-500" })}>
                        <Edit className="h-4 w-4" />
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(post.id)}
                        disabled={deletingId === post.id}
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
        )}
      </div>
    </div>
  );
}
