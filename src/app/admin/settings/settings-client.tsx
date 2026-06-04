'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Save, CheckCircle } from 'lucide-react';

export default function SettingsClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form states
  const [siteName, setSiteName] = useState('AppLuxe Custom Blog');
  const [gaId, setGaId] = useState('');
  const [headerScripts, setHeaderScripts] = useState('');
  const [footerScripts, setFooterScripts] = useState('');

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.site_name) setSiteName(data.site_name);
          if (data.google_analytics_id) setGaId(data.google_analytics_id);
          if (data.header_scripts) setHeaderScripts(data.header_scripts);
          if (data.footer_scripts) setFooterScripts(data.footer_scripts);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_name: siteName,
          google_analytics_id: gaId,
          header_scripts: headerScripts,
          footer_scripts: footerScripts,
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        alert('Failed to save settings');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
        <p className="text-slate-500 font-medium">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Configuration</h1>
        <p className="text-slate-500 mt-1">Manage global site options, SEO tracking, and script injections.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold">General Settings</CardTitle>
            <CardDescription>Configure naming and identity parameters for this website.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5 max-w-md">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Site Name / Title</label>
              <Input
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="AppLuxe Blog"
                className="h-10 border-slate-200"
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Analytics & Script Injections</CardTitle>
            <CardDescription>Inject customized analytics tools, GA4 measurement tags, or custom tracking CSS/JS codes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5 max-w-md">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Google Analytics ID (GA4)</label>
              <Input
                value={gaId}
                onChange={(e) => setGaId(e.target.value)}
                placeholder="e.g. G-XXXXXXXXXX"
                className="h-10 border-slate-200"
              />
              <p className="text-[10px] text-slate-400">Standard Google Tag measurement format. Overwrites global header template.</p>
            </div>

            <div className="h-px bg-slate-100 my-2" />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Header Script Injection (Inside &lt;head&gt;)</label>
              <Textarea
                value={headerScripts}
                onChange={(e) => setHeaderScripts(e.target.value)}
                placeholder="<!-- Paste your custom tags here, e.g. Facebook Pixel, custom styles -->"
                className="font-mono text-xs h-32 border-slate-200 focus:border-orange-500 focus:ring-orange-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Footer Script Injection (Before &lt;/body&gt;)</label>
              <Textarea
                value={footerScripts}
                onChange={(e) => setFooterScripts(e.target.value)}
                placeholder="<!-- Paste footer scripts here, e.g. chat widgets, heatmaps -->"
                className="font-mono text-xs h-32 border-slate-200 focus:border-orange-500 focus:ring-orange-500/20"
              />
            </div>
          </CardContent>
        </Card>

        {/* Action button */}
        <div className="flex items-center gap-3">
          <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-11 px-6 shadow-md shadow-orange-500/10" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
            Save Workspace Settings
          </Button>
          {savedSuccess && (
            <div className="flex items-center gap-1 text-emerald-600 text-sm font-semibold animate-in fade-in duration-300">
              <CheckCircle className="h-4 w-4" />
              Settings saved successfully!
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
