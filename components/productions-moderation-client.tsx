'use client';

import React, { useState } from 'react';
import {
  Film,
  Clapperboard,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  MapPin,
  FileText,
  DollarSign,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface Props {
  initialProposals: any[];
  initialProfiles: any[];
}

export function ProductionsModerationClient({ initialProposals, initialProfiles }: Props) {
  const [activeTab, setActiveTab] = useState<'proposals' | 'profiles'>('proposals');
  const [proposals, setProposals] = useState(initialProposals);
  const [profiles, setProfiles] = useState(initialProfiles);
  const [selectedProposal, setSelectedProposal] = useState<any | null>(initialProposals[0] || null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleProposalAction = async (proposalId: string, action: string) => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/productions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: 'proposal',
          target_id: proposalId,
          action,
          notes: adminNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to update proposal');
      }

      const resolvedStatus =
        action === 'approve' || action === 'reject_takedown'
          ? 'approved'
          : action === 'reject'
          ? 'rejected'
          : action === 'approve_takedown' || action === 'archive'
          ? 'archived'
          : action === 'remove'
          ? 'removed'
          : 'revision_requested';

      setProposals((prev) =>
        prev.map((p) =>
          p.id === proposalId
            ? {
                ...p,
                status: resolvedStatus,
                admin_notes: adminNotes || p.admin_notes,
              }
            : p
        )
      );

      if (selectedProposal?.id === proposalId) {
        setSelectedProposal((prev: any) => ({
          ...prev,
          status: resolvedStatus,
          admin_notes: adminNotes || prev?.admin_notes,
        }));
      }

      setFeedback(`Action recorded: ${action.replace('_', ' ').toUpperCase()}`);
      setAdminNotes('');
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleProfileStatus = async (profileId: string, action: string) => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/productions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: 'profile',
          target_id: profileId,
          action,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setProfiles((prev) =>
        prev.map((p) =>
          p.id === profileId ? { ...p, status: action === 'approve' ? 'approved' : 'rejected' } : p
        )
      );
      setFeedback(`Filmmaker profile status updated.`);
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'in_production':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-100 text-green-800 text-[11px] font-bold rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Approved
          </span>
        );
      case 'revision_requested':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full">
            <AlertTriangle className="w-3 h-3" />
            Revision
          </span>
        );
      case 'takedown_requested':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-900 text-[11px] font-bold rounded-full">
            <AlertTriangle className="w-3 h-3" />
            Takedown Requested
          </span>
        );
      case 'archived':
      case 'removed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-charcoal/10 text-charcoal text-[11px] font-bold rounded-full">
            Archived
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-100 text-red-800 text-[11px] font-bold rounded-full">
            Declined
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-ukorange/15 text-ukorange text-[11px] font-bold rounded-full">
            <Clock className="w-3 h-3" />
            Review Needed
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-forest/15 pb-2">
        <button suppressHydrationWarning
          onClick={() => setActiveTab('proposals')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'proposals'
              ? 'bg-forest text-white shadow-xs'
              : 'text-charcoal-muted hover:text-forest hover:bg-forest/5'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>Film Proposals ({proposals.length})</span>
        </button>

        <button suppressHydrationWarning
          onClick={() => setActiveTab('profiles')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'profiles'
              ? 'bg-forest text-white shadow-xs'
              : 'text-charcoal-muted hover:text-forest hover:bg-forest/5'
          }`}
        >
          <Clapperboard className="w-3.5 h-3.5" />
          <span>Filmmaker Profiles ({profiles.length})</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-forest/10 border border-forest/20 rounded-xl text-xs font-semibold text-forest flex items-center justify-between">
          <span>{feedback}</span>
          <button suppressHydrationWarning onClick={() => setFeedback(null)} className="text-charcoal-muted hover:text-forest">×</button>
        </div>
      )}

      {/* Proposals Tab */}
      {activeTab === 'proposals' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List column */}
          <div className="lg:col-span-1 space-y-3">
            {proposals.length === 0 ? (
              <div className="p-8 bg-white rounded-3xl border border-forest/15 text-center text-xs text-charcoal-muted">
                No film proposals submitted yet.
              </div>
            ) : (
              proposals.map((prop) => {
                const isSelected = selectedProposal?.id === prop.id;
                return (
                  <div
                    key={prop.id}
                    onClick={() => {
                      setSelectedProposal(prop);
                      setAdminNotes(prop.admin_notes || '');
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
                        {prop.category}
                      </span>
                      {getStatusBadge(prop.status)}
                    </div>
                    <h4 className="font-serif text-sm font-bold truncate">{prop.title}</h4>
                    <p
                      className={`text-[11px] truncate mt-1 ${
                        isSelected ? 'text-white/80' : 'text-charcoal-muted'
                      }`}
                    >
                      {prop.proposed_location}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* Details & Action column */}
          <div className="lg:col-span-2">
            {selectedProposal ? (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-forest/10 pb-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ukorange">
                      {selectedProposal.category}
                    </span>
                    <h3 className="font-serif text-2xl font-bold text-forest mt-0.5">
                      {selectedProposal.title}
                    </h3>
                    <p className="text-xs text-charcoal-muted flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-forest/60" />
                      <span>{selectedProposal.proposed_location}</span>
                    </p>
                  </div>
                  <div>{getStatusBadge(selectedProposal.status)}</div>
                </div>

                {/* Synopsis & Concept */}
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="font-bold text-forest uppercase tracking-wider text-[11px] block mb-1">
                      Synopsis
                    </span>
                    <p className="text-charcoal leading-relaxed bg-ivory-warm p-3.5 rounded-xl border border-forest/10">
                      {selectedProposal.synopsis}
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-forest uppercase tracking-wider text-[11px] block mb-1">
                      Creative Treatment &amp; Concept
                    </span>
                    <p className="text-charcoal leading-relaxed whitespace-pre-line bg-ivory-warm p-3.5 rounded-xl border border-forest/10">
                      {selectedProposal.concept}
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-forest uppercase tracking-wider text-[11px] block mb-1">
                      Cultural &amp; Ecological Significance
                    </span>
                    <p className="text-charcoal leading-relaxed bg-ivory-warm p-3.5 rounded-xl border border-forest/10">
                      {selectedProposal.cultural_relevance}
                    </p>
                  </div>

                  {selectedProposal.estimated_budget && (
                    <div className="p-3 bg-warm-canvas rounded-xl border border-beige flex items-center justify-between">
                      <span className="font-semibold text-charcoal">Estimated Production Budget:</span>
                      <span className="font-serif font-bold text-forest text-sm">
                        ₹{Number(selectedProposal.estimated_budget).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  {selectedProposal.support_needed && selectedProposal.support_needed.length > 0 && (
                    <div>
                      <span className="font-bold text-forest uppercase tracking-wider text-[11px] block mb-1.5">
                        Requested Support
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProposal.support_needed.map((sup: string, i: number) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 bg-forest/10 text-forest text-[11px] font-semibold rounded-lg"
                          >
                            {sup}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Editorial Review & Decision */}
                <div className="pt-4 border-t border-forest/10 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-charcoal block">
                      Editorial Review Notes (Visible to Filmmaker)
                    </label>
                    <textarea suppressHydrationWarning
                      rows={3}
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Feedback on narrative arc, village permissions, co-production terms, or next steps..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-xs text-charcoal focus:ring-2 focus:ring-ukorange/30 focus:border-forest outline-none transition-all"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button suppressHydrationWarning
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleProposalAction(selectedProposal.id, 'approve')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve Proposal</span>
                    </button>

                    <button suppressHydrationWarning
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleProposalAction(selectedProposal.id, 'request_revision')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Request Revisions</span>
                    </button>

                    <button suppressHydrationWarning
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleProposalAction(selectedProposal.id, 'reject')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>

                    <button suppressHydrationWarning
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleProposalAction(selectedProposal.id, 'approve_takedown')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-charcoal hover:bg-black text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
                    >
                      <span>Approve Takedown / Archive</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-charcoal-muted pt-1">
                    Streaming Telemetry Status: <strong>Analytics not connected</strong> (no fabricated view counts or revenue metrics).
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 bg-white rounded-3xl border border-forest/15 text-center text-xs text-charcoal-muted">
                Select a proposal from the left to view details and make editorial decisions.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profiles Tab */}
      {activeTab === 'profiles' && (
        <div className="bg-white rounded-3xl p-6 border border-forest/15 shadow-soft space-y-4">
          <h3 className="font-serif text-xl font-bold text-forest">Registered Filmmakers &amp; Creatives</h3>
          {profiles.length === 0 ? (
            <p className="text-xs text-charcoal-muted">No filmmaker profiles recorded yet.</p>
          ) : (
            <div className="divide-y divide-forest/10">
              {profiles.map((prof) => (
                <div key={prof.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-forest text-base">{prof.full_name}</span>
                      <span className="px-2 py-0.5 bg-forest/10 text-forest text-[10px] font-semibold rounded-full capitalize">
                        {prof.creative_role.replace('_', ' ')}
                      </span>
                      {getStatusBadge(prof.status)}
                    </div>
                    <p className="text-charcoal-muted">
                      {prof.email} {prof.phone && `• ${prof.phone}`} • Base: {prof.location}
                    </p>
                    <p className="text-charcoal leading-relaxed max-w-xl">{prof.bio}</p>
                    {prof.portfolio_url && (
                      <a
                        href={prof.portfolio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-ukorange underline inline-flex items-center gap-1 font-semibold"
                      >
                        <span>Showreel</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button suppressHydrationWarning
                      disabled={actionLoading}
                      onClick={() => handleProfileStatus(prof.id, 'approve')}
                      className="px-3 py-1.5 bg-green-700 hover:bg-green-800 text-white text-[11px] font-semibold rounded-lg transition-colors"
                    >
                      Approve
                    </button>
                    <button suppressHydrationWarning
                      disabled={actionLoading}
                      onClick={() => handleProfileStatus(prof.id, 'reject')}
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