'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Image as ImageIcon, Loader2, Upload, Trash2, Save, FileClock } from 'lucide-react';

interface MediaItem {
  id: number;
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  alt_text: string | null;
  title_text: string | null;
  created_at: string;
}

export default function MediaClient() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [altText, setAltText] = useState('');
  const [titleText, setTitleText] = useState('');
  const [updatingMeta, setUpdatingMeta] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchMedia = async () => {
    try {
      const res = await fetch('/api/admin/media');
      if (res.ok) {
        setMedia(await res.json());
      }
    } catch (err) {
      console.error('Error fetching media:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/media', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setMedia(prev => [data.media, ...prev]);
      } else {
        const errData = await res.json();
        alert(errData.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleItemClick = (item: MediaItem) => {
    setSelectedItem(item);
    setAltText(item.alt_text || '');
    setTitleText(item.title_text || '');
  };

  const handleSaveMeta = async () => {
    if (!selectedItem) return;

    setUpdatingMeta(true);
    try {
      const res = await fetch(`/api/admin/media/${selectedItem.id}/metadata`, {
        // Wait, did we create a metadata update endpoint?
        // Let's check: in our API design, we can PUT to /api/admin/media/[id] or handle it directly inside a unified route.
        // Let's see: we can put a PUT route in /api/admin/media/[id] to update metadata!
        // Yes, let's create a PUT handler in /api/admin/media/[id] to handle metadata updates!
        // That is very clean.
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alt_text: altText, title_text: titleText }),
      });

      if (res.ok) {
        setMedia(media.map(m => m.id === selectedItem.id ? { ...m, alt_text: altText, title_text: titleText } : m));
        setSelectedItem(null);
      } else {
        alert('Failed to save metadata');
      }
    } catch (err) {
      console.error('Failed to save meta:', err);
    } finally {
      setUpdatingMeta(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    if (!confirm('Are you sure you want to delete this media file? It will be deleted from your disk permanently.')) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/media/${selectedItem.id}`, { method: 'DELETE' });
      if (res.ok) {
        setMedia(media.filter(m => m.id !== selectedItem.id));
        setSelectedItem(null);
      } else {
        alert('Failed to delete media');
      }
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeleting(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Media Library</h1>
          <p className="text-slate-500 mt-1">Upload files, structure alternative tags and descriptions.</p>
        </div>

        <label className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-orange-500/10">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload New File
          <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {/* Grid Library */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
          <p className="text-slate-400 text-sm">Loading media items...</p>
        </div>
      ) : media.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 bg-white rounded-xl text-slate-400">
          <ImageIcon className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-600">No Media Files Uploaded</p>
          <p className="text-sm mt-1">Drag files here or upload a featured image to start building your library.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {media.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleItemClick(item)}
              className="group text-left border border-slate-200/80 hover:border-orange-400 rounded-xl overflow-hidden bg-white shadow-sm transition-all focus:outline-none"
            >
              <div className="aspect-video w-full bg-slate-50 overflow-hidden relative border-b border-slate-100">
                <img src={item.file_path} alt={item.alt_text || item.filename} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-250" />
              </div>
              <div className="p-3">
                <p className="text-xs font-semibold text-slate-800 truncate">{item.filename}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{formatBytes(item.file_size)}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detailed Edit Modal */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-2xl bg-white flex flex-col md:flex-row gap-6 max-h-[85vh] overflow-y-auto">
          {selectedItem && (
            <>
              {/* Preview */}
              <div className="flex-1 min-w-[200px] border border-slate-100 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center p-2">
                <img src={selectedItem.file_path} alt="Preview" className="max-w-full max-h-[300px] md:max-h-[400px] object-contain rounded" />
              </div>

              {/* Edit Details */}
              <div className="flex-1 space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <DialogHeader className="border-b pb-2">
                    <DialogTitle className="text-base font-bold text-slate-900 truncate">
                      File Properties
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-1 text-xs text-slate-500 font-medium">
                    <p><span className="text-slate-400">Name:</span> {selectedItem.filename}</p>
                    <p><span className="text-slate-400">Type:</span> {selectedItem.mime_type}</p>
                    <p><span className="text-slate-400">Size:</span> {formatBytes(selectedItem.file_size)}</p>
                    <p><span className="text-slate-400">URL:</span> <code className="bg-slate-50 px-1 py-0.5 border rounded select-all font-mono text-[10px]">{selectedItem.file_path}</code></p>
                  </div>

                  <div className="h-px bg-slate-100" />

                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Alternative Text (Alt)</label>
                      <Input
                        value={altText}
                        onChange={(e) => setAltText(e.target.value)}
                        placeholder="Describe the image content..."
                        className="h-9 text-xs border-slate-200"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Image Title</label>
                      <Input
                        value={titleText}
                        onChange={(e) => setTitleText(e.target.value)}
                        placeholder="Image title tag..."
                        className="h-9 text-xs border-slate-200"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t mt-4">
                  <Button
                    onClick={handleSaveMeta}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold h-9 gap-1"
                    disabled={updatingMeta}
                  >
                    {updatingMeta ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save Metadata
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDelete}
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 text-xs font-bold h-9 gap-1"
                    disabled={deleting}
                  >
                    {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    Delete File
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
