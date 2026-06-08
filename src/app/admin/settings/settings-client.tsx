'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Save, CheckCircle, Palette, Check, Mail, Sliders, Code } from 'lucide-react';
import { THEME_PRESETS, generateThemeStyle } from '@/lib/theme';

export default function SettingsClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'mail' | 'analytics'>('general');

  // Form states
  const [siteName, setSiteName] = useState('AppLuxe Custom Blog');
  const [brandColor, setBrandColor] = useState('');
  const [gaId, setGaId] = useState('');
  const [headerScripts, setHeaderScripts] = useState('');
  const [footerScripts, setFooterScripts] = useState('');

  // SMTP
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFromEmail, setSmtpFromEmail] = useState('');
  const [smtpFromName, setSmtpFromName] = useState('');

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
          if (data.brand_color) setBrandColor(data.brand_color);
          if (data.smtp_host) setSmtpHost(data.smtp_host);
          if (data.smtp_port) setSmtpPort(data.smtp_port);
          if (data.smtp_user) setSmtpUser(data.smtp_user);
          if (data.smtp_pass) setSmtpPass(data.smtp_pass);
          if (data.smtp_from_email) setSmtpFromEmail(data.smtp_from_email);
          if (data.smtp_from_name) setSmtpFromName(data.smtp_from_name);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  // Live-preview the theme in admin without a full page reload
  useEffect(() => {
    const styleId = 'theme-preview';
    let el = document.getElementById(styleId) as HTMLStyleElement | null;
    const css = generateThemeStyle(brandColor);
    if (css) {
      if (!el) {
        el = document.createElement('style');
        el.id = styleId;
        document.head.appendChild(el);
      }
      el.textContent = css;
    } else if (el) {
      el.textContent = '';
    }
  }, [brandColor]);

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
          brand_color: brandColor,
          smtp_host: smtpHost,
          smtp_port: smtpPort,
          smtp_user: smtpUser,
          smtp_pass: smtpPass,
          smtp_from_email: smtpFromEmail,
          smtp_from_name: smtpFromName,
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

  const tabs = [
    { id: 'general', label: 'General & Brand', icon: Sliders },
    { id: 'mail', label: 'Mail Server (SMTP)', icon: Mail },
    { id: 'analytics', label: 'Analytics & Injection', icon: Code },
  ] as const;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Configuration</h1>
        <p className="text-slate-500 mt-1">Manage global site options, SEO tracking, and script injections.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-orange-500' : ''}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── General & Brand Tab ── */}
        {activeTab === 'general' && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
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
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Palette className="h-5 w-5 text-orange-500" />
                  Brand Color
                </CardTitle>
                <CardDescription>
                  Sets the primary accent color across the entire website and admin panel.
                  Changes take effect immediately after saving.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Color Presets</label>
                  <div className="flex flex-wrap gap-2.5">
                    {THEME_PRESETS.map((preset) => {
                      const isSelected = brandColor.toLowerCase() === preset.hex.toLowerCase();
                      return (
                        <button
                          key={preset.hex}
                          type="button"
                          title={preset.name}
                          onClick={() => setBrandColor(preset.hex)}
                          className={`relative h-9 w-9 rounded-xl border-2 transition-all duration-150 shadow-sm ${
                            isSelected
                              ? 'border-slate-900 scale-110 shadow-md'
                              : 'border-transparent hover:scale-105 hover:border-slate-400'
                          }`}
                          style={{ backgroundColor: preset.hex }}
                        >
                          {isSelected && (
                            <Check
                              className="absolute inset-0 m-auto h-4 w-4 drop-shadow"
                              style={{ color: '#fff', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.5))' }}
                            />
                          )}
                          <span className="sr-only">{preset.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5 max-w-xs">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Custom Hex Color</label>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-lg border border-slate-200 shrink-0 shadow-inner"
                      style={{ backgroundColor: brandColor || '#f97316' }}
                    />
                    <Input
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      placeholder="#f97316"
                      maxLength={7}
                      className="h-10 font-mono text-sm border-slate-200 uppercase"
                    />
                    {brandColor && (
                      <button
                        type="button"
                        onClick={() => setBrandColor('')}
                        className="text-xs text-slate-400 hover:text-slate-700 whitespace-nowrap"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Leave blank to use the default orange theme. Changes preview instantly.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── SMTP Configuration Tab ── */}
        {activeTab === 'mail' && (
          <div className="animate-in fade-in-50 duration-200">
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Mail className="h-5 w-5 text-orange-500" />
                  SMTP / Email Configuration
                </CardTitle>
                <CardDescription>
                  Configure outbound email delivery for notifications, password resets, and newsletters.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">SMTP Host</label>
                    <Input
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      placeholder="smtp.example.com"
                      className="h-10 border-slate-200 font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Port</label>
                    <Input
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                      placeholder="587"
                      className="h-10 border-slate-200 font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">SMTP Username</label>
                    <Input
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                      placeholder="your@email.com"
                      className="h-10 border-slate-200"
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">SMTP Password</label>
                    <Input
                      type="password"
                      value={smtpPass}
                      onChange={(e) => setSmtpPass(e.target.value)}
                      placeholder="••••••••••••"
                      className="h-10 border-slate-200"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">From Email</label>
                    <Input
                      type="email"
                      value={smtpFromEmail}
                      onChange={(e) => setSmtpFromEmail(e.target.value)}
                      placeholder="noreply@yourdomain.com"
                      className="h-10 border-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">From Name</label>
                    <Input
                      value={smtpFromName}
                      onChange={(e) => setSmtpFromName(e.target.value)}
                      placeholder="AppLuxe Blog"
                      className="h-10 border-slate-200"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">
                  Common ports: 25 (unencrypted), 465 (SSL), 587 (TLS/STARTTLS). Credentials are stored securely in the database.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Analytics & Script Injections Tab ── */}
        {activeTab === 'analytics' && (
          <div className="animate-in fade-in-50 duration-200">
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
          </div>
        )}

        {/* Action button */}
        <div className="flex items-center gap-3 pt-2">
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
