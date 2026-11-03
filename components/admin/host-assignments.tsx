'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Shield, AlertTriangle, CheckCircle2, UserPlus,
  UserMinus, Key, Sparkles, Building2, Info, UserCheck, Trash2
} from 'lucide-react';

interface PropertyItem {
  id: string;
  name: string;
  slug: string;
  village?: string | null;
  district?: string | null;
  property_type: string;
  host_id: string | null;
  hosts?: Array<{
    id: string;
    user_id: string;
    role: string;
    created_at: string;
  }>;
}

interface KnownUser {
  id: string;
  email: string;
  fullName?: string;
}

interface HostAssignmentsProps {
  properties: PropertyItem[];
  knownUsers: KnownUser[];
}

export function HostAssignmentsManager({ properties, knownUsers }: HostAssignmentsProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal / Inline form states
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [newPrimaryUserId, setNewPrimaryUserId] = useState<string>('');
  const [cohostUserId, setCohostUserId] = useState<string>('');
  const [cohostRole, setCohostRole] = useState<'manager' | 'co_host'>('manager');

  const executeAction = async (payload: {
    action: string;
    property_id: string;
    user_id?: string;
    role?: string;
  }) => {
    setSubmitting(payload.property_id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/admin/hosts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to update host assignment.');
      }

      setSuccessMessage(data.message || 'Host assignment updated successfully.');
      setSelectedPropertyId(null);
      setNewPrimaryUserId('');
      setCohostUserId('');
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred');
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header and Safeguards */}
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-ukorange">
          Platform Governance
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-forest mt-1">
          Host & Co-host Assignment Engine
        </h1>
        <p className="text-sm text-charcoal-muted mt-1 max-w-3xl leading-relaxed">
          Manage ownership delegations, operational managers, and hospitality co-hosts across all authentic properties.
          Unassigned listings are strictly managed directly by platform supervisors until an authentic local host is appointed.
        </p>
      </div>

      {/* Role Permission Matrix Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-4">
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-ukorange" />
          <h2 className="font-serif text-xl font-bold text-forest">Role Permission & Responsibility Matrix</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          <div className="p-4 bg-ivory-warm rounded-2xl border border-forest/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-forest">Primary Host</span>
              <span className="px-2 py-0.5 bg-forest text-white text-[10px] font-bold rounded-full">Owner</span>
            </div>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Full workspace authority: decides booking requests, manages availability blocks, updates pricing, and invites operational team. Material property changes are staged for moderation.
            </p>
          </div>

          <div className="p-4 bg-ivory-warm rounded-2xl border border-forest/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-forest">Property Manager</span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full">Operational</span>
            </div>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Operational execution: decides booking requests, creates calendar availability blocks, and updates room base rates. Cannot manage co-hosts or propose structural property changes.
            </p>
          </div>

          <div className="p-4 bg-ivory-warm rounded-2xl border border-forest/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-forest">Hospitality Co-host</span>
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-[10px] font-bold rounded-full">Guest Ops</span>
            </div>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Guest coordination: views booking calendar and guest arrival records, adds guest check-in notes. Strictly read-only on booking acceptance/rejection and date blocks.
            </p>
          </div>

          <div className="p-4 bg-ivory-warm rounded-2xl border border-forest/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-forest">Platform Admin</span>
              <span className="px-2 py-0.5 bg-ukorange text-white text-[10px] font-bold rounded-full">Superadmin</span>
            </div>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Universal supervisor: reviews staged property changes, assigns/revokes host access, oversees dispute resolution, and authorizes formal commercial agreements.
            </p>
          </div>
        </div>

        {/* Safeguard Notice */}
        <div className="p-3.5 bg-forest/5 border border-forest/20 rounded-2xl flex items-start gap-3 mt-4">
          <Info className="w-4 h-4 text-forest flex-shrink-0 mt-0.5" />
          <p className="text-xs text-forest leading-relaxed">
            <strong>Mandatory Platform Safeguard:</strong> Canonical launch properties <em>Yash Home Stay</em> and <em>Wonderway Retreat</em> must never be automatically assigned to arbitrary accounts. They remain in direct platform stewardship unless explicitly delegated by an authorized platform administrator.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-2xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-50 text-green-800 border border-green-200 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Property Assignment Grid */}
      <div className="space-y-4">
        <h2 className="font-serif text-2xl font-bold text-forest">Property Host Rosters ({properties.length})</h2>

        <div className="grid grid-cols-1 gap-6">
          {properties.map((p) => {
            const isUnassigned = !p.host_id;
            const primaryUser = knownUsers.find((u) => u.id === p.host_id);
            const propertyHostsList = p.hosts || [];

            return (
              <div
                key={p.id}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6"
              >
                {/* Property Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-forest/10">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-forest/10 flex items-center justify-center text-forest flex-shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-bold text-forest">{p.name}</h3>
                      <p className="text-xs text-charcoal-muted">
                        {p.village}, {p.district} • <span className="capitalize">{p.property_type}</span>
                      </p>
                    </div>
                  </div>

                  <div>
                    {isUnassigned ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold rounded-full">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        Direct Platform Stewardship (Unassigned)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-full">
                        <UserCheck className="w-3 h-3 text-emerald-600" />
                        Host Assigned
                      </span>
                    )}
                  </div>
                </div>

                {/* Assignment Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Primary Host Card */}
                  <div className="p-5 bg-ivory-warm rounded-2xl border border-forest/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-charcoal-muted">
                        Primary Host (Ownership)
                      </span>
                      {p.host_id && (
                        <button
                          type="button"
                          onClick={() => executeAction({ action: 'remove_primary_host', property_id: p.id })}
                          disabled={submitting === p.id}
                          className="text-[11px] font-semibold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                          <span>Revoke Host</span>
                        </button>
                      )}
                    </div>

                    {p.host_id ? (
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-forest">
                          {primaryUser?.fullName || primaryUser?.email || p.host_id}
                        </p>
                        {primaryUser?.email && (
                          <p className="text-xs text-charcoal-muted">{primaryUser.email}</p>
                        )}
                        <p className="text-[11px] font-mono text-charcoal-muted/70 truncate">
                          ID: {p.host_id}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-charcoal-muted italic">
                          No external host is assigned. Property is under direct platform administration.
                        </p>
                        <div className="flex items-center gap-2">
                          <select
                            value={selectedPropertyId === p.id ? newPrimaryUserId : ''}
                            onChange={(e) => {
                              setSelectedPropertyId(p.id);
                              setNewPrimaryUserId(e.target.value);
                            }}
                            className="text-xs bg-white border border-forest/20 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-forest flex-1"
                          >
                            <option value="">Select registered user...</option>
                            {knownUsers.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.email} ({u.fullName || 'User'})
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              if (!newPrimaryUserId) return;
                              executeAction({
                                action: 'set_primary_host',
                                property_id: p.id,
                                user_id: newPrimaryUserId,
                              });
                            }}
                            disabled={!newPrimaryUserId || submitting === p.id}
                            className="px-3 py-1.5 bg-forest text-white text-xs font-semibold rounded-xl hover:bg-forest-light transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Assign</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Co-hosts and Managers */}
                  <div className="p-5 bg-ivory-warm rounded-2xl border border-forest/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-charcoal-muted">
                        Operational Team ({propertyHostsList.length})
                      </span>
                    </div>

                    {propertyHostsList.length > 0 ? (
                      <div className="space-y-2">
                        {propertyHostsList.map((h) => {
                          const matchedUser = knownUsers.find((u) => u.id === h.user_id);
                          return (
                            <div
                              key={h.id}
                              className="p-3 bg-white rounded-xl border border-forest/10 flex items-center justify-between"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-forest">
                                    {matchedUser?.fullName || matchedUser?.email || h.user_id}
                                  </span>
                                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                                    h.role === 'manager' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {h.role === 'manager' ? 'Manager' : 'Co-host'}
                                  </span>
                                </div>
                                {matchedUser?.email && (
                                  <span className="text-[11px] text-charcoal-muted">{matchedUser.email}</span>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => executeAction({
                                  action: 'remove_cohost',
                                  property_id: p.id,
                                  user_id: h.user_id,
                                })}
                                disabled={submitting === p.id}
                                className="p-1.5 text-charcoal-muted hover:text-red-600 transition-colors"
                                title="Remove assignment"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-charcoal-muted italic">
                        No co-hosts or operational managers assigned.
                      </p>
                    )}

                    {/* Add Co-host / Manager Inline Form */}
                    <div className="pt-2 border-t border-forest/10 space-y-2">
                      <span className="text-[11px] font-semibold text-charcoal-muted block">
                        Add Team Member
                      </span>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <select
                          value={selectedPropertyId === p.id ? cohostUserId : ''}
                          onChange={(e) => {
                            setSelectedPropertyId(p.id);
                            setCohostUserId(e.target.value);
                          }}
                          className="text-xs bg-white border border-forest/20 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-forest flex-1"
                        >
                          <option value="">Select registered user...</option>
                          {knownUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.email} ({u.fullName || 'User'})
                            </option>
                          ))}
                        </select>

                        <select
                          value={cohostRole}
                          onChange={(e) => setCohostRole(e.target.value as any)}
                          className="text-xs bg-white border border-forest/20 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-forest w-32"
                        >
                          <option value="manager">Manager</option>
                          <option value="co_host">Co-host</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => {
                            if (!cohostUserId) return;
                            executeAction({
                              action: 'add_cohost',
                              property_id: p.id,
                              user_id: cohostUserId,
                              role: cohostRole,
                            });
                          }}
                          disabled={!cohostUserId || submitting === p.id}
                          className="px-3 py-1.5 bg-forest text-white text-xs font-semibold rounded-xl hover:bg-forest-light transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                          Add Member
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
