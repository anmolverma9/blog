'use client';

import React, { useState, useEffect } from 'react';
import { UserSession } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Mail,
  Search,
  Trash2,
  Download,
  Loader2,
  Check,
  AlertCircle,
  Filter,
  Inbox,
  UserCheck,
  UserX,
  Globe
} from 'lucide-react';

interface Subscriber {
  id: number;
  email: string;
  status: string;
  source_page?: string;
  created_at: string;
}

interface SubscribersClientProps {
  session: UserSession;
}

export default function SubscribersClient({ session }: SubscribersClientProps) {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchSubscribers = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_APP_URL || '') + '/api/admin/subscribers');
      if (!res.ok) {
        throw new Error('Failed to load subscribers');
      }
      const data = await res.json();
      setSubscribers(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error fetching subscriber data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const triggerAlert = (type: 'success' | 'error', msg: string) => {
    if (type === 'success') {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const handleDeleteSubscriber = async (id: number, email: string) => {
    if (!confirm(`Are you sure you want to remove "${email}" from the subscriber list?`)) {
      return;
    }

    setDeletingId(id);
    setErrorMsg('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/admin/subscribers/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete subscriber');
      }

      triggerAlert('success', `Subscriber "${email}" was successfully deleted.`);
      setSubscribers(prev => prev.filter(sub => sub.id !== id));
    } catch (err: any) {
      triggerAlert('error', err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportCSV = () => {
    if (filteredSubscribers.length === 0) {
      triggerAlert('error', 'No subscribers available to export.');
      return;
    }

    // CSV Headers
    const headers = ['ID', 'Email', 'Status', 'Signup Source', 'Subscribed At'];
    
    // CSV Rows
    const rows = filteredSubscribers.map(sub => [
      sub.id,
      sub.email,
      sub.status,
      sub.source_page || 'website',
      new Date(sub.created_at).toISOString()
    ]);

    const csvContent = 
      'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `subscribers_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerAlert('success', 'Subscribers list exported successfully as CSV.');
  };

  // Filter subscribers list
  const filteredSubscribers = subscribers.filter(sub => {
    const matchesSearch = sub.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCount = subscribers.length;
  const activeCount = subscribers.filter(s => s.status === 'active').length;
  const unsubscribedCount = subscribers.filter(s => s.status === 'unsubscribed').length;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Newsletter Subscribers</h1>
          <p className="text-slate-500 text-sm">View, filter, export, and manage your newsletter opt-ins.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <Check className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Subscribers</CardTitle>
            <div className="p-2 bg-orange-50 text-orange-500 rounded-lg">
              <Mail className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{loading ? '...' : totalCount}</div>
            <p className="text-xs text-slate-400 mt-1">Total database signups</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Active</CardTitle>
            <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg">
              <UserCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{loading ? '...' : activeCount}</div>
            <p className="text-xs text-slate-400 mt-1">Receiving communications</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Unsubscribed</CardTitle>
            <div className="p-2 bg-slate-100 text-slate-500 rounded-lg">
              <UserX className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{loading ? '...' : unsubscribedCount}</div>
            <p className="text-xs text-slate-400 mt-1">Opted-out subscribers</p>
          </CardContent>
        </Card>
      </div>

      {/* Table & Filtering */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Loading subscribers list...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 border rounded-3xl shadow-sm">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subscribers by email address..."
                className="w-full pl-10 pr-4 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-800"
              />
            </div>
            <div className="flex items-center gap-2 border rounded-xl px-3 bg-white shrink-0">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2 text-xs outline-none text-slate-800 bg-white cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="unsubscribed">Unsubscribed Only</option>
              </select>
            </div>
          </div>

          {/* Subscribers Table */}
          <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-slate-800">
                <thead>
                  <tr className="bg-slate-50 border-b text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    <th className="py-4 px-6">Email Address</th>
                    <th className="py-4 px-6">Signup Source</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Subscribed At</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {filteredSubscribers.length > 0 ? (
                    filteredSubscribers.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 font-semibold text-slate-900">
                          {sub.email}
                        </td>
                        <td className="py-4 px-6 text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Globe className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="capitalize">{sub.source_page || 'website'}</span>
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                              sub.status === 'active'
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {sub.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-400 font-medium">
                          {formatDate(sub.created_at)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-end">
                            <button
                              onClick={() => handleDeleteSubscriber(sub.id, sub.email)}
                              disabled={deletingId === sub.id}
                              title="Delete Subscriber"
                              className={`p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                              {deletingId === sub.id ? (
                                <Loader2 className="h-4 w-4 animate-spin text-rose-600" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <Inbox className="h-8 w-8 text-slate-300" />
                          <p className="font-semibold text-sm">No subscribers found</p>
                          <p className="text-xs text-slate-400">Try modifying your query or filter settings.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
