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
import {
  validateStockAdjustment,
  type InventoryAdjustmentReason,
} from '@/lib/marketplace';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

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

    const sellerRowId = (seller as any)?.id || user.id;

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

    let products: any[] = [];
    if (seller) {
      try {
        const { data: prodRows } = await adminClient
          .from('products')
          .select('*')
          .in('seller_id', [sellerRowId, user.id])
          .order('created_at', { ascending: false });
        products = prodRows || [];
      } catch {
        products = [];
      }
    }

    let brands: any[] = [];
    if (seller) {
      try {
        const { data: brandRows } = await (adminClient.from('brands' as any) as any)
          .select('*')
          .eq('seller_user_id', user.id)
          .order('created_at', { ascending: false });
        brands = brandRows || [];
      } catch {
        brands = [];
      }
    }

    let inventoryMovements: any[] = [];
    if (seller) {
      try {
        const { data: movRows } = await (
          adminClient.from('inventory_movements' as any) as any
        )
          .select('*')
          .eq('seller_id', sellerRowId)
          .order('created_at', { ascending: false })
          .limit(30);
        inventoryMovements = movRows || [];
      } catch {
        inventoryMovements = [];
      }
    }

    let shippingProfile: any = null;
    if (seller) {
      try {
        const { data: shipRow } = await (
          adminClient.from('seller_shipping_profiles' as any) as any
        )
          .select('*')
          .eq('seller_user_id', user.id)
          .maybeSingle();
        shippingProfile = shipRow || null;
      } catch {
        shippingProfile = null;
      }
    }

    let orders: any[] = [];
    if (seller) {
      try {
        const { data: orderRows } = await (
          adminClient.from('marketplace_order_items' as any) as any
        )
          .select('*, marketplace_orders(*)')
          .eq('seller_id', sellerRowId)
          .order('created_at', { ascending: false });
        orders = orderRows || [];
      } catch {
        orders = [];
      }
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
      products,
      brands,
      inventoryMovements,
      shippingProfile,
      orders,
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

    const sellerRowId = (existingSeller as any).id || user.id;

    if (action === 'update_brand_profile') {
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

    if (existingSeller.status !== 'approved') {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Forbidden: Your seller account must be approved before performing active Seller Desk operations.',
        },
        { status: 403 }
      );
    }

    if (action === 'adjust_inventory') {
      const { product_id, quantity_delta, reason, notes, low_stock_threshold } = body;
      if (!product_id) {
        return NextResponse.json(
          { ok: false, error: 'Product ID is required.' },
          { status: 400 }
        );
      }

      const { data: prod } = await adminClient
        .from('products')
        .select('*')
        .eq('id', product_id)
        .in('seller_id', [sellerRowId, user.id])
        .maybeSingle();

      if (!prod) {
        return NextResponse.json(
          { ok: false, error: 'Product not found in your seller catalogue.' },
          { status: 404 }
        );
      }

      const currentStock = Number((prod as any).available_stock ?? 10);
      const validReason: InventoryAdjustmentReason = [
        'new_stock_added',
        'manual_correction',
        'damaged_or_unsellable',
        'order_reserved',
        'order_cancelled_restock',
        'return_restocked',
      ].includes(reason)
        ? reason
        : 'manual_correction';

      const check = validateStockAdjustment(
        currentStock,
        Number(quantity_delta),
        validReason
      );
      if (!check.valid) {
        return NextResponse.json({ ok: false, error: check.error }, { status: 400 });
      }

      const newInventoryStatus =
        check.newStock === 0 ? 'sold_out' : 'in_stock';
      const nextThreshold =
        typeof low_stock_threshold === 'number' && low_stock_threshold >= 0
          ? Math.floor(low_stock_threshold)
          : (prod as any).low_stock_threshold ?? 5;

      let updatedProduct: any = null;
      const { data: extProd, error: extProdErr } = await (
        adminClient.from('products') as any
      )
        .update({
          available_stock: check.newStock,
          low_stock_threshold: nextThreshold,
          inventory_status: newInventoryStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', product_id)
        .select()
        .single();

      if (!extProdErr && extProd) {
        updatedProduct = extProd;
      } else {
        const { data: baseProd } = await adminClient
          .from('products')
          .update({
            inventory_status: newInventoryStatus,
          })
          .eq('id', product_id)
          .select()
          .single();
        updatedProduct = {
          ...(baseProd || prod),
          available_stock: check.newStock,
          low_stock_threshold: nextThreshold,
        };
      }

      try {
        await (adminClient.from('inventory_movements' as any) as any).insert({
          product_id,
          seller_id: sellerRowId,
          actor_user_id: user.id,
          previous_stock: check.previousStock,
          quantity_delta: check.delta,
          new_stock: check.newStock,
          reason: check.reason,
          notes: notes || null,
        });
      } catch {
        // Non-fatal if inventory_movements table is pending migration
      }

      return NextResponse.json({
        ok: true,
        product: updatedProduct,
        movement: {
          previous_stock: check.previousStock,
          quantity_delta: check.delta,
          new_stock: check.newStock,
          reason: check.reason,
        },
        message: `Stock updated from ${check.previousStock} to ${check.newStock}.`,
      });
    }

    if (action === 'update_product_status') {
      const { product_id, target_status } = body;
      if (!product_id || !target_status) {
        return NextResponse.json(
          { ok: false, error: 'Product ID and target status are required.' },
          { status: 400 }
        );
      }

      if (target_status === 'approved' || target_status === 'published') {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Forbidden: Sellers cannot self-approve or self-publish products. Submit for review instead.',
          },
          { status: 403 }
        );
      }

      if (!['draft', 'pending', 'archived'].includes(target_status)) {
        return NextResponse.json(
          { ok: false, error: 'Invalid seller product status transition.' },
          { status: 400 }
        );
      }

      const { data: updatedProd, error: prodErr } = await (
        adminClient.from('products') as any
      )
        .update({
          moderation_status: target_status === 'archived' ? 'rejected' : target_status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', product_id)
        .in('seller_id', [sellerRowId, user.id])
        .select()
        .maybeSingle();

      if (prodErr || !updatedProd) {
        return NextResponse.json(
          { ok: false, error: prodErr?.message || 'Unable to update product status.' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        ok: true,
        product: updatedProd,
        message:
          target_status === 'pending'
            ? 'Product submitted for Uttarkunth review.'
            : `Product moved to ${target_status}.`,
      });
    }

    if (action === 'register_brand') {
      const {
        name,
        brand_relationship,
        country_of_origin,
        origin_location,
        story,
        logo_url,
      } = body;

      if (!name || String(name).trim().length < 2) {
        return NextResponse.json(
          { ok: false, error: 'Brand name must be at least 2 characters.' },
          { status: 400 }
        );
      }

      const slug = `${String(name)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).substring(2, 6)}`;

      let savedBrand: any = {
        seller_id: sellerRowId,
        seller_user_id: user.id,
        name: String(name).trim(),
        slug,
        logo_url: logo_url || null,
        brand_relationship: brand_relationship || 'brand_owner',
        country_of_origin: country_of_origin || 'India',
        origin_location:
          origin_location || `${existingSeller.valley}, ${existingSeller.state}`,
        story: story || null,
        verification_status: 'submitted',
      };

      try {
        const { data: insertedBrand, error: brandErr } = await (
          adminClient.from('brands' as any) as any
        )
          .insert(savedBrand)
          .select()
          .maybeSingle();
        if (!brandErr && insertedBrand) {
          savedBrand = insertedBrand;
        }
      } catch {
        // Fallback if brands table is pending migration
      }

      return NextResponse.json({
        ok: true,
        brand: savedBrand,
        message:
          'Brand submitted for Uttarkunth verification. Verified Brand badge will activate upon approval.',
      });
    }

    if (action === 'save_shipping_profile') {
      const profilePayload = {
        seller_id: sellerRowId,
        seller_user_id: user.id,
        dispatch_address: body.dispatch_address || '',
        dispatch_city_valley: body.dispatch_city_valley || existingSeller.valley || '',
        dispatch_state: body.dispatch_state || existingSeller.state || 'Himachal Pradesh',
        dispatch_pincode: body.dispatch_pincode || '',
        delivery_methods: Array.isArray(body.delivery_methods)
          ? body.delivery_methods
          : ['Direct Seller Courier', 'India Post'],
        preferred_courier_partners: body.preferred_courier_partners || '',
        standard_shipping_charge: Math.max(0, Number(body.standard_shipping_charge) || 0),
        free_shipping_threshold:
          body.free_shipping_threshold !== undefined && body.free_shipping_threshold !== ''
            ? Math.max(0, Number(body.free_shipping_threshold))
            : null,
        estimated_dispatch_timeline:
          body.estimated_dispatch_timeline || '2–4 business days',
        estimated_delivery_timeline:
          body.estimated_delivery_timeline || '5–8 business days across India',
        delivery_coverage: body.delivery_coverage || 'Pan-India serviceable pin codes',
        tracking_provided: body.tracking_provided !== false,
        return_policy_type: body.return_policy_type || 'replacement_only',
        return_window_days: Math.max(0, Number(body.return_window_days) || 7),
        return_policy_details:
          body.return_policy_details ||
          '7-day replacement for verified transit damage or manufacturing defect. Managed and fulfilled directly by the seller.',
        customer_support_contact:
          body.customer_support_contact || existingSeller.contact_email || '',
        updated_at: new Date().toISOString(),
      };

      let savedProfile: any = profilePayload;
      try {
        const { data: upserted } = await (
          adminClient.from('seller_shipping_profiles' as any) as any
        )
          .upsert(profilePayload, { onConflict: 'seller_user_id' })
          .select()
          .maybeSingle();
        if (upserted) savedProfile = upserted;
      } catch {
        // Fallback if table is pending migration
      }

      return NextResponse.json({
        ok: true,
        shippingProfile: savedProfile,
        message: 'Direct seller shipping and return policy saved.',
      });
    }

    if (action === 'update_order_fulfilment') {
      const {
        order_item_id,
        fulfilment_status,
        courier_partner,
        tracking_number,
        tracking_url,
        seller_notes,
      } = body;

      if (!order_item_id || !fulfilment_status) {
        return NextResponse.json(
          { ok: false, error: 'Order item ID and fulfilment status are required.' },
          { status: 400 }
        );
      }

      const updateFields: Record<string, any> = {
        fulfilment_status,
        courier_partner: courier_partner || null,
        tracking_number: tracking_number || null,
        tracking_url: tracking_url || null,
        seller_notes: seller_notes || null,
        updated_at: new Date().toISOString(),
      };
      if (fulfilment_status === 'shipped') {
        updateFields.dispatched_at = new Date().toISOString();
      }
      if (fulfilment_status === 'delivered') {
        updateFields.delivered_at = new Date().toISOString();
      }

      const { data: updatedOrder, error: orderErr } = await (
        adminClient.from('marketplace_order_items' as any) as any
      )
        .update(updateFields)
        .eq('id', order_item_id)
        .eq('seller_id', sellerRowId)
        .select()
        .maybeSingle();

      if (orderErr) {
        return NextResponse.json({ ok: false, error: orderErr.message }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        orderItem: updatedOrder,
        message: `Order fulfilment updated to ${fulfilment_status.replace(/_/g, ' ')}.`,
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
