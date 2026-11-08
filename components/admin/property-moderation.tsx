'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2, XCircle, AlertTriangle, Eye, Shield, Clock,
  ArrowRight, Sparkles, Image as ImageIcon, MapPin, BedDouble, RefreshCw, ExternalLink, X
} from 'lucide-react';

interface Property {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  address?: string | null;
  exact_address?: string | null;
  google_maps_url?: string | null;
  pending_exact_address?: string | null;
  pending_google_maps_url?: string | null;
  village?: string | null;
  district?: string | null;
  state?: string | null;
  property_type: string;
  amenities?: any;
  photos?: any;
  published: boolean;
  moderation_status: string;
  moderation_notes?: string | null;
  pending_changes?: any;
  pending_changes_status?: string | null;
  pending_changes_admin_notes?: string | null;
  pending_changes_submitted_at?: string | null;
  contact_phone?: string | null;
  contact_whatsapp?: string | null;
  contact_email?: string | null;
  house_rules?: string | null;
  check_in_time?: string | null;
  check_out_time?: string | null;
  created_at: string;
  room_units?: any[];
}

interface PropertyModerationProps {
  initialProperties: Property[];
}

export function PropertyModerationEngine({ initialProperties }: PropertyModerationProps) {
  const router = useRouter();
  const [tab, setTab] = useState<'staged' | 'pending' | 'all'>('staged');
  const [adminNotes, setAdminNotes] = useState<{ [id: string]: string }>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<{ url: string; alt: string } | null>(null);

  const stagedProperties = initialProperties.filter(
    (p) =>
      p.pending_changes_status === 'pending' ||
      (p.pending_changes_status !== 'rejected' && (
        (p.pending_changes !== null && p.pending_changes !== undefined) ||
        Boolean(p.pending_exact_address) ||
        Boolean(p.pending_google_maps_url)
      ))
  );
  const pendingApplications = initialProperties.filter(
    (p) =>
      p.moderation_status === 'pending' &&
      !p.pending_changes &&
      !p.pending_exact_address &&
      !p.pending_google_maps_url
  );
  const allProperties = initialProperties;

  const handleModeration = async (propertyId: string, action: string) => {
    setErrorMsg(null);
    if (action === 'reject_staged' && !adminNotes[propertyId]?.trim()) {
      setErrorMsg('Please explain what was rejected and what corrections the host must make.');
      return;
    }
    setSubmittingId(propertyId);

    try {
      const res = await fetch('/api/admin/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: propertyId,
          action,
          admin_notes: adminNotes[propertyId] || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Moderation action failed.');
      }

      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Action failed');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-ukorange">
            Administrative Engine
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-forest mt-1">
            Property Moderation & Staging
          </h1>
          <p className="text-sm text-charcoal-muted mt-1">
            Review proposed updates to live homestays and new property applications.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-forest/15 shadow-xs overflow-x-auto">
          <button suppressHydrationWarning
            type="button"
            onClick={() => setTab('staged')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              tab === 'staged' ? 'bg-forest text-white shadow-xs' : 'text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <span>Staged Updates</span>
            <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
              tab === 'staged' ? 'bg-white/20 text-white' : 'bg-ukorange/15 text-ukorange'
            }`}>
              {stagedProperties.length}
            </span>
          </button>

          <button suppressHydrationWarning
            type="button"
            onClick={() => setTab('pending')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              tab === 'pending' ? 'bg-forest text-white shadow-xs' : 'text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <span>New Applications</span>
            <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
              tab === 'pending' ? 'bg-white/20 text-white' : 'bg-forest/10 text-forest'
            }`}>
              {pendingApplications.length}
            </span>
          </button>

          <button suppressHydrationWarning
            type="button"
            onClick={() => setTab('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
              tab === 'all' ? 'bg-forest text-white shadow-xs' : 'text-charcoal-muted hover:text-charcoal'
            }`}
          >
            All Listings ({allProperties.length})
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-2xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TAB 1: STAGED UPDATES (Diff Viewer) */}
      {tab === 'staged' && (
        <div className="space-y-6">
          {stagedProperties.length > 0 ? (
            stagedProperties.map((p) => {
              const staged = p.pending_changes || {};
              const currentPhotos = Array.isArray(p.photos) ? p.photos : [];
              const proposedPhotos = Array.isArray(staged.photos) ? staged.photos : [];
              const currentAmenities = Array.isArray(p.amenities) ? p.amenities : [];
              const proposedAmenities = Array.isArray(staged.amenities) ? staged.amenities : [];
              const isSubmitting = submittingId === p.id;

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-300 shadow-soft space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-forest/10">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-2xl font-bold text-forest">{p.name}</span>
                        <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-600" /> Staged Changes Pending Review
                        </span>
                      </div>
                      <p className="text-xs text-charcoal-muted mt-0.5">
                        Submitted: {p.pending_changes_submitted_at ? new Date(p.pending_changes_submitted_at).toLocaleString() : 'Recently'} • Approved listing remains live on site.
                      </p>
                    </div>

                    <Link
                      href={`/stays/${p.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-forest bg-warm-canvas px-3 py-1.5 rounded-lg border border-forest/20 hover:bg-forest/10"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Live Listing</span>
                    </Link>
                  </div>

                  {/* Side-by-Side Diff */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
                    {/* Current Live Approved Content */}
                    <div className="p-5 bg-ivory-warm/60 rounded-2xl border border-forest/15 space-y-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-forest block pb-1 border-b border-forest/10">
                        Current Approved Version (Live)
                      </span>
                      <div>
                        <strong className="block text-charcoal-muted">Title:</strong>
                        <span className="font-semibold text-forest text-sm">{p.name}</span>
                      </div>
                      <div>
                        <strong className="block text-charcoal-muted">Location:</strong>
                        <span>{p.village}, {p.district}, {p.state}</span>
                      </div>
                      <div>
                        <strong className="block text-charcoal-muted">Exact Address:</strong>
                        <span>{p.exact_address || p.address || '—'}</span>
                      </div>
                      <div>
                        <strong className="block text-charcoal-muted mb-1">Google Maps Location:</strong>
                        {p.google_maps_url ? (
                          <a
                            href={p.google_maps_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-forest/20 text-forest font-semibold hover:bg-forest hover:text-white transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Open in Google Maps</span>
                          </a>
                        ) : (
                          <span className="text-charcoal-muted italic">Not provided yet</span>
                        )}
                      </div>
                      <div>
                        <strong className="block text-charcoal-muted">Description:</strong>
                        <p className="line-clamp-4 text-charcoal-muted leading-relaxed">{p.description}</p>
                      </div>
                      <div>
                        <strong className="block text-charcoal-muted mb-1">Amenities ({currentAmenities.length}):</strong>
                        <div className="flex flex-wrap gap-1">
                          {currentAmenities.map((a: string) => (
                            <span key={a} className="px-2 py-0.5 bg-white rounded border border-forest/10 text-[10px]">
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <strong className="block text-charcoal-muted mb-1">Photos ({currentPhotos.length}):</strong>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                          {currentPhotos.map((url: string, i: number) => (
                            <button key={i} type="button" onClick={() => setPhotoPreview({ url, alt: `Current approved property photo ${i + 1}` })} className="shrink-0 rounded focus:outline-none focus:ring-2 focus:ring-forest" title="Click to enlarge">
                              <img src={url} alt={`Current approved photo ${i + 1}`} className="w-20 h-16 rounded object-cover border border-forest/10" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Proposed Staged Changes */}
                    <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 block pb-1 border-b border-amber-200">
                        Proposed Staged Changes (Pending Review)
                      </span>
                      <div>
                        <strong className="block text-charcoal-muted">Proposed Title:</strong>
                        <span className="font-semibold text-forest text-sm">{staged.name || p.name}</span>
                      </div>
                      <div>
                        <strong className="block text-charcoal-muted">Proposed Location:</strong>
                        <span>{staged.village || p.village}, {staged.district || p.district}, {staged.state || p.state}</span>
                      </div>
                      <div>
                        <strong className="block text-charcoal-muted">Proposed Exact Address:</strong>
                        <span className="font-medium text-charcoal">
                          {staged.location?.exact_address || p.pending_exact_address || p.exact_address || '—'}
                        </span>
                      </div>
                      <div>
                        <strong className="block text-charcoal-muted mb-1">Proposed Google Maps Link:</strong>
                        {staged.location?.google_maps_url || p.pending_google_maps_url || p.google_maps_url ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <a
                              href={staged.location?.google_maps_url || p.pending_google_maps_url || p.google_maps_url || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-forest text-white font-semibold hover:bg-forest-hover transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Open in Google Maps</span>
                            </a>
                            <span className="font-mono text-[11px] text-charcoal-muted truncate max-w-xs">
                              {staged.location?.google_maps_url || p.pending_google_maps_url || p.google_maps_url}
                            </span>
                          </div>
                        ) : (
                          <span className="text-charcoal-muted italic">No Google Maps link submitted</span>
                        )}
                      </div>
                      <div>
                        <strong className="block text-charcoal-muted">Proposed Description:</strong>
                        <p className="line-clamp-4 text-charcoal leading-relaxed">{staged.description || p.description}</p>
                      </div>
                      <div>
                        <strong className="block text-charcoal-muted mb-1">Proposed Amenities ({proposedAmenities.length}):</strong>
                        <div className="flex flex-wrap gap-1">
                          {proposedAmenities.map((a: string) => (
                            <span key={a} className="px-2 py-0.5 bg-white rounded border border-amber-300 text-[10px] text-amber-950 font-medium">
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <strong className="block text-charcoal-muted mb-1">Proposed Photos ({proposedPhotos.length}):</strong>
                        <p className="text-[10px] text-charcoal-muted mb-1">Click any photo to inspect it at full size.</p>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                          {proposedPhotos.map((url: string, i: number) => (
                            <button key={i} type="button" onClick={() => setPhotoPreview({ url, alt: `Proposed property photo ${i + 1}` })} className="shrink-0 rounded focus:outline-none focus:ring-2 focus:ring-forest" title="Click to enlarge">
                              <img src={url} alt={`Proposed property photo ${i + 1}`} className="w-24 h-16 rounded object-cover border border-amber-300 shadow-xs" />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-amber-200">
                        <div><strong className="block text-charcoal-muted">Shared Washroom Photos:</strong><span>{Array.isArray(staged.shared_washroom_photos) ? staged.shared_washroom_photos.length : 0} photos</span>
                          <div className="flex gap-2 overflow-x-auto py-1">
                            {(Array.isArray(staged.shared_washroom_photos) ? staged.shared_washroom_photos : []).map((url: string, i: number) => (
                              <button key={i} type="button" onClick={() => setPhotoPreview({ url, alt: `Proposed common washroom photo ${i + 1}` })} className="shrink-0 rounded focus:outline-none focus:ring-2 focus:ring-forest" title="Click to enlarge"><img src={url} alt={`Common washroom ${i + 1}`} className="w-20 h-16 rounded object-cover border border-amber-300" /></button>
                            ))}
                          </div>
                        </div>
                        <div><strong className="block text-charcoal-muted">Contact / WhatsApp / Email:</strong><span>{staged.contact_phone || '—'} / {staged.contact_whatsapp || '—'}</span><p>{staged.contact_email || '—'}</p></div>
                      </div>
                      <div className="pt-3 border-t border-amber-200 space-y-3">
                        <strong className="block text-charcoal-muted">Proposed Room Inventory ({Array.isArray(staged.rooms) ? staged.rooms.length : 0} submitted):</strong>
                        {Array.isArray(staged.rooms) && staged.rooms.length > 0 ? staged.rooms.map((room: any, roomIndex: number) => (
                          <div key={room.id || `new-room-${roomIndex}`} className="rounded-xl border border-amber-200 bg-white/80 p-3 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="font-semibold text-forest">{room.room_name || `Room ${roomIndex + 1}`}</div>
                              <span className={`text-[10px] font-bold rounded px-2 py-1 ${room.deleted || room.active === false ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>{room.deleted || room.active === false ? 'Will be removed / paused' : 'Active'}</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                              <span>Rate: <strong>₹{Number(room.base_price || 0).toLocaleString('en-IN')}</strong> / night</span>
                              <span>Guests: <strong>{room.max_guests || 2}</strong></span>
                              <span>Washroom: <strong>{room.attached_washroom ? 'Private attached' : 'Shared common'}</strong></span>
                              <span>Bedding: <strong>{room.bed_type || '—'}</strong></span>
                            </div>
                            {room.description && <p className="text-[11px] text-charcoal-muted">{room.description}</p>}
                            <div className="flex gap-2 overflow-x-auto py-1">
                              {(Array.isArray(room.photos) ? room.photos : []).map((url: string, i: number) => (
                                <button key={i} type="button" onClick={() => setPhotoPreview({ url, alt: `${room.room_name} bedroom photo ${i + 1}` })} className="shrink-0 rounded focus:outline-none focus:ring-2 focus:ring-forest" title="Click to enlarge"><img src={url} alt={`${room.room_name} bedroom ${i + 1}`} className="w-24 h-16 rounded object-cover border border-amber-300" /></button>
                              ))}
                              {(Array.isArray(room.washroom_photos) ? room.washroom_photos : []).map((url: string, i: number) => (
                                <button key={`washroom-${i}`} type="button" onClick={() => setPhotoPreview({ url, alt: `${room.room_name} private washroom photo ${i + 1}` })} className="shrink-0 rounded focus:outline-none focus:ring-2 focus:ring-forest" title="Click to enlarge"><img src={url} alt={`${room.room_name} private washroom ${i + 1}`} className="w-24 h-16 rounded object-cover border border-sky-300" /></button>
                              ))}
                            </div>
                          </div>
                        )) : <p className="text-[11px] text-charcoal-muted">No room inventory changes included.</p>}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-amber-200 text-[11px]">
                        <div><strong className="block text-charcoal-muted">Check-in / Check-out:</strong>{staged.check_in_time || '—'} / {staged.check_out_time || '—'}</div>
                        <div><strong className="block text-charcoal-muted">House Rules:</strong><span className="whitespace-pre-wrap">{staged.house_rules || '—'}</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Decision Actions */}
                  <div className="pt-4 border-t border-forest/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 max-w-xl space-y-1">
                      <label className="block text-[11px] font-semibold text-charcoal">Corrections / feedback for the host <span className="text-red-700">Required when requesting corrections</span></label>
                      <textarea suppressHydrationWarning
                        rows={3}
                        value={adminNotes[p.id] || ''}
                        onChange={(e) => setAdminNotes({ ...adminNotes, [p.id]: e.target.value })}
                        placeholder="Specify exactly which changes or photos are not acceptable, what is missing, and what the host must correct before resubmitting..."
                        className="w-full p-3 text-xs bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none resize-y"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <button suppressHydrationWarning
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleModeration(p.id, 'reject_staged')}
                        className="px-4 py-2 border border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
                      >
                        {isSubmitting ? 'Processing...' : 'Request Corrections & Return to Host'}
                      </button>

                      <button suppressHydrationWarning
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleModeration(p.id, 'approve_staged')}
                        className="px-5 py-2 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4 text-ukorange" />
                        <span>{isSubmitting ? 'Publishing...' : 'Approve & Publish Updates'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-forest/15 shadow-soft max-w-lg mx-auto space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h2 className="font-serif text-2xl font-bold text-forest">No Staged Updates Pending</h2>
              <p className="text-xs text-charcoal-muted">
                All published homestay updates have been moderated. When hosts submit new descriptions, photos, or amenities, they will appear here for side-by-side review.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: NEW APPLICATIONS */}
      {tab === 'pending' && (
        <div className="space-y-6">
          {pendingApplications.length > 0 ? (
            pendingApplications.map((p) => {
              const photos = Array.isArray(p.photos) ? p.photos : [];
              const isSubmitting = submittingId === p.id;

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-3xl p-6 sm:p-8 border border-ukorange/30 ring-1 ring-ukorange/20 shadow-soft space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-forest/10">
                    <div>
                      <h2 className="font-serif text-2xl font-bold text-forest">{p.name}</h2>
                      <p className="text-xs text-charcoal-muted flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-ukorange" />
                        <span>{p.village}, {p.district}, {p.state} • Type: <strong className="capitalize">{p.property_type}</strong></span>
                      </p>
                    </div>

                    <span className="px-2.5 py-1 text-xs font-bold uppercase rounded-full bg-ukorange/15 text-ukorange">
                      Application Pending
                    </span>
                  </div>

                  {/* Exact Location & Google Maps Verification */}
                  <div className="p-3.5 bg-ivory-warm rounded-xl border border-forest/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div>
                        <strong className="text-charcoal-muted">Exact Address &amp; Landmarks: </strong>
                        <span className="font-semibold text-charcoal">{p.exact_address || p.address || '—'}</span>
                      </div>
                      {p.google_maps_url && (
                        <div className="font-mono text-[11px] text-charcoal-muted truncate max-w-lg">
                          {p.google_maps_url}
                        </div>
                      )}
                    </div>
                    {p.google_maps_url ? (
                      <a
                        href={p.google_maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-forest text-white font-semibold hover:bg-forest-hover transition-colors self-start sm:self-auto flex-shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open in Google Maps</span>
                      </a>
                    ) : (
                      <span className="text-amber-800 font-semibold">No Google Maps link attached</span>
                    )}
                  </div>

                  {/* Contact & Notification Details */}
                  {(p.contact_phone || p.contact_whatsapp || p.contact_email) && (
                    <div className="p-3 bg-ivory-warm rounded-xl border border-forest/10 flex flex-wrap gap-4 text-xs">
                      {p.contact_phone && (
                        <div>
                          <strong className="text-charcoal-muted">Phone: </strong>
                          <span className="font-semibold text-forest">{p.contact_phone}</span>
                        </div>
                      )}
                      {p.contact_whatsapp && (
                        <div>
                          <strong className="text-charcoal-muted">WhatsApp: </strong>
                          <span className="font-semibold text-emerald-700">{p.contact_whatsapp}</span>
                        </div>
                      )}
                      {p.contact_email && (
                        <div>
                          <strong className="text-charcoal-muted">Email: </strong>
                          <span className="font-semibold text-forest">{p.contact_email}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-charcoal leading-relaxed">{p.description}</p>

                  {/* Room Inventory Breakdown */}
                  {Array.isArray(p.room_units) && p.room_units.length > 0 && (
                    <div className="space-y-2">
                      <strong className="text-[11px] uppercase tracking-wider text-charcoal-muted block">
                        Room Inventory ({p.room_units.length} {p.room_units.length === 1 ? 'Room' : 'Rooms'}):
                      </strong>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {p.room_units.map((room: any, rIdx: number) => (
                          <div key={room.id || rIdx} className="p-3 bg-white rounded-xl border border-forest/15 text-xs space-y-1">
                            <div className="flex items-center justify-between font-bold text-forest">
                              <span>{room.room_name}</span>
                              <span>₹{room.base_price}/night</span>
                            </div>
                            <div className="flex flex-wrap gap-1 text-[10px]">
                              <span className="px-1.5 py-0.2 bg-forest/10 text-forest rounded">
                                Max {room.max_guests} Guests
                              </span>
                              <span className={`px-1.5 py-0.2 rounded font-semibold ${room.attached_washroom ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}`}>
                                {room.attached_washroom ? 'Attached Washroom' : 'Shared Washroom'}
                              </span>
                              {room.view_type && room.view_type !== 'none' && (
                                <span className="px-1.5 py-0.2 bg-sky-100 text-sky-800 rounded capitalize">
                                  {room.view_type} View
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {photos.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto py-1">
                      {photos.map((url: string, i: number) => (
                        <img key={i} src={url} alt="Application" className="w-24 h-16 rounded-xl object-cover border border-forest/10" />
                      ))}
                    </div>
                  )}

                  <div className="pt-3 border-t border-forest/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 max-w-md">
                      <input suppressHydrationWarning
                        type="text"
                        value={adminNotes[p.id] || ''}
                        onChange={(e) => setAdminNotes({ ...adminNotes, [p.id]: e.target.value })}
                        placeholder="Admin moderation notes or reason..."
                        className="w-full p-2 text-xs bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button suppressHydrationWarning
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleModeration(p.id, 'request_changes')}
                        className="px-3.5 py-1.5 border border-forest/20 text-charcoal-muted hover:text-charcoal text-xs font-semibold rounded-lg"
                      >
                        Request Changes
                      </button>

                      <button suppressHydrationWarning
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleModeration(p.id, 'reject')}
                        className="px-3.5 py-1.5 border border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold rounded-lg"
                      >
                        Reject
                      </button>

                      <button suppressHydrationWarning
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleModeration(p.id, 'approve')}
                        className="px-5 py-2 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-ukorange" />
                        <span>Approve & Publish</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-forest/15 shadow-soft max-w-lg mx-auto space-y-3">
              <Clock className="w-12 h-12 text-forest/40 mx-auto" />
              <h2 className="font-serif text-2xl font-bold text-forest">No New Applications</h2>
              <p className="text-xs text-charcoal-muted">
                There are currently no new homestay applications awaiting review.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ALL LISTINGS */}
      {tab === 'all' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory-warm text-charcoal-muted uppercase tracking-wider border-b border-forest/10">
                <tr>
                  <th className="p-3">Property Name</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Rooms</th>
                  <th className="p-3">Moderation</th>
                  <th className="p-3">Live Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest/10">
                {allProperties.map((p) => (
                  <tr key={p.id} className="hover:bg-forest/5 transition-colors">
                    <td className="p-3 font-semibold text-forest">
                      <Link href={`/stays/${p.slug}`} className="hover:underline">
                        {p.name}
                      </Link>
                    </td>
                    <td className="p-3 text-charcoal-muted">{p.village}, {p.district}</td>
                    <td className="p-3 capitalize">{p.property_type}</td>
                    <td className="p-3">{p.room_units?.length || 0}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 font-bold uppercase rounded-full text-[10px] ${
                        p.moderation_status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                        p.moderation_status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {p.moderation_status}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`font-semibold ${p.published ? 'text-emerald-700' : 'text-charcoal-muted'}`}>
                        {p.published ? 'Live' : 'Draft'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        href={`/stays/${p.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-charcoal-muted hover:text-forest"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {photoPreview && (
        <div className="fixed inset-0 z-[100] bg-black/90 p-4 sm:p-8 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Photo preview" onClick={() => setPhotoPreview(null)}>
          <button type="button" onClick={() => setPhotoPreview(null)} className="absolute top-4 right-4 z-10 rounded-full bg-white/15 hover:bg-white/25 text-white p-3" aria-label="Close photo preview"><X className="w-6 h-6" /></button>
          <div className="max-w-6xl w-full max-h-full flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <img src={photoPreview.url} alt={photoPreview.alt} className="max-w-full max-h-[82vh] object-contain rounded-lg shadow-2xl" />
            <p className="text-sm text-white/90">{photoPreview.alt}</p>
            <a href={photoPreview.url} target="_blank" rel="noopener noreferrer" className="text-xs text-white underline">Open original image</a>
          </div>
        </div>
      )}
    </div>
  );
}
