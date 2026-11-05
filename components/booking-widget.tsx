'use client';

import React, { useState, useMemo } from 'react';
import { calculateNights, calculateBookingPrice, validateStayDates } from '@/lib/booking-calculator';
import { formatINR } from '@/lib/utils';
import { Calendar, Users, ShieldCheck, Clock, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface RoomUnit {
  id: string;
  room_name: string;
  description: string | null;
  max_guests: number;
  base_price: number | string;
  active: boolean;
}

interface BookingWidgetProps {
  propertyId: string;
  propertyName: string;
  rooms: RoomUnit[];
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
}

export function BookingWidget({
  propertyId,
  propertyName,
  rooms,
  initialCheckIn = '',
  initialCheckOut = '',
  initialGuests = 2
}: BookingWidgetProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?.id || '');
  const [checkIn, setCheckIn] = useState<string>(initialCheckIn);
  const [checkOut, setCheckOut] = useState<string>(initialCheckOut);
  const [adults, setAdults] = useState<number>(initialGuests);
  const [children, setChildren] = useState<number>(0);
  const [guestName, setGuestName] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [specialRequests, setSpecialRequests] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [submittedBooking, setSubmittedBooking] = useState<{
    reference: string;
    total: number;
    status: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedRoom = useMemo(() => {
    return rooms.find(r => r.id === selectedRoomId) || rooms[0];
  }, [rooms, selectedRoomId]);

  const basePrice = Number(selectedRoom?.base_price || 0);

  const priceCalculation = useMemo(() => {
    if (!checkIn || !checkOut) return null;
    return calculateBookingPrice(basePrice, checkIn, checkOut);
  }, [basePrice, checkIn, checkOut]);

  const todayStr = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate dates
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

          <div className="text-xs text-charcoal leading-relaxed text-left space-y-2 bg-blue-50/50 p-4 rounded-xl border border-ukblue/20">
            <p className="font-semibold text-ukblue-deep flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
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

          <button suppressHydrationWarning
            onClick={() => setSubmittedBooking(null)}
            className="w-full py-2.5 text-xs font-semibold text-forest hover:text-forest-hover border border-forest/20 hover:bg-forest/5 rounded-lg transition-colors"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-forest/15 shadow-lifted sticky top-24">
      {/* Rate Header */}
      <div className="flex items-baseline justify-between mb-6 pb-4 border-b border-forest/10">
        <div>
          <span className="text-xs text-charcoal-muted block">Nightly Rate</span>
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-3xl font-bold text-forest">
              {formatINR(basePrice)}
            </span>
            <span className="text-xs text-charcoal-muted font-medium">/ night</span>
          </div>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-ukorange/10 text-ukorange text-[11px] font-semibold rounded-full">
            <Sparkles className="w-3 h-3" />
            Host Approval Required
          </span>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Room Selection */}
        {rooms.length > 1 && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted mb-1">
              Select Room Type
            </label>
            <select
              suppressHydrationWarning
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full p-2.5 text-sm bg-ivory-warm border border-forest/20 rounded-lg font-medium text-charcoal focus:ring-2 focus:ring-forest focus:outline-none"
            >
              {rooms.map(r => (
                <option key={r.id} value={r.id}>
                  {r.room_name} — {formatINR(Number(r.base_price))}/night (Max {r.max_guests} guests)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Dates Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-ivory-warm p-2.5 rounded-lg border border-forest/20">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-muted mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-forest" />
              Check-in
            </label>
            <input
              suppressHydrationWarning
              type="date"
              required
              min={todayStr}
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full bg-transparent text-xs font-semibold text-charcoal focus:outline-none"
            />
          </div>

          <div className="bg-ivory-warm p-2.5 rounded-lg border border-forest/20">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-muted mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-forest" />
              Check-out
            </label>
            <input
              suppressHydrationWarning
              type="date"
              required
              min={checkIn || todayStr}
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full bg-transparent text-xs font-semibold text-charcoal focus:outline-none"
            />
          </div>
        </div>

        {/* Guest Count */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-charcoal-muted mb-1">Adults</label>
            <select
              suppressHydrationWarning
              value={adults}
              onChange={(e) => setAdults(Number(e.target.value))}
              className="w-full p-2 text-xs bg-ivory-warm border border-forest/20 rounded-lg font-medium"
            >
              {[1, 2, 3, 4, 5, 6].map(n => (
                <option key={n} value={n}>{n} Adult{n > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-charcoal-muted mb-1">Children</label>
            <select
              suppressHydrationWarning
              value={children}
              onChange={(e) => setChildren(Number(e.target.value))}
              className="w-full p-2 text-xs bg-ivory-warm border border-forest/20 rounded-lg font-medium"
            >
              {[0, 1, 2, 3, 4].map(n => (
                <option key={n} value={n}>{n} Children</option>
              ))}
            </select>
          </div>
        </div>

        {/* Guest Contact Information */}
        <div className="pt-2 border-t border-forest/10 space-y-2">
          <span className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
            Guest Details
          </span>
          <input
            suppressHydrationWarning
            type="text"
            required
            placeholder="Full Name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="w-full p-2 text-xs bg-ivory-warm border border-forest/20 rounded-lg font-medium focus:outline-none focus:ring-1 focus:ring-forest"
          />
          <input
            suppressHydrationWarning
            type="email"
            required
            placeholder="Email Address"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            className="w-full p-2 text-xs bg-ivory-warm border border-forest/20 rounded-lg font-medium focus:outline-none focus:ring-1 focus:ring-forest"
          />
          <input
            suppressHydrationWarning
            type="tel"
            required
            placeholder="Phone Number (+91 ...)"
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            className="w-full p-2 text-xs bg-ivory-warm border border-forest/20 rounded-lg font-medium focus:outline-none focus:ring-1 focus:ring-forest"
          />
          <textarea
            suppressHydrationWarning
            placeholder="Special requests or arrival time (optional)"
            rows={2}
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            className="w-full p-2 text-xs bg-ivory-warm border border-forest/20 rounded-lg font-medium focus:outline-none focus:ring-1 focus:ring-forest"
          />
        </div>

        {/* Price Calculation Breakdown */}
        {priceCalculation && priceCalculation.nights > 0 && (
          <div className="pt-3 border-t border-forest/10 space-y-2 text-xs">
            <div className="flex justify-between text-charcoal-muted">
              <span>{formatINR(basePrice)} × {priceCalculation.nights} night{priceCalculation.nights > 1 ? 's' : ''}</span>
              <span className="font-medium text-charcoal">{formatINR(priceCalculation.roomTotal)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-forest pt-2 border-t border-forest/10">
              <span>Estimated Total (INR)</span>
              <span className="font-serif text-lg">{priceCalculation.formattedTotal}</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          suppressHydrationWarning
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-forest hover:bg-forest-hover disabled:bg-forest/50 text-white font-semibold text-sm rounded-xl shadow-md transition-all hover:shadow-lg flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="inline-block animate-pulse">Checking Availability...</span>
          ) : (
            <>
              <span>Request to Book</span>
              <Sparkles className="w-4 h-4 text-ukorange" />
            </>
          )}
        </button>

        {/* WhatsApp Direct Enquiry Action (Directive C) */}
        <a
          href={`https://wa.me/919876543210?text=${encodeURIComponent(
            `Hello Uttarkunth, I am inquiring about booking ${propertyName}${
              checkIn && checkOut ? ` for dates ${checkIn} to ${checkOut}` : ''
            }.`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <span>💬</span>
          <span>Quick Enquiry via WhatsApp</span>
        </a>

        <p className="text-[11px] text-charcoal-muted text-center leading-tight">
          No online payment is currently collected by Uttarkunth. Guests pay their hosts directly at the property.
        </p>
      </form>
    </div>
  );
}
