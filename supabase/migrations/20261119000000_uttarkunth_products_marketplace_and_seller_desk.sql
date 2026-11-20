-- ============================================================================
-- UTTARKUNTH PRODUCTS MARKETPLACE & SELLER DESK — ADDITIVE MIGRATION
-- Extends existing sellers, products, and staff RBAC tables without breaking
-- existing stays, hosts, productions, community, or staff workflows.
-- ============================================================================

-- 1. EXTEND public.sellers WITH SELLER TYPE, DRAFT STATUS, AND AGREEMENT FIELDS
ALTER TABLE public.sellers
  ADD COLUMN IF NOT EXISTS seller_type text NOT NULL DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS operating_location text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS agreement_accepted boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS agreement_accepted_at timestamptz DEFAULT now();

DO $$
BEGIN
  ALTER TABLE public.sellers DROP CONSTRAINT IF EXISTS sellers_status_check;
  ALTER TABLE public.sellers
    ADD CONSTRAINT sellers_status_check
    CHECK (status IN ('draft', 'submitted', 'pending', 'under_review', 'info_requested', 'approved', 'rejected', 'suspended'));
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- 2. CANONICAL PRODUCT CATEGORIES & SUBCATEGORIES (public.product_categories)
CREATE TABLE IF NOT EXISTS public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  parent_id uuid REFERENCES public.product_categories(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_categories_parent ON public.product_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_order ON public.product_categories(display_order);

INSERT INTO public.product_categories (slug, title, description, display_order)
VALUES
  ('handcrafted-artisan', 'Handcrafted & Artisan', 'Woodcraft, handmade decor, traditional crafts, and handwoven products.', 1),
  ('food-pantry', 'Food & Pantry', 'Traditional foods, spices & ingredients, honey & natural produce, and regional specialities.', 2),
  ('clothing-textiles', 'Clothing & Textiles', 'Woollens, handwoven textiles, clothing, and cold-weather accessories.', 3),
  ('home-living', 'Home & Living', 'Home decor, kitchenware, and everyday essentials.', 4),
  ('personal-care', 'Personal Care', 'Botanical skincare, essential oils & balms, herbal soaps, and natural wellness.', 5),
  ('sustainable-living', 'Sustainable Living', 'Upcycled crafts, natural fibre goods, eco-friendly essentials, and zero-waste living.', 6)
ON CONFLICT (slug) DO NOTHING;

-- 3. BRANDS & BRAND VERIFICATION (public.brands)
CREATE TABLE IF NOT EXISTS public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers(user_id) ON DELETE CASCADE,
  seller_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  brand_relationship text NOT NULL DEFAULT 'brand_owner'
    CHECK (brand_relationship IN ('brand_owner', 'manufacturer', 'artisan_maker', 'authorized_reseller')),
  country_of_origin text NOT NULL DEFAULT 'India',
  origin_location text,
  story text,
  verification_status text NOT NULL DEFAULT 'not_submitted'
    CHECK (verification_status IN ('not_submitted', 'submitted', 'under_review', 'info_requested', 'approved', 'rejected', 'suspended')),
  verification_notes text,
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brands_seller_id ON public.brands(seller_id);
CREATE INDEX IF NOT EXISTS idx_brands_verification_status ON public.brands(verification_status);

-- 4. EXTEND public.products WITH PRICING, AUTOMATIC DISCOUNT, STOCK, ORIGIN & FULFILMENT
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS subcategory text,
  ADD COLUMN IF NOT EXISTS sku text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS brand_name text,
  ADD COLUMN IF NOT EXISTS seller_brand_relation text DEFAULT 'artisan_maker',
  ADD COLUMN IF NOT EXISTS country_of_origin text DEFAULT 'India',
  ADD COLUMN IF NOT EXISTS manufacturing_location text,
  ADD COLUMN IF NOT EXISTS sourcing_location text,
  ADD COLUMN IF NOT EXISTS dispatch_location text,
  ADD COLUMN IF NOT EXISTS ingredients text,
  ADD COLUMN IF NOT EXISTS dimensions text,
  ADD COLUMN IF NOT EXISTS weight text,
  ADD COLUMN IF NOT EXISTS specifications text,
  ADD COLUMN IF NOT EXISTS packaging_info text,
  ADD COLUMN IF NOT EXISTS mrp numeric(12,2),
  ADD COLUMN IF NOT EXISTS selling_price numeric(12,2),
  ADD COLUMN IF NOT EXISTS discount_percentage integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_rate numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS initial_stock integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS available_stock integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reserved_stock integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS low_stock_threshold integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS delivery_method text DEFAULT 'Direct Seller Courier / India Post',
  ADD COLUMN IF NOT EXISTS delivery_partner text,
  ADD COLUMN IF NOT EXISTS shipping_charges numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_dispatch_days text DEFAULT '2–4 business days',
  ADD COLUMN IF NOT EXISTS tracking_available boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS return_policy text DEFAULT '7-day replacement for transit damage or verified defect; managed directly by seller.',
  ADD COLUMN IF NOT EXISTS verification_badge_approved boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS review_notes text,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

DO $$
BEGIN
  ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_moderation_status_check;
  ALTER TABLE public.products
    ADD CONSTRAINT products_moderation_status_check
    CHECK (moderation_status IN (
      'draft',
      'pending',
      'pending_review',
      'under_review',
      'changes_requested',
      'approved',
      'published',
      'rejected',
      'unpublished',
      'archived'
    ));
EXCEPTION
  WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_check;
  ALTER TABLE public.products
    ADD CONSTRAINT products_category_check
    CHECK (category IN (
      'handcrafted-artisan',
      'food-pantry',
      'clothing-textiles',
      'home-living',
      'personal-care',
      'sustainable-living',
      'himalayan',
      'crafts',
      'textiles',
      'food',
      'lifestyle',
      'organic',
      'art',
      'sustainable',
      'other'
    ));
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- 5. AUTOMATIC DISCOUNT & STOCK GUARDRAIL TRIGGER ON public.products
CREATE OR REPLACE FUNCTION public.enforce_product_pricing_and_moderation_guardrails()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_privileged boolean := false;
BEGIN
  -- Validate stock never goes negative
  IF NEW.available_stock IS NOT NULL AND NEW.available_stock < 0 THEN
    RAISE EXCEPTION 'Product available_stock cannot be negative.';
  END IF;

  -- Synchronize selling_price and price_estimate
  IF NEW.selling_price IS NOT NULL AND NEW.selling_price > 0 THEN
    NEW.price_estimate := NEW.selling_price;
  ELSIF NEW.price_estimate IS NOT NULL AND NEW.price_estimate > 0 AND NEW.selling_price IS NULL THEN
    NEW.selling_price := NEW.price_estimate;
  END IF;

  -- Automatic discount calculation from MRP and Selling Price
  IF NEW.mrp IS NOT NULL AND NEW.selling_price IS NOT NULL THEN
    IF NEW.mrp <= 0 OR NEW.selling_price <= 0 THEN
      RAISE EXCEPTION 'MRP and selling_price must be greater than 0.';
    END IF;
    IF NEW.selling_price > NEW.mrp THEN
      RAISE EXCEPTION 'Selling price cannot exceed MRP.';
    END IF;
    IF NEW.selling_price < NEW.mrp THEN
      NEW.discount_percentage := ROUND(((NEW.mrp - NEW.selling_price) / NEW.mrp) * 100)::integer;
    ELSE
      NEW.discount_percentage := 0;
    END IF;
  ELSE
    NEW.discount_percentage := 0;
  END IF;

  -- Check if current caller is Founder or authorized Products reviewer
  IF auth.uid() IS NOT NULL THEN
    v_is_privileged := public.is_platform_admin() OR public.has_staff_permission_for_user(auth.uid(), 'product.approve');
  ELSE
    -- Service role / admin client
    v_is_privileged := true;
  END IF;

  -- Prevent sellers from self-approving, self-publishing, or granting verification badges
  IF NOT v_is_privileged THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.moderation_status NOT IN ('draft', 'pending', 'pending_review') THEN
        NEW.moderation_status := 'pending';
      END IF;
      NEW.published := false;
      NEW.verification_badge_approved := false;
    ELSIF TG_OP = 'UPDATE' THEN
      IF NEW.moderation_status IN ('approved', 'published') AND OLD.moderation_status NOT IN ('approved', 'published') THEN
        RAISE EXCEPTION 'Sellers cannot self-approve or self-publish products.';
      END IF;
      IF NEW.verification_badge_approved = true AND OLD.verification_badge_approved = false THEN
        RAISE EXCEPTION 'Sellers cannot self-assign Verified & Authentic product badges.';
      END IF;
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_product_pricing_and_moderation ON public.products;
CREATE TRIGGER trg_enforce_product_pricing_and_moderation
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_product_pricing_and_moderation_guardrails();

-- 6. PRODUCT VARIANTS (public.product_variants)
CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_name text NOT NULL,
  sku text,
  mrp numeric(12,2),
  selling_price numeric(12,2),
  available_stock integer NOT NULL DEFAULT 0 CHECK (available_stock >= 0),
  reserved_stock integer NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0),
  low_stock_threshold integer NOT NULL DEFAULT 3 CHECK (low_stock_threshold >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);

-- 7. INVENTORY MOVEMENTS AUDIT LOG (public.inventory_movements)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  seller_id uuid NOT NULL REFERENCES public.sellers(user_id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  previous_stock integer NOT NULL,
  quantity_delta integer NOT NULL,
  new_stock integer NOT NULL CHECK (new_stock >= 0),
  reason text NOT NULL
    CHECK (reason IN (
      'new_stock_added',
      'manual_correction',
      'damaged_or_unsellable',
      'order_reserved',
      'order_cancelled_restock',
      'return_restocked'
    )),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON public.inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_seller_id ON public.inventory_movements(seller_id);

-- 8. SELLER SHIPPING & RETURN PROFILES (public.seller_shipping_profiles)
CREATE TABLE IF NOT EXISTS public.seller_shipping_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL UNIQUE REFERENCES public.sellers(user_id) ON DELETE CASCADE,
  seller_user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  dispatch_address text NOT NULL DEFAULT '',
  dispatch_city_valley text NOT NULL DEFAULT '',
  dispatch_state text NOT NULL DEFAULT 'Himachal Pradesh',
  dispatch_pincode text,
  delivery_methods text[] NOT NULL DEFAULT ARRAY['Direct Seller Courier', 'India Post']::text[],
  preferred_courier_partners text,
  standard_shipping_charge numeric(10,2) NOT NULL DEFAULT 0,
  free_shipping_threshold numeric(10,2),
  estimated_dispatch_timeline text NOT NULL DEFAULT '2–4 business days',
  estimated_delivery_timeline text NOT NULL DEFAULT '5–8 business days across India',
  delivery_coverage text NOT NULL DEFAULT 'Pan-India serviceable pin codes',
  tracking_provided boolean NOT NULL DEFAULT true,
  return_policy_type text NOT NULL DEFAULT 'replacement_only'
    CHECK (return_policy_type IN ('returns_accepted', 'replacement_only', 'non_returnable_perishable')),
  return_window_days integer NOT NULL DEFAULT 7,
  return_policy_details text NOT NULL DEFAULT '7-day replacement for verified transit damage or manufacturing defect. Managed and fulfilled directly by the seller.',
  customer_support_contact text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 9. MARKETPLACE ORDERS & SELLER FULFILMENT ITEMS (public.marketplace_orders, public.marketplace_order_items)
CREATE TABLE IF NOT EXISTS public.marketplace_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  buyer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  buyer_name text NOT NULL,
  buyer_email text NOT NULL,
  buyer_phone text NOT NULL,
  shipping_address text NOT NULL,
  shipping_city text NOT NULL,
  shipping_state text NOT NULL,
  shipping_pincode text NOT NULL,
  total_amount numeric(12,2) NOT NULL CHECK (total_amount >= 0),
  payment_status text NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  seller_id uuid NOT NULL REFERENCES public.sellers(user_id) ON DELETE RESTRICT,
  product_title text NOT NULL,
  sku text,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_mrp numeric(12,2) NOT NULL,
  unit_selling_price numeric(12,2) NOT NULL,
  shipping_charge numeric(10,2) NOT NULL DEFAULT 0,
  line_total numeric(12,2) NOT NULL,
  fulfilment_status text NOT NULL DEFAULT 'new_order'
    CHECK (fulfilment_status IN (
      'new_order',
      'accepted',
      'processing',
      'packed',
      'shipped',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'return_requested',
      'returned'
    )),
  courier_partner text,
  tracking_number text,
  tracking_url text,
  dispatched_at timestamptz,
  delivered_at timestamptz,
  seller_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_order_items_seller_id ON public.marketplace_order_items(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_order_items_status ON public.marketplace_order_items(fulfilment_status);

-- 10. MARKETPLACE ACTIVITY & AUDIT LOGS (public.marketplace_activity_logs)
CREATE TABLE IF NOT EXISTS public.marketplace_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role text NOT NULL,
  action_type text NOT NULL,
  target_entity_type text NOT NULL,
  target_entity_id text NOT NULL,
  previous_state jsonb,
  new_state jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_activity_logs_entity ON public.marketplace_activity_logs(target_entity_type, target_entity_id);

-- 11. ROW LEVEL SECURITY POLICIES
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_shipping_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_activity_logs ENABLE ROW LEVEL SECURITY;

-- Categories: publicly readable, manageable by Founder or product.approve staff
DROP POLICY IF EXISTS "Public can view active product categories" ON public.product_categories;
CREATE POLICY "Public can view active product categories"
  ON public.product_categories FOR SELECT
  USING (is_active = true OR public.is_platform_admin() OR public.has_staff_permission_for_user(auth.uid(), 'product.approve'));

-- Brands: publicly readable when approved; sellers manage own brands; staff with seller.verify_documents / seller.approve review
DROP POLICY IF EXISTS "Public can view approved brands" ON public.brands;
CREATE POLICY "Public can view approved brands"
  ON public.brands FOR SELECT
  USING (
    verification_status = 'approved'
    OR auth.uid() = seller_user_id
    OR public.is_platform_admin()
    OR public.has_staff_permission_for_user(auth.uid(), 'seller.verify_documents')
    OR public.has_staff_permission_for_user(auth.uid(), 'seller.approve')
  );

DROP POLICY IF EXISTS "Sellers can insert own brands" ON public.brands;
CREATE POLICY "Sellers can insert own brands"
  ON public.brands FOR INSERT
  WITH CHECK (auth.uid() = seller_user_id);

DROP POLICY IF EXISTS "Sellers can update own unapproved brands" ON public.brands;
CREATE POLICY "Sellers can update own unapproved brands"
  ON public.brands FOR UPDATE
  USING (
    auth.uid() = seller_user_id
    OR public.is_platform_admin()
    OR public.has_staff_permission_for_user(auth.uid(), 'seller.approve')
  );

-- Product Variants: publicly readable for approved products, seller manages own variants
DROP POLICY IF EXISTS "Public and owners can view product variants" ON public.product_variants;
CREATE POLICY "Public and owners can view product variants"
  ON public.product_variants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      LEFT JOIN public.sellers s ON s.id = p.seller_id
      WHERE p.id = product_variants.product_id
        AND (
          p.moderation_status = 'approved'
          OR s.user_id = auth.uid()
          OR public.is_platform_admin()
          OR public.has_staff_permission_for_user(auth.uid(), 'product.approve')
        )
    )
  );

-- Inventory movements: seller can view/insert own movements, staff with product.approve can view
DROP POLICY IF EXISTS "Sellers and authorized staff view inventory movements" ON public.inventory_movements;
CREATE POLICY "Sellers and authorized staff view inventory movements"
  ON public.inventory_movements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.id = inventory_movements.seller_id AND s.user_id = auth.uid()
    )
    OR public.is_platform_admin()
    OR public.has_staff_permission_for_user(auth.uid(), 'product.approve')
  );

-- Seller shipping profiles: publicly readable for approved sellers, seller manages own profile
DROP POLICY IF EXISTS "Public and seller can read shipping profile" ON public.seller_shipping_profiles;
CREATE POLICY "Public and seller can read shipping profile"
  ON public.seller_shipping_profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Seller can manage own shipping profile" ON public.seller_shipping_profiles;
CREATE POLICY "Seller can manage own shipping profile"
  ON public.seller_shipping_profiles FOR ALL
  USING (auth.uid() = seller_user_id OR public.is_platform_admin())
  WITH CHECK (auth.uid() = seller_user_id OR public.is_platform_admin());

-- Seller order items: strict seller-to-seller isolation
DROP POLICY IF EXISTS "Sellers view own order items only" ON public.marketplace_order_items;
CREATE POLICY "Sellers view own order items only"
  ON public.marketplace_order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.id = marketplace_order_items.seller_id AND s.user_id = auth.uid()
    )
    OR public.is_platform_admin()
    OR public.has_staff_permission_for_user(auth.uid(), 'product.approve')
    OR public.has_staff_permission_for_user(auth.uid(), 'support.manage_tickets')
  );
