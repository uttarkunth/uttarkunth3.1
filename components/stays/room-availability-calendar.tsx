'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  BedDouble,
  RotateCcw,
} from 'lucide-react';
import {
  buildCalendarMonthGrid,
  evaluateCalendarDayState,
  handleCalendarDateClick,
  formatStayDateRangeSummary,
  formatShortStayDate,
  formatUnavailableDateMessage,
  findRoomOccupancyConflict,
  CalendarDayVisualState,
} from '@/lib/stays-search';
import { formatINR } from '@/lib/utils';

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const ROOM_AVAILABILITY_DATES_EVENT = 'uttarkunth:room-dates-selected';

export interface RoomAvailabilityDatesPayload {
  roomId: string;
  checkIn: string;
  checkOut: string;
  conflictMessage?: string | null;
}

export interface RoomOption {
  id: string;
  room_name: string;
  base_price: number;
  max_guests?: number;
  attached_washroom?: boolean;
  view_type?: string;
  bed_type?: string;
}

interface OccupancyBlock {
  room_unit_id: string;
  start_date: string;
  end_date: string;
  kind: 'booking' | 'block' | 'booked' | 'blocked';
}

export interface RoomAvailabilityCalendarProps {
  propertyId: string;
  propertyName: string;
  rooms: RoomOption[];
  initialCheckIn?: string;
  initialCheckOut?: string;
  singleMonth?: boolean;
}

export function RoomAvailabilityCalendar({
  propertyId,
  propertyName,
  rooms,
  initialCheckIn = '',
  initialCheckOut = '',
  singleMonth = false,
}: RoomAvailabilityCalendarProps) {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [selectedRoomId, setSelectedRoomId] = useState<string>(
    rooms.length > 1 ? 'all' : rooms[0]?.id || 'all'
  );
  const [checkIn, setCheckIn] = useState<string>(initialCheckIn);
  const [checkOut, setCheckOut] = useState<string>(initialCheckOut);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [invalidTooltip, setInvalidTooltip] = useState<{
    dateStr: string;
    message: string;
  } | null>(null);

  const initialBaseDate = useMemo(() => {
    const source = initialCheckIn || todayStr;
    const parts = source.split('-').map(Number);
    if (parts.length === 3 && !parts.some((n) => Number.isNaN(n))) {
      return { year: parts[0], month: parts[1] - 1 };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }, [initialCheckIn, todayStr]);

  const [viewYear, setViewYear] = useState<number>(initialBaseDate.year);
  const [viewMonth, setViewMonth] = useState<number>(initialBaseDate.month);
  const [occupancy, setOccupancy] = useState<OccupancyBlock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const todayParts = useMemo(() => {
    const parts = todayStr.split('-').map(Number);
    return {
      year: parts[0] || new Date().getFullYear(),
      month: (parts[1] || 1) - 1,
    };
  }, [todayStr]);

  const isAtMinMonth =
    viewYear < todayParts.year ||
    (viewYear === todayParts.year && viewMonth <= todayParts.month);

  const secondMonthMeta = useMemo(() => {
    if (viewMonth === 11) {
      return { year: viewYear + 1, month: 0 };
    }
    return { year: viewYear, month: viewMonth + 1 };
  }, [viewYear, viewMonth]);

  const monthsToRender = useMemo(() => {
    if (singleMonth) {
      return [{ year: viewYear, month: viewMonth }];
    }
    return [
      { year: viewYear, month: viewMonth },
      { year: secondMonthMeta.year, month: secondMonthMeta.month },
    ];
  }, [singleMonth, viewYear, viewMonth, secondMonthMeta]);

  useEffect(() => {
    async function fetchOccupancy() {
      setLoading(true);
      try {
        const fromStr = new Date(Date.UTC(viewYear, viewMonth - 2, 1))
          .toISOString()
          .split('T')[0];
        const toStr = new Date(Date.UTC(viewYear, viewMonth + 6, 0))
          .toISOString()
          .split('T')[0];
        const res = await fetch(
          `/api/stays/${propertyId}/occupancy?from=${fromStr}&to=${toStr}`
        );
        const data = await res.json();
        if (data.ok && Array.isArray(data.occupancy)) {
          setOccupancy(data.occupancy);
        }
      } catch (err) {
        console.error('Failed to load occupancy:', err);
      } finally {
        setLoading(false);
      }
    }

    if (propertyId) {
      fetchOccupancy();
    }
  }, [propertyId, viewYear, viewMonth]);

  useEffect(() => {
    function handleWidgetDatesChanged(event: Event) {
      const custom = event as CustomEvent<{
        checkIn?: string;
        checkOut?: string;
        conflictDateStr?: string | null;
        conflictMessage?: string | null;
      }>;
      if (!custom.detail) return;
      if (typeof custom.detail.checkIn === 'string') {
        setCheckIn(custom.detail.checkIn);
      }
      if (typeof custom.detail.checkOut === 'string') {
        setCheckOut(custom.detail.checkOut);
      }
      if (custom.detail.conflictMessage) {
        setInvalidTooltip({
          dateStr: custom.detail.conflictDateStr || custom.detail.checkIn || '',
          message: custom.detail.conflictMessage,
        });
      } else {
        setInvalidTooltip(null);
      }
    }

    window.addEventListener(
      'uttarkunth:booking-widget-dates-changed',
      handleWidgetDatesChanged
    );
    return () => {
      window.removeEventListener(
        'uttarkunth:booking-widget-dates-changed',
        handleWidgetDatesChanged
      );
    };
  }, []);

  const activeRoom = useMemo(
    () =>
      selectedRoomId === 'all'
        ? rooms[0]
        : rooms.find((r) => r.id === selectedRoomId) || rooms[0],
    [rooms, selectedRoomId]
  );

  const broadcastSelection = useCallback(
    (
      nextRoomId: string,
      nextCheckIn: string,
      nextCheckOut: string,
      conflictMessage: string | null = null
    ) => {
      if (typeof window === 'undefined') return;
      const payload: RoomAvailabilityDatesPayload = {
        roomId: nextRoomId === 'all' ? rooms[0]?.id || '' : nextRoomId,
        checkIn: nextCheckIn,
        checkOut: nextCheckOut,
        conflictMessage,
      };
      window.dispatchEvent(
        new CustomEvent(ROOM_AVAILABILITY_DATES_EVENT, { detail: payload })
      );
    },
    [rooms]
  );

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    if (checkIn) {
      const conflict = findRoomOccupancyConflict({
        checkIn,
        checkOut,
        occupancy,
        roomUnitId: roomId,
      });
      if (conflict) {
        setInvalidTooltip({
          dateStr: conflict.conflictDateStr,
          message: conflict.message,
        });
        broadcastSelection(roomId, checkIn, checkOut, conflict.message);
        return;
      }
    }
    setInvalidTooltip(null);
    broadcastSelection(roomId, checkIn, checkOut, null);
  };

  const handlePrevMonth = () => {
    if (isAtMinMonth) return;
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const getDateOccupancyStatus = useCallback(
    (
      dateStr: string
    ): { status: 'available' | 'booked' | 'blocked'; kind?: string } => {
      const match = occupancy.find((o) => {
        if (
          selectedRoomId &&
          selectedRoomId !== 'all' &&
          o.room_unit_id !== selectedRoomId
        ) {
          return false;
        }
        return dateStr >= o.start_date && dateStr < o.end_date;
      });

      if (match) {
        const isConfirmedBooking =
          match.kind === 'booking' || match.kind === 'booked';
        return {
          status: isConfirmedBooking ? 'booked' : 'blocked',
          kind: match.kind,
        };
      }

      return { status: 'available' };
    },
    [occupancy, selectedRoomId]
  );

  const dateSummary = useMemo(
    () => formatStayDateRangeSummary(checkIn, checkOut),
    [checkIn, checkOut]
  );

  const onDayClick = (dateStr: string) => {
    const occ = getDateOccupancyStatus(dateStr);

    // 1. Direct click on a booked or host-blocked date
    if (occ.status !== 'available') {
      const message = formatUnavailableDateMessage(dateStr, occ.status);
      setInvalidTooltip({
        dateStr,
        message,
      });
      broadcastSelection(selectedRoomId, checkIn, checkOut, message);
      return;
    }

    const outcome = handleCalendarDateClick(dateStr, todayStr, checkIn, checkOut);
    if (outcome.errorMessage && outcome.invalidDateClicked) {
      setInvalidTooltip({
        dateStr: outcome.invalidDateClicked,
        message: outcome.errorMessage,
      });
      return;
    }

    // 2. If completing a range [checkIn, checkOut), check if any booked/blocked night sits inside the range
    if (outcome.checkIn && outcome.checkOut) {
      const conflict = findRoomOccupancyConflict({
        checkIn: outcome.checkIn,
        checkOut: outcome.checkOut,
        occupancy,
        roomUnitId: selectedRoomId,
      });
      if (conflict) {
        setInvalidTooltip({
          dateStr: conflict.conflictDateStr,
          message: conflict.message,
        });
        broadcastSelection(selectedRoomId, checkIn, checkOut, conflict.message);
        return;
      }
    }

    setInvalidTooltip(null);
    setHoverDate(null);
    setCheckIn(outcome.checkIn);
    setCheckOut(outcome.checkOut);
    broadcastSelection(selectedRoomId, outcome.checkIn, outcome.checkOut, null);
  };

  const handleResetDates = () => {
    setInvalidTooltip(null);
    setHoverDate(null);
    setCheckIn('');
    setCheckOut('');
    broadcastSelection(selectedRoomId, '', '');
  };

  const hasContinuousRange = Boolean(
    (checkIn && checkOut) ||
      (checkIn && !checkOut && hoverDate && hoverDate !== checkIn && hoverDate >= todayStr)
  );

  const estimatedRoomTotal =
    activeRoom && dateSummary.occupiedNights > 0
      ? Number(activeRoom.base_price || 0) * dateSummary.occupiedNights
      : null;

  return (
    <div
      data-testid="live-room-availability-calendar"
      className="bg-[#FFFDF9] rounded-[24px] p-5 sm:p-7 border border-[#D9CCB8] shadow-soft space-y-5 select-none"
      onMouseLeave={() => setHoverDate(null)}
    >
      {/* 1. Header & Availability Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D9CCB8]/80">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[#C55B23]" />
            <span className="font-sans text-xs font-bold uppercase tracking-[0.12em] text-[#C55B23]">
              Live Room Availability Calendar
            </span>
          </div>
          <h2 className="font-serif text-2xl sm:text-[26px] font-semibold text-[#263D32] mt-1">
            Check Room Occupancy &amp; Select Dates
          </h2>
          <p className="font-sans text-xs text-[#5C5549] mt-0.5">
            Tap any available dates below to preview stay nights for{' '}
            <strong className="text-[#29251F]">{propertyName}</strong> and sync directly with your booking request.
          </p>
        </div>

        {/* Status Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-sans font-semibold text-[#29251F] bg-[#F5F0E6]/80 px-3.5 py-2 rounded-xl border border-[#D9CCB8]">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#263D32]" />
            <span>Selected</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E3ECE6] border border-[#263D32]/40" />
            <span>Available</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-[#8F281E]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C94A3E]" />
            <span>Booked</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-[#8A4215]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D9822B]" />
            <span>Host Block</span>
          </span>
        </div>
      </div>

      {/* 2. Room Unit Selector Tabs */}
      {rooms.length > 1 && (
        <div className="space-y-2">
          <span className="font-sans text-xs font-semibold text-[#5C5549] block">
            Select Room Unit to View Schedule:
          </span>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              suppressHydrationWarning
              type="button"
              data-testid="room-availability-tab-all"
              onClick={() => handleSelectRoom('all')}
              className={`font-sans min-h-[44px] px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap inline-flex items-center gap-2 border cursor-pointer ${
                selectedRoomId === 'all'
                  ? 'bg-[#263D32] text-[#FFFDF9] border-[#263D32] shadow-xs animate-uk-pill-pop'
                  : 'bg-[#FFFDF9] text-[#29251F] border-[#D9CCB8] hover:border-[#263D32]/60 hover:bg-[#F5F0E6]'
              }`}
            >
              <BedDouble
                className={`w-3.5 h-3.5 ${
                  selectedRoomId === 'all' ? 'text-[#FDE2A8]' : 'text-[#C55B23]'
                }`}
              />
              <span>All Rooms</span>
            </button>
            {rooms.map((room) => {
              const isSelected = room.id === selectedRoomId;
              return (
                <button
                  suppressHydrationWarning
                  type="button"
                  key={room.id}
                  data-testid={`room-availability-tab-${room.id}`}
                  onClick={() => handleSelectRoom(room.id)}
                  className={`font-sans min-h-[44px] px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap inline-flex items-center gap-2 border cursor-pointer ${
                    isSelected
                      ? 'bg-[#263D32] text-[#FFFDF9] border-[#263D32] shadow-xs animate-uk-pill-pop'
                      : 'bg-[#FFFDF9] text-[#29251F] border-[#D9CCB8] hover:border-[#263D32]/60 hover:bg-[#F5F0E6]'
                  }`}
                >
                  <BedDouble
                    className={`w-3.5 h-3.5 ${
                      isSelected ? 'text-[#FDE2A8]' : 'text-[#C55B23]'
                    }`}
                  />
                  <span>{room.room_name}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold tabular-nums ${
                      isSelected
                        ? 'bg-[#FFFDF9]/20 text-[#FFFDF9]'
                        : 'bg-[#F5F0E6] text-[#263D32] border border-[#D9CCB8]'
                    }`}
                  >
                    {formatINR(Number(room.base_price))}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Active Room Summary Pill Bar */}
      {activeRoom && (
        <div className="p-3.5 bg-[#F5F0E6]/75 rounded-2xl border border-[#D9CCB8] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <strong className="text-[#263D32] font-serif text-base">
              {selectedRoomId === 'all'
                ? `${propertyName} — All Rooms Schedule`
                : activeRoom.room_name}
            </strong>
            {selectedRoomId !== 'all' && activeRoom.attached_washroom !== undefined && (
              <span
                className={`font-sans px-2.5 py-0.5 text-[10.5px] font-semibold rounded-md border ${
                  activeRoom.attached_washroom
                    ? 'bg-[#E3ECE6] text-[#263D32] border-[#263D32]/20'
                    : 'bg-[#FFFDF9] text-[#5C5549] border-[#D9CCB8]'
                }`}
              >
                {activeRoom.attached_washroom ? 'Attached Washroom' : 'Shared Washroom'}
              </span>
            )}
            {selectedRoomId !== 'all' &&
              activeRoom.view_type &&
              activeRoom.view_type !== 'none' && (
                <span className="font-sans px-2.5 py-0.5 text-[10.5px] font-semibold bg-[#263D32]/10 text-[#263D32] border border-[#263D32]/20 rounded-md capitalize">
                  {activeRoom.view_type} View
                </span>
              )}
            {loading && (
              <span className="font-sans text-[10.5px] text-[#5C5549] animate-pulse">
                Syncing live schedule…
              </span>
            )}
          </div>
          <div className="font-sans text-[#263D32] font-bold tabular-nums">
            {formatINR(Number(activeRoom.base_price))}{' '}
            <span className="text-[#5C5549] font-normal text-[11px]">/ night</span>
          </div>
        </div>
      )}

      {/* 4. Top Check-in / Check-out & Nights Summary Bar (Matches Search Calendar Design) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-[#D9CCB8]/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F5F0E6] border border-[#D9CCB8] flex items-center justify-center shrink-0">
            <CalendarIcon className="w-4 h-4 text-[#263D32]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-[#5C5549]">
                {!checkIn
                  ? 'Select Check-in Date'
                  : !checkOut
                  ? 'Select Check-out Date'
                  : 'Selected Stay Dates'}
              </span>
              {dateSummary.occupiedNights > 0 && (
                <span
                  data-testid="room-calendar-nights-badge"
                  className="font-sans inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#263D32] text-[#FFFDF9] tabular-nums"
                >
                  {dateSummary.occupiedNights}{' '}
                  {dateSummary.occupiedNights === 1 ? 'night' : 'nights'}
                  {estimatedRoomTotal !== null ? ` • ${formatINR(estimatedRoomTotal)}` : ''}
                </span>
              )}
            </div>
            <p
              data-testid="room-calendar-summary-text"
              className="font-sans text-sm font-semibold text-[#29251F] mt-0.5"
            >
              {checkIn ? (
                <>
                  <span>Check-in: {formatShortStayDate(checkIn)}</span>
                  <span className="mx-2 text-[#5C5549]">→</span>
                  <span>
                    Check-out:{' '}
                    {checkOut ? formatShortStayDate(checkOut) : 'Choose a date after check-in'}
                  </span>
                </>
              ) : (
                'Choose your check-in and check-out dates on the calendar'
              )}
            </p>
          </div>
        </div>

        {(checkIn || checkOut) && (
          <button
            type="button"
            data-testid="room-calendar-reset-dates"
            onClick={handleResetDates}
            className="font-sans inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-semibold text-[#29251F] bg-[#F5F0E6] hover:bg-[#EAE2D3] border border-[#D9CCB8] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#5C5549]" />
            <span>Reset dates</span>
          </button>
        )}
      </div>

      {/* Contextual Alert / Invalid Date Selection Banner */}
      {invalidTooltip && (
        <div
          role="alert"
          data-testid="room-calendar-invalid-tooltip"
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#FDF2F1] border border-[#E6B8B3] text-[#8F281E] text-xs font-sans font-semibold shadow-xs"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-[#A63228]" />
          <span>{invalidTooltip.message}</span>
        </div>
      )}

      {/* 5. Month Navigation Controls + Search-Calendar Style Grids */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <button
            suppressHydrationWarning
            type="button"
            data-testid="room-calendar-prev-month"
            onClick={handlePrevMonth}
            disabled={isAtMinMonth}
            aria-label="Previous Month"
            className="w-11 h-11 rounded-xl border border-[#D9CCB8] bg-[#FFFDF9] hover:bg-[#F5F0E6] text-[#29251F] flex items-center justify-center transition-colors disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            className={`flex-1 grid ${
              singleMonth ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'
            } gap-6 text-center`}
          >
            {monthsToRender.map((m, idx) => (
              <div
                key={`${m.year}-${m.month}`}
                className={idx === 1 ? 'hidden lg:block' : 'block'}
              >
                <h3 className="font-serif text-lg sm:text-xl font-semibold text-[#29251F]">
                  {MONTH_NAMES[m.month]} {m.year}
                </h3>
              </div>
            ))}
          </div>

          <button
            suppressHydrationWarning
            type="button"
            data-testid="room-calendar-next-month"
            onClick={handleNextMonth}
            aria-label="Next Month"
            className="w-11 h-11 rounded-xl border border-[#D9CCB8] bg-[#FFFDF9] hover:bg-[#F5F0E6] text-[#29251F] flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 1-Month (Mobile) or 2-Month Side-by-Side (Desktop) Grids */}
        <div
          className={`grid ${
            singleMonth ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'
          } gap-6`}
        >
          {monthsToRender.map((m, monthIdx) => {
            const cells = buildCalendarMonthGrid(m.year, m.month);

            return (
              <div
                key={`room-grid-${m.year}-${m.month}`}
                className={monthIdx === 1 ? 'hidden lg:block space-y-2' : 'block space-y-2'}
              >
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-0 text-center pb-1">
                  {WEEKDAY_LABELS.map((day) => (
                    <span
                      key={day}
                      className="font-sans text-[11px] font-semibold uppercase tracking-wider text-[#5C5549] py-1"
                    >
                      {day}
                    </span>
                  ))}
                </div>

                {/* Days Grid — zero horizontal gap so range highlights connect seamlessly */}
                <div className="grid grid-cols-7 gap-x-0 gap-y-1.5" role="grid">
                  {cells.map((cell, cellIdx) => {
                    if (!cell) {
                      return <div key={`empty-${cellIdx}`} className="h-11" />;
                    }

                    const state: CalendarDayVisualState = evaluateCalendarDayState(
                      cell.dateStr,
                      todayStr,
                      checkIn,
                      checkOut,
                      hoverDate
                    );

                    const isPast = state === 'past-disabled';
                    const occ = getDateOccupancyStatus(cell.dateStr);
                    const isBooked = occ.status === 'booked';
                    const isBlocked = occ.status === 'blocked';
                    const isPastUnoccupied = isPast && !isBooked && !isBlocked;
                    const isInvalidClickedCell = invalidTooltip?.dateStr === cell.dateStr;

                    // Outer track background for continuous range strip without gaps
                    let trackBgClass = '';
                    if (hasContinuousRange && !isPastUnoccupied) {
                      if (state === 'check-in-start') {
                        const hasRightRange =
                          Boolean(checkOut && checkOut > checkIn) ||
                          Boolean(!checkOut && hoverDate && hoverDate > checkIn);
                        const hasLeftInvalidRange = Boolean(
                          !checkOut &&
                            hoverDate &&
                            hoverDate < checkIn &&
                            hoverDate >= todayStr
                        );
                        if (hasRightRange) {
                          trackBgClass =
                            'bg-gradient-to-r from-transparent from-50% to-[#E3ECE6] to-50%';
                        } else if (hasLeftInvalidRange) {
                          trackBgClass =
                            'bg-gradient-to-l from-transparent from-50% to-[#FDF2F1] to-50%';
                        }
                      } else if (state === 'check-out-end' || state === 'valid-preview-end') {
                        trackBgClass =
                          'bg-gradient-to-l from-transparent from-50% to-[#E3ECE6] to-50%';
                      } else if (
                        state === 'in-selected-range' ||
                        state === 'in-valid-preview-range'
                      ) {
                        trackBgClass = 'bg-[#E3ECE6]';
                      } else if (state === 'in-invalid-preview-range') {
                        trackBgClass = 'bg-[#FDF2F1]';
                      } else if (state === 'invalid-preview-target') {
                        trackBgClass =
                          'bg-gradient-to-r from-transparent from-50% to-[#FDF2F1] to-50%';
                      }
                    }

                    // Inner button pill styling — Past dates are FADED, never cut (no line-through)
                    let buttonStyleClass =
                      'text-[#29251F] hover:bg-[#F5F0E6] hover:border hover:border-[#263D32]/40 rounded-full';

                    if (isBooked) {
                      buttonStyleClass =
                        'bg-[#FDF2F1] hover:bg-[#F9DEDC] text-[#8F281E] border border-[#E6B8B3] rounded-full cursor-pointer';
                    } else if (isBlocked) {
                      buttonStyleClass =
                        'bg-[#FDF5EC] hover:bg-[#FAE8D4] text-[#8A4215] border border-[#E5C6A0] rounded-full cursor-pointer';
                    } else if (isPastUnoccupied) {
                      buttonStyleClass =
                        'text-[#5C5549]/35 opacity-45 cursor-not-allowed rounded-full';
                    } else if (state === 'check-in-start' || state === 'check-out-end') {
                      buttonStyleClass =
                        'bg-[#263D32] text-[#FFFDF9] font-bold shadow-xs rounded-full ring-2 ring-[#263D32]/20';
                    } else if (state === 'valid-preview-end') {
                      buttonStyleClass =
                        'bg-[#345244] text-[#FFFDF9] font-bold shadow-xs rounded-full';
                    } else if (
                      state === 'in-selected-range' ||
                      state === 'in-valid-preview-range'
                    ) {
                      buttonStyleClass =
                        'bg-[#E3ECE6] text-[#1F332A] font-semibold rounded-none';
                    } else if (state === 'invalid-preview-target') {
                      buttonStyleClass =
                        'bg-[#F9DEDC] text-[#8F281E] border border-[#D47A72] font-semibold rounded-full';
                    } else if (state === 'in-invalid-preview-range') {
                      buttonStyleClass =
                        'bg-[#FDF2F1] text-[#A63228] font-medium rounded-none';
                    } else if (state === 'today') {
                      buttonStyleClass =
                        'text-[#263D32] font-bold border border-[#263D32] rounded-full hover:bg-[#E3ECE6]/60';
                    }

                    const statusDotColor = isBooked
                      ? 'bg-[#C94A3E]'
                      : isBlocked
                      ? 'bg-[#D9822B]'
                      : isPastUnoccupied
                      ? null
                      : state === 'check-in-start' ||
                        state === 'check-out-end' ||
                        state === 'valid-preview-end'
                      ? 'bg-[#FDE2A8]'
                      : 'bg-[#263D32]/65';

                    return (
                      <div
                        key={cell.dateStr}
                        className={`relative flex items-center justify-center h-11 ${trackBgClass}`}
                      >
                        <button
                          suppressHydrationWarning
                          type="button"
                          disabled={isPastUnoccupied}
                          data-testid={`room-calendar-day-${cell.dateStr}`}
                          data-state={state}
                          data-occupancy={
                            isBooked
                              ? 'booked'
                              : isBlocked
                              ? 'blocked'
                              : isPastUnoccupied
                              ? 'past'
                              : occ.status
                          }
                          aria-label={`${cell.dateStr}${
                            isBooked
                              ? ' (Booked)'
                              : isBlocked
                              ? ' (Host Block)'
                              : isPastUnoccupied
                              ? ' (Past date)'
                              : state === 'check-in-start'
                              ? ' (Check-in)'
                              : state === 'check-out-end'
                              ? ' (Check-out)'
                              : ' (Available)'
                          }`}
                          aria-pressed={
                            state === 'check-in-start' || state === 'check-out-end'
                          }
                          onMouseEnter={() => {
                            if (!isPastUnoccupied) setHoverDate(cell.dateStr);
                          }}
                          onFocus={() => {
                            if (!isPastUnoccupied) setHoverDate(cell.dateStr);
                          }}
                          onClick={() => onDayClick(cell.dateStr)}
                          className={`relative z-10 w-11 h-11 flex flex-col items-center justify-center font-sans text-xs sm:text-sm tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#263D32] ${buttonStyleClass} ${
                            !isPast && !isBooked && !isBlocked ? 'cursor-pointer' : ''
                          }`}
                        >
                          <span className="leading-none">{cell.dayOfMonth}</span>
                          {statusDotColor && (
                            <span
                              aria-hidden="true"
                              className={`mt-1 w-1 h-1 rounded-full ${statusDotColor}`}
                            />
                          )}
                        </button>

                        {/* Floating contextual tooltip directly above the clicked invalid date */}
                        {isInvalidClickedCell && invalidTooltip && (
                          <div
                            role="tooltip"
                            className="pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 z-40 whitespace-nowrap px-3 py-1.5 rounded-lg bg-[#29251F] text-[#FFFDF9] font-sans text-[11px] font-semibold shadow-lg"
                          >
                            {invalidTooltip.message}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}