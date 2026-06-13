'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, Loader2, RefreshCw, ExternalLink } from 'lucide-react';

interface PageItem {
  id: number;
  title: string;
  slug: string;
  template_name: string;
  status: string;
  created_at: string;
}

export default function PagesListClient() {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pages');
      if (res.ok) {
        setPages(await res.json());
      }
    } catch (err) {
      console.error('Error fetching pages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this static page?')) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/pages/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPages(pages.filter(p => p.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete page');
      }
    } catch (err) {
      console.error('Error deleting page:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Static Pages</h1>
          <p className="text-slate-500 mt-1">Manage dynamic content pages like About, Contact, Terms, and Privacy Policy.</p>
        </div>
        <Link href="/admin/pages/new" className={buttonVariants({ className: "bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/10 flex items-center gap-2" })}>
          <PlusCircle className="h-4 w-4" />
          Create New Page
        </Link>
      </div>

      {/* Pages Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
            <p className="text-slate-400 text-sm">Loading pages...</p>
          </div>
        ) : pages.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p className="font-semibold text-slate-600">No Static Pages Found</p>
            <p className="text-sm mt-1">Scaffold your corporate pages by clicking 'Create New Page'.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/70 border-b border-slate-100">
              <TableRow>
                <TableHead className="font-bold text-slate-700">Title</TableHead>
                <TableHead className="font-bold text-slate-700">Slug</TableHead>
                <TableHead className="font-bold text-slate-700">Template</TableHead>
                <TableHead className="font-bold text-slate-700">Status</TableHead>
                <TableHead className="font-bold text-slate-700">Created Date</TableHead>
                <TableHead className="text-right font-bold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((p) => (
                <TableRow key={p.id} className="hover:bg-slate-50/50">
                  <TableCell className="font-medium text-slate-900 truncate max-w-xs">{p.title}</TableCell>
                  <TableCell className="text-slate-500 font-mono text-xs">/{p.slug}</TableCell>
                  <TableCell className="text-slate-500 text-sm font-semibold">{p.template_name}</TableCell>
                  <TableCell>
                    <span className={`capitalize px-2.5 py-1 rounded-full text-xs font-semibold ${
                      p.status === 'published'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {p.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {new Date(p.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/${p.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={buttonVariants({ variant: "ghost", size: "icon", className: "h-8 w-8 text-slate-500 hover:text-orange-500" })}
                        title="View Public Page"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                      <Link href={`/admin/pages/${p.id}`} className={buttonVariants({ variant: "ghost", size: "icon", className: "h-8 w-8 text-slate-500 hover:text-orange-500" })} title="Edit Page">
                        <Edit className="h-4 w-4" />
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(p.id)}
                        disabled={deletingId === p.id}
                        title="Delete Page"
                      >
                        {deletingId === p.id ? (
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
