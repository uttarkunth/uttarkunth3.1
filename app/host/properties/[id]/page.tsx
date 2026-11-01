import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { HostNav } from '@/components/host-nav';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AMENITIES_LIST, isPlatformAdmin } from '@/lib/constants';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface EditPropertyPageProps {
  params: {
    id: string;
  };
}

export default async function EditPropertyPage({ params }: EditPropertyPageProps) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/host/properties/${params.id}`);
  }

  const adminClient = createAdminClient();
  const { data: property, error } = await adminClient
    .from('properties')
    .select('*, room_units(*)')
    .eq('id', params.id)
    .single();

  if (error || !property) {
    notFound();
  }

  // Security check: Only owner or admin can edit
  const isOwner = property.host_id === user.id;
  const isAdmin = isPlatformAdmin(user.email);

  if (!isOwner && !isAdmin) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <h2 className="font-serif text-2xl font-bold text-red-700">Access Restricted</h2>
        <p className="text-xs text-charcoal-muted mt-2">You can only edit properties you own.</p>
        <Link href="/host/properties" className="mt-4 inline-block px-4 py-2 bg-forest text-white text-xs font-semibold rounded-lg">
          Back to My Properties
        </Link>
      </div>
    );
  }

  const amenities = Array.isArray(property.amenities) ? property.amenities : [];
  const rooms = property.room_units || [];

  return (
    <div className="pb-16">
      <HostNav />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <Link
            href="/host/properties"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-muted hover:text-forest transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Properties</span>
          </Link>
          <span className="text-xs font-bold uppercase tracking-widest text-ukorange block">Listing Configuration</span>
          <h1 className="font-serif text-3xl font-bold text-forest mt-1">Edit {property.name}</h1>
          <p className="text-sm text-charcoal-muted mt-1">
            Update listing description, published rates, and amenities. Note: material changes trigger safety re-review by administrators.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-forest/15 shadow-soft space-y-6">
          <div className="flex items-center justify-between p-4 bg-ivory-warm rounded-2xl border border-forest/10 text-xs">
            <div>
              <span className="text-charcoal-muted block">Moderation Status</span>
              <span className="font-bold uppercase text-forest">{property.moderation_status}</span>
            </div>
            <div>
              <span className="text-charcoal-muted block">Publication State</span>
              <span className="font-bold text-forest">{property.published ? 'Live' : 'Unpublished (Draft)'}</span>
            </div>
          </div>

          <form action="/host/properties" method="GET" className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-charcoal-muted mb-1">Property Name</label>
              <input
                type="text"
                defaultValue={property.name}
                className="w-full p-2.5 text-sm bg-ivory-warm border border-forest/20 rounded-xl font-medium focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-muted mb-1">Description</label>
              <textarea
                rows={4}
                defaultValue={property.description || ''}
                className="w-full p-2.5 text-sm bg-ivory-warm border border-forest/20 rounded-xl font-medium focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-muted mb-1">Address</label>
              <input
                type="text"
                defaultValue={property.address || ''}
                className="w-full p-2.5 text-sm bg-ivory-warm border border-forest/20 rounded-xl font-medium focus:outline-none"
              />
            </div>

            <div className="pt-4 border-t border-forest/10">
              <h3 className="font-serif text-xl font-bold text-forest mb-3">Room Units & Base Nightly Rates</h3>
              <div className="space-y-3">
                {rooms.map((r: any) => (
                  <div key={r.id} className="p-4 bg-ivory-warm rounded-xl border border-forest/15 flex items-center justify-between gap-4">
                    <div>
                      <strong className="block text-sm text-forest">{r.room_name}</strong>
                      <span className="text-xs text-charcoal-muted">Max {r.max_guests} Guests</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-charcoal-muted">₹</span>
                      <input
                        type="number"
                        defaultValue={Number(r.base_price)}
                        className="w-24 p-1.5 text-sm bg-white border border-forest/20 rounded-lg text-right font-bold"
                      />
                      <span className="text-xs text-charcoal-muted">/ night</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-forest/10 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4 text-ukorange" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
