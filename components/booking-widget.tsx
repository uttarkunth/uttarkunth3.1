'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { calculateNights, calculateBookingPrice, validateStayDates } from '@/lib/booking-calculator';
import { findRoomOccupancyConflict, RoomOccupancyInterval } from '@/lib/stays-search';
import { formatINR } from '@/lib/utils';
import { Calendar, Users, ShieldCheck, Clock, CheckCircle2, AlertCircle, Sparkles, UserCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { RoomPhotoCarousel } from '@/components/stays/property-photo-gallery';
import { getPropertyPhotoList } from '@/lib/property-images';

interface RoomUnit {
  id: string;
  room_name: string;
  description: string | null;
  max_guests: number;
  base_price: number | string;
  active: boolean;
  attached_washroom?: boolean;
  photos?: unknown;
  washroom_photos?: unknown;
}

interface BookingWidgetProps {
  propertyId: string;
  propertyName: string;
  hostWhatsapp?: string | null;
  hostPhone?: string | null;
  rooms: RoomUnit[];
  sharedWashroomPhotos?: string[];
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
  currentUser?: {
    name?: string;
    email?: string;
    phone?: string;
  } | null;
}

function normalizeWhatsAppNumber(phone?: string | null): string {
  if (!phone) return '';
  let digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('0') && digits.length === 11) {
    digits = '91' + digits.slice(1);
  } else if (digits.length === 10) {
    digits = '91' + digits;
  }
  return digits;
}

export function BookingWidget({
  propertyId,
  propertyName,
  hostWhatsapp,
  hostPhone,
  rooms,
  sharedWashroomPhotos = [],
  initialCheckIn = '',
  initialCheckOut = '',
  initialGuests = 2,
  currentUser = null,
}: BookingWidgetProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?.id || '');
  const [checkIn, setCheckIn] = useState<string>(initialCheckIn);
  const [checkOut, setCheckOut] = useState<string>(initialCheckOut);
  const [adults, setAdults] = useState<number>(initialGuests);
  const [children, setChildren] = useState<number>(0);
  const [guestName, setGuestName] = useState<string>(currentUser?.name || '');
  const [guestEmail, setGuestEmail] = useState<string>(currentUser?.email || '');
  const [guestPhone, setGuestPhone] = useState<string>(currentUser?.phone || '');
  const [isAutoFilled, setIsAutoFilled] = useState<boolean>(Boolean(currentUser?.email));
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [occupancy, setOccupancy] = useState<RoomOccupancyInterval[]>([]);

  useEffect(() => {
    let active = true;
    async function loadOccupancy() {
      try {
        const res = await fetch(`/api/stays/${propertyId}/occupancy`);
        const data = await res.json();
        if (active && data.ok && Array.isArray(data.occupancy)) {
          setOccupancy(data.occupancy);
        }
      } catch {
        // Non-blocking fallback
      }
    }
    loadOccupancy();
    return () => {
      active = false;
    };
  }, [propertyId]);

  useEffect(() => {
    async function loadAuthProfile() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const meta = user.user_metadata || {};
          const fullName = meta.full_name || meta.name || '';
          const phone = meta.phone || user.phone || '';
          const email = user.email || '';

          setGuestName((prev) => (prev ? prev : fullName));
          setGuestEmail((prev) => (prev ? prev : email));
          setGuestPhone((prev) => (prev ? prev : phone));
          if (fullName || email || phone) {
            setIsAutoFilled(true);
          }
        }
      } catch {
        // Guest is not logged in or in preview mode
      }
    }
    loadAuthProfile();
  }, []);

  const [loading, setLoading] = useState<boolean>(false);
  const [submittedBooking, setSubmittedBooking] = useState<{
    reference: string;
    total: number;
    status: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    function handleCalendarDatesSelected(event: Event) {
      const custom = event as CustomEvent<{
        roomId?: string;
        checkIn?: string;
        checkOut?: string;
        conflictMessage?: string | null;
      }>;
      if (!custom.detail) return;
      if (custom.detail.roomId) {
        setSelectedRoomId(custom.detail.roomId);
      }
      if (typeof custom.detail.checkIn === 'string' && custom.detail.checkIn) {
        setCheckIn(custom.detail.checkIn);
      } else if (custom.detail.checkIn === '' && !custom.detail.conflictMessage) {
        setCheckIn('');
      }
      if (typeof custom.detail.checkOut === 'string' && custom.detail.checkOut) {
        setCheckOut(custom.detail.checkOut);
      } else if (custom.detail.checkOut === '' && !custom.detail.conflictMessage) {
        setCheckOut('');
      }
      if (custom.detail.conflictMessage) {
        setErrorMessage(custom.detail.conflictMessage);
      } else if (custom.detail.checkIn || custom.detail.checkOut) {
        setErrorMessage(null);
      }
    }

    window.addEventListener('uttarkunth:room-dates-selected', handleCalendarDatesSelected);
    return () => {
      window.removeEventListener('uttarkunth:room-dates-selected', handleCalendarDatesSelected);
    };
  }, []);

  const selectedRoom = useMemo(() => {
    return rooms.find(r => r.id === selectedRoomId) || rooms[0];
  }, [rooms, selectedRoomId]);

  const checkDateOccupancyConflict = React.useCallback(
    (nextCheckIn: string, nextCheckOut: string) => {
      const primaryDate = nextCheckIn || nextCheckOut;
      if (!primaryDate) return null;

      // Check selected room first, then property-wide occupancy so any reserved or blocked date is caught
      const roomConflict = findRoomOccupancyConflict({
        checkIn: primaryDate,
        checkOut: nextCheckIn ? nextCheckOut : undefined,
        occupancy,
        roomUnitId: selectedRoom?.id,
      });
      if (roomConflict) return roomConflict;

      return findRoomOccupancyConflict({
        checkIn: primaryDate,
        checkOut: nextCheckIn ? nextCheckOut : undefined,
        occupancy,
      });
    },
    [occupancy, selectedRoom?.id]
  );

  // Re-validate whenever occupancy finishes loading if dates were already chosen
  useEffect(() => {
    if (!checkIn && !checkOut) return;
    if (occupancy.length === 0) return;
    const conflict = checkDateOccupancyConflict(checkIn, checkOut);
    if (conflict) {
      setErrorMessage(conflict.message);
    }
  }, [occupancy, checkIn, checkOut, checkDateOccupancyConflict]);

  const syncDatesToCalendar = (
    nextCheckIn: string,
    nextCheckOut: string,
    conflictDateStr: string | null,
    conflictMessage: string | null
  ) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent('uttarkunth:booking-widget-dates-changed', {
        detail: {
          checkIn: nextCheckIn,
          checkOut: nextCheckOut,
          conflictDateStr,
          conflictMessage,
        },
      })
    );
  };

  const handleCheckInChange = (nextCheckIn: string) => {
    setCheckIn(nextCheckIn);
    if (!nextCheckIn && !checkOut) {
      setErrorMessage(null);
      syncDatesToCalendar('', '', null, null);
      return;
    }
    const conflict = checkDateOccupancyConflict(nextCheckIn, checkOut);
    const msg = conflict ? conflict.message : null;
    setErrorMessage(msg);
    syncDatesToCalendar(
      nextCheckIn,
      checkOut,
      conflict ? conflict.conflictDateStr : null,
      msg
    );
  };

  const handleCheckOutChange = (nextCheckOut: string) => {
    setCheckOut(nextCheckOut);
    if (!checkIn && !nextCheckOut) {
      setErrorMessage(null);
      syncDatesToCalendar('', '', null, null);
      return;
    }
    const conflict =
      checkDateOccupancyConflict(checkIn, nextCheckOut) ||
      (nextCheckOut ? checkDateOccupancyConflict(nextCheckOut, '') : null);
    const msg = conflict ? conflict.message : null;
    setErrorMessage(msg);
    syncDatesToCalendar(
      checkIn,
      nextCheckOut,
      conflict ? conflict.conflictDateStr : null,
      msg
    );
  };

  const basePrice = Number(selectedRoom?.base_price || 0);
  const selectedRoomPhotos = getPropertyPhotoList(null, [
    ...(Array.isArray(selectedRoom?.photos) ? selectedRoom.photos : []),
    ...(selectedRoom?.attached_washroom && Array.isArray(selectedRoom?.washroom_photos)
      ? selectedRoom.washroom_photos
      : selectedRoom?.attached_washroom ? [] : sharedWashroomPhotos),
  ]);

  const priceCalculation = useMemo(() => {
    if (!checkIn || !checkOut) return null;
    return calculateBookingPrice(basePrice, checkIn, checkOut);
  }, [basePrice, checkIn, checkOut]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Check if any selected date is booked or blocked by the host FIRST
    const occupancyConflict =
      checkDateOccupancyConflict(checkIn, checkOut) ||
      (checkOut ? checkDateOccupancyConflict(checkOut, '') : null);
    if (occupancyConflict) {
      setErrorMessage(occupancyConflict.message);
      syncDatesToCalendar(
        checkIn,
        checkOut,
        occupancyConflict.conflictDateStr,
        occupancyConflict.message
      );
      return;
    }

    // 2. Validate dates
    const dateValidation = validateStayDates(checkIn, checkOut);
    if (!dateValidation.valid) {
      setErrorMessage(dateValidation.error || "Please verify your stay dates.");
      return;
    }

    // Validate guest capacity
    if (selectedRoom && (adults + children) > selectedRoom.max_guests) {
      setErrorMessage(`Guest count exceeds maximum capacity of ${selectedRoom.max_guests} for this room.`);
      return;
    }

    if (!guestName.trim() || !guestEmail.trim() || !guestPhone.trim()) {
      setErrorMessage("Please fill in your name, email, and phone number.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/bookings/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: propertyId,
          room_unit_id: selectedRoom.id,
          guest_name: guestName.trim(),
          guest_email: guestEmail.trim(),
          guest_phone: guestPhone.trim(),
          check_in: checkIn,
          check_out: checkOut,
          adults: Number(adults),
          children: Number(children),
          special_requests: specialRequests.trim() || undefined,
        })
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to submit booking request.");
      }

      setSubmittedBooking({
        reference: data.booking_reference,
        total: data.estimated_total,
        status: data.status || 'pending'
      });
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submittedBooking) {
    return (
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-forest/20 shadow-lifted">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 bg-forest/10 text-forest rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-forest" />
          </div>

          <h3 className="font-serif text-2xl font-bold text-forest">
            Request Submitted!
          </h3>

          <div className="bg-ivory-warm p-4 rounded-xl border border-forest/10 text-left space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-charcoal-muted uppercase tracking-wider font-semibold">Booking Reference</span>
              <span className="font-mono font-bold text-forest">{submittedBooking.reference}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-charcoal-muted">Status</span>
              <span className="bg-ukorange/15 text-ukorange px-2 py-0.5 rounded font-semibold text-[11px] uppercase">
                Pending Host Approval
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-forest/10">
              <span className="text-charcoal-muted">Estimated Total</span>
              <span className="font-serif text-lg font-bold text-forest">{formatINR(submittedBooking.total)}</span>
            </div>
          </div>

          <div className="text-xs text-charcoal leading-relaxed text-left space-y-2 bg-[#F5F0E6] p-4 rounded-xl border border-[#D9CCB8]">
            <p className="font-semibold text-[#263D32] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#C55B23]" />
              What happens next?
            </p>
            <p className="text-charcoal-muted">
              1. The local host for <strong>{propertyName}</strong> will review your stay request and room availability.
            </p>
            <p className="text-charcoal-muted">
              2. You will receive an email confirmation once the host approves or responds to your request.
            </p>
            <p className="text-charcoal-muted">
              3. No online payment is currently collected by Uttarkunth. Guests pay their hosts directly at the property.
            </p>
          </div>

          <button
            suppressHydrationWarning
            type="button"
            onClick={() => setSubmittedBooking(null)}
            className="w-full min-h-[44px] py-2.5 text-xs font-semibold text-forest hover:text-forest-hover border border-[#D9CCB8] hover:bg-forest/5 rounded-xl transition-colors cursor-pointer"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FFFDF9] rounded-2xl p-6 border border-[#D9CCB8] shadow-soft sticky top-24">
      {/* Rate Header */}
      <div className="flex items-baseline justify-between mb-6 pb-4 border-b border-[#D9CCB8]">
        <div>
          <span className="text-xs font-medium text-charcoal-muted block mb-1">Nightly Rate</span>
          <div className="flex items-baseline gap-1">
            <span className="font-sans text-3xl font-bold text-forest tabular-nums">
              {formatINR(basePrice)}
            </span>
            <span className="text-xs text-charcoal-muted font-medium">/ night</span>
          </div>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-ukorange/10 text-ukorange text-[11px] font-semibold rounded-md border border-ukorange/20">
            <Sparkles className="w-3 h-3" />
            Host Approval Required
          </span>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mb-4 p-3 bg-[#FDF2F1] border border-[#E6B8B3] text-[#8F281E] text-xs font-medium rounded-xl flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#A63228]" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {selectedRoom && (
          <div className="space-y-2 rounded-xl border border-[#D9CCB8] bg-[#F5F0E6]/65 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-forest">{selectedRoom.room_name}</p>
              <span
                className={`rounded-md px-2.5 py-1 text-[10px] font-semibold border ${
                  selectedRoom.attached_washroom
                    ? 'bg-[#E3ECE6] text-[#263D32] border-[#263D32]/20'
                    : 'bg-[#FFFDF9] text-[#5C5549] border-[#D9CCB8]'
                }`}
              >
                {selectedRoom.attached_washroom ? 'Private washroom' : 'Shared washroom'}
              </span>
            </div>
            <RoomPhotoCarousel photos={selectedRoomPhotos} alt={selectedRoom.room_name} />
            {selectedRoomPhotos.length === 0 && (
              <p className="text-[11px] text-charcoal-muted">
                Room photographs will be added by the host.
              </p>
            )}
          </div>
        )}

        {/* Dates Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="booking-widget-checkin"
              className="block text-xs font-semibold text-charcoal mb-1.5 flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-forest" />
              <span>Check-in</span>
            </label>
            <input
              id="booking-widget-checkin"
              suppressHydrationWarning
              type="date"
              required
              value={checkIn}
              onChange={(e) => handleCheckInChange(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 bg-[#F5F0E6] border border-[#D9CCB8] rounded-xl text-xs font-semibold text-charcoal focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
            />
          </div>

          <div>
            <label
              htmlFor="booking-widget-checkout"
              className="block text-xs font-semibold text-charcoal mb-1.5 flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-forest" />
              <span>Check-out</span>
            </label>
            <input
              id="booking-widget-checkout"
              suppressHydrationWarning
              type="date"
              required
              min={checkIn || undefined}
              value={checkOut}
              onChange={(e) => handleCheckOutChange(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 bg-[#F5F0E6] border border-[#D9CCB8] rounded-xl text-xs font-semibold text-charcoal focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
            />
          </div>
        </div>

        {/* Guest Count */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="booking-widget-adults"
              className="block text-xs font-semibold text-charcoal mb-1.5"
            >
              Adults (18+)
            </label>
            <select
              id="booking-widget-adults"
              suppressHydrationWarning
              value={adults}
              onChange={(e) => setAdults(Number(e.target.value))}
              className="w-full min-h-[44px] px-3 py-2 text-xs bg-[#F5F0E6] border border-[#D9CCB8] rounded-xl font-semibold text-charcoal focus:outline-none focus:border-forest"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} Adult{n > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="booking-widget-children"
              className="block text-xs font-semibold text-charcoal mb-1.5"
            >
              Children (2–17)
            </label>
            <select
              id="booking-widget-children"
              suppressHydrationWarning
              value={children}
              onChange={(e) => setChildren(Number(e.target.value))}
              className="w-full min-h-[44px] px-3 py-2 text-xs bg-[#F5F0E6] border border-[#D9CCB8] rounded-xl font-semibold text-charcoal focus:outline-none focus:border-forest"
            >
              {[0, 1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'Child' : 'Children'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Guest Contact Information */}
        <div className="pt-3 border-t border-[#D9CCB8] space-y-3">
          <div className="flex items-center justify-between">
            <span className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
              Guest Details
            </span>
            {isAutoFilled && (
              <span className="text-[10px] text-[#263D32] bg-[#E3ECE6] border border-[#263D32]/20 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[#263D32]" />
                Pre-filled from your account
              </span>
            )}
          </div>

          <div>
            <label
              htmlFor="booking-widget-guest-name"
              className="block text-xs font-semibold text-charcoal mb-1.5"
            >
              Full Name
            </label>
            <input
              id="booking-widget-guest-name"
              suppressHydrationWarning
              type="text"
              required
              placeholder="Enter your full name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 text-xs bg-[#F5F0E6] border border-[#D9CCB8] rounded-xl font-medium text-charcoal focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
            />
          </div>

          <div>
            <label
              htmlFor="booking-widget-guest-email"
              className="block text-xs font-semibold text-charcoal mb-1.5"
            >
              Email Address
            </label>
            <input
              id="booking-widget-guest-email"
              suppressHydrationWarning
              type="email"
              required
              placeholder="you@example.com"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 text-xs bg-[#F5F0E6] border border-[#D9CCB8] rounded-xl font-medium text-charcoal focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
            />
          </div>

          <div>
            <label
              htmlFor="booking-widget-guest-phone"
              className="block text-xs font-semibold text-charcoal mb-1.5"
            >
              Phone Number
            </label>
            <input
              id="booking-widget-guest-phone"
              suppressHydrationWarning
              type="tel"
              required
              placeholder="+91 ..."
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 text-xs bg-[#F5F0E6] border border-[#D9CCB8] rounded-xl font-medium text-charcoal focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
            />
          </div>

          <div>
            <label
              htmlFor="booking-widget-requests"
              className="block text-xs font-semibold text-charcoal mb-1.5"
            >
              Special Requests <span className="font-normal text-charcoal-muted">(optional)</span>
            </label>
            <textarea
              id="booking-widget-requests"
              suppressHydrationWarning
              placeholder="Dietary preferences or expected arrival time"
              rows={2}
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              className="w-full p-3 text-xs bg-[#F5F0E6] border border-[#D9CCB8] rounded-xl font-medium text-charcoal focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
            />
          </div>
        </div>

        {/* Price Calculation Breakdown */}
        {priceCalculation && priceCalculation.nights > 0 && (
          <div className="pt-3 border-t border-[#D9CCB8] space-y-2 text-xs">
            <div className="flex justify-between text-charcoal-muted">
              <span>
                {formatINR(basePrice)} × {priceCalculation.nights} night
                {priceCalculation.nights > 1 ? 's' : ''}
              </span>
              <span className="font-medium text-charcoal tabular-nums">
                {formatINR(priceCalculation.roomTotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-forest pt-2 border-t border-[#D9CCB8]">
              <span>Estimated Total (INR)</span>
              <span className="font-sans text-lg tabular-nums">
                {priceCalculation.formattedTotal}
              </span>
            </div>
          </div>
        )}

        {/* Primary CTA Button */}
        <button
          suppressHydrationWarning
          type="submit"
          disabled={loading}
          className="w-full min-h-[48px] py-3 bg-[#263D32] hover:bg-[#1D3027] disabled:bg-[#263D32]/50 text-[#FFFDF9] font-semibold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <span className="inline-block animate-pulse">Checking Availability...</span>
          ) : (
            <>
              <span>Request to Book</span>
              <Sparkles className="w-4 h-4 text-[#FDE2A8]" />
            </>
          )}
        </button>

        {/* Secondary Outline Action — WhatsApp Direct Enquiry */}
        <a
          href={`https://wa.me/${
            normalizeWhatsAppNumber(hostWhatsapp) ||
            normalizeWhatsAppNumber(hostPhone) ||
            '918627025502'
          }?text=${encodeURIComponent(
            `Hello, I am inquiring about booking ${propertyName}${
              checkIn && checkOut ? ` for dates ${checkIn} to ${checkOut}` : ''
            }.`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full min-h-[44px] py-2.5 bg-[#FFFDF9] hover:bg-[#F5F0E6] text-[#263D32] border border-[#D9CCB8] font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <span>Quick Enquiry via WhatsApp</span>
        </a>

        <p className="text-[11px] text-charcoal-muted text-center leading-relaxed">
          No online payment is currently collected by Uttarkunth. Guests pay their hosts directly at the property.
        </p>
      </form>
    </div>
  );
}
