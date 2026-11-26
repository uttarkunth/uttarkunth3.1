'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Calendar,
  Users,
  Phone,
  Mail,
  Home,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import {
  formatBookingReference,
  formatInrCurrency,
  getBookingEstimatedValue,
  getBookingGuestCount,
  getBookingNights,
  getBookingPropertyTitle,
  getBookingRoomName,
  getBookingStatus,
  type HostBookingRecord,
} from '@/lib/host-dashboard';

interface HostBookingDetailModalProps {
  booking: HostBookingRecord | null;
  onClose: () => void;
  onDecisionSuccess?: (bookingId: string, newStatus: 'confirmed' | 'declined', hostNotes?: string) => void;
}

export function HostBookingDetailModal({
  booking,
  onClose,
  onDecisionSuccess,
}: HostBookingDetailModalProps) {
  const [hostNotes, setHostNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState<'confirm' | 'decline' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (booking) {
      setHostNotes(booking.host_notes || '');
      setErrorMsg(null);
      setSubmittingAction(null);
    }
  }, [booking]);

  useEffect(() => {
    if (!booking) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [booking, onClose]);

  if (!booking) return null;

  const status = getBookingStatus(booking);
  const isPending = status === 'pending';
  const isConfirmed = status === 'confirmed';
  const isCompleted = status === 'completed';
  const bookingRef = formatBookingReference(booking);
  const propertyTitle = getBookingPropertyTitle(booking);
  const roomName = getBookingRoomName(booking);
  const nights = getBookingNights(booking);
  const guestsCount = getBookingGuestCount(booking);
  const estimatedValue = getBookingEstimatedValue(booking);

  const handleDecision = async (action: 'confirm' | 'decline') => {
    setErrorMsg(null);
    setSubmittingAction(action);

    try {
      const res = await fetch('/api/bookings/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: booking.id,
          action,
          host_notes: hostNotes.trim() ? hostNotes.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Could not update booking decision.');
      }

      const nextStatus = action === 'confirm' ? 'confirmed' : 'declined';
      onDecisionSuccess?.(booking.id, nextStatus, hostNotes.trim() || undefined);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to process booking decision.');
    } finally {
      setSubmittingAction(null);
    }
  };

  const whatsappHref = booking.guest_phone
    ? `https://api.whatsapp.com/send?phone=${booking.guest_phone.replace(/[^0-9]/g, '')}&text=${encodeURIComponent(
        `Namaste ${booking.guest_name}, regarding your stay booking ${bookingRef} at ${propertyTitle} (${booking.check_in} to ${booking.check_out})...`
      )}`
    : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Reservation details for ${booking.guest_name}`}
      data-testid="host-booking-detail-modal"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#101C16]/60 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full sm:max-w-[660px] max-h-[90vh] overflow-y-auto rounded-t-[20px] sm:rounded-[18px] bg-[#FFFDF9] border border-[#D9CCB8] shadow-2xl p-4 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E5DEC9]">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#C55B23]">
                Reservation Details
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                  isConfirmed
                    ? 'bg-[#E8F4EC] text-[#1F6A3B] border border-[#1F6A3B]/20'
                    : isPending
                    ? 'bg-[#FDF3E1] text-[#9A6216] border border-[#9A6216]/20'
                    : isCompleted
                    ? 'bg-[#EAE7E0] text-[#4C473E] border border-[#4C473E]/15'
                    : 'bg-[#FBEAE7] text-[#A53525] border border-[#A53525]/20'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {isPending
                  ? 'Pending · Dates open'
                  : isConfirmed
                  ? 'Confirmed · Dates locked'
                  : isCompleted
                  ? 'Completed stay'
                  : 'Declined / Cancelled'}
              </span>
            </div>
            <h3 className="font-serif text-2xl font-bold text-[#29251F] mt-1">
              {booking.guest_name} · {bookingRef}
            </h3>
          </div>

          <button
            type="button"
            data-testid="host-booking-modal-close"
            onClick={onClose}
            aria-label="Close reservation details"
            className="w-9 h-9 rounded-xl bg-[#F5F0E6] hover:bg-[#EFE7D8] border border-[#D9CCB8] flex items-center justify-center text-[#29251F] cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-[#FBEAE7] border border-[#A53525]/25 text-[#A53525] text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Detail Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-xl bg-[#F5F0E6]/80 border border-[#E5DEC9] space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#665E52] flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-[#263D32]" /> Property &amp; Room
            </span>
            <strong className="block text-sm font-bold text-[#29251F]">
              {propertyTitle}
            </strong>
            <span className="text-[#665E52] block">{roomName}</span>
          </div>

          <div className="p-3 rounded-xl bg-[#F5F0E6]/80 border border-[#E5DEC9] space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#665E52] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#263D32]" /> Stay Dates
            </span>
            <strong className="block text-sm font-bold text-[#29251F] tabular-nums">
              {booking.check_in} &rarr; {booking.check_out}
            </strong>
            <span className="text-[#665E52] block">
              {nights} {nights === 1 ? 'night' : 'nights'} · {guestsCount}{' '}
              {guestsCount === 1 ? 'guest' : 'guests'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#F5F0E6]/80 border border-[#E5DEC9] space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#665E52] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#263D32]" /> Estimated Booking Value
            </span>
            <strong className="block text-base font-extrabold text-[#263D32] tabular-nums">
              {formatInrCurrency(estimatedValue)}
            </strong>
            <span className="text-[#665E52] block">
              Paid directly by guest to host at property
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#F5F0E6]/80 border border-[#E5DEC9] space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#665E52] flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#263D32]" /> Guest Contact
            </span>
            <strong className="block text-sm font-bold text-[#29251F]">
              {booking.guest_phone || 'Phone not provided'}
            </strong>
            {booking.guest_email && (
              <span className="text-[#665E52] block truncate flex items-center gap-1">
                <Mail className="w-3 h-3 shrink-0" /> {booking.guest_email}
              </span>
            )}
          </div>
        </div>

        {/* Guest Special Requests */}
        <div className="p-3.5 rounded-xl bg-[#F5F0E6]/80 border border-[#E5DEC9] space-y-1 text-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#665E52] flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#C55B23]" /> Guest Request / Note
          </span>
          <p className="text-[#29251F] font-medium leading-relaxed">
            {booking.special_requests || 'No special request submitted by guest.'}
          </p>
        </div>

        {/* Host Notes / Check-in Guidance */}
        <div className="space-y-1.5 text-xs">
          <label
            htmlFor="booking-modal-host-notes"
            className="block font-bold text-[#665E52]"
          >
            Host Note &amp; Arrival Guidance
          </label>
          <textarea
            id="booking-modal-host-notes"
            rows={2}
            value={hostNotes}
            onChange={(e) => setHostNotes(e.target.value)}
            placeholder="Share road condition notes, landmark directions, or check-in guidance..."
            className="w-full px-3 py-2 rounded-xl bg-[#FFFDF9] border border-[#D9CCB8] text-xs text-[#29251F] focus:outline-none focus:border-[#263D32]"
          />
          <p className="text-[11px] text-[#665E52]">
            {isPending
              ? 'Pending requests do not block calendar availability until you accept.'
              : 'No online payment is collected by Uttarkunth. Guests pay you directly at the property.'}
          </p>
        </div>

        {/* Action Footer */}
        <div className="pt-3 border-t border-[#E5DEC9] flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E8F4EC] hover:bg-[#D5ECDD] text-[#1F6A3B] border border-[#1F6A3B]/20 text-xs font-bold transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp Guest</span>
              </a>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isPending && (
              <>
                <button
                  type="button"
                  disabled={submittingAction !== null}
                  onClick={() => handleDecision('decline')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FBEAE7] hover:bg-[#F7D7D2] text-[#A53525] border border-[#A53525]/25 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>
                    {submittingAction === 'decline' ? 'Declining...' : 'Decline Request'}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={submittingAction !== null}
                  onClick={() => handleDecision('confirm')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1F6A3B] hover:bg-[#18542E] text-[#FFFDF9] text-xs font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {submittingAction === 'confirm' ? 'Accepting...' : 'Accept & Lock Dates'}
                  </span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-[#F5F0E6] hover:bg-[#EFE7D8] border border-[#D9CCB8] text-[#29251F] text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
