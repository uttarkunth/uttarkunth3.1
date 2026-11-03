import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getHostProperties, getHostBookings, DIRECT_HOST_PAYMENT_NOTICE } from '@/lib/host';
import { HostSubnav } from '@/components/host-subnav';
import { AgreementAcceptor } from '@/components/host/agreement-acceptor';
import { formatINR } from '@/lib/utils';
import { 
  Home, Inbox, CheckCircle2, Clock, PlusCircle, AlertCircle, 
  ArrowRight, Sparkles, MapPin, Calendar, Users, Phone, Mail, Shield 
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HostOverviewPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/account/stays/host');
  }

  const { properties, isHost, isAdmin } = await getHostProperties(user.id);
  const propertyIds = properties.map((p) => p.id);
  const bookings = await getHostBookings(propertyIds);

  const adminClient = createAdminClient();
  const { data: rawAgreements } = await adminClient
    .from('host_agreements')
    .select('*, properties(name)')
    .in('property_id', propertyIds.length > 0 ? propertyIds : ['00000000-0000-0000-0000-000000000000']);

  const pendingRequests = bookings.filter((b) => b.status === 'pending');
  const confirmedStays = bookings.filter((b) => b.status === 'confirmed');

  // Compute total configured rooms
  const totalRooms = properties.reduce(
    (acc, p) => acc + (Array.isArray(p.room_units) ? p.room_units.length : 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* If host has assigned properties or is admin */}
      {isHost ? (
        <>
          <HostSubnav
            pendingCount={pendingRequests.length}
            propertiesCount={properties.length}
          />

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-ukorange">
                  Host Workspace
                </span>
                {isAdmin && (
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-terracotta/10 text-terracotta border border-terracotta/20 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Supervisor Mode
                  </span>
                )}
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-forest mt-1">
                Property & Reservation Management
              </h1>
              <p className="text-sm text-charcoal-muted mt-1">
                Logged in as <strong>{user.email}</strong>. Manage your Himalayan homestays, availability, and guest requests.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/account/stays/host/calendar"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-ivory-warm hover:bg-forest/10 text-forest text-xs font-semibold rounded-xl border border-forest/20 shadow-xs transition-all"
              >
                <Calendar className="w-4 h-4 text-forest" />
                <span>Stay Calendar</span>
              </Link>
            </div>
          </div>

          {/* Transparent Direct Payment Policy Banner */}
          <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 flex items-start gap-3 shadow-xs">
            <Sparkles className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs text-emerald-900">
              <span className="font-bold">Transparent Host Direct Payment Model:</span>
              <p className="text-emerald-800">{DIRECT_HOST_PAYMENT_NOTICE}</p>
            </div>
          </div>

          {/* Actionable Bilateral Agreements Review for Host */}
          <AgreementAcceptor agreements={(rawAgreements as any) || []} />

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-forest/15 shadow-soft">
              <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted block mb-1">
                Assigned Properties
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl font-bold text-forest">{properties.length}</span>
                <span className="text-xs text-charcoal-muted">stay{properties.length !== 1 ? 's' : ''}</span>
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-forest/15 shadow-soft">
              <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted block mb-1">
                Pending Requests
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl font-bold text-ukorange">{pendingRequests.length}</span>
                <span className="text-xs text-charcoal-muted">awaiting decision</span>
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-forest/15 shadow-soft">
              <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted block mb-1">
                Confirmed Stays
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl font-bold text-green-700">{confirmedStays.length}</span>
                <span className="text-xs text-charcoal-muted">upcoming visits</span>
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-forest/15 shadow-soft">
              <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted block mb-1">
                Total Room Units
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl font-bold text-forest">{totalRooms}</span>
                <span className="text-xs text-charcoal-muted">units listed</span>
              </div>
            </div>
          </div>

          {/* Action Needed: Pending Booking Requests */}
          {pendingRequests.length > 0 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-ukorange/30 ring-1 ring-ukorange/20 shadow-soft space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-forest/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-ukorange/15 text-ukorange flex items-center justify-center">
                    <Inbox className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-forest">
                      Action Required: Incoming Guest Requests
                    </h2>
                    <p className="text-xs text-charcoal-muted">
                      Dates remain open to other guests until you formally approve a request.
                    </p>
                  </div>
                </div>

                <Link
                  href="/account/stays/host/bookings"
                  className="text-xs font-bold text-ukorange hover:text-forest flex items-center gap-1 transition-colors"
                >
                  <span>View All Bookings ({bookings.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-4">
                {pendingRequests.slice(0, 3).map((b) => (
                  <div
                    key={b.id}
                    className="p-5 bg-ivory-warm/60 rounded-2xl border border-forest/15 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-charcoal">
                            #{b.booking_reference}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-ukorange/20 text-ukorange">
                            Decision Needed
                          </span>
                        </div>
                        <h3 className="font-serif text-lg font-bold text-forest mt-1">
                          {b.guest_name} —{' '}
                          <span className="font-normal text-charcoal-muted">
                            {b.properties?.name} ({b.room_units?.room_name})
                          </span>
                        </h3>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-[11px] text-charcoal-muted uppercase tracking-wider block">
                          Total Estimate
                        </span>
                        <span className="font-serif text-xl font-bold text-forest">
                          {formatINR(Number(b.total_estimate || 0))}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-2.5 bg-white rounded-xl border border-forest/10 space-y-0.5">
                        <span className="text-charcoal-muted uppercase text-[10px] font-semibold flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-forest" /> Stay Dates
                        </span>
                        <span className="font-semibold text-charcoal">
                          {b.check_in} → {b.check_out}
                        </span>
                      </div>

                      <div className="p-2.5 bg-white rounded-xl border border-forest/10 space-y-0.5">
                        <span className="text-charcoal-muted uppercase text-[10px] font-semibold flex items-center gap-1">
                          <Users className="w-3 h-3 text-forest" /> Guests
                        </span>
                        <span className="font-semibold text-charcoal">
                          {b.adults} Adults {b.children > 0 ? `, ${b.children} Children` : ''}
                        </span>
                      </div>

                      <div className="p-2.5 bg-white rounded-xl border border-forest/10 space-y-0.5">
                        <span className="text-charcoal-muted uppercase text-[10px] font-semibold flex items-center gap-1">
                          <Phone className="w-3 h-3 text-forest" /> Contact
                        </span>
                        <span className="font-semibold text-charcoal truncate block">
                          {b.guest_phone}
                        </span>
                      </div>
                    </div>

                    {b.special_requests && (
                      <p className="text-xs bg-white/80 p-2.5 rounded-xl border border-forest/10 text-charcoal-muted">
                        <strong className="text-forest">Guest Request: </strong> {b.special_requests}
                      </p>
                    )}

                    <div className="pt-2 flex items-center justify-end gap-3">
                      <form action="/api/bookings/decision" method="POST">
                        <input type="hidden" name="booking_id" value={b.id} />
                        <input type="hidden" name="action" value="decline" />
                        <button
                          type="submit"
                          className="px-4 py-2 border border-forest/20 text-charcoal-muted hover:text-red-700 hover:border-red-300 text-xs font-semibold rounded-xl transition-all"
                        >
                          Decline Request
                        </button>
                      </form>

                      <form action="/api/bookings/decision" method="POST">
                        <input type="hidden" name="booking_id" value={b.id} />
                        <input type="hidden" name="action" value="confirm" />
                        <button
                          type="submit"
                          className="px-5 py-2 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4 text-ukorange" />
                          <span>Approve Stay</span>
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assigned Properties Grid */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-forest/10">
              <div>
                <h2 className="font-serif text-2xl font-bold text-forest">My Assigned Properties</h2>
                <p className="text-xs text-charcoal-muted">
                  Configure rooms, update photos, edit amenities, and review live publication status.
                </p>
              </div>

              <Link
                href="/account/stays/host/properties"
                className="text-xs font-bold text-forest hover:text-ukorange flex items-center gap-1 transition-colors"
              >
                <span>View Full Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {properties.map((p) => {
                const photos = Array.isArray(p.photos) ? (p.photos as string[]) : [];
                const photoUrl = photos[0] || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80';
                const rooms = Array.isArray(p.room_units) ? p.room_units : [];

                return (
                  <div
                    key={p.id}
                    className="bg-ivory-warm/40 rounded-2xl overflow-hidden border border-forest/15 shadow-xs flex flex-col justify-between"
                  >
                    <div className="relative h-44 w-full bg-forest/10">
                      <img src={photoUrl} alt={p.name} className="w-full h-full object-cover" />
                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        <span
                          className={`px-2.5 py-1 text-xs font-bold uppercase rounded-full shadow-xs ${
                            p.moderation_status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {p.moderation_status}
                        </span>
                        <span className="px-2.5 py-1 bg-white/90 text-forest text-xs font-semibold rounded-full shadow-xs">
                          {p.published ? 'Live' : 'Draft'}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <h3 className="font-serif text-xl font-bold text-forest">{p.name}</h3>
                        <p className="text-xs text-charcoal-muted flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-ukorange" />
                          <span>
                            {p.village}, {p.district}, {p.state}
                          </span>
                        </p>
                        <p className="text-xs text-charcoal-muted line-clamp-2 mt-1">
                          {p.description}
                        </p>
                        <div className="text-xs font-semibold text-charcoal pt-1">
                          {rooms.length} Room Unit{rooms.length !== 1 ? 's' : ''} Configured
                        </div>
                      </div>

                      <div className="pt-3 border-t border-forest/10 flex items-center justify-between">
                        <Link
                          href={`/stays/${p.slug}`}
                          className="text-xs font-semibold text-charcoal-muted hover:text-forest transition-colors"
                        >
                          Public Preview
                        </Link>

                        <Link
                          href={`/account/stays/host/properties/${p.id}`}
                          className="px-3.5 py-1.5 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                        >
                          Manage Property & Rooms
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        /* Authentic Empty State for Guests without Assigned Properties */
        <div className="max-w-3xl mx-auto py-8 sm:py-12 space-y-8">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-ukorange">
              Uttarkunth Stays Ecosystem
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-forest">
              Mountain Homestay & Retreat Host Workspace
            </h1>
            <p className="text-sm text-charcoal-muted max-w-xl mx-auto">
              Welcome to the host workspace. Currently, no verified properties are assigned to your account ({user.email}).
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-forest/15 shadow-soft space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b border-forest/10">
              <div className="w-12 h-12 rounded-2xl bg-forest/10 text-forest flex items-center justify-center flex-shrink-0">
                <Home className="w-6 h-6 text-ukorange" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-forest">
                  Partnering with Himalayan Homestays
                </h2>
                <p className="text-xs text-charcoal-muted mt-0.5">
                  Direct host settlement, community-first values, and authentic mountain hospitality.
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-charcoal leading-relaxed">
              <p>
                Uttarkunth partners with authentic village homestays, traditional stone cottages, and eco-retreats across Himachal Pradesh and Uttarakhand. We empower mountain hosts with direct booking requests, personal guest interactions, and a transparent payment model where guests pay you directly upon arrival.
              </p>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200/80 text-emerald-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-700" /> Transparent Host Terms:
                </span>
                <p className="text-emerald-800">{DIRECT_HOST_PAYMENT_NOTICE}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-forest/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link
                href="/stays"
                className="w-full sm:w-auto px-5 py-2.5 bg-ivory-warm hover:bg-forest/10 border border-forest/20 text-forest text-xs font-semibold rounded-xl text-center transition-all"
              >
                Explore Authentic Stays
              </Link>

              <Link
                href="/stays/partner"
                className="w-full sm:w-auto px-6 py-2.5 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl shadow-xs text-center flex items-center justify-center gap-2 transition-all"
              >
                <span>Apply to Partner as a Homestay</span>
                <ArrowRight className="w-4 h-4 text-ukorange" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
