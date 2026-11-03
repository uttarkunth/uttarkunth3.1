import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AUTHENTIC_PRODUCTIONS } from '@/lib/constants';
import { checkIsPlatformAdmin } from '@/lib/auth';
import { formatINR } from '@/lib/utils';
import {
  Luggage,
  ShoppingBag,
  Film,
  Users,
  Compass,
  ArrowRight,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Home,
  Shield,
  Sparkles,
  Bell,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function MyUttarkunthPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/account');
  }

  const meta = user.user_metadata || {};
  const fullName = meta.full_name || user.email?.split('@')[0] || 'Traveler';
  const role = (meta.role as string) || 'Guest';
  const isAdmin = await checkIsPlatformAdmin(user.id);

  const adminClient = createAdminClient();

  // Query latest booking requests
  const { data: bookings } = await adminClient
    .from('stay_bookings')
    .select('id, booking_reference, check_in, check_out, adults, children, status, total_estimate, created_at, properties(id, name, slug, village, district, photos)')
    .or(`guest_user_id.eq.${user.id},guest_email.eq.${user.email}`)
    .order('created_at', { ascending: false })
    .limit(3);

  const userBookings = bookings || [];
  const latestBooking = userBookings[0] || null;

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
            Declined
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
    <div className="space-y-10">
      {/* Welcome Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-forest text-warm-canvas flex items-center justify-center font-serif text-2xl font-bold shadow-xs">
            {fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-ukorange">My Uttarkunth</span>
              <span className="px-2 py-0.5 bg-forest/10 text-forest text-[11px] font-semibold rounded-full capitalize">
                {role}
              </span>
              {isAdmin && (
                <span className="px-2 py-0.5 bg-terracotta/10 text-terracotta text-[11px] font-semibold rounded-full flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Admin
                </span>
              )}
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-forest mt-1">
              Namaste, {fullName}
            </h1>
            <p className="text-xs text-charcoal-muted mt-0.5">{user.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/account/notifications"
            className="px-4 py-2 bg-ivory-warm hover:bg-forest/10 text-forest text-xs font-semibold rounded-xl border border-forest/20 transition-colors inline-flex items-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5 text-ukorange" />
            <span>Activity</span>
          </Link>
          <Link
            href="/account/profile"
            className="px-4 py-2 bg-ivory-warm hover:bg-forest/10 text-forest text-xs font-semibold rounded-xl border border-forest/20 transition-colors"
          >
            Edit Profile
          </Link>
          <Link
            href="/stays"
            className="px-4 py-2 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Discover Stays</span>
          </Link>
        </div>
      </div>

      {/* 4 Pillars Ecosystem Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pillar 1: Stays & Trips */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-forest/15 shadow-soft flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-forest/10 text-forest flex items-center justify-center">
                  <Luggage className="w-5 h-5 text-forest" />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-bold text-forest">Himalayan Stays & Trips</h2>
                  <p className="text-xs text-charcoal-muted">Authentic mountain homestays</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-ivory-warm border border-forest/15 text-forest text-xs font-bold rounded-full">
                {userBookings.length} {userBookings.length === 1 ? 'Trip' : 'Trips'}
              </span>
            </div>

            {latestBooking ? (
              <div className="bg-ivory-warm rounded-2xl p-4 border border-forest/10 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[11px] font-semibold text-charcoal-muted block">
                      Ref: {latestBooking.booking_reference}
                    </span>
                    <h3 className="font-serif text-base font-bold text-forest">
                      {(latestBooking.properties as any)?.name || 'Uttarkunth Stay'}
                    </h3>
                    <p className="text-xs text-charcoal-muted flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-ukorange" />
                      <span>
                        {(latestBooking.properties as any)?.village || 'Jari'}, {(latestBooking.properties as any)?.district || 'Kullu'}
                      </span>
                    </p>
                  </div>
                  <div>{getStatusBadge(latestBooking.status)}</div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-forest/10 text-xs">
                  <span className="text-charcoal-muted">
                    {latestBooking.check_in} → {latestBooking.check_out}
                  </span>
                  <span className="font-serif font-bold text-forest">
                    {formatINR(Number(latestBooking.total_estimate || 0))}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-ivory-warm rounded-2xl border border-forest/10 text-center space-y-2">
                <Compass className="w-8 h-8 text-forest/40 mx-auto" />
                <p className="text-xs text-charcoal-muted leading-relaxed">
                  No active booking requests. Discover verified homestays in Jari and Parvati Valley.
                </p>
              </div>
            )}

            <div className="p-3 bg-warm-canvas rounded-xl border border-beige text-[11px] text-charcoal-muted leading-relaxed">
              <strong>Direct Host Settlement:</strong> Uttarkunth does not collect stay payments online. You pay your host directly upon arrival.
            </div>
          </div>

          <div className="pt-4 border-t border-forest/10 flex items-center justify-between">
            <Link
              href="/trips"
              className="text-xs font-semibold text-forest hover:text-ukorange flex items-center gap-1 transition-colors"
            >
              <span>View All Trips</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/stays/partner"
              className="text-xs font-medium text-charcoal-muted hover:text-forest transition-colors"
            >
              Host a Homestay →
            </Link>
          </div>
        </div>

        {/* Pillar 2: Himalayan Products */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-forest/15 shadow-soft flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-forest/10 text-forest flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-forest" />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-bold text-forest">Himalayan Goods</h2>
                  <p className="text-xs text-charcoal-muted">Artisan crafts & mountain harvests</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-full">
                Launching 2027
              </span>
            </div>

            <div className="bg-ivory-warm rounded-2xl p-4 border border-forest/10 space-y-2 text-xs">
              <p className="text-charcoal-muted leading-relaxed">
                Handcrafted goods directly from master weavers, high-altitude beekeepers, and village craft cooperatives in Himachal Pradesh and Uttarakhand.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2 py-0.5 bg-white rounded-md text-[11px] text-forest border border-forest/10">
                  Kullu Shawls
                </span>
                <span className="px-2 py-0.5 bg-white rounded-md text-[11px] text-forest border border-forest/10">
                  Wild Forest Honey
                </span>
                <span className="px-2 py-0.5 bg-white rounded-md text-[11px] text-forest border border-forest/10">
                  Pine Basketry
                </span>
                <span className="px-2 py-0.5 bg-white rounded-md text-[11px] text-forest border border-forest/10">
                  Mountain Herbs
                </span>
              </div>
            </div>

            <div className="p-3 bg-warm-canvas rounded-xl border border-beige text-[11px] text-charcoal-muted leading-relaxed">
              <strong>Authenticity Commitment:</strong> Zero mass-manufactured items or dropshipped goods. Only verified mountain provenance.
            </div>
          </div>

          <div className="pt-4 border-t border-forest/10 flex items-center justify-between">
            <Link
              href="/account/products"
              className="text-xs font-semibold text-forest hover:text-ukorange flex items-center gap-1 transition-colors"
            >
              <span>Explore Preview & Register</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/products/sell"
              className="text-xs font-medium text-charcoal-muted hover:text-forest transition-colors"
            >
              Artisan Application →
            </Link>
          </div>
        </div>

        {/* Pillar 3: Productions */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-forest/15 shadow-soft flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-forest/10 text-forest flex items-center justify-center">
                  <Film className="w-5 h-5 text-forest" />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-bold text-forest">Uttarkunth Films</h2>
                  <p className="text-xs text-charcoal-muted">Mountain stories & cultural archives</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-ivory-warm border border-forest/15 text-forest text-xs font-bold rounded-full">
                2 Documentaries
              </span>
            </div>

            <div className="space-y-2">
              {AUTHENTIC_PRODUCTIONS.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-ivory-warm rounded-xl p-3 border border-forest/10 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <h4 className="font-serif font-bold text-forest">{prod.title}</h4>
                    <p className="text-[11px] text-charcoal-muted">{prod.category}</p>
                  </div>
                  <Link
                    href="/production"
                    className="px-2.5 py-1 bg-white hover:bg-forest hover:text-white border border-forest/15 text-forest text-[11px] font-semibold rounded-lg transition-colors flex-shrink-0"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-forest/10 flex items-center justify-between">
            <Link
              href="/account/productions"
              className="text-xs font-semibold text-forest hover:text-ukorange flex items-center gap-1 transition-colors"
            >
              <span>Production Passes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/production/collaborate"
              className="text-xs font-medium text-charcoal-muted hover:text-forest transition-colors"
            >
              Filmmaker Pitches →
            </Link>
          </div>
        </div>

        {/* Pillar 4: Community & Karmayog */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-forest/15 shadow-soft flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-forest/10 text-forest flex items-center justify-center">
                  <Users className="w-5 h-5 text-forest" />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-bold text-forest">Karmayog Community</h2>
                  <p className="text-xs text-charcoal-muted">Grassroots action & stewardship</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-forest/10 text-forest text-xs font-bold rounded-full">
                9 Proposed Tracks
              </span>
            </div>

            <div className="bg-ivory-warm rounded-2xl p-4 border border-forest/10 space-y-2 text-xs">
              <p className="font-serif font-bold text-forest italic">
                &ldquo;Ideas born in the mountains. Built through people.&rdquo;
              </p>
              <p className="text-charcoal-muted leading-relaxed">
                Learn by doing, grow by serving. Join grassroots initiatives supporting clean alpine trails, vernacular kath-kuni stone conservation, and mountain oral storytelling.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-forest/10 flex items-center justify-between">
            <Link
              href="/account/community"
              className="text-xs font-semibold text-forest hover:text-ukorange flex items-center gap-1 transition-colors"
            >
              <span>Community Initiatives</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/community/participate"
              className="text-xs font-medium text-charcoal-muted hover:text-forest transition-colors"
            >
              Participate in Field Cohort →
            </Link>
          </div>
        </div>
      </div>

      {/* Pathways / Elevated Portals */}
      <div className="bg-forest text-white rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-widest text-ukorange">Ecosystem Pathways</span>
          <h2 className="font-serif text-2xl font-bold mt-1">One Universal Himalayan Account</h2>
          <p className="text-xs text-white/80 mt-1 leading-relaxed">
            Your single Uttarkunth identity connects you across all facets of mountain life — whether you travel as a mindful guest, host visitors at your homestay, curate handloom goods, or document mountain heritage.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <Link
            href="/stays/partner"
            className="p-4 bg-white/10 hover:bg-white/15 rounded-2xl border border-white/15 transition-colors space-y-1 block"
          >
            <Home className="w-5 h-5 text-ukorange" />
            <span className="font-serif text-sm font-bold block pt-1">Homestay Hosting</span>
            <span className="text-[11px] text-white/70 block">List your mountain home and welcome conscious travelers.</span>
          </Link>

          <Link
            href="/products/sell"
            className="p-4 bg-white/10 hover:bg-white/15 rounded-2xl border border-white/15 transition-colors space-y-1 block"
          >
            <ShoppingBag className="w-5 h-5 text-ukorange" />
            <span className="font-serif text-sm font-bold block pt-1">Artisan Collective</span>
            <span className="text-[11px] text-white/70 block">Provide handcrafted goods and forest harvests.</span>
          </Link>

          <Link
            href="/production/collaborate"
            className="p-4 bg-white/10 hover:bg-white/15 rounded-2xl border border-white/15 transition-colors space-y-1 block"
          >
            <Film className="w-5 h-5 text-ukorange" />
            <span className="font-serif text-sm font-bold block pt-1">Visual Storytelling</span>
            <span className="text-[11px] text-white/70 block">Submit documentary proposals and cinematography.</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
