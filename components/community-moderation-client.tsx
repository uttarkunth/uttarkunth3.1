'use client';

import React, { useState } from 'react';
import {
  Heart,
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  MapPin,
  Calendar,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { COMMUNITY_INITIATIVES } from '@/lib/constants';

interface Props {
  initialParticipations: any[];
  initialStories: any[];
}

export function CommunityModerationClient({ initialParticipations, initialStories }: Props) {
  const [activeTab, setActiveTab] = useState<'participations' | 'stories'>('participations');
  const [participations, setParticipations] = useState(initialParticipations);
  const [stories, setStories] = useState(initialStories);
  const [selectedPart, setSelectedPart] = useState<any | null>(initialParticipations[0] || null);
  const [selectedStory, setSelectedStory] = useState<any | null>(initialStories[0] || null);
  const [adminNotes, setAdminNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleParticipationAction = async (partId: string, action: string) => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: 'participation',
          target_id: partId,
          action,
          notes: adminNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to update participation');
      }

      setParticipations((prev) =>
        prev.map((p) =>
          p.id === partId
            ? { ...p, status: action === 'approve' ? 'approved' : 'declined', admin_notes: adminNotes }
            : p
        )
      );

      if (selectedPart?.id === partId) {
        setSelectedPart((prev: any) => ({
          ...prev,
          status: action === 'approve' ? 'approved' : 'declined',
          admin_notes: adminNotes,
        }));
      }

      setFeedback(`Participation status set to ${action.toUpperCase()}`);
      setAdminNotes('');
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStoryAction = async (storyId: string, action: string) => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: 'story',
          target_id: storyId,
          action,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to update story');
      }

      setStories((prev) =>
        prev.map((s) =>
          s.id === storyId ? { ...s, status: action === 'publish' ? 'published' : 'rejected' } : s
        )
      );

      if (selectedStory?.id === storyId) {
        setSelectedStory((prev: any) => ({
          ...prev,
          status: action === 'publish' ? 'published' : 'rejected',
        }));
      }

      setFeedback(`Story status set to ${action.toUpperCase()}`);
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Switcher */}
      <div className="flex items-center gap-2 border-b border-forest/15 pb-2">
        <button
          onClick={() => setActiveTab('participations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'participations'
              ? 'bg-forest text-white shadow-xs'
              : 'text-charcoal-muted hover:text-forest hover:bg-forest/5'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>Participation Applications ({participations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('stories')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'stories'
              ? 'bg-forest text-white shadow-xs'
              : 'text-charcoal-muted hover:text-forest hover:bg-forest/5'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Community Oral Stories ({stories.length})</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-forest/10 border border-forest/20 rounded-xl text-xs font-semibold text-forest flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-charcoal-muted hover:text-forest">×</button>
        </div>
      )}

      {/* Participations Tab */}
      {activeTab === 'participations' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            {participations.length === 0 ? (
              <div className="p-8 bg-white rounded-3xl border border-forest/15 text-center text-xs text-charcoal-muted">
                No participation applications submitted yet.
              </div>
            ) : (
              participations.map((part) => {
                const isSelected = selectedPart?.id === part.id;
                const matchedInit = COMMUNITY_INITIATIVES.find((i) => i.slug === part.initiative_slug);
                return (
                  <div
                    key={part.id}
                    onClick={() => {
                      setSelectedPart(part);
                      setAdminNotes(part.admin_notes || '');
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-forest text-white border-forest shadow-md'
                        : 'bg-white hover:bg-ivory border-forest/15 text-charcoal'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          isSelected ? 'text-ukorange' : 'text-charcoal-muted'
                        }`}
                      >
                        {matchedInit?.category || 'Community'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          part.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : part.status === 'declined'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-ukorange/15 text-ukorange'
                        }`}
                      >
                        {part.status}
                      </span>
                    </div>
                    <h4 className="font-serif text-sm font-bold truncate">{part.full_name}</h4>
                    <p
                      className={`text-[11px] truncate mt-1 ${
                        isSelected ? 'text-white/80' : 'text-charcoal-muted'
                      }`}
                    >
                      {matchedInit?.title || part.initiative_slug}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          <div className="lg:col-span-2">
            {selectedPart ? (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-forest/10 pb-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ukorange">
                      Field Residency Applicant
                    </span>
                    <h3 className="font-serif text-2xl font-bold text-forest mt-0.5">
                      {selectedPart.full_name}
                    </h3>
                    <p className="text-xs text-charcoal-muted mt-1">
                      {selectedPart.email} {selectedPart.phone && `• ${selectedPart.phone}`}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      selectedPart.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : selectedPart.status === 'declined'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-ukorange/15 text-ukorange'
                    }`}
                  >
                    Status: {selectedPart.status}
                  </span>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="p-3.5 bg-ivory-warm rounded-2xl border border-forest/10 space-y-1">
                    <span className="font-bold text-forest block">Target Initiative:</span>
                    <p className="text-charcoal">
                      {COMMUNITY_INITIATIVES.find((i) => i.slug === selectedPart.initiative_slug)?.title ||
                        selectedPart.initiative_slug}
                    </p>
                    <span className="text-charcoal-muted block">Duration: {selectedPart.duration}</span>
                  </div>

                  <div>
                    <span className="font-bold text-forest uppercase tracking-wider text-[11px] block mb-1">
                      Applicant Skills &amp; Craft
                    </span>
                    <p className="text-charcoal leading-relaxed bg-ivory-warm p-3.5 rounded-xl border border-forest/10">
                      {selectedPart.skills}
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-forest uppercase tracking-wider text-[11px] block mb-1">
                      Motivation &amp; Community Alignment
                    </span>
                    <p className="text-charcoal leading-relaxed bg-ivory-warm p-3.5 rounded-xl border border-forest/10">
                      {selectedPart.motivation}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-forest/10 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-charcoal block">
                      Field Coordinator Notes
                    </label>
                    <textarea
                      rows={2}
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Notes on homestay placement, orientation, or cohort dates..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-xs text-charcoal focus:ring-2 focus:ring-ukorange/30 outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      disabled={loading}
                      onClick={() => handleParticipationAction(selectedPart.id, 'approve')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Accept for Field Cohort</span>
                    </button>

                    <button
                      disabled={loading}
                      onClick={() => handleParticipationAction(selectedPart.id, 'decline')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 bg-white rounded-3xl border border-forest/15 text-center text-xs text-charcoal-muted">
                Select an application to view details.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stories Tab */}
      {activeTab === 'stories' && (
        <div className="bg-white rounded-3xl p-6 border border-forest/15 shadow-soft space-y-6">
          <h3 className="font-serif text-xl font-bold text-forest">Submitted Oral Stories &amp; Field Chronicles</h3>
          {stories.length === 0 ? (
            <p className="text-xs text-charcoal-muted">No story submissions recorded yet.</p>
          ) : (
            <div className="divide-y divide-forest/10">
              {stories.map((st) => (
                <div key={st.id} className="py-4 space-y-3 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ukorange">
                        {st.village}, {st.valley}
                      </span>
                      <h4 className="font-serif text-lg font-bold text-forest">{st.title}</h4>
                      <p className="text-charcoal-muted">
                        By {st.author_name} ({st.author_role})
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          st.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : st.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-ukorange/15 text-ukorange'
                        }`}
                      >
                        {st.status}
                      </span>
                      {st.consent_given && (
                        <span className="px-2 py-0.5 bg-forest/10 text-forest text-[10px] font-semibold rounded-full flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          Consent Verified
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-charcoal leading-relaxed whitespace-pre-line bg-ivory-warm p-4 rounded-2xl border border-forest/10">
                    {st.content}
                  </p>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      disabled={loading}
                      onClick={() => handleStoryAction(st.id, 'publish')}
                      className="px-3 py-1.5 bg-green-700 hover:bg-green-800 text-white text-[11px] font-semibold rounded-lg transition-colors"
                    >
                      Publish to Archive
                    </button>
                    <button
                      disabled={loading}
                      onClick={() => handleStoryAction(st.id, 'reject')}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold rounded-lg transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
