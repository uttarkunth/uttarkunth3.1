import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { HostNav } from '@/components/host-nav';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatINR } from '@/lib/utils';
import { isPlatformAdmin } from '@/lib/constants';
import { Home, Inbox, CheckCircle2, Clock, PlusCircle, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HostDashboardPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/host/dashboard');
  }

  const adminClient = createAdminClient();

  // Query properties owned by this host (or all if platform admin)
  const isAdmin = isPlatformAdmin(user.email);

  let propQuery = adminClient.from('properties').select('id, name, slug, moderation_status, published, village, district');
  if (!isAdmin) {
    propQuery = propQuery.eq('host_id', user.id);
  }
  const { data: properties } = await propQuery;

  const myProperties = properties || [];
  const propertyIds = myProperties.map(p => p.id);

  // Query bookings for these properties
  let bookings: any[] = [];
  if (propertyIds.length > 0) {
    const { data: bData } = await adminClient
      .from('stay_bookings')
      .select('id, booking_reference, check_in, check_out, adults, children, status, total_estimate, guest_name, guest_email, guest_phone, created_at, properties(name)')
      .in('property_id', propertyIds)
      .order('created_at', { ascending: false });
    bookings = bData || [];
  }

  const pendingRequests = bookings.filter(b => b.status === 'pending');
  const confirmedStays = bookings.filter(b => b.status === 'confirmed');

  return (
    <div className="pb-16">
      <HostNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-ukorange">Host Management</span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-forest mt-1">Host Dashboard</h1>
            <p className="text-sm text-charcoal-muted mt-1">
              Welcome back, <strong>{user.email}</strong>. Manage your mountain properties and guest requests.
            </p>
          </div>

          <Link
            href="/host/properties/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4 text-ukorange" />
            <span>Apply to List Property</span>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 bg-white rounded-2xl border border-forest/15 shadow-soft">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted block mb-1">
              Properties Listed
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-forest">{myProperties.length}</span>
              <span className="text-xs text-charcoal-muted">stay{myProperties.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-forest/15 shadow-soft">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted block mb-1">
              Pending Requests
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-ukorange">{pendingRequests.length}</span>
              <span className="text-xs text-charcoal-muted">awaiting approval</span>
            </div>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-forest/15 shadow-soft">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted block mb-1">
              Confirmed Stays
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-green-700">{confirmedStays.length}</span>
              <span className="text-xs text-charcoal-muted">stays</span>
            </div>
          </div>

          <div className="p-6 bg-ivory-warm rounded-2xl border border-forest/20 shadow-soft">
            <span className="text-xs font-semibold uppercase tracking-wider text-forest block mb-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-ukorange" />
              Commission Tier
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-forest">0%</span>
              <span className="text-xs text-charcoal-muted font-medium">Introductory (Year 1)</span>
            </div>
          </div>
        </div>

        {/* Pending Requests Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-forest/10">
            <div>
              <h2 className="font-serif text-2xl font-bold text-forest">Incoming Booking Requests</h2>
              <p className="text-xs text-charcoal-muted mt-0.5">Host approval is mandatory before any stay is confirmed</p>
            </div>
            <Link
              href="/host/bookings"
              className="text-xs font-semibold text-forest hover:text-ukorange transition-colors flex items-center gap-1"
            >
              <span>View All Requests</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {pendingRequests.length > 0 ? (
            <div className="divide-y divide-forest/10">
              {pendingRequests.map((b: any) => (
                <div key={b.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-charcoal">{b.booking_reference}</span>
                      <span className="px-2 py-0.5 bg-ukorange/15 text-ukorange text-[10px] font-bold uppercase rounded-full">
                        Pending
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-forest">
                      {b.guest_name} — {b.properties?.name}
                    </p>
                    <p className="text-xs text-charcoal-muted">
                      Dates: <strong>{b.check_in}</strong> to <strong>{b.check_out}</strong> • {b.adults} Adults {b.children > 0 ? `, ${b.children} Children` : ''}
                    </p>
                    <p className="text-xs text-charcoal-muted">
                      Contact: {b.guest_email} | {b.guest_phone}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-serif text-lg font-bold text-forest mr-2">
                      {formatINR(Number(b.total_estimate || 0))}
                    </span>
                    <form action="/api/bookings/decision" method="POST">
                      <input type="hidden" name="booking_id" value={b.id} />
                      <input type="hidden" name="action" value="confirm" />
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-lg shadow-sm"
                      >
                        Approve
                      </button>
                    </form>
                    <form action="/api/bookings/decision" method="POST">
                      <input type="hidden" name="booking_id" value={b.id} />
                      <input type="hidden" name="action" value="decline" />
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 border border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold rounded-lg"
                      >
                        Decline
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-charcoal-muted">
              No pending booking requests right now. New requests will appear here for your approval.
            </div>
          )}
        </div>

        {/* My Properties Quick View */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-forest/10">
            <div>
              <h2 className="font-serif text-2xl font-bold text-forest">My Accommodations</h2>
              <p className="text-xs text-charcoal-muted mt-0.5">Listings in Jari, Parvati Valley, and Himachal Pradesh</p>
            </div>
            <Link
              href="/host/properties"
              className="text-xs font-semibold text-forest hover:text-ukorange transition-colors flex items-center gap-1"
            >
              <span>Manage Properties</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myProperties.map(p => (
              <div key={p.id} className="p-5 bg-ivory-warm rounded-2xl border border-forest/10 flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg font-bold text-forest">{p.name}</h3>
                  <p className="text-xs text-charcoal-muted">{p.village}, {p.district}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                      p.moderation_status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {p.moderation_status}
                    </span>
                    <span className="text-xs text-charcoal-muted">
                      {p.published ? 'Live on Website' : 'Unpublished (Draft)'}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/host/properties/${p.id}`}
                  className="px-3 py-1.5 bg-white border border-forest/20 text-forest text-xs font-semibold rounded-lg hover:bg-forest/5"
                >
                  Edit Listing
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
