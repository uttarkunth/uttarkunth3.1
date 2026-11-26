'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Home,
  Inbox,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  BedDouble,
  Edit3,
  BarChart3,
  Eye,
  Check,
  MoreHorizontal,
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

function getGuestInitials(name: string): string {
  const parts = (name || 'Guest').trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
  }
  return (parts[0]?.slice(0, 2) || 'GU').toUpperCase();
}

function formatDayAndMonth(isoDate: string): { day: string; month: string } {
  if (!isoDate) return { day: '--', month: '---' };
  const d = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return { day: '--', month: '---' };
  return {
    day: String(d.getUTCDate()).padStart(2, '0'),
    month: d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }),
  };
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
  const [activityPeriod, setActivityPeriod] = useState<'7d' | '30d' | '90d'>('30d');
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

  const recentBookings = useMemo(() => scopedBookings.slice(0, 5), [scopedBookings]);

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

  const todayFormatted = useMemo(
    () =>
      new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    []
  );

  const maxBarValue = useMemo(
    () =>
      Math.max(
        4,
        ...activitySeries.map((pt) => Math.max(pt.confirmedCount, pt.totalCount))
      ),
    [activitySeries]
  );

  return (
    <div className="space-y-4" data-testid="host-overview-view">
      {/* Breadcrumb & Page Head matching V2 Prototype */}
      <div>
        <div className="flex items-center gap-2 text-[11px] font-bold text-[#948B7E] mb-3">
          <span>Host workspace</span>
          <span>&rsaquo;</span>
          <span className="text-[#263D32]">Overview</span>
          {selectedProperty && (
            <>
              <span>&rsaquo;</span>
              <span className="text-[#C55B23] font-extrabold">
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

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] font-extrabold text-[#C55B23] mb-1">
              {todayFormatted} · Host workspace
            </div>
            <h1 className="font-serif text-[32px] sm:text-[36px] font-semibold text-[#263D32] leading-[1.04] tracking-tight">
              Your hosting, at a glance.
            </h1>
            <p className="text-xs text-[#71695E] mt-1.5 max-w-2xl">
              A clear view of your properties, guest requests and upcoming stays.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/account/stays/host/calendar"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-[11px] bg-[#FFFDF9] hover:border-[#D9CCB8] text-[#263D32] border border-[#263D32]/12 text-xs font-extrabold transition-all"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Open calendar</span>
            </Link>
            <Link
              href="/account/stays/host/properties"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-[11px] bg-[#263D32] hover:bg-[#1A2B23] text-[#FFFDF9] text-xs font-extrabold shadow-xs transition-all"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Manage properties</span>
            </Link>
          </div>
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

      {/* Direct Host Payment Model Banner */}
      <div className="p-3.5 rounded-[13px] bg-[#EDF4EE] border border-[#D5E6D8] text-[#315D42] flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-[#367B4F] shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <strong className="block font-extrabold text-[#315D42] mb-0.5">
            Direct host payment model
          </strong>
          <p className="text-[11px] text-[#4D7259]">
            Guests pay you directly at your property. Uttarkunth does not collect online payments. Figures below show booking estimates, not money received or platform-held payouts.
          </p>
        </div>
      </div>

      {/* Bilateral Host Agreements */}
      {agreements && agreements.length > 0 && <AgreementAcceptor agreements={agreements} />}

      {/* Pending Requests Alert Note */}
      {kpis.pendingRequestsCount > 0 && (
        <div
          data-testid="host-pending-alert-banner"
          className="p-3.5 rounded-[13px] bg-[#FBF1DE] border border-[#EEDDB8] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-[10px] bg-[#F5E4C1] text-[#94621E] flex items-center justify-center shrink-0">
              <Inbox className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <strong className="block text-xs font-extrabold text-[#76501C]">
                {kpis.pendingRequestsCount} booking{' '}
                {kpis.pendingRequestsCount === 1 ? 'request needs' : 'requests need'} your attention
              </strong>
              <span className="block text-[11px] text-[#8D6B3B]">
                Review guest details and dates. Pending requests do not block room availability until you confirm them.
              </span>
            </div>
          </div>

          <Link
            href="/account/stays/host/bookings"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[9px] bg-[#FFF9ED] hover:bg-[#F5E4C1] border border-[#E8D6B1] text-[#855D25] text-xs font-extrabold shrink-0 transition-colors"
          >
            <span>Review requests</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 4 KPI Cards with Icon Badges matching V2 Prototype */}
      <div
        data-testid="host-overview-kpi-grid"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <article className="p-4 rounded-[18px] bg-[#FFFDF9] border border-[#263D32]/12 shadow-[0_10px_28px_rgba(38,61,50,0.055)] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold text-[#71695E]">Active properties</span>
            <span className="w-7 h-7 rounded-[9px] bg-[#EBF0ED] text-[#263D32] flex items-center justify-center">
              <Home className="w-4 h-4" />
            </span>
          </div>
          <div className="text-[26px] font-extrabold text-[#263D32] tracking-tight tabular-nums leading-none my-2.5">
            {String(kpis.activePropertiesCount).padStart(2, '0')}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-[#948B7E] flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EAF4ED] text-[#28734D] font-extrabold">
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              Published
            </span>
            <span>· {kpis.totalRoomUnitsCount} room units</span>
          </div>
        </article>

        <article className="p-4 rounded-[18px] bg-[#FFFDF9] border border-[#263D32]/12 shadow-[0_10px_28px_rgba(38,61,50,0.055)] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold text-[#71695E]">Pending requests</span>
            <span className="w-7 h-7 rounded-[9px] bg-[#FDF1E9] text-[#C55B23] flex items-center justify-center">
              <Inbox className="w-4 h-4" />
            </span>
          </div>
          <div className="text-[26px] font-extrabold text-[#263D32] tracking-tight tabular-nums leading-none my-2.5">
            {String(kpis.pendingRequestsCount).padStart(2, '0')}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-[#948B7E]">
            <span className="font-extrabold text-[#28734D]">
              {kpis.pendingRequestsCount > 0 ? 'Needs review' : 'Up to date'}
            </span>
            <span>· dates open</span>
          </div>
        </article>

        <article className="p-4 rounded-[18px] bg-[#FFFDF9] border border-[#263D32]/12 shadow-[0_10px_28px_rgba(38,61,50,0.055)] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold text-[#71695E]">Confirmed stays</span>
            <span className="w-7 h-7 rounded-[9px] bg-[#EAF1F6] text-[#426B8C] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="text-[26px] font-extrabold text-[#263D32] tracking-tight tabular-nums leading-none my-2.5">
            {String(kpis.confirmedStaysCount).padStart(2, '0')}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-[#948B7E]">
            <span className="font-extrabold text-[#28734D]">
              {kpis.upcomingArrivalsCount} upcoming
            </span>
            <span>confirmed stays</span>
          </div>
        </article>

        <article className="p-4 rounded-[18px] bg-[#FFFDF9] border border-[#263D32]/12 shadow-[0_10px_28px_rgba(38,61,50,0.055)] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold text-[#71695E]">Room nights booked</span>
            <span className="w-7 h-7 rounded-[9px] bg-[#FBF1DE] text-[#94621E] flex items-center justify-center">
              <BedDouble className="w-4 h-4" />
            </span>
          </div>
          <div className="text-[26px] font-extrabold text-[#263D32] tracking-tight tabular-nums leading-none my-2.5">
            {String(kpis.bookedRoomNights).padStart(2, '0')}
          </div>
          <div className="text-[10px] text-[#948B7E]">
            Est. {formatInrCurrency(kpis.estimatedConfirmedValue)} direct-to-host
          </div>
        </article>
      </div>

      {/* Dashboard Grid: Booking Activity Chart + Side Stack (Stay Schedule & Occupancy Snapshot) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Booking Activity Chart Panel */}
        <section className="lg:col-span-7 xl:col-span-8 p-4 sm:p-5 rounded-[18px] bg-[#FFFDF9] border border-[#263D32]/12 shadow-[0_10px_28px_rgba(38,61,50,0.055)] flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
            <div>
              <h2 className="text-sm font-extrabold text-[#263D32]">Booking activity</h2>
              <p className="text-[11px] text-[#948B7E]">
                Requests received and stays confirmed over time
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-3 text-[11px] font-bold text-[#71695E]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-[2px] bg-[#263D32]" />
                  Confirmed
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-[2px] bg-[#D8B39A]" />
                  Requests
                </span>
              </div>

              <div
                className="inline-flex p-0.5 rounded-[9px] bg-[#F3F0EA] border border-[#ECE5D9]"
                role="group"
                aria-label="Chart period"
              >
                {(['7d', '30d', '90d'] as const).map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setActivityPeriod(period)}
                    className={`px-2.5 py-1 rounded-[6px] text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                      activityPeriod === period
                        ? 'bg-[#FFFDF9] text-[#263D32] shadow-2xs'
                        : 'text-[#71695E] hover:text-[#263D32]'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dual-Bar Chart Area with Dashed Grid Lines */}
          <div className="relative h-[180px] pt-2">
            <div className="absolute inset-x-0 top-2 bottom-6 flex flex-col justify-between pointer-events-none">
              {[
                maxBarValue,
                Math.round(maxBarValue * 0.75),
                Math.round(maxBarValue * 0.5),
                Math.round(maxBarValue * 0.25),
                0,
              ].map((tick, idx) => (
                <div
                  key={idx}
                  className="border-t border-dashed border-[#263D32]/10 h-px relative"
                >
                  <span className="absolute left-0 -top-2 text-[9px] text-[#A29A8D] bg-[#FFFDF9] pr-1.5 tabular-nums">
                    {tick}
                  </span>
                </div>
              ))}
            </div>

            <div className="relative z-10 h-full flex items-end justify-around gap-2 pl-7 pr-2 pb-6">
              {activitySeries.map((pt, idx) => {
                const confirmedHeight =
                  pt.confirmedCount === 0
                    ? 6
                    : Math.max(14, Math.round((pt.confirmedCount / maxBarValue) * 100));
                const requestsHeight =
                  pt.totalCount === 0
                    ? 6
                    : Math.max(14, Math.round((pt.totalCount / maxBarValue) * 100));

                return (
                  <div
                    key={`${pt.label}-${idx}`}
                    className="h-full flex-1 max-w-[52px] flex flex-col items-center justify-end relative"
                  >
                    <div className="w-full h-[calc(100%-10px)] flex items-end justify-center gap-1">
                      <div
                        style={{ height: `${confirmedHeight}%` }}
                        title={`${pt.confirmedCount} confirmed nights`}
                        className="w-3 sm:w-3.5 rounded-t-[4px] bg-[#263D32] transition-all duration-300"
                      />
                      <div
                        style={{ height: `${requestsHeight}%` }}
                        title={`${pt.totalCount} total requested nights`}
                        className="w-3 sm:w-3.5 rounded-t-[4px] bg-[#D8B39A] transition-all duration-300"
                      />
                    </div>
                    <span className="absolute -bottom-0.5 text-[10px] font-bold text-[#948B7E] whitespace-nowrap">
                      {pt.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2 pt-3 mt-2 border-t border-[#263D32]/12 text-[10px] text-[#948B7E]">
            <span>
              Live database records ·{' '}
              <strong className="text-[#263D32]">
                {activityPeriod === '7d'
                  ? 'Last 7 days'
                  : activityPeriod === '30d'
                  ? 'Last 30 days'
                  : 'Last 90 days'}
              </strong>
            </span>
            <span>Bookings are requests, not online transactions</span>
          </div>
        </section>

        {/* Side Stack: Stay Schedule + Occupancy Snapshot */}
        <div className="lg:col-span-5 xl:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3.5">
          {/* Stay Schedule */}
          <section className="p-4 sm:p-5 rounded-[18px] bg-[#FFFDF9] border border-[#263D32]/12 shadow-[0_10px_28px_rgba(38,61,50,0.055)] flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-extrabold text-[#263D32]">Stay schedule</h2>
                <p className="text-[11px] text-[#948B7E]">In-house and next confirmed stays</p>
              </div>
              <Link
                href="/account/stays/host/bookings"
                className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#C55B23] hover:text-[#263D32] shrink-0"
              >
                <span>All bookings</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {staySchedule.length > 0 ? (
              <div className="space-y-2.5 my-auto">
                {staySchedule.slice(0, 3).map((item) => {
                  const dm = formatDayAndMonth(item.checkIn);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedBooking(item.booking)}
                      className="w-full text-left grid grid-cols-[38px_minmax(0,1fr)_auto] items-center gap-2.5 p-1.5 rounded-xl hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                    >
                      <div className="w-[38px] h-[41px] rounded-[9px] bg-[#F1EEE8] text-[#263D32] flex flex-col items-center justify-center leading-none">
                        <strong className="text-xs font-extrabold tabular-nums">
                          {dm.day}
                        </strong>
                        <span className="text-[8px] font-extrabold uppercase tracking-wider mt-0.5">
                          {dm.month}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-[#29251F] truncate">
                          {item.guestName}
                        </div>
                        <div className="text-[10px] text-[#948B7E] truncate">
                          {item.propertyTitle} · {item.nights}{' '}
                          {item.nights === 1 ? 'night' : 'nights'}
                        </div>
                      </div>
                      <div className="text-right">
                        {item.scheduleType === 'in_house' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#EAF1F6] text-[#426B8C]">
                            In-house
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-[#71695E]">
                            {item.guestsCount} {item.guestsCount === 1 ? 'guest' : 'guests'}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#FAF7F2] text-center my-auto space-y-1">
                <Clock className="w-4 h-4 text-[#948B7E] mx-auto" />
                <p className="text-xs font-bold text-[#263D32]">No upcoming confirmed stays</p>
                <p className="text-[10px] text-[#948B7E]">
                  Confirmed arrivals will appear here automatically.
                </p>
              </div>
            )}
          </section>

          {/* Occupancy Snapshot */}
          <section className="p-4 sm:p-5 rounded-[18px] bg-[#FFFDF9] border border-[#263D32]/12 shadow-[0_10px_28px_rgba(38,61,50,0.055)] flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-extrabold text-[#263D32]">Occupancy snapshot</h2>
                <p className="text-[11px] text-[#948B7E]">
                  {occupancySnapshot.monthLabel} · active rooms
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#EAF4ED] text-[#28734D]">
                Live status
              </span>
            </div>

            <div className="flex items-center gap-3.5 my-auto">
              <div
                className="w-[78px] h-[78px] rounded-full grid place-items-center shrink-0"
                style={{
                  background: `conic-gradient(#263D32 0 ${occupancySnapshot.occupancyPercent}%, #EAE4D9 ${occupancySnapshot.occupancyPercent}% 100%)`,
                }}
              >
                <div className="w-[62px] h-[62px] rounded-full bg-[#FFFDF9] flex flex-col items-center justify-center leading-none">
                  <strong className="text-base font-extrabold text-[#263D32] tabular-nums">
                    {occupancySnapshot.occupancyPercent}%
                  </strong>
                  <small className="text-[9px] font-bold text-[#948B7E] mt-0.5">
                    occupied
                  </small>
                </div>
              </div>

              <div className="flex-1 space-y-1.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[#71695E]">
                    <span className="w-2 h-2 rounded-[2px] bg-[#263D32]" />
                    Booked nights
                  </span>
                  <strong className="text-[#263D32] font-extrabold tabular-nums">
                    {occupancySnapshot.bookedRoomNights}
                  </strong>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[#71695E]">
                    <span className="w-2 h-2 rounded-[2px] bg-[#EAE4D9]" />
                    Available nights
                  </span>
                  <strong className="text-[#263D32] font-extrabold tabular-nums">
                    {availableNightsCount}
                  </strong>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#71695E]">Pending requests</span>
                  <strong className="text-[#C55B23] font-extrabold tabular-nums">
                    {occupancySnapshot.pendingRequestsCount}
                  </strong>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Recent Booking Activity Table (Desktop) & Structured Cards (Mobile) */}
      <section className="rounded-[18px] bg-[#FFFDF9] border border-[#263D32]/12 shadow-[0_10px_28px_rgba(38,61,50,0.055)] overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-extrabold text-[#263D32]">Recent booking activity</h2>
            <p className="text-[11px] text-[#948B7E]">
              Keep track of requests that need action and confirmed stays
            </p>
          </div>
          <Link
            href="/account/stays/host/bookings"
            className="inline-flex items-center gap-1 text-xs font-extrabold text-[#C55B23] hover:text-[#263D32]"
          >
            <span>Manage all bookings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentBookings.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8F5EF] border-y border-[#263D32]/12 text-[10px] font-extrabold uppercase tracking-wider text-[#8B8378]">
                    <th className="py-2.5 px-4">Guest</th>
                    <th className="py-2.5 px-4">Property / Room</th>
                    <th className="py-2.5 px-4">Stay dates</th>
                    <th className="py-2.5 px-4">Guests</th>
                    <th className="py-2.5 px-4">Booking value</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#263D32]/8 text-xs">
                  {recentBookings.map((b) => {
                    const status = getBookingStatus(b);
                    const isPending = status === 'pending';
                    const isConfirmed = status === 'confirmed';
                    const isCompleted = status === 'completed';
                    const estVal = getBookingEstimatedValue(b);
                    const isLoading = actionLoadingId === b.id;

                    return (
                      <tr key={b.id} className="hover:bg-[#FCFAF6] transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-full bg-[#E9E1D5] text-[#263D32] text-[10px] font-extrabold flex items-center justify-center shrink-0">
                              {getGuestInitials(b.guest_name)}
                            </span>
                            <div>
                              <strong className="block font-extrabold text-[#29251F]">
                                {b.guest_name}
                              </strong>
                              <span className="text-[10px] font-mono font-bold text-[#948B7E]">
                                {formatBookingReference(b)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <strong className="block font-extrabold text-[#29251F]">
                            {getBookingPropertyTitle(b)}
                          </strong>
                          <span className="text-[11px] text-[#948B7E]">
                            {getBookingRoomName(b)}
                          </span>
                        </td>
                        <td className="py-3 px-4 tabular-nums">
                          <strong className="block font-extrabold text-[#29251F]">
                            {b.check_in}
                          </strong>
                          <span className="text-[11px] text-[#948B7E]">to {b.check_out}</span>
                        </td>
                        <td className="py-3 px-4 text-[#71695E]">
                          {getBookingGuestCount(b)} guests
                        </td>
                        <td className="py-3 px-4 font-extrabold text-[#263D32] tabular-nums">
                          {formatInrCurrency(estVal)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold whitespace-nowrap ${
                              isConfirmed
                                ? 'bg-[#EAF4ED] text-[#28734D]'
                                : isPending
                                ? 'bg-[#FBF1DE] text-[#94621E]'
                                : isCompleted
                                ? 'bg-[#EAF1F6] text-[#426B8C]'
                                : 'bg-[#F9ECE9] text-[#A8483E]'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {isPending
                              ? 'Pending'
                              : isConfirmed
                              ? 'Confirmed'
                              : isCompleted
                              ? 'Completed'
                              : 'Declined'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedBooking(b)}
                              aria-label={`View ${formatBookingReference(b)}`}
                              className="w-7 h-7 rounded-[8px] border border-[#263D32]/12 bg-[#FFFDF9] hover:border-[#D9CCB8] text-[#71695E] hover:text-[#263D32] flex items-center justify-center cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {isPending && (
                              <button
                                type="button"
                                disabled={isLoading}
                                onClick={() => handleQuickDecision(b, 'confirm')}
                                aria-label={`Confirm ${formatBookingReference(b)}`}
                                title="Accept & confirm request"
                                className="w-7 h-7 rounded-[8px] border border-[#263D32]/12 bg-[#FFFDF9] hover:bg-[#EAF4ED] text-[#28734D] flex items-center justify-center cursor-pointer disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedBooking(b)}
                              aria-label={`More details ${formatBookingReference(b)}`}
                              className="w-7 h-7 rounded-[8px] border border-[#263D32]/12 bg-[#FFFDF9] hover:border-[#D9CCB8] text-[#71695E] hover:text-[#263D32] flex items-center justify-center cursor-pointer"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Booking Cards */}
            <div className="md:hidden p-3.5 pt-0 space-y-2.5">
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
                    className="p-3.5 rounded-[13px] bg-[#FAF7F2] border border-[#263D32]/12 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-full bg-[#E9E1D5] text-[#263D32] text-xs font-extrabold flex items-center justify-center shrink-0">
                          {getGuestInitials(b.guest_name)}
                        </span>
                        <div>
                          <h3 className="text-xs font-extrabold text-[#29251F]">
                            {b.guest_name}
                          </h3>
                          <span className="text-[10px] font-mono font-bold text-[#948B7E]">
                            {formatBookingReference(b)} · {getBookingPropertyTitle(b)}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isConfirmed
                            ? 'bg-[#EAF4ED] text-[#28734D]'
                            : isPending
                            ? 'bg-[#FBF1DE] text-[#94621E]'
                            : 'bg-[#F9ECE9] text-[#A8483E]'
                        }`}
                      >
                        {isPending ? 'Pending' : isConfirmed ? 'Confirmed' : status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#29251F] pt-2 border-t border-[#263D32]/10">
                      <span className="tabular-nums text-[11px] text-[#71695E]">
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
                        className="px-3 py-1.5 rounded-[9px] bg-[#FFFDF9] border border-[#263D32]/15 text-xs font-bold text-[#263D32]"
                      >
                        Details
                      </button>
                      {isPending && (
                        <>
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleQuickDecision(b, 'decline')}
                            className="px-3 py-1.5 rounded-[9px] bg-[#F9ECE9] text-[#A8483E] text-xs font-bold"
                          >
                            Decline
                          </button>
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleQuickDecision(b, 'confirm')}
                            className="px-3 py-1.5 rounded-[9px] bg-[#263D32] text-[#FFFDF9] text-xs font-bold"
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
          <div className="p-8 text-center space-y-1.5 border-t border-[#263D32]/10">
            <Inbox className="w-6 h-6 text-[#948B7E] mx-auto" />
            <h3 className="text-sm font-extrabold text-[#263D32]">No booking activity yet</h3>
            <p className="text-xs text-[#71695E]">
              Incoming guest requests and confirmed reservations will appear here.
            </p>
          </div>
        )}

        <div className="px-4 py-3 border-t border-[#263D32]/10 bg-[#FAF7F2] flex items-center justify-between text-[11px] text-[#948B7E]">
          <span>Showing recent booking activity ({recentBookings.length})</span>
          <span>
            Direct host settlement · <strong className="text-[#263D32]">Pay at property</strong>
          </span>
        </div>
      </section>

      {/* 4 Quick Action Buttons matching V2 Prototype */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <Link
          href="/account/stays/host/bookings"
          className="p-3 rounded-[13px] bg-[#FFFDF9] hover:border-[#D9CCB8] border border-[#263D32]/12 transition-all flex items-center gap-2.5"
        >
          <span className="w-8 h-8 rounded-[9px] bg-[#EBF0ED] text-[#263D32] flex items-center justify-center shrink-0">
            <Inbox className="w-4 h-4" />
          </span>
          <span className="min-w-0">
            <strong className="block text-xs font-extrabold text-[#263D32] truncate">
              Review requests
            </strong>
            <span className="hidden sm:block text-[10px] text-[#948B7E] truncate">
              Respond to new guests
            </span>
          </span>
        </Link>

        <Link
          href="/account/stays/host/calendar"
          className="p-3 rounded-[13px] bg-[#FFFDF9] hover:border-[#D9CCB8] border border-[#263D32]/12 transition-all flex items-center gap-2.5"
        >
          <span className="w-8 h-8 rounded-[9px] bg-[#EBF0ED] text-[#263D32] flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </span>
          <span className="min-w-0">
            <strong className="block text-xs font-extrabold text-[#263D32] truncate">
              Block room dates
            </strong>
            <span className="hidden sm:block text-[10px] text-[#948B7E] truncate">
              Close dates for private use
            </span>
          </span>
        </Link>

        <Link
          href="/account/stays/host/properties"
          className="p-3 rounded-[13px] bg-[#FFFDF9] hover:border-[#D9CCB8] border border-[#263D32]/12 transition-all flex items-center gap-2.5"
        >
          <span className="w-8 h-8 rounded-[9px] bg-[#EBF0ED] text-[#263D32] flex items-center justify-center shrink-0">
            <Edit3 className="w-4 h-4" />
          </span>
          <span className="min-w-0">
            <strong className="block text-xs font-extrabold text-[#263D32] truncate">
              Update listing
            </strong>
            <span className="hidden sm:block text-[10px] text-[#948B7E] truncate">
              Photos, amenities and rates
            </span>
          </span>
        </Link>

        <Link
          href="/account/stays/host/performance"
          className="p-3 rounded-[13px] bg-[#FFFDF9] hover:border-[#D9CCB8] border border-[#263D32]/12 transition-all flex items-center gap-2.5"
        >
          <span className="w-8 h-8 rounded-[9px] bg-[#EBF0ED] text-[#263D32] flex items-center justify-center shrink-0">
            <BarChart3 className="w-4 h-4" />
          </span>
          <span className="min-w-0">
            <strong className="block text-xs font-extrabold text-[#263D32] truncate">
              View performance
            </strong>
            <span className="hidden sm:block text-[10px] text-[#948B7E] truncate">
              Understand booking trends
            </span>
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
