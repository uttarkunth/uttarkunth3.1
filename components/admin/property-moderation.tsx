'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2, XCircle, AlertTriangle, Eye, Shield, Clock,
  ArrowRight, Sparkles, Image as ImageIcon, MapPin, BedDouble, RefreshCw
} from 'lucide-react';

interface Property {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  address?: string | null;
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
  pending_changes_submitted_at?: string | null;
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

  const stagedProperties = initialProperties.filter((p) => p.pending_changes !== null && p.pending_changes !== undefined);
  const pendingApplications = initialProperties.filter((p) => p.moderation_status === 'pending' && !p.pending_changes);
  const allProperties = initialProperties;

  const handleModeration = async (propertyId: string, action: string) => {
    setErrorMsg(null);
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
                          {currentPhotos.slice(0, 4).map((url: string, i: number) => (
                            <img key={i} src={url} alt="Current" className="w-16 h-12 rounded object-cover border border-forest/10" />
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
                        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                          {proposedPhotos.map((url: string, i: number) => (
                            <img key={i} src={url} alt="Proposed" className="w-16 h-12 rounded object-cover border border-amber-300 shadow-xs" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Decision Actions */}
                  <div className="pt-4 border-t border-forest/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 max-w-md">
                      <input suppressHydrationWarning
                        type="text"
                        value={adminNotes[p.id] || ''}
                        onChange={(e) => setAdminNotes({ ...adminNotes, [p.id]: e.target.value })}
                        placeholder="Optional feedback / admin note for host..."
                        className="w-full p-2 text-xs bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <button suppressHydrationWarning
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleModeration(p.id, 'reject_staged')}
                        className="px-4 py-2 border border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
                      >
                        {isSubmitting ? 'Processing...' : 'Reject Staged Updates'}
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

                  <p className="text-xs text-charcoal leading-relaxed">{p.description}</p>

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
    </div>
  );
}
