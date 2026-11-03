import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ProductInterestSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

function hashRateLimitKey(prefix: string, value: string): string {
  const digest = createHash('sha256').update(value).digest('hex').slice(0, 24);
  return `${prefix}:${digest}`;
}

const VALID_CATEGORIES = new Set([
  'himalayan',
  'crafts',
  'textiles',
  'food',
  'lifestyle',
  'organic',
  'art',
  'sustainable',
  'other',
]);

// Durable rate limit fallback cache for offline unit tests / transient failures
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const fallbackRateLimitMap = new Map<string, RateLimitRecord>();

function fallbackRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = fallbackRateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    fallbackRateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count += 1;
  return true;
}

/**
 * Durable Database-Backed Rate Limiting for Cloudflare Workers & Serverless.
 * Calls public.check_rate_limit(p_key, p_max_requests, p_window_seconds) via service_role.
 * Retains zero paid external dependencies (no Redis, no external KV).
 * If the database RPC is unreachable (e.g. offline unit testing), falls back gracefully.
 */
async function checkDurableRateLimit(
  adminClient: any,
  key: string,
  limit = 5,
  windowSeconds = 600
): Promise<boolean> {
  try {
    const { data, error } = await adminClient.rpc('check_rate_limit', {
      p_key: key,
      p_max_requests: limit,
      p_window_seconds: windowSeconds
    });

    if (error) {
      return fallbackRateLimit(key, limit, windowSeconds * 1000);
    }

    return Boolean(data);
  } catch {
    return fallbackRateLimit(key, limit, windowSeconds * 1000);
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const adminClient = createAdminClient();

    // 1. Abuse Protection / Durable Rate Limiting (per connection IP hash)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const isIpAllowed = await checkDurableRateLimit(adminClient, hashRateLimitKey('ip', ip), 5, 600);
    if (!isIpAllowed) {
      return NextResponse.json(
        { ok: false, error: 'Too many registration attempts from this connection. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = ProductInterestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.errors[0]?.message || 'Invalid interest registration details' },
        { status: 400 }
      );
    }

    const { product_id, category, guest_name, guest_email, notes } = parsed.data;
    const normalizedEmail = guest_email.toLowerCase();

    // Durable Rate Limiting (per email address hash, zero raw PII stored in rate limiter)
    const isEmailAllowed = await checkDurableRateLimit(adminClient, hashRateLimitKey('email', normalizedEmail), 5, 600);
    if (!isEmailAllowed) {
      return NextResponse.json(
        { ok: false, error: 'Too many registration attempts for this email address. Please try again later.' },
        { status: 429 }
      );
    }

    if (!product_id && !category) {
      return NextResponse.json(
        { ok: false, error: 'Please select a specific craft product or craft category for the waitlist.' },
        { status: 400 }
      );
    }

    // 2. Validate product_id if provided (must reference an approved, active product)
    let validatedCategoryId = category || null;
    if (product_id) {
      const { data: product, error: prodErr } = await adminClient
        .from('products')
        .select('id, category, moderation_status')
        .eq('id', product_id)
        .maybeSingle();

      if (prodErr || !product) {
        return NextResponse.json(
          { ok: false, error: 'The specified product does not exist or has been removed.' },
          { status: 404 }
        );
      }

      if (product.moderation_status !== 'approved') {
        return NextResponse.json(
          { ok: false, error: 'The specified product is pending moderation and cannot accept interest registrations.' },
          { status: 400 }
        );
      }

      if (!validatedCategoryId) {
        validatedCategoryId = product.category;
      }
    }

    // 3. Validate category-level submissions
    if (validatedCategoryId && !VALID_CATEGORIES.has(validatedCategoryId.toLowerCase())) {
      return NextResponse.json(
        { ok: false, error: `Invalid product category: "${validatedCategoryId}". Must be a recognized craft category.` },
        { status: 400 }
      );
    }

    // 4. Attribution check: user_id is strictly derived from session user, NEVER from untrusted input
    const targetUserId = user?.id || null;

    const { data: interest, error: insertErr } = await adminClient
      .from('product_interests')
      .insert({
        user_id: targetUserId,
        product_id: product_id || null,
        category: validatedCategoryId ? validatedCategoryId.toLowerCase() : null,
        guest_name,
        guest_email: normalizedEmail,
        notes: notes || null,
      })
      .select()
      .single();

    if (insertErr) {
      console.error('Error recording product interest:', insertErr);
      return NextResponse.json(
        { ok: false, error: 'Failed to record waitlist entry. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Your interest has been registered. You will be directly notified when verified Himalayan batches are made available.',
      interest,
    });
  } catch (err: any) {
    console.error('Product interest error:', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
