'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2, Save, AlertTriangle, ShieldCheck, FileText, Share2, Network,
  Search, Link as LinkIcon, RefreshCw, Layers, CheckCircle, Trash2
} from 'lucide-react';

interface BrokenLink {
  url: string;
  entityId: number;
  entityType: 'post' | 'page';
  entityTitle: string;
  statusCode: number;
  error: string;
  suggestion: string;
}

interface Log404 {
  id: number;
  url: string;
  referrer: string;
  ip_address: string;
  created_at: string;
}

export default function SEOClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'indexing' | 'robots' | 'social' | 'schema' | 'broken' | 'clusters'>('general');

  // General SEO Settings
  const [siteTitle, setSiteTitle] = useState('');
  const [siteDescription, setSiteDescription] = useState('');
  const [defaultMetaTitle, setDefaultMetaTitle] = useState('');
  const [defaultMetaDescription, setDefaultMetaDescription] = useState('');

  // Indexing
  const [metaRobotsIndexing, setMetaRobotsIndexing] = useState('index, follow');

  // Robots
  const [robotsTxtContent, setRobotsTxtContent] = useState('');

  // Social
  const [socialOgImage, setSocialOgImage] = useState('');
  const [socialTwitterCard, setSocialTwitterCard] = useState('summary_large_image');

  // Schema
  const [orgSchemaName, setOrgSchemaName] = useState('');
  const [orgSchemaLogo, setOrgSchemaLogo] = useState('');
  const [orgSchemaSocial, setOrgSchemaSocial] = useState('[]');
  const [webSchemaName, setWebSchemaName] = useState('');

  // 404 Logs & Link Scanner State
  const [logs404, setLogs404] = useState<Log404[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ scannedLinksCount: number; brokenLinks: BrokenLink[] } | null>(null);

  // Topic Clusters State
  const [clusters, setClusters] = useState<any[]>([]);
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [clusterName, setClusterName] = useState('');
  const [clusterSlug, setClusterSlug] = useState('');
  const [clusterDesc, setClusterDesc] = useState('');
  const [selectedPostIds, setSelectedPostIds] = useState<number[]>([]);
  const [editingClusterId, setEditingClusterId] = useState<number | null>(null);

  // Load Settings
  useEffect(() => {
    async function loadSEOData() {
      try {
        const res = await fetch('/api/admin/seo');
        if (res.ok) {
          const data = await res.json();
          const s = data.settings;
          setSiteTitle(s.site_title);
          setSiteDescription(s.site_description);
          setDefaultMetaTitle(s.default_meta_title);
          setDefaultMetaDescription(s.default_meta_description);
          setMetaRobotsIndexing(s.meta_robots_indexing);
          setRobotsTxtContent(s.robots_txt_content);
          setSocialOgImage(s.social_og_image);
          setSocialTwitterCard(s.social_twitter_card);
          setOrgSchemaName(s.org_schema_name);
          setOrgSchemaLogo(s.org_schema_logo);
          setOrgSchemaSocial(s.org_schema_social);
          setWebSchemaName(s.web_schema_name);
          setLogs404(data.logs || []);
        }

        // Load topic clusters
        const clustersRes = await fetch('/api/admin/seo/topic-clusters');
        if (clustersRes.ok) {
          const cData = await clustersRes.json();
          setClusters(cData.clusters || []);
          setAllPosts(cData.posts || []);
        }
      } catch (err) {
        console.error('Failed to load SEO data', err);
      } finally {
        setLoading(false);
      }
    }
    loadSEOData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/admin/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_title: siteTitle,
          site_description: siteDescription,
          default_meta_title: defaultMetaTitle,
          default_meta_description: defaultMetaDescription,
          meta_robots_indexing: metaRobotsIndexing,
          robots_txt_content: robotsTxtContent,
          social_og_image: socialOgImage,
          social_twitter_card: socialTwitterCard,
          org_schema_name: orgSchemaName,
          org_schema_logo: orgSchemaLogo,
          org_schema_social: orgSchemaSocial,
          web_schema_name: webSchemaName,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert('Failed to save settings');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Run Link Scan
  const handleRunLinkScan = async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const res = await fetch('/api/admin/seo/scan-links', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setScanResult(data);
      } else {
        alert('Failed to complete broken link scan');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setScanning(false);
    }
  };

  // Clear 404 Logs
  const handleClear404Logs = async () => {
    if (!confirm('Are you sure you want to clear all 404 logs?')) return;
    try {
      const res = await fetch('/api/admin/seo', { method: 'DELETE' });
      if (res.ok) {
        setLogs404([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save or Update Cluster
  const handleSaveCluster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clusterName || !clusterSlug) return alert('Name and Slug are required');

    try {
      const isEdit = editingClusterId !== null;
      const res = await fetch('/api/admin/seo/topic-clusters', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingClusterId,
          name: clusterName,
          slug: clusterSlug,
          description: clusterDesc,
          postIds: selectedPostIds,
        }),
      });

      if (res.ok) {
        alert(isEdit ? 'Cluster updated successfully' : 'Cluster created successfully');
        // Reload clusters
        const clustersRes = await fetch('/api/admin/seo/topic-clusters');
        if (clustersRes.ok) {
          const cData = await clustersRes.json();
          setClusters(cData.clusters || []);
        }
        // Reset form
        setClusterName('');
        setClusterSlug('');
        setClusterDesc('');
        setSelectedPostIds([]);
        setEditingClusterId(null);
      } else {
        alert('Failed to save cluster');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditCluster = (c: any) => {
    setEditingClusterId(c.id);
    setClusterName(c.name);
    setClusterSlug(c.slug);
    setClusterDesc(c.description || '');
    setSelectedPostIds(c.postIds || []);
    setActiveTab('clusters');
  };

  const handleDeleteCluster = async (id: number) => {
    if (!confirm('Are you sure you want to delete this cluster?')) return;
    try {
      const res = await fetch(`/api/admin/seo/topic-clusters?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setClusters(clusters.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
        <p className="text-slate-500 font-medium">Loading SEO dashboard...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'General SEO', icon: Search },
    { id: 'indexing', label: 'Indexing Defaults', icon: ShieldCheck },
    { id: 'robots', label: 'Robots.txt', icon: FileText },
    { id: 'social', label: 'Social & Cards', icon: Share2 },
    { id: 'schema', label: 'Schemas (LD-JSON)', icon: Network },
    { id: 'broken', label: 'Broken Links & 404', icon: AlertTriangle },
    { id: 'clusters', label: 'Topic Clusters', icon: Layers },
  ] as const;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">SEO Center</h1>
          <p className="text-slate-500 mt-1">Configure XML schemas, audit content anchors, and edit indexing flags.</p>
        </div>
        {activeTab !== 'broken' && activeTab !== 'clusters' && (
          <Button onClick={handleSaveSettings} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-10 px-5 shadow-md shadow-orange-500/10 flex items-center gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save SEO Settings
          </Button>
        )}
      </div>

      {/* Tabs list */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto select-none shrink-0 border border-slate-200/50">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-150 ${
                isActive ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === 'general' && (
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800">General Website SEO Meta Settings</CardTitle>
            <CardDescription className="text-xs">Setup fallbacks and global rules used if custom inputs are missing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Site Title</label>
                <Input value={siteTitle} onChange={e => setSiteTitle(e.target.value)} placeholder="e.g. AppLuxe Blog" className="text-sm border-slate-200 focus:border-orange-500 focus:ring-0" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Site Default Description</label>
                <Input value={siteDescription} onChange={e => setSiteDescription(e.target.value)} placeholder="Global meta description fallback..." className="text-sm border-slate-200" />
              </div>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-600">Default Article Meta Fallbacks</p>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Default Meta Title Pattern</label>
                  <Input value={defaultMetaTitle} onChange={e => setDefaultMetaTitle(e.target.value)} placeholder="e.g. %%title%% | AppLuxe CMS" className="text-sm border-slate-200" />
                  <p className="text-[9px] text-slate-400">Use %%title%% to insert post title dynamically.</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Default Meta Description Fallback</label>
                  <Textarea value={defaultMetaDescription} onChange={e => setDefaultMetaDescription(e.target.value)} placeholder="Standard meta template summary..." className="text-sm border-slate-200 h-20" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'indexing' && (
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800">Search Engine Indexing Control</CardTitle>
            <CardDescription className="text-xs">Configure crawler indexing permissions and robots follow settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase block">Meta Robots Directives</label>
              <div className="space-y-2">
                {[
                  { value: 'index, follow', label: 'Index & Follow (Default - index pages, follow links)' },
                  { value: 'noindex, follow', label: 'NoIndex & Follow (Do not show in search, follow links)' },
                  { value: 'index, nofollow', label: 'Index & NoFollow (index pages, ignore links)' },
                  { value: 'noindex, nofollow', label: 'NoIndex & NoFollow (Hide completely from search engines)' },
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer font-medium">
                    <input
                      type="radio"
                      name="robots"
                      value={option.value}
                      checked={metaRobotsIndexing === option.value}
                      onChange={e => setMetaRobotsIndexing(e.target.value)}
                      className="text-orange-500 focus:ring-0 cursor-pointer"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'robots' && (
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800">Robots.txt Editor</CardTitle>
            <CardDescription className="text-xs">Directly override instructions for web robots, crawlers, and scrapers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">File Content Preview</label>
              <Textarea
                value={robotsTxtContent}
                onChange={e => setRobotsTxtContent(e.target.value)}
                className="font-mono text-xs border-slate-200 h-44"
                placeholder="User-agent: *..."
              />
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'social' && (
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800">Social Media SEO (Open Graph / Cards)</CardTitle>
            <CardDescription className="text-xs">Configure how links render when shared on Facebook, Twitter, and LinkedIn.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Default Share Image URL (OG:Image)</label>
              <Input value={socialOgImage} onChange={e => setSocialOgImage(e.target.value)} placeholder="https://domain.com/social-preview.jpg" className="text-sm border-slate-200" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Twitter Card Presentation Layout</label>
              <select
                value={socialTwitterCard}
                onChange={e => setSocialTwitterCard(e.target.value)}
                className="w-full h-9 px-2 rounded-lg border border-slate-200 text-xs sm:text-sm"
              >
                <option value="summary_large_image">Large Image Summary Box</option>
                <option value="summary">Standard square image Summary Card</option>
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'schema' && (
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800">Organization & Website Structured Data Schema</CardTitle>
            <CardDescription className="text-xs">Set defaults for organization details and search boxes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Organization Name</label>
                <Input value={orgSchemaName} onChange={e => setOrgSchemaName(e.target.value)} placeholder="e.g. AppLuxe Inc." className="text-sm border-slate-200" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Logo Image URL</label>
                <Input value={orgSchemaLogo} onChange={e => setOrgSchemaLogo(e.target.value)} placeholder="https://domain.com/logo.png" className="text-sm border-slate-200" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Social Profiles (JSON Array of URLs)</label>
              <Input value={orgSchemaSocial} onChange={e => setOrgSchemaSocial(e.target.value)} placeholder='["https://twitter.com/appluxe"]' className="text-sm border-slate-200 font-mono" />
            </div>
            <div className="h-px bg-slate-100" />
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Website Schema Search Title</label>
              <Input value={webSchemaName} onChange={e => setWebSchemaName(e.target.value)} placeholder="e.g. AppLuxe Publishing" className="text-sm border-slate-200" />
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'broken' && (
        <div className="space-y-6">
          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-800">Broken Link Auditor Scanner</CardTitle>
              <CardDescription className="text-xs">Audit all posts and pages to identify broken references or dead link anchors.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleRunLinkScan} disabled={scanning} className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-10 px-5 flex items-center gap-1.5">
                {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Scan Content Anchors
              </Button>

              {scanResult && (
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-3 text-xs">
                  <p className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    Scan Completed! Scanned {scanResult.scannedLinksCount} total links. Found {scanResult.brokenLinks.length} broken targets.
                  </p>
                  
                  {scanResult.brokenLinks.length > 0 ? (
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-72 overflow-y-auto">
                      <table className="min-w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b">
                          <tr>
                            <th className="px-3 py-2">Source Page</th>
                            <th className="px-3 py-2">Broken URL Link</th>
                            <th className="px-3 py-2">Status</th>
                            <th className="px-3 py-2">Error / Resolution Fix</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {scanResult.brokenLinks.map((link, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="px-3 py-2 font-semibold text-slate-700 capitalize">{link.entityType}: {link.entityTitle}</td>
                              <td className="px-3 py-2 font-mono text-slate-500">{link.url}</td>
                              <td className="px-3 py-2 text-red-500 font-bold">{link.statusCode === 0 ? 'FAIL' : link.statusCode}</td>
                              <td className="px-3 py-2 text-slate-600">
                                <span className="font-semibold block text-red-500">{link.error}</span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">Fix: {link.suggestion}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-slate-500 font-medium italic">All links checked out successfully! Zero broken references found.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="flex flex-row justify-between items-center pb-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-800">404 Error URL Logs</CardTitle>
                <CardDescription className="text-xs">URL paths requested by visitors that resulted in 404 Not Found errors.</CardDescription>
              </div>
              {logs404.length > 0 && (
                <Button onClick={handleClear404Logs} variant="ghost" className="text-red-500 hover:text-red-600 font-bold text-xs p-1 h-8">
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear Logs
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {logs404.length === 0 ? (
                <p className="text-xs text-slate-400 italic bg-slate-50 border border-dashed rounded-xl p-4 text-center">No 404 errors recorded yet.</p>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  <table className="min-w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b">
                      <tr>
                        <th className="px-3 py-2">Requested URL</th>
                        <th className="px-3 py-2">Referrer</th>
                        <th className="px-3 py-2">IP Address</th>
                        <th className="px-3 py-2">Logged Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      {logs404.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2 font-bold text-slate-800">{log.url}</td>
                          <td className="px-3 py-2 font-mono text-slate-400 truncate max-w-40">{log.referrer || 'Direct'}</td>
                          <td className="px-3 py-2 text-slate-500">{log.ip_address}</td>
                          <td className="px-3 py-2 text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'clusters' && (
        <div className="space-y-6">
          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-800">
                {editingClusterId ? 'Edit Topic Cluster Hub' : 'Create SEO Topic Cluster Hub'}
              </CardTitle>
              <CardDescription className="text-xs">Cluster pages together to gain authority in specific categories.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveCluster} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Cluster Name</label>
                    <Input value={clusterName} onChange={e => {
                      setClusterName(e.target.value);
                      if (!editingClusterId) {
                        setClusterSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                      }
                    }} placeholder="e.g. Next.js Database Scaling" className="text-sm border-slate-200" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Slug Identifier</label>
                    <Input value={clusterSlug} onChange={e => setClusterSlug(e.target.value)} placeholder="nextjs-db-scaling" className="text-sm border-slate-200" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Hub Description</label>
                  <Textarea value={clusterDesc} onChange={e => setClusterDesc(e.target.value)} placeholder="Summary of this cluster topic..." className="text-sm border-slate-200 h-16" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Map Published Articles</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-slate-200 p-3 rounded-xl bg-slate-50/50">
                    {allPosts.map((post) => {
                      const isChecked = selectedPostIds.includes(post.id);
                      return (
                        <label key={post.id} className="flex items-center gap-2 text-xs text-slate-700 font-semibold cursor-pointer py-1">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPostIds([...selectedPostIds, post.id]);
                              } else {
                                setSelectedPostIds(selectedPostIds.filter(pid => pid !== post.id));
                              }
                            }}
                            className="rounded border-slate-300 text-orange-500"
                          />
                          {post.title}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-9 text-xs">
                    {editingClusterId ? 'Update Cluster Hub' : 'Create Cluster Hub'}
                  </Button>
                  {editingClusterId && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setEditingClusterId(null);
                        setClusterName('');
                        setClusterSlug('');
                        setClusterDesc('');
                        setSelectedPostIds([]);
                      }}
                      className="text-xs h-9 font-semibold text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-800">Active Topic Hubs Directory</CardTitle>
              <CardDescription className="text-xs">Topic hubs grouping linked post assets.</CardDescription>
            </CardHeader>
            <CardContent>
              {clusters.length === 0 ? (
                <p className="text-xs text-slate-400 italic bg-slate-50 border border-dashed rounded-xl p-4 text-center">No topic hubs created yet.</p>
              ) : (
                <div className="space-y-3.5">
                  {clusters.map((c) => (
                    <div key={c.id} className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm flex justify-between items-center gap-4 hover:border-orange-200 transition-colors">
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-900 text-sm">{c.name} <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wide bg-orange-50 px-2 py-0.5 rounded ml-1.5">{c.posts_count} Articles</span></h4>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-xl">{c.description || 'No description provided.'}</p>
                        <p className="text-[10px] font-mono text-slate-400 mt-1">Slug: {c.slug}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button onClick={() => handleEditCluster(c)} variant="ghost" className="text-xs text-slate-600 hover:text-slate-800 font-bold h-8">Edit</Button>
                        <Button onClick={() => handleDeleteCluster(c.id)} variant="ghost" className="text-xs text-red-500 hover:text-red-600 font-bold h-8">Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
