'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatINR } from '@/lib/utils';
import {
  Calendar as CalendarIcon, Lock, Unlock, PlusCircle, Trash2,
  AlertTriangle, CheckCircle2, Clock, Sparkles, Filter, Info
} from 'lucide-react';

interface RoomUnit {
  id: string;
  room_name: string;
  property_id: string;
}

interface Property {
  id: string;
  name: string;
  room_units?: RoomUnit[];
}

interface Booking {
  id: string;
  booking_reference: string;
  check_in: string;
  check_out: string;
  status: string;
  guest_name: string;
  property_id: string;
  room_unit_id: string;
  properties?: { name: string };
  room_units?: { room_name: string };
}

interface AvailabilityBlock {
  id: string;
  room_unit_id: string;
  blocked_from: string;
  blocked_until: string;
  reason?: string;
  created_at: string;
  room_units?: {
    room_name: string;
    property_id: string;
    properties?: { name: string };
  };
}

interface CalendarViewProps {
  properties: Property[];
  confirmedBookings: Booking[];
  pendingBookings: Booking[];
  blocks: AvailabilityBlock[];
}

export function CalendarView({
  properties,
  confirmedBookings,
  pendingBookings,
  blocks,
}: CalendarViewProps) {
  const router = useRouter();

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('all');
  const [showAddBlock, setShowAddBlock] = useState(false);

  // Add block form state
  const firstProp = properties[0];
  const firstRoom = firstProp?.room_units?.[0];
  const [formRoomId, setFormRoomId] = useState<string>(firstRoom?.id || '');
  const [blockedFrom, setBlockedFrom] = useState<string>('');
  const [blockedUntil, setBlockedUntil] = useState<string>('');
  const [reason, setReason] = useState<string>('Host seasonal/maintenance block');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Filter items
  const filteredConfirmed = confirmedBookings.filter(
    (b) => selectedPropertyId === 'all' || b.property_id === selectedPropertyId
  );
  const filteredPending = pendingBookings.filter(
    (b) => selectedPropertyId === 'all' || b.property_id === selectedPropertyId
  );
  const filteredBlocks = blocks.filter((bl) => {
    if (selectedPropertyId === 'all') return true;
    return bl.room_units?.property_id === selectedPropertyId;
  });

  // All room units available across properties
  const allRooms = properties.flatMap((p) =>
    (p.room_units || []).map((r) => ({
      ...r,
      propertyName: p.name,
    }))
  );

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);

    try {
      if (!formRoomId || !blockedFrom || !blockedUntil) {
        throw new Error('Please select a room and both start/end dates.');
      }

      if (blockedUntil <= blockedFrom) {
        throw new Error('End date must be strictly after start date.');
      }

      const res = await fetch('/api/host/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_unit_id: formRoomId,
          blocked_from: blockedFrom,
          blocked_until: blockedUntil,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to create availability block.');
      }

      setFormSuccess('Dates successfully blocked.');
      setBlockedFrom('');
      setBlockedUntil('');
      setShowAddBlock(false);
      router.refresh();
    } catch (err: any) {
      setFormError(err.message || 'Failed to block dates');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm('Are you sure you want to unblock these dates and reopen availability?')) {
      return;
    }

    try {
      const res = await fetch(`/api/host/availability?id=${blockId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to delete block');
      }
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Error deleting block');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-ukorange">
            Availability & Inventory
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-forest mt-1">
            Stay Calendar & Block Manager
          </h1>
          <p className="text-sm text-charcoal-muted mt-1">
            Real-time schedule of confirmed stays, pending requests, and manual host availability blocks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Property Filter */}
          {properties.length > 1 && (
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-forest/15 shadow-xs text-xs">
              <Filter className="w-3.5 h-3.5 text-charcoal-muted" />
              <select
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="bg-transparent font-medium text-forest focus:outline-none"
              >
                <option value="all">All Properties ({properties.length})</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowAddBlock(!showAddBlock)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
          >
            <Lock className="w-4 h-4 text-ukorange" />
            <span>Block Room Dates</span>
          </button>
        </div>
      </div>

      {/* Strict Concurrency & Legend Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200/80 flex items-start gap-3 shadow-xs">
          <div className="w-4 h-4 rounded-full bg-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs text-emerald-950">
            <span className="font-bold">Confirmed Reservations:</span>
            <p className="text-emerald-800">
              Dates are strictly locked and reserved in database. New requests overlapping these dates are rejected.
            </p>
          </div>
        </div>

        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-start gap-3 shadow-xs">
          <div className="w-4 h-4 rounded-full bg-ukorange flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs text-amber-950">
            <span className="font-bold">Pending Guest Requests:</span>
            <p className="text-amber-800">
              <strong>Dates Open to Others / Not Blocked.</strong> Pending requests never hold dates until approved.
            </p>
          </div>
        </div>

        <div className="p-4 bg-charcoal/5 rounded-2xl border border-charcoal/15 flex items-start gap-3 shadow-xs">
          <div className="w-4 h-4 rounded-full bg-charcoal flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs text-charcoal">
            <span className="font-bold">Manual Host Blocks:</span>
            <p className="text-charcoal-muted">
              Dates closed for maintenance, private use, or seasonal closures. Cannot overlap confirmed bookings.
            </p>
          </div>
        </div>
      </div>

      {/* Manual Block Creation Form */}
      {showAddBlock && (
        <form
          onSubmit={handleCreateBlock}
          className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-forest/10">
            <h2 className="font-serif text-xl font-bold text-forest flex items-center gap-2">
              <Lock className="w-4 h-4 text-ukorange" />
              <span>Create Manual Availability Block</span>
            </h2>
            <button
              type="button"
              onClick={() => setShowAddBlock(false)}
              className="text-xs text-charcoal-muted hover:text-charcoal"
            >
              Cancel
            </button>
          </div>

          {formError && (
            <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-charcoal-muted mb-1">Room Unit</label>
              <select
                value={formRoomId}
                onChange={(e) => setFormRoomId(e.target.value)}
                className="w-full p-2.5 bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none"
                required
              >
                {allRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.propertyName} — {r.room_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-charcoal-muted mb-1">Blocked From (Check-in)</label>
              <input
                type="date"
                value={blockedFrom}
                onChange={(e) => setBlockedFrom(e.target.value)}
                className="w-full p-2.5 bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-charcoal-muted mb-1">Blocked Until (Check-out)</label>
              <input
                type="date"
                value={blockedUntil}
                onChange={(e) => setBlockedUntil(e.target.value)}
                className="w-full p-2.5 bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-charcoal-muted mb-1">Reason / Notes</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Renovation / Host stay"
                className="w-full p-2.5 bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              {submitting ? 'Applying Block...' : 'Confirm Availability Block'}
            </button>
          </div>
        </form>
      )}

      {/* Active Schedule Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confirmed Reservations */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-forest/10">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
              <h2 className="font-serif text-xl font-bold text-forest">
                Confirmed Reservations ({filteredConfirmed.length})
              </h2>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Dates Locked
            </span>
          </div>

          {filteredConfirmed.length > 0 ? (
            <div className="divide-y divide-forest/10 space-y-3">
              {filteredConfirmed.map((b) => (
                <div key={b.id} className="pt-3 first:pt-0 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-charcoal">#{b.booking_reference}</span>
                    <span className="font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                      {b.check_in} → {b.check_out}
                    </span>
                  </div>
                  <p className="font-semibold text-forest text-sm">
                    {b.guest_name} — {b.properties?.name} ({b.room_units?.room_name})
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-charcoal-muted py-6 text-center">
              No confirmed bookings currently active for this selection.
            </p>
          )}
        </div>

        {/* Manual Availability Blocks */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-forest/10">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-charcoal inline-block" />
              <h2 className="font-serif text-xl font-bold text-forest">
                Host Availability Blocks ({filteredBlocks.length})
              </h2>
            </div>
            <span className="text-[11px] font-bold text-charcoal-muted bg-charcoal/5 px-2 py-0.5 rounded-full border border-charcoal/10">
              Dates Unavailable
            </span>
          </div>

          {filteredBlocks.length > 0 ? (
            <div className="divide-y divide-forest/10 space-y-3">
              {filteredBlocks.map((bl) => (
                <div key={bl.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-charcoal">
                        {bl.room_units?.properties?.name} — {bl.room_units?.room_name}
                      </span>
                    </div>
                    <span className="text-charcoal-muted block">
                      {bl.blocked_from} → {bl.blocked_until} ({bl.reason || 'Manual block'})
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteBlock(bl.id)}
                    className="p-1.5 text-charcoal-muted hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove block and open dates"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-charcoal-muted py-6 text-center">
              No manual availability blocks in place.
            </p>
          )}
        </div>
      </div>

      {/* Pending Requests Notice Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-ukorange/30 shadow-soft space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-forest/10">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-ukorange inline-block" />
            <h2 className="font-serif text-xl font-bold text-forest">
              Pending Requests ({filteredPending.length})
            </h2>
          </div>
          <span className="text-[11px] font-bold text-ukorange bg-ukorange/10 px-2.5 py-0.5 rounded-full border border-ukorange/20">
            Dates Open to Others / Not Blocked
          </span>
        </div>

        {filteredPending.length > 0 ? (
          <div className="divide-y divide-forest/10 space-y-3">
            {filteredPending.map((b) => (
              <div key={b.id} className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-charcoal">#{b.booking_reference}</span>
                    <span className="font-semibold text-forest">
                      {b.guest_name} — {b.properties?.name} ({b.room_units?.room_name})
                    </span>
                  </div>
                  <span className="text-charcoal-muted block">
                    Requested Dates: <strong>{b.check_in} → {b.check_out}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-ukorange font-medium">Decision Required:</span>
                  <form action="/api/bookings/decision" method="POST">
                    <input type="hidden" name="booking_id" value={b.id} />
                    <input type="hidden" name="action" value="confirm" />
                    <button
                      type="submit"
                      className="px-3 py-1 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-lg shadow-xs"
                    >
                      Approve & Lock
                    </button>
                  </form>
                  <form action="/api/bookings/decision" method="POST">
                    <input type="hidden" name="booking_id" value={b.id} />
                    <input type="hidden" name="action" value="decline" />
                    <button
                      type="submit"
                      className="px-3 py-1 border border-forest/20 text-charcoal-muted hover:text-red-700 text-xs font-semibold rounded-lg"
                    >
                      Decline
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-charcoal-muted py-4 text-center">
            No pending booking requests awaiting decision.
          </p>
        )}
      </div>
    </div>
  );
}
