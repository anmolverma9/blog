'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { FileText, Eye, Users, Mail, PlusCircle, ArrowRight, Settings, Loader2 } from 'lucide-react';

interface AnalyticsData {
  totalPosts: number;
  totalViews: number;
  totalAuthors: number;
  totalSubscribers: number;
  recentPosts: Array<{
    id: number;
    title: string;
    views: number;
    status: string;
    published_at: string | null;
    author_name: string;
  }>;
  subscribers: Array<{
    id: number;
    email: string;
    status: string;
    created_at: string;
  }>;
  viewsTrend?: Array<{ day: string; views: number }>;
  categoriesBreakdown?: Array<{ category: string; count: number }>;
}

export default function DashboardClient() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch((process.env.NEXT_PUBLIC_APP_URL || '') + '/api/admin/analytics');
        if (!res.ok) {
          throw new Error('Failed to load analytics');
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || 'Error fetching data');
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
        <p className="text-slate-500 font-medium">Loading workspace analytics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
        <p className="font-semibold">Error Loading Dashboard</p>
        <p className="text-sm">{error || 'Please try refreshing the page.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 mt-1">Here is what is happening across your platform today.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/posts/new" className={buttonVariants({ className: "bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/10 flex items-center gap-2" })}>
            <PlusCircle className="h-4 w-4" />
            Create Post
          </Link>
          <Link href="/admin/settings" className={buttonVariants({ variant: "outline", className: "border-slate-200 text-slate-700 flex items-center gap-2" })}>
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Posts</CardTitle>
            <div className="p-2 bg-orange-50 text-orange-500 rounded-lg">
              <FileText className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{data.totalPosts}</div>
            <p className="text-xs text-slate-400 mt-1">Articles published & drafts</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Views</CardTitle>
            <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg">
              <Eye className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{data.totalViews.toLocaleString()}</div>
            <p className="text-xs text-slate-400 mt-1">Lifetime page views</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Authors</CardTitle>
            <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{data.totalAuthors}</div>
            <p className="text-xs text-slate-400 mt-1">Active content creators</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Subscribers</CardTitle>
            <div className="p-2 bg-purple-50 text-purple-500 rounded-lg">
              <Mail className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{data.totalSubscribers}</div>
            <p className="text-xs text-slate-400 mt-1">Active email subscribers</p>
          </CardContent>
        </Card>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Page Views Trend Area Chart */}
        <Card className="lg:col-span-2 border-slate-200/80 shadow-sm bg-white overflow-hidden rounded-3xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-slate-900">Traffic & Views Trend</CardTitle>
            <p className="text-xs text-slate-500">Estimated daily page views over the last 7 days</p>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="relative h-[200px] w-full text-orange-500">
              <svg viewBox="0 0 700 180" width="100%" height="100%" className="overflow-visible">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0.00" />
                  </linearGradient>
                </defs>
                
                {/* Grid Lines */}
                <line x1="30" y1="30" x2="670" y2="30" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="30" y1="85" x2="670" y2="85" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="30" y1="140" x2="670" y2="140" stroke="#f1f5f9" strokeWidth="1" />
                
                {/* Area path */}
                {(() => {
                  const trend = data.viewsTrend || [];
                  const maxViews = Math.max(...trend.map(t => t.views), 1);
                  const width = 700;
                  const height = 180;
                  const paddingX = 30;
                  const paddingY = 40;
                  
                  const points = trend.map((t, idx) => {
                    const x = (idx / (trend.length - 1)) * (width - paddingX * 2) + paddingX;
                    const y = height - paddingY - ((t.views / maxViews) * (height - paddingY * 2));
                    return { x, y, ...t };
                  });

                  const lineD = points.reduce((acc, p, idx) => {
                    return acc + (idx === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
                  }, '');

                  const areaD = lineD ? `${lineD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z` : '';

                  return (
                    <>
                      {areaD && <path d={areaD} fill="url(#chartGrad)" className="transition-all duration-300" />}
                      {lineD && <path d={lineD} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-300" />}
                      {points.map((p, idx) => (
                        <g key={idx} className="group cursor-pointer">
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="5"
                            fill="currentColor"
                            stroke="#fff"
                            strokeWidth="2.5"
                            className="transition-all duration-150 hover:scale-125"
                          />
                          
                          {/* Tooltip value */}
                          <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                            <rect
                              x={p.x - 30}
                              y={p.y - 32}
                              width="60"
                              height="20"
                              rx="6"
                              fill="#0f172a"
                            />
                            <text
                              x={p.x}
                              y={p.y - 19}
                              fill="#fff"
                              fontSize="9"
                              fontWeight="extrabold"
                              textAnchor="middle"
                            >
                              {p.views}
                            </text>
                          </g>
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>
            
            {/* X Axis Labels */}
            <div className="flex justify-between items-center px-4 mt-2 border-t pt-3 border-slate-100">
              {(data.viewsTrend || []).map((t, idx) => (
                <div key={idx} className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.day}</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">{t.views}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Topic distribution */}
        <Card className="border-slate-200/80 shadow-sm bg-white rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-900">Topic Distribution</CardTitle>
            <p className="text-xs text-slate-500">Breakdown of content by categories</p>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {(!data.categoriesBreakdown || data.categoriesBreakdown.length === 0) ? (
              <div className="text-center py-10 text-slate-400 text-xs border border-dashed rounded-xl bg-slate-50">
                No categorised articles.
              </div>
            ) : (
              data.categoriesBreakdown.map((cat, idx) => {
                const percentage = Math.round((cat.count / (data.totalPosts || 1)) * 100) || 0;
                const colors = [
                  'bg-orange-500',
                  'bg-emerald-500',
                  'bg-blue-500',
                  'bg-purple-500'
                ];
                const barColor = colors[idx % colors.length];
                
                return (
                  <div key={cat.category} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                      <span>{cat.category}</span>
                      <span className="text-slate-400 font-medium">{cat.count} posts ({percentage}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Grid for recent entries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Posts list */}
        <Card className="lg:col-span-2 border-slate-200/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">Recent Articles</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Your latest content submissions</p>
            </div>
            <Link href="/admin/posts" className={buttonVariants({ variant: "ghost", size: "sm", className: "text-orange-500 hover:text-orange-600 font-semibold gap-1" })}>
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100">
              {data.recentPosts.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm">No articles created yet.</div>
              ) : (
                data.recentPosts.map((post) => (
                  <div key={post.id} className="py-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{post.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        <span>By {post.author_name}</span>
                        <span>•</span>
                        <span className={`capitalize px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          post.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {post.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 text-xs font-medium">
                      <Eye className="h-4 w-4 text-slate-400" />
                      {post.views} views
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Subscribers list */}
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-900">Latest Subscribers</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Recent newsletter opt-ins</p>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100">
              {data.subscribers.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm">No subscribers yet.</div>
              ) : (
                data.subscribers.map((sub) => (
                  <div key={sub.id} className="py-3 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{sub.email}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Joined {new Date(sub.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-[10px] bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-full capitalize">
                      {sub.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
