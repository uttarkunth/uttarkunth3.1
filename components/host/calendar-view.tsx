'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Calendar as CalendarIcon,
  Eye,
} from 'lucide-react';
import { useHostWorkspace } from '@/components/host/host-workspace-shell';
import { HostBookingDetailModal } from '@/components/host/host-booking-detail-modal';
import {
  filterBlocksByProperty,
  filterRecordsByProperty,
  formatBookingReference,
  getEventsForCalendarDate,
  getPropertyDisplayName,
  getPropertyRooms,
  getRoomDisplayName,
  type HostAvailabilityBlockRecord,
  type HostBookingRecord,
  type HostPropertyRecord,
} from '@/lib/host-dashboard';

interface CalendarViewProps {
  properties: HostPropertyRecord[];
  confirmedBookings: HostBookingRecord[];
  pendingBookings: HostBookingRecord[];
  blocks: HostAvailabilityBlockRecord[];
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarView({
  properties,
  confirmedBookings,
  pendingBookings,
  blocks,
}: CalendarViewProps) {
  const router = useRouter();
  const { selectedPropertyId, setSelectedPropertyId } = useHostWorkspace();

  const [selectedRoomId, setSelectedRoomId] = useState<string>('all');
  const [showAddBlock, setShowAddBlock] = useState<boolean>(false);
  const [selectedBookingForModal, setSelectedBookingForModal] = useState<HostBookingRecord | null>(
    null
  );

  const allBookings = useMemo(
    () => [...confirmedBookings, ...pendingBookings],
    [confirmedBookings, pendingBookings]
  );

  // Determine initial calendar month: default to today's month, or earliest active booking month if available
  const initialDate = useMemo(() => {
    const today = new Date();
    return new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  }, []);

  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(initialDate);
  const [selectedDateIso, setSelectedDateIso] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );

  // Available rooms for current property selection
  const availableRooms = useMemo(() => {
    const scopedProps =
      selectedPropertyId === 'all'
        ? properties
        : properties.filter((p) => p.id === selectedPropertyId);

    return scopedProps.flatMap((p) =>
      getPropertyRooms(p).map((r) => ({
        id: r.id,
        name: getRoomDisplayName(r),
        propertyId: p.id,
        propertyName: getPropertyDisplayName(p),
      }))
    );
  }, [properties, selectedPropertyId]);

  // Reset selectedRoomId if property changes and room is no longer in list
  useEffect(() => {
    if (selectedRoomId !== 'all' && !availableRooms.some((r) => r.id === selectedRoomId)) {
      setSelectedRoomId('all');
    }
  }, [availableRooms, selectedRoomId]);

  // Manual block form state
  const [formRoomId, setFormRoomId] = useState<string>(availableRooms[0]?.id || '');
  const [blockedFrom, setBlockedFrom] = useState<string>('');
  const [blockedUntil, setBlockedUntil] = useState<string>('');
  const [reason, setReason] = useState<string>('Host maintenance / personal stay');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [deletingBlockId, setDeletingBlockId] = useState<string | null>(null);
  const [confirmDeleteBlockId, setConfirmDeleteBlockId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!formRoomId && availableRooms.length > 0) {
      setFormRoomId(availableRooms[0].id);
    }
  }, [availableRooms, formRoomId]);

  // Build month days array
  const calendarGridDays = useMemo(() => {
    const year = currentMonthDate.getUTCFullYear();
    const month = currentMonthDate.getUTCMonth();
    const firstDayOfWeek = new Date(Date.UTC(year, month, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

    const cells: { dateIso: string | null; dayNumber: number | null }[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push({ dateIso: null, dayNumber: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateIso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ dateIso, dayNumber: d });
    }
    return cells;
  }, [currentMonthDate]);

  const monthTitle = useMemo(
    () =>
      currentMonthDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }),
    [currentMonthDate]
  );

  const selectedDayEvents = useMemo(
    () =>
      getEventsForCalendarDate(
        selectedDateIso,
        allBookings,
        blocks,
        selectedPropertyId,
        selectedRoomId
      ),
    [selectedDateIso, allBookings, blocks, selectedPropertyId, selectedRoomId]
  );

  const filteredConfirmed = useMemo(
    () =>
      filterRecordsByProperty(confirmedBookings, selectedPropertyId).filter(
        (b) => selectedRoomId === 'all' || (b.room_unit_id || b.room_id) === selectedRoomId
      ),
    [confirmedBookings, selectedPropertyId, selectedRoomId]
  );

  const filteredPending = useMemo(
    () =>
      filterRecordsByProperty(pendingBookings, selectedPropertyId).filter(
        (b) => selectedRoomId === 'all' || (b.room_unit_id || b.room_id) === selectedRoomId
      ),
    [pendingBookings, selectedPropertyId, selectedRoomId]
  );

  const filteredBlocks = useMemo(
    () =>
      filterBlocksByProperty(blocks, selectedPropertyId).filter(
        (bl) => selectedRoomId === 'all' || (bl.room_unit_id || bl.room_id) === selectedRoomId
      ),
    [blocks, selectedPropertyId, selectedRoomId]
  );

  const handlePrevMonth = () => {
    setCurrentMonthDate(
      (prev) => new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() - 1, 1))
    );
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(
      (prev) => new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() + 1, 1))
    );
  };

  const handleOpenBlockForDate = (dateIso: string) => {
    const start = new Date(`${dateIso}T00:00:00Z`);
    const next = new Date(start);
    next.setUTCDate(next.getUTCDate() + 1);
    setBlockedFrom(dateIso);
    setBlockedUntil(next.toISOString().split('T')[0]);
    if (selectedRoomId !== 'all') {
      setFormRoomId(selectedRoomId);
    } else if (availableRooms[0]) {
      setFormRoomId(availableRooms[0].id);
    }
    setShowAddBlock(true);
  };

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);

    try {
      if (!formRoomId || !blockedFrom || !blockedUntil) {
        throw new Error('Please select a room and both start and end dates.');
      }
      if (blockedUntil <= blockedFrom) {
        throw new Error('Check-out / end date must be after start date.');
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

      setFormSuccess(`Blocked room dates ${blockedFrom} → ${blockedUntil}.`);
      setShowAddBlock(false);
      router.refresh();
    } catch (err: any) {
      setFormError(err.message || 'Failed to block dates.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    setDeletingBlockId(blockId);
    setFormError(null);
    try {
      const res = await fetch(`/api/host/availability?id=${blockId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to remove availability block.');
      }
      setConfirmDeleteBlockId(null);
      setFormSuccess('Availability block removed and dates reopened.');
      router.refresh();
    } catch (err: any) {
      setFormError(err.message || 'Error deleting availability block.');
    } finally {
      setDeletingBlockId(null);
    }
  };

  return (
    <div className="space-y-4" data-testid="host-calendar-view">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#665E52]">
            <span>Host Workspace</span>
            <span>/</span>
            <span>Manage Stays</span>
            <span>/</span>
            <strong className="text-[#263D32]">Calendar &amp; Availability</strong>
          </div>
          <h1 className="font-serif text-[28px] sm:text-[34px] font-bold text-[#29251F] leading-tight mt-0.5">
            Calendar &amp; Availability
          </h1>
          <p className="text-[13px] text-[#665E52] mt-0.5">
            See confirmed stays, non-blocking pending requests and manual host blocks by room.
          </p>
        </div>

        {/* Filters & Block Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            aria-label="Filter calendar by property"
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
            aria-label="Filter calendar by room unit"
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            className="px-3 py-2 rounded-[10px] bg-[#FFFDF9] border border-[#D9CCB8] text-xs font-bold text-[#29251F] focus:outline-none focus:border-[#263D32] cursor-pointer"
          >
            <option value="all">All room units ({availableRooms.length})</option>
            {availableRooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} · {r.propertyName}
              </option>
            ))}
          </select>

          <button
            type="button"
            data-testid="host-calendar-open-block-btn"
            onClick={() => {
              if (!showAddBlock && !blockedFrom) {
                handleOpenBlockForDate(selectedDateIso);
              } else {
                setShowAddBlock((prev) => !prev);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[11px] bg-[#263D32] hover:bg-[#1A2B23] text-[#FFFDF9] text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#E57C44]" />
            <span>Block room dates</span>
          </button>
        </div>
      </div>

      {/* Status Feedback */}
      {formError && (
        <div className="p-3 rounded-[12px] bg-[#FBEAE7] border border-[#A53525]/25 text-[#A53525] text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {formSuccess && (
        <div className="p-3 rounded-[12px] bg-[#E8F4EC] border border-[#1F6A3B]/25 text-[#194E2C] text-xs font-bold flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#1F6A3B] shrink-0" />
            {formSuccess}
          </span>
          <button
            type="button"
            onClick={() => setFormSuccess(null)}
            className="text-[11px] underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Manual Availability Block Form */}
      {showAddBlock && (
        <form
          onSubmit={handleCreateBlock}
          data-testid="host-calendar-block-form"
          className="p-4 sm:p-5 rounded-[16px] bg-[#FFFDF9] border border-[#263D32]/30 shadow-md space-y-3.5"
        >
          <div className="flex items-center justify-between pb-2.5 border-b border-[#E5DEC9]">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#C55B23]" />
              <h2 className="text-[15px] font-extrabold text-[#29251F]">
                Block Room Availability
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowAddBlock(false)}
              className="text-xs font-bold text-[#665E52] hover:text-[#29251F] cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-bold text-[#665E52] mb-1">Room Unit</label>
              <select
                value={formRoomId}
                onChange={(e) => setFormRoomId(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-[10px] bg-[#F5F0E6] border border-[#D9CCB8] text-xs font-bold text-[#29251F] focus:outline-none focus:border-[#263D32]"
              >
                {availableRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.propertyName} — {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#665E52] mb-1">
                Start Date (Blocked From)
              </label>
              <input
                type="date"
                value={blockedFrom}
                onChange={(e) => setBlockedFrom(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-[10px] bg-[#F5F0E6] border border-[#D9CCB8] text-xs font-bold text-[#29251F] focus:outline-none focus:border-[#263D32]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#665E52] mb-1">
                End Date (Blocked Until)
              </label>
              <input
                type="date"
                value={blockedUntil}
                onChange={(e) => setBlockedUntil(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-[10px] bg-[#F5F0E6] border border-[#D9CCB8] text-xs font-bold text-[#29251F] focus:outline-none focus:border-[#263D32]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#665E52] mb-1">Reason / Note</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Maintenance, personal stay, weather..."
                className="w-full px-3 py-2 rounded-[10px] bg-[#F5F0E6] border border-[#D9CCB8] text-xs font-medium text-[#29251F] focus:outline-none focus:border-[#263D32]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            <span className="text-[11px] text-[#665E52]">
              Manual blocks cannot overlap dates that already have a confirmed guest reservation.
            </span>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-[10px] bg-[#263D32] hover:bg-[#1A2B23] text-[#FFFDF9] text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Saving Block...' : 'Save Availability Block'}
            </button>
          </div>
        </form>
      )}

      {/* 3 Legend Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-[13px] bg-[#FFFDF9] border border-[#D9CCB8] flex items-start gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1F6A3B] mt-1 shrink-0" />
          <div className="text-xs">
            <strong className="block font-extrabold text-[#29251F]">Confirmed reservation</strong>
            <span className="text-[#665E52]">
              Dates are locked in the database. Overlapping confirmations are prevented.
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-[13px] bg-[#FFFDF9] border border-[#D9CCB8] flex items-start gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C55B23] mt-1 shrink-0" />
          <div className="text-xs">
            <strong className="block font-extrabold text-[#29251F]">
              Pending request (non-blocking)
            </strong>
            <span className="text-[#665E52]">
              Visible for decision making, but dates stay open until you accept.
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-[13px] bg-[#FFFDF9] border border-[#D9CCB8] flex items-start gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#665E52] mt-1 shrink-0" />
          <div className="text-xs">
            <strong className="block font-extrabold text-[#29251F]">Manual host block</strong>
            <span className="text-[#665E52]">
              Closed for seasonal maintenance, family use or offline repairs.
            </span>
          </div>
        </div>
      </div>

      {/* Main Calendar Grid + Selected Day Detail Sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5 items-start">
        {/* Monthly Calendar Grid */}
        <section className="xl:col-span-8 p-4 rounded-[16px] bg-[#FFFDF9] border border-[#D9CCB8] shadow-[0_1px_2px_rgba(24,22,18,0.04)] space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h2 className="text-base font-extrabold text-[#29251F]">{monthTitle}</h2>
              <p className="text-xs text-[#665E52]">
                Select any date to inspect room-wise bookings or block availability
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Previous month"
                className="w-8 h-8 rounded-[9px] bg-[#F5F0E6] hover:bg-[#EFE7D8] border border-[#D9CCB8] flex items-center justify-center text-[#29251F] cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setCurrentMonthDate(
                    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
                  );
                  setSelectedDateIso(now.toISOString().split('T')[0]);
                }}
                className="px-2.5 py-1 rounded-[9px] bg-[#F5F0E6] hover:bg-[#EFE7D8] border border-[#D9CCB8] text-xs font-bold text-[#29251F] cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Next month"
                className="w-8 h-8 rounded-[9px] bg-[#F5F0E6] hover:bg-[#EFE7D8] border border-[#D9CCB8] flex items-center justify-center text-[#29251F] cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Headers + Day Cells */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="text-center text-[11px] font-extrabold uppercase tracking-wider text-[#665E52] py-1"
              >
                {day}
              </div>
            ))}

            {calendarGridDays.map((cell, idx) => {
              if (!cell.dateIso || !cell.dayNumber) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="min-h-[64px] sm:min-h-[86px] rounded-[11px] bg-[#F5F0E6]/40 border border-transparent"
                  />
                );
              }

              const events = getEventsForCalendarDate(
                cell.dateIso,
                allBookings,
                blocks,
                selectedPropertyId,
                selectedRoomId
              );
              const isSelected = selectedDateIso === cell.dateIso;

              return (
                <button
                  key={cell.dateIso}
                  type="button"
                  onClick={() => setSelectedDateIso(cell.dateIso!)}
                  className={`min-h-[64px] sm:min-h-[86px] p-1.5 rounded-[11px] border text-left flex flex-col justify-between gap-1 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#FAF6EE] border-[#C55B23] ring-2 ring-[#C55B23]/20'
                      : 'bg-[#FFFDF9] hover:bg-[#FAF6EE] border-[#E5DEC9]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-extrabold tabular-nums ${
                        isSelected ? 'text-[#C55B23]' : 'text-[#29251F]'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>
                    {events.length > 0 && (
                      <span className="sm:hidden flex items-center gap-0.5">
                        {events.slice(0, 3).map((ev) => (
                          <span
                            key={ev.id}
                            className={`w-1.5 h-1.5 rounded-full ${
                              ev.kind === 'confirmed'
                                ? 'bg-[#1F6A3B]'
                                : ev.kind === 'pending'
                                ? 'bg-[#C55B23]'
                                : 'bg-[#665E52]'
                            }`}
                          />
                        ))}
                      </span>
                    )}
                  </div>

                  {/* Desktop/Tablet Event Pills */}
                  <div className="hidden sm:flex flex-col gap-1 w-full overflow-hidden">
                    {events.slice(0, 2).map((ev) => (
                      <span
                        key={ev.id}
                        className={`block truncate px-1.5 py-0.5 rounded-[5px] text-[10px] font-extrabold leading-tight ${
                          ev.kind === 'confirmed'
                            ? 'bg-[#E8F4EC] text-[#1F6A3B] border-l-2 border-[#1F6A3B]'
                            : ev.kind === 'pending'
                            ? 'bg-[#FDF3E1] text-[#9A6216] border-l-2 border-[#C55B23]'
                            : 'bg-[#EAE7E0] text-[#4C473E] border-l-2 border-[#665E52]'
                        }`}
                      >
                        {ev.title}
                      </span>
                    ))}
                    {events.length > 2 && (
                      <span className="text-[9px] font-bold text-[#665E52] pl-1">
                        +{events.length - 2} more
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Selected Date Detail Panel */}
        <aside className="xl:col-span-4 p-4 rounded-[16px] bg-[#FFFDF9] border border-[#D9CCB8] shadow-[0_1px_2px_rgba(24,22,18,0.04)] space-y-3">
          <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[#E5DEC9]">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#C55B23] block">
                Day Detail
              </span>
              <h2 className="text-base font-extrabold text-[#29251F] tabular-nums mt-0.5">
                {selectedDateIso}
              </h2>
              <p className="text-xs text-[#665E52]">
                {selectedDayEvents.length === 0
                  ? 'All active rooms open'
                  : `${selectedDayEvents.length} scheduled ${
                      selectedDayEvents.length === 1 ? 'item' : 'items'
                    }`}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenBlockForDate(selectedDateIso)}
              className="px-2.5 py-1.5 rounded-[9px] bg-[#F5F0E6] hover:bg-[#EFE7D8] border border-[#D9CCB8] text-xs font-bold text-[#29251F] cursor-pointer"
            >
              + Block date
            </button>
          </div>

          {selectedDayEvents.length > 0 ? (
            <div className="space-y-2.5">
              {selectedDayEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3 rounded-[12px] bg-[#F5F0E6]/80 border border-[#E5DEC9] space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <strong className="block font-extrabold text-[#29251F]">
                        {ev.title}
                      </strong>
                      <span className="text-[11px] text-[#665E52] block">{ev.subtitle}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                        ev.kind === 'confirmed'
                          ? 'bg-[#E8F4EC] text-[#1F6A3B]'
                          : ev.kind === 'pending'
                          ? 'bg-[#FDF3E1] text-[#9A6216]'
                          : 'bg-[#EAE7E0] text-[#4C473E]'
                      }`}
                    >
                      {ev.kind === 'confirmed'
                        ? 'Locked'
                        : ev.kind === 'pending'
                        ? 'Open'
                        : 'Blocked'}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#665E52] tabular-nums">
                    Range: <strong className="text-[#29251F]">{ev.startDate}</strong> &rarr;{' '}
                    <strong className="text-[#29251F]">{ev.endDate}</strong>
                  </div>

                  {ev.booking && (
                    <div className="pt-1 flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedBookingForModal(ev.booking!)}
                        className="px-2.5 py-1 rounded-[8px] bg-[#FFFDF9] hover:bg-[#EFE7D8] border border-[#D9CCB8] text-[11px] font-bold text-[#29251F] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View details</span>
                      </button>
                    </div>
                  )}

                  {ev.block && (
                    <div className="pt-1 flex items-center justify-end gap-1.5">
                      {confirmDeleteBlockId === ev.block.id ? (
                        <>
                          <button
                            type="button"
                            disabled={deletingBlockId === ev.block.id}
                            onClick={() => handleDeleteBlock(ev.block!.id)}
                            className="px-2.5 py-1 rounded-[8px] bg-[#A53525] text-[#FFFDF9] text-[11px] font-bold cursor-pointer"
                          >
                            {deletingBlockId === ev.block.id ? 'Removing...' : 'Confirm unblock'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteBlockId(null)}
                            className="px-2 py-1 rounded-[8px] bg-[#FFFDF9] border border-[#D9CCB8] text-[11px] font-bold text-[#665E52] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteBlockId(ev.block!.id)}
                          className="px-2.5 py-1 rounded-[8px] bg-[#FBEAE7] hover:bg-[#F7D7D2] text-[#A53525] border border-[#A53525]/20 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove block</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-[12px] bg-[#F5F0E6]/60 border border-[#E5DEC9] text-center space-y-2">
              <CalendarIcon className="w-5 h-5 text-[#665E52] mx-auto" />
              <p className="text-xs font-bold text-[#29251F]">No reservations or blocks</p>
              <p className="text-[11px] text-[#665E52]">
                All filtered room units are open for guest requests on {selectedDateIso}.
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* Bottom Schedule Summary Lists (Confirmed, Manual Blocks, Pending Non-Blocking) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {/* Confirmed Reservations */}
        <section className="p-4 rounded-[16px] bg-[#FFFDF9] border border-[#D9CCB8] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5DEC9]">
            <h3 className="text-sm font-extrabold text-[#29251F]">
              Confirmed Stays ({filteredConfirmed.length})
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E8F4EC] text-[#1F6A3B]">
              Dates locked
            </span>
          </div>

          {filteredConfirmed.length > 0 ? (
            <div className="divide-y divide-[#E5DEC9] space-y-2 max-h-60 overflow-y-auto pr-1">
              {filteredConfirmed.map((b) => (
                <div key={b.id} className="pt-2 first:pt-0 text-xs space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-[#29251F]">{b.guest_name}</strong>
                    <span className="font-mono text-[11px] text-[#665E52]">
                      {formatBookingReference(b)}
                    </span>
                  </div>
                  <p className="text-[#665E52] text-[11px]">
                    {b.properties?.name || b.properties?.title} ·{' '}
                    {b.room_units?.room_name || b.rooms?.name}
                  </p>
                  <p className="text-[11px] font-bold text-[#1F6A3B] tabular-nums">
                    {b.check_in} &rarr; {b.check_out}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#665E52] py-4 text-center">
              No confirmed reservations for this filter.
            </p>
          )}
        </section>

        {/* Pending Requests (Non-blocking) */}
        <section className="p-4 rounded-[16px] bg-[#FFFDF9] border border-[#D9CCB8] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5DEC9]">
            <h3 className="text-sm font-extrabold text-[#29251F]">
              Pending Requests ({filteredPending.length})
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FDF3E1] text-[#9A6216]">
              Dates open
            </span>
          </div>

          {filteredPending.length > 0 ? (
            <div className="divide-y divide-[#E5DEC9] space-y-2 max-h-60 overflow-y-auto pr-1">
              {filteredPending.map((b) => (
                <div key={b.id} className="pt-2 first:pt-0 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-[#29251F]">{b.guest_name}</strong>
                    <button
                      type="button"
                      onClick={() => setSelectedBookingForModal(b)}
                      className="text-[11px] font-bold text-[#C55B23] hover:underline cursor-pointer"
                    >
                      Review &rarr;
                    </button>
                  </div>
                  <p className="text-[#665E52] text-[11px]">
                    {b.properties?.name || b.properties?.title} ·{' '}
                    {b.room_units?.room_name || b.rooms?.name}
                  </p>
                  <p className="text-[11px] font-bold text-[#9A6216] tabular-nums">
                    {b.check_in} &rarr; {b.check_out}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#665E52] py-4 text-center">
              No pending requests awaiting decision.
            </p>
          )}
        </section>

        {/* Manual Host Blocks */}
        <section className="p-4 rounded-[16px] bg-[#FFFDF9] border border-[#D9CCB8] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5DEC9]">
            <h3 className="text-sm font-extrabold text-[#29251F]">
              Host Blocks ({filteredBlocks.length})
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#EAE7E0] text-[#4C473E]">
              Unavailable
            </span>
          </div>

          {filteredBlocks.length > 0 ? (
            <div className="divide-y divide-[#E5DEC9] space-y-2 max-h-60 overflow-y-auto pr-1">
              {filteredBlocks.map((bl) => {
                const rUnit = bl.room_units || bl.rooms;
                const start = bl.blocked_from || bl.start_date;
                const end = bl.blocked_until || bl.end_date;
                return (
                  <div
                    key={bl.id}
                    className="pt-2 first:pt-0 text-xs flex items-start justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <strong className="block text-[#29251F]">
                        {rUnit?.properties?.name || rUnit?.properties?.title} —{' '}
                        {(rUnit as any)?.room_name || (rUnit as any)?.name}
                      </strong>
                      <span className="block text-[11px] text-[#665E52] tabular-nums">
                        {start} &rarr; {end} ({bl.reason || 'Host block'})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteBlock(bl.id)}
                      disabled={deletingBlockId === bl.id}
                      title="Remove manual block"
                      className="p-1.5 rounded-lg text-[#665E52] hover:text-[#A53525] hover:bg-[#FBEAE7] transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-[#665E52] py-4 text-center">
              No manual availability blocks active.
            </p>
          )}
        </section>
      </div>

      {/* Booking Detail Modal for Pending/Confirmed items clicked in Calendar */}
      <HostBookingDetailModal
        booking={selectedBookingForModal}
        onClose={() => setSelectedBookingForModal(null)}
        onDecisionSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
