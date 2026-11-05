'use client';

import React, { useState } from 'react';
import {
  FileText, Search, Shield, Filter, ChevronDown, ChevronRight,
  Clock, User, CheckCircle2, AlertTriangle, ArrowRight
} from 'lucide-react';

interface AuditEntry {
  id: string;
  actor_user_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: any;
  created_at: string;
}

interface AuditLogViewerProps {
  entries: AuditEntry[];
}

export function AuditLogViewer({ entries }: AuditLogViewerProps) {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = entries.filter((e) => {
    if (filterType !== 'all' && e.target_type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchAction = e.action?.toLowerCase().includes(q);
      const matchActor = e.actor_user_id?.toLowerCase().includes(q);
      const matchTarget = e.target_id?.toLowerCase().includes(q);
      const detailsStr = JSON.stringify(e.details || {}).toLowerCase();
      const matchDetails = detailsStr.includes(q);
      if (!matchAction && !matchActor && !matchTarget && !matchDetails) return false;
    }
    return true;
  });

  const getActionBadge = (action: string) => {
    if (action.includes('approved')) {
      return 'bg-emerald-100 text-emerald-800';
    }
    if (action.includes('rejected') || action.includes('removed')) {
      return 'bg-rose-100 text-rose-800';
    }
    if (action.includes('created') || action.includes('assigned')) {
      return 'bg-blue-100 text-blue-800';
    }
    return 'bg-zinc-100 text-zinc-800';
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-ukorange">
          Compliance & Traceability
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-forest mt-1">
          Administrator Audit Trail
        </h1>
        <p className="text-sm text-charcoal-muted mt-1 max-w-2xl">
          Immutable log of all platform administrator interventions, content moderation decisions, role appointments, and commercial contracts.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-forest/15 shadow-soft flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-charcoal-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input suppressHydrationWarning
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action, actor, target ID, or email..."
            className="w-full text-xs pl-9 pr-4 py-2.5 bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none focus:ring-1 focus:ring-forest"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['all', 'property', 'agreement', 'booking'].map((t) => (
            <button suppressHydrationWarning
              key={t}
              type="button"
              onClick={() => setFilterType(t)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl capitalize whitespace-nowrap transition-colors ${
                filterType === t
                  ? 'bg-forest text-white shadow-xs'
                  : 'bg-ivory-warm text-charcoal-muted hover:text-charcoal border border-forest/10'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Entries List */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-4">
        <div className="text-xs text-charcoal-muted font-medium">
          Showing {filtered.length} of {entries.length} recorded audit events
        </div>

        <div className="space-y-3">
          {filtered.map((e) => {
            const isExpanded = expandedId === e.id;
            const actorEmail = e.details?.admin_email || e.actor_user_id;

            return (
              <div
                key={e.id}
                className="p-4 bg-ivory-warm rounded-2xl border border-forest/10 space-y-2 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full tracking-wider ${getActionBadge(e.action)}`}>
                      {e.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-semibold text-forest uppercase tracking-wider">
                      {e.target_type}
                    </span>
                    <span className="text-xs text-charcoal-muted font-mono">
                      Target: {e.target_id?.slice(0, 8)}...
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-charcoal-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-charcoal-muted/70" />
                      {new Date(e.created_at).toLocaleString()}
                    </span>

                    <button suppressHydrationWarning
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : e.id)}
                      className="text-xs font-semibold text-forest hover:text-forest-light flex items-center gap-0.5"
                    >
                      <span>{isExpanded ? 'Hide Details' : 'View Payload'}</span>
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-charcoal-muted">
                  <User className="w-3.5 h-3.5 text-charcoal-muted/70 flex-shrink-0" />
                  <span>Admin Actor:</span>
                  <strong className="text-forest font-mono">{actorEmail}</strong>
                </div>

                {/* Expanded Payload Viewer */}
                {isExpanded && (
                  <div className="pt-2 border-t border-forest/10 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-muted block">
                      Audit Payload Snapshot
                    </span>
                    <pre className="p-3 bg-white rounded-xl border border-forest/15 font-mono text-[11px] text-charcoal overflow-x-auto leading-relaxed">
                      {JSON.stringify(e.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="p-8 text-center text-charcoal-muted italic">
              No audit log entries matching current search or filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
