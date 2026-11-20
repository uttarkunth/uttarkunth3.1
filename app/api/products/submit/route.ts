import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ProductSubmissionSchema } from '@/lib/validations';
import {
  calculateProductDiscount,
  mapCanonicalToDbCategory,
  sanitizeSellerProductWritePayload,
} from '@/lib/marketplace';

export const dynamic = 'force-dynamic';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized: Sign in required.' },
        { status: 401 }
      );
    }

    const adminClient = createAdminClient();

    // Verify user is an approved seller
    const { data: seller, error: sellerErr } = await adminClient
      .from('sellers')
      .select('user_id, status, business_name, valley, state')
      .eq('user_id', user.id)
      .maybeSingle();

    if (sellerErr || !seller || seller.status !== 'approved') {
      return NextResponse.json(
        {
          ok: false,
          error: 'Forbidden: Only approved sellers may submit product listings.',
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = ProductSubmissionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error:
            parsed.error.errors[0]?.message || 'Invalid product submission details',
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const resolvedSellingPrice =
      data.selling_price ?? data.price_estimate ?? null;
    const resolvedMrp =
      data.mrp ?? resolvedSellingPrice ?? null;

    let discountPercentage = 0;
    if (resolvedMrp !== null && resolvedSellingPrice !== null) {
      const calc = calculateProductDiscount(resolvedMrp, resolvedSellingPrice);
      if (!calc.valid) {
        return NextResponse.json(
          { ok: false, error: calc.error },
          { status: 400 }
        );
      }
      discountPercentage = calc.discountPercentage;
    }

    const baseSlug = slugify(data.title);
    const uniqueSuffix = Math.random().toString(36).substring(2, 7);
    const slug = `${baseSlug}-${uniqueSuffix}`;

    const intent = data.save_as_draft ? 'save_draft' : 'submit_for_review';
    const sellerIdValue = seller.user_id || user.id;

    const resolvedAvailableStock =
      typeof data.available_stock === 'number' ? Math.max(0, data.available_stock) : 10;
    const resolvedInventoryStatus =
      resolvedAvailableStock === 0
        ? 'sold_out'
        : data.inventory_status || 'in_stock';

    // Base product record compatible with Phase 2F schema
    const baseRecord = sanitizeSellerProductWritePayload(
      {
        slug,
        title: data.title,
        category: mapCanonicalToDbCategory(data.category),
        seller_id: sellerIdValue,
        maker_name: data.maker_name || seller.business_name,
        origin_valley: data.origin_valley || seller.valley,
        origin_state: data.origin_state || seller.state || 'Himachal Pradesh',
        craft_type: data.craft_type || data.subcategory || 'Artisan Craft',
        materials: data.materials,
        description: data.description,
        photos: data.photos,
        price_estimate: resolvedSellingPrice,
        inventory_status: resolvedInventoryStatus,
      },
      intent
    );

    // Extended product record with all 8-step wizard columns
    const extendedRecord = {
      ...baseRecord,
      category: data.category,
      short_description: data.short_description || null,
      subcategory: data.subcategory || null,
      sku: data.sku || null,
      tags: data.tags || [],
      brand_name: data.brand_name || seller.business_name || data.maker_name,
      seller_brand_relation: data.seller_brand_relation || 'artisan_maker',
      country_of_origin: data.country_of_origin || 'India',
      manufacturing_location:
        data.manufacturing_location || `${data.origin_valley}, ${data.origin_state}`,
      sourcing_location:
        data.sourcing_location || `${data.origin_valley}, ${data.origin_state}`,
      dispatch_location:
        data.dispatch_location || `${data.origin_valley}, ${data.origin_state}`,
      ingredients: data.ingredients || null,
      dimensions: data.dimensions || null,
      weight: data.weight || null,
      specifications: data.specifications || null,
      packaging_info: data.packaging_info || null,
      mrp: resolvedMrp,
      selling_price: resolvedSellingPrice,
      discount_percentage: discountPercentage,
      tax_rate: data.tax_rate ?? 0,
      initial_stock: data.initial_stock ?? resolvedAvailableStock,
      available_stock: resolvedAvailableStock,
      low_stock_threshold: data.low_stock_threshold ?? 5,
      delivery_method: data.delivery_method || 'Direct Seller Courier / India Post',
      delivery_partner: data.delivery_partner || null,
      shipping_charges: data.shipping_charges ?? 0,
      estimated_dispatch_days: data.estimated_dispatch_days || '2–4 business days',
      tracking_available: data.tracking_available !== false,
      return_policy:
        data.return_policy ||
        '7-day replacement for transit damage or verified defect; managed directly by seller.',
    };

    let product: any = null;
    const { data: extProduct, error: extErr } = await (
      adminClient.from('products') as any
    )
      .insert(extendedRecord)
      .select()
      .single();

    if (!extErr && extProduct) {
      product = extProduct;
    } else {
      // Fallback to base columns if extended migration hasn't been applied in live DB yet
      const fallbackRecord = {
        slug: baseRecord.slug,
        title: baseRecord.title,
        category: baseRecord.category,
        seller_id: user.id,
        maker_name: baseRecord.maker_name,
        origin_valley: baseRecord.origin_valley,
        origin_state: baseRecord.origin_state,
        craft_type: baseRecord.craft_type,
        materials: baseRecord.materials,
        description: baseRecord.description,
        photos: baseRecord.photos,
        price_estimate: baseRecord.price_estimate,
        inventory_status: baseRecord.inventory_status,
        moderation_status: 'pending',
      };

      const { data: baseProduct, error: insertErr } = await adminClient
        .from('products')
        .insert(fallbackRecord)
        .select()
        .single();

      if (insertErr) {
        console.error('Error inserting product:', insertErr);
        return NextResponse.json(
          {
            ok: false,
            error:
              'Failed to create product listing. Please check required fields.',
          },
          { status: 500 }
        );
      }
      product = baseProduct;
    }

    // Persist product variants if provided
    if (product?.id && Array.isArray(data.variants) && data.variants.length > 0) {
      try {
        const variantRows = data.variants.map((v) => ({
          product_id: product.id,
          variant_name: v.variant_name,
          sku: v.sku || null,
          mrp: v.mrp ?? resolvedMrp,
          selling_price: v.selling_price ?? resolvedSellingPrice,
          available_stock: Math.max(0, v.available_stock || 0),
        }));
        await (adminClient.from('product_variants' as any) as any).insert(
          variantRows
        );
      } catch {
        // Non-fatal if product_variants table is pending migration
      }
    }

    return NextResponse.json({
      ok: true,
      message: data.save_as_draft
        ? 'Product draft saved to your Seller Desk.'
        : 'Product submitted successfully for curation moderation.',
      product,
    });
  } catch (err: any) {
    console.error('Product submit error:', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
