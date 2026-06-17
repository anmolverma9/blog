'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Database, DownloadCloud, AlertTriangle, CheckCircle, Trash2, Search, FileDown } from 'lucide-react';

export default function ImportClientUI() {
  const [wpUrl, setWpUrl] = useState('https://appluxe.com');
  const [page, setPage] = useState('1');
  const [perPage, setPerPage] = useState('10');
  const [queryParams, setQueryParams] = useState('');
  const [specificId, setSpecificId] = useState('');
  
  const [isFetching, setIsFetching] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [totalHeader, setTotalHeader] = useState<string | null>(null);
  
  // Stats
  const [stats, setStats] = useState({ local: 0, imported: 0, importedIds: [] as number[] });
  
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [importLogs, setImportLogs] = useState<Array<{ id: number; title: string; status: 'success' | 'error' | 'skipped'; message: string }>>([]);

  const [isCleaning, setIsCleaning] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_APP_URL || '') + '/api/admin/import/stats');
      if (res.ok) {
        const data = await res.json();
        setStats({
          local: data.totalLocalPosts,
          imported: data.totalImported,
          importedIds: data.importedIds || []
        });
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchPosts = async () => {
    setIsFetching(true);
    setImportLogs([]);
    try {
      const url = new URL(`${wpUrl}/wp-json/wp/v2/posts`);
      url.searchParams.set('page', page);
      url.searchParams.set('per_page', perPage);
      // We still try lang=en for sites that support it
      url.searchParams.set('lang', 'en'); 
      url.searchParams.set('_embed', '1'); 
      
      // Add custom query params (like categories=5)
      if (queryParams) {
        const params = new URLSearchParams(queryParams);
        for (const [key, value] of params.entries()) {
          url.searchParams.set(key, value);
        }
      }

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      
      const total = res.headers.get('x-wp-total');
      setTotalHeader(total);
      
      const data = await res.json();
      setPosts(data);
    } catch (err: any) {
      alert('Failed to fetch posts: ' + err.message);
    } finally {
      setIsFetching(false);
    }
  };

  const fetchMissingPosts = async () => {
    setIsScanning(true);
    setImportLogs([]);
    setPosts([]);
    try {
      // First, get latest stats so we know imported IDs
      const statsRes = await fetch((process.env.NEXT_PUBLIC_APP_URL || '') + '/api/admin/import/stats');
      const statsData = await statsRes.json();
      const importedIds = statsData.importedIds || [];
      setStats({ local: statsData.totalLocalPosts, imported: statsData.totalImported, importedIds });

      // Fetch WP total pages lightly (only id, title)
      const url = new URL(`${wpUrl}/wp-json/wp/v2/posts`);
      url.searchParams.set('per_page', '100');
      url.searchParams.set('lang', 'en');
      url.searchParams.set('_fields', 'id,title,date');

      // Add custom query params here too
      if (queryParams) {
        const params = new URLSearchParams(queryParams);
        for (const [key, value] of params.entries()) {
          url.searchParams.set(key, value);
        }
      }

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      
      const totalPages = parseInt(res.headers.get('x-wp-totalpages') || '1', 10);
      const totalWP = res.headers.get('x-wp-total');
      setTotalHeader(totalWP);
      
      let allWpPosts: any[] = await res.json();

      // If more than 1 page, fetch the rest
      if (totalPages > 1) {
        for (let i = 2; i <= totalPages; i++) {
          url.searchParams.set('page', i.toString());
          const pRes = await fetch(url.toString());
          if (pRes.ok) {
            const pData = await pRes.json();
            allWpPosts = [...allWpPosts, ...pData];
          }
        }
      }

      // Diff
      const missing = allWpPosts.filter(p => !importedIds.includes(p.id));
      setPosts(missing);
      alert(`Found ${missing.length} missing posts!`);
    } catch (err: any) {
      alert('Failed to scan missing posts: ' + err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const importSingleById = async () => {
    if (!specificId) return;
    setIsImporting(true);
    setImportLogs([]);
    setProgress({ current: 0, total: 1 });
    try {
      const url = new URL(`${wpUrl}/wp-json/wp/v2/posts/${specificId}`);
      url.searchParams.set('_embed', '1');
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`Post ${specificId} not found or HTTP error`);
      const post = await res.json();
      await importSingle(post);
      setProgress({ current: 1, total: 1 });
    } catch (err: any) {
      alert('Failed to import specific ID: ' + err.message);
    } finally {
      setIsImporting(false);
      fetchStats();
    }
  };

  const importSingle = async (post: any) => {
    try {
      // If we only fetched lightweight (_fields=id,title) we need to fetch full embed before inserting
      let fullPost = post;
      if (!fullPost.content || !fullPost._embedded) {
        const url = new URL(`${wpUrl}/wp-json/wp/v2/posts/${post.id}`);
        url.searchParams.set('_embed', '1');
        const resFull = await fetch(url.toString());
        if (resFull.ok) fullPost = await resFull.json();
      }

      const res = await fetch((process.env.NEXT_PUBLIC_APP_URL || '') + '/api/admin/import/wp-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post: fullPost }),
      });
      const data = await res.json();
      if (res.ok) {
        setImportLogs(prev => [{ id: post.id, title: post.title.rendered, status: data.skipped ? 'skipped' : 'success', message: data.message }, ...prev]);
      } else {
        setImportLogs(prev => [{ id: post.id, title: post.title.rendered, status: 'error', message: data.error || 'Unknown error' }, ...prev]);
      }
    } catch (err: any) {
      setImportLogs(prev => [{ id: post.id, title: post.title.rendered, status: 'error', message: err.message }, ...prev]);
    }
  };

  const importAll = async () => {
    if (posts.length === 0) return;
    setIsImporting(true);
    setProgress({ current: 0, total: posts.length });
    
    for (let i = 0; i < posts.length; i++) {
      await importSingle(posts[i]);
      setProgress(prev => ({ ...prev, current: i + 1 }));
    }
    
    setIsImporting(false);
    fetchStats();
  };

  const cleanOrphaned = async () => {
    if (!confirm('Are you sure you want to delete orphaned images from DB and filesystem?')) return;
    setIsCleaning(true);
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_APP_URL || '') + '/api/admin/import/clean', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(`Successfully cleaned ${data.deletedCount} orphaned images.`);
      } else {
        alert('Error cleaning: ' + data.error);
      }
    } catch (err: any) {
      alert('Failed: ' + err.message);
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Stats Dash */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Local Panel Posts</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{stats.local}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Imported From WP</p>
          <p className="text-3xl font-black text-orange-600 mt-1">{stats.imported}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">WP Total Available (English)</p>
          <p className="text-3xl font-black text-slate-900 mt-1">
            {totalHeader ? totalHeader : <Button variant="ghost" size="sm" onClick={fetchPosts} className="h-6 p-0 text-orange-600">Fetch to load</Button>}
          </p>
        </div>
      </div>

      {/* Settings Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Database className="h-4 w-4 text-orange-500" /> Advanced Options
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Standard Fetch */}
          <div className="space-y-4 border-r border-slate-100 pr-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">WordPress Site URL</label>
              <input
                type="text"
                value={wpUrl}
                onChange={(e) => setWpUrl(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
            
            <div className="flex gap-2">
              <div className="space-y-1.5 w-1/2">
                <label className="text-xs font-semibold text-slate-600">Page</label>
                <input type="number" value={page} onChange={(e) => setPage(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500" />
              </div>
              <div className="space-y-1.5 w-1/2">
                <label className="text-xs font-semibold text-slate-600">Per Page</label>
                <input type="number" value={perPage} onChange={(e) => setPerPage(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Custom Query Filters (e.g., categories=5)</label>
              <input
                type="text"
                value={queryParams}
                onChange={(e) => setQueryParams(e.target.value)}
                placeholder="categories=12&tags=5"
                className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
              />
            </div>

            <Button onClick={fetchPosts} disabled={isFetching || isImporting || isScanning} className="w-full bg-slate-900 text-white hover:bg-slate-800">
              {isFetching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <DownloadCloud className="h-4 w-4 mr-2" />}
              Fetch Posts
            </Button>
          </div>

          {/* Right: Direct Actions */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Import Specific WP ID</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={specificId}
                  onChange={(e) => setSpecificId(e.target.value)}
                  className="flex-1 h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                  placeholder="e.g. 1245"
                />
                <Button onClick={importSingleById} disabled={!specificId || isImporting || isScanning} className="bg-orange-600 hover:bg-orange-700 text-white whitespace-nowrap">
                  Import ID
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
              <Button variant="outline" onClick={fetchMissingPosts} disabled={isFetching || isImporting || isScanning} className="w-full border-slate-200">
                {isScanning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2 text-blue-500" />}
                Scan for Missing Posts
              </Button>
              
              <Button variant="outline" onClick={cleanOrphaned} disabled={isCleaning || isImporting} className="w-full text-red-600 border-red-200 hover:bg-red-50">
                {isCleaning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Clean Orphaned Images
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Card */}
      {posts.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">
              Displaying {posts.length} Posts {totalHeader ? `(out of ${totalHeader} total)` : ''}
            </h2>
            <Button onClick={importAll} disabled={isImporting} className="bg-orange-600 hover:bg-orange-700 text-white">
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> 
                  Importing {progress.current} / {progress.total}
                </>
              ) : (
                <><FileDown className="h-4 w-4 mr-2" /> Import All Displayed Posts</>
              )}
            </Button>
          </div>

          <div className="border border-slate-100 rounded-xl overflow-hidden max-h-[500px] overflow-y-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 font-semibold">WP ID</th>
                  <th className="px-4 py-3 font-semibold w-full">Title</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                {posts.map((post) => {
                  const log = importLogs.find(l => l.id === post.id);
                  return (
                    <tr key={post.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500">{post.id}</td>
                      <td className="px-4 py-3 truncate max-w-[200px] md:max-w-[400px]">
                        <span dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
                      </td>
                      <td className="px-4 py-3 text-slate-500">{new Date(post.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        {log ? (
                          <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${log.status === 'success' ? 'text-green-600' : log.status === 'skipped' ? 'text-slate-400' : 'text-red-600'}`}>
                            {log.status === 'success' && <CheckCircle className="h-3.5 w-3.5" />}
                            {log.status === 'skipped' && <AlertTriangle className="h-3.5 w-3.5" />}
                            {log.status === 'error' && <AlertTriangle className="h-3.5 w-3.5" />}
                            {log.status}
                          </span>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            disabled={isImporting || stats.importedIds.includes(post.id)} 
                            onClick={() => importSingle(post)}
                            className="h-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50 font-semibold"
                          >
                            {stats.importedIds.includes(post.id) ? 'Already Imported' : 'Import One'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Logs section */}
      {importLogs.length > 0 && (
        <div className="bg-slate-900 text-slate-300 p-4 rounded-xl text-xs font-mono max-h-48 overflow-y-auto space-y-1">
          {importLogs.map((log, idx) => (
            <div key={idx} className={`flex gap-2 ${log.status === 'error' ? 'text-red-400' : log.status === 'success' ? 'text-green-400' : 'text-slate-400'}`}>
              <span className="shrink-0">[{log.status.toUpperCase()}]</span>
              <span className="shrink-0 w-20">ID: {log.id}</span>
              <span className="truncate flex-1" dangerouslySetInnerHTML={{ __html: log.title }} />
              <span className="text-slate-500">{log.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
