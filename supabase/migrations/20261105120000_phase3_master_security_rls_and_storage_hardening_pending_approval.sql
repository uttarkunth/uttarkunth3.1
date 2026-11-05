-- ============================================================================
-- UTTARKUNTH 3.1 — PHASE 3 MASTER SECURITY, RLS, TRIGGER & STORAGE HARDENING
-- Migration: 20261105120000_phase3_master_security_rls_and_storage_hardening_pending_approval.sql
-- Status: PENDING FOUNDER REVIEW & APPROVAL (Additive, Idempotent, Non-Destructive)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ENSURE property_hosts.status COLUMN EXISTS & CREATE is_property_host()
-- Fixes live Supabase error 42501 ("permission denied for table property_hosts")
-- when anon queries public.properties or public.room_units.
-- ============================================================================
ALTER TABLE public.property_hosts
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'revoked', 'inactive'));

CREATE OR REPLACE FUNCTION public.is_property_host(
  p_property_id uuid,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $func$
  -- p_user_id remains for compatibility but is deliberately ignored.
  -- A caller can only inspect their own host assignment through auth.uid().
  SELECT CASE
    WHEN p_property_id IS NULL OR auth.uid() IS NULL THEN false
    ELSE EXISTS (
      SELECT 1
      FROM public.properties p
      WHERE p.id = p_property_id
        AND p.host_id = auth.uid()
    ) OR EXISTS (
      SELECT 1
      FROM public.property_hosts ph
      WHERE ph.property_id = p_property_id
        AND ph.user_id = auth.uid()
        AND COALESCE(ph.status, 'active') = 'active'
    )
  END;
$func$;

REVOKE ALL ON FUNCTION public.is_property_host(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_property_host(uuid, uuid) TO authenticated, service_role;
COMMENT ON FUNCTION public.is_property_host(uuid, uuid) IS
  'Checks the current JWT user only. The retained p_user_id parameter is ignored for backwards compatibility.';

-- 2. TOTP MFA ASSURANCE LEVEL (AAL2) HELPER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.current_session_is_aal2()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $func$
  SELECT COALESCE(auth.jwt()->>'aal', '') = 'aal2';
$func$;

REVOKE ALL ON FUNCTION public.current_session_is_aal2() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_session_is_aal2() TO authenticated, service_role;

-- ============================================================================
-- 3. UNIFY is_platform_admin_for_user(uuid) & is_platform_admin() WITH STAFF REGISTRY
-- Ensures Stays RPCs and RLS policies recognize active, Founder-approved staff
-- while preserving backward compatibility with platform_admins.
-- ============================================================================
ALTER TABLE public.platform_admins
  DROP CONSTRAINT IF EXISTS platform_admins_role_check;

REVOKE ALL ON TABLE public.platform_admins FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.platform_admins TO service_role;

-- staff_profiles is the sole administrative identity registry once Phase 2 is installed.
-- Legacy platform_admins rows must never bypass staff approval, consent, or agreement checks.
CREATE OR REPLACE FUNCTION public.is_platform_admin_for_user(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $func$
  SELECT p_user_id IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.staff_profiles sp
    WHERE sp.user_id = p_user_id
      AND sp.status = 'active'
      AND sp.session_revoked_at IS NULL
      AND sp.founder_approved = true
      AND sp.founder_approved_at IS NOT NULL
      AND sp.founder_approved_by IS NOT NULL
      AND sp.staff_id IS NOT NULL
      AND sp.role_slug IS NOT NULL
      AND sp.privacy_notice_accepted = true
      AND COALESCE(sp.agreements_completed, false) = true
      AND COALESCE(sp.all_agreements_accepted, false) = true
      AND COALESCE(sp.onboarding_completed, false) = true
  );
$func$;

REVOKE ALL ON FUNCTION public.is_platform_admin_for_user(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin_for_user(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;
  RETURN public.is_platform_admin_for_user(v_uid)
    AND public.current_session_is_aal2();
END;
$$;

REVOKE ALL ON FUNCTION public.is_platform_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated, service_role;

-- Sensitive private-document review is Founder-only in the initial release.
-- Employee access is intentionally owner-only until pillar-specific document permissions
-- are implemented and tested. This helper derives identity from auth.uid() to prevent probing.
CREATE OR REPLACE FUNCTION public.is_active_founder()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $func$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.staff_profiles sp
    WHERE sp.user_id = auth.uid()
      AND sp.role_slug = 'founder'
      AND sp.status = 'active'
      AND sp.session_revoked_at IS NULL
      AND sp.founder_approved = true
      AND sp.founder_approved_at IS NOT NULL
      AND sp.founder_approved_by IS NOT NULL
      AND sp.staff_id = 'UK-STAFF-2026-0001'
      AND sp.privacy_notice_accepted = true
      AND COALESCE(sp.agreements_completed, false) = true
      AND COALESCE(sp.all_agreements_accepted, false) = true
      AND COALESCE(sp.onboarding_completed, false) = true
  );
$func$;

REVOKE ALL ON FUNCTION public.is_active_founder() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_founder() TO authenticated, service_role;



-- ============================================================================
-- 4. FIX PUBLIC SELECT & HOST POLICIES ON properties, room_units & room_availability_blocks
-- Dynamically removes any legacy policy (including RESTRICTIVE policy
-- "Restrict direct property table reads") that directly queries
-- public.property_hosts (which caused 42501 for anon users) and replaces
-- them with SECURITY DEFINER is_property_host() policies.
-- ============================================================================
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('properties', 'room_units', 'room_availability_blocks')
      AND (
        COALESCE(qual, '') ILIKE '%property_hosts%'
        OR COALESCE(with_check, '') ILIKE '%property_hosts%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END;
$$;

DROP POLICY IF EXISTS "Restrict direct property table reads" ON public.properties;
DROP POLICY IF EXISTS "Public can view approved published properties" ON public.properties;
CREATE POLICY "Public can view approved published properties"
  ON public.properties
  FOR SELECT
  TO anon, authenticated
  USING (published = true AND moderation_status = 'approved');

DROP POLICY IF EXISTS "Hosts manage their own properties" ON public.properties;
DROP POLICY IF EXISTS "Hosts can view own or assigned properties" ON public.properties;
DROP POLICY IF EXISTS "Hosts and co-hosts manage their properties" ON public.properties;
CREATE POLICY "Hosts and co-hosts manage their properties"
  ON public.properties
  FOR ALL
  TO authenticated
  USING (
    host_id = auth.uid()
    OR public.is_property_host(id, auth.uid())
    OR public.is_platform_admin()
  )
  WITH CHECK (
    host_id = auth.uid()
    OR public.is_property_host(id, auth.uid())
    OR public.is_platform_admin()
  );

DROP POLICY IF EXISTS "Public can view active rooms for approved published properties" ON public.room_units;
DROP POLICY IF EXISTS "Public can view room units of published properties" ON public.room_units;
CREATE POLICY "Public can view room units of published properties"
  ON public.room_units
  FOR SELECT
  TO anon, authenticated
  USING (
    active = true
    AND EXISTS (
      SELECT 1
      FROM public.properties p
      WHERE p.id = room_units.property_id
        AND p.published = true
        AND p.moderation_status = 'approved'
    )
  );

DROP POLICY IF EXISTS "Hosts manage room units for their own properties" ON public.room_units;
DROP POLICY IF EXISTS "Hosts can view room units of own properties" ON public.room_units;
DROP POLICY IF EXISTS "Hosts and co-hosts manage room units for their properties" ON public.room_units;
CREATE POLICY "Hosts and co-hosts manage room units for their properties"
  ON public.room_units
  FOR ALL
  TO authenticated
  USING (
    public.is_property_host(property_id, auth.uid())
    OR public.is_platform_admin()
  )
  WITH CHECK (
    public.is_property_host(property_id, auth.uid())
    OR public.is_platform_admin()
  );

DROP POLICY IF EXISTS "Authorized hosts and admins can view availability blocks" ON public.room_availability_blocks;
CREATE POLICY "Authorized hosts and admins can view availability blocks"
  ON public.room_availability_blocks
  FOR SELECT
  TO authenticated
  USING (
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1
      FROM public.room_units r
      WHERE r.id = room_availability_blocks.room_unit_id
        AND public.is_property_host(r.property_id, auth.uid())
    )
  );

-- Ensure anon and authenticated have table-level SELECT on properties and room_units
GRANT SELECT ON TABLE public.properties TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.room_units TO anon, authenticated, service_role;

-- ============================================================================
-- 5. BEFORE UPDATE MODERATION & SELF-APPROVAL PROTECTION TRIGGERS
-- Prevents non-staff users from self-approving or self-publishing records
-- via direct PostgREST PATCH requests while permitting verified service_role
-- server actions and platform admins.
-- ============================================================================

-- 5A. Properties Moderation Guard
CREATE OR REPLACE FUNCTION public.enforce_property_moderation_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(auth.role(), '') = 'service_role'
     OR COALESCE(auth.jwt()->>'role', '') = 'service_role'
     OR COALESCE(current_setting('request.jwt.claim.role', true), '') = 'service_role'
     OR COALESCE(current_setting('role', true), '') IN ('service_role', 'postgres', 'supabase_admin')
     OR public.is_platform_admin()
  THEN
    RETURN NEW;
  END IF;

  IF NEW.moderation_status IS DISTINCT FROM OLD.moderation_status THEN
    RAISE EXCEPTION 'Forbidden: Only authorized Uttarkunth Stays staff may change property moderation_status.';
  END IF;

  IF NEW.published IS DISTINCT FROM OLD.published AND NEW.published = true THEN
    RAISE EXCEPTION 'Forbidden: Only authorized Uttarkunth Stays staff may publish a property.';
  END IF;

  IF NEW.host_id IS DISTINCT FROM OLD.host_id THEN
    RAISE EXCEPTION 'Forbidden: Property host ownership may only be reassigned by authorized staff.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_property_moderation_guard ON public.properties;
CREATE TRIGGER trg_enforce_property_moderation_guard
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_property_moderation_guard();

-- 5B. Sellers Status Immutability Guard
CREATE OR REPLACE FUNCTION public.enforce_seller_status_immutability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(auth.role(), '') = 'service_role'
     OR COALESCE(auth.jwt()->>'role', '') = 'service_role'
     OR COALESCE(current_setting('request.jwt.claim.role', true), '') = 'service_role'
     OR COALESCE(current_setting('role', true), '') IN ('service_role', 'postgres', 'supabase_admin')
     OR public.is_platform_admin()
  THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'pending' THEN
    RAISE EXCEPTION 'Forbidden: Sellers cannot self-approve their marketplace verification status.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_seller_status_immutability ON public.sellers;
CREATE TRIGGER trg_enforce_seller_status_immutability
  BEFORE UPDATE ON public.sellers
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_seller_status_immutability();

-- 5C. Products Moderation Immutability Guard (Reconciled with enforce_product_moderation_lifecycle)
CREATE OR REPLACE FUNCTION public.enforce_product_moderation_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(auth.role(), '') = 'service_role'
     OR COALESCE(auth.jwt()->>'role', '') = 'service_role'
     OR COALESCE(current_setting('request.jwt.claim.role', true), '') = 'service_role'
     OR COALESCE(current_setting('role', true), '') IN ('service_role', 'postgres', 'supabase_admin')
     OR public.is_platform_admin()
  THEN
    NEW.updated_at := clock_timestamp();
    RETURN NEW;
  END IF;

  IF NEW.moderation_status = 'approved' THEN
    RAISE EXCEPTION 'Unauthorized product self-approval: Only authorized Uttarkunth Products staff can approve marketplace products.'
      USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.moderation_status = 'approved' THEN
    IF NEW.moderation_status IS DISTINCT FROM 'pending' AND NEW.moderation_status IS DISTINCT FROM 'draft' THEN
      NEW.moderation_status := 'pending';
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.seller_id IS DISTINCT FROM NEW.seller_id THEN
    RAISE EXCEPTION 'Product seller ownership cannot be transferred (Product ID: %).', OLD.id
      USING ERRCODE = '55000';
  END IF;

  NEW.updated_at := clock_timestamp();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_product_moderation_immutability ON public.products;
DROP TRIGGER IF EXISTS trg_enforce_product_moderation_lifecycle ON public.products;
CREATE TRIGGER trg_enforce_product_moderation_lifecycle
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_product_moderation_lifecycle();

-- 5D. Filmmaker Profile Status Immutability Guard
CREATE OR REPLACE FUNCTION public.enforce_filmmaker_status_immutability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(auth.role(), '') = 'service_role'
     OR COALESCE(auth.jwt()->>'role', '') = 'service_role'
     OR COALESCE(current_setting('request.jwt.claim.role', true), '') = 'service_role'
     OR COALESCE(current_setting('role', true), '') IN ('service_role', 'postgres', 'supabase_admin')
     OR public.is_platform_admin()
  THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'pending' THEN
    RAISE EXCEPTION 'Forbidden: Filmmakers cannot self-approve their creator status.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_filmmaker_status_immutability ON public.filmmaker_profiles;
CREATE TRIGGER trg_enforce_filmmaker_status_immutability
  BEFORE UPDATE ON public.filmmaker_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_filmmaker_status_immutability();

-- ============================================================================
-- 6. CREATE public.reviews TABLE WITH MODERATION & RLS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.stay_bookings(id) ON DELETE SET NULL,
  reviewer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  moderation_status text NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  moderated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  moderated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews FORCE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE public.reviews TO anon, authenticated, service_role;
GRANT INSERT, UPDATE ON TABLE public.reviews TO authenticated, service_role;

DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;
CREATE POLICY "Public can view approved reviews"
  ON public.reviews
  FOR SELECT
  TO anon, authenticated
  USING (moderation_status = 'approved');

DROP POLICY IF EXISTS "Authenticated guests can submit reviews" ON public.reviews;
CREATE POLICY "Authenticated guests can submit reviews"
  ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    reviewer_user_id = auth.uid()
    AND moderation_status = 'pending'
  );

DROP POLICY IF EXISTS "Staff can moderate reviews" ON public.reviews;
CREATE POLICY "Staff can moderate reviews"
  ON public.reviews
  FOR ALL
  TO authenticated
  USING (public.is_active_founder() AND public.current_session_is_aal2())
  WITH CHECK (public.is_active_founder() AND public.current_session_is_aal2());

-- ============================================================================
-- 7. ENABLE & FORCE ROW LEVEL SECURITY ACROSS ALL SENSITIVE TABLES
-- Includes explicit policy for postgres (SECURITY DEFINER / view owner) and
-- service_role so FORCE ROW LEVEL SECURITY never breaks SECURITY DEFINER RPCs
-- or owner-invoked security views (public_room_availability, public_member_profiles).
-- ============================================================================
DO $$
DECLARE
  v_tbl text;
  v_tables text[] := ARRAY[
    'properties',
    'room_units',
    'stay_bookings',
    'room_availability_blocks',
    'host_agreements',
    'property_hosts',
    'platform_admins',
    'admin_audit_log',
    'legal_terms_documents',
    'admin_users',
    'property_review_checks',
    'property_review_events',
    'sellers',
    'products',
    'product_interests',
    'rate_limits',
    'filmmaker_profiles',
    'production_proposals',
    'community_initiatives',
    'community_participations',
    'community_stories',
    'user_notifications',
    'reviews',
    'profiles',
    'staff_roles',
    'staff_permissions',
    'staff_role_permissions',
    'staff_invitations',
    'staff_profiles',
    'staff_permission_assignments',
    'staff_documents',
    'staff_agreements',
    'staff_agreement_acceptances',
    'staff_employment_history',
    'staff_dual_approvals',
    'staff_audit_log',
    'seller_verification_documents',
    'seller_verification_checks',
    'marketplace_category_requirements'
  ];
BEGIN
  FOREACH v_tbl IN ARRAY v_tables LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = v_tbl
        AND table_type = 'BASE TABLE'
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', v_tbl);
      EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY;', v_tbl);
      EXECUTE format('DROP POLICY IF EXISTS "service_and_definer_internal_access" ON public.%I;', v_tbl);
      EXECUTE format(
        'CREATE POLICY "service_and_definer_internal_access" ON public.%I FOR ALL TO postgres, supabase_admin, service_role USING (true) WITH CHECK (true);',
        v_tbl
      );
    END IF;
  END LOOP;
END;
$$;

-- ============================================================================
-- 8. PROVISION ALL 6 STORAGE BUCKETS & STRICT STORAGE RLS POLICIES
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('property-photos', 'property-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('staff-hr-docs', 'staff-hr-docs', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('seller-verification-docs', 'seller-verification-docs', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('host-verification-docs', 'host-verification-docs', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('production-private-docs', 'production-private-docs', false, 20971520, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('community-private-docs', 'community-private-docs', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read access ONLY for property-photos
DROP POLICY IF EXISTS "Public read access for property-photos" ON storage.objects;
CREATE POLICY "Public read access for property-photos"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'property-photos');

-- Owner-scoped read & upload for seller-verification-docs (supports both <uid>/file and seller-verification/<uid>/file)
DROP POLICY IF EXISTS "Sellers can access own verification docs" ON storage.objects;
CREATE POLICY "Sellers can access own verification docs"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'seller-verification-docs'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR (storage.foldername(name))[2] = auth.uid()::text
      OR (public.is_active_founder() AND public.current_session_is_aal2())
    )
  );

DROP POLICY IF EXISTS "Sellers can upload own verification docs" ON storage.objects;
CREATE POLICY "Sellers can upload own verification docs"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'seller-verification-docs'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR (storage.foldername(name))[2] = auth.uid()::text
    )
  );

-- Staff HR docs restricted strictly to owner or Founder/Authorized Staff AAL2
DROP POLICY IF EXISTS "Staff HR docs restricted to owner or Founder AAL2" ON storage.objects;
CREATE POLICY "Staff HR docs restricted to owner or Founder AAL2"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'staff-hr-docs'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR (storage.foldername(name))[2] = auth.uid()::text
      OR (public.is_active_founder() AND public.current_session_is_aal2())
    )
  );

-- Private host, production, and community document buckets restricted to owner or AAL2 Staff
DROP POLICY IF EXISTS "Private pillar docs restricted to owner or Staff AAL2" ON storage.objects;
CREATE POLICY "Private pillar docs restricted to owner or Staff AAL2"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id IN ('host-verification-docs', 'production-private-docs', 'community-private-docs')
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR (storage.foldername(name))[2] = auth.uid()::text
      OR (public.is_active_founder() AND public.current_session_is_aal2())
    )
  );

COMMIT;
