import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { resolveFounderOrAdminSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Shield, Lock, KeyRound } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin } = await resolveFounderOrAdminSession();

  if (!user) {
    redirect('/staff/login?next=/admin/dashboard');
  }

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-4">
        <Shield className="w-12 h-12 text-red-600 mx-auto" />
        <h1 className="font-serif text-3xl font-bold text-red-700">
          Internal Staff Authorization Required
        </h1>
        <p className="text-xs text-charcoal-muted leading-relaxed">
          This portal is strictly restricted to active, Founder-approved Uttarkunth staff identities. Ordinary public member accounts ({user.email}) cannot access internal governance modules.
        </p>
        <div className="flex items-center justify-center gap-3 pt-4">
          <Link
            href="/staff/login"
            className="px-5 py-2.5 bg-forest text-white text-xs font-semibold rounded-full hover:bg-forest-light transition-all"
          >
            Staff Portal Login
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 bg-ivory-warm border border-forest/20 text-forest text-xs font-semibold rounded-full hover:bg-forest/10 transition-all"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // Inspect portal hostname boundary and staff role + AAL2 assurance level
  const reqHeaders = await headers();
  const hostHeader = (
    reqHeaders.get('x-forwarded-host') ||
    reqHeaders.get('host') ||
    ''
  ).toLowerCase();
  const portalHeader = reqHeaders.get('x-uttarkunth-portal') || '';
  const isFounderPortal =
    portalHeader === 'founder' ||
    hostHeader.startsWith('admin.uttarkunth.com') ||
    hostHeader.startsWith('admin.');

  let roleSlug: string | null = null;
  try {
    const adminClient = createAdminClient();
    const { data: staffRow } = await (adminClient.from('staff_profiles' as any) as any)
      .select('role_slug, role_code, status')
      .eq('user_id', user.id)
      .maybeSingle();
    roleSlug = staffRow?.role_slug || staffRow?.role_code || null;
  } catch {
    roleSlug = null;
  }

  // Enforce Founder-only access on admin.uttarkunth.com
  if (isFounderPortal && roleSlug !== 'founder') {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-4">
        <Lock className="w-12 h-12 text-red-600 mx-auto" />
        <h1 className="font-serif text-3xl font-bold text-red-700">
          Founder Command Centre Restricted (403)
        </h1>
        <p className="text-xs text-charcoal-muted leading-relaxed">
          <code className="font-mono">admin.uttarkunth.com</code> is strictly reserved for the Founder &amp; Chief Executive. Active department staff must use the Uttarkunth Staff Portal (<code className="font-mono">team.uttarkunth.com</code> / <code className="font-mono">/staff</code>).
        </p>
        <div className="flex items-center justify-center gap-3 pt-4">
          <Link
            href="/staff"
            className="px-5 py-2.5 bg-forest text-white text-xs font-semibold rounded-full hover:bg-forest-light transition-all"
          >
            Open Staff Portal (/staff)
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 bg-ivory-warm border border-forest/20 text-forest text-xs font-semibold rounded-full hover:bg-forest/10 transition-all"
          >
            Return to Public Site
          </Link>
        </div>
      </div>
    );
  }

  // Verify TOTP Multi-Factor Authentication (AAL2)
  let mfaLevel = 'aal1';
  try {
    const supabase = createServerSupabaseClient();
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalData?.currentLevel === 'aal2') {
      mfaLevel = 'aal2';
    }
  } catch {
    mfaLevel = 'aal1';
  }

  if (mfaLevel !== 'aal2') {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-4">
        <KeyRound className="w-12 h-12 text-ukorange mx-auto" />
        <h1 className="font-serif text-3xl font-bold text-forest">
          TOTP Multi-Factor Authentication (AAL2) Required
        </h1>
        <p className="text-xs text-charcoal-muted leading-relaxed">
          All Founder Command Centre and Staff Portal operations strictly require a verified TOTP Multi-Factor Authentication session (<code className="font-mono">aal2</code>). Please complete your 6-digit authenticator verification to proceed.
        </p>
        <div className="flex items-center justify-center gap-3 pt-4">
          <Link
            href="/staff/login?next=/admin/dashboard"
            className="px-5 py-2.5 bg-ukorange text-white text-xs font-semibold rounded-full hover:bg-ukorange-hover transition-all"
          >
            Verify TOTP Authenticator (AAL2)
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 bg-ivory-warm border border-forest/20 text-forest text-xs font-semibold rounded-full hover:bg-forest/10 transition-all"
          >
            Return to Public Site
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}