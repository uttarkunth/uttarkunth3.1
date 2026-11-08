'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, CheckCircle, AlertCircle, Sparkles, Star } from 'lucide-react';

interface PhotoUploaderProps {
  label: string;
  description?: string;
  photos: string[];
  onChange: (photos: string[]) => void;
  coverPhoto?: string;
  onCoverChange?: (url: string) => void;
  category?: 'general' | 'room' | 'washroom' | 'cover';
  maxPhotos?: number;
  showGuidelines?: boolean;
  excludePhotos?: string[];
}

export function PhotoUploader({
  label,
  description,
  photos,
  onChange,
  coverPhoto,
  onCoverChange,
  category = 'general',
  maxPhotos = 12,
  showGuidelines = false,
  excludePhotos = [],
}: PhotoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadError(null);
    setUploadSuccess(null);
    setIsUploading(true);

    const uploadedUrls: string[] = [];
    const usedUrls = new Set([...photos, ...excludePhotos]);
    let skippedDuplicateCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Accept common web image formats. The API verifies actual file bytes.
      const lowerName = file.name.toLowerCase();
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const allowedExtensions = /\.(jpe?g|png|webp)$/i.test(lowerName);
      if (!allowedMimeTypes.includes(file.type.toLowerCase()) && !allowedExtensions) {
        setUploadError('"' + file.name + '" is not a supported image. Please upload a JPEG, PNG or WebP photo.');
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // Match the existing Supabase property-photos bucket limit (10 MB).
      if (file.size <= 0 || file.size > 10 * 1024 * 1024) {
        setUploadError('"' + file.name + '" exceeds 10 MB (' + (file.size / (1024 * 1024)).toFixed(1) + ' MB). Maximum upload size is 10 MB.');
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);

      try {
        const res = await fetch('/api/host/photos/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.error || `Upload failed for ${file.name}`);
        }

        if (usedUrls.has(data.url)) {
          skippedDuplicateCount += 1;
        } else {
          uploadedUrls.push(data.url);
          usedUrls.add(data.url);
        }
      } catch (err: any) {
        setUploadError(err.message || `Failed to upload ${file.name}`);
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }

    const updated = [...photos, ...uploadedUrls].slice(0, maxPhotos);
    onChange(updated);

    // If no cover photo is set yet and this is general photos, set the first uploaded one
    if (onCoverChange && !coverPhoto && updated.length > 0) {
      onCoverChange(updated[0]);
    }

    setUploadSuccess(
      uploadedUrls.length > 0
        ? `Added ${uploadedUrls.length} new photo${uploadedUrls.length > 1 ? 's' : ''}.${skippedDuplicateCount ? ` Skipped ${skippedDuplicateCount} duplicate photo${skippedDuplicateCount > 1 ? 's' : ''} already used in another section.` : ''}`
        : skippedDuplicateCount > 0
          ? 'These photos are already used in another photo section, so they were skipped.'
          : 'No new photos were added.'
    );
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';

    setTimeout(() => setUploadSuccess(null), 4000);
  };

  const removePhoto = (urlToRemove: string) => {
    const updated = photos.filter((url) => url !== urlToRemove);
    onChange(updated);
    if (onCoverChange && coverPhoto === urlToRemove) {
      onCoverChange(updated[0] || '');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <div>
          <label className="block text-sm font-semibold text-stone-900">{label}</label>
          {description && <p className="text-xs text-stone-500">{description}</p>}
        </div>
        <span className="text-xs font-medium text-stone-500">
          {photos.length} / {maxPhotos} photos
        </span>
      </div>

      {showGuidelines && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-stone-800 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-amber-900">
            <Sparkles className="w-4 h-4 text-amber-700" />
            <span>Photography Guidelines & Standards (For Top Rankings & Sharp Display)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="bg-white/80 p-2.5 rounded-lg border border-amber-100">
              <p className="font-semibold text-stone-900 mb-1">1. File Specifications</p>
              <ul className="list-disc list-inside space-y-0.5 text-stone-600">
                <li><strong>Format:</strong> JPEG, PNG or WebP (no RAW files).</li>
                <li><strong>Orientation:</strong> Landscape is recommended; portrait photos are accepted.</li>
                <li><strong>Resolution:</strong> Aim for at least 1800×1200px (3:2) for property photography.</li>
              </ul>
            </div>
            <div className="bg-white/80 p-2.5 rounded-lg border border-amber-100">
              <p className="font-semibold text-stone-900 mb-1">2. Compression & Size</p>
              <ul className="list-disc list-inside space-y-0.5 text-stone-600">
                <li><strong>Limit:</strong> 10 MB per original photo.</li>
                <li><strong>Tip:</strong> Upload the original photograph; Uttarkunth serves smaller optimized card images automatically.</li>
              </ul>
            </div>
            <div className="bg-white/80 p-2.5 rounded-lg border border-amber-100">
              <p className="font-semibold text-stone-900 mb-1">3. Shooting Best Practices</p>
              <ul className="list-disc list-inside space-y-0.5 text-stone-600">
                <li><strong>Lighting:</strong> Open curtains, warm indoor lamps. Avoid harsh flash.</li>
                <li><strong>Angles:</strong> Shoot wide from room corners at chest level (3–5 ft).</li>
                <li><strong>De-clutter:</strong> Hide cables, bins & personal items. Clean spaces book faster!</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Upload trigger area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
          photos.length >= maxPhotos
            ? 'border-stone-200 bg-stone-50 cursor-not-allowed opacity-60'
            : 'border-stone-300 bg-stone-50 hover:bg-emerald-50/50 hover:border-emerald-500'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          multiple
          disabled={isUploading || photos.length >= maxPhotos}
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
            {isUploading ? (
              <div className="w-6 h-6 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-6 h-6" />
            )}
          </div>
          <p className="text-sm font-semibold text-stone-800">
            {isUploading ? 'Uploading to Uttarkunth Gallery...' : 'Tap to select photos from your device / gallery'}
          </p>
          <p className="text-xs text-stone-500 mt-1">
            Original JPEG / PNG / WebP upload • Max 10 MB each • 1800 × 1200 px recommended
          </p>
        </div>
      </div>

      {uploadError && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {uploadSuccess && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {/* Gallery Previews Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
          {photos.map((url, idx) => {
            const isCover = coverPhoto === url;
            return (
              <div
                key={url + idx}
                className="group relative aspect-[3/2] rounded-lg overflow-hidden border border-stone-200 bg-stone-100 shadow-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Upload ${idx + 1}`}
                  className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between p-2">
                  {onCoverChange && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCoverChange(url);
                      }}
                      className={`text-xs px-2 py-1 rounded font-medium flex items-center gap-1 transition ${
                        isCover
                          ? 'bg-amber-500 text-white'
                          : 'bg-black/60 text-white hover:bg-black/80'
                      }`}
                      title="Set as Main Cover Photo"
                    >
                      <Star className={`w-3 h-3 ${isCover ? 'fill-white' : ''}`} />
                      {isCover ? 'Cover' : 'Make Cover'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePhoto(url);
                    }}
                    className="ml-auto p-1.5 bg-rose-600/90 hover:bg-rose-700 text-white rounded-md transition shadow"
                    title="Remove Photo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {isCover && (
                  <span className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                    Cover Photo
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
