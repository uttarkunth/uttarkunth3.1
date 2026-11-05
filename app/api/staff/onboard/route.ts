import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  REQUIRED_STAFF_AGREEMENTS,
  computeDocumentHash,
  validateStaffInvitation,
  verifyAllStaffAgreementsCompleted,
  resolveOperationalDepartment,
  recordStaffAuditLog,
  type StaffAgreementType,
} from '@/lib/staff-rbac';

export const dynamic = 'force-dynamic';

/**
 * GET /api/staff/onboard?token=...
 * Validates a single-use staff invitation token against public.staff_invitations
 * and returns the invitation metadata along with the 8 mandatory Uttarkunth staff agreements.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || '';
  const agreementsWithHashes = REQUIRED_STAFF_AGREEMENTS.map((agr) => ({
    type: agr.type,
    code: agr.code,
    title: agr.title,
    version: agr.version,
    summary: agr.summary,
    canonicalContent: agr.canonicalContent,
    documentHash: computeDocumentHash(agr.canonicalContent),
  }));

  if (!token) {
    return NextResponse.json({
      ok: true,
      invitation: null,
      agreements: agreementsWithHashes,
      notice:
        'A valid Founder-issued single-use invitation token is required to submit staff onboarding.',
    });
  }

  const trimmedToken = token.trim();
  const tokenHash = crypto.createHash('sha256').update(trimmedToken, 'utf8').digest('hex');

  try {
    const adminClient = createAdminClient();
    const { data: inv, error: invErr } = await (
      adminClient.from('staff_invitations' as any) as any
    )
      .select('*')
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (invErr || !inv) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Invalid or unrecognized staff invitation token. Open registration is strictly prohibited.',
          agreements: agreementsWithHashes,
        },
        { status: 404 }
      );
    }

    const check = validateStaffInvitation(inv, inv.official_email);
    if (!check.valid) {
      return NextResponse.json(
        {
          ok: false,
          error: check.reason,
          agreements: agreementsWithHashes,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      invitation: {
        id: inv.id,
        official_email: inv.official_email,
        department: inv.department,
        designation: inv.designation || inv.proposed_designation,
        proposed_designation: inv.proposed_designation || inv.designation,
        role_slug: inv.role_slug || inv.role_code,
        role_code: inv.role_code || inv.role_slug,
        employment_category: inv.employment_category,
        expires_at: inv.expires_at,
      },
      agreements: agreementsWithHashes,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || 'Failed to validate invitation token.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/staff/onboard
 * Submits a staff onboarding application, creates or verifies a real Supabase Auth user UUID,
 * records acceptance of all 8 required staff agreements, and stores uploaded HR document references.
 * Never activates the staff account automatically — enters 'pending_founder_approval' queue.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const invitationToken = String(body.invitation_token || '').trim();
    const officialEmail = String(body.official_email || '')
      .trim()
      .toLowerCase();
    const fullLegalName = String(body.full_legal_name || '').trim();
    const password = String(body.password || '');

    if (!invitationToken || !officialEmail || !fullLegalName) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invitation token, full legal name, and official email are required.',
        },
        { status: 400 }
      );
    }

    // 1. Validate invitation token in PostgreSQL
    const tokenHash = crypto.createHash('sha256').update(invitationToken, 'utf8').digest('hex');
    const adminClient = createAdminClient();

    const { data: invitationRow, error: findErr } = await (
      adminClient.from('staff_invitations' as any) as any
    )
      .select('*')
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (findErr || !invitationRow) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Invitation not found. Open staff self-registration is strictly prohibited.',
        },
        { status: 403 }
      );
    }

    const invValidation = validateStaffInvitation(invitationRow, officialEmail);
    if (!invValidation.valid) {
      return NextResponse.json({ ok: false, error: invValidation.reason }, { status: 403 });
    }

    // 2. Strict Server-Side Verification of all 8 mandatory Uttarkunth staff agreements
    const rawAgreements: any[] = Array.isArray(body.accepted_agreements)
      ? body.accepted_agreements
      : Array.isArray(body.agreements)
      ? body.agreements
      : [];

    const nowIso = new Date().toISOString();
    const missingAgreements: string[] = [];
    const normalizedAcceptances: Array<{
      agreement_type: StaffAgreementType;
      agreement_code: StaffAgreementType;
      agreement_version: string;
      version: string;
      document_hash: string;
      accepted_at: string;
      signed_document_ref: string;
      approval_status: 'accepted';
    }> = [];

    for (const reqAgr of REQUIRED_STAFF_AGREEMENTS) {
      const submitted = rawAgreements.find(
        (a: any) =>
          ((a.agreement_type || a.agreement_code) === reqAgr.type ||
            (a.agreement_type || a.agreement_code) === reqAgr.code) &&
          a.accepted !== false
      );

      if (!submitted) {
        missingAgreements.push(reqAgr.type);
        continue;
      }

      // Compute canonical SHA-256 hash strictly from server canonical content
      const canonicalHash = computeDocumentHash(reqAgr.canonicalContent.trim());
      if (submitted.document_hash && submitted.document_hash !== canonicalHash) {
        return NextResponse.json(
          {
            ok: false,
            error: `Integrity Violation: document_hash mismatch for agreement '${reqAgr.type}'. Expected canonical digest ${canonicalHash}.`,
          },
          { status: 400 }
        );
      }

      normalizedAcceptances.push({
        agreement_type: reqAgr.type,
        agreement_code: reqAgr.code,
        agreement_version: submitted.agreement_version || submitted.version || reqAgr.version,
        version: submitted.version || submitted.agreement_version || reqAgr.version,
        document_hash: canonicalHash,
        accepted_at: nowIso,
        signed_document_ref:
          submitted.signed_document_ref || `SIGNED-${reqAgr.type.toUpperCase()}-2026`,
        approval_status: 'accepted',
      });
    }

    if (missingAgreements.length > 0 || normalizedAcceptances.length < 8) {
      return NextResponse.json(
        {
          ok: false,
          error: `All 8 mandatory Uttarkunth staff agreements must be completed. Missing: ${missingAgreements.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // 3. Resolve or create dedicated Supabase Auth user UUID (never fake string IDs)
    const supabase = createServerSupabaseClient();
    const {
      data: { user: currentSessionUser },
    } = await supabase.auth.getUser();

    let candidateUserId: string | null = null;

    if (
      currentSessionUser &&
      currentSessionUser.email &&
      currentSessionUser.email.trim().toLowerCase() === officialEmail
    ) {
      candidateUserId = currentSessionUser.id;
    } else {
      if (!password || password.length < 12) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'A strong staff password (minimum 12 characters) is required to create your dedicated staff identity.',
          },
          { status: 400 }
        );
      }

      const { data: createdAuthUser, error: createAuthErr } =
        await adminClient.auth.admin.createUser({
          email: officialEmail,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullLegalName,
            account_domain: 'staff',
          },
        });

      if (!createAuthErr && createdAuthUser?.user?.id) {
        candidateUserId = createdAuthUser.user.id;
      } else {
        // Safely handle conflict if invited email already belongs to an existing Auth account:
        // Require proof of credential ownership before linking, never creating duplicates or weakening security.
        const { data: verifiedSignIn, error: signInErr } =
          await supabase.auth.signInWithPassword({
            email: officialEmail,
            password,
          });

        if (signInErr || !verifiedSignIn?.user?.id) {
          return NextResponse.json(
            {
              ok: false,
              error:
                'An account with this official email already exists in Supabase Auth. Please sign in or provide your existing account password to link your staff profile safely.',
            },
            { status: 409 }
          );
        }
        candidateUserId = verifiedSignIn.user.id;
      }
    }

    if (!candidateUserId) {
      return NextResponse.json(
        { ok: false, error: 'Unable to establish authenticated staff user identity.' },
        { status: 500 }
      );
    }

    // 4. Consume single-use invitation atomically using reconciled canonical columns
    const { data: consumedInvite, error: consumeErr } = await (
      adminClient.from('staff_invitations' as any) as any
    )
      .update({
        used_at: nowIso,
        accepted_at: nowIso,
        accepted_by: candidateUserId,
        status: 'accepted',
      })
      .eq('id', invitationRow.id)
      .eq('status', 'pending')
      .is('used_at', null)
      .select()
      .maybeSingle();

    if (consumeErr || !consumedInvite) {
      return NextResponse.json(
        {
          ok: false,
          error: 'This single-use invitation has already been consumed or could not be locked.',
        },
        { status: 409 }
      );
    }

    // 5. Persist staff_profiles record in 'pending_founder_approval'
    const roleSlug = invitationRow.role_slug || invitationRow.role_code || 'operations_admin';
    const profilePayload = {
      user_id: candidateUserId,
      staff_id: null, // Issued only upon Founder approval
      full_legal_name: fullLegalName,
      preferred_name: body.preferred_name || fullLegalName,
      personal_email: String(body.personal_email || officialEmail).toLowerCase(),
      official_email: officialEmail,
      verified_mobile: String(body.verified_mobile || ''),
      current_address: body.current_address || null,
      emergency_contact_name: body.emergency_contact_name || null,
      emergency_contact_phone: body.emergency_contact_phone || null,
      designation:
        body.designation || invitationRow.designation || invitationRow.proposed_designation,
      department: resolveOperationalDepartment(invitationRow.department, roleSlug),
      role_slug: roleSlug,
      role_code: roleSlug,
      employment_category: invitationRow.employment_category,
      joining_date: body.joining_date || nowIso.slice(0, 10),
      previous_experience: body.previous_experience || null,
      professional_qualifications: body.professional_qualifications || null,
      reporting_manager: body.reporting_manager || 'Founder',
      assigned_responsibilities: body.assigned_responsibilities || '',
      identity_document_type: body.identity_document_type || 'passport',
      identity_document_ref:
        body.identity_document_ref || body.identity_document_reference || '',
      identity_document_reference:
        body.identity_document_reference || body.identity_document_ref || '',
      privacy_notice_accepted_at: body.privacy_notice_accepted ? nowIso : null,
      agreements_completed: true,
      all_agreements_accepted: true,
      mfa_enrolled: false,
      status: 'pending_founder_approval',
      founder_approved_at: null,
      founder_approved_by: null,
      updated_at: nowIso,
    };

    const { data: createdProfile, error: profErr } = await (
      adminClient.from('staff_profiles' as any) as any
    )
      .upsert(profilePayload, { onConflict: 'user_id' })
      .select()
      .single();

    if (profErr || !createdProfile) {
      return NextResponse.json(
        {
          ok: false,
          error: profErr?.message || 'Failed to save staff onboarding profile in database.',
        },
        { status: 500 }
      );
    }

    // 6. Persist all 8 mandatory agreement acceptances
    const ipHeader =
      req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || null;
    const userAgent = req.headers.get('user-agent') || null;

    for (const acc of normalizedAcceptances) {
      const { error: accErr } = await (
        adminClient.from('staff_agreement_acceptances' as any) as any
      ).upsert(
        {
          staff_profile_id: createdProfile.id,
          staff_user_id: candidateUserId,
          user_id: candidateUserId,
          agreement_type: acc.agreement_type,
          agreement_code: acc.agreement_code,
          agreement_version: acc.agreement_version,
          version: acc.version,
          document_hash: acc.document_hash,
          accepted_at: acc.accepted_at,
          accepted_ip: ipHeader,
          ip_address: ipHeader,
          user_agent: userAgent,
          signed_document_ref: acc.signed_document_ref,
          approval_status: 'accepted',
        },
        { onConflict: 'user_id,agreement_code' }
      );

      if (accErr) {
        console.error('Failed to record staff agreement acceptance:', accErr);
        return NextResponse.json(
          {
            ok: false,
            error: `Failed to record agreement acceptance for '${acc.agreement_type}': ${accErr.message}`,
          },
          { status: 500 }
        );
      }
    }

    // 7. Persist uploaded HR documents metadata with storage path isolation
    const hrDocuments = Array.isArray(body.hr_documents) ? body.hr_documents : [];
    for (const doc of hrDocuments) {
      if (doc && doc.storage_path) {
        if (
          !doc.storage_path.startsWith(`staff-onboarding/${invitationRow.id}/`) &&
          !doc.storage_path.startsWith(`staff-hr/${candidateUserId}/`)
        ) {
          return NextResponse.json(
            {
              ok: false,
              error: `Cross-tenant storage path rejected: HR document storage path '${doc.storage_path}' must be scoped to your onboarding application.`,
            },
            { status: 403 }
          );
        }

        const { error: docErr } = await (
          adminClient.from('staff_documents' as any) as any
        ).insert({
          staff_profile_id: createdProfile.id,
          user_id: candidateUserId,
          document_type: doc.document_type || 'passport',
          storage_bucket: 'staff-hr-docs',
          storage_path: doc.storage_path,
          mime_type: doc.mime_type || 'application/pdf',
          file_size_bytes: doc.file_size_bytes || doc.size_bytes || null,
          size_bytes: doc.size_bytes || doc.file_size_bytes || null,
        });

        if (docErr) {
          console.error('Failed to record staff document:', docErr);
        }
      }
    }

    await recordStaffAuditLog({
      actorUserId: candidateUserId,
      actorEmail: officialEmail,
      action: 'staff_onboarding_submitted',
      targetType: 'staff_profile',
      targetId: candidateUserId,
      reason:
        'Candidate completed onboarding form and 8/8 mandatory agreements; awaiting Founder approval.',
      afterState: {
        status: 'pending_founder_approval',
        department: invitationRow.department,
        role_slug: roleSlug,
        agreements_completed: 8,
      },
    });

    return NextResponse.json({
      ok: true,
      status: 'pending_founder_approval',
      message:
        'Onboarding dossier and all 8 Uttarkunth conduct agreements recorded. Your account remains inactive until reviewed and approved by the Founder.',
      profile: createdProfile,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'Server error' }, { status: 500 });
  }
}