import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ProductSubmissionSchema } from '@/lib/validations';

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
    const { data: { user } } = await supabase.auth.getUser();

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
      .select('user_id, status, business_name')
      .eq('user_id', user.id)
      .maybeSingle();

    if (sellerErr || !seller || seller.status !== 'approved') {
      return NextResponse.json(
        { ok: false, error: 'Forbidden: Only approved sellers may submit product listings.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = ProductSubmissionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.errors[0]?.message || 'Invalid product submission details' },
        { status: 400 }
      );
    }

    const {
      title,
      category,
      maker_name,
      origin_valley,
      origin_state,
      craft_type,
      materials,
      description,
      photos,
      price_estimate,
      inventory_status,
    } = parsed.data;

    const baseSlug = slugify(title);
    const uniqueSuffix = Math.random().toString(36).substring(2, 7);
    const slug = `${baseSlug}-${uniqueSuffix}`;

    const { data: product, error: insertErr } = await adminClient
      .from('products')
      .insert({
        slug,
        title,
        category,
        seller_id: user.id,
        maker_name,
        origin_valley,
        origin_state,
        craft_type,
        materials,
        description,
        photos,
        price_estimate: price_estimate || null,
        inventory_status: inventory_status || 'coming_soon',
        moderation_status: 'pending',
      })
      .select()
      .single();

    if (insertErr) {
      console.error('Error inserting product:', insertErr);
      return NextResponse.json(
        { ok: false, error: 'Failed to create product listing. Please check required fields.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Product submitted successfully for curation moderation.',
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
