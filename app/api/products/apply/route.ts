import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { SellerApplicationSchema, validatePayload } from '@/lib/validations';
import {
  validateIndianGSTIN,
  getRequiredDocumentsForCategories,
  validatePrivateDocumentUpload,
  SELLER_DOCUMENT_LABELS,
  type SellerDocumentType,
} from '@/lib/seller-verification';

const applyRateMap = new Map<string, { count: number; resetAt: number }>();

function checkApplyRateLimit(ip: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = applyRateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    applyRateMap.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }
  entry.count += 1;
  return { allowed: entry.count <= limit };
}

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limit Check (max 5 applications per hour per IP)
    const ip =
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown';
    const rateLimit = checkApplyRateLimit(`seller_apply_${ip}`, 5, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { ok: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Please sign in to apply as an artisan or maker.' },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Reject any attempt to submit bank account or payout details (Section C.11)
    if (
      body?.bank_account_number ||
      body?.ifsc_code ||
      body?.upi_id ||
      body?.payout_account
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Uttarkunth does not collect bank account or payout details at application time.',
        },
        { status: 400 }
      );
    }

    // 2. Strict Schema Validation & Sanitization
    const validation = validatePayload(SellerApplicationSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error, details: validation.details },
        { status: 400 }
      );
    }

    const {
      business_name,
      maker_name,
      valley,
      state,
      craft_type,
      contact_email,
      contact_phone,
      bio,
      materials,
      website_url,
      social_links,
      legal_business_name,
      trade_name,
      business_constitution,
      primary_category,
      secondary_categories,
      registered_address,
      dispatch_address,
      business_contact_name,
      business_contact_phone,
      tax_registration_status,
      gstin,
      registration_number,
      authorized_representative_name,
      authorized_representative_role,
      submitted_documents,
      verification_documents,
    } = validation.data;

    // 3. Enforce Indian GSTIN validation + Modulo-36 checksum when provided
    let normalizedGstin: string | null = null;
    if (
      tax_registration_status === 'gst_registered' ||
      tax_registration_status === 'composition_scheme' ||
      (gstin && gstin.trim().length > 0)
    ) {
      const gstCheck = validateIndianGSTIN(gstin || '');
      if (!gstCheck.valid) {
        return NextResponse.json(
          {
            ok: false,
            error:
              gstCheck.error ||
              'Invalid 15-character Indian GSTIN. Please verify the state code, PAN segment, and check digit.',
          },
          { status: 400 }
        );
      }
      normalizedGstin = gstCheck.normalized;
    }

    // 4. Normalize submitted documents from either submitted_documents or verification_documents
    const rawDocs = [
      ...(Array.isArray(submitted_documents) ? submitted_documents : []),
      ...(Array.isArray(verification_documents) ? verification_documents : []),
    ];

    const normalizedDocs = rawDocs.map((doc) => {
      const resolvedType = String(
        doc.document_type || doc.doc_type || 'provenance_evidence'
      );
      const resolvedBytes = Number(doc.file_size_bytes ?? doc.size_bytes ?? 102400);
      const resolvedRef =
        doc.document_reference_number || doc.reference_number || null;
      const resolvedExpiry = doc.expiry_date || doc.expires_at || null;
      const resolvedTitle =
        doc.document_title ||
        SELLER_DOCUMENT_LABELS[resolvedType as SellerDocumentType] ||
        resolvedType;

      return {
        doc_type: resolvedType,
        document_type: resolvedType,
        document_title: resolvedTitle,
        storage_bucket: 'seller-verification-docs' as const,
        storage_path: doc.storage_path,
        mime_type: doc.mime_type,
        size_bytes: resolvedBytes,
        file_size_bytes: resolvedBytes,
        reference_number: resolvedRef,
        document_reference_number: resolvedRef,
        expires_at: resolvedExpiry,
        expiry_date: resolvedExpiry,
      };
    });

    // Validate private document upload metadata (reject public URLs, invalid MIME, >10MB)
    for (const doc of normalizedDocs) {
      const docCheck = validatePrivateDocumentUpload({
        fileName: doc.document_title,
        mimeType: doc.mime_type,
        sizeBytes: doc.size_bytes,
        storageBucket: 'seller-verification-docs',
        storagePath: doc.storage_path,
        isPublicUrl: /^https?:\/\//i.test(doc.storage_path),
      });
      if (!docCheck.valid) {
        return NextResponse.json(
          { ok: false, error: docCheck.error },
          { status: 400 }
        );
      }
    }

    // Determine category requirements for response metadata (trademark is always optional)
    const normalizedTaxStatus =
      tax_registration_status === 'unregistered_artisan' ||
      tax_registration_status === 'exempt_handicraft'
        ? 'gst_exempt_artisan'
        : tax_registration_status || 'gst_exempt_artisan';

    const requiredDocs = getRequiredDocumentsForCategories(
      primary_category || (craft_type as any) || 'crafts',
      secondary_categories || [],
      normalizedTaxStatus as any
    );

    const adminClient = createAdminClient();

    // Base seller record compatible with the live public.sellers schema
    const baseSellerRecord: Record<string, any> = {
      user_id: user.id,
      business_name,
      maker_name,
      valley,
      state,
      craft_type,
      contact_email,
      contact_phone: contact_phone || null,
      bio,
      materials: materials || null,
      website_url: website_url || null,
      social_links: social_links || [],
      status: 'pending',
      updated_at: new Date().toISOString(),
    };

    // Extended seller verification columns (defined in Phase 2 migration)
    const extendedSellerRecord: Record<string, any> = {
      ...baseSellerRecord,
      legal_business_name: legal_business_name || business_name,
      trade_name: trade_name || business_name,
      business_constitution: business_constitution || 'individual_artisan',
      primary_category: primary_category || 'crafts',
      secondary_categories: secondary_categories || [],
      registered_address: registered_address || null,
      dispatch_address: dispatch_address || null,
      business_contact_name: business_contact_name || maker_name,
      business_contact_phone: business_contact_phone || contact_phone || null,
      tax_registration_status: tax_registration_status || 'gst_exempt_artisan',
      gstin: normalizedGstin,
      registration_number: registration_number || null,
      authorized_representative_name: authorized_representative_name || maker_name,
      authorized_representative_role: authorized_representative_role || null,
      verification_status: 'pending',
    };

    let seller: any = null;
    const { data: extData, error: extError } = await (
      adminClient.from('sellers') as any
    )
      .upsert(extendedSellerRecord, { onConflict: 'user_id' })
      .select()
      .single();

    if (!extError && extData) {
      seller = extData;
    } else {
      // Fallback to base columns if extended columns are pending migration in Supabase
      const { data: baseData, error: baseError } = await adminClient
        .from('sellers')
        .upsert(baseSellerRecord, { onConflict: 'user_id' })
        .select()
        .single();

      if (baseError) {
        console.error('Seller application error:', baseError);
        return NextResponse.json(
          { ok: false, error: baseError.message },
          { status: 500 }
        );
      }
      seller = baseData;
    }

    // Persist private verification documents metadata into seller_verification_documents
    let persistedDocumentsCount = 0;
    if (normalizedDocs.length > 0) {
      const docRows = normalizedDocs.map((doc) => ({
        seller_user_id: user.id,
        document_type: doc.document_type,
        document_title: doc.document_title,
        storage_bucket: 'seller-verification-docs',
        storage_path: doc.storage_path,
        mime_type: doc.mime_type,
        size_bytes: doc.size_bytes,
        file_size_bytes: doc.file_size_bytes,
        reference_number: doc.reference_number,
        document_reference_number: doc.document_reference_number,
        expires_at: doc.expires_at,
        expiry_date: doc.expiry_date,
        verification_status: 'pending',
      }));

      const { data: insertedDocs, error: docInsertError } = await (
        adminClient.from('seller_verification_documents' as any) as any
      )
        .insert(docRows)
        .select();

      if (!docInsertError && Array.isArray(insertedDocs)) {
        persistedDocumentsCount = insertedDocs.length;
      } else if (docInsertError) {
        // Retry with minimal core columns if extended alias columns are absent
        const fallbackDocRows = normalizedDocs.map((doc) => ({
          seller_user_id: user.id,
          document_type: doc.document_type,
          storage_bucket: 'seller-verification-docs',
          storage_path: doc.storage_path,
          mime_type: doc.mime_type,
          file_size_bytes: doc.file_size_bytes,
          document_reference_number: doc.document_reference_number,
          expiry_date: doc.expiry_date,
          verification_status: 'pending',
        }));
        const { data: fallbackInserted } = await (
          adminClient.from('seller_verification_documents' as any) as any
        )
          .insert(fallbackDocRows)
          .select();
        if (Array.isArray(fallbackInserted)) {
          persistedDocumentsCount = fallbackInserted.length;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      seller,
      persistedDocumentsCount,
      verificationSummary: {
        legalBusinessName: legal_business_name || business_name,
        businessConstitution: business_constitution,
        taxRegistrationStatus: tax_registration_status,
        gstinNormalized: normalizedGstin,
        requiredDocuments: requiredDocs.mandatory,
        optionalDocuments: requiredDocs.optional,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || 'Server error' },
      { status: 500 }
    );
  }
}