'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Save, CheckCircle, Upload, Trash2, Check, RefreshCw, Type, Eye } from 'lucide-react';
import { DEFAULT_TYPOGRAPHY, TypographySettings, CustomFont, FontSetting } from '@/lib/typography';

const GOOGLE_FONT_PRESETS = [
  { name: 'Inter', url: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap', fallback: 'sans-serif' },
  { name: 'Lexend Deca', url: 'https://fonts.googleapis.com/css2?family=Lexend+Deca:wght@400;500;600;700;800&display=swap', fallback: 'sans-serif' },
  { name: 'Outfit', url: 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap', fallback: 'sans-serif' },
  { name: 'Playfair Display', url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&display=swap', fallback: 'serif' },
  { name: 'Lora', url: 'https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap', fallback: 'serif' },
  { name: 'Plus Jakarta Sans', url: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap', fallback: 'sans-serif' },
  { name: 'Fira Code', url: 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600;700&display=swap', fallback: 'monospace' },
];

export default function TypographyClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [settings, setSettings] = useState<TypographySettings>(DEFAULT_TYPOGRAPHY);

  // Form helpers for custom Google Font additions
  const [customGName, setCustomGName] = useState('');
  const [customGUrl, setCustomGUrl] = useState('');

  // Font upload references
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/admin/typography');
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (err) {
        console.error('Failed to load typography settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  // Inject temporary styles to preview fonts instantly in the admin panel
  useEffect(() => {
    const styleId = 'typography-admin-preview';
    let el = document.getElementById(styleId) as HTMLStyleElement | null;

    // Build temporary style rules
    const imports: string[] = [];
    const fontFaces: string[] = [];

    // Load active fonts for preview
    if (settings.headingFont.type === 'google' && settings.headingFont.url) {
      imports.push(`@import url('${settings.headingFont.url}');`);
    }
    if (settings.bodyFont.type === 'google' && settings.bodyFont.url) {
      imports.push(`@import url('${settings.bodyFont.url}');`);
    }

    if (settings.customFonts) {
      for (const font of settings.customFonts) {
        const srcParts: string[] = [];
        if (font.files.woff2) srcParts.push(`url('${font.files.woff2}') format('woff2')`);
        if (font.files.woff) srcParts.push(`url('${font.files.woff}') format('woff')`);
        if (font.files.ttf) srcParts.push(`url('${font.files.ttf}') format('truetype')`);
        if (font.files.otf) srcParts.push(`url('${font.files.otf}') format('opentype')`);

        if (srcParts.length > 0) {
          fontFaces.push(`
            @font-face {
              font-family: '${font.name}';
              src: ${srcParts.join(',\n')};
              font-weight: normal;
              font-style: normal;
            }
          `);
        }
      }
    }

    const cssString = `
      ${imports.join('\n')}
      ${fontFaces.join('\n')}
      .preview-heading-font {
        font-family: '${settings.headingFont.name}', ${settings.headingFont.fallback} !important;
      }
      .preview-body-font {
        font-family: '${settings.bodyFont.name}', ${settings.bodyFont.fallback} !important;
      }
    `;

    if (!el) {
      el = document.createElement('style');
      el.id = styleId;
      document.head.appendChild(el);
    }
    el.textContent = cssString;

    return () => {
      // Keep it loaded or cleanup
    };
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      const res = await fetch('/api/admin/typography', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        alert('Failed to save typography settings');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving typography settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCustomGoogleFont = () => {
    if (!customGName || !customGUrl) return;
    
    // Quick validation of google fonts url
    if (!customGUrl.includes('fonts.googleapis.com')) {
      alert('Please enter a valid Google Fonts CSS link');
      return;
    }

    // Assign as option
    alert(`Added "${customGName}". You can now select it from the Google Fonts dropdown.`);
    setCustomGName('');
    setCustomGUrl('');
  };

  const handleFontFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/typography/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        // Ask for the font family name for this file
        const familyName = prompt('Enter the Font Family Name for this font (e.g. MyCustomFont):');
        if (!familyName) {
          setUploading(false);
          return;
        }

        const cleanFamilyName = familyName.trim();
        
        // Add to settings customFonts list
        const updatedCustomFonts = [...(settings.customFonts || [])];
        const existingFontIdx = updatedCustomFonts.findIndex(f => f.name.toLowerCase() === cleanFamilyName.toLowerCase());

        if (existingFontIdx > -1) {
          updatedCustomFonts[existingFontIdx].files = {
            ...updatedCustomFonts[existingFontIdx].files,
            [data.ext]: data.url,
          };
        } else {
          updatedCustomFonts.push({
            name: cleanFamilyName,
            files: {
              [data.ext]: data.url,
            }
          });
        }

        setSettings(prev => ({
          ...prev,
          customFonts: updatedCustomFonts,
        }));
      } else {
        const errData = await res.json();
        setUploadError(errData.error || 'Failed to upload font file');
      }
    } catch (err) {
      console.error(err);
      setUploadError('Network error uploading font file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteCustomFont = (nameToDelete: string) => {
    if (!confirm(`Are you sure you want to delete "${nameToDelete}"?`)) return;

    const updatedCustomFonts = (settings.customFonts || []).filter(f => f.name !== nameToDelete);
    
    // Fallback if deleted active fonts
    let heading = { ...settings.headingFont };
    let body = { ...settings.bodyFont };

    if (heading.type === 'custom' && heading.name === nameToDelete) {
      heading = DEFAULT_TYPOGRAPHY.headingFont;
    }
    if (body.type === 'custom' && body.name === nameToDelete) {
      body = DEFAULT_TYPOGRAPHY.bodyFont;
    }

    setSettings({
      ...settings,
      headingFont: heading,
      bodyFont: body,
      customFonts: updatedCustomFonts,
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
        <p className="text-slate-500 font-medium">Loading typography builder...</p>
      </div>
    );
  }

  // Generate selectable font lists
  const availableFonts: { label: string; value: string; type: 'google' | 'custom'; url?: string; fallback: string }[] = [];
  
  // 1. Google Font Presets
  GOOGLE_FONT_PRESETS.forEach(p => {
    availableFonts.push({ label: `${p.name} (Google Font)`, value: p.name, type: 'google', url: p.url, fallback: p.fallback });
  });

  // 2. Custom Uploaded Fonts
  (settings.customFonts || []).forEach(f => {
    availableFonts.push({ label: `${f.name} (Custom Font)`, value: f.name, type: 'custom', fallback: 'sans-serif' });
  });

  const activeHeadingFontObj = availableFonts.find(f => f.value === settings.headingFont.name && f.type === settings.headingFont.type) || availableFonts[1];
  const activeBodyFontObj = availableFonts.find(f => f.value === settings.bodyFont.name && f.type === settings.bodyFont.type) || availableFonts[2];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Type className="h-7 w-7 text-orange-500" />
            Typography & Font System
          </h1>
          <p className="text-slate-500 mt-1">Configure global fonts, upload custom typefaces, and preview font scale pairings.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-10 px-5 shadow-sm" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
            Save & Publish Fonts
          </Button>
          {savedSuccess && (
            <div className="flex items-center gap-1 text-emerald-600 text-sm font-semibold animate-in fade-in duration-200">
              <CheckCircle className="h-4 w-4" /> Saved!
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Font configuration parameters */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Font Assignments</CardTitle>
              <CardDescription>Assign specific typefaces to global CSS selectors globally.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Heading Assignment */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Headings & UI Font</label>
                  <select
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:outline-none focus:border-orange-500 text-sm bg-white"
                    value={`${settings.headingFont.type}:${settings.headingFont.name}`}
                    onChange={(e) => {
                      const [type, name] = e.target.value.split(':');
                      const found = availableFonts.find(f => f.value === name && f.type === type);
                      if (found) {
                        setSettings(prev => ({
                          ...prev,
                          headingFont: {
                            type: found.type,
                            name: found.value,
                            url: found.url,
                            fallback: found.fallback
                          }
                        }));
                      }
                    }}
                  >
                    {availableFonts.map((f) => (
                      <option key={`${f.type}:${f.value}`} value={`${f.type}:${f.value}`}>{f.label}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Applied to h1, h2, h3, h4, h5, h6, and specific navigation elements.
                  </p>
                </div>

                {/* Body Assignment */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Body & Dashboards Font</label>
                  <select
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:outline-none focus:border-orange-500 text-sm bg-white"
                    value={`${settings.bodyFont.type}:${settings.bodyFont.name}`}
                    onChange={(e) => {
                      const [type, name] = e.target.value.split(':');
                      const found = availableFonts.find(f => f.value === name && f.type === type);
                      if (found) {
                        setSettings(prev => ({
                          ...prev,
                          bodyFont: {
                            type: found.type,
                            name: found.value,
                            url: found.url,
                            fallback: found.fallback
                          }
                        }));
                      }
                    }}
                  >
                    {availableFonts.map((f) => (
                      <option key={`${f.type}:${f.value}`} value={`${f.type}:${f.value}`}>{f.label}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Applied to default body text, input forms, lists, tables, and dashboards.
                  </p>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Real-time typography pairing preview box */}
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-1.5">
                  <Eye className="h-5 w-5 text-orange-500" />
                  Live Pairing Preview
                </CardTitle>
                <CardDescription>Visual mock representation of typography pairing.</CardDescription>
              </div>
              <div className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                Dynamic Preview CSS Active
              </div>
            </CardHeader>
            <CardContent className="space-y-6 bg-slate-50/50 p-6 border-t rounded-b-xl">
              <div className="space-y-4">
                <div className="p-4 bg-white border border-slate-150 rounded-2xl shadow-sm space-y-3.5">
                  <span className="text-[10px] font-bold text-orange-500 tracking-widest uppercase">
                    Previewing: H: {settings.headingFont.name} / B: {settings.bodyFont.name}
                  </span>
                  
                  {/* Heading Element */}
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight preview-heading-font">
                    Build & scale your digital platform with style
                  </h2>
                  
                  {/* Body Paragraph */}
                  <p className="text-slate-600 text-sm leading-relaxed preview-body-font">
                    CMS editors should enable clean content curation. Using proper font pairing sets the visual mood, keeps reader retention high, and establishes solid readability. This is Outfit body text paired with a Lexend Deca title.
                  </p>

                  <div className="flex gap-2.5 pt-2">
                    <button className="bg-orange-500 text-white font-bold text-xs h-9 px-4 rounded-xl preview-body-font shadow-sm">
                      Interactive Button
                    </button>
                    <button className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs h-9 px-4 rounded-xl preview-body-font bg-white">
                      Secondary Style
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Custom Font Library and uploads */}
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-1.5">
                <Upload className="h-5 w-5 text-orange-500" />
                Custom Font Library
              </CardTitle>
              <CardDescription>Upload custom Web Fonts (.woff2, .woff, .ttf, .otf).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Upload Zone */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-orange-400 hover:bg-orange-50/10 cursor-pointer rounded-2xl p-6 text-center transition-all duration-150 flex flex-col items-center justify-center gap-2 bg-slate-50/50"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFontFileUpload} 
                  accept=".ttf,.otf,.woff,.woff2" 
                  className="hidden"
                />
                
                {uploading ? (
                  <>
                    <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
                    <p className="text-xs font-semibold text-slate-700 mt-1">Uploading typeface file...</p>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-slate-400" />
                    <p className="text-xs font-semibold text-slate-700">Click to upload custom font file</p>
                    <p className="text-[10px] text-slate-400">Supports WOFF2, WOFF, TTF, OTF</p>
                  </>
                )}
              </div>

              {uploadError && (
                <p className="text-xs text-rose-600 font-semibold">{uploadError}</p>
              )}

              {/* Uploaded custom fonts list */}
              <div className="space-y-2 pt-2 border-t">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">My Uploaded Typefaces</h4>
                
                {(!settings.customFonts || settings.customFonts.length === 0) ? (
                  <p className="text-xs text-slate-400 italic py-2 text-center">No custom fonts uploaded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {settings.customFonts.map((font) => (
                      <div key={font.name} className="flex justify-between items-center bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-xs">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate">{font.name}</p>
                          <p className="text-[9px] text-slate-400 font-medium mt-0.5 uppercase tracking-wider">
                            Formats: {Object.keys(font.files).join(', ')}
                          </p>
                        </div>
                        <button 
                          onClick={() => handleDeleteCustomFont(font.name)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1.5 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
