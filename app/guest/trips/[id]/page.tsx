import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatINR } from '@/lib/utils';
import { calculateNights } from '@/lib/booking-calculator';
import { isPlatformAdmin } from '@/lib/constants';
import { MapPin, Calendar, Users, ArrowLeft, Clock, CheckCircle2, XCircle, AlertCircle, Home } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface TripDetailPageProps {
  params: {
    id: string;
  };
}

export default async function TripDetailPage({ params }: TripDetailPageProps) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/guest/trips/${params.id}`);
  }

  const adminClient = createAdminClient();

  const { data: booking, error } = await adminClient
    .from('stay_bookings')
    .select('*, properties(id, name, slug, address, village, district, state, photos), room_units(id, room_name, base_price)')
    .eq('id', params.id)
    .single();

  if (error || !booking) {
    notFound();
  }

  // Verify ownership: guest must match user ID or email
  const isOwner = booking.guest_user_id === user.id || booking.guest_email?.toLowerCase() === user.email?.toLowerCase();
  const isAdmin = isPlatformAdmin(user.email);

  if (!isOwner && !isAdmin) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <h2 className="font-serif text-2xl font-bold text-red-700">Access Restricted</h2>
        <p className="text-xs text-charcoal-muted mt-2">You can only view your own booking requests.</p>
        <Link href="/guest/trips" className="mt-4 inline-block px-4 py-2 bg-forest text-white text-xs font-semibold rounded-lg">
          Back to Trips
        </Link>
      </div>
    );
  }

  const nights = calculateNights(booking.check_in, booking.check_out);
  const prop = booking.properties as any;
  const room = booking.room_units as any;
  const photos = prop?.photos && Array.isArray(prop.photos) ? prop.photos : [];
  const photoUrl = photos[0] || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80';

  const isCancellable = booking.status === 'pending' || (booking.status === 'confirmed' && new Date(booking.check_in) > new Date());

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href="/guest/trips"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-muted hover:text-forest transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Trips</span>
        </Link>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-forest/15 shadow-soft space-y-8">
        {/* Status Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-forest/10">
          <div>
            <span className="font-mono text-xs font-semibold text-charcoal-muted uppercase tracking-wider block">
              Reference: {booking.booking_reference}
            </span>
            <h1 className="font-serif text-3xl font-bold text-forest mt-1">
              {prop?.name || 'Uttarkunth Stay'}
            </h1>
            <p className="text-xs text-charcoal-muted flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 text-ukorange" />
              <span>{prop?.address || `${prop?.village}, ${prop?.district}`}</span>
            </p>
          </div>

          <div className="flex items-center">
            {booking.status === 'confirmed' && (
              <span className="px-3.5 py-1.5 bg-green-100 text-green-800 text-xs font-bold rounded-full flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Confirmed by Host
              </span>
            )}
            {booking.status === 'declined' && (
              <span className="px-3.5 py-1.5 bg-red-100 text-red-800 text-xs font-bold rounded-full flex items-center gap-1.5">
                <XCircle className="w-4 h-4" />
                Declined by Host
              </span>
            )}
            {booking.status === 'cancelled' && (
              <span className="px-3.5 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">
                Cancelled
              </span>
            )}
            {booking.status === 'pending' && (
              <span className="px-3.5 py-1.5 bg-ukorange/15 text-ukorange text-xs font-bold rounded-full flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Pending Host Review
              </span>
            )}
          </div>
        </div>

        {/* Stay Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-serif text-xl font-bold text-forest">Reservation Breakdown</h3>
            <div className="bg-ivory-warm p-5 rounded-2xl border border-forest/10 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-charcoal-muted">Room Type</span>
                <span className="font-semibold text-charcoal">{room?.room_name || 'Mountain View Room'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-muted">Dates</span>
                <span className="font-semibold text-charcoal">{booking.check_in} to {booking.check_out}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-muted">Duration</span>
                <span className="font-semibold text-charcoal">{nights} Night{nights > 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-muted">Guests</span>
                <span className="font-semibold text-charcoal">{booking.adults} Adults {booking.children > 0 ? `, ${booking.children} Children` : ''}</span>
              </div>
              <div className="pt-3 border-t border-forest/10 flex justify-between text-sm font-bold text-forest">
                <span>Estimated Total (INR)</span>
                <span className="font-serif text-lg">{formatINR(Number(booking.total_estimate || 0))}</span>
              </div>
            </div>

            {booking.host_notes && (
              <div className="p-4 bg-blue-50/50 rounded-xl border border-ukblue/20 text-xs space-y-1">
                <strong className="text-ukblue-deep block">Note From Host:</strong>
                <p className="text-charcoal-muted italic">{booking.host_notes}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="font-serif text-xl font-bold text-forest">Accommodation View</h3>
            <div className="relative h-48 rounded-2xl overflow-hidden shadow-sm">
              <img
                src={photoUrl}
                alt={prop?.name || 'Stay view'}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-xs text-charcoal-muted leading-relaxed">
              <strong className="text-charcoal block mb-1">Check-in Instructions:</strong>
              Check-in is from 12:00 PM. Present this booking reference upon arrival. Cash or local UPI payment is settled with the host on-site.
            </div>
          </div>
        </div>

        {/* Cancellation Action */}
        {isCancellable && (
          <div className="pt-6 border-t border-forest/10 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-charcoal block">Need to change your plans?</span>
              <span className="text-[11px] text-charcoal-muted">You can cancel this request without fee before check-in.</span>
            </div>
            <form action="/api/bookings/cancel" method="POST">
              <input type="hidden" name="booking_reference" value={booking.booking_reference} />
              <button
                type="submit"
                className="px-4 py-2 border border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold rounded-xl transition-colors"
              >
                Cancel Request
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
