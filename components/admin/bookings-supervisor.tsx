'use client';

import React, { useState } from 'react';
import { formatINR } from '@/lib/utils';
import {
  Inbox, Calendar, Users, MapPin, CheckCircle2,
  Clock, XCircle, Search, Filter, ShieldCheck, DollarSign
} from 'lucide-react';

interface BookingItem {
  id: string;
  booking_reference: string;
  property_id: string;
  room_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  adults_count: number;
  children_count: number;
  check_in: string;
  check_out: string;
  total_estimate: number;
  status: string;
  commission_percent_snapshot: number | null;
  commission_amount_snapshot: number | null;
  created_at: string;
  properties?: {
    name: string;
    village: string;
  };
  room_units?: {
    room_name: string;
  };
}

interface BookingsSupervisorProps {
  bookings: BookingItem[];
}

export function BookingsSupervisor({ bookings }: BookingsSupervisorProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filtered = bookings.filter((b) => {
    if (filterStatus !== 'all' && b.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRef = b.booking_reference?.toLowerCase().includes(q);
      const matchName = b.guest_name?.toLowerCase().includes(q);
      const matchProp = b.properties?.name?.toLowerCase().includes(q);
      const matchPhone = b.guest_phone?.includes(q);
      if (!matchRef && !matchName && !matchProp && !matchPhone) return false;
    }
    return true;
  });

  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-ukorange">Master Ledger</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-forest mt-1">Platform Booking Oversight</h1>
          <p className="text-sm text-charcoal-muted mt-1 max-w-2xl">
            Supervisory view of all homestay booking requests across Uttarakhand.
          </p>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-forest/10 text-forest text-xs font-bold rounded-xl flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-forest" />
            <span>{confirmedCount} Confirmed</span>
          </span>
          <span className="px-3 py-1.5 bg-ukorange/15 text-ukorange text-xs font-bold rounded-xl flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-ukorange" />
            <span>{pendingCount} Pending</span>
          </span>
        </div>
      </div>

      {/* Direct Payment Policy Banner */}
      <div className="p-4 bg-forest/5 border border-forest/15 rounded-2xl flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-forest flex-shrink-0" />
        <p className="text-xs text-forest leading-relaxed">
          <strong>Direct Guest Settlement Model:</strong> No online payment is currently collected by Uttarkunth. Guests pay their hosts directly at the property. Commission amounts are snapshot estimates recorded only when authorized bilateral host agreements exist.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-forest/15 shadow-soft flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-charcoal-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by reference, guest name, property, or phone..."
            className="w-full text-xs pl-9 pr-4 py-2.5 bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none focus:ring-1 focus:ring-forest"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['all', 'pending', 'confirmed', 'declined', 'cancelled'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl capitalize whitespace-nowrap transition-colors ${
                filterStatus === st
                  ? 'bg-forest text-white shadow-xs'
                  : 'bg-ivory-warm text-charcoal-muted hover:text-charcoal border border-forest/10'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-4">
        <div className="text-xs text-charcoal-muted font-medium">
          Showing {filtered.length} of {bookings.length} reservations
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-ivory-warm text-charcoal-muted uppercase tracking-wider border-b border-forest/10">
              <tr>
                <th className="p-3">Reference</th>
                <th className="p-3">Property & Room</th>
                <th className="p-3">Guest Contact</th>
                <th className="p-3">Stay Dates</th>
                <th className="p-3">Guests</th>
                <th className="p-3">Total (Pay at Property)</th>
                <th className="p-3">Commission Snapshot</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest/10">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-forest/5 transition-colors">
                  <td className="p-3 font-mono font-bold text-forest whitespace-nowrap">
                    {b.booking_reference}
                  </td>
                  <td className="p-3">
                    <span className="block font-semibold text-charcoal">
                      {b.properties?.name || 'Property'}
                    </span>
                    <span className="text-charcoal-muted text-[11px]">
                      {b.room_units?.room_name || 'Room'} • {b.properties?.village}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="block font-semibold text-forest">{b.guest_name}</span>
                    <span className="text-charcoal-muted text-[11px] block">{b.guest_phone}</span>
                    <span className="text-charcoal-muted text-[10px] block">{b.guest_email}</span>
                  </td>
                  <td className="p-3 text-charcoal-muted whitespace-nowrap">
                    {b.check_in} → {b.check_out}
                  </td>
                  <td className="p-3 whitespace-nowrap text-charcoal-muted">
                    {b.adults_count} Adult{b.adults_count !== 1 ? 's' : ''}
                    {b.children_count > 0 && ` + ${b.children_count} Ch`}
                  </td>
                  <td className="p-3 font-serif text-sm font-bold text-forest whitespace-nowrap">
                    {formatINR(Number(b.total_estimate || 0))}
                  </td>
                  <td className="p-3 text-charcoal-muted">
                    {b.commission_percent_snapshot != null ? (
                      <div>
                        <span className="font-semibold text-charcoal">{b.commission_percent_snapshot}%</span>
                        <span className="text-[11px] block">
                          ({formatINR(Number(b.commission_amount_snapshot || 0))})
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-charcoal-muted/80 italic">
                        Direct Settlement
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`px-2.5 py-1 font-bold uppercase rounded-full text-[10px] whitespace-nowrap ${
                      b.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      b.status === 'declined' ? 'bg-red-100 text-red-800' :
                      b.status === 'cancelled' ? 'bg-gray-100 text-gray-700' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-charcoal-muted italic">
                    No reservations matching current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
