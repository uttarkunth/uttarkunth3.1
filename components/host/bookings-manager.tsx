'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatINR } from '@/lib/utils';
import {
  Inbox, CheckCircle2, XCircle, Clock, Calendar, Users,
  Phone, Mail, MapPin, Sparkles, AlertCircle, MessageSquare, Filter
} from 'lucide-react';

const DIRECT_HOST_PAYMENT_NOTICE =
  'No online payment is currently collected by Uttarkunth. Guests pay their hosts directly at the property.';

interface Booking {
  id: string;
  booking_reference: string;
  property_id: string;
  room_unit_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  total_estimate: number | null;
  special_requests?: string | null;
  host_notes?: string | null;
  status: string;
  created_at: string;
  properties?: { name: string; village?: string | null } | null;
  room_units?: { room_name: string } | null;
}

interface BookingsManagerProps {
  initialBookings: Booking[];
}

export function BookingsManager({ initialBookings }: BookingsManagerProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'past'>('all');
  const [activeNotesId, setActiveNotesId] = useState<string | null>(null);
  const [notesText, setNotesText] = useState<string>('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<{ id: string; text: string } | null>(null);

  const filteredBookings = initialBookings.filter((b) => {
    if (filter === 'pending') return b.status === 'pending';
    if (filter === 'confirmed') return b.status === 'confirmed';
    if (filter === 'past') return b.status === 'declined' || b.status === 'cancelled';
    return true;
  });

  const handleDecision = async (bookingId: string, action: 'confirm' | 'decline') => {
    setActionError(null);
    setLoadingId(bookingId);

    try {
      const res = await fetch('/api/bookings/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          action,
          host_notes: activeNotesId === bookingId ? notesText : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to update booking status.');
      }

      setActiveNotesId(null);
      setNotesText('');
      router.refresh();
    } catch (err: any) {
      setActionError({ id: bookingId, text: err.message || 'Action failed' });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-ukorange">
            Reservations & Decision Center
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-forest mt-1">
            Guest Booking Requests
          </h1>
          <p className="text-sm text-charcoal-muted mt-1">
            Review guest requests, communicate check-in guidance, and approve or decline reservations.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-forest/15 shadow-xs overflow-x-auto">
          {[
            { id: 'all', label: `All (${initialBookings.length})` },
            { id: 'pending', label: `Pending (${initialBookings.filter((b) => b.status === 'pending').length})` },
            { id: 'confirmed', label: `Confirmed (${initialBookings.filter((b) => b.status === 'confirmed').length})` },
            { id: 'past', label: `History (${initialBookings.filter((b) => b.status === 'declined' || b.status === 'cancelled').length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
                filter === tab.id
                  ? 'bg-forest text-white shadow-xs'
                  : 'text-charcoal-muted hover:text-charcoal'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Strict Direct Host Payment Notice */}
      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200/80 flex items-start gap-3 shadow-xs">
        <Sparkles className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-xs text-emerald-900">
          <span className="font-bold">Direct Guest Payment Policy:</span>
          <p className="text-emerald-800">{DIRECT_HOST_PAYMENT_NOTICE}</p>
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length > 0 ? (
        <div className="space-y-4">
          {filteredBookings.map((b) => {
            const isPending = b.status === 'pending';
            const isConfirmed = b.status === 'confirmed';
            const isDeclined = b.status === 'declined';
            const isCancelled = b.status === 'cancelled';
            const isLoading = loadingId === b.id;
            const hasError = actionError?.id === b.id;

            return (
              <div
                key={b.id}
                className={`bg-white rounded-3xl p-6 sm:p-8 border shadow-soft transition-all space-y-4 ${
                  isPending
                    ? 'border-ukorange/40 ring-1 ring-ukorange/20'
                    : 'border-forest/15'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-forest/10">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-charcoal">
                        #{b.booking_reference}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 text-[11px] font-bold uppercase rounded-full ${
                          isConfirmed
                            ? 'bg-emerald-100 text-emerald-800'
                            : isDeclined
                            ? 'bg-red-100 text-red-800'
                            : isCancelled
                            ? 'bg-charcoal/10 text-charcoal'
                            : 'bg-ukorange/20 text-ukorange'
                        }`}
                      >
                        {isPending ? 'Decision Needed (Dates Open)' : b.status}
                      </span>
                    </div>
                    <h2 className="font-serif text-2xl font-bold text-forest mt-1">
                      {b.guest_name} —{' '}
                      <span className="font-normal text-charcoal-muted">
                        {b.properties?.name} ({b.room_units?.room_name})
                      </span>
                    </h2>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-charcoal-muted uppercase tracking-wider block">
                      Estimated Total (Pay at Stay)
                    </span>
                    <span className="font-serif text-2xl font-bold text-forest">
                      {formatINR(Number(b.total_estimate || 0))}
                    </span>
                  </div>
                </div>

                {hasError && (
                  <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <span>{actionError.text}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-ivory-warm rounded-xl border border-forest/10 space-y-1">
                    <span className="text-charcoal-muted uppercase tracking-wider font-semibold block flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-forest" /> Stay Dates
                    </span>
                    <span className="font-semibold text-charcoal text-sm">
                      {b.check_in} → {b.check_out}
                    </span>
                  </div>

                  <div className="p-3 bg-ivory-warm rounded-xl border border-forest/10 space-y-1">
                    <span className="text-charcoal-muted uppercase tracking-wider font-semibold block flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-forest" /> Guests
                    </span>
                    <span className="font-semibold text-charcoal text-sm">
                      {b.adults} Adults {b.children > 0 ? `, ${b.children} Children` : ''}
                    </span>
                  </div>

                  <div className="p-3 bg-ivory-warm rounded-xl border border-forest/10 space-y-1">
                    <span className="text-charcoal-muted uppercase tracking-wider font-semibold block flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-forest" /> Guest Contact
                    </span>
                    <span className="font-semibold text-charcoal block truncate">
                      {b.guest_phone}
                    </span>
                    <span className="text-charcoal-muted block truncate">{b.guest_email}</span>
                  </div>
                </div>

                {b.special_requests && (
                  <div className="text-xs p-3.5 bg-forest/5 rounded-xl border border-forest/10 text-charcoal">
                    <strong className="text-forest">Guest Request / Note: </strong>
                    {b.special_requests}
                  </div>
                )}

                {b.host_notes && (
                  <div className="text-xs p-3.5 bg-ivory-warm rounded-xl border border-forest/15 text-charcoal">
                    <strong className="text-forest">Host Note: </strong>
                    {b.host_notes}
                  </div>
                )}

                {/* Host Decision Action Area */}
                {isPending && (
                  <div className="pt-3 border-t border-forest/10 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-xs text-charcoal-muted">
                        <span>
                          Pending requests do not block dates for other travelers until formally approved.
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveNotesId(activeNotesId === b.id ? null : b.id)}
                          className="ml-2 text-forest font-semibold hover:underline inline-flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>{activeNotesId === b.id ? 'Hide note field' : 'Add note to guest'}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleDecision(b.id, 'decline')}
                          className="px-4 py-2 border border-forest/20 text-charcoal-muted hover:text-red-700 hover:border-red-300 text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
                        >
                          {isLoading ? 'Processing...' : 'Decline'}
                        </button>

                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleDecision(b.id, 'confirm')}
                          className="px-5 py-2 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4 text-ukorange" />
                          <span>{isLoading ? 'Confirming...' : 'Approve Stay'}</span>
                        </button>
                      </div>
                    </div>

                    {activeNotesId === b.id && (
                      <div className="p-3 bg-ivory-warm rounded-2xl border border-forest/15 space-y-2">
                        <label className="block text-[11px] font-semibold text-charcoal-muted">
                          Host Message / Check-in Guidance (will be saved with this decision)
                        </label>
                        <input
                          type="text"
                          value={notesText}
                          onChange={(e) => setNotesText(e.target.value)}
                          placeholder="e.g. Please call us 1 hour before arrival at Bhuntar / Jari."
                          className="w-full p-2 text-xs bg-white border border-forest/20 rounded-xl focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-forest/15 shadow-soft max-w-lg mx-auto space-y-3">
          <Clock className="w-12 h-12 text-forest/40 mx-auto" />
          <h2 className="font-serif text-2xl font-bold text-forest">No Bookings Found</h2>
          <p className="text-xs text-charcoal-muted">
            There are currently no bookings matching the selected filter ({filter}).
          </p>
        </div>
      )}
    </div>
  );
}