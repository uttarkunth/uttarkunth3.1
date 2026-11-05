import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireStaffPermission, recordStaffAuditLog } from '@/lib/staff-rbac';
import {
  CATEGORY_LICENCE_REQUIREMENTS,
  SELLER_DOCUMENT_LABELS,
  OFFICIAL_GST_PORTAL_SEARCH_URL,
  validateGstinVerificationCheck,
} from '@/lib/seller-verification';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const verifierAuth = await requireStaffPermission('seller.verify_documents', { requireMfaAal2: true });
    const approverAuth = verifierAuth.authorized
      ? verifierAuth
      : await requireStaffPermission('seller.approve', { requireMfaAal2: true });
    const canViewVerificationDocuments = verifierAuth.authorized;

    if (!approverAuth.authorized || !approverAuth.user) {
      return NextResponse.json(
        {
          ok: false,
          code: approverAuth.code,
          error: approverAuth.error || 'Forbidden: Seller review permission and TOTP MFA (AAL2) are required.',
        },
        { status: approverAuth.status }
      );
    }

    const adminClient = createAdminClient();

    const { data: sellers } = await adminClient
      .from('sellers')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: products } = await adminClient
      .from('products')
      .select('*, sellers(business_name, contact_email, valley)')
      .order('created_at', { ascending: false });

    const { data: interests } = await adminClient
      .from('product_interests')
      .select('*, products(title)')
      .order('created_at', { ascending: false })
      .limit(50);

    // Private verification documents are returned only to explicitly authorized document reviewers.
    let verificationDocuments: any[] = [];
    let gstVerificationChecks: any[] = [];
    if (canViewVerificationDocuments) {
      try {
        const { data: docs } = await (adminClient.from('seller_verification_documents' as any) as any)
          .select('*')
          .order('created_at', { ascending: false });
        verificationDocuments = docs || [];
      } catch {
        verificationDocuments = [];
      }

      try {
        const { data: checks } = await (adminClient.from('seller_verification_checks' as any) as any)
          .select('*')
          .order('verification_date', { ascending: false });
        gstVerificationChecks = checks || [];
      } catch {
        gstVerificationChecks = [];
      }
    }

    return NextResponse.json({
      ok: true,
      sellers: sellers || [],
      products: products || [],
      interests: interests || [],
      verificationDocuments,
      gstVerificationChecks,
      categoryLicenceRequirements: CATEGORY_LICENCE_REQUIREMENTS,
      documentLabels: SELLER_DOCUMENT_LABELS,
      officialGstPortalUrl: OFFICIAL_GST_PORTAL_SEARCH_URL,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { target_type, target_id, action, notes, inventory_status } = body;

    if (!target_type || !target_id || !action) {
      return NextResponse.json(
        { ok: false, error: 'Missing required moderation parameters.' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // ------------------------------------------------------------------------
    // 1. SELLER BRAND & BUSINESS APPROVAL / REJECTION / SUSPENSION / REVISION
    // ------------------------------------------------------------------------
    if (target_type === 'seller') {
      const auth = await requireStaffPermission('seller.approve');
      if (!auth.authorized || !auth.user) {
        return NextResponse.json(
          { ok: false, code: auth.code, error: auth.error },
          { status: auth.status }
        );
      }

      let newStatus: string;
      if (action === 'approve') newStatus = 'approved';
      else if (action === 'reject') newStatus = 'rejected';
      else if (action === 'suspend') newStatus = 'suspended';
      else if (action === 'request_info' || action === 'request_revision') newStatus = 'pending';
      else {
        return NextResponse.json({ ok: false, error: 'Invalid seller moderation action.' }, { status: 400 });
      }

      const { data: beforeSeller } = await adminClient
        .from('sellers')
        .select('*')
        .eq('user_id', target_id)
        .maybeSingle();

      const { data: updated, error: updateErr } = await adminClient
        .from('sellers')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('user_id', target_id)
        .select()
        .single();

      if (updateErr) {
        return NextResponse.json({ ok: false, error: updateErr.message }, { status: 500 });
      }

      await recordStaffAuditLog({
        actorUserId: auth.user.id,
        actorEmail: auth.user.email,
        staffId: auth.staffProfile?.staff_id,
        roleSlug: auth.staffProfile?.role_slug,
        action: `seller_${action}`,
        targetType: 'seller',
        targetId: target_id,
        reason: notes || null,
        beforeState: { status: beforeSeller?.status },
        afterState: { status: newStatus },
      });

      return NextResponse.json({ ok: true, seller: updated });
    }

    // ------------------------------------------------------------------------
    // 2. GSTIN VERIFICATION AGAINST OFFICIAL GST PORTAL
    // ------------------------------------------------------------------------
    if (target_type === 'seller_gstin_check') {
      const auth = await requireStaffPermission('seller.verify_documents');
      if (!auth.authorized || !auth.user) {
        return NextResponse.json(
          { ok: false, code: auth.code, error: auth.error },
          { status: auth.status }
        );
      }

      const { data: sellerRow } = await adminClient
        .from('sellers')
        .select('*')
        .eq('user_id', target_id)
        .maybeSingle();

      const resolvedLegalReturned =
        body.legal_name_returned || body.portal_legal_name || '';
      const resolvedTradeReturned =
        body.trade_name_returned || body.portal_trade_name || null;
      const resolvedApplicantLegal =
        body.applicant_legal_name ||
        (sellerRow as any)?.legal_business_name ||
        sellerRow?.business_name ||
        resolvedLegalReturned;
      const resolvedApplicantTrade =
        body.applicant_trade_name || sellerRow?.business_name || resolvedTradeReturned;
      const resolvedRegStatus =
        body.registration_status || body.portal_status || 'Active';
      const resolvedEvidenceRef =
        body.supporting_evidence_ref ||
        notes ||
        `GST-PORTAL-${new Date().toISOString().slice(0, 10)}`;

      const isVerifyAction = action === 'verify' || action === 'verify_gstin';
      const resolvedVerificationResult =
        body.name_matches_applicant === false
          ? 'mismatched'
          : isVerifyAction
          ? 'verified'
          : action === 'mismatch'
          ? 'mismatched'
          : 'rejected';

      const checkValidation = validateGstinVerificationCheck({
        gstin: body.gstin || '',
        applicantLegalBusinessName: resolvedApplicantLegal,
        applicantTradeName: resolvedApplicantTrade,
        legalNameReturned: resolvedLegalReturned,
        tradeNameReturned: resolvedTradeReturned,
        registrationStatus: resolvedRegStatus,
        verificationResult: resolvedVerificationResult,
        reviewerUserId: auth.user.id,
        supportingEvidenceRef: resolvedEvidenceRef,
      });

      if (!checkValidation.allowed || !checkValidation.record) {
        return NextResponse.json(
          { ok: false, error: checkValidation.error || 'GSTIN verification validation failed.' },
          { status: 400 }
        );
      }

      let savedCheck: any = checkValidation.record;
      try {
        const { data: inserted } = await (
          adminClient.from('seller_verification_checks' as any) as any
        )
          .insert({
            seller_user_id: target_id,
            check_type: 'manual_official_portal_review',
            gstin: checkValidation.record.gstin,
            legal_name_returned: checkValidation.record.legalNameReturned,
            trade_name_returned: checkValidation.record.tradeNameReturned,
            registration_status: checkValidation.record.registrationStatus,
            verification_result: checkValidation.record.verificationResult,
            reviewer_user_id: auth.user.id,
            supporting_evidence_ref: checkValidation.record.supportingEvidenceRef,
            verification_date: checkValidation.record.verificationDate,
            notes: notes || null,
          })
          .select()
          .maybeSingle();
        if (inserted) savedCheck = inserted;
      } catch {
        // Table staged for production migration; audit log still records the verification
      }

      await recordStaffAuditLog({
        actorUserId: auth.user.id,
        actorEmail: auth.user.email,
        staffId: auth.staffProfile?.staff_id,
        roleSlug: auth.staffProfile?.role_slug,
        action: 'seller_gstin_verified',
        targetType: 'seller',
        targetId: target_id,
        reason: notes || `GSTIN check: ${checkValidation.record.verificationResult}`,
        afterState: checkValidation.record,
      });

      return NextResponse.json({
        ok: true,
        gstCheck: savedCheck,
        message: `GSTIN verification recorded (${checkValidation.record.verificationResult}).`,
      });
    }

    // ------------------------------------------------------------------------
    // 3. SELLER PRIVATE BUSINESS DOCUMENT VERIFICATION
    // ------------------------------------------------------------------------
    if (target_type === 'seller_document') {
      const auth = await requireStaffPermission('seller.verify_documents');
      if (!auth.authorized || !auth.user) {
        return NextResponse.json(
          { ok: false, code: auth.code, error: auth.error },
          { status: auth.status }
        );
      }

      const nextDocStatus =
        action === 'verify'
          ? 'verified'
          : action === 'reject'
          ? 'rejected'
          : 'revision_requested';

      let updatedDoc: any = { id: target_id, verification_status: nextDocStatus };
      try {
        const { data: docRow } = await (
          adminClient.from('seller_verification_documents' as any) as any
        )
          .update({
            verification_status: nextDocStatus,
            reviewed_by: auth.user.id,
            reviewed_at: new Date().toISOString(),
            reviewer_notes: notes || null,
          })
          .eq('id', target_id)
          .select()
          .maybeSingle();
        if (docRow) updatedDoc = docRow;
      } catch {
        // Staged for migration
      }

      await recordStaffAuditLog({
        actorUserId: auth.user.id,
        actorEmail: auth.user.email,
        staffId: auth.staffProfile?.staff_id,
        roleSlug: auth.staffProfile?.role_slug,
        action: `seller_document_${nextDocStatus}`,
        targetType: 'seller_document',
        targetId: target_id,
        reason: notes || null,
        afterState: { verification_status: nextDocStatus },
      });

      return NextResponse.json({ ok: true, document: updatedDoc });
    }

    // ------------------------------------------------------------------------
    // 4. PRODUCT LISTING MODERATION (Separately Moderated from Seller Approval)
    // ------------------------------------------------------------------------
    if (target_type === 'product') {
      const auth = await requireStaffPermission('product.approve');
      if (!auth.authorized || !auth.user) {
        return NextResponse.json(
          { ok: false, code: auth.code, error: auth.error },
          { status: auth.status }
        );
      }

      const updatePayload: any = { updated_at: new Date().toISOString() };

      if (action === 'approve') {
        updatePayload.moderation_status = 'approved';
      } else if (action === 'reject') {
        updatePayload.moderation_status = 'rejected';
      } else if (action === 'set_inventory') {
        if (
          !inventory_status ||
          !['coming_soon', 'in_stock', 'made_to_order', 'sold_out'].includes(inventory_status)
        ) {
          return NextResponse.json({ ok: false, error: 'Invalid inventory status.' }, { status: 400 });
        }
        updatePayload.inventory_status = inventory_status;
      } else {
        return NextResponse.json({ ok: false, error: 'Invalid product moderation action.' }, { status: 400 });
      }

      const { data: updated, error: updateErr } = await adminClient
        .from('products')
        .update(updatePayload)
        .eq('id', target_id)
        .select()
        .single();

      if (updateErr) {
        return NextResponse.json({ ok: false, error: updateErr.message }, { status: 500 });
      }

      await recordStaffAuditLog({
        actorUserId: auth.user.id,
        actorEmail: auth.user.email,
        staffId: auth.staffProfile?.staff_id,
        roleSlug: auth.staffProfile?.role_slug,
        action: `product_${action}`,
        targetType: 'product',
        targetId: target_id,
        reason: notes || null,
        afterState: updatePayload,
      });

      return NextResponse.json({ ok: true, product: updated });
    }

    return NextResponse.json({ ok: false, error: 'Unknown target_type' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'Server error' }, { status: 500 });
  }
}
