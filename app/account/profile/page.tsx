import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ProfileForm } from '@/components/profile-form';
import { resolveMemberCapabilities } from '@/lib/roles';
import { resolveUserWorkspaces } from '@/lib/marketplace';
import { Mail, CheckCircle2, Calendar, Award, Home, Store, ArrowUpRight } from 'lucide-react';

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
  const workspaceState = resolveUserWorkspaces({
    isHost: capabilities.isHost,
    sellerStatus: capabilities.sellerStatus,
  });

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

      {/* Host Dashboard & Seller Dashboard Workspaces (visible only to verified hosts and registered & approved sellers) */}
      {workspaceState.workspaces.length > 0 && (
        <section
          aria-label="Partner Dashboards"
          data-testid="profile-workspaces-section"
          className="rounded-3xl border border-[#D5C8B3]/80 bg-[linear-gradient(135deg,rgba(255,253,249,0.95)_0%,rgba(244,236,220,0.92)_50%,rgba(229,236,227,0.88)_100%)] p-6 sm:p-8 shadow-soft space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C55B23]">
                Verified Partner Access
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1F332A]">
                Partner Dashboards
              </h2>
            </div>
            <span className="text-xs text-[#5C5549]">
              {workspaceState.scenario === 'C_BOTH_HOST_AND_SELLER'
                ? 'Active Host & Seller Dashboards'
                : workspaceState.scenario === 'A_SELLER_ONLY'
                ? 'Approved Seller Dashboard'
                : 'Verified Host Dashboard'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workspaceState.workspaces.map((ws) => (
              <Link
                key={ws.id}
                href={ws.href}
                data-testid={`profile-workspace-card-${ws.id}`}
                className="group flex items-start justify-between gap-4 rounded-2xl border border-[#2B4438] bg-[linear-gradient(145deg,#1D3027_0%,#263E33_54%,#2D463A_100%)] p-5 sm:p-6 text-[#F8F3E8] shadow-md transition-all hover:-translate-y-0.5"
              >
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#FDE2A8]">
                    {ws.id === 'host_dashboard' ? (
                      <Home className="h-3.5 w-3.5 text-[#FDE2A8]" />
                    ) : (
                      <Store className="h-3.5 w-3.5 text-[#FDE2A8]" />
                    )}
                    <span>{ws.badge}</span>
                  </div>
                  <h3 className="font-serif text-xl font-bold text-[#FFFDF9] group-hover:text-[#FDE2A8] transition-colors">
                    {ws.label}
                  </h3>
                  <p className="text-xs leading-relaxed text-[#E7DFC8]/90">
                    {ws.description}
                  </p>
                </div>
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#C55B23] text-white transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

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