-- ============================================================================
-- UTTARKUNTH 3.1 — PHASE 4 CORRECTIVE SECURITY MIGRATION
-- Corrects live Phase 2/3 consent, admin-RPC, host-helper, and storage permissions.
-- Safe to run after migration 20261105191649.
-- ============================================================================

BEGIN;

-- Correct the Phase 2 profile trigger: metadata timestamps and aggregate flags
-- must never be treated as evidence of explicit privacy/agreement acceptance.
CREATE OR REPLACE FUNCTION public.sync_staff_profile_cols()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $func$
BEGIN
  IF NEW.role_slug IS NULL AND NEW.role_code IS NOT NULL THEN
    NEW.role_slug := NEW.role_code;
  ELSIF NEW.role_code IS NULL AND NEW.role_slug IS NOT NULL THEN
    NEW.role_code := NEW.role_slug;
  END IF;

  IF NEW.identity_document_reference IS NULL AND NEW.identity_document_ref IS NOT NULL THEN
    NEW.identity_document_reference := NEW.identity_document_ref;
  ELSIF NEW.identity_document_ref IS NULL AND NEW.identity_document_reference IS NOT NULL THEN
    NEW.identity_document_ref := NEW.identity_document_reference;
  END IF;

  -- Explicit consent only: do not infer acceptance from a timestamp or one aggregate flag.
  -- The application must persist every current agreement acceptance row first.

  IF NEW.founder_approved_at IS NULL AND NEW.approved_at IS NOT NULL THEN
    NEW.founder_approved_at := NEW.approved_at;
  ELSIF NEW.approved_at IS NULL AND NEW.founder_approved_at IS NOT NULL THEN
    NEW.approved_at := NEW.founder_approved_at;
  END IF;

  IF NEW.founder_approved_by IS NULL AND NEW.approved_by IS NOT NULL THEN
    NEW.founder_approved_by := NEW.approved_by;
  ELSIF NEW.approved_by IS NULL AND NEW.founder_approved_by IS NOT NULL THEN
    NEW.approved_by := NEW.founder_approved_by;
  END IF;

  IF NEW.founder_approved_at IS NOT NULL AND NEW.founder_approved_by IS NOT NULL THEN
    NEW.founder_approved := true;
  END IF;
  -- Never synthesize a Founder approval timestamp when the record has no approval time.
  -- A missing timestamp remains incomplete and is denied by the authorization helpers.

  NEW.updated_at := now();
  RETURN NEW;
END;
$func$;

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
  SELECT p_user_id IS NOT NULL AND EXISTS (\n    SELECT 1\n    FROM public.staff_profiles sp\n    WHERE sp.user_id = p_user_id\n      AND sp.status = 'active'\n      AND sp.session_revoked_at IS NULL\n      AND sp.founder_approved = true\n      AND sp.founder_approved_at IS NOT NULL\n      AND sp.founder_approved_by IS NOT NULL\n      AND sp.staff_id IS NOT NULL\n      AND sp.role_slug IS NOT NULL\n      AND sp.privacy_notice_accepted = true\n      AND COALESCE(sp.agreements_completed, false) = true\n      AND COALESCE(sp.all_agreements_accepted, false) = true\n      AND COALESCE(sp.onboarding_completed, false) = true\n  );\n$func$;

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

-- Permission helper used by staff-profile, agreement and seller-document RLS policies.
-- The compatibility p_user_id argument is deliberately ignored: callers can inspect
-- only the current JWT user's own permissions. It requires completed onboarding and AAL2.
CREATE OR REPLACE FUNCTION public.has_staff_permission_for_user(
  p_user_id uuid,
  p_perm text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $func$
  SELECT auth.uid() IS NOT NULL
    AND p_perm IS NOT NULL
    AND length(trim(p_perm)) > 0
    AND public.current_session_is_aal2()
    AND EXISTS (
      SELECT 1
      FROM public.staff_profiles sp
      WHERE sp.user_id = auth.uid()
        AND sp.status = 'active'
        AND sp.founder_approved = true
        AND sp.founder_approved_at IS NOT NULL
        AND sp.founder_approved_by IS NOT NULL
        AND sp.staff_id IS NOT NULL
        AND sp.role_slug IS NOT NULL
        AND sp.session_revoked_at IS NULL
        AND sp.privacy_notice_accepted = true
        AND COALESCE(sp.agreements_completed, false) = true
        AND COALESCE(sp.all_agreements_accepted, false) = true
        AND COALESCE(sp.onboarding_completed, false) = true
        AND (
          sp.role_slug = 'founder'
          OR p_perm = ANY(COALESCE(sp.custom_permissions, ARRAY[]::text[]))
          OR EXISTS (
            SELECT 1
            FROM public.staff_role_permissions srp
            WHERE srp.role_slug = sp.role_slug
              AND srp.permission_key = p_perm
          )
          OR EXISTS (
            SELECT 1
            FROM public.staff_permission_assignments spa
            WHERE (spa.staff_profile_id = sp.id OR spa.user_id = auth.uid())
              AND spa.permission_key = p_perm
              AND spa.grant_type IN ('allow', 'grant')
              AND spa.is_active = true
              AND spa.revoked_at IS NULL
              AND (spa.expires_at IS NULL OR spa.expires_at > now())
          )
        )
        AND NOT (p_perm = ANY(COALESCE(sp.revoked_permissions, ARRAY[]::text[])))
    );
$func$;

REVOKE ALL ON FUNCTION public.has_staff_permission_for_user(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_staff_permission_for_user(uuid, text) TO authenticated, service_role;
COMMENT ON FUNCTION public.has_staff_permission_for_user(uuid, text) IS
  'Checks only auth.uid(); the legacy p_user_id argument is ignored. Requires approved, consented, fully onboarded staff and AAL2.';

-- These policies call the helper as authenticated users. Anonymous sessions have no access
-- to HR, seller verification, or staff agreement records.
DROP POLICY IF EXISTS "seller_own_verification_docs_insert" ON public.seller_verification_documents;
CREATE POLICY "seller_own_verification_docs_insert"
  ON public.seller_verification_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_user_id);

DROP POLICY IF EXISTS "seller_own_verification_docs_select" ON public.seller_verification_documents;
CREATE POLICY "seller_own_verification_docs_select"
  ON public.seller_verification_documents
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = seller_user_id
    OR public.has_staff_permission_for_user(auth.uid(), 'seller.verify_documents')
    OR public.has_staff_permission_for_user(auth.uid(), 'finance.review_agreements')
  );

DROP POLICY IF EXISTS "staff_agreements_self_or_reviewer_select" ON public.staff_agreement_acceptances;
CREATE POLICY "staff_agreements_self_or_reviewer_select"
  ON public.staff_agreement_acceptances
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_staff_permission_for_user(auth.uid(), 'staff.hr_docs.view')
    OR public.has_staff_permission_for_user(auth.uid(), 'staff.hire_approve')
  );

DROP POLICY IF EXISTS "staff_profiles_self_or_founder_select" ON public.staff_profiles;
CREATE POLICY "staff_profiles_self_or_founder_select"
  ON public.staff_profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_staff_permission_for_user(auth.uid(), 'staff.permissions.manage')
    OR public.has_staff_permission_for_user(auth.uid(), 'staff.hire_approve')
  );

-- 6. Replace broad private-document policies with pillar permission-scoped AAL2 access.
-- Private documents are owner-readable or available to the relevant, explicitly
-- permissioned pillar reviewers. The helper enforces complete consent and AAL2.
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
      OR public.has_staff_permission_for_user(auth.uid(), 'seller.verify_documents')
      OR public.has_staff_permission_for_user(auth.uid(), 'finance.review_agreements')
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
      OR public.has_staff_permission_for_user(auth.uid(), 'staff.hr_docs.view')
      OR public.has_staff_permission_for_user(auth.uid(), 'staff.hire_approve')
    )
  );

DROP POLICY IF EXISTS "Private pillar docs restricted to owner or Staff AAL2" ON storage.objects;
CREATE POLICY "Private pillar docs restricted to owner or Staff AAL2"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    (
      bucket_id = 'host-verification-docs'
      AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR (storage.foldername(name))[2] = auth.uid()::text
        OR public.has_staff_permission_for_user(auth.uid(), 'property.review')
        OR public.has_staff_permission_for_user(auth.uid(), 'property.assign_host')
      )
    )
    OR (
      bucket_id = 'production-private-docs'
      AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR (storage.foldername(name))[2] = auth.uid()::text
        OR public.has_staff_permission_for_user(auth.uid(), 'productions.review_proposal')
        OR public.has_staff_permission_for_user(auth.uid(), 'productions.approve_profile')
      )
    )
    OR (
      bucket_id = 'community-private-docs'
      AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR (storage.foldername(name))[2] = auth.uid()::text
        OR public.has_staff_permission_for_user(auth.uid(), 'community.moderate')
        OR public.has_staff_permission_for_user(auth.uid(), 'community.moderate')
      )
    )
  );

COMMIT;
