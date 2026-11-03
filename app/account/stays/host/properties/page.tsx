import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHostProperties, DIRECT_HOST_PAYMENT_NOTICE } from '@/lib/host';
import { HostSubnav } from '@/components/host-subnav';
import { PlusCircle, MapPin, Eye, Edit, Sparkles, Home, Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HostPropertiesCatalogPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/account/stays/host/properties');
  }

  const { properties, isHost, isAdmin } = await getHostProperties(user.id);

  if (!isHost && !isAdmin) {
    redirect('/account/stays/host');
  }

  return (
    <div className="space-y-6">
      <HostSubnav propertiesCount={properties.length} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-ukorange">
              Property Catalog
            </span>
            {isAdmin && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-terracotta/10 text-terracotta border border-terracotta/20 flex items-center gap-1">
                <Shield className="w-3 h-3" /> All Listings View
              </span>
            )}
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-forest mt-1">
            Assigned Homestays & Properties
          </h1>
          <p className="text-sm text-charcoal-muted mt-1">
            Configure room units, published nightly rates, property photos, and amenities.
          </p>
        </div>

        <Link
          href="/stays/partner"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
        >
          <PlusCircle className="w-4 h-4 text-ukorange" />
          <span>Apply for New Property</span>
        </Link>
      </div>

      {/* Transparent Direct Payment Policy Banner */}
      <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 flex items-start gap-3 shadow-xs">
        <Sparkles className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-xs text-emerald-900">
          <span className="font-bold">Direct Guest Payment Model:</span>
          <p className="text-emerald-800">{DIRECT_HOST_PAYMENT_NOTICE}</p>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {properties.map((p) => {
          const photos = Array.isArray(p.photos) ? (p.photos as string[]) : [];
          const photoUrl = photos[0] || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80';
          const rooms = Array.isArray(p.room_units) ? p.room_units : [];

          return (
            <div
              key={p.id}
              className="bg-white rounded-2xl overflow-hidden border border-forest/15 shadow-soft flex flex-col justify-between"
            >
              <div className="relative h-48 w-full bg-forest/10">
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

              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h2 className="font-serif text-2xl font-bold text-forest">{p.name}</h2>
                    <span className="text-[11px] font-mono text-charcoal-muted uppercase bg-ivory-warm px-2 py-0.5 rounded border border-forest/10">
                      {p.property_type || 'homestay'}
                    </span>
                  </div>
                  <p className="text-xs text-charcoal-muted flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-ukorange" />
                    <span>
                      {p.village}, {p.district}, {p.state}
                    </span>
                  </p>
                  <p className="text-xs text-charcoal-muted line-clamp-2">{p.description}</p>
                  <div className="text-xs font-semibold text-charcoal pt-2 border-t border-forest/5 flex items-center justify-between">
                    <span>{rooms.length} Room Unit{rooms.length !== 1 ? 's' : ''} Configured</span>
                    <span className="text-charcoal-muted">{photos.length} Photo{photos.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-forest/10 flex items-center justify-between">
                  <Link
                    href={`/stays/${p.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-charcoal-muted hover:text-forest transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Public Preview</span>
                  </Link>

                  <Link
                    href={`/account/stays/host/properties/${p.id}`}
                    className="px-4 py-2 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <Edit className="w-3.5 h-3.5 text-ukorange" />
                    <span>Manage Property & Rooms</span>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
