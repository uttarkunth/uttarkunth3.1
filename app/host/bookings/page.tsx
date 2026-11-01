import React from 'react';
import { redirect } from 'next/navigation';
import { HostNav } from '@/components/host-nav';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatINR } from '@/lib/utils';
import { isPlatformAdmin } from '@/lib/constants';
import { CheckCircle2, XCircle, Clock, Calendar, Users, MapPin, Mail, Phone } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HostBookingsPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/host/bookings');
  }

  const adminClient = createAdminClient();
  const isAdmin = isPlatformAdmin(user.email);

  // Get properties for this host
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
      .select('*, properties(name, village), room_units(room_name)')
      .in('property_id', propertyIds)
      .order('created_at', { ascending: false });
    bookings = bData || [];
  }

  return (
    <div className="pb-16">
      <HostNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-ukorange">Reservations & Requests</span>
          <h1 className="font-serif text-3xl font-bold text-forest mt-1">Guest Booking Requests</h1>
          <p className="text-sm text-charcoal-muted mt-1">
            Review incoming reservation requests. Remember: dates are only reserved once you formally approve the request.
          </p>
        </div>

        {bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((b: any) => {
              const isPending = b.status === 'pending';
              const isConfirmed = b.status === 'confirmed';

              return (
                <div
                  key={b.id}
                  className={`bg-white rounded-2xl p-6 border shadow-soft transition-all space-y-4 ${
                    isPending ? 'border-ukorange/40 ring-1 ring-ukorange/20' : 'border-forest/15'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-forest/10">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-charcoal">{b.booking_reference}</span>
                        <span className={`px-2.5 py-0.5 text-[11px] font-bold uppercase rounded-full ${
                          isConfirmed ? 'bg-green-100 text-green-800' :
                          b.status === 'declined' ? 'bg-red-100 text-red-800' :
                          b.status === 'cancelled' ? 'bg-gray-100 text-gray-700' :
                          'bg-ukorange/15 text-ukorange'
                        }`}>
                          {b.status}
                        </span>
                      </div>
                      <h3 className="font-serif text-xl font-bold text-forest mt-1">
                        {b.guest_name} — <span className="font-normal">{b.properties?.name}</span>
                      </h3>
                      <p className="text-xs text-charcoal-muted">
                        Room: {b.room_units?.room_name || 'Mountain View Room'}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[11px] text-charcoal-muted uppercase tracking-wider block">Estimated Total</span>
                      <span className="font-serif text-2xl font-bold text-forest">
                        {formatINR(Number(b.total_estimate || 0))}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="p-3 bg-ivory-warm rounded-xl border border-forest/10 space-y-1">
                      <span className="text-charcoal-muted uppercase tracking-wider font-semibold block flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-forest" />
                        Stay Dates
                      </span>
                      <span className="font-semibold text-charcoal">{b.check_in} → {b.check_out}</span>
                    </div>

                    <div className="p-3 bg-ivory-warm rounded-xl border border-forest/10 space-y-1">
                      <span className="text-charcoal-muted uppercase tracking-wider font-semibold block flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-forest" />
                        Guest Count
                      </span>
                      <span className="font-semibold text-charcoal">{b.adults} Adults {b.children > 0 ? `, ${b.children} Children` : ''}</span>
                    </div>

                    <div className="p-3 bg-ivory-warm rounded-xl border border-forest/10 space-y-1">
                      <span className="text-charcoal-muted uppercase tracking-wider font-semibold block flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-forest" />
                        Contact
                      </span>
                      <span className="font-semibold text-charcoal block truncate">{b.guest_phone}</span>
                      <span className="text-charcoal-muted block truncate">{b.guest_email}</span>
                    </div>
                  </div>

                  {b.special_requests && (
                    <div className="text-xs p-3 bg-forest/5 rounded-xl text-charcoal">
                      <strong className="text-forest">Special Requests: </strong>
                      {b.special_requests}
                    </div>
                  )}

                  {/* Actions for pending bookings */}
                  {isPending && (
                    <div className="pt-4 border-t border-forest/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <span className="text-xs text-charcoal-muted">
                        Please review calendar availability before accepting this request.
                      </span>

                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <form action="/api/bookings/decision" method="POST" className="flex-1 sm:flex-none">
                          <input type="hidden" name="booking_id" value={b.id} />
                          <input type="hidden" name="action" value="confirm" />
                          <button
                            type="submit"
                            className="w-full sm:w-auto px-5 py-2 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4 text-ukorange" />
                            <span>Approve Stay</span>
                          </button>
                        </form>

                        <form action="/api/bookings/decision" method="POST" className="flex-1 sm:flex-none">
                          <input type="hidden" name="booking_id" value={b.id} />
                          <input type="hidden" name="action" value="decline" />
                          <button
                            type="submit"
                            className="w-full sm:w-auto px-5 py-2 border border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Decline</span>
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-forest/15 shadow-soft max-w-lg mx-auto space-y-3">
            <Clock className="w-12 h-12 text-forest/40 mx-auto" />
            <h3 className="font-serif text-2xl font-bold text-forest">No Booking Requests</h3>
            <p className="text-xs text-charcoal-muted">
              You do not have any incoming booking requests at this moment. New requests submitted by guests will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
