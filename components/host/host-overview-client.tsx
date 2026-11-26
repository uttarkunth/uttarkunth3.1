'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Home,
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Star,
  Lock,
  Eye,
  Shield,
} from 'lucide-react';
import { useHostWorkspace } from '@/components/host/host-workspace-shell';
import { HostBookingDetailModal } from '@/components/host/host-booking-detail-modal';
import { AgreementAcceptor } from '@/components/host/agreement-acceptor';
import {
  computeHostDashboardKpis,
  computeOccupancySnapshot,
  computeBookingActivitySeries,
  computeStaySchedule,
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
  type HostPropertyRecord,
} from '@/lib/host-dashboard';

interface HostOverviewClientProps {
  initialProperties: HostPropertyRecord[];
  initialBookings: HostBookingRecord[];
  agreements: any[];
  isAdmin: boolean;
}

export function HostOverviewClient({
  initialProperties,
  initialBookings,
  agreements,
  isAdmin,
}: HostOverviewClientProps) {
  const router = useRouter();
  const { selectedPropertyId } = useHostWorkspace();
  const [bookings, setBookings] = useState<HostBookingRecord[]>(initialBookings);
  const [activityPeriod, setActivityPeriod] = useState<'7d' | '30d' | '90d'>('7d');
  const [selectedBooking, setSelectedBooking] = useState<HostBookingRecord | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedProperty = useMemo(
    () =>
      selectedPropertyId === 'all'
        ? null
        : initialProperties.find((p) => p.id === selectedPropertyId) || null,
    [initialProperties, selectedPropertyId]
  );

  const kpis = useMemo(
    () => computeHostDashboardKpis(initialProperties, bookings, selectedPropertyId),
    [initialProperties, bookings, selectedPropertyId]
  );

  const occupancySnapshot = useMemo(
    () => computeOccupancySnapshot(initialProperties, bookings, selectedPropertyId),
    [initialProperties, bookings, selectedPropertyId]
  );

  const activitySeries = useMemo(
    () => computeBookingActivitySeries(bookings, activityPeriod, selectedPropertyId),
    [bookings, activityPeriod, selectedPropertyId]
  );

  const staySchedule = useMemo(
    () => computeStaySchedule(bookings, selectedPropertyId),
    [bookings, selectedPropertyId]
  );

  const scopedBookings = useMemo(
    () => filterRecordsByProperty(bookings, selectedPropertyId),
    [bookings, selectedPropertyId]
  );

  const recentBookings = useMemo(() => scopedBookings.slice(0, 6), [scopedBookings]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const handleQuickDecision = async (booking: HostBookingRecord, action: 'confirm' | 'decline') => {
    setActionLoadingId(booking.id);
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
        throw new Error(data.error || 'Could not update booking.');
      }

      const nextStatus = action === 'confirm' ? 'confirmed' : 'declined';
      setBookings((prev) =>
        prev.map((item) =>
          item.id === booking.id ? { ...item, status: nextStatus, booking_status: nextStatus } : item
        )
      );
      showToast(
        action === 'confirm'
          ? `Confirmed ${formatBookingReference(booking)} for ${booking.guest_name}. Dates are now locked.`
          : `Declined ${formatBookingReference(booking)} for ${booking.guest_name}.`
      );
      router.refresh();
    } catch (err: any) {
      showToast(err.message || 'Action failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleModalDecisionSuccess = (
    bookingId: string,
    newStatus: 'confirmed' | 'declined',
    hostNotes?: string
  ) => {
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
    showToast(
      newStatus === 'confirmed'
        ? 'Booking request accepted and room dates locked.'
        : 'Booking request declined.'
    );
    router.refresh();
  };

  const availableNightsCount = Math.max(
    0,
    occupancySnapshot.totalAvailableRoomNights - occupancySnapshot.bookedRoomNights
  );

  return (
    <div className="space-y-4" data-testid="host-overview-view">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-1">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#665E52]">
            <span>Host Workspace</span>
            <span>/</span>
            <strong className="text-[#263D32]">Host Overview</strong>
            {selectedProperty && (
              <>
                <span>/</span>
                <span className="text-[#C55B23] font-bold">
                  {getPropertyDisplayName(selectedProperty)}
                </span>
              </>
            )}
            {isAdmin && (
              <span className="ml-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-[#C55B23]/15 text-[#A84C1C] border border-[#C55B23]/25 inline-flex items-center gap-1">
                <Shield className="w-3 h-3" /> Supervisor Mode
              </span>
            )}
          </div>
          <h1 className="font-serif text-[28px] sm:text-[34px] font-bold text-[#29251F] leading-tight mt-0.5">
            Host Overview
          </h1>
          <p className="text-[13px] text-[#665E52] mt-0.5">
            Manage pending requests, confirmed stays, rooms and availability for your mountain properties.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/account/stays/host/calendar"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[11px] bg-[#FFFDF9] hover:bg-[#EFE7D8] text-[#29251F] border border-[#D9CCB8] text-xs font-bold transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-[#263D32]" />
            <span>Open calendar</span>
          </Link>
          <Link
            href="/account/stays/host/properties"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[11px] bg-[#263D32] hover:bg-[#1A2B23] text-[#FFFDF9] text-xs font-bold shadow-xs transition-colors"
          >
            <Home className="w-3.5 h-3.5 text-[#E57C44]" />
            <span>Manage properties</span>
          </Link>
        </div>
      </div>

      {/* Toast Feedback */}
      {toastMessage && (
        <div
          role="status"
          className="p-3 rounded-[12px] bg-[#1A2B23] text-[#FFFDF9] text-xs font-bold flex items-center justify-between gap-2 shadow-md"
        >
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-[#FFFDF9]/70 hover:text-[#FFFDF9] text-[11px] underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Notice Banner: Direct Host Payment Model */}
      <div className="p-3.5 rounded-[14px] bg-[#E8F4EC] border border-[#1F6A3B]/20 text-[#194E2C] flex items-start gap-3">
        <div className="w-8 h-8 rounded-[10px] bg-[#FFFDF9]/75 flex items-center justify-center text-[#1F6A3B] shrink-0 font-bold">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="text-xs leading-relaxed">
          <strong className="block text-[13px] font-extrabold text-[#194E2C]">
            Direct Host Payment Model
          </strong>
          <span>
            Guests pay you directly at your property. Uttarkunth does not collect online booking payments or hold a host payout balance.
          </span>
        </div>
      </div>

      {/* Bilateral Host Agreements */}
      {agreements && agreements.length > 0 && <AgreementAcceptor agreements={agreements} />}

      {/* Pending Requests Alert Banner */}
      {kpis.pendingRequestsCount > 0 && (
        <div
          data-testid="host-pending-alert-banner"
          className="p-3.5 rounded-[14px] bg-[#FDF3E1] border border-[#C55B23]/30 text-[#6E440C] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-[10px] bg-[#FFFDF9]/80 flex items-center justify-center text-[#C55B23] shrink-0 font-extrabold">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="text-xs leading-relaxed">
              <strong className="block text-[13px] font-extrabold text-[#573508]">
                Action required: {kpis.pendingRequestsCount} pending booking{' '}
                {kpis.pendingRequestsCount === 1 ? 'request' : 'requests'}
              </strong>
              <span>
                Pending requests do not block room dates. Review and accept a request to lock calendar availability.
              </span>
            </div>
          </div>

          <Link
            href="/account/stays/host/bookings"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-[#C55B23] hover:bg-[#A84C1C] text-[#FFFDF9] text-xs font-bold shrink-0 transition-colors"
          >
            <span>Review requests</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 4 KPI Cards */}
      <div
        data-testid="host-overview-kpi-grid"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <div className="p-4 rounded-[14px] bg-[#FFFDF9] border border-[#D9CCB8] shadow-[0_1px_2px_rgba(24,22,18,0.04)] flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#665E52]">Active properties</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-[#E8F4EC] text-[#1F6A3B]">
              {kpis.activePropertiesCount} live
            </span>
          </div>
          <div className="text-2xl sm:text-[28px] font-extrabold text-[#29251F] tracking-tight tabular-nums leading-none">
            {kpis.totalPropertiesCount}
          </div>
          <div className="text-[11px] sm:text-xs text-[#665E52]">
            {kpis.totalRoomUnitsCount} room {kpis.totalRoomUnitsCount === 1 ? 'unit' : 'units'} configured
          </div>
        </div>

        <div className="p-4 rounded-[14px] bg-[#FFFDF9] border border-[#D9CCB8] shadow-[0_1px_2px_rgba(24,22,18,0.04)] flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#665E52]">Pending requests</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                kpis.pendingRequestsCount > 0
                  ? 'bg-[#FDF3E1] text-[#9A6216]'
                  : 'bg-[#EAE7E0] text-[#4C473E]'
              }`}
            >
              {kpis.pendingRequestsCount > 0 ? 'Needs decision' : 'All clear'}
            </span>
          </div>
          <div className="text-2xl sm:text-[28px] font-extrabold text-[#C55B23] tracking-tight tabular-nums leading-none">
            {kpis.pendingRequestsCount}
          </div>
          <div className="text-[11px] sm:text-xs text-[#665E52]">
            Dates remain open until approved
          </div>
        </div>

        <div className="p-4 rounded-[14px] bg-[#FFFDF9] border border-[#D9CCB8] shadow-[0_1px_2px_rgba(24,22,18,0.04)] flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#665E52]">Confirmed stays</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-[#E8F4EC] text-[#1F6A3B]">
              Locked dates
            </span>
          </div>
          <div className="text-2xl sm:text-[28px] font-extrabold text-[#1F6A3B] tracking-tight tabular-nums leading-none">
            {kpis.confirmedStaysCount}
          </div>
          <div className="text-[11px] sm:text-xs text-[#665E52]">
            {kpis.upcomingArrivalsCount} upcoming{' '}
            {kpis.upcomingArrivalsCount === 1 ? 'arrival' : 'arrivals'}
          </div>
        </div>

        <div className="p-4 rounded-[14px] bg-[#FFFDF9] border border-[#D9CCB8] shadow-[0_1px_2px_rgba(24,22,18,0.04)] flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#665E52]">Room nights booked</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-[#EAE7E0] text-[#4C473E]">
              Confirmed
            </span>
          </div>
          <div className="text-2xl sm:text-[28px] font-extrabold text-[#29251F] tracking-tight tabular-nums leading-none">
            {kpis.bookedRoomNights}
          </div>
          <div className="text-[11px] sm:text-xs text-[#665E52]">
            Est. {formatInrCurrency(kpis.estimatedConfirmedValue)} direct-to-host
          </div>
        </div>
      </div>

      {/* 3-Panel Insights & Schedule Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5">
        {/* 1. Booking Activity Chart */}
        <section className="xl:col-span-5 p-4 rounded-[16px] bg-[#FFFDF9] border border-[#D9CCB8] shadow-[0_1px_2px_rgba(24,22,18,0.04)] flex flex-col justify-between gap-3">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h2 className="text-[15px] font-extrabold text-[#29251F]">Booking Activity</h2>
              <p className="text-xs text-[#665E52]">
                Confirmed room nights vs pending requests
              </p>
            </div>
            <div className="inline-flex p-0.5 rounded-[10px] bg-[#F5F0E6] border border-[#D9CCB8]">
              {(['7d', '30d', '90d'] as const).map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setActivityPeriod(period)}
                  className={`px-2.5 py-1 rounded-[8px] text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                    activityPeriod === period
                      ? 'bg-[#263D32] text-[#FFFDF9]'
                      : 'text-[#665E52] hover:text-[#29251F]'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <div className="h-[155px] pt-3 px-1 border-b border-[#E5DEC9] grid grid-cols-6 sm:grid-cols-7 gap-2 items-end">
              {activitySeries.map((pt, idx) => (
                <div
                  key={`${pt.label}-${idx}`}
                  className="h-full flex flex-col items-center justify-end gap-1.5"
                >
                  <div className="w-full h-[120px] flex items-end justify-center">
                    <div
                      title={`${pt.label}: ${pt.confirmedCount} confirmed nights, ${pt.pendingCount} pending nights`}
                      style={{ height: `${pt.heightPercent}%` }}
                      className={`w-full max-w-[26px] rounded-t-[7px] transition-all duration-300 ${
                        pt.confirmedCount > 0
                          ? 'bg-gradient-to-b from-[#335243] to-[#263D32]'
                          : pt.pendingCount > 0
                          ? 'bg-gradient-to-b from-[#E57C44] to-[#C55B23]'
                          : 'bg-[#EAE7E0]'
                      }`}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-[#665E52] truncate max-w-full">
                    {pt.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2 pt-2.5 text-[11px] text-[#665E52]">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#263D32]" />
                  Confirmed nights
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#C55B23]" />
                  Pending requests
                </span>
              </div>
              <Link
                href="/account/stays/host/performance"
                className="font-bold text-[#263D32] hover:text-[#C55B23] transition-colors"
              >
                Insights &rarr;
              </Link>
            </div>
          </div>
        </section>

        {/* 2. Stay Schedule */}
        <section className="xl:col-span-4 p-4 rounded-[16px] bg-[#FFFDF9] border border-[#D9CCB8] shadow-[0_1px_2px_rgba(24,22,18,0.04)] flex flex-col justify-between gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-[15px] font-extrabold text-[#29251F]">Stay Schedule</h2>
              <p className="text-xs text-[#665E52]">
                Arrivals, in-house stays &amp; departures
              </p>
            </div>
            <Link
              href="/account/stays/host/bookings"
              className="text-xs font-bold text-[#263D32] hover:text-[#C55B23] transition-colors shrink-0"
            >
              All bookings &rarr;
            </Link>
          </div>

          {staySchedule.length > 0 ? (
            <div className="space-y-2 flex-1">
              {staySchedule.slice(0, 3).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedBooking(item.booking)}
                  className="w-full text-left p-2.5 rounded-[12px] bg-[#F5F0E6]/75 hover:bg-[#EFE7D8] border border-[#E5DEC9] transition-colors flex items-start justify-between gap-2 cursor-pointer"
                >
                  <div className="min-w-0">
                    <strong className="block text-xs font-bold text-[#29251F] truncate">
                      {item.guestName} · {item.roomName}
                    </strong>
                    <span className="block text-[11px] text-[#665E52] truncate mt-0.5">
                      {item.propertyTitle}
                    </span>
                    <span className="block text-[11px] text-[#665E52] tabular-nums">
                      {item.dateSummary}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                      item.scheduleType === 'in_house'
                        ? 'bg-[#E8F4EC] text-[#1F6A3B]'
                        : 'bg-[#FDF3E1] text-[#9A6216]'
                    }`}
                  >
                    {item.badgeLabel}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-5 rounded-[12px] bg-[#F5F0E6]/60 border border-[#E5DEC9] text-center my-auto space-y-1">
              <Clock className="w-5 h-5 text-[#665E52] mx-auto" />
              <p className="text-xs font-bold text-[#29251F]">No upcoming confirmed arrivals</p>
              <p className="text-[11px] text-[#665E52]">
                Approved guest stays will appear in your schedule here.
              </p>
            </div>
          )}
        </section>

        {/* 3. Occupancy Snapshot */}
        <section className="xl:col-span-3 p-4 rounded-[16px] bg-[#FFFDF9] border border-[#D9CCB8] shadow-[0_1px_2px_rgba(24,22,18,0.04)] flex flex-col justify-between gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-[15px] font-extrabold text-[#29251F]">Occupancy Snapshot</h2>
              <p className="text-xs text-[#665E52]">
                Current month across active rooms
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-[#EAE7E0] text-[#4C473E]">
              {occupancySnapshot.monthLabel}
            </span>
          </div>

          <div className="flex items-center gap-3.5 my-auto py-1">
            <div
              className="w-[88px] h-[88px] rounded-full grid place-items-center shrink-0"
              style={{
                background: `conic-gradient(#263D32 0 ${occupancySnapshot.occupancyPercent}%, #C55B23 ${occupancySnapshot.occupancyPercent}% ${Math.min(
                  100,
                  occupancySnapshot.occupancyPercent + (occupancySnapshot.pendingRequestsCount > 0 ? 12 : 0)
                )}%, #E6DEC9 ${Math.min(
                  100,
                  occupancySnapshot.occupancyPercent + (occupancySnapshot.pendingRequestsCount > 0 ? 12 : 0)
                )}% 100%)`,
              }}
            >
              <div className="w-[64px] h-[64px] rounded-full bg-[#FFFDF9] flex flex-col items-center justify-center leading-none">
                <strong className="text-base font-extrabold text-[#29251F] tabular-nums">
                  {occupancySnapshot.occupancyPercent}%
                </strong>
                <span className="text-[10px] font-bold text-[#665E52] mt-0.5">Booked</span>
              </div>
            </div>

            <div className="flex-1 space-y-1.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#665E52]">Confirmed</span>
                <strong className="text-[#29251F] tabular-nums">
                  {occupancySnapshot.bookedRoomNights} nights
                </strong>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#665E52]">Pending</span>
                <strong className="text-[#C55B23] tabular-nums">
                  {occupancySnapshot.pendingRequestsCount} req.
                </strong>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#665E52]">Available</span>
                <strong className="text-[#29251F] tabular-nums">
                  {availableNightsCount} nights
                </strong>
              </div>
            </div>
          </div>

          <Link
            href="/account/stays/host/calendar"
            className="text-xs font-bold text-[#263D32] hover:text-[#C55B23] transition-colors"
          >
            Manage room availability &rarr;
          </Link>
        </section>
      </div>

      {/* Recent Booking Activity */}
      <section className="p-4 sm:p-5 rounded-[16px] bg-[#FFFDF9] border border-[#D9CCB8] shadow-[0_1px_2px_rgba(24,22,18,0.04)] space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-[15px] font-extrabold text-[#29251F]">
              Recent Booking Activity
            </h2>
            <p className="text-xs text-[#665E52]">
              Review guest details, special requests and take decisions on pending requests.
            </p>
          </div>
          <Link
            href="/account/stays/host/bookings"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[#F5F0E6] hover:bg-[#EFE7D8] border border-[#D9CCB8] text-xs font-bold text-[#29251F] self-start sm:self-auto transition-colors"
          >
            <span>Open all bookings ({scopedBookings.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentBookings.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto border border-[#E5DEC9] rounded-[13px] bg-[#FFFDF9]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F6F1E7] border-b border-[#E5DEC9] text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#665E52]">
                    <th className="py-2.5 px-3">Guest &amp; Reference</th>
                    <th className="py-2.5 px-3">Property &amp; Room</th>
                    <th className="py-2.5 px-3">Dates</th>
                    <th className="py-2.5 px-3">Guests</th>
                    <th className="py-2.5 px-3">Est. Value</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5DEC9] text-[13px]">
                  {recentBookings.map((b) => {
                    const status = getBookingStatus(b);
                    const isPending = status === 'pending';
                    const isConfirmed = status === 'confirmed';
                    const isCompleted = status === 'completed';
                    const nights = getBookingNights(b);
                    const estVal = getBookingEstimatedValue(b);
                    const isLoading = actionLoadingId === b.id;

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
                                  onClick={() => handleQuickDecision(b, 'confirm')}
                                  className="px-2.5 py-1.5 rounded-[9px] bg-[#1F6A3B] hover:bg-[#18542E] text-[#FFFDF9] text-xs font-bold cursor-pointer disabled:opacity-50"
                                >
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  disabled={isLoading}
                                  onClick={() => handleQuickDecision(b, 'decline')}
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

            {/* Mobile Structured Cards (< md) */}
            <div className="md:hidden space-y-2.5">
              {recentBookings.map((b) => {
                const status = getBookingStatus(b);
                const isPending = status === 'pending';
                const isConfirmed = status === 'confirmed';
                const nights = getBookingNights(b);
                const estVal = getBookingEstimatedValue(b);
                const isLoading = actionLoadingId === b.id;

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

                    <div className="flex items-center justify-between text-xs text-[#29251F] pt-1 border-t border-[#E5DEC9]">
                      <span className="tabular-nums">
                        {b.check_in} &rarr; {b.check_out} ({nights}n)
                      </span>
                      <strong className="font-extrabold text-[#263D32] tabular-nums">
                        {formatInrCurrency(estVal)}
                      </strong>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
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
                            onClick={() => handleQuickDecision(b, 'decline')}
                            className="px-3 py-1.5 rounded-[9px] bg-[#FBEAE7] text-[#A53525] border border-[#A53525]/20 text-xs font-bold"
                          >
                            Decline
                          </button>
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleQuickDecision(b, 'confirm')}
                            className="px-3 py-1.5 rounded-[9px] bg-[#1F6A3B] text-[#FFFDF9] text-xs font-bold"
                          >
                            Accept
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="p-8 rounded-[13px] bg-[#F5F0E6]/60 border border-[#E5DEC9] text-center space-y-1.5">
            <Inbox className="w-6 h-6 text-[#665E52] mx-auto" />
            <h3 className="text-sm font-extrabold text-[#29251F]">No booking requests yet</h3>
            <p className="text-xs text-[#665E52]">
              When guests request a stay at your property, their requests will appear here for your approval.
            </p>
          </div>
        )}
      </section>

      {/* 4 Quick Actions Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Link
          href="/account/stays/host/bookings"
          className="p-3.5 rounded-[14px] bg-[#FFFDF9] hover:bg-[#FAF6EE] border border-[#D9CCB8] hover:border-[#263D32] transition-all flex flex-col justify-between gap-2 group"
        >
          <div className="flex items-center justify-between">
            <strong className="text-[13px] font-extrabold text-[#29251F] group-hover:text-[#263D32]">
              Review pending requests
            </strong>
            <Inbox className="w-4 h-4 text-[#C55B23]" />
          </div>
          <span className="text-xs text-[#665E52] leading-relaxed">
            Accept or decline incoming guest requests and add arrival guidance.
          </span>
        </Link>

        <Link
          href="/account/stays/host/calendar"
          className="p-3.5 rounded-[14px] bg-[#FFFDF9] hover:bg-[#FAF6EE] border border-[#D9CCB8] hover:border-[#263D32] transition-all flex flex-col justify-between gap-2 group"
        >
          <div className="flex items-center justify-between">
            <strong className="text-[13px] font-extrabold text-[#29251F] group-hover:text-[#263D32]">
              Block room dates
            </strong>
            <Lock className="w-4 h-4 text-[#263D32]" />
          </div>
          <span className="text-xs text-[#665E52] leading-relaxed">
            Close room units for seasonal weather, maintenance or personal stays.
          </span>
        </Link>

        <Link
          href="/account/stays/host/properties"
          className="p-3.5 rounded-[14px] bg-[#FFFDF9] hover:bg-[#FAF6EE] border border-[#D9CCB8] hover:border-[#263D32] transition-all flex flex-col justify-between gap-2 group"
        >
          <div className="flex items-center justify-between">
            <strong className="text-[13px] font-extrabold text-[#29251F] group-hover:text-[#263D32]">
              Update rooms &amp; rates
            </strong>
            <Home className="w-4 h-4 text-[#263D32]" />
          </div>
          <span className="text-xs text-[#665E52] leading-relaxed">
            Edit nightly room prices, photos, amenities and property descriptions.
          </span>
        </Link>

        <Link
          href="/account/stays/host/reviews"
          className="p-3.5 rounded-[14px] bg-[#FFFDF9] hover:bg-[#FAF6EE] border border-[#D9CCB8] hover:border-[#263D32] transition-all flex flex-col justify-between gap-2 group"
        >
          <div className="flex items-center justify-between">
            <strong className="text-[13px] font-extrabold text-[#29251F] group-hover:text-[#263D32]">
              Read guest reviews
            </strong>
            <Star className="w-4 h-4 text-[#C55B23]" />
          </div>
          <span className="text-xs text-[#665E52] leading-relaxed">
            See verified feedback from guests who stayed at your properties.
          </span>
        </Link>
      </div>

      {/* Booking Detail Modal */}
      <HostBookingDetailModal
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onDecisionSuccess={handleModalDecisionSuccess}
      />
    </div>
  );
}
