import React from 'react';
import Link from 'next/link';
import { BRAND } from '@/lib/constants';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { FilmmakerCollaborateForm } from '@/components/filmmaker-collaborate-form';
import { Clapperboard, Video, Film, Sparkles, Shield, HeartHandshake } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: `Collaborate on Mountain Films — ${BRAND.name} Productions`,
  description: `Pitch independent documentaries, ethnographic visual essays, and Himalayan cultural stories to ${BRAND.name} Productions.`,
};

export default async function CollaboratePage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const adminClient = createAdminClient();
  const { error: propTableErr } = await adminClient
    .from('production_proposals')
    .select('id')
    .limit(1);
  const { error: profTableErr } = await adminClient
    .from('filmmaker_profiles')
    .select('id')
    .limit(1);
  const isDbReady = !propTableErr && !profTableErr;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 pb-24 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/10 text-forest text-xs font-semibold uppercase tracking-wider">
          <Clapperboard className="w-3.5 h-3.5 text-ukorange" />
          Pillar III • Creative Co-Production
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-forest">
          Tell Himalayan Stories With Us
        </h1>
        <p className="text-sm sm:text-base text-charcoal-muted max-w-xl mx-auto leading-relaxed">
          Uttarkunth Productions backs independent directors, sound recordists, and ethnographers dedicated to authentic mountain lore, sacred rituals, and ecological narratives.
        </p>
      </div>

      {/* 3 Pillars of Filmmaker Support */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-3xl border border-forest/15 shadow-soft space-y-2">
          <div className="w-10 h-10 rounded-xl bg-forest/10 text-forest flex items-center justify-center">
            <Video className="w-5 h-5 text-ukorange" />
          </div>
          <h3 className="font-serif text-lg font-bold text-forest">On-Ground Access</h3>
          <p className="text-xs text-charcoal-muted leading-relaxed">
            Deep village relationships and homestay bases in Parvati Valley, Kullu, and Spiti for respectful, non-extractive filming.
          </p>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-forest/15 shadow-soft space-y-2">
          <div className="w-10 h-10 rounded-xl bg-forest/10 text-forest flex items-center justify-center">
            <Film className="w-5 h-5 text-forest" />
          </div>
          <h3 className="font-serif text-lg font-bold text-forest">Grants &amp; Equipment</h3>
          <p className="text-xs text-charcoal-muted leading-relaxed">
            Co-production grants, shared camera and ambisonic audio gear, and editorial guidance for approved projects.
          </p>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-forest/15 shadow-soft space-y-2">
          <div className="w-10 h-10 rounded-xl bg-forest/10 text-forest flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-ukblue-deep" />
          </div>
          <h3 className="font-serif text-lg font-bold text-forest">Living Archive</h3>
          <p className="text-xs text-charcoal-muted leading-relaxed">
            Permanent archiving and spotlighting on Uttarkunth, festival circuit support, and direct community screenings.
          </p>
        </div>
      </div>

      {/* Interactive Form Component */}
      <FilmmakerCollaborateForm
        initialEmail={user?.email || ''}
        isLoggedIn={Boolean(user)}
        isDbReady={isDbReady}
      />

      {/* Ethics & Community Consent Notice */}
      <div className="p-6 bg-ivory-warm rounded-3xl border border-forest/15 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-forest" />
          <h4 className="font-serif text-sm font-bold text-forest">Our Non-Extractive Cultural Filming Code</h4>
        </div>
        <p className="text-xs text-charcoal-muted leading-relaxed">
          Uttarkunth strictly forbids sensationalized, disrespectful, or unconsented recording of village deities, sacred ceremonies, or vulnerable residents. Every production must secure explicit elder and panchayat consent before cameras roll.
        </p>
      </div>
    </div>
  );
}
