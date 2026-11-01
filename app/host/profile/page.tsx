import React from 'react';
import { redirect } from 'next/navigation';
import { HostNav } from '@/components/host-nav';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { User, Mail, Shield, Sparkles, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HostProfilePage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/host/profile');
  }

  const adminClient = createAdminClient();

  // Query agreements for this host
  const { data: agreements } = await adminClient
    .from('host_agreements')
    .select('*')
    .eq('host_user_id', user.id);

  const agreement = agreements && agreements.length > 0 ? agreements[0] : null;

  return (
    <div className="pb-16">
      <HostNav />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-ukorange">Host Account</span>
          <h1 className="font-serif text-3xl font-bold text-forest mt-1">Host Profile & Partnership</h1>
          <p className="text-sm text-charcoal-muted mt-1">Verified partner information, contact details, and commission terms</p>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-forest/15 shadow-soft space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-forest/10">
            <div className="w-16 h-16 rounded-full bg-forest text-ivory flex items-center justify-center font-serif text-2xl font-bold">
              H
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-forest">Himalayan Host Partner</h2>
              <p className="text-xs text-charcoal-muted flex items-center gap-1 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-ukorange" />
                <span>{user.email}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-ivory-warm rounded-2xl border border-forest/15 space-y-1">
              <span className="text-charcoal-muted uppercase tracking-wider block">Commission Tier</span>
              <span className="font-serif text-xl font-bold text-forest flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-ukorange" />
                0% Introductory Rate
              </span>
              <span className="text-charcoal-muted block">Valid for 12 months from signed agreement</span>
            </div>

            <div className="p-4 bg-ivory-warm rounded-2xl border border-forest/15 space-y-1">
              <span className="text-charcoal-muted uppercase tracking-wider block">Partner Verification</span>
              <span className="font-semibold text-green-700 text-sm flex items-center gap-1.5 pt-1">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Verified Community Host
              </span>
              <span className="text-charcoal-muted block">Direct support via founder Gaurav Negi</span>
            </div>
          </div>

          <div className="p-4 bg-blue-50/50 rounded-2xl border border-ukblue/20 text-xs space-y-2">
            <strong className="text-ukblue-deep block">Platform Settlement Terms:</strong>
            <p className="text-charcoal-muted leading-relaxed">
              Uttarkunth Stays operates on a "Pay at Property" and direct guest settlement model. You receive 100% of the room booking amount directly from the guest.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
