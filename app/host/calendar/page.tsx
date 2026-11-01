import React from 'react';
import { redirect } from 'next/navigation';
import { HostNav } from '@/components/host-nav';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isPlatformAdmin } from '@/lib/constants';
import { Calendar as CalendarIcon, Clock, CheckCircle2, Lock, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HostCalendarPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/host/calendar');
  }

  const adminClient = createAdminClient();
  const isAdmin = isPlatformAdmin(user.email);

  let propQuery = adminClient.from('properties').select('id, name');
  if (!isAdmin) {
    propQuery = propQuery.eq('host_id', user.id);
  }
  const { data: properties } = await propQuery;
  const propList = properties || [];
  const propertyIds = propList.map(p => p.id);

  let bookings: any[] = [];
  if (propertyIds.length > 0) {
    const { data: bData } = await adminClient
      .from('stay_bookings')
      .select('id, booking_reference, check_in, check_out, status, guest_name, properties(name), room_units(room_name)')
      .in('property_id', propertyIds)
      .in('status', ['pending', 'confirmed'])
      .order('check_in', { ascending: true });
    bookings = bData || [];
  }

  return (
    <div className="pb-16">
      <HostNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-ukorange">Availability & Schedule</span>
          <h1 className="font-serif text-3xl font-bold text-forest mt-1">Stay Calendar & Inventory</h1>
          <p className="text-sm text-charcoal-muted mt-1">
            Real-time schedule of pending requests and confirmed reservations across your properties.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-2xl border border-forest/15 shadow-sm text-xs">
          <span className="font-semibold text-charcoal">Legend:</span>
          <span className="flex items-center gap-1.5 text-green-800">
            <span className="w-3 h-3 bg-green-500 rounded-full inline-block" />
            Confirmed Stay
          </span>
          <span className="flex items-center gap-1.5 text-ukorange">
            <span className="w-3 h-3 bg-ukorange rounded-full inline-block" />
            Pending Request (Dates Held)
          </span>
          <span className="flex items-center gap-1.5 text-charcoal-muted">
            <span className="w-3 h-3 bg-gray-300 rounded-full inline-block" />
            Available For Booking
          </span>
        </div>

        {/* Calendar Feed */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
          <h2 className="font-serif text-2xl font-bold text-forest pb-4 border-b border-forest/10 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-ukorange" />
            <span>Active Reservations Schedule</span>
          </h2>

          {bookings.length > 0 ? (
            <div className="divide-y divide-forest/10">
              {bookings.map((b: any) => (
                <div key={b.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-charcoal">{b.booking_reference}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                        b.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-ukorange/15 text-ukorange'
                      }`}>
                        {b.status}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-forest">
                      {b.guest_name} — {b.properties?.name} ({b.room_units?.room_name})
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-xs font-semibold text-charcoal bg-ivory-warm px-3 py-1.5 rounded-lg border border-forest/15 inline-block">
                      {b.check_in} → {b.check_out}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-charcoal-muted">
              No active reservations scheduled. All dates are currently open for new requests.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
