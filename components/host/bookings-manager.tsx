'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Download,
  ShieldCheck,
  Inbox,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { useHostWorkspace } from '@/components/host/host-workspace-shell';
import { HostBookingDetailModal } from '@/components/host/host-booking-detail-modal';
import {
  filterRecordsByProperty,
  formatBookingReference,
  formatInrCurrency,
  getBookingEstimatedValue,
  getBookingGuestCount,
  getBookingNights,
  getBookingPropertyTitle,
  getBookingRoomName,
  getBookingStatus,
  getPropertyDisplayName,
  type HostBookingRecord,
} from '@/lib/host-dashboard';

interface BookingsManagerProps {
  initialBookings: HostBookingRecord[];
}

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'completed' | 'declined';
type SortOption = 'newest' | 'checkin' | 'value';

export function BookingsManager({ initialBookings }: BookingsManagerProps) {
  const router = useRouter();
  const { selectedPropertyId, setSelectedPropertyId, properties } = useHostWorkspace();

  const [bookings, setBookings] = useState<HostBookingRecord[]>(initialBookings);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedBooking, setSelectedBooking] = useState<HostBookingRecord | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const propertyScopedBookings = useMemo(
    () => filterRecordsByProperty(bookings, selectedPropertyId),
    [bookings, selectedPropertyId]
  );

  const counts = useMemo(() => {
    const c = { all: propertyScopedBookings.length, pending: 0, confirmed: 0, completed: 0, declined: 0 };
    for (const b of propertyScopedBookings) {
      const s = getBookingStatus(b);
      if (s === 'pending') c.pending += 1;
      else if (s === 'confirmed') c.confirmed += 1;
      else if (s === 'completed') c.completed += 1;
      else if (s === 'declined' || s === 'cancelled') c.declined += 1;
    }
    return c;
  }, [propertyScopedBookings]);

  const filteredBookings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = propertyScopedBookings.filter((b) => {
      const s = getBookingStatus(b);
      if (statusFilter === 'pending' && s !== 'pending') return false;
      if (statusFilter === 'confirmed' && s !== 'confirmed') return false;
      if (statusFilter === 'completed' && s !== 'completed') return false;
      if (statusFilter === 'declined' && s !== 'declined' && s !== 'cancelled') return false;

      if (q) {
        const ref = formatBookingReference(b).toLowerCase();
        const guest = (b.guest_name || '').toLowerCase();
        const phone = (b.guest_phone || '').toLowerCase();
        const prop = getBookingPropertyTitle(b).toLowerCase();
        const room = getBookingRoomName(b).toLowerCase();
        return (
          ref.includes(q) ||
          guest.includes(q) ||
          phone.includes(q) ||
          prop.includes(q) ||
          room.includes(q)
        );
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'checkin') {
        return (a.check_in || '').localeCompare(b.check_in || '');
      }
      if (sortBy === 'value') {
        return getBookingEstimatedValue(b) - getBookingEstimatedValue(a);
      }
      return (b.created_at || '').localeCompare(a.created_at || '');
    });
  }, [propertyScopedBookings, statusFilter, searchQuery, sortBy]);

  const handleDecision = async (booking: HostBookingRecord, action: 'confirm' | 'decline') => {
    setFeedbackMsg(null);
    setLoadingId(booking.id);

    try {
      const res = await fetch('/api/bookings/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: booking.id,
          action,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to update booking status.');
      }

      const nextStatus = action === 'confirm' ? 'confirmed' : 'declined';
      setBookings((prev) =>
        prev.map((item) =>
          item.id === booking.id ? { ...item, status: nextStatus, booking_status: nextStatus } : item
        )
      );
      setFeedbackMsg({
        type: 'ok',
        text:
          action === 'confirm'
            ? `Accepted ${formatBookingReference(booking)} for ${booking.guest_name}. Room dates are now locked.`
            : `Declined ${formatBookingReference(booking)} for ${booking.guest_name}.`,
      });
      router.refresh();
    } catch (err: any) {
      setFeedbackMsg({ type: 'err', text: err.message || 'Action failed' });
    } finally {
      setLoadingId(null);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'Reference',
      'Guest Name',
      'Phone',
      'Property',
      'Room',
      'Check-In',
      'Check-Out',
      'Nights',
      'Guests',
      'Estimated Value (INR)',
      'Status',
    ];
    const rows = filteredBookings.map((b) => [
      formatBookingReference(b),
      `"${(b.guest_name || '').replace(/"/g, '""')}"`,
      `"${(b.guest_phone || '').replace(/"/g, '""')}"`,
      `"${getBookingPropertyTitle(b).replace(/"/g, '""')}"`,
      `"${getBookingRoomName(b).replace(/"/g, '""')}"`,
      b.check_in,
      b.check_out,
      String(getBookingNights(b)),
      String(getBookingGuestCount(b)),
      String(getBookingEstimatedValue(b)),
      getBookingStatus(b),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `uttarkunth-host-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4" data-testid="host-bookings-view">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#665E52]">
            <span>Host Workspace</span>
            <span>/</span>
            <span>Manage Stays</span>
            <span>/</span>
            <strong className="text-[#263D32]">Bookings</strong>
          </div>
          <h1 className="font-serif text-[28px] sm:text-[34px] font-bold text-[#29251F] leading-tight mt-0.5">
            Bookings
          </h1>
          <p className="text-[13px] text-[#665E52] mt-0.5">
            Review booking requests, confirm guest stays and keep arrival notes in one place.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[11px] bg-[#FFFDF9] hover:bg-[#EFE7D8] text-[#29251F] border border-[#D9CCB8] text-xs font-bold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#263D32]" />
            <span>Export bookings</span>
          </button>
        </div>
      </div>

      {/* Direct Payment Notice */}
      <div className="p-3.5 rounded-[14px] bg-[#E8F4EC] border border-[#1F6A3B]/20 text-[#194E2C] flex items-start gap-3">
        <div className="w-8 h-8 rounded-[10px] bg-[#FFFDF9]/75 flex items-center justify-center text-[#1F6A3B] shrink-0 font-bold">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="text-xs leading-relaxed">
          <strong className="block text-[13px] font-extrabold text-[#194E2C]">
            Direct Host Payment Model
          </strong>
          <span>
            Booking values shown below are estimates based on your room rates. Guests pay you directly at your property.
          </span>
        </div>
      </div>

      {feedbackMsg && (
        <div
          role="status"
          className={`p-3 rounded-[12px] text-xs font-bold flex items-center justify-between gap-2 ${
            feedbackMsg.type === 'ok'
              ? 'bg-[#1A2B23] text-[#FFFDF9]'
              : 'bg-[#FBEAE7] text-[#A53525] border border-[#A53525]/25'
          }`}
        >
          <span className="flex items-center gap-2">
            {feedbackMsg.type === 'ok' ? (
              <CheckCircle2 className="w-4 h-4 text-[#3E9B63] shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            {feedbackMsg.text}
          </span>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-[11px] underline opacity-80 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Bookings Panel */}
      <section className="p-4 sm:p-5 rounded-[16px] bg-[#FFFDF9] border border-[#D9CCB8] shadow-[0_1px_2px_rgba(24,22,18,0.04)] space-y-3.5">
        {/* Toolbar: Search, Property Filter, Sort & Status Tabs */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-[#665E52] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="host-bookings-search-input"
                placeholder="Search guest name, booking reference, property or room..."
                className="w-full pl-9 pr-3 py-2 rounded-[10px] bg-[#FFFDF9] border border-[#D9CCB8] text-xs font-medium text-[#29251F] placeholder:text-[#665E52]/70 focus:outline-none focus:border-[#263D32]"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                aria-label="Filter bookings by property"
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="px-3 py-2 rounded-[10px] bg-[#FFFDF9] border border-[#D9CCB8] text-xs font-bold text-[#29251F] focus:outline-none focus:border-[#263D32] cursor-pointer"
              >
                <option value="all">All properties ({properties.length})</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {getPropertyDisplayName(p)}
                  </option>
                ))}
              </select>

              <select
                aria-label="Sort bookings"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 rounded-[10px] bg-[#FFFDF9] border border-[#D9CCB8] text-xs font-bold text-[#29251F] focus:outline-none focus:border-[#263D32] cursor-pointer"
              >
                <option value="newest">Sort: Newest first</option>
                <option value="checkin">Sort: Check-in date</option>
                <option value="value">Sort: Highest value</option>
              </select>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div
            data-testid="host-bookings-filter-tabs"
            className="flex items-center gap-1 p-1 rounded-[11px] bg-[#F5F0E6] border border-[#D9CCB8] overflow-x-auto no-scrollbar"
          >
            {(
              [
                { id: 'all', label: `All (${counts.all})` },
                { id: 'pending', label: `Pending (${counts.pending})` },
                { id: 'confirmed', label: `Confirmed (${counts.confirmed})` },
                { id: 'completed', label: `Completed (${counts.completed})` },
                { id: 'declined', label: `Declined (${counts.declined})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-2.5 py-1.5 rounded-[8px] text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-[#263D32] text-[#FFFDF9]'
                    : 'text-[#665E52] hover:text-[#29251F]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings Table (Desktop) & Structured Cards (Mobile) */}
        {filteredBookings.length > 0 ? (
          <>
            <div className="hidden md:block overflow-x-auto border border-[#E5DEC9] rounded-[13px] bg-[#FFFDF9]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F6F1E7] border-b border-[#E5DEC9] text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#665E52]">
                    <th className="py-2.5 px-3">Reference &amp; Guest</th>
                    <th className="py-2.5 px-3">Property &amp; Room</th>
                    <th className="py-2.5 px-3">Check-in / Check-out</th>
                    <th className="py-2.5 px-3">Guests</th>
                    <th className="py-2.5 px-3">Est. Value</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5DEC9] text-[13px]">
                  {filteredBookings.map((b) => {
                    const status = getBookingStatus(b);
                    const isPending = status === 'pending';
                    const isConfirmed = status === 'confirmed';
                    const isCompleted = status === 'completed';
                    const nights = getBookingNights(b);
                    const estVal = getBookingEstimatedValue(b);
                    const isLoading = loadingId === b.id;

                    return (
                      <tr key={b.id} className="hover:bg-[#FAF6EE] transition-colors">
                        <td className="py-3 px-3">
                          <strong className="block font-bold text-[#29251F]">
                            {b.guest_name}
                          </strong>
                          <span className="text-[11px] text-[#665E52] font-mono">
                            {formatBookingReference(b)} · {b.guest_phone}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <strong className="block font-bold text-[#29251F]">
                            {getBookingPropertyTitle(b)}
                          </strong>
                          <span className="text-[11px] text-[#665E52]">
                            {getBookingRoomName(b)}
                          </span>
                        </td>
                        <td className="py-3 px-3 tabular-nums">
                          <strong className="block font-bold text-[#29251F]">
                            {b.check_in} &rarr; {b.check_out}
                          </strong>
                          <span className="text-[11px] text-[#665E52]">
                            {nights} {nights === 1 ? 'night' : 'nights'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-xs text-[#29251F]">
                          {getBookingGuestCount(b)} guests
                        </td>
                        <td className="py-3 px-3 tabular-nums">
                          <strong className="block font-bold text-[#29251F]">
                            {formatInrCurrency(estVal)}
                          </strong>
                          <span className="text-[11px] text-[#665E52]">Direct at property</span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold whitespace-nowrap ${
                              isConfirmed
                                ? 'bg-[#E8F4EC] text-[#1F6A3B]'
                                : isPending
                                ? 'bg-[#FDF3E1] text-[#9A6216]'
                                : isCompleted
                                ? 'bg-[#EAE7E0] text-[#4C473E]'
                                : 'bg-[#FBEAE7] text-[#A53525]'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {isPending
                              ? 'Pending · Dates open'
                              : isConfirmed
                              ? 'Confirmed'
                              : isCompleted
                              ? 'Completed'
                              : 'Declined'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedBooking(b)}
                              className="px-2.5 py-1.5 rounded-[9px] bg-[#FFFDF9] hover:bg-[#EFE7D8] border border-[#D9CCB8] text-xs font-bold text-[#29251F] cursor-pointer"
                            >
                              View
                            </button>
                            {isPending && (
                              <>
                                <button
                                  type="button"
                                  disabled={isLoading}
                                  onClick={() => handleDecision(b, 'confirm')}
                                  className="px-2.5 py-1.5 rounded-[9px] bg-[#1F6A3B] hover:bg-[#18542E] text-[#FFFDF9] text-xs font-bold cursor-pointer disabled:opacity-50"
                                >
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  disabled={isLoading}
                                  onClick={() => handleDecision(b, 'decline')}
                                  className="px-2.5 py-1.5 rounded-[9px] bg-[#FBEAE7] hover:bg-[#F7D7D2] text-[#A53525] border border-[#A53525]/20 text-xs font-bold cursor-pointer disabled:opacity-50"
                                >
                                  Decline
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Booking Cards */}
            <div className="md:hidden space-y-2.5">
              {filteredBookings.map((b) => {
                const status = getBookingStatus(b);
                const isPending = status === 'pending';
                const isConfirmed = status === 'confirmed';
                const nights = getBookingNights(b);
                const estVal = getBookingEstimatedValue(b);
                const isLoading = loadingId === b.id;

                return (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-[13px] bg-[#F5F0E6]/70 border border-[#D9CCB8] space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-mono font-bold text-[#665E52]">
                          {formatBookingReference(b)}
                        </span>
                        <h3 className="text-sm font-extrabold text-[#29251F]">
                          {b.guest_name}
                        </h3>
                        <p className="text-xs text-[#665E52]">
                          {getBookingPropertyTitle(b)} · {getBookingRoomName(b)}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isConfirmed
                            ? 'bg-[#E8F4EC] text-[#1F6A3B]'
                            : isPending
                            ? 'bg-[#FDF3E1] text-[#9A6216]'
                            : 'bg-[#FBEAE7] text-[#A53525]'
                        }`}
                      >
                        {isPending ? 'Pending · Open' : isConfirmed ? 'Confirmed' : status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#E5DEC9]">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#665E52] block">
                          Dates ({nights}n)
                        </span>
                        <strong className="text-[#29251F] tabular-nums">
                          {b.check_in} &rarr; {b.check_out}
                        </strong>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-[#665E52] block">
                          Est. Direct Value
                        </span>
                        <strong className="text-[#263D32] font-extrabold tabular-nums">
                          {formatInrCurrency(estVal)}
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      {b.guest_phone ? (
                        <a
                          href={`https://api.whatsapp.com/send?phone=${b.guest_phone.replace(/[^0-9]/g, '')}&text=${encodeURIComponent(`Namaste ${b.guest_name}, regarding your booking ${formatBookingReference(b)}...`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[9px] bg-[#E8F4EC] text-[#1F6A3B] text-xs font-bold"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      ) : (
                        <span />
                      )}

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedBooking(b)}
                          className="px-3 py-1.5 rounded-[9px] bg-[#FFFDF9] border border-[#D9CCB8] text-xs font-bold text-[#29251F] inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Details</span>
                        </button>
                        {isPending && (
                          <>
                            <button
                              type="button"
                              disabled={isLoading}
                              onClick={() => handleDecision(b, 'decline')}
                              className="px-2.5 py-1.5 rounded-[9px] bg-[#FBEAE7] text-[#A53525] border border-[#A53525]/20 text-xs font-bold"
                            >
                              Decline
                            </button>
                            <button
                              type="button"
                              disabled={isLoading}
                              onClick={() => handleDecision(b, 'confirm')}
                              className="px-2.5 py-1.5 rounded-[9px] bg-[#1F6A3B] text-[#FFFDF9] text-xs font-bold"
                            >
                              Accept
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="p-10 rounded-[13px] bg-[#F5F0E6]/60 border border-[#E5DEC9] text-center space-y-2">
            <Inbox className="w-8 h-8 text-[#665E52] mx-auto" />
            <h2 className="font-serif text-xl font-bold text-[#29251F]">No bookings found</h2>
            <p className="text-xs text-[#665E52] max-w-md mx-auto">
              No reservations match the current search or status filter ({statusFilter}).
            </p>
          </div>
        )}
      </section>

      {/* Remember How Pending Requests Work (4-card guide from prototype) */}
      <section className="p-4 sm:p-5 rounded-[16px] bg-[#FFFDF9] border border-[#D9CCB8] shadow-[0_1px_2px_rgba(24,22,18,0.04)] space-y-3">
        <div>
          <h2 className="text-[15px] font-extrabold text-[#29251F]">
            Remember how pending requests work
          </h2>
          <p className="text-xs text-[#665E52]">
            Simple rules that keep your availability clear and under your control.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-[12px] bg-[#F5F0E6]/75 border border-[#E5DEC9] space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#FDF3E1] text-[#9A6216]">
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              Pending · Dates open
            </span>
            <p className="text-[#665E52] leading-relaxed">
              A guest has requested dates. The room remains open until you accept.
            </p>
          </div>

          <div className="p-3.5 rounded-[12px] bg-[#F5F0E6]/75 border border-[#E5DEC9] space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#E8F4EC] text-[#1F6A3B]">
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              Confirmed · Dates locked
            </span>
            <p className="text-[#665E52] leading-relaxed">
              You accepted the booking. Overlapping dates are now locked for that room unit.
            </p>
          </div>

          <div className="p-3.5 rounded-[12px] bg-[#F5F0E6]/75 border border-[#E5DEC9] space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#EAE7E0] text-[#4C473E]">
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              Host Block · Unavailable
            </span>
            <p className="text-[#665E52] leading-relaxed">
              Dates manually closed by you for maintenance, weather or personal use.
            </p>
          </div>

          <div className="p-3.5 rounded-[12px] bg-[#F5F0E6]/75 border border-[#E5DEC9] space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#EAE7E0] text-[#4C473E]">
              Host notes
            </span>
            <p className="text-[#665E52] leading-relaxed">
              Share road directions, meal preferences and arrival timing before guests travel.
            </p>
          </div>
        </div>
      </section>

      {/* Booking Detail Modal */}
      <HostBookingDetailModal
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onDecisionSuccess={(bookingId, newStatus, hostNotes) => {
          setBookings((prev) =>
            prev.map((item) =>
              item.id === bookingId
                ? {
                    ...item,
                    status: newStatus,
                    booking_status: newStatus,
                    host_notes: hostNotes ?? item.host_notes,
                  }
                : item
            )
          );
          setFeedbackMsg({
            type: 'ok',
            text:
              newStatus === 'confirmed'
                ? 'Booking request accepted and room dates locked.'
                : 'Booking request declined.',
          });
          router.refresh();
        }}
      />
    </div>
  );
}