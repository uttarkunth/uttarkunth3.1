import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  requireStaffPermission,
  validateStaffInvitation,
  recordStaffAuditLog,
} from '@/lib/staff-rbac';
import { validateUploadedDocumentMeta } from '@/lib/seller-verification';

export const dynamic = 'force-dynamic';

/**
 * GET /api/staff/documents?id=<doc_id> or ?path=<storage_path>
 * Generates a short-lived (60s) signed URL for private HR documents in 'staff-hr-docs'.
 * Strictly restricted to Founder or staff with 'staff.hr_docs.view' and AAL2 MFA.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireStaffPermission('staff.hr_docs.view', { requireMfaAal2: true });
    if (!auth.authorized || !auth.user) {
      return NextResponse.json(
        { ok: false, code: auth.code, error: auth.error },
        { status: auth.status }
      );
    }

    const storagePath = req.nextUrl.searchParams.get('path') || '';
    const docId = req.nextUrl.searchParams.get('id') || '';

    const adminClient = createAdminClient();
    let resolvedPath = storagePath;

    if (!resolvedPath && docId) {
      const { data: docRow } = await (adminClient.from('staff_documents' as any) as any)
        .select('storage_path, storage_bucket')
        .eq('id', docId)
        .maybeSingle();
      resolvedPath = docRow?.storage_path || '';
    }

    if (!resolvedPath) {
      return NextResponse.json(
        { ok: false, error: 'Missing staff document id or storage path.' },
        { status: 400 }
      );
    }

    const { data: signed, error: signErr } = await adminClient.storage
      .from('staff-hr-docs')
      .createSignedUrl(resolvedPath, 60);

    if (signErr || !signed?.signedUrl) {
      return NextResponse.json(
        { ok: false, error: signErr?.message || 'Unable to generate short-lived signed URL.' },
        { status: 500 }
      );
    }

    await recordStaffAuditLog({
      actorUserId: auth.user.id,
      actorEmail: auth.user.email,
      staffId: auth.staffProfile?.staff_id,
      roleSlug: auth.staffProfile?.role_slug,
      action: 'staff_hr_document_viewed',
      targetType: 'staff_document',
      targetId: docId || resolvedPath,
      reason: 'Generated 60-second signed URL for private HR document review.',
    });

    return NextResponse.json({
      ok: true,
      signedUrl: signed.signedUrl,
      expiresInSeconds: 60,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'Server error' }, { status: 500 });
  }
}

/**
 * POST /api/staff/documents
 * Uploads a private HR/identity verification file to the private 'staff-hr-docs' bucket.
 * Requires a valid, unused Founder invitation token matching the candidate's official email.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const invitationToken = String(formData.get('invitation_token') || '').trim();
    const officialEmail = String(formData.get('official_email') || '')
      .trim()
      .toLowerCase();
    const documentType = String(formData.get('document_type') || 'passport').trim();

    if (!file || !invitationToken || !officialEmail) {
      return NextResponse.json(
        { ok: false, error: 'File, invitation_token, and official_email are required.' },
        { status: 400 }
      );
    }

    const fileMetaCheck = validateUploadedDocumentMeta({
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      bucket: 'staff-hr-docs',
    });

    if (!fileMetaCheck.valid) {
      return NextResponse.json({ ok: false, error: fileMetaCheck.reason }, { status: 400 });
    }

    const tokenHash = crypto.createHash('sha256').update(invitationToken, 'utf8').digest('hex');
    const adminClient = createAdminClient();

    const { data: inv } = await (adminClient.from('staff_invitations' as any) as any)
      .select('*')
      .eq('token_hash', tokenHash)
      .maybeSingle();

    const invCheck = validateStaffInvitation(inv, officialEmail);
    if (!invCheck.valid) {
      return NextResponse.json({ ok: false, error: invCheck.reason }, { status: 403 });
    }

    const safeExt = (file.name.split('.').pop() || 'pdf').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const storagePath = `staff-onboarding/${inv.id}/${documentType}-${Date.now()}.${safeExt}`;
    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadErr } = await adminClient.storage
      .from('staff-hr-docs')
      .upload(storagePath, Buffer.from(arrayBuffer), {
        contentType: file.type,
        upsert: false,
      });

    if (uploadErr) {
      return NextResponse.json(
        {
          ok: false,
          error: `Failed to upload file to private bucket 'staff-hr-docs': ${uploadErr.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      document: {
        document_type: documentType,
        storage_bucket: 'staff-hr-docs',
        storage_path: storagePath,
        mime_type: file.type,
        file_size_bytes: file.size,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'Upload error' }, { status: 500 });
  }
}
