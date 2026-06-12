'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Monitor, Tablet, Smartphone, Plus, Trash2, ArrowUp, ArrowDown,
  Layout, Type, Image as ImageIcon, Video, HelpCircle, Star, List,
  Settings, Copy, RefreshCw, Wand2, Eye, Download, Upload, AlignLeft,
  Columns, ExternalLink, Bold, Info, Play, CheckSquare, Layers
} from 'lucide-react';

export interface VisualWidget {
  id: string;
  type: string;
  data: Record<string, any>;
  settings: Record<string, any>;
}

export interface VisualColumn {
  id: string;
  width: string; // 'w-full' | 'w-1/2' | 'w-1/3' | 'w-2/3' | 'w-1/4'
  widgets: VisualWidget[];
  settings: Record<string, any>;
}

export interface VisualSection {
  id: string;
  type: string; // 'hero' | 'feature' | 'pricing' | 'faq' | 'testimonials' | 'cta' | 'stats' | 'video' | 'blog_grid' | 'contact' | 'newsletter' | 'gallery' | 'team' | 'comparison' | 'custom'
  columns: VisualColumn[];
  settings: Record<string, any>;
}

interface VisualBuilderProps {
  initialContent: string; // JSON String
  onChange: (json: string) => void;
  pageId?: number | string;
}

export default function VisualBuilder({ initialContent, onChange, pageId = 'new' }: VisualBuilderProps) {
  // Parse initial content
  const getInitialSections = (): VisualSection[] => {
    if (initialContent) {
      try {
        const parsed = JSON.parse(initialContent);
        if (parsed && Array.isArray(parsed.sections)) {
          return parsed.sections;
        }
      } catch (e) {
        console.error('Failed to parse visual builder content', e);
      }
    }
    // Default page layout (Hero)
    return [
      {
        id: 'sec-hero',
        type: 'hero',
        columns: [
          {
            id: 'col-hero-1',
            width: 'w-full',
            widgets: [
              { id: 'w-hero-title', type: 'heading', data: { text: 'Premium Modular Platform Built for Scale', tag: 'h1' }, settings: { fontSize: 'text-4xl md:text-5xl font-extrabold', align: 'center', color: 'text-slate-900', marginBottom: 'mb-4' } },
              { id: 'w-hero-desc', type: 'text', data: { text: 'Create high-converting landing pages, custom documentation systems, and SEO-optimized blogs with zero-code visual assemblies.' }, settings: { fontSize: 'text-base sm:text-lg', align: 'center', color: 'text-slate-600', marginBottom: 'mb-6' } },
              { id: 'w-hero-cta', type: 'button', data: { text: 'Get Started Now', url: '#', style: 'primary' }, settings: { align: 'center', marginBottom: 'mb-4' } }
            ],
            settings: {}
          }
        ],
        settings: { paddingTop: 'py-16', paddingBottom: 'py-16', backgroundColor: '#f8fafc', backgroundType: 'color' }
      }
    ];
  };

  const [sections, setSections] = useState<VisualSection[]>(getInitialSections());
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'add' | 'style' | 'templates'>('add');
  
  // Selected item tracker
  const [selectedElement, setSelectedElement] = useState<{
    type: 'section' | 'column' | 'widget';
    sectionId: string;
    columnId?: string;
    widgetId?: string;
  } | null>(null);

  // Inline text editing states
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState<string>('');

  // Modal templates
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false);
  const [importJson, setImportJson] = useState('');

  // Sync state changes back up
  const syncChanges = (updatedSections: VisualSection[]) => {
    setSections(updatedSections);
    onChange(JSON.stringify({
      editor_type: 'visual',
      sections: updatedSections
    }));
  };

  // Preset Section Templates Loader
  const addSectionPreset = (type: string) => {
    const sectionId = `sec-${Math.random().toString(36).substr(2, 9)}`;
    let columns: VisualColumn[] = [];

    switch (type) {
      case 'hero':
        columns = [
          {
            id: `col-${Math.random().toString(36).substr(2, 9)}`,
            width: 'w-full',
            widgets: [
              { id: `w-${Math.random().toString(36).substr(2, 9)}`, type: 'heading', data: { text: 'Next Generation SaaS Platform', tag: 'h1' }, settings: { fontSize: 'text-4xl md:text-5xl font-extrabold', align: 'center', color: 'text-slate-900', marginBottom: 'mb-4' } },
              { id: `w-${Math.random().toString(36).substr(2, 9)}`, type: 'text', data: { text: 'Deliver lightning fast apps and landing grids utilizing modern, clean design languages.' }, settings: { align: 'center', color: 'text-slate-500', marginBottom: 'mb-6' } },
              { id: `w-${Math.random().toString(36).substr(2, 9)}`, type: 'button', data: { text: 'Start Free Trial', url: '#' }, settings: { align: 'center' } }
            ],
            settings: {}
          }
        ];
        break;
      case 'feature':
        columns = [
          {
            id: `col-${Math.random().toString(36).substr(2, 9)}`,
            width: 'w-1/3',
            widgets: [
              { id: `w-${Math.random().toString(36).substr(2, 9)}`, type: 'icon', data: { name: 'Zap' }, settings: { align: 'center', color: 'text-orange-500' } },
              { id: `w-${Math.random().toString(36).substr(2, 9)}`, type: 'heading', data: { text: 'Fast Performance', tag: 'h3' }, settings: { fontSize: 'text-lg font-bold', align: 'center', marginBottom: 'mb-2' } },
              { id: `w-${Math.random().toString(36).substr(2, 9)}`, type: 'text', data: { text: 'Server rendered grids optimize page speeds.' }, settings: { align: 'center', fontSize: 'text-xs' } }
            ],
            settings: {}
          },
          {
            id: `col-${Math.random().toString(36).substr(2, 9)}`,
            width: 'w-1/3',
            widgets: [
              { id: `w-${Math.random().toString(36).substr(2, 9)}`, type: 'icon', data: { name: 'Shield' }, settings: { align: 'center', color: 'text-blue-500' } },
              { id: `w-${Math.random().toString(36).substr(2, 9)}`, type: 'heading', data: { text: 'Secure Modules', tag: 'h3' }, settings: { fontSize: 'text-lg font-bold', align: 'center', marginBottom: 'mb-2' } },
              { id: `w-${Math.random().toString(36).substr(2, 9)}`, type: 'text', data: { text: 'Encapsulated layout scopes secure assets.' }, settings: { align: 'center', fontSize: 'text-xs' } }
            ],
            settings: {}
          },
          {
            id: `col-${Math.random().toString(36).substr(2, 9)}`,
            width: 'w-1/3',
            widgets: [
              { id: `w-${Math.random().toString(36).substr(2, 9)}`, type: 'icon', data: { name: 'Heart' }, settings: { align: 'center', color: 'text-rose-500' } },
              { id: `w-${Math.random().toString(36).substr(2, 9)}`, type: 'heading', data: { text: 'User Loved', tag: 'h3' }, settings: { fontSize: 'text-lg font-bold', align: 'center', marginBottom: 'mb-2' } },
              { id: `w-${Math.random().toString(36).substr(2, 9)}`, type: 'text', data: { text: 'Modern interfaces create visually stunning layouts.' }, settings: { align: 'center', fontSize: 'text-xs' } }
            ],
            settings: {}
          }
        ];
        break;
      case 'pricing':
        columns = [
          {
            id: `col-${Math.random().toString(36).substr(2, 9)}`,
            width: 'w-1/3',
            widgets: [
              { id: `w-${Math.random().toString(36).substr(2, 9)}`, type: 'heading', data: { text: 'Starter Plan', tag: 'h3' }, settings: { align: 'center', fontWeight: 'font-bold' } },
              { id: `w-${Math.random().toString(36).substr(2, 9)}`, type: 'heading', data: { text: '$19/mo', tag: 'h2' }, settings: { align: 'center', fontSize: 'text-3xl font-extrabold', color: 'text-slate-800' } },
              { id: `w-${Math.random().toString(36).substr(2, 9)}`, type: 'list', data: { items: ['1 User License', 'Standard UI layouts', 'Standard Email Support'] }, settings: {} },
              { id: `w-${Math.random().toString(36).substr(2, 9)}`, type: 'button', data: { text: 'Get Started', url: '#' }, settings: { align: 'center' } }
            ],
            settings: {}
          },
          {
            id: `col-${Math.random().toString(36).substr(2, 9)}`,
            width: 'w-1/3',
            widgets: [
              { id: `w-${Math.random().toString(36).substr(2, 9)}`, type: 'heading', data: { text: 'Pro Plan', tag: 'h3' }, settings: { align: 'center', fontWeight: 'font-bold' } },
              { id: `w-${Math.random().toString(36).substr(2, 9)}`, type: 'heading', data: { text: '$49/mo', tag: 'h2' }, settings: { align: 'center', fontSize: 'text-3xl font-extrabold', color: 'text-orange-500' } },
              { id: `w-${Math.random().toString(36).substr(2, 9)}`, type: 'list', data: { items: ['5 User License', 'Premium builder templates', 'Priority support 24/7'] }, settings: {} },
              { id: `w-${Math.random().toString(36).substr(2, 9)}`, type: 'button', data: { text: 'Upgrade to Pro', url: '#', style: 'primary' }, settings: { align: 'center' } }
            ],
            settings: {}
          },
          {
            id: `col-${Math.random().toString(36).substr(2, 9)}`,
            width: 'w-1/3',
            widgets: [
              { id: `w-${Math.random().toString(36).substr(2, 9)}`, type: 'heading', data: { text: 'Enterprise Plan', tag: 'h3' }, settings: { align: 'center', fontWeight: 'font-bold' } },
              { id: `w-${Math.random().toString(36).substr(2, 9)}`, type: 'heading', data: { text: 'Custom', tag: 'h2' }, settings: { align: 'center', fontSize: 'text-3xl font-extrabold', color: 'text-slate-800' } },
              { id: `w-${Math.random().toString(36).substr(2, 9)}`, type: 'list', data: { items: ['Unlimited seats', 'Custom API access nodes', 'Dedicated account strategist'] }, settings: {} },
              { id: `w-${Math.random().toString(36).substr(2, 9)}`, type: 'button', data: { text: 'Contact Sales', url: '#' }, settings: { align: 'center' } }
            ],
            settings: {}
          }
        ];
        break;
      case 'cta':
        columns = [
          {
            id: `col-${Math.random().toString(36).substr(2, 9)}`,
            width: 'w-full',
            widgets: [
              { id: `w-${Math.random().toString(36).substr(2, 9)}`, type: 'heading', data: { text: 'Ready to build visual responsive platforms?', tag: 'h2' }, settings: { fontSize: 'text-3xl font-bold', align: 'center', color: 'text-white' } },
              { id: `w-${Math.random().toString(36).substr(2, 9)}`, type: 'button', data: { text: 'Get Started Now', url: '#', style: 'secondary' }, settings: { align: 'center' } }
            ],
            settings: {}
          }
        ];
        break;
      default:
        columns = [
          {
            id: `col-${Math.random().toString(36).substr(2, 9)}`,
            width: 'w-full',
            widgets: [
              { id: `w-${Math.random().toString(36).substr(2, 9)}`, type: 'heading', data: { text: 'Custom Row Layout Section', tag: 'h2' }, settings: { align: 'center' } }
            ],
            settings: {}
          }
        ];
    }

    const newSection: VisualSection = {
      id: sectionId,
      type,
      columns,
      settings: {
        paddingTop: 'py-12',
        paddingBottom: 'py-12',
        backgroundColor: type === 'cta' ? '#ea580c' : '#ffffff',
        backgroundType: 'color',
        borderRadius: 'rounded-none',
        boxShadow: 'shadow-none'
      }
    };

    syncChanges([...sections, newSection]);
  };

  // Add individual widget into active highlighted Column
  const addWidgetToColumn = (widgetType: string, sectionId: string, columnId: string) => {
    const updated = sections.map(sec => {
      if (sec.id !== sectionId) return sec;
      const updatedCols = sec.columns.map(col => {
        if (col.id !== columnId) return col;
        const newWidget: VisualWidget = {
          id: `w-${Math.random().toString(36).substr(2, 9)}`,
          type: widgetType,
          data: getWidgetDefaultData(widgetType),
          settings: {
            align: 'left',
            color: 'text-slate-800',
            fontSize: 'text-sm',
            marginBottom: 'mb-4'
          }
        };
        return {
          ...col,
          widgets: [...col.widgets, newWidget]
        };
      });
      return { ...sec, columns: updatedCols };
    });
    syncChanges(updated);
  };

  // Widget Default values mappings
  const getWidgetDefaultData = (type: string) => {
    switch (type) {
      case 'heading':
        return { text: 'New Header Widget', tag: 'h2' };
      case 'text':
        return { text: 'Type or write dynamic page body texts inside this custom widget.' };
      case 'button':
        return { text: 'Click Here', url: '#' };
      case 'image':
        return { url: '', alt: 'Visual Image' };
      case 'video':
        return { url: '' };
      case 'list':
        return { items: ['First Item List', 'Second Item List'] };
      case 'divider':
        return {};
      case 'spacer':
        return { height: 'h-8' };
      case 'rating':
        return { rating: 5, max: 5 };
      case 'custom_html':
        return { code: '<div class="p-4 bg-orange-100 rounded">HTML Custom block</div>' };
      default:
        return { text: 'Placeholder text content' };
    }
  };

  // Handle reordering sections
  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sections.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    syncChanges(updated);
  };

  // Handle deleting elements
  const deleteElement = () => {
    if (!selectedElement) return;
    const { type, sectionId, columnId, widgetId } = selectedElement;

    if (type === 'section') {
      const updated = sections.filter(sec => sec.id !== sectionId);
      syncChanges(updated);
    } else if (type === 'widget' && widgetId && columnId) {
      const updated = sections.map(sec => {
        if (sec.id !== sectionId) return sec;
        const updatedCols = sec.columns.map(col => {
          if (col.id !== columnId) return col;
          return {
            ...col,
            widgets: col.widgets.filter(w => w.id !== widgetId)
          };
        });
        return { ...sec, columns: updatedCols };
      });
      syncChanges(updated);
    }
    setSelectedElement(null);
  };

  // Handle updating selected element styling/content
  const updateSelectedField = (category: 'data' | 'settings', key: string, value: any) => {
    if (!selectedElement) return;
    const { type, sectionId, columnId, widgetId } = selectedElement;

    const updated = sections.map(sec => {
      if (sec.id !== sectionId) return sec;

      if (type === 'section') {
        return {
          ...sec,
          settings: category === 'settings'
            ? { ...sec.settings, [key]: value }
            : sec.settings
        } as VisualSection;
      }

      const updatedCols = sec.columns.map(col => {
        if (col.id !== columnId) return col;

        if (type === 'column') {
          return {
            ...col,
            settings: category === 'settings'
              ? { ...col.settings, [key]: value }
              : col.settings
          } as VisualColumn;
        }

        const updatedWidgets = col.widgets.map(w => {
          if (w.id !== widgetId) return w;
          if (category === 'data') {
            return {
              ...w,
              data: { ...w.data, [key]: value }
            };
          } else {
            return {
              ...w,
              settings: { ...w.settings, [key]: value }
            };
          }
        });

        return { ...col, widgets: updatedWidgets } as VisualColumn;
      });

      return { ...sec, columns: updatedCols } as VisualSection;
    });

    setSections(updated);
    onChange(JSON.stringify({
      editor_type: 'visual',
      sections: updated
    }));
  };

  // Finish inline text editing
  const finishInlineEditing = (wId: string, key: string, val: string) => {
    const updated = sections.map(sec => {
      const updatedCols = sec.columns.map(col => {
        const updatedWidgets = col.widgets.map(w => {
          if (w.id !== wId) return w;
          return {
            ...w,
            data: { ...w.data, [key]: val }
          };
        });
        return { ...col, widgets: updatedWidgets };
      });
      return { ...sec, columns: updatedCols };
    });
    syncChanges(updated);
    setEditingWidgetId(null);
  };

  // Retrieve current selected object properties for panel values
  const getSelectedObject = () => {
    if (!selectedElement) return null;
    const { type, sectionId, columnId, widgetId } = selectedElement;
    const sec = sections.find(s => s.id === sectionId);
    if (!sec) return null;
    if (type === 'section') return sec;

    const col = sec.columns.find(c => c.id === columnId);
    if (!col) return null;
    if (type === 'column') return col;

    const widget = col.widgets.find(w => w.id === widgetId);
    return widget || null;
  };

  const selectedObj = getSelectedObject();
  const selectedWidget = (selectedElement?.type === 'widget' ? selectedObj : null) as VisualWidget | null;

  // Export Templates handler
  const handleExportTemplate = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sections, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `visual_template_page_${pageId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import Templates handler
  const handleImportTemplate = () => {
    if (!importJson) return;
    try {
      const parsed = JSON.parse(importJson);
      if (Array.isArray(parsed)) {
        syncChanges(parsed);
        setTemplatesModalOpen(false);
        setImportJson('');
        alert('Layout template loaded successfully!');
      } else {
        alert('Invalid template format. Must be an array of sections.');
      }
    } catch (e) {
      alert('Error parsing template JSON.');
    }
  };

  // Inline render helper supporting dynamic typography & inline inputs
  const renderWidgetContent = (widget: VisualWidget) => {
    const data = widget.data;
    const settings = widget.settings;
    const alignClass = settings.align === 'center' ? 'text-center' : settings.align === 'right' ? 'text-right' : 'text-left';

    const isEditing = editingWidgetId === widget.id;
    const fontSizeClass = settings.fontSize || '';
    const fontWeightClass = settings.fontWeight || '';
    const paddingLeftClass = settings.paddingLeft || '';
    const marginBottomClass = settings.marginBottom || 'mb-4';
    const customClasses = settings.customClasses || '';
    const textStyle: React.CSSProperties = {};
    if (settings.colorHex) {
      textStyle.color = settings.colorHex;
    }

    switch (widget.type) {
      case 'heading': {
        const Tag = (data.tag || 'h2') as any;
        const fontStyle = fontSizeClass || 'text-2xl font-bold';
        const weightStyle = fontWeightClass || 'font-bold';
        const colorStyle = settings.colorHex ? '' : (settings.color || 'text-slate-800');
        
        if (isEditing) {
          return (
            <input
              type="text"
              value={editingTextValue}
              onChange={(e) => setEditingTextValue(e.target.value)}
              onBlur={() => finishInlineEditing(widget.id, 'text', editingTextValue)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') finishInlineEditing(widget.id, 'text', editingTextValue);
              }}
              autoFocus
              className="w-full bg-slate-100 border border-purple-500 focus:outline-none focus:ring-0 text-slate-900 rounded p-1 font-semibold text-sm"
              style={{ textAlign: settings.align || 'left' }}
            />
          );
        }

        return (
          <Tag
            style={textStyle}
            onDoubleClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              setEditingWidgetId(widget.id);
              setEditingTextValue(data.text || '');
            }}
            className={`${fontStyle} ${weightStyle} ${colorStyle} ${alignClass} ${marginBottomClass} ${paddingLeftClass} ${customClasses} cursor-text select-text`}
          >
            {data.text || 'Heading text (Double click to edit)'}
          </Tag>
        );
      }
      case 'text': {
        const fontStyle = fontSizeClass || 'text-sm sm:text-base';
        const weightStyle = fontWeightClass || 'font-normal';
        const colorStyle = settings.colorHex ? '' : (settings.color || 'text-slate-600');

        if (isEditing) {
          return (
            <textarea
              value={editingTextValue}
              onChange={(e) => setEditingTextValue(e.target.value)}
              onBlur={() => finishInlineEditing(widget.id, 'text', editingTextValue)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  finishInlineEditing(widget.id, 'text', editingTextValue);
                }
              }}
              autoFocus
              className="w-full bg-slate-100 border border-purple-500 focus:outline-none focus:ring-0 text-slate-900 rounded p-1 text-sm min-h-[60px]"
              style={{ textAlign: settings.align || 'left' }}
            />
          );
        }

        return (
          <p
            style={textStyle}
            onDoubleClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              setEditingWidgetId(widget.id);
              setEditingTextValue(data.text || '');
            }}
            className={`leading-relaxed ${fontStyle} ${weightStyle} ${colorStyle} ${alignClass} ${marginBottomClass} ${paddingLeftClass} ${customClasses} cursor-text select-text`}
          >
            {data.text || 'Paragraph text content (Double click to edit)'}
          </p>
        );
      }
      case 'button': {
        const btnStyle = data.style === 'secondary'
          ? 'border border-slate-300 text-slate-700 bg-white px-5 py-2 font-semibold hover:bg-slate-50'
          : data.style === 'dark'
          ? 'bg-slate-900 text-white px-5 py-2 font-semibold hover:bg-slate-850'
          : 'bg-orange-500 text-white px-5 py-2 font-bold hover:bg-orange-600';

        if (isEditing) {
          return (
            <div className={alignClass}>
              <input
                type="text"
                value={editingTextValue}
                onChange={(e) => setEditingTextValue(e.target.value)}
                onBlur={() => finishInlineEditing(widget.id, 'text', editingTextValue)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') finishInlineEditing(widget.id, 'text', editingTextValue);
                }}
                autoFocus
                className="bg-slate-100 border border-purple-500 focus:outline-none focus:ring-0 text-slate-900 rounded px-2 py-1 text-xs text-center inline-block"
                style={{ width: '120px' }}
              />
            </div>
          );
        }

        return (
          <div className={`${alignClass} ${marginBottomClass}`}>
            <button
              onDoubleClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                setEditingWidgetId(widget.id);
                setEditingTextValue(data.text || '');
              }}
              className={`text-xs sm:text-sm rounded-xl transition-all shadow-sm ${btnStyle}`}
            >
              {data.text || 'Submit'}
            </button>
          </div>
        );
      }
      case 'image':
        return (
          <div className={`flex justify-center ${alignClass} my-2 ${marginBottomClass}`}>
            <div className="rounded-2xl overflow-hidden border bg-slate-50 border-slate-100 shadow-sm max-h-40 flex items-center justify-center">
              {data.url ? (
                <img src={data.url} alt={data.alt || 'Widget Image'} className="max-h-full object-contain" />
              ) : (
                <div className="p-8 text-slate-400 flex flex-col items-center">
                  <ImageIcon className="h-6 w-6 mb-1" />
                  <span className="text-[10px] font-semibold">Enter Image URL in Settings</span>
                </div>
              )}
            </div>
          </div>
        );
      case 'video':
        return (
          <div className={`aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200 ${marginBottomClass}`}>
            <div className="flex flex-col items-center text-slate-400">
              <Play className="h-8 w-8 mb-1" />
              <span className="text-[10px] font-bold">Video Player Embed URL Preview</span>
              {data.url && <code className="text-[8px] bg-slate-200 text-slate-600 px-1 py-0.5 rounded mt-1">{data.url}</code>}
            </div>
          </div>
        );
      case 'icon':
        return (
          <div className={`flex justify-center ${alignClass} py-1.5 ${marginBottomClass}`}>
            <div className={`h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center border ${settings.color || 'text-slate-600'}`}>
              <Plus className="h-4 w-4" />
            </div>
          </div>
        );
      case 'list':
        return (
          <ul className={`space-y-1.5 text-xs sm:text-sm text-slate-600 list-disc pl-4 ${marginBottomClass}`}>
            {(data.items || []).map((li: string, idx: number) => (
              <li key={idx}>{li}</li>
            ))}
          </ul>
        );
      case 'divider':
        return <hr className={`my-4 border-t border-slate-200 ${marginBottomClass}`} />;
      case 'spacer':
        return <div className={`${settings.height || 'h-8'} ${marginBottomClass}`} />;
      case 'rating':
        return (
          <div className={`flex items-center gap-0.5 ${marginBottomClass} ${alignClass === 'text-center' ? 'justify-center' : alignClass === 'text-right' ? 'justify-end' : 'justify-start'}`}>
            {Array.from({ length: data.max || 5 }).map((_, i) => (
              <Star key={i} className={`h-4 w-4 ${i < (data.rating || 5) ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`} />
            ))}
          </div>
        );
      case 'custom_html':
        return (
          <div className={`bg-slate-50 border p-3 rounded-lg font-mono text-[10px] text-slate-500 leading-normal overflow-hidden max-h-24 ${marginBottomClass}`}>
            <p className="text-[8px] text-slate-400 font-bold uppercase mb-1 border-b pb-1 select-none">Custom Script HTML block</p>
            <pre className="overflow-x-auto"><code>{data.code || '<!-- Empty HTML block -->'}</code></pre>
          </div>
        );
      default:
        return <div className="text-xs text-slate-400 italic">Widget format loading...</div>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 bg-slate-900 text-slate-100 p-4 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden min-h-[82vh] font-sans">
      {/* LEFT SIDEBAR PANEL: Widgets & Settings controls */}
      <div className="lg:col-span-1 bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-4 flex flex-col max-h-[77vh] overflow-y-auto">
        <div className="flex gap-1 border-b border-slate-800 pb-2 shrink-0">
          <button
            onClick={() => setActiveTab('add')}
            className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'add' ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Plus className="h-3.5 w-3.5 inline mr-1" /> Add
          </button>
          <button
            onClick={() => {
              if (selectedElement) setActiveTab('style');
              else alert('Click on any component inside the canvas to edit its properties.');
            }}
            className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'style' ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Settings className="h-3.5 w-3.5 inline mr-1" /> Style
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'templates' ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Layers className="h-3.5 w-3.5 inline mr-1" /> Layouts
          </button>
        </div>

        {/* TAB 1: ADD ELEMENTS (Section Presets and Widgets) */}
        {activeTab === 'add' && (
          <div className="space-y-4 flex-1">
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Section Library Presets</p>
              <div className="grid grid-cols-2 gap-1.5">
                {['hero', 'feature', 'pricing', 'cta'].map(preset => (
                  <button
                    key={preset}
                    onClick={() => addSectionPreset(preset)}
                    className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-orange-500 hover:bg-slate-900/50 transition-all text-xs font-semibold"
                  >
                    <Layout className="h-4 w-4 text-orange-500 mb-1" />
                    <span className="capitalize">{preset} Presets</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans">Core Widget Library</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { type: 'heading', label: 'Heading', icon: Type },
                  { type: 'text', label: 'Paragraph Text', icon: AlignLeft },
                  { type: 'button', label: 'CTA Button', icon: Bold },
                  { type: 'image', label: 'Image Frame', icon: ImageIcon },
                  { type: 'video', label: 'Video Embed', icon: Video },
                  { type: 'list', label: 'Bullet List', icon: List },
                  { type: 'divider', label: 'Line Divider', icon: Play },
                  { type: 'spacer', label: 'Spacer Gap', icon: Columns },
                  { type: 'rating', label: 'Rating Stars', icon: Star },
                  { type: 'custom_html', label: 'Custom HTML', icon: ExternalLink },
                ].map(item => (
                  <button
                    key={item.type}
                    disabled={!selectedElement || selectedElement.type !== 'column'}
                    onClick={() => {
                      if (selectedElement && selectedElement.columnId) {
                        addWidgetToColumn(item.type, selectedElement.sectionId, selectedElement.columnId);
                      }
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all text-xs font-semibold ${selectedElement && selectedElement.type === 'column' ? 'bg-slate-900 border border-slate-800 hover:border-orange-500 cursor-pointer text-slate-200' : 'bg-slate-900/30 border border-slate-950 text-slate-600 cursor-not-allowed'}`}
                    title={!selectedElement || selectedElement.type !== 'column' ? 'Select a column inside the canvas to place a widget.' : ''}
                  >
                    <item.icon className={`h-4 w-4 mb-1 ${selectedElement && selectedElement.type === 'column' ? 'text-orange-500' : 'text-slate-600'}`} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STYLING & SETTINGS CONTROLS */}
        {activeTab === 'style' && selectedElement && selectedObj && (
          <div className="space-y-4 flex-1 text-slate-300">
            <div className="flex justify-between items-center bg-slate-900 p-2 rounded-lg border border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-500">Editing: {selectedElement.type}</span>
              <button onClick={deleteElement} className="text-red-500 hover:text-red-600 text-xs font-bold flex items-center gap-1">
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            </div>

            {/* WIDGET CONTENT DATA EDITORS */}
            {selectedElement.type === 'widget' && selectedWidget && (
              <div className="space-y-3 p-1 border-b border-slate-800 pb-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Widget Content Details</p>
                {selectedWidget.type === 'heading' && (
                  <div className="space-y-2">
                    <Input
                      placeholder="Heading Text..."
                      value={selectedWidget.data.text || ''}
                      onChange={(e) => updateSelectedField('data', 'text', e.target.value)}
                      className="bg-slate-900 border-slate-800 text-xs text-white"
                    />
                    <select
                      value={selectedWidget.data.tag || 'h2'}
                      onChange={(e) => updateSelectedField('data', 'tag', e.target.value)}
                      className="w-full h-8 px-2 rounded bg-slate-900 border border-slate-800 text-xs text-white"
                    >
                      <option value="h1">Tag H1</option>
                      <option value="h2">Tag H2</option>
                      <option value="h3">Tag H3</option>
                      <option value="h4">Tag H4</option>
                    </select>
                  </div>
                )}
                {selectedWidget.type === 'text' && (
                  <Textarea
                    placeholder="Paragraph details..."
                    value={selectedWidget.data.text || ''}
                    onChange={(e) => updateSelectedField('data', 'text', e.target.value)}
                    className="bg-slate-900 border-slate-800 text-xs text-white h-20"
                  />
                )}
                {selectedWidget.type === 'button' && (
                  <div className="space-y-2">
                    <Input
                      placeholder="Button Label..."
                      value={selectedWidget.data.text || ''}
                      onChange={(e) => updateSelectedField('data', 'text', e.target.value)}
                      className="bg-slate-900 border-slate-800 text-xs"
                    />
                    <Input
                      placeholder="Action Link..."
                      value={selectedWidget.data.url || ''}
                      onChange={(e) => updateSelectedField('data', 'url', e.target.value)}
                      className="bg-slate-900 border-slate-800 text-xs"
                    />
                    <select
                      value={selectedWidget.data.style || 'primary'}
                      onChange={(e) => updateSelectedField('data', 'style', e.target.value)}
                      className="w-full h-8 px-2 rounded bg-slate-900 border border-slate-800 text-xs"
                    >
                      <option value="primary">Brand Orange</option>
                      <option value="secondary">Outline white</option>
                      <option value="dark">Sleek Dark</option>
                    </select>
                  </div>
                )}
                {selectedWidget.type === 'image' && (
                  <div className="space-y-2">
                    <Input
                      placeholder="Image URL..."
                      value={selectedWidget.data.url || ''}
                      onChange={(e) => updateSelectedField('data', 'url', e.target.value)}
                      className="bg-slate-900 border-slate-800 text-xs"
                    />
                    <Input
                      placeholder="Alt Description..."
                      value={selectedWidget.data.alt || ''}
                      onChange={(e) => updateSelectedField('data', 'alt', e.target.value)}
                      className="bg-slate-900 border-slate-800 text-xs"
                    />
                  </div>
                )}
                {selectedWidget.type === 'video' && (
                  <Input
                    placeholder="YouTube/Vimeo Embed Key..."
                    value={selectedWidget.data.url || ''}
                    onChange={(e) => updateSelectedField('data', 'url', e.target.value)}
                    className="bg-slate-900 border-slate-800 text-xs"
                  />
                )}
                {selectedWidget.type === 'custom_html' && (
                  <Textarea
                    placeholder="Custom HTML/CSS raw script..."
                    value={selectedWidget.data.code || ''}
                    onChange={(e) => updateSelectedField('data', 'code', e.target.value)}
                    className="bg-slate-900 border-slate-800 font-mono text-xs h-28"
                  />
                )}
              </div>
            )}

            {/* STYLING CONFIGURATOR CONTROLS */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Styling & Spacing Customizer</p>
              
              {/* Padding Vertical Control */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Vertical Spacing (Padding)</label>
                <select
                  value={selectedObj.settings.paddingTop || 'py-12'}
                  onChange={(e) => {
                    updateSelectedField('settings', 'paddingTop', e.target.value);
                    updateSelectedField('settings', 'paddingBottom', e.target.value);
                  }}
                  className="w-full h-8 px-2 rounded bg-slate-900 border border-slate-800 text-xs"
                >
                  <option value="py-0">None (0)</option>
                  <option value="py-4">Small (16px)</option>
                  <option value="py-8">Medium (32px)</option>
                  <option value="py-12">Large (48px)</option>
                  <option value="py-20">XLarge (80px)</option>
                </select>
              </div>

              {/* Padding Horizontal Control */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Horizontal Spacing (Padding)</label>
                <select
                  value={selectedObj.settings.paddingLeft || 'px-4'}
                  onChange={(e) => updateSelectedField('settings', 'paddingLeft', e.target.value)}
                  className="w-full h-8 px-2 rounded bg-slate-900 border border-slate-800 text-xs"
                >
                  <option value="px-0">None (0)</option>
                  <option value="px-2">Small (8px)</option>
                  <option value="px-4">Medium (16px)</option>
                  <option value="px-8">Large (32px)</option>
                  <option value="px-12">XLarge (48px)</option>
                </select>
              </div>

              {/* Margin Bottom Control */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Margin Bottom</label>
                <select
                  value={selectedObj.settings.marginBottom || 'mb-4'}
                  onChange={(e) => updateSelectedField('settings', 'marginBottom', e.target.value)}
                  className="w-full h-8 px-2 rounded bg-slate-900 border border-slate-800 text-xs"
                >
                  <option value="mb-0">None (0)</option>
                  <option value="mb-2">Small (8px)</option>
                  <option value="mb-4">Medium (16px)</option>
                  <option value="mb-8">Large (32px)</option>
                  <option value="mb-12">XLarge (48px)</option>
                </select>
              </div>

              {/* Text Align Control */}
              {selectedElement.type === 'widget' && (
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Text Alignment</label>
                  <select
                     value={selectedObj.settings.align || 'left'}
                     onChange={(e) => updateSelectedField('settings', 'align', e.target.value)}
                     className="w-full h-8 px-2 rounded bg-slate-900 border border-slate-800 text-xs"
                  >
                    <option value="left">Align Left</option>
                    <option value="center">Align Center</option>
                    <option value="right">Align Right</option>
                  </select>
                </div>
              )}

              {/* Typography Advanced Setup (only for Heading or Text widgets) */}
              {selectedElement.type === 'widget' && (selectedWidget?.type === 'heading' || selectedWidget?.type === 'text') && (
                <>
                  <div className="h-px bg-slate-800 my-1" />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Typography Customizer</p>
                  
                  {/* Font Size */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Font Size</label>
                    <select
                      value={selectedObj.settings.fontSize || 'text-base'}
                      onChange={(e) => updateSelectedField('settings', 'fontSize', e.target.value)}
                      className="w-full h-8 px-2 rounded bg-slate-900 border border-slate-800 text-xs"
                    >
                      <option value="text-xs">Extra Small</option>
                      <option value="text-sm">Small</option>
                      <option value="text-base">Base Paragraph</option>
                      <option value="text-lg">Large Paragraph</option>
                      <option value="text-xl">Heading Small (H3)</option>
                      <option value="text-2xl">Heading Medium (H2)</option>
                      <option value="text-3xl">Heading Large (H1)</option>
                      <option value="text-4xl">Heading Extra Large</option>
                      <option value="text-5xl">Hero Title</option>
                      <option value="text-6xl">Super Title</option>
                    </select>
                  </div>

                  {/* Font Weight */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Font Weight</label>
                    <select
                      value={selectedObj.settings.fontWeight || 'font-normal'}
                      onChange={(e) => updateSelectedField('settings', 'fontWeight', e.target.value)}
                      className="w-full h-8 px-2 rounded bg-slate-900 border border-slate-800 text-xs"
                    >
                      <option value="font-light">Light</option>
                      <option value="font-normal">Normal</option>
                      <option value="font-semibold">Semi Bold</option>
                      <option value="font-bold">Bold</option>
                      <option value="font-extrabold">Extra Bold</option>
                    </select>
                  </div>

                  {/* Text Color Hex picker */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Text Color (Hex)</label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="color"
                        value={selectedObj.settings.colorHex || '#1e293b'}
                        onChange={(e) => updateSelectedField('settings', 'colorHex', e.target.value)}
                        className="w-8 h-8 p-0 border-0 bg-transparent shrink-0"
                      />
                      <Input
                        value={selectedObj.settings.colorHex || '#1e293b'}
                        onChange={(e) => updateSelectedField('settings', 'colorHex', e.target.value)}
                        className="bg-slate-900 border-slate-800 text-xs h-8"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Background Color Control */}
              {selectedElement.type === 'section' && (
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Background Setup</label>
                  <select
                    value={selectedObj.settings.backgroundType || 'color'}
                    onChange={(e) => updateSelectedField('settings', 'backgroundType', e.target.value)}
                    className="w-full h-8 px-2 rounded bg-slate-900 border border-slate-800 text-xs mb-1"
                  >
                    <option value="color">Solid Color</option>
                    <option value="gradient">Custom Gradient</option>
                  </select>
                  {selectedObj.settings.backgroundType === 'gradient' ? (
                    <Input
                      placeholder="linear-gradient(to right, ...)"
                      value={selectedObj.settings.backgroundGradient || ''}
                      onChange={(e) => updateSelectedField('settings', 'backgroundGradient', e.target.value)}
                      className="bg-slate-900 border-slate-800 text-xs"
                    />
                  ) : (
                    <div className="flex gap-2 items-center">
                      <Input
                        type="color"
                        value={selectedObj.settings.backgroundColor || '#ffffff'}
                        onChange={(e) => updateSelectedField('settings', 'backgroundColor', e.target.value)}
                        className="w-8 h-8 p-0 border-0 bg-transparent shrink-0"
                      />
                      <Input
                        value={selectedObj.settings.backgroundColor || '#ffffff'}
                        onChange={(e) => updateSelectedField('settings', 'backgroundColor', e.target.value)}
                        className="bg-slate-900 border-slate-800 text-xs"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Glassmorphism Toggle */}
              <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-800 mt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Glassmorphism Overlay</span>
                <input
                  type="checkbox"
                  checked={!!selectedObj.settings.glassmorphism}
                  onChange={(e) => updateSelectedField('settings', 'glassmorphism', e.target.checked)}
                  className="rounded border-slate-800 bg-slate-900 text-orange-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Entrance Animations */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Entrance Animation Effect</label>
                <select
                  value={selectedObj.settings.animationName || 'none'}
                  onChange={(e) => updateSelectedField('settings', 'animationName', e.target.value)}
                  className="w-full h-8 px-2 rounded bg-slate-900 border border-slate-800 text-xs"
                >
                  <option value="none">None</option>
                  <option value="fade-in">Fade In</option>
                  <option value="slide-up">Slide Up</option>
                  <option value="slide-down">Slide Down</option>
                  <option value="scale-up">Scale Zoom</option>
                </select>
              </div>

              {/* Custom classes */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Custom Tailwind Classes</label>
                <Input
                  placeholder="e.g. shadow-xl rounded-3xl"
                  value={selectedObj.settings.customClasses || ''}
                  onChange={(e) => updateSelectedField('settings', 'customClasses', e.target.value)}
                  className="bg-slate-900 border-slate-800 text-xs"
                />
              </div>

              {/* Hide on Screen Sizes */}
              <div className="space-y-1.5 bg-slate-950 p-2.5 rounded-xl border border-slate-900">
                <p className="text-[9px] font-bold text-slate-500 uppercase">Responsive Visibility Filters</p>
                <div className="flex gap-2 justify-between text-[10px] font-semibold">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedObj.settings.responsiveShowDesktop !== false}
                      onChange={(e) => updateSelectedField('settings', 'responsiveShowDesktop', e.target.checked)}
                      className="rounded w-3.5 h-3.5 bg-slate-900 border-slate-800 text-orange-500"
                    />
                    Desktop
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedObj.settings.responsiveShowTablet !== false}
                      onChange={(e) => updateSelectedField('settings', 'responsiveShowTablet', e.target.checked)}
                      className="rounded w-3.5 h-3.5 bg-slate-900 border-slate-800 text-orange-500"
                    />
                    Tablet
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedObj.settings.responsiveShowMobile !== false}
                      onChange={(e) => updateSelectedField('settings', 'responsiveShowMobile', e.target.checked)}
                      className="rounded w-3.5 h-3.5 bg-slate-900 border-slate-800 text-orange-500"
                    />
                    Mobile
                  </label>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: TEMPLATES MANAGEMENT */}
        {activeTab === 'templates' && (
          <div className="space-y-4 flex-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Export / Import Custom Layouts</p>
            <Button
              onClick={handleExportTemplate}
              className="w-full bg-slate-900 hover:bg-slate-850 text-white border border-slate-800 text-xs flex items-center justify-center gap-1.5 h-9"
            >
              <Download className="h-3.5 w-3.5" /> Export Page JSON
            </Button>
            <Button
              onClick={() => setTemplatesModalOpen(true)}
              className="w-full bg-slate-900 hover:bg-slate-850 text-white border border-slate-800 text-xs flex items-center justify-center gap-1.5 h-9"
            >
              <Upload className="h-3.5 w-3.5" /> Import Section JSON
            </Button>

            <div className="h-px bg-slate-800" />
            
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Preset Demo Layouts</p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  if (confirm('Load demo product sales landing page? This will replace your current editor content.')) {
                    syncChanges([
                      {
                        id: 'sec-s-1',
                        type: 'hero',
                        columns: [
                          {
                            id: 'col-s-1',
                            width: 'w-full',
                            widgets: [
                              { id: 'w-s-1', type: 'heading', data: { text: 'Unleash Real-Time Digital Commerce', tag: 'h1' }, settings: { fontSize: 'text-5xl font-extrabold', align: 'center', color: 'text-slate-950', marginBottom: 'mb-4' } },
                              { id: 'w-s-2', type: 'text', data: { text: 'Everything you need to accept global credit cards, manage subscribers, and scale analytics.' }, settings: { align: 'center', color: 'text-slate-500', marginBottom: 'mb-6' } },
                              { id: 'w-s-3', type: 'button', data: { text: 'Get Started Instantly', url: '#' }, settings: { align: 'center' } }
                            ],
                            settings: {}
                          }
                        ],
                        settings: { paddingTop: 'py-20', paddingBottom: 'py-20', backgroundColor: '#fdf8f5', backgroundType: 'color' }
                      },
                      {
                        id: 'sec-s-2',
                        type: 'pricing',
                        columns: [
                          {
                            id: 'col-s-p1',
                            width: 'w-1/2',
                            widgets: [
                              { id: 'w-s-p1h', type: 'heading', data: { text: 'Standard SaaS', tag: 'h3' }, settings: { align: 'center', fontWeight: 'font-bold' } },
                              { id: 'w-s-p1p', type: 'heading', data: { text: '$29/mo', tag: 'h2' }, settings: { align: 'center', fontSize: 'text-3xl font-extrabold' } },
                              { id: 'w-s-p1l', type: 'list', data: { items: ['Core components API', 'Email notification alerts'] }, settings: {} }
                            ],
                            settings: {}
                          },
                          {
                            id: 'col-s-p2',
                            width: 'w-1/2',
                            widgets: [
                              { id: 'w-s-p2h', type: 'heading', data: { text: 'Enterprise Scale', tag: 'h3' }, settings: { align: 'center', fontWeight: 'font-bold' } },
                              { id: 'w-s-p2p', type: 'heading', data: { text: 'Custom Quote', tag: 'h2' }, settings: { align: 'center', fontSize: 'text-3xl font-extrabold', color: 'text-orange-500' } },
                              { id: 'w-s-p2l', type: 'list', data: { items: ['Unlimited database clusters', '99.99% uptime guarantee SLA'] }, settings: {} }
                            ],
                            settings: {}
                          }
                        ],
                        settings: { paddingTop: 'py-16', paddingBottom: 'py-16', backgroundColor: '#ffffff', backgroundType: 'color' }
                      }
                    ]);
                  }
                }}
                className="w-full text-left p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-orange-500 text-xs font-semibold hover:bg-slate-900/50 transition-all block"
              >
                🚀 Load Product Sales Landing Page
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT VISUAL CANVAS WORKSPACE */}
      <div className="lg:col-span-3 flex flex-col bg-slate-950 border border-slate-800/80 rounded-2xl max-h-[77vh] overflow-hidden relative">
        
        {/* Canvas Toolbar: Viewport selection & size specs */}
        <div className="flex items-center justify-between border-b border-slate-800 p-3 bg-slate-950 shrink-0 select-none">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setViewport('desktop')}
              className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition-colors ${viewport === 'desktop' ? 'bg-slate-800 text-white' : ''}`}
              title="Desktop viewport"
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewport('tablet')}
              className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition-colors ${viewport === 'tablet' ? 'bg-slate-800 text-white' : ''}`}
              title="Tablet viewport"
            >
              <Tablet className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewport('mobile')}
              className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition-colors ${viewport === 'mobile' ? 'bg-slate-800 text-white' : ''}`}
              title="Mobile viewport"
            >
              <Smartphone className="h-4 w-4" />
            </button>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider ml-2">
              Viewport: {viewport === 'desktop' ? '100% width' : viewport === 'tablet' ? '768px (Tablet)' : '375px (Mobile)'}
            </span>
          </div>

          <span className="text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Frontend Editing
          </span>
        </div>

        {/* Scrollable Canvas Area with custom device frame wrappers */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-900 flex justify-center items-start select-none">
          
          {/* Viewport Frame wrapper for Browser/Tablet/Mobile styling */}
          <div className="transition-all duration-300 w-full flex justify-center">
            
            {viewport === 'desktop' ? (
              /* Desktop Mock Browser Frame */
              <div className="w-full bg-white border border-slate-200 shadow-2xl rounded-xl overflow-hidden transition-all duration-300">
                <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center gap-2 text-xs text-slate-400 select-none">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400 block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400 block" />
                  </div>
                  <div className="bg-white border rounded px-3 py-0.5 text-[10px] w-64 text-center truncate ml-4">
                    http://localhost:3000/preview-page
                  </div>
                </div>
                
                <div className="bg-white text-slate-850 min-h-[520px]">
                  {renderCanvasBody()}
                </div>
              </div>
            ) : viewport === 'tablet' ? (
              /* Tablet Mockup Frame */
              <div className="w-[792px] bg-slate-950 p-[12px] rounded-[32px] shadow-2xl transition-all duration-300 border-4 border-slate-800">
                <div className="bg-white text-slate-850 min-h-[600px] rounded-2xl overflow-hidden">
                  {renderCanvasBody()}
                </div>
              </div>
            ) : (
              /* Mobile Mockup Frame */
              <div className="w-[399px] bg-slate-950 p-[12px] rounded-[38px] shadow-2xl relative transition-all duration-300 border-4 border-slate-800">
                {/* Camera / Speaker notch */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-950 rounded-full z-30 flex items-center justify-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-800 block mr-2" />
                  <span className="w-8 h-1 bg-slate-800 rounded-full block" />
                </div>
                
                <div className="bg-white text-slate-850 min-h-[560px] rounded-[28px] overflow-hidden pt-6">
                  {renderCanvasBody()}
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>

      {/* IMPORT JSON MODAL */}
      <Dialog open={templatesModalOpen} onOpenChange={setTemplatesModalOpen}>
        <DialogContent className="max-w-md bg-slate-900 border border-slate-800 text-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold uppercase tracking-wider text-slate-300">Import Visual Layout JSON</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Textarea
              placeholder="Paste visual editor section JSON array here..."
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              className="bg-slate-950 border-slate-800 text-slate-200 font-mono text-xs h-40"
            />
            <Button onClick={handleImportTemplate} className="w-full bg-orange-500 text-white hover:bg-orange-600 font-bold h-9">
              Apply Layout Schema
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  // Render Canvas Body Wrapper containing the outline indicators
  function renderCanvasBody() {
    if (sections.length === 0) {
      return (
        <div className="p-20 text-center text-slate-400 italic">
          Canvas is empty. Click presets on the sidebar library to construct page layouts.
        </div>
      );
    }

    return sections.map((sec, secIdx) => {
      const isSelected = selectedElement && selectedElement.type === 'section' && selectedElement.sectionId === sec.id;
      const secBg = sec.settings.backgroundType === 'gradient' ? { backgroundImage: sec.settings.backgroundGradient } : { backgroundColor: sec.settings.backgroundColor || '#ffffff' };
      
      return (
        <div
          key={sec.id}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedElement({ type: 'section', sectionId: sec.id });
            setActiveTab('style');
          }}
          style={secBg}
          className={`relative group/section border-2 transition-all ${sec.settings.paddingTop || 'py-12'} ${sec.settings.paddingBottom || 'py-12'} ${sec.settings.paddingLeft || 'px-4'} ${
            isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-transparent hover:border-blue-400/60'
          }`}
        >
          {/* Label Badge overlay for visual guides */}
          <div className={`absolute -top-3.5 left-4 bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-t-md z-30 select-none uppercase tracking-wider flex items-center gap-1 shadow-sm transition-opacity pointer-events-none ${
            isSelected ? 'opacity-100' : 'opacity-0 group-hover/section:opacity-100'
          }`}>
            <Layout className="h-2.5 w-2.5" /> Section: {sec.type}
          </div>

          {/* Section actions header bubble */}
          <div className="absolute top-1.5 right-1.5 opacity-0 group-hover/section:opacity-100 transition-opacity bg-slate-900/90 text-white rounded-lg p-1 text-[10px] font-bold flex items-center gap-1.5 z-20 border border-slate-800 shadow-lg">
            <button onClick={(e) => { e.stopPropagation(); moveSection(secIdx, 'up'); }} disabled={secIdx === 0} className="p-1 hover:bg-slate-800 rounded disabled:opacity-30">
              <ArrowUp className="h-3 w-3" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); moveSection(secIdx, 'down'); }} disabled={secIdx === sections.length - 1} className="p-1 hover:bg-slate-800 rounded disabled:opacity-30">
              <ArrowDown className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const duplicateSec = JSON.parse(JSON.stringify(sec));
                duplicateSec.id = `sec-${Math.random().toString(36).substr(2, 9)}`;
                const updated = [...sections];
                updated.splice(secIdx + 1, 0, duplicateSec);
                syncChanges(updated);
              }}
              className="p-1 hover:bg-slate-800 rounded text-slate-300"
              title="Duplicate section"
            >
              <Copy className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                syncChanges(sections.filter(s => s.id !== sec.id));
                setSelectedElement(null);
              }}
              className="p-1 hover:bg-red-900 rounded text-red-400"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>

          {/* Columns grid wrapper */}
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-flow-col gap-6 items-start">
            {sec.columns.map((col) => {
              const isColSelected = selectedElement && selectedElement.type === 'column' && selectedElement.columnId === col.id;
              
              return (
                <div
                  key={col.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedElement({ type: 'column', sectionId: sec.id, columnId: col.id });
                    setActiveTab('add');
                  }}
                  className={`p-3 border-2 border-dashed rounded-xl transition-all min-h-[80px] relative group/column ${
                    isColSelected ? 'border-amber-500 bg-amber-50/5' : 'border-slate-200/50 hover:border-amber-400/60'
                  }`}
                >
                  {/* Column indicator badge */}
                  <div className={`absolute -top-3 left-4 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-t-md z-30 select-none uppercase tracking-wider flex items-center gap-1 shadow-sm transition-opacity pointer-events-none ${
                    isColSelected ? 'opacity-100' : 'opacity-0 group-hover/column:opacity-100'
                  }`}>
                    <Columns className="h-2.5 w-2.5" /> Column ({col.width})
                  </div>
                  
                  {/* Render widgets inside columns */}
                  <div className="space-y-4 pt-4">
                    {col.widgets.map((widget) => {
                      const isWidgetSelected = selectedElement && selectedElement.type === 'widget' && selectedElement.widgetId === widget.id;
                      
                      return (
                        <div
                          key={widget.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedElement({
                              type: 'widget',
                              sectionId: sec.id,
                              columnId: col.id,
                              widgetId: widget.id
                            });
                            setActiveTab('style');
                          }}
                          className={`relative p-2.5 rounded-lg border-2 transition-all group/widget cursor-pointer ${
                            isWidgetSelected ? 'border-purple-500 bg-purple-50/5' : 'border-transparent hover:border-purple-400/60'
                          }`}
                        >
                          {/* Widget label badge overlay */}
                          <div className={`absolute -top-3 left-4 bg-purple-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-t-md z-30 select-none uppercase tracking-wider flex items-center gap-1 shadow-sm transition-opacity pointer-events-none ${
                            isWidgetSelected ? 'opacity-100' : 'opacity-0 group-hover/widget:opacity-100'
                          }`}>
                            <Type className="h-2.5 w-2.5" /> Widget: {widget.type}
                          </div>

                          {renderWidgetContent(widget)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    });
  }
}
