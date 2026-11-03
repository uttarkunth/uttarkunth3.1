import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkIsPlatformAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await checkIsPlatformAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json({ ok: false, error: 'Forbidden: Platform administrator access required.' }, { status: 403 });
    }

    const adminClient = createAdminClient();

    // Fetch sellers and products
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

    return NextResponse.json({
      ok: true,
      sellers: sellers || [],
      products: products || [],
      interests: interests || [],
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await checkIsPlatformAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json({ ok: false, error: 'Forbidden: Platform administrator access required.' }, { status: 403 });
    }

    const body = await req.json();
    const { target_type, target_id, action, notes, inventory_status } = body;

    if (!target_type || !target_id || !action) {
      return NextResponse.json({ ok: false, error: 'Missing required moderation parameters.' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    if (target_type === 'seller') {
      let newStatus: string;
      if (action === 'approve') newStatus = 'approved';
      else if (action === 'reject') newStatus = 'rejected';
      else if (action === 'suspend') newStatus = 'suspended';
      else {
        return NextResponse.json({ ok: false, error: 'Invalid seller moderation action.' }, { status: 400 });
      }

      const { data: updated, error: updateErr } = await adminClient
        .from('sellers')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('user_id', target_id)
        .select()
        .single();

      if (updateErr) {
        return NextResponse.json({ ok: false, error: updateErr.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true, seller: updated });
    }

    if (target_type === 'product') {
      let updatePayload: any = { updated_at: new Date().toISOString() };

      if (action === 'approve') {
        updatePayload.moderation_status = 'approved';
      } else if (action === 'reject') {
        updatePayload.moderation_status = 'rejected';
      } else if (action === 'set_inventory') {
        if (!inventory_status || !['coming_soon', 'in_stock', 'made_to_order', 'sold_out'].includes(inventory_status)) {
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

      return NextResponse.json({ ok: true, product: updated });
    }

    return NextResponse.json({ ok: false, error: 'Unknown target_type' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'Server error' }, { status: 500 });
  }
}
