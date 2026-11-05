-- ============================================================================
-- UTTARKUNTH 3.1 — PHASE 4 CORRECTIVE SECURITY MIGRATION
-- Corrects live Phase 2/3 consent, admin-RPC, host-helper, and storage permissions.
-- Safe to run after migration 20261105191649.
-- ============================================================================

BEGIN;

-- 1. Repair inconsistent completion flags without fabricating consent.
UPDATE public.staff_profiles
SET onboarding_completed = false,
    updated_at = now()
WHERE onboarding_completed = true
  AND (
    COALESCE(privacy_notice_accepted, false) = false
    OR COALESCE(agreements_completed, false) = false
    OR COALESCE(all_agreements_accepted, false) = false
  );

-- 2. Keep the existing function signature for compatibility, but ignore p_user_id.
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

-- 3. staff_profiles is the sole source of privileged staff identity.
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

-- 4. All privileged RLS paths require a real AAL2 session.
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $func$
  SELECT auth.uid() IS NOT NULL
    AND public.is_platform_admin_for_user(auth.uid())
    AND public.current_session_is_aal2();
$func$;

REVOKE ALL ON FUNCTION public.is_platform_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated, service_role;

-- 5. This invoker-security helper sees only the caller's own staff profile.
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

-- 6. Replace all broad private-document read policies. Employee access to another
-- person's records is denied until granular departmental permissions are implemented.
-- Founder review of sensitive documents requires both completed consent and AAL2.
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

DROP POLICY IF EXISTS "Private pillar docs restricted to owner or Staff AAL2" ON storage.objects;
CREATE POLICY "Private pillar docs restricted to owner or Founder AAL2"
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
