import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  canAccessSellerVerificationDocument,
  validatePrivateDocumentUpload,
  validateFileMagicBytes,
  SELLER_DOCUMENT_LABELS,
  type SellerDocumentType,
} from '@/lib/seller-verification';
import { requireStaffPermission, recordStaffAuditLog } from '@/lib/staff-rbac';

export const dynamic = 'force-dynamic';

/**
 * POST /api/products/documents
 * Uploads a private seller verification document into the private 'seller-verification-docs' bucket.
 * Requires an authenticated Uttarkunth member session.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Please sign in before uploading verification documents.' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const documentType = String(
      formData.get('document_type') || formData.get('doc_type') || 'provenance_evidence'
    );
    const referenceNumber = String(
      formData.get('document_reference_number') || formData.get('reference_number') || ''
    ).trim();
    const expiryDate = String(
      formData.get('expiry_date') || formData.get('expires_at') || ''
    ).trim();

    if (!file) {
      return NextResponse.json(
        { ok: false, error: 'Missing file in multipart upload.' },
        { status: 400 }
      );
    }

    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `seller-verification/${user.id}/${documentType}-${Date.now()}-${safeFileName}`;

    const metaValidation = validatePrivateDocumentUpload({
      fileName: safeFileName,
      mimeType: file.type,
      sizeBytes: file.size,
      storageBucket: 'seller-verification-docs',
      storagePath,
      isPublicUrl: false,
    });

    if (!metaValidation.valid) {
      return NextResponse.json(
        { ok: false, error: metaValidation.error || 'Invalid document file.' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    const arrayBuffer = await file.arrayBuffer();

    const magicCheck = validateFileMagicBytes(new Uint8Array(arrayBuffer), file.type);
    if (!magicCheck.valid) {
      return NextResponse.json(
        { ok: false, error: magicCheck.error },
        { status: 400 }
      );
    }

    const { error: uploadError } = await adminClient.storage
      .from('seller-verification-docs')
      .upload(storagePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        {
          ok: false,
          error: `Private compliance storage upload failed: ${uploadError.message}. Verify 'seller-verification-docs' bucket exists in Supabase Storage.`,
        },
        { status: 503 }
      );
    }

    const documentTitle =
      SELLER_DOCUMENT_LABELS[documentType as SellerDocumentType] || safeFileName;

    return NextResponse.json({
      ok: true,
      document: {
        doc_type: documentType,
        document_type: documentType,
        document_title: documentTitle,
        storage_bucket: 'seller-verification-docs',
        storage_path: storagePath,
        mime_type: file.type,
        size_bytes: file.size,
        file_size_bytes: file.size,
        reference_number: referenceNumber || null,
        document_reference_number: referenceNumber || null,
        expires_at: expiryDate || null,
        expiry_date: expiryDate || null,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || 'Document upload failed.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/products/documents?id=<doc_id>
 * Generates a short-lived (60-second) signed URL for a private seller verification document.
 * Strictly enforces:
 * - Only the owning seller OR active staff with 'seller.verify_documents' / 'finance.review_agreements' + AAL2 MFA
 * - Support Executives and other sellers are strictly prohibited (403)
 * - Every staff view is recorded in staff_audit_log
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const docId = req.nextUrl.searchParams.get('id');
    const requestedPath = req.nextUrl.searchParams.get('path');
    const requestedSellerId = req.nextUrl.searchParams.get('seller_id');

    const adminClient = createAdminClient();
    let docRecord: any = null;

    if (docId) {
      const { data } = await (adminClient.from('seller_verification_documents' as any) as any)
        .select('*')
        .eq('id', docId)
        .maybeSingle();
      docRecord = data;
    } else if (requestedPath) {
      const { data } = await (adminClient.from('seller_verification_documents' as any) as any)
        .select('*')
        .eq('storage_path', requestedPath)
        .maybeSingle();
      docRecord = data;
    }

    if (!docRecord) {
      return NextResponse.json(
        { ok: false, error: 'Verification document record not found.' },
        { status: 404 }
      );
    }

    const ownerUserId = docRecord.seller_user_id || requestedSellerId;

    // Resolve staff context if the requester is not the document owner
    let staffContext: any = null;
    let staffAuthResult: any = null;
    if (user.id !== ownerUserId) {
      const docVerifyAuth = await requireStaffPermission('seller.verify_documents', {
        requireMfaAal2: true,
      });
      const financeAuth = !docVerifyAuth.authorized
        ? await requireStaffPermission('finance.review_agreements', { requireMfaAal2: true })
        : docVerifyAuth;

      staffAuthResult = financeAuth;
      if (financeAuth.authorized && financeAuth.staffProfile) {
        staffContext = {
          isActiveStaff: true,
          roleSlug: financeAuth.staffProfile.role_slug,
          permissions: financeAuth.effectivePermissions,
          mfaAssuranceLevel: 'aal2' as const,
        };
      }
    }

    const accessDecision = canAccessSellerVerificationDocument({
      actorUserId: user.id,
      documentSellerUserId: ownerUserId,
      accessType: 'download_signed_url',
      staffContext,
    });

    if (!accessDecision.allowed) {
      return NextResponse.json(
        { ok: false, error: accessDecision.reason },
        { status: 403 }
      );
    }

    const bucket = docRecord.storage_bucket || 'seller-verification-docs';
    const { data: signed, error: signErr } = await adminClient.storage
      .from(bucket)
      .createSignedUrl(docRecord.storage_path, 60);

    if (signErr || !signed?.signedUrl) {
      return NextResponse.json(
        { ok: false, error: signErr?.message || 'Failed to generate signed URL.' },
        { status: 500 }
      );
    }

    if (staffContext && staffAuthResult?.user) {
      await recordStaffAuditLog({
        actorUserId: user.id,
        actorEmail: user.email,
        staffId: staffAuthResult.staffProfile?.staff_id,
        roleSlug: staffAuthResult.staffProfile?.role_slug,
        action: 'view_seller_verification_document_signed_url',
        targetType: 'seller_verification_document',
        targetId: String(docRecord.id),
        reason: `Viewed ${docRecord.document_type} for seller ${ownerUserId}`,
        afterState: {
          storage_bucket: bucket,
          storage_path: docRecord.storage_path,
          expires_in_seconds: 60,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      signedUrl: signed.signedUrl,
      expiresInSeconds: 60,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || 'Server error' },
      { status: 500 }
    );
  }
}
