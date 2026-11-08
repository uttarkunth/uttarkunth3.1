'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Images, X } from 'lucide-react';
import { PropertyImage } from '@/components/property-image';

export interface PropertyGalleryPhoto {
  url: string;
  category: 'property' | 'room' | 'washroom';
  label: string;
  alt: string;
}

type GalleryFilter = 'all' | 'property' | 'room' | 'washroom';
const FILTERS: { value: GalleryFilter; label: string }[] = [
  { value: 'all', label: 'All photos' },
  { value: 'property', label: 'Property' },
  { value: 'room', label: 'Rooms' },
  { value: 'washroom', label: 'Washrooms' },
];

export function PropertyPhotoGallery({ propertyName, photos }: { propertyName: string; photos: PropertyGalleryPhoto[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<GalleryFilter>('all');
  const filteredPhotos = useMemo(() => filter === 'all' ? photos : photos.filter((photo) => photo.category === filter), [photos, filter]);
  const activePhoto = filteredPhotos[activeIndex] || filteredPhotos[0];
  const showPrevious = () => setActiveIndex((index) => (index - 1 + filteredPhotos.length) % filteredPhotos.length);
  const showNext = () => setActiveIndex((index) => (index + 1) % filteredPhotos.length);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
      if (event.key === 'ArrowLeft' && filteredPhotos.length > 1) showPrevious();
      if (event.key === 'ArrowRight' && filteredPhotos.length > 1) showNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredPhotos.length]);

  const openGallery = () => { setFilter('all'); setActiveIndex(0); setIsOpen(true); };

  return (
    <section className="space-y-3">
      <div className="relative aspect-[16/9] max-h-[560px] w-full overflow-hidden rounded-3xl bg-forest-dark shadow-soft">
        {photos.length > 0 ? (
          <>
            <PropertyImage src={photos[activeIndex]?.url || photos[0].url} alt={photos[activeIndex]?.alt || propertyName} fill
              sizes="(max-width: 768px) 100vw, 1200px" transformWidth={1200} transformHeight={800} priority className="object-cover" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />
            <div className="absolute bottom-5 left-5 z-10 text-white">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/75">{photos[activeIndex]?.label}</p>
              <p className="text-sm font-medium">{activeIndex + 1} of {photos.length} photos</p>
            </div>
            {photos.length > 1 && (
              <>
                <button type="button" onClick={showPrevious} aria-label="Previous photo" className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/45 p-3 text-white backdrop-blur hover:bg-black/70"><ChevronLeft className="h-5 w-5" /></button>
                <button type="button" onClick={showNext} aria-label="Next photo" className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/45 p-3 text-white backdrop-blur hover:bg-black/70"><ChevronRight className="h-5 w-5" /></button>
                <div className="absolute left-5 right-5 top-4 z-10 flex gap-1.5">
                  {photos.map((photo, index) => <button key={photo.url} type="button" aria-label={`Show photo ${index + 1}`} onClick={() => setActiveIndex(index)} className={`h-1 flex-1 rounded-full transition ${index === activeIndex ? 'bg-white' : 'bg-white/45'}`} />)}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-ivory/70"><Images className="h-12 w-12" /><span className="text-sm">Property photographs coming soon</span></div>
        )}
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-charcoal-muted">{photos.length ? `${photos.length} property and room photos` : 'Photos will appear here once the host uploads them.'}</p>
        {photos.length > 0 && <button type="button" onClick={openGallery} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-forest/25 bg-white px-4 py-2.5 text-xs font-semibold text-forest shadow-sm transition hover:bg-forest/5"><Images className="h-4 w-4" />View all photos</button>}
      </div>

      {isOpen && activePhoto && (
        <div role="dialog" aria-modal="true" aria-label={`${propertyName} photo gallery`} className="fixed inset-0 z-[100] flex flex-col bg-charcoal/95 p-3 text-white backdrop-blur-sm sm:p-6">
          <div className="flex items-center justify-between gap-3 pb-4">
            <div><p className="font-serif text-xl font-semibold">{propertyName}</p><p className="text-xs text-white/65">{filteredPhotos.length} photos</p></div>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Close gallery" className="rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20"><X className="h-5 w-5" /></button>
          </div>
          <div className="flex flex-wrap gap-2 pb-4">
            {FILTERS.map((item) => {
              const count = item.value === 'all' ? photos.length : photos.filter((photo) => photo.category === item.value).length;
              if (count === 0) return null;
              return <button key={item.value} type="button" onClick={() => { setFilter(item.value); setActiveIndex(0); }} className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${filter === item.value ? 'bg-white text-charcoal' : 'bg-white/10 text-white hover:bg-white/20'}`}>{item.label} · {count}</button>;
            })}
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center">
            <div className="relative h-full max-h-[70vh] w-full max-w-6xl"><PropertyImage src={activePhoto.url} alt={activePhoto.alt} fill sizes="100vw" transformWidth={1200} transformHeight={800} className="object-contain" /></div>
            {filteredPhotos.length > 1 && (
              <>
                <button type="button" onClick={showPrevious} aria-label="Previous photo" className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-3 hover:bg-white/25 sm:left-5"><ChevronLeft className="h-6 w-6" /></button>
                <button type="button" onClick={showNext} aria-label="Next photo" className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-3 hover:bg-white/25 sm:right-5"><ChevronRight className="h-6 w-6" /></button>
              </>
            )}
          </div>
          <div className="flex items-center justify-between gap-3 py-3 text-xs text-white/75"><span>{activePhoto.label}</span><span>{activeIndex + 1} / {filteredPhotos.length}</span></div>
          {filteredPhotos.length > 1 && <div className="flex gap-2 overflow-x-auto pb-1">{filteredPhotos.map((photo, index) => <button key={photo.url} type="button" onClick={() => setActiveIndex(index)} aria-label={`Open photo ${index + 1}`} className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${index === activeIndex ? 'border-white' : 'border-transparent opacity-60'}`}><PropertyImage src={photo.url} alt={photo.alt} fill sizes="80px" transformWidth={160} transformHeight={100} className="object-cover" /></button>)}</div>}
        </div>
      )}
    </section>
  );
}

export function RoomPhotoCarousel({ photos, alt }: { photos: string[]; alt: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  if (!photos || photos.length === 0) return null;
  const next = () => setActiveIndex((index) => (index + 1) % photos.length);
  const previous = () => setActiveIndex((index) => (index - 1 + photos.length) % photos.length);
  return (
    <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl bg-ivory-warm">
      <PropertyImage src={photos[activeIndex] || photos[0]} alt={`${alt} photo ${activeIndex + 1}`} fill sizes="(max-width: 640px) 100vw, 50vw" transformWidth={600} transformHeight={400} className="object-cover" />
      {photos.length > 1 && (
        <>
          <button type="button" onClick={previous} aria-label={`Previous ${alt} photo`} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-2 text-white hover:bg-black/70"><ChevronLeft className="h-4 w-4" /></button>
          <button type="button" onClick={next} aria-label={`Next ${alt} photo`} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-2 text-white hover:bg-black/70"><ChevronRight className="h-4 w-4" /></button>
          <span className="absolute bottom-2 right-2 rounded-full bg-black/55 px-2 py-1 text-[10px] font-semibold text-white">{activeIndex + 1}/{photos.length}</span>
        </>
      )}
    </div>
  );
}
