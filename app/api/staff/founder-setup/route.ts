import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  REQUIRED_STAFF_AGREEMENTS,
  computeDocumentHash,
  recordStaffAuditLog,
  type StaffAgreementType,
} from '@/lib/staff-rbac';

export const dynamic = 'force-dynamic';

async function resolveFounderSetupContext() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false as const, status: 401, error: 'Sign in with the Founder Auth account first.' };
  }

  const adminClient = createAdminClient();
  const { data: profile, error: profileError } = await (
    adminClient.from('staff_profiles' as any) as any
  )
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (profileError) {
    return { ok: false as const, status: 503, error: 'Founder profile could not be verified. Confirm Phase 2 is installed.' };
  }

  const { count: founderCount, error: founderCountError } = await (
    adminClient.from('staff_profiles' as any) as any
  )
    .select('id', { count: 'exact', head: true })
    .eq('role_slug', 'founder');

  const isEligible =
    !founderCountError &&
    founderCount === 1 &&
    profile &&
    profile.user_id === user.id &&
    profile.role_slug === 'founder' &&
    profile.staff_id === 'UK-STAFF-2026-0001' &&
    profile.status === 'active' &&
    profile.founder_approved === true &&
    Boolean(profile.founder_approved_at) &&
    profile.founder_approved_by === user.id &&
    !profile.session_revoked_at;

  if (!isEligible) {
    return { ok: false as const, status: 403, error: 'Founder setup is restricted to the single, explicitly provisioned Founder account.' };
  }

  return { ok: true as const, user, profile, adminClient };
}

const agreementPayload = () =>
  REQUIRED_STAFF_AGREEMENTS.map((agreement) => ({
    type: agreement.type,
    code: agreement.code,
    title: agreement.title,
    version: agreement.version,
    summary: agreement.summary,
    canonicalContent: agreement.canonicalContent,
    documentHash: computeDocumentHash(agreement.canonicalContent.trim()),
  }));

export async function GET() {
  try {
    const context = await resolveFounderSetupContext();
    if (!context.ok) {
      return NextResponse.json({ ok: false, error: context.error }, { status: context.status });
    }

    return NextResponse.json({
      ok: true,
      alreadyCompleted: context.profile.agreements_completed === true &&
        context.profile.privacy_notice_accepted === true,
      staffProfile: {
        staff_id: context.profile.staff_id,
        designation: context.profile.designation,
        department: context.profile.department,
        agreements_completed: context.profile.agreements_completed === true,
        privacy_notice_accepted: context.profile.privacy_notice_accepted === true,
      },
      agreements: agreementPayload(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Could not load Founder agreement setup.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await resolveFounderSetupContext();
    if (!context.ok) {
      return NextResponse.json({ ok: false, error: context.error }, { status: context.status });
    }

    const body = await request.json();
    if (body?.privacy_notice_accepted !== true) {
      return NextResponse.json(
        { ok: false, error: 'You must explicitly accept the Founder privacy notice.' },
        { status: 400 }
      );
    }

    const submittedAgreements: any[] = Array.isArray(body?.agreements) ? body.agreements : [];
    const normalized: any[] = REQUIRED_STAFF_AGREEMENTS.map((agreement) => {
      const submitted = submittedAgreements.find(
        (item) => item?.agreement_type === agreement.type || item?.agreement_code === agreement.code
      );

      if (!submitted || submitted.accepted !== true) {
        return { error: `Explicit acceptance is required for '${agreement.type}'.` };
      }

      const submittedVersion = submitted.agreement_version || submitted.version || '';
      if (submittedVersion !== agreement.version) {
        return { error: `Agreement version mismatch for '${agreement.type}'. Reload and review the current version.` };
      }

      const canonicalHash = computeDocumentHash(agreement.canonicalContent.trim());
      if (submitted.document_hash !== canonicalHash) {
        return { error: `Agreement content hash mismatch for '${agreement.type}'. Reload and review the current document.` };
      }

      return {
        agreement_type: agreement.type as StaffAgreementType,
        agreement_code: agreement.code as StaffAgreementType,
        agreement_title: agreement.title,
        agreement_version: agreement.version,
        version: agreement.version,
        document_hash: canonicalHash,
      };
    });

    const invalid = normalized.find((item: any) => item.error);
    if (invalid) {
      return NextResponse.json({ ok: false, error: invalid.error }, { status: 400 });
    }

    const now = new Date().toISOString();
    const ipAddress = request.headers.get('cf-connecting-ip') || null;
    const userAgent = request.headers.get('user-agent') || null;
    const acceptanceRows = normalized.map((item: any) => ({
      staff_profile_id: context.profile.id,
      user_id: context.user.id,
      staff_user_id: context.user.id,
      agreement_code: item.agreement_code,
      agreement_type: item.agreement_type,
      agreement_title: item.agreement_title,
      version: item.version,
      agreement_version: item.agreement_version,
      document_hash: item.document_hash,
      accepted: true,
      approval_status: 'accepted',
      accepted_ip: ipAddress,
      ip_address: ipAddress,
      user_agent: userAgent,
      signed_document_ref: null,
      accepted_at: now,
    }));

    const { error: acceptanceError } = await (
      context.adminClient.from('staff_agreement_acceptances' as any) as any
    ).upsert(acceptanceRows, { onConflict: 'user_id,agreement_code' });

    if (acceptanceError) {
      return NextResponse.json(
        { ok: false, error: 'The Founder agreement acceptances could not be recorded.' },
        { status: 500 }
      );
    }

    const { data: completedProfile, error: completionError } = await (
      context.adminClient.from('staff_profiles' as any) as any
    )
      .update({
        privacy_notice_accepted: true,
        privacy_notice_accepted_at: now,
        all_agreements_accepted: true,
        agreements_completed: true,
        onboarding_completed: true,
        updated_at: now,
      })
      .eq('id', context.profile.id)
      .eq('user_id', context.user.id)
      .eq('role_slug', 'founder')
      .eq('status', 'active')
      .select('id,staff_id,role_slug,department,agreements_completed,privacy_notice_accepted')
      .maybeSingle();

    if (completionError || !completedProfile) {
      return NextResponse.json(
        { ok: false, error: 'Acceptances were recorded but the Founder profile could not be finalized. Contact support before retrying.' },
        { status: 500 }
      );
    }

    await recordStaffAuditLog({
      actorUserId: context.user.id,
      actorEmail: context.user.email ?? null,
      staffId: context.profile.staff_id,
      roleSlug: 'founder',
      action: 'founder_agreements_accepted',
      targetType: 'staff_profile',
      targetId: context.profile.id,
      result: 'success',
      reason: 'Founder explicitly accepted the current eight staff governance agreements and privacy notice.',
      afterState: {
        agreements_completed: true,
        privacy_notice_accepted: true,
        agreement_count: acceptanceRows.length,
      },
    });

    return NextResponse.json({
      ok: true,
      message: 'Founder agreements and privacy notice have been recorded. Sign in again and complete TOTP MFA before using the command centre.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Could not save Founder agreement acceptance.' },
      { status: 500 }
    );
  }
}
