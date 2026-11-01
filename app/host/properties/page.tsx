import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { HostNav } from '@/components/host-nav';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isPlatformAdmin } from '@/lib/constants';
import { PlusCircle, MapPin, CheckCircle2, Clock, Eye, Edit } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HostPropertiesPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/host/properties');
  }

  const adminClient = createAdminClient();
  const isAdmin = isPlatformAdmin(user.email);

  let query = adminClient.from('properties').select('*, room_units(*)');
  if (!isAdmin) {
    query = query.eq('host_id', user.id);
  }

  const { data: properties } = await query;
  const list = properties || [];

  return (
    <div className="pb-16">
      <HostNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-ukorange">My Listings</span>
            <h1 className="font-serif text-3xl font-bold text-forest mt-1">Host Properties</h1>
            <p className="text-sm text-charcoal-muted mt-1">Manage your registered homestays, room units, and published rates</p>
          </div>

          <Link
            href="/host/properties/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4 text-ukorange" />
            <span>Add New Property</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {list.map(p => {
            const photos = Array.isArray(p.photos) ? p.photos : [];
            const photoUrl = photos[0] || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80';
            const rooms = p.room_units || [];

            return (
              <div key={p.id} className="bg-white rounded-2xl overflow-hidden border border-forest/15 shadow-soft flex flex-col justify-between">
                <div className="relative h-48 w-full bg-forest/10">
                  <img src={photoUrl} alt={p.name} className="w-full h-full object-cover" />
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded-full shadow-sm ${
                      p.moderation_status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {p.moderation_status}
                    </span>
                    <span className="px-2.5 py-1 bg-white/90 text-forest text-xs font-semibold rounded-full shadow-sm">
                      {p.published ? 'Live' : 'Draft'}
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h2 className="font-serif text-2xl font-bold text-forest">{p.name}</h2>
                    <p className="text-xs text-charcoal-muted flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-ukorange" />
                      <span>{p.village}, {p.district}, {p.state}</span>
                    </p>
                    <p className="text-xs text-charcoal-muted line-clamp-2">{p.description}</p>
                    <div className="text-xs font-semibold text-charcoal pt-2">
                      {rooms.length} Room Unit{rooms.length !== 1 ? 's' : ''} Configured
                    </div>
                  </div>

                  <div className="pt-4 border-t border-forest/10 flex items-center justify-between">
                    <Link
                      href={`/properties/${p.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-charcoal-muted hover:text-forest"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Public Preview</span>
                    </Link>

                    <Link
                      href={`/host/properties/${p.id}`}
                      className="px-3.5 py-2 bg-ivory-warm border border-forest/20 text-forest text-xs font-semibold rounded-lg hover:bg-forest hover:text-white transition-all flex items-center gap-1"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Property & Rooms</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
