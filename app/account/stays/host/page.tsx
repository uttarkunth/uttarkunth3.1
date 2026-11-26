import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getHostProperties, getHostBookings, DIRECT_HOST_PAYMENT_NOTICE } from '@/lib/host';
import { HostOverviewClient } from '@/components/host/host-overview-client';
import { Home, Sparkles, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HostOverviewPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/account/stays/host');
  }

  const { properties, isHost, isAdmin } = await getHostProperties(user.id);
  const propertyIds = properties.map((p: any) => p.id);
  const bookings = propertyIds.length > 0 ? await getHostBookings(propertyIds) : [];

  const adminClient = createAdminClient();
  const { data: rawAgreements } = await adminClient
    .from('host_agreements')
    .select('*, properties(name)')
    .in(
      'property_id',
      propertyIds.length > 0 ? propertyIds : ['00000000-0000-0000-0000-000000000000']
    );

  if (!isHost && !isAdmin) {
    return (
      <div className="max-w-3xl mx-auto py-8 sm:py-12 space-y-8">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#C55B23]">
            Uttarkunth Stays Ecosystem
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#263D32]">
            Mountain Homestay &amp; Retreat Host Workspace
          </h1>
          <p className="text-sm text-[#665E52] max-w-xl mx-auto">
            Welcome to the host workspace. Currently, no verified properties are assigned to your account ({user.email}).
          </p>
        </div>

        <div className="bg-[#FFFDF9] rounded-2xl p-6 sm:p-8 border border-[#D9CCB8] shadow-xs space-y-6">
          <div className="flex items-center gap-4 pb-5 border-b border-[#E5DEC9]">
            <div className="w-12 h-12 rounded-2xl bg-[#263D32]/10 text-[#263D32] flex items-center justify-center flex-shrink-0">
              <Home className="w-6 h-6 text-[#C55B23]" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-[#263D32]">
                Partnering with Himalayan Homestays
              </h2>
              <p className="text-xs text-[#665E52] mt-0.5">
                Direct host settlement, community-first values, and authentic mountain hospitality.
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs text-[#29251F] leading-relaxed">
            <p>
              Uttarkunth partners with authentic village homestays, traditional stone cottages, and eco-retreats across Himachal Pradesh and Uttarakhand. We empower mountain hosts with direct booking requests, personal guest interactions, and a transparent payment model where guests pay you directly upon arrival.
            </p>
            <div className="p-4 bg-[#E8F4EC] rounded-xl border border-[#1F6A3B]/20 text-[#194E2C] space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#1F6A3B]" /> Transparent Host Terms:
              </span>
              <p>{DIRECT_HOST_PAYMENT_NOTICE}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E5DEC9] flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link
              href="/stays"
              className="w-full sm:w-auto px-5 py-2.5 bg-[#F5F0E6] hover:bg-[#EFE7D8] border border-[#D9CCB8] text-[#263D32] text-xs font-bold rounded-xl text-center transition-all"
            >
              Explore Authentic Stays
            </Link>

            <Link
              href="/stays/partner"
              className="w-full sm:w-auto px-6 py-2.5 bg-[#263D32] hover:bg-[#1A2B23] text-[#FFFDF9] text-xs font-bold rounded-xl shadow-xs text-center flex items-center justify-center gap-2 transition-all"
            >
              <span>Apply to Partner as a Homestay</span>
              <ArrowRight className="w-4 h-4 text-[#E57C44]" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <HostOverviewClient
      initialProperties={properties}
      initialBookings={bookings}
      agreements={(rawAgreements as any) || []}
      isAdmin={isAdmin}
    />
  );
}