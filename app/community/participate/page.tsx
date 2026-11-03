import React, { Suspense } from 'react';
import Link from 'next/link';
import { BRAND } from '@/lib/constants';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { CommunityParticipationForm } from '@/components/community-participation-form';
import { Heart, Users, Shield, Sparkles, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: `Apply to Participate — ${BRAND.name} Community`,
  description: `Join hands-on Himalayan community initiatives, ecological stewardship, and vernacular heritage preservation with ${BRAND.name}.`,
};

export default async function CommunityParticipatePage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const adminClient = createAdminClient();
  const { error: partTableErr } = await adminClient
    .from('community_participations')
    .select('id')
    .limit(1);
  const isDbReady = !partTableErr;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 pb-24 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/10 text-forest text-xs font-semibold uppercase tracking-wider">
          <Heart className="w-3.5 h-3.5 text-ukorange" />
          Karmayog Fellowship &amp; Residencies
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-forest">
          Participate in the Himalayas
        </h1>
        <p className="text-sm sm:text-base text-charcoal-muted max-w-xl mx-auto leading-relaxed">
          Join field cohorts dedicated to zero-waste trail care, Kath-Kuni architectural surveying, youth creative mentorship, and oral history preservation.
        </p>
      </div>

      {/* Form wrapped in Suspense for useSearchParams */}
      <Suspense fallback={<div className="p-12 text-center text-xs text-charcoal-muted">Loading participation desk...</div>}>
        <CommunityParticipationForm
          initialEmail={user?.email || ''}
          isLoggedIn={Boolean(user)}
          isDbReady={isDbReady}
        />
      </Suspense>

      {/* Guiding Principles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-6 bg-white rounded-3xl border border-forest/15 shadow-soft space-y-2">
          <span className="font-serif text-base font-bold text-forest block">
            Respect for Local Customs
          </span>
          <p className="text-xs text-charcoal-muted leading-relaxed">
            Participants work under the guidance of village elders and host families. We uphold traditional codes of conduct in sacred spaces and deity squares.
          </p>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-forest/15 shadow-soft space-y-2">
          <span className="font-serif text-base font-bold text-forest block">
            No Voluntourism Performance
          </span>
          <p className="text-xs text-charcoal-muted leading-relaxed">
            We value genuine work over staged social media photography. Every hour contributed must provide lasting utility to the community.
          </p>
        </div>
      </div>
    </div>
  );
}
