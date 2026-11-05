import React from 'react';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ProfileForm } from '@/components/profile-form';
import { resolveMemberCapabilities } from '@/lib/roles';
import { Mail, CheckCircle2, Calendar, Award } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AccountProfilePage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/account/profile');
  }

  let dbProfile: any = null;
  try {
    const adminClient = createAdminClient();
    const { data } = await (adminClient.from('profiles' as any) as any)
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    dbProfile = data;
  } catch {
    dbProfile = null;
  }

  const meta = user.user_metadata || {};
  const fullName = dbProfile?.full_name || meta.full_name || 'Uttarkunth Member';
  const preferredName = dbProfile?.preferred_name || meta.preferred_name || fullName;
  const phone = dbProfile?.phone || meta.phone || '';
  const address = dbProfile?.address || meta.address || '';
  const location = dbProfile?.location || meta.location || '';
  const bio = dbProfile?.bio || meta.bio || '';
  const interests = Array.isArray(dbProfile?.mountain_interests)
    ? dbProfile.mountain_interests
    : (meta.mountain_interests as string[]) || [];

  const capabilities = await resolveMemberCapabilities(user.id);

  const createdAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : 'November 2026';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-ukorange">
          Account Details
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-forest mt-1">My Profile</h1>
        <p className="text-xs text-charcoal-muted mt-1">
          Manage your personal identity, private contact details, and Himalayan interests across the Uttarkunth ecosystem.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-forest/10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-forest text-warm-canvas flex items-center justify-center font-serif text-2xl font-bold">
              {fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-forest">{fullName}</h2>
              <p className="text-xs text-charcoal-muted flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-ukorange" />
                <span>{user.email}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {capabilities.badges.map((badge) => (
              <span
                key={badge}
                className="px-3 py-1 bg-forest/10 text-forest text-xs font-semibold rounded-full"
              >
                {badge}
              </span>
            ))}
            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              Verified Email
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-ivory-warm rounded-2xl border border-forest/10 space-y-1">
            <span className="text-charcoal-muted uppercase tracking-wider block text-[11px]">
              Member Since
            </span>
            <span className="font-semibold text-forest text-sm flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-ukorange" />
              {createdAt}
            </span>
          </div>

          <div className="p-4 bg-ivory-warm rounded-2xl border border-forest/10 space-y-1">
            <span className="text-charcoal-muted uppercase tracking-wider block text-[11px]">
              Identity Status
            </span>
            <span className="font-semibold text-forest text-sm flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-forest" />
              Uttarkunth Member
            </span>
          </div>

          <div className="p-4 bg-ivory-warm rounded-2xl border border-forest/10 space-y-1">
            <span className="text-charcoal-muted uppercase tracking-wider block text-[11px]">
              Home Base
            </span>
            <span className="font-semibold text-forest text-sm truncate block">
              {location || 'Not set'}
            </span>
          </div>
        </div>
      </div>

      {/* Profile Edit Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
        <div>
          <h2 className="font-serif text-xl font-bold text-forest">Edit Profile Details</h2>
          <p className="text-xs text-charcoal-muted mt-1">
            Keep your contact information current for seamless host notifications and community dispatches. Private contact fields (email, phone, address) are protected by Row-Level Security.
          </p>
        </div>

        <ProfileForm
          initialFullName={fullName}
          initialPreferredName={preferredName}
          initialPhone={phone}
          initialAddress={address}
          initialLocation={location}
          initialBio={bio}
          initialInterests={interests}
        />
      </div>
    </div>
  );
}