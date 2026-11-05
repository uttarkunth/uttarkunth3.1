import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  canAccessSellerVerificationDocument,
  evaluateSellerDeskUpdate,
  validatePrivateDocumentUpload,
  getRequiredDocumentsForCategories,
  SELLER_DOCUMENT_LABELS,
} from '@/lib/seller-verification';

export const dynamic = 'force-dynamic';

/**
 * GET /api/products/seller-desk
 * Returns the authenticated seller's own profile, verification document statuses,
 * and required category licences. Never returns another seller's documents.
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

    // If a query param attempts to request another seller_id, enforce cross-tenant isolation
    const requestedSellerId = req.nextUrl.searchParams.get('seller_id') || user.id;
    const accessCheck = canAccessSellerVerificationDocument({
      actorUserId: user.id,
      documentSellerUserId: requestedSellerId,
      accessType: 'view_status',
    });

    if (!accessCheck.allowed) {
      return NextResponse.json({ ok: false, error: accessCheck.reason }, { status: 403 });
    }

    const adminClient = createAdminClient();
    const { data: seller } = await adminClient
      .from('sellers')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    let documents: any[] = [];
    try {
      const { data: docs } = await (
        adminClient.from('seller_verification_documents' as any) as any
      )
        .select('*')
        .eq('seller_user_id', user.id)
        .order('created_at', { ascending: false });
      documents = docs || [];
    } catch {
      documents = [];
    }

    let checks: any[] = [];
    try {
      const { data: checkRows } = await (
        adminClient.from('seller_verification_checks' as any) as any
      )
        .select('*')
        .eq('seller_user_id', user.id)
        .order('verification_date', { ascending: false });
      checks = checkRows || [];
    } catch {
      checks = [];
    }

    const requiredDocs = getRequiredDocumentsForCategories(
      (seller as any)?.primary_category || 'crafts',
      (seller as any)?.secondary_categories || [],
      (seller as any)?.tax_registration_status || 'gst_exempt_artisan'
    );

    return NextResponse.json({
      ok: true,
      seller,
      documents,
      checks,
      requiredDocs,
      documentLabels: SELLER_DOCUMENT_LABELS,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || 'Server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products/seller-desk
 * Allows an authenticated seller to:
 * - update_brand_profile (permitted public brand fields; legal identity changes trigger re-verification)
 * - upload_replacement_document (registers a private verification document in seller-verification-docs)
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body || {};

    const adminClient = createAdminClient();
    const { data: existingSeller } = await adminClient
      .from('sellers')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!existingSeller) {
      return NextResponse.json(
        { ok: false, error: 'Seller profile not found.' },
        { status: 404 }
      );
    }

    if (action === 'update_brand_profile') {
      // Support both nested body.updates and top-level fields from SellerDeskGovernancePanel
      const rawUpdates: Record<string, any> =
        body.updates && typeof body.updates === 'object'
          ? { ...body.updates }
          : { ...body };
      delete rawUpdates.action;
      delete rawUpdates.updates;

      if (rawUpdates.brand_name && !rawUpdates.business_name) {
        rawUpdates.business_name = rawUpdates.brand_name;
      }

      const evalUpdate = evaluateSellerDeskUpdate(existingSeller, rawUpdates, false);
      if (!evalUpdate.allowed) {
        return NextResponse.json({ ok: false, error: evalUpdate.error }, { status: 403 });
      }

      const baseUpdates: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (evalUpdate.sanitizedUpdate.business_name) {
        baseUpdates.business_name = evalUpdate.sanitizedUpdate.business_name;
      }
      if (evalUpdate.sanitizedUpdate.bio !== undefined) {
        baseUpdates.bio = evalUpdate.sanitizedUpdate.bio;
      }
      if (evalUpdate.sanitizedUpdate.materials !== undefined) {
        baseUpdates.materials = evalUpdate.sanitizedUpdate.materials;
      }
      if (evalUpdate.sanitizedUpdate.contact_phone !== undefined) {
        baseUpdates.contact_phone = evalUpdate.sanitizedUpdate.contact_phone;
      }
      if (evalUpdate.triggersReverification) {
        baseUpdates.status = 'pending';
      }

      const extendedUpdates: Record<string, any> = {
        ...baseUpdates,
      };
      if (evalUpdate.sanitizedUpdate.legal_business_name !== undefined) {
        extendedUpdates.legal_business_name =
          evalUpdate.sanitizedUpdate.legal_business_name;
      }
      if (evalUpdate.sanitizedUpdate.gstin !== undefined) {
        extendedUpdates.gstin = evalUpdate.sanitizedUpdate.gstin;
      }
      if (evalUpdate.triggersReverification) {
        extendedUpdates.verification_status = 'reverification_pending';
      }

      let updatedSeller: any = null;
      const { data: extSeller, error: extErr } = await (
        adminClient.from('sellers') as any
      )
        .update(extendedUpdates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (!extErr && extSeller) {
        updatedSeller = extSeller;
      } else {
        const { data: fallbackSeller, error: updErr } = await (
          adminClient.from('sellers') as any
        )
          .update(baseUpdates)
          .eq('user_id', user.id)
          .select()
          .single();

        if (updErr) {
          return NextResponse.json({ ok: false, error: updErr.message }, { status: 500 });
        }
        updatedSeller = fallbackSeller;
      }

      return NextResponse.json({
        ok: true,
        seller: updatedSeller,
        triggersReverification: evalUpdate.triggersReverification,
        message: evalUpdate.triggersReverification
          ? 'Changes to legal business or verification information recorded. Your profile has been queued for compliance re-verification.'
          : 'Public brand profile updated.',
      });
    }

    if (action === 'upload_replacement_document') {
      const {
        doc_type,
        document_type,
        document_title,
        storage_path,
        mime_type,
        size_bytes,
        file_size_bytes,
        reference_number,
        document_reference_number,
        expires_at,
        expiry_date,
      } = body;

      const resolvedDocType = document_type || doc_type;
      const resolvedSizeBytes = Number(file_size_bytes ?? size_bytes ?? 240000);
      const resolvedRefNumber = document_reference_number || reference_number || null;
      const resolvedExpiry = expiry_date || expires_at || null;

      const allowedPrefix1 = `seller-verification/${user.id}/`;
      const allowedPrefix2 = `sellers/${user.id}/`;
      if (
        !String(storage_path || '').startsWith(allowedPrefix1) &&
        !String(storage_path || '').startsWith(allowedPrefix2)
      ) {
        return NextResponse.json(
          {
            ok: false,
            error: `Cross-tenant storage path injection rejected: Document storage path '${storage_path}' must be scoped to your seller user identity.`,
          },
          { status: 403 }
        );
      }

      const validation = validatePrivateDocumentUpload({
        fileName: document_title || storage_path || '',
        mimeType: mime_type || '',
        sizeBytes: resolvedSizeBytes,
        storageBucket: 'seller-verification-docs',
        storagePath: storage_path,
        isPublicUrl:
          String(storage_path || '').startsWith('http://') ||
          String(storage_path || '').startsWith('https://'),
      });

      if (!validation.valid) {
        return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });
      }

      let savedDoc: any = {
        seller_user_id: user.id,
        document_type: resolvedDocType,
        document_title: document_title || resolvedDocType,
        storage_bucket: 'seller-verification-docs',
        storage_path,
        mime_type,
        size_bytes: resolvedSizeBytes,
        file_size_bytes: resolvedSizeBytes,
        reference_number: resolvedRefNumber,
        document_reference_number: resolvedRefNumber,
        expires_at: resolvedExpiry,
        expiry_date: resolvedExpiry,
        verification_status: 'pending',
      };

      const { data: inserted, error: insertErr } = await (
        adminClient.from('seller_verification_documents' as any) as any
      )
        .insert(savedDoc)
        .select()
        .maybeSingle();

      if (!insertErr && inserted) {
        savedDoc = inserted;
      } else if (insertErr) {
        return NextResponse.json(
          {
            ok: false,
            error: `Failed to record verification document in database: ${insertErr.message}`,
          },
          { status: 503 }
        );
      }

      return NextResponse.json({
        ok: true,
        document: savedDoc,
        message:
          'Verification document recorded in private compliance storage for reviewer check.',
      });
    }

    return NextResponse.json(
      { ok: false, error: 'Unsupported Seller Desk action.' },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || 'Server error' },
      { status: 500 }
    );
  }
}
