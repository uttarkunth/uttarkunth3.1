import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkIsPlatformAdmin } from '@/lib/auth';
import { formatINR } from '@/lib/utils';
import { AccountNav } from '@/components/account-nav';
import {
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Compass,
  Luggage,
  Calendar,
  AlertCircle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TripsPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/trips');
  }

  const isAdmin = await checkIsPlatformAdmin(user.id);
  const adminClient = createAdminClient();

  // Check host status
  let isHost = false;
  try {
    const { count: ownedCount } = await adminClient
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('host_id', user.id);
    if ((ownedCount || 0) > 0) {
      isHost = true;
    } else {
      const { count: assignedCount } = await (adminClient.from('property_hosts') as any)
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('role', ['manager', 'co_host']);
      isHost = (assignedCount || 0) > 0;
    }
  } catch {
    isHost = false;
  }

  // Query trips for this guest (by user_id or email)
  const { data: bookings } = await adminClient
    .from('stay_bookings')
    .select('id, booking_reference, check_in, check_out, adults, children, status, total_estimate, created_at, properties(id, name, slug, village, district, photos)')
    .or(`guest_user_id.eq.${user.id},guest_email.eq.${user.email}`)
    .order('created_at', { ascending: false });

  const trips = bookings || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Confirmed
          </span>
        );
      case 'declined':
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
            <XCircle className="w-3.5 h-3.5" />
            Declined by Host
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-ukorange/15 text-ukorange text-xs font-semibold rounded-full">
            <Clock className="w-3.5 h-3.5" />
            Pending Host Approval
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-warm-canvas/60">
      <AccountNav isAdmin={isAdmin} isHost={isHost} tripsCount={trips.length} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-ukorange">Guest Portal</span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-forest mt-1">My Himalayan Trips</h1>
            <p className="text-xs text-charcoal-muted mt-1">
              Track your booking requests, host approval status, and upcoming mountain stays
            </p>
          </div>

          <Link
            href="/stays"
            className="self-start sm:self-auto px-4 py-2 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Discover Stays</span>
          </Link>
        </div>

        {/* Direct Host Payment Policy Notice */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-forest/15 shadow-xs flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-forest/10 text-forest flex items-center justify-center flex-shrink-0 mt-0.5">
            <Luggage className="w-4 h-4 text-forest" />
          </div>
          <div className="text-xs text-charcoal-muted leading-relaxed">
            <strong className="text-forest block mb-0.5">Transparent Direct Host Settlement:</strong>
            No online payment is currently collected by Uttarkunth. Guests pay their hosts directly at the property upon check-in via cash or local UPI.
          </div>
        </div>

        {trips.length > 0 ? (
          <div className="space-y-4">
            {trips.map((b: any) => {
              const prop = b.properties;
              const photos = prop?.photos && Array.isArray(prop.photos) ? prop.photos : [];
              const photoUrl = photos[0] || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=400&q=80';

              return (
                <div
                  key={b.id}
                  className="bg-white rounded-3xl p-6 border border-forest/15 shadow-soft hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden relative flex-shrink-0 bg-forest/10 border border-forest/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoUrl}
                        alt={prop?.name || 'Stay'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-charcoal-muted">
                          {b.booking_reference}
                        </span>
                        {getStatusBadge(b.status)}
                      </div>
                      <h3 className="font-serif text-xl font-bold text-forest">
                        {prop?.name || 'Uttarkunth Stay'}
                      </h3>
                      <p className="text-xs text-charcoal-muted flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-ukorange" />
                        <span>{prop?.village || 'Jari'}, {prop?.district || 'Kullu'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between md:justify-end gap-6 pt-4 md:pt-0 border-t md:border-t-0 border-forest/10">
                    <div className="text-left sm:text-right">
                      <span className="text-[11px] uppercase tracking-wider text-charcoal-muted block">Dates</span>
                      <span className="text-xs font-semibold text-charcoal">
                        {b.check_in} → {b.check_out}
                      </span>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[11px] uppercase tracking-wider text-charcoal-muted block">Estimated Total</span>
                      <span className="font-serif text-lg font-bold text-forest">
                        {formatINR(Number(b.total_estimate || 0))}
                      </span>
                    </div>

                    <Link
                      href={`/guest/trips/${b.id}`}
                      className="px-4 py-2 bg-ivory-warm hover:bg-forest hover:text-white text-forest text-xs font-semibold rounded-xl border border-forest/20 transition-all flex items-center gap-1"
                    >
                      <span>Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-forest/15 shadow-soft max-w-lg mx-auto space-y-4">
            <Compass className="w-12 h-12 text-forest/40 mx-auto" />
            <h3 className="font-serif text-2xl font-bold text-forest">No Trips Booked Yet</h3>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Ready to explore the mountains? Discover our approved authentic homestays in Jari, Parvati Valley and submit your first booking request.
            </p>
            <Link
              href="/stays"
              className="inline-block px-5 py-2.5 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              Discover Stays
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
