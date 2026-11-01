import React from 'react';
import { redirect } from 'next/navigation';
import { AdminNav } from '@/components/admin-nav';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { COMMISSION_CONFIG, BRAND, isPlatformAdmin } from '@/lib/constants';
import { Settings, Sparkles, Percent, ShieldCheck, DollarSign } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isPlatformAdmin(user.email)) {
    redirect('/admin/dashboard');
  }

  return (
    <div className="pb-16 bg-ivory">
      <AdminNav />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-ukorange">Platform Rules</span>
          <h1 className="font-serif text-3xl font-bold text-forest mt-1">Platform & Commission Settings</h1>
          <p className="text-sm text-charcoal-muted mt-1">
            Centralized policy controls for Uttarkunth Stays 3.0
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-forest/15 shadow-soft space-y-8">
          <div className="space-y-4">
            <h2 className="font-serif text-2xl font-bold text-forest pb-2 border-b border-forest/10 flex items-center gap-2">
              <Percent className="w-5 h-5 text-ukorange" />
              <span>Host Commission Structure</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 bg-ivory-warm rounded-2xl border border-forest/15 space-y-2">
                <span className="text-xs uppercase tracking-wider text-charcoal-muted font-semibold block">
                  Introductory Tier
                </span>
                <span className="font-serif text-3xl font-bold text-forest block">
                  {COMMISSION_CONFIG.introRate}%
                </span>
                <span className="text-xs text-charcoal-muted">
                  Applied for the first <strong>{COMMISSION_CONFIG.introMonths} months</strong> covered by signed host agreements.
                </span>
              </div>

              <div className="p-5 bg-ivory-warm rounded-2xl border border-forest/15 space-y-2">
                <span className="text-xs uppercase tracking-wider text-charcoal-muted font-semibold block">
                  Standard Platform Tier
                </span>
                <span className="font-serif text-3xl font-bold text-forest block">
                  {COMMISSION_CONFIG.standardRate}%
                </span>
                <span className="text-xs text-charcoal-muted">
                  Applied following the 12-month introductory period per agreement terms.
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-forest/10">
            <h2 className="font-serif text-2xl font-bold text-forest pb-2 border-b border-forest/10 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-ukorange" />
              <span>Payment Settlement Model</span>
            </h2>

            <div className="p-5 bg-ivory-warm rounded-2xl border border-forest/15 text-xs text-charcoal leading-relaxed space-y-2">
              <p>
                <strong>Current Mode:</strong> <span className="font-semibold text-forest">Pay at Property / Direct Local Settlement</span>
              </p>
              <p className="text-charcoal-muted">
                Online payment gateways (e.g. Razorpay) are not active in this release. Guests submit requests, hosts approve, and guest settlement occurs on-site directly with the host.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
