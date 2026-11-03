-- ============================================================================
-- UTTARKUNTH PLATFORM — PHASE 2F DATABASE MIGRATION (PENDING PRODUCTION APPROVAL)
-- ============================================================================
-- Scope: Pillar II — Himalayan Products Marketplace, Artisan Sellers & Waitlists
-- Target: Supabase remote project uttarkunth-stays (xyplgugxpmlnjsvlosdg)
-- Invariants:
--   1. Zero fake products, zero fake sellers, zero fake reviews.
--   2. Public browsing exposes ONLY approved products.
--   3. Sellers can manage ONLY their own products.
--   4. Platform administrators alone moderate seller applications and product submissions.
--   5. Sellers cannot self-approve products or retain 'approved' status upon editing.
--   6. Sellers cannot delete live 'approved' products without administrative review.
--   7. Rate limiting is transactional, durable in PostgreSQL, and zero-paid-dependency.
-- ============================================================================

BEGIN;

-- 1. SELLERS TABLE
CREATE TABLE IF NOT EXISTS public.sellers (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  maker_name text NOT NULL,
  craft_type text NOT NULL,
  valley text NOT NULL,
  state text NOT NULL DEFAULT 'Himachal Pradesh',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  contact_email text NOT NULL,
  contact_phone text,
  bio text,
  materials text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN (
    'himalayan',
    'crafts',
    'textiles',
    'food',
    'lifestyle',
    'organic',
    'art',
    'sustainable',
    'other'
  )),
  seller_id uuid NOT NULL REFERENCES public.sellers(user_id) ON DELETE CASCADE,
  maker_name text NOT NULL,
  origin_valley text NOT NULL,
  origin_state text NOT NULL DEFAULT 'Himachal Pradesh',
  craft_type text NOT NULL,
  materials text NOT NULL,
  photos text[] NOT NULL DEFAULT '{}',
  moderation_status text NOT NULL DEFAULT 'draft' CHECK (moderation_status IN ('draft', 'pending', 'approved', 'rejected')),
  inventory_status text NOT NULL DEFAULT 'coming_soon' CHECK (inventory_status IN ('coming_soon', 'in_stock', 'made_to_order', 'sold_out')),
  price_estimate numeric(10,2) DEFAULT NULL CHECK (price_estimate IS NULL OR price_estimate >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. PRODUCT INTERESTS / WAITLIST TABLE
CREATE TABLE IF NOT EXISTS public.product_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  category text,
  guest_name text NOT NULL,
  guest_email text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_interest_target_check CHECK (product_id IS NOT NULL OR category IS NOT NULL)
);

-- 4. DURABLE RATE LIMITING TABLE (TRANSACTIONAL, CLOUDFLARE-WORKERS COMPATIBLE)
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key text PRIMARY KEY,
  tokens integer NOT NULL DEFAULT 1,
  last_request_at timestamptz NOT NULL DEFAULT now(),
  reset_at timestamptz NOT NULL
);

-- 5. PERFORMANCE & LOOKUP INDEXES
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_moderation ON public.products(moderation_status);
CREATE INDEX IF NOT EXISTS idx_product_interests_user ON public.product_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_product_interests_product ON public.product_interests(product_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset ON public.rate_limits(reset_at);

-- 6. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- 7. SELLERS RLS POLICIES
DROP POLICY IF EXISTS "sellers_select_owner_or_admin" ON public.sellers;
CREATE POLICY "sellers_select_owner_or_admin" ON public.sellers
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    public.is_platform_admin()
  );

DROP POLICY IF EXISTS "sellers_insert_own_profile" ON public.sellers;
CREATE POLICY "sellers_insert_own_profile" ON public.sellers
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    (status = 'pending' OR public.is_platform_admin())
  );

DROP POLICY IF EXISTS "sellers_update_own_or_admin" ON public.sellers;
CREATE POLICY "sellers_update_own_or_admin" ON public.sellers
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid() OR
    public.is_platform_admin()
  )
  WITH CHECK (
    public.is_platform_admin() OR
    (user_id = auth.uid() AND status = 'pending')
  );

-- 8. PRODUCTS RLS POLICIES
DROP POLICY IF EXISTS "products_select_public_approved_or_owner_or_admin" ON public.products;
CREATE POLICY "products_select_public_approved_or_owner_or_admin" ON public.products
  FOR SELECT TO public
  USING (
    moderation_status = 'approved' OR
    (auth.uid() IS NOT NULL AND seller_id = auth.uid()) OR
    public.is_platform_admin()
  );

-- Close Seller Moderation Bypass on INSERT:
-- Sellers can ONLY insert with moderation_status IN ('draft', 'pending').
-- Only platform admins may insert pre-approved products.
DROP POLICY IF EXISTS "products_insert_approved_sellers" ON public.products;
CREATE POLICY "products_insert_approved_sellers" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_platform_admin() OR
    (
      seller_id = auth.uid() AND
      moderation_status IN ('draft', 'pending') AND
      EXISTS (
        SELECT 1 FROM public.sellers
        WHERE user_id = auth.uid() AND status = 'approved'
      )
    )
  );

-- Close Seller Moderation Bypass on UPDATE:
-- Non-admin sellers can only transition products to 'draft' or 'pending' (re-moderation).
-- Sellers can NEVER self-approve products.
DROP POLICY IF EXISTS "products_update_seller_or_admin" ON public.products;
CREATE POLICY "products_update_seller_or_admin" ON public.products
  FOR UPDATE TO authenticated
  USING (
    seller_id = auth.uid() OR
    public.is_platform_admin()
  )
  WITH CHECK (
    public.is_platform_admin() OR
    (seller_id = auth.uid() AND moderation_status IN ('draft', 'pending'))
  );

-- Restrict Seller DELETE Permissions on Approved Products:
-- Sellers may delete draft or rejected listings. Live approved products require
-- platform administrative action to delete or archive.
DROP POLICY IF EXISTS "products_delete_seller_or_admin" ON public.products;
CREATE POLICY "products_delete_seller_or_admin" ON public.products
  FOR DELETE TO authenticated
  USING (
    public.is_platform_admin() OR
    (seller_id = auth.uid() AND moderation_status IN ('draft', 'rejected'))
  );

-- 9. PRODUCT MODERATION LIFECYCLE TRIGGER
-- Enforces database-level moderation invariants even if RLS is bypassed via RPC or direct PostgREST calls:
--   1. Sellers cannot set moderation_status = 'approved'.
--   2. Modifying an approved product resets moderation_status to 'pending' unless performed by admin.
--   3. seller_id cannot be transferred.
CREATE OR REPLACE FUNCTION public.enforce_product_moderation_lifecycle()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_is_admin boolean := false;
BEGIN
  SELECT public.is_platform_admin() INTO v_is_admin;

  IF NOT v_is_admin THEN
    -- Invariant: Non-admins cannot create or promote products to 'approved'
    IF NEW.moderation_status = 'approved' THEN
      RAISE EXCEPTION 'Unauthorized product self-approval: Only platform administrators can approve marketplace products.'
        USING ERRCODE = '42501';
    END IF;

    -- Invariant: If an approved product is updated by seller, moderation reverts to 'pending'
    IF TG_OP = 'UPDATE' AND OLD.moderation_status = 'approved' THEN
      IF NEW.moderation_status IS DISTINCT FROM 'pending' AND NEW.moderation_status IS DISTINCT FROM 'draft' THEN
        NEW.moderation_status := 'pending';
      END IF;
    END IF;

    -- Invariant: seller_id cannot be changed
    IF TG_OP = 'UPDATE' AND OLD.seller_id IS DISTINCT FROM NEW.seller_id THEN
      RAISE EXCEPTION 'Product seller ownership cannot be transferred (Product ID: %).', OLD.id
        USING ERRCODE = '55000';
    END IF;
  END IF;

  NEW.updated_at := clock_timestamp();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_product_moderation_lifecycle ON public.products;
CREATE TRIGGER trg_enforce_product_moderation_lifecycle
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.enforce_product_moderation_lifecycle();

-- 10. PRODUCT INTERESTS RLS POLICIES
DROP POLICY IF EXISTS "product_interests_select_own_or_admin" ON public.product_interests;
CREATE POLICY "product_interests_select_own_or_admin" ON public.product_interests
  FOR SELECT TO authenticated
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    public.is_platform_admin()
  );

DROP POLICY IF EXISTS "product_interests_insert_restricted" ON public.product_interests;
CREATE POLICY "product_interests_insert_restricted" ON public.product_interests
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    -- Anonymous visitors may only insert records where user_id IS NULL
    (auth.uid() IS NULL AND user_id IS NULL)
    OR
    -- Authenticated visitors may insert records where user_id IS NULL or user_id = auth.uid()
    (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()))
  );

-- 11. TRANSACTIONAL RATE LIMIT RPC FUNCTION (SERVICE_ROLE ONLY)
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key text,
  p_max_requests integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_record public.rate_limits%ROWTYPE;
BEGIN
  IF p_key IS NULL OR p_max_requests <= 0 OR p_window_seconds <= 0 THEN
    RETURN false;
  END IF;

  -- Opportunistic cleanup of expired keys (probabilistic 1-in-20 chance to avoid index bloat)
  IF random() < 0.05 THEN
    DELETE FROM public.rate_limits WHERE reset_at < v_now;
  END IF;

  INSERT INTO public.rate_limits (key, tokens, last_request_at, reset_at)
  VALUES (p_key, 1, v_now, v_now + (p_window_seconds || ' seconds')::interval)
  ON CONFLICT (key) DO UPDATE
  SET tokens = CASE
        WHEN public.rate_limits.reset_at <= v_now THEN 1
        ELSE public.rate_limits.tokens + 1
      END,
      reset_at = CASE
        WHEN public.rate_limits.reset_at <= v_now THEN v_now + (p_window_seconds || ' seconds')::interval
        ELSE public.rate_limits.reset_at
      END,
      last_request_at = v_now
  RETURNING * INTO v_record;

  IF v_record.tokens > p_max_requests THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

-- 12. PERMISSIONS AND GRANTS
REVOKE ALL ON TABLE public.sellers FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.sellers TO authenticated;

REVOKE ALL ON TABLE public.products FROM PUBLIC;
GRANT SELECT ON TABLE public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.products TO authenticated;

REVOKE ALL ON TABLE public.product_interests FROM PUBLIC, anon;
GRANT INSERT ON TABLE public.product_interests TO anon, authenticated;
GRANT SELECT ON TABLE public.product_interests TO authenticated;

REVOKE ALL ON TABLE public.rate_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.rate_limits TO service_role;

REVOKE ALL ON FUNCTION public.check_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) TO service_role;

GRANT ALL ON TABLE public.sellers TO service_role;
GRANT ALL ON TABLE public.products TO service_role;
GRANT ALL ON TABLE public.product_interests TO service_role;

COMMIT;
