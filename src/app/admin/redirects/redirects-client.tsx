'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Trash2, Shuffle } from 'lucide-react';

interface RedirectItem {
  id: number;
  old_url: string;
  new_url: string;
  status_code: number;
}

export default function RedirectsClient() {
  const [redirects, setRedirects] = useState<RedirectItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [oldUrl, setOldUrl] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [statusCode, setStatusCode] = useState('301');
  const [creating, setCreating] = useState(false);

  const fetchRedirects = async () => {
    try {
      const res = await fetch('/api/admin/redirects');
      if (res.ok) setRedirects(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRedirects();
  }, []);

  const handleAddRedirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldUrl || !newUrl) return;

    setCreating(true);
    try {
      const res = await fetch('/api/admin/redirects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          old_url: oldUrl,
          new_url: newUrl,
          status_code: Number(statusCode),
        }),
      });

      if (res.ok) {
        setOldUrl('');
        setNewUrl('');
        setStatusCode('301');
        fetchRedirects();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add redirect');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this redirect rule?')) return;
    try {
      const res = await fetch(`/api/admin/redirects/${id}`, { method: 'DELETE' });
      if (res.ok) fetchRedirects();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Redirects Manager</h1>
        <p className="text-slate-500 mt-1">Configure 301 and 302 URL redirects to preserve SEO juice when routing paths change.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Create Form */}
        <Card className="md:col-span-1 border-slate-200 shadow-sm bg-white h-fit">
          <CardHeader className="pb-3 border-b flex flex-row items-center gap-2">
            <Shuffle className="h-4 w-4 text-orange-500" />
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800">Add Redirect</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleAddRedirect} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Old URL Path</label>
                <Input
                  placeholder="e.g. /old-blog-path"
                  value={oldUrl}
                  onChange={(e) => setOldUrl(e.target.value)}
                  className="h-9 text-xs border-slate-200 focus:border-orange-500 focus:ring-orange-500/20"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">New URL Path</label>
                <Input
                  placeholder="e.g. /posts/new-seo-friendly-path"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="h-9 text-xs border-slate-200 focus:border-orange-500 focus:ring-orange-500/20"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Redirect Type</label>
                <select
                  value={statusCode}
                  onChange={(e) => setStatusCode(e.target.value)}
                  className="w-full h-9 px-2 rounded-lg border border-slate-200 bg-white text-xs"
                >
                  <option value="301">301 Moved Permanently</option>
                  <option value="302">302 Found (Temporary)</option>
                </select>
              </div>

              <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-9 mt-4 text-xs" disabled={creating}>
                {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
                Save Redirect
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Redirects List */}
        <Card className="md:col-span-2 border-slate-200 shadow-sm bg-white">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800">Redirect Rules</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-20 text-center"><Loader2 className="h-6 w-6 text-orange-500 animate-spin mx-auto" /></div>
            ) : redirects.length === 0 ? (
              <div className="py-20 text-center text-slate-400 text-xs">No active redirect rules found.</div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/70">
                  <TableRow>
                    <TableHead className="font-bold text-slate-700 text-xs">From Path</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs">Destination</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs">Type</TableHead>
                    <TableHead className="text-right font-bold text-slate-700 text-xs">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {redirects.map((red) => (
                    <TableRow key={red.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-mono text-[11px] text-slate-700 truncate max-w-xs">{red.old_url}</TableCell>
                      <TableCell className="font-mono text-[11px] text-orange-600 truncate max-w-xs">{red.new_url}</TableCell>
                      <TableCell className="text-xs font-semibold text-slate-500">{red.status_code}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(red.id)} className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
