import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkIsPlatformAdmin } from '@/lib/auth';
import { generateCanonicalAgreementDigest, OFFICIAL_LEGAL_TERMS_DOCUMENTS } from '@/lib/commission';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({
        ok: false,
        error: 'Unauthorized: Authenticated host account required.'
      }, { status: 401 });
    }

    const body = await req.json();
    const { agreement_id, expected_terms_version, terms_digest: clientSuppliedDigest } = body;

    if (!agreement_id) {
      return NextResponse.json({
        ok: false,
        error: 'Agreement ID is required.'
      }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Fetch agreement and associated property
    const { data: agreement, error: agErr } = await adminClient
      .from('host_agreements')
      .select('*, properties(id, name, host_id)')
      .eq('id', agreement_id)
      .single();

    if (agErr || !agreement) {
      return NextResponse.json({
        ok: false,
        error: 'Host commercial agreement not found.'
      }, { status: 404 });
    }

    const property = (agreement as any).properties;
    const isPrimaryHost = Boolean(property?.host_id && property.host_id === user.id);
    const isDesignatedSignatory = Boolean(agreement.host_user_id && agreement.host_user_id === user.id);

    // Signatory Authorization Rules:
    // 1. If property has an assigned primary host (property.host_id IS NOT NULL):
    //    Only the assigned primary host OR an explicitly designated signatory on the draft may accept.
    // 2. If property has NO assigned primary host (property.host_id IS NULL, e.g. Yash Home Stay, Wonderway Retreat):
    //    Acceptance strictly requires an explicitly designated signatory pre-assigned on the agreement draft.
    //    If agreement.host_user_id is null, acceptance is strictly prohibited until explicitly designated.
    // 3. Platform administrators do NOT automatically sign commercial terms unless explicitly pre-designated.
    // 4. Managers and co-hosts cannot sign without explicit legal signatory designation on the draft.
    const isAuthorizedSignatory = property?.host_id
      ? (isPrimaryHost || isDesignatedSignatory)
      : isDesignatedSignatory;

    if (!isAuthorizedSignatory) {
      return NextResponse.json({
        ok: false,
        error: property?.host_id
          ? 'Forbidden: Only the primary assigned property host or an explicitly designated authorized signatory can legally accept commercial partnership terms. Property managers and co-hosts are not authorized commercial signatories.'
          : 'Forbidden: This property has no primary host assigned. Commercial agreements require an explicit, pre-designated authorized signatory before acceptance.'
      }, { status: 403 });
    }

    if (agreement.accepted_at) {
      return NextResponse.json({
        ok: false,
        error: 'Agreement terms have already been formally accepted and activated.'
      }, { status: 400 });
    }

    // 2. Verify terms version alignment and legal document registration
    const currentTermsVersion = agreement.terms_version || '2026.1';
    const legalDoc = OFFICIAL_LEGAL_TERMS_DOCUMENTS[currentTermsVersion];
    if (!legalDoc) {
      return NextResponse.json({
        ok: false,
        error: `Unregistered legal terms version (${currentTermsVersion}). Agreements must reference an approved legal terms document.`
      }, { status: 400 });
    }

    if (expected_terms_version && expected_terms_version !== currentTermsVersion) {
      return NextResponse.json({
        ok: false,
        error: `Terms version mismatch: presented version (${expected_terms_version}) does not match current agreement version (${currentTermsVersion}).`
      }, { status: 409 });
    }

    // 3. Compute unambiguous canonical terms integrity digest strictly on server side
    const { digest: termsHash, canonicalPayload } = generateCanonicalAgreementDigest({
      id: agreement.id,
      property_id: agreement.property_id,
      signatory_user_id: user.id,
      agreement_start: agreement.agreement_start,
      agreement_end: agreement.agreement_end,
      commission_percent: agreement.commission_percent,
      standard_commission_percent: agreement.standard_commission_percent,
      intro_commission_percent: agreement.intro_commission_percent,
      intro_period_months: agreement.intro_period_months,
      terms_version: currentTermsVersion,
      document_hash: legalDoc.documentHash
    });

    // Prevent clients from supplying arbitrary or forged digests
    if (clientSuppliedDigest && clientSuppliedDigest !== termsHash) {
      return NextResponse.json({
        ok: false,
        error: 'Client-supplied digest mismatch: Client cannot supply an arbitrary or mismatched terms digest.'
      }, { status: 400 });
    }

    const acceptanceTimestamp = new Date().toISOString();

    // 3. Update agreement to active status with host signature evidence
    // Preserves immutable base terms_version ('2026.1') conforming to database immutability trigger
    const updatePayload = {
      host_user_id: user.id,
      agreement_status: 'active',
      accepted_at: acceptanceTimestamp,
      terms_version: currentTermsVersion, // Immutable base version
      terms_digest: termsHash, // Complete 64-character SHA-256 digest
      notes: agreement.notes
        ? `${agreement.notes}\n[Host Accepted: ${acceptanceTimestamp} by ${user.email} (UID: ${user.id}) | Digest: ${termsHash.slice(0, 16)}]`
        : `[Host Accepted: ${acceptanceTimestamp} by ${user.email} (UID: ${user.id}) | Digest: ${termsHash.slice(0, 16)}]`
    };

    let { error: updateErr } = await (adminClient.from('host_agreements') as any)
      .update(updatePayload)
      .eq('id', agreement.id);

    // If terms_digest column is not yet present on remote DB (pre-migration compatibility fallback),
    // retry update without terms_digest while retaining full hash in admin_audit_log
    if (updateErr && updateErr.message?.includes('terms_digest')) {
      const { terms_digest, ...fallbackPayload } = updatePayload;
      const fallbackResult = await (adminClient.from('host_agreements') as any)
        .update(fallbackPayload)
        .eq('id', agreement.id);
      updateErr = fallbackResult.error;
    }

    if (updateErr) {
      throw updateErr;
    }

    // 4. Record audit trail conforming to admin_audit_log constraints
    await adminClient.from('admin_audit_log').insert({
      actor_user_id: user.id,
      action: 'agreement_saved',
      target_type: 'agreement',
      target_id: agreement.id,
      details: {
        operation: 'host_agreement_accepted',
        host_user_id: user.id,
        host_email: user.email,
        property_id: agreement.property_id,
        terms_version: currentTermsVersion,
        document_hash: legalDoc.documentHash,
        terms_digest: termsHash,
        canonical_terms_payload: canonicalPayload,
        accepted_at: acceptanceTimestamp,
        commission_percent: agreement.commission_percent,
        standard_commission: agreement.standard_commission_percent,
        intro_commission: agreement.intro_commission_percent
      }
    });

    return NextResponse.json({
      ok: true,
      message: 'Commercial host agreement successfully accepted and activated.',
      accepted_at: acceptanceTimestamp,
      terms_digest: termsHash
    });
  } catch (err: any) {
    console.error('Host agreement acceptance error:', err);
    return NextResponse.json({
      ok: false,
      error: err.message || 'Failed to accept commercial agreement.'
    }, { status: 500 });
  }
}
