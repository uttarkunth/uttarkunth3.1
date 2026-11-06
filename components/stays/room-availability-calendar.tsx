'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BedDouble,
  Sparkles,
  Users
} from 'lucide-react';
import { formatINR } from '@/lib/utils';

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

interface RoomAvailabilityCalendarProps {
  propertyId: string;
  propertyName: string;
  rooms: RoomOption[];
}

export function RoomAvailabilityCalendar({
  propertyId,
  propertyName,
  rooms,
}: RoomAvailabilityCalendarProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?.id || '');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [occupancy, setOccupancy] = useState<OccupancyBlock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Month navigation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = endOfMonth.getDate();
  const startDayOfWeek = startOfMonth.getDay(); // 0 is Sunday

  useEffect(() => {
    async function fetchOccupancy() {
      setLoading(true);
      try {
        const fromStr = new Date(year, month - 1, 1).toISOString().split('T')[0];
        const toStr = new Date(year, month + 2, 0).toISOString().split('T')[0];
        const res = await fetch(`/api/stays/${propertyId}/occupancy?from=${fromStr}&to=${toStr}`);
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
  }, [propertyId, year, month]);

  const activeRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Helper to check day status
  const getDayStatus = (dayNum: number): { status: 'available' | 'booked' | 'blocked'; kind?: string } => {
    const checkDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    
    // Check against occupancy for selected room
    const match = occupancy.find((o) => {
      if (selectedRoomId && o.room_unit_id !== selectedRoomId) return false;
      return checkDateStr >= o.start_date && checkDateStr < o.end_date;
    });

    if (match) {
      const isConfirmedBooking = match.kind === 'booking' || match.kind === 'booked';
      return {
        status: isConfirmedBooking ? 'booked' : 'blocked',
        kind: match.kind,
      };
    }

    return { status: 'available' };
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-forest/10">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-ukorange" />
            <span className="text-xs font-bold uppercase tracking-widest text-ukorange">
              Live Room Availability Calendar
            </span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-forest mt-1">
            Check Room Occupancy &amp; Dates
          </h2>
          <p className="text-xs text-charcoal-muted mt-0.5">
            Confirmed reservations are marked in real-time. Direct booking requests can be submitted for any open green dates.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-semibold">
          <span className="flex items-center gap-1.5 text-emerald-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Available</span>
          </span>
          <span className="flex items-center gap-1.5 text-red-800">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span>Booked</span>
          </span>
          <span className="flex items-center gap-1.5 text-amber-800">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Host Block</span>
          </span>
        </div>
      </div>

      {/* Room Tabs */}
      {rooms.length > 1 && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-charcoal-muted block">
            Select Room Unit to View Schedule:
          </label>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {rooms.map((room) => {
              const isSelected = room.id === selectedRoomId;
              return (
                <button suppressHydrationWarning
                  type="button"
                  key={room.id}
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-2 border ${
                    isSelected
                      ? 'bg-forest text-white border-forest shadow-xs'
                      : 'bg-ivory-warm text-charcoal-muted border-forest/15 hover:border-forest/30'
                  }`}
                >
                  <BedDouble className="w-3.5 h-3.5 text-ukorange" />
                  <span>{room.room_name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-forest/10 text-forest'}`}>
                    ₹{room.base_price}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Room Badge Highlights */}
      {activeRoom && (
        <div className="p-3 bg-ivory-warm/80 rounded-2xl border border-forest/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <strong className="text-forest font-serif text-sm">{activeRoom.room_name}</strong>
            {activeRoom.attached_washroom !== undefined && (
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${activeRoom.attached_washroom ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}`}>
                {activeRoom.attached_washroom ? 'Attached Washroom' : 'Shared Washroom'}
              </span>
            )}
            {activeRoom.view_type && activeRoom.view_type !== 'none' && (
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-sky-100 text-sky-800 rounded-full capitalize">
                {activeRoom.view_type} View
              </span>
            )}
          </div>
          <div className="text-forest font-bold">
            ₹{activeRoom.base_price} <span className="text-charcoal-muted font-normal text-[11px]">/ night</span>
          </div>
        </div>
      )}

      {/* Month Header Navigation */}
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg font-bold text-forest">
          {monthNames[month]} {year}
        </h3>

        <div className="flex items-center gap-1.5">
          <button suppressHydrationWarning
            type="button"
            onClick={handlePrevMonth}
            className="p-2 rounded-xl bg-ivory-warm hover:bg-forest/10 border border-forest/15 text-forest transition-colors"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button suppressHydrationWarning
            type="button"
            onClick={handleNextMonth}
            className="p-2 rounded-xl bg-ivory-warm hover:bg-forest/10 border border-forest/15 text-forest transition-colors"
            aria-label="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-1">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-charcoal-muted uppercase tracking-wider py-1">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Empty offset days */}
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`offset-${i}`} className="h-12 sm:h-14 rounded-xl bg-transparent" />
          ))}

          {/* Actual days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const { status } = getDayStatus(dayNum);
            const isBooked = status === 'booked';
            const isBlocked = status === 'blocked';
            const isAvailable = status === 'available';

            return (
              <div
                key={`day-${dayNum}`}
                className={`h-12 sm:h-14 p-1 rounded-xl border flex flex-col justify-between transition-all ${
                  isBooked
                    ? 'bg-red-50/80 border-red-200 text-red-900 opacity-80 cursor-not-allowed'
                    : isBlocked
                    ? 'bg-amber-50/80 border-amber-200 text-amber-900 opacity-80 cursor-not-allowed'
                    : 'bg-emerald-50/40 hover:bg-emerald-100/50 border-emerald-200/80 text-forest'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold px-1">
                  <span>{dayNum}</span>
                  {isBooked ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  ) : isBlocked ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  )}
                </div>

                <div className="text-[10px] font-semibold text-center truncate">
                  {isBooked ? (
                    <span className="text-red-700">Booked</span>
                  ) : isBlocked ? (
                    <span className="text-amber-700">Blocked</span>
                  ) : (
                    <span className="text-emerald-800">Open</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}