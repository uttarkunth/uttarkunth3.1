-- =============================================================================
-- UTTARKUNTH PHASE 2: PRIVATE STAFF PORTAL, GOVERNANCE, COMMON MEMBER PROFILES & SELLER VERIFICATION
-- Migration Status: PENDING PRODUCTION APPROVAL (DO NOT RUN WITHOUT OWNER SIGN-OFF)
-- Target Project: xyplgugxpmlnjsvlosdg
-- Design Principles: 100% Additive, Reconciled Contracts, Non-Recursive SECURITY DEFINER RLS & Restricted Execution
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 0. COMMON PUBLIC MEMBER PROFILES (Unified Member Identity — Phase 4 & 5)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  preferred_name text,
  phone text,
  city text,
  state text,
  country text NOT NULL DEFAULT 'India',
  bio text,
  avatar_url text,
  interests text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Members can read and update their own full profile (including private phone)
DROP POLICY IF EXISTS "profiles_self_select" ON public.profiles;
CREATE POLICY "profiles_self_select"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_self_insert" ON public.profiles;
CREATE POLICY "profiles_self_insert"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
CREATE POLICY "profiles_self_update"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Safe public view exposing only non-sensitive member display fields (never phone)
CREATE OR REPLACE VIEW public.public_member_profiles AS
SELECT
  id,
  full_name,
  preferred_name,
  city,
  state,
  country,
  bio,
  avatar_url,
  interests,
  created_at
FROM public.profiles;

-- -----------------------------------------------------------------------------
-- 1. INTERNAL STAFF ROLES, PERMISSIONS & PROFILES (Reconciled Contract)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.staff_roles (
  role_slug text PRIMARY KEY,
  title text NOT NULL,
  department text NOT NULL,
  description text NOT NULL,
  allowed_modules text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.staff_permissions (
  permission_key text PRIMARY KEY,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.staff_role_permissions (
  role_slug text NOT NULL REFERENCES public.staff_roles(role_slug) ON DELETE CASCADE,
  permission_key text NOT NULL REFERENCES public.staff_permissions(permission_key) ON DELETE CASCADE,
  PRIMARY KEY (role_slug, permission_key)
);

-- Seed 8 Authoritative Staff Roles
INSERT INTO public.staff_roles (role_slug, title, department, description, allowed_modules)
VALUES
  ('founder', 'Founder / Superadmin', 'founder_office', 'Full platform governance, staff hiring & termination, permission assignment, dual approvals, and full ecosystem oversight.', ARRAY['/admin/dashboard','/admin/staff','/admin/properties','/admin/products','/admin/productions','/admin/community','/admin/users','/admin/settings','/admin/bookings','/admin/audit']),
  ('operations_admin', 'Operations Administrator', 'operations', 'Coordinates cross-pillar operations, property host assignments, and booking supervision without unilateral staff hiring authority.', ARRAY['/admin/dashboard','/admin/properties','/admin/users','/admin/bookings']),
  ('property_reviewer', 'Property & Host Reviewer', 'stays_curation', 'Reviews and moderates homestay listings, staged property changes, and host assignments.', ARRAY['/admin/dashboard','/admin/properties','/admin/users']),
  ('marketplace_reviewer', 'Marketplace & Seller Reviewer', 'marketplace_compliance', 'Reviews artisan and seller applications, verifies Indian GSTIN checksums, reviews category licences, and moderates product submissions.', ARRAY['/admin/dashboard','/admin/products']),
  ('productions_editor', 'Productions & Collaborations Editor', 'productions', 'Moderates independent filmmaker profiles and documentary proposals for Uttarkunth Productions.', ARRAY['/admin/dashboard','/admin/productions']),
  ('community_manager', 'Community & Fellowships Manager', 'community', 'Moderates oral history community stories, Living University fellowship applications, and mountain initiatives.', ARRAY['/admin/dashboard','/admin/community']),
  ('support_executive', 'Support Executive', 'customer_support', 'Handles member assistance and booking inquiries. Strictly prohibited from accessing private HR or seller verification documents.', ARRAY['/admin/dashboard','/admin/bookings']),
  ('finance_compliance_reviewer', 'Finance, Legal & Compliance Reviewer', 'finance_legal', 'Reviews bilateral commercial agreements, audits seller compliance documents, and inspects immutable audit trails.', ARRAY['/admin/dashboard','/admin/settings','/admin/products','/admin/audit'])
ON CONFLICT (role_slug) DO UPDATE
SET title = EXCLUDED.title,
    department = EXCLUDED.department,
    description = EXCLUDED.description,
    allowed_modules = EXCLUDED.allowed_modules;

-- Seed 18 Granular Staff Permissions
INSERT INTO public.staff_permissions (permission_key, description)
VALUES
  ('staff.invite', 'Create and cancel single-use staff onboarding invitations'),
  ('staff.hire_approve', 'Approve staff onboarding applications and issue UK-STAFF IDs'),
  ('staff.terminate', 'Suspend or terminate staff members and revoke active sessions'),
  ('staff.permissions.manage', 'Assign and modify granular staff permissions and overrides'),
  ('staff.hr_docs.view', 'View private staff HR and identity documents in staff-hr-docs bucket'),
  ('property.review', 'Review and moderate homestay listings and staged property edits'),
  ('property.assign_host', 'Assign primary hosts and co-hosts to verified properties'),
  ('seller.approve', 'Approve, reject, or suspend artisan and seller accounts'),
  ('product.approve', 'Approve or reject marketplace product submissions'),
  ('seller.verify_documents', 'Access private seller verification documents in seller-verification-docs and record GSTIN checks'),
  ('productions.approve_profile', 'Approve or reject filmmaker collaboration profiles'),
  ('productions.review_proposal', 'Review, moderate, and archive film proposals'),
  ('community.moderate', 'Moderate community stories and Himalayan fellowship applications'),
  ('support.manage_tickets', 'Supervise bookings and respond to member support inquiries'),
  ('finance.review_agreements', 'Review bilateral commercial host agreements and commission records'),
  ('audit.view_full', 'View immutable platform governance and staff audit logs'),
  ('governance.dual_approve', 'Participate as a designated second approver for high-risk governance actions'),
  ('compliance.configure_licences', 'Manage category-to-licence requirements matrix')
ON CONFLICT (permission_key) DO UPDATE
SET description = EXCLUDED.description;

-- Seed Complete Role-to-Permission Mappings
INSERT INTO public.staff_role_permissions (role_slug, permission_key)
VALUES
  -- Founder (All 18 permissions)
  ('founder', 'staff.invite'),
  ('founder', 'staff.hire_approve'),
  ('founder', 'staff.terminate'),
  ('founder', 'staff.permissions.manage'),
  ('founder', 'staff.hr_docs.view'),
  ('founder', 'property.review'),
  ('founder', 'property.assign_host'),
  ('founder', 'seller.approve'),
  ('founder', 'product.approve'),
  ('founder', 'seller.verify_documents'),
  ('founder', 'productions.approve_profile'),
  ('founder', 'productions.review_proposal'),
  ('founder', 'community.moderate'),
  ('founder', 'support.manage_tickets'),
  ('founder', 'finance.review_agreements'),
  ('founder', 'audit.view_full'),
  ('founder', 'governance.dual_approve'),
  ('founder', 'compliance.configure_licences'),
  -- Operations Administrator
  ('operations_admin', 'property.review'),
  ('operations_admin', 'property.assign_host'),
  ('operations_admin', 'support.manage_tickets'),
  -- Property Reviewer
  ('property_reviewer', 'property.review'),
  ('property_reviewer', 'property.assign_host'),
  -- Marketplace Reviewer
  ('marketplace_reviewer', 'seller.approve'),
  ('marketplace_reviewer', 'product.approve'),
  ('marketplace_reviewer', 'seller.verify_documents'),
  -- Productions Editor
  ('productions_editor', 'productions.approve_profile'),
  ('productions_editor', 'productions.review_proposal'),
  -- Community Manager
  ('community_manager', 'community.moderate'),
  -- Support Executive
  ('support_executive', 'support.manage_tickets'),
  -- Finance & Compliance Reviewer
  ('finance_compliance_reviewer', 'finance.review_agreements'),
  ('finance_compliance_reviewer', 'seller.verify_documents'),
  ('finance_compliance_reviewer', 'compliance.configure_licences')
ON CONFLICT (role_slug, permission_key) DO NOTHING;

-- Sequence for immutable Staff IDs (UK-STAFF-YYYY-XXXX)
CREATE SEQUENCE IF NOT EXISTS public.uk_staff_id_seq START WITH 2 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION public.generate_uk_staff_id()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  seq_val bigint;
  yr text;
BEGIN
  seq_val := nextval('public.uk_staff_id_seq');
  yr := to_char(now(), 'YYYY');
  RETURN 'UK-STAFF-' || yr || '-' || lpad(seq_val::text, 4, '0');
END;
$$;

-- Staff Invitations (Single-use, expiring, Founder-controlled; stores SHA-256 token_hash)
CREATE TABLE IF NOT EXISTS public.staff_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL UNIQUE,
  official_email text NOT NULL,
  department text NOT NULL,
  proposed_designation text NOT NULL,
  role_slug text NOT NULL REFERENCES public.staff_roles(role_slug),
  initial_permissions text[] NOT NULL DEFAULT '{}',
  employment_category text NOT NULL DEFAULT 'full_time' CHECK (
    employment_category IN ('full_time', 'part_time', 'contractor', 'advisor', 'fellow', 'intern')
  ),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'expired', 'cancelled')),
  expires_at timestamptz NOT NULL,
  invited_by uuid REFERENCES auth.users(id),
  invited_by_email text,
  accepted_by uuid REFERENCES auth.users(id),
  accepted_at timestamptz,
  cancelled_by uuid REFERENCES auth.users(id),
  cancelled_at timestamptz,
  cancel_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Staff Profiles (Internal Staff Identity separate from ordinary member profiles)
CREATE TABLE IF NOT EXISTS public.staff_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE RESTRICT,
  staff_id text UNIQUE,
  invitation_id uuid REFERENCES public.staff_invitations(id),
  full_legal_name text NOT NULL,
  preferred_name text,
  personal_email text,
  official_email text NOT NULL UNIQUE,
  verified_mobile text,
  current_address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  designation text NOT NULL,
  department text NOT NULL,
  role_slug text NOT NULL REFERENCES public.staff_roles(role_slug),
  custom_permissions text[] NOT NULL DEFAULT '{}',
  revoked_permissions text[] NOT NULL DEFAULT '{}',
  employment_category text NOT NULL DEFAULT 'full_time' CHECK (
    employment_category IN ('full_time', 'part_time', 'contractor', 'advisor', 'fellow', 'intern')
  ),
  joining_date date NOT NULL DEFAULT CURRENT_DATE,
  previous_experience text,
  professional_qualifications text,
  reporting_manager text,
  assigned_responsibilities text,
  identity_document_type text CHECK (
    identity_document_type IS NULL OR identity_document_type IN ('passport', 'voter_id', 'driving_licence', 'pan_card', 'aadhaar_redacted', 'other_government_id')
  ),
  identity_document_reference text,
  identity_document_number_masked text,
  privacy_notice_accepted boolean NOT NULL DEFAULT false,
  all_agreements_accepted boolean NOT NULL DEFAULT false,
  onboarding_completed boolean NOT NULL DEFAULT false,
  mfa_enrolled boolean NOT NULL DEFAULT false,
  founder_approved boolean NOT NULL DEFAULT false,
  founder_approved_by uuid REFERENCES auth.users(id),
  founder_approved_at timestamptz,
  rejection_reason text,
  status text NOT NULL DEFAULT 'pending_founder_approval' CHECK (
    status IN ('invited', 'onboarding_in_progress', 'pending_founder_approval', 'active', 'suspended', 'terminated', 'rejected', 'archived')
  ),
  suspended_at timestamptz,
  suspended_by uuid REFERENCES auth.users(id),
  suspension_reason text,
  terminated_at timestamptz,
  terminated_by uuid REFERENCES auth.users(id),
  termination_reason text,
  session_revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Prevent mutation of immutable staff_id once issued
CREATE OR REPLACE FUNCTION public.prevent_staff_id_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.staff_id IS NOT NULL AND NEW.staff_id IS DISTINCT FROM OLD.staff_id THEN
    RAISE EXCEPTION 'Immutable UK-STAFF-ID cannot be altered once assigned.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_staff_id_mutation ON public.staff_profiles;
CREATE TRIGGER trg_prevent_staff_id_mutation
BEFORE UPDATE ON public.staff_profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_staff_id_mutation();

-- Granular Staff Permission Assignments
CREATE TABLE IF NOT EXISTS public.staff_permission_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_profile_id uuid REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_key text NOT NULL REFERENCES public.staff_permissions(permission_key) ON DELETE CASCADE,
  grant_type text NOT NULL DEFAULT 'allow' CHECK (grant_type IN ('allow', 'revoke')),
  is_active boolean NOT NULL DEFAULT true,
  granted_by uuid REFERENCES auth.users(id),
  reason text,
  granted_at timestamptz NOT NULL DEFAULT now()
);

-- Private Staff HR Documents Metadata (Bucket: staff-hr-docs)
CREATE TABLE IF NOT EXISTS public.staff_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_profile_id uuid REFERENCES public.staff_profiles(id) ON DELETE RESTRICT,
  user_id uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
  document_type text NOT NULL,
  document_title text,
  storage_bucket text NOT NULL DEFAULT 'staff-hr-docs' CHECK (storage_bucket = 'staff-hr-docs'),
  storage_path text NOT NULL,
  mime_type text NOT NULL,
  size_bytes integer,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8 Mandatory Staff Agreements Catalog & Acceptances
CREATE TABLE IF NOT EXISTS public.staff_agreements (
  agreement_code text PRIMARY KEY,
  title text NOT NULL,
  version text NOT NULL,
  document_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.staff_agreement_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_profile_id uuid REFERENCES public.staff_profiles(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  agreement_code text NOT NULL,
  agreement_title text,
  version text NOT NULL DEFAULT '2026.1',
  document_hash text NOT NULL,
  accepted boolean NOT NULL DEFAULT true,
  accepted_ip text,
  user_agent text,
  accepted_at timestamptz NOT NULL DEFAULT now()
);

-- Immutable Staff Employment History (Preserved across suspension/termination)
CREATE TABLE IF NOT EXISTS public.staff_employment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_profile_id uuid NOT NULL REFERENCES public.staff_profiles(id) ON DELETE RESTRICT,
  event_type text NOT NULL CHECK (event_type IN ('invited', 'onboarded', 'approved', 'role_changed', 'suspended', 'reinstated', 'terminated')),
  previous_status text,
  new_status text NOT NULL,
  actor_user_id uuid NOT NULL REFERENCES auth.users(id),
  actor_staff_id text,
  reason text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Dual Authorisation Queue for High-Risk Actions
CREATE TABLE IF NOT EXISTS public.staff_dual_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL CHECK (
    action_type IN (
      'superadmin_creation',
      'admin_promotion',
      'commercial_terms_change',
      'bulk_sensitive_data_export',
      'exceptional_listing_approval',
      'promote_superadmin',
      'create_founder_or_superadmin',
      'change_commercial_terms',
      'export_sensitive_data',
      'override_listing_moderation'
    )
  ),
  target_type text NOT NULL,
  target_id text NOT NULL,
  requested_by uuid NOT NULL REFERENCES auth.users(id),
  requested_by_staff_id text,
  requested_by_email text,
  reason text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'rejected', 'executed', 'expired')
  ),
  second_approver_id uuid REFERENCES auth.users(id),
  second_approver_staff_id text,
  decision_notes text,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Append-Only Staff & Governance Audit Log
CREATE TABLE IF NOT EXISTS public.staff_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES auth.users(id),
  actor_email text,
  actor_staff_id text,
  actor_role text,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  reason text,
  before_state jsonb,
  after_state jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.prevent_staff_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'staff_audit_log is strictly append-only and cannot be modified or deleted.';
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_staff_audit_log_mutation ON public.staff_audit_log;
CREATE TRIGGER trg_prevent_staff_audit_log_mutation
BEFORE UPDATE OR DELETE ON public.staff_audit_log
FOR EACH ROW EXECUTE FUNCTION public.prevent_staff_audit_log_mutation();

-- -----------------------------------------------------------------------------
-- 2. SELLER BRAND PROFILE & PRIVATE BUSINESS VERIFICATION EXTENSION
-- -----------------------------------------------------------------------------

ALTER TABLE public.sellers
  ADD COLUMN IF NOT EXISTS brand_name text,
  ADD COLUMN IF NOT EXISTS trade_name text,
  ADD COLUMN IF NOT EXISTS primary_category text DEFAULT 'crafts',
  ADD COLUMN IF NOT EXISTS secondary_categories text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS origin_village text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS legal_business_name text,
  ADD COLUMN IF NOT EXISTS business_constitution text DEFAULT 'individual_artisan',
  ADD COLUMN IF NOT EXISTS tax_registration_status text DEFAULT 'gst_exempt_artisan',
  ADD COLUMN IF NOT EXISTS gstin text,
  ADD COLUMN IF NOT EXISTS gstin_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS registration_number text,
  ADD COLUMN IF NOT EXISTS pan_or_tax_reference text,
  ADD COLUMN IF NOT EXISTS registered_address text,
  ADD COLUMN IF NOT EXISTS dispatch_address text,
  ADD COLUMN IF NOT EXISTS workshop_address text,
  ADD COLUMN IF NOT EXISTS business_contact_name text,
  ADD COLUMN IF NOT EXISTS business_contact_phone text,
  ADD COLUMN IF NOT EXISTS authorized_representative_name text,
  ADD COLUMN IF NOT EXISTS authorized_representative_role text,
  ADD COLUMN IF NOT EXISTS fssai_number text,
  ADD COLUMN IF NOT EXISTS ayush_or_organic_cert_number text,
  ADD COLUMN IF NOT EXISTS legal_metrology_reg_number text,
  ADD COLUMN IF NOT EXISTS bis_certificate_number text,
  ADD COLUMN IF NOT EXISTS trademark_registration_number text,
  ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS verification_notes text,
  ADD COLUMN IF NOT EXISTS verified_by_staff_id text,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;

-- Private Seller Verification Documents (Bucket: seller-verification-docs)
CREATE TABLE IF NOT EXISTS public.seller_verification_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  document_type text NOT NULL,
  document_title text,
  reference_number text,
  storage_bucket text NOT NULL DEFAULT 'seller-verification-docs' CHECK (storage_bucket = 'seller-verification-docs'),
  storage_path text NOT NULL,
  mime_type text NOT NULL CHECK (mime_type IN ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')),
  size_bytes integer CHECK (size_bytes IS NULL OR (size_bytes > 0 AND size_bytes <= 10485760)),
  expires_at date,
  verification_status text NOT NULL DEFAULT 'pending' CHECK (
    verification_status IN ('pending', 'verified', 'rejected', 'expired', 'revision_requested')
  ),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  verified_by_staff_id text,
  reviewer_notes text,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Official GST Portal & Document Verification Checks Log
CREATE TABLE IF NOT EXISTS public.seller_verification_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  check_type text NOT NULL DEFAULT 'gstin_portal_verification',
  gstin text,
  state_code text,
  pan_embedded text,
  legal_name_returned text,
  portal_legal_name text,
  trade_name_returned text,
  portal_trade_name text,
  registration_status text,
  portal_status text,
  name_matches_applicant boolean NOT NULL DEFAULT true,
  verification_result text CHECK (verification_result IS NULL OR verification_result IN ('verified', 'mismatched', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id),
  checked_by_staff_id text,
  supporting_evidence_ref text,
  notes text,
  verification_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Configurable Marketplace Category Licence Requirements Table
CREATE TABLE IF NOT EXISTS public.marketplace_category_requirements (
  category_code text PRIMARY KEY,
  title text NOT NULL,
  required_documents text[] NOT NULL DEFAULT '{}',
  optional_documents text[] NOT NULL DEFAULT '{}',
  regulatory_notes text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.marketplace_category_requirements (category_code, title, required_documents, optional_documents, regulatory_notes)
VALUES
  ('food', 'Culinary, Raw Honey, Preserves & Edible Harvests', ARRAY['maker_identity_document','fssai_certificate','food_product_declaration','craft_provenance_declaration'], ARRAY['gst_certificate','non_gst_declaration','organic_npop_pgs_certificate','lab_test_report'], 'Edible products require valid FSSAI registration/licence and an ingredient/shelf-life declaration.'),
  ('organic', 'Herbal, Wellness, Oils & Certified Organic Produce', ARRAY['maker_identity_document','ayush_or_herbal_compliance','organic_npop_pgs_certificate','lab_test_report'], ARRAY['fssai_certificate','gst_certificate','non_gst_declaration'], 'Products making organic or herbal therapeutic claims require NPOP/PGS-India or AYUSH compliance.'),
  ('textiles', 'Handloom Woollens, Yak & Pashmina Weaves', ARRAY['maker_identity_document','workshop_cooperative_proof','craft_provenance_declaration'], ARRAY['handloom_gi_certificate','non_gst_declaration','gst_certificate','trademark_authorization'], 'Handloom textiles require maker identity and authentic Himalayan loom provenance. Trademark is optional.'),
  ('crafts', 'Traditional Woodcraft, Metalwork & Stone Carving', ARRAY['maker_identity_document','workshop_cooperative_proof','craft_provenance_declaration'], ARRAY['handloom_gi_certificate','non_gst_declaration','gst_certificate'], 'Artisan crafts require workshop proof and sustainable raw material provenance.'),
  ('himalayan', 'High-Altitude Harvests & Botanical Incense', ARRAY['maker_identity_document','workshop_cooperative_proof','craft_provenance_declaration'], ARRAY['legal_metrology_declaration','non_gst_declaration','gst_certificate'], 'Requires high-altitude origin verification and ethical wild-harvesting declaration.'),
  ('lifestyle', 'Packaged Mountain Lifestyle & Retail Goods', ARRAY['maker_identity_document','legal_metrology_declaration','craft_provenance_declaration'], ARRAY['gst_certificate','non_gst_declaration','trademark_authorization'], 'Pre-packaged retail commodities require Legal Metrology packaged-commodity declarations.'),
  ('mandatory_standards', 'Regulated Appliances & Mandatory Standard Goods', ARRAY['maker_identity_document','bis_certificate','legal_metrology_declaration'], ARRAY['gst_certificate','lab_test_report'], 'Items falling under mandatory Indian quality control orders require BIS certification.')
ON CONFLICT (category_code) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 3. NON-RECURSIVE SECURITY DEFINER HELPERS & RESTRICTED FOUNDER PROVISIONING
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_active_staff_for_user(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.staff_profiles sp
    WHERE sp.user_id = p_user_id
      AND sp.status = 'active'
      AND sp.founder_approved = true
      AND sp.founder_approved_at IS NOT NULL
      AND sp.staff_id IS NOT NULL
      AND sp.session_revoked_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.has_staff_permission_for_user(p_user_id uuid, p_perm text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.staff_profiles sp
    WHERE sp.user_id = p_user_id
      AND sp.status = 'active'
      AND sp.founder_approved = true
      AND sp.founder_approved_at IS NOT NULL
      AND sp.staff_id IS NOT NULL
      AND sp.session_revoked_at IS NULL
      AND (
        sp.role_slug = 'founder'
        OR p_perm = ANY(sp.custom_permissions)
        OR EXISTS (
          SELECT 1
          FROM public.staff_role_permissions srp
          WHERE srp.role_slug = sp.role_slug
            AND srp.permission_key = p_perm
        )
        OR EXISTS (
          SELECT 1
          FROM public.staff_permission_assignments spa
          WHERE spa.user_id = p_user_id
            AND spa.permission_key = p_perm
            AND spa.grant_type = 'allow'
            AND spa.is_active = true
        )
      )
      AND NOT (p_perm = ANY(sp.revoked_permissions))
  );
$$;

-- Restricted Founder Account Provisioning Procedure
-- Requirements:
-- 1. Must be executed by the trusted database owner or service_role in Supabase SQL Editor.
-- 2. Strictly verifies that p_user_id exists in auth.users.
-- 3. Strictly verifies that p_official_email matches the registered auth user's email.
-- 4. Never fabricates MFA, signed agreements, verified mobile, or identity documents.
CREATE OR REPLACE FUNCTION public.provision_founder_account(
  p_user_id uuid,
  p_official_email text,
  p_full_legal_name text,
  p_contact_phone text DEFAULT NULL
)
RETURNS public.staff_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_auth_user auth.users%ROWTYPE;
  v_normalized_email text;
  v_row public.staff_profiles;
BEGIN
  -- 1. Strictly verify the user exists in auth.users
  SELECT * INTO v_auth_user
  FROM auth.users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Security Violation: User UUID % does not exist in auth.users.', p_user_id;
  END IF;

  -- 2. Strictly verify the submitted email matches registered Auth email
  v_normalized_email := lower(trim(p_official_email));
  IF lower(trim(COALESCE(v_auth_user.email, ''))) <> v_normalized_email THEN
    RAISE EXCEPTION 'Security Violation: Submitted email % does not match registered Auth email % for user %.',
      v_normalized_email, v_auth_user.email, p_user_id;
  END IF;

  IF trim(COALESCE(p_full_legal_name, '')) = '' THEN
    RAISE EXCEPTION 'Validation Error: Full legal name is required for Founder account provisioning.';
  END IF;

  -- 3. Upsert Founder staff profile with honest, non-fabricated state
  INSERT INTO public.staff_profiles (
    user_id,
    staff_id,
    full_legal_name,
    preferred_name,
    personal_email,
    official_email,
    verified_mobile,
    designation,
    department,
    role_slug,
    employment_category,
    joining_date,
    assigned_responsibilities,
    identity_document_type,
    identity_document_reference,
    privacy_notice_accepted,
    all_agreements_accepted,
    onboarding_completed,
    mfa_enrolled,
    founder_approved,
    founder_approved_by,
    founder_approved_at,
    status
  )
  VALUES (
    p_user_id,
    'UK-STAFF-2026-0001',
    trim(p_full_legal_name),
    trim(p_full_legal_name),
    v_normalized_email,
    v_normalized_email,
    CASE WHEN p_contact_phone IS NOT NULL AND trim(p_contact_phone) <> '' THEN trim(p_contact_phone) ELSE NULL END,
    'Founder & Chief Architect',
    'founder_office',
    'founder',
    'full_time',
    CURRENT_DATE,
    'Full platform governance, staff hiring, security architecture, and ecosystem oversight.',
    NULL,
    NULL,
    false,
    false,
    false,
    false,
    true,
    p_user_id,
    now(),
    'active'
  )
  ON CONFLICT (user_id) DO UPDATE
  SET role_slug = 'founder',
      status = 'active',
      founder_approved = true,
      founder_approved_by = p_user_id,
      founder_approved_at = COALESCE(public.staff_profiles.founder_approved_at, now()),
      updated_at = now()
  RETURNING * INTO v_row;

  -- 4. Synchronize into public.platform_admins for backward compatibility
  INSERT INTO public.platform_admins (user_id, email, role, notes)
  VALUES (p_user_id, v_normalized_email, 'founder', 'Provisioned via owner-restricted provision_founder_account')
  ON CONFLICT (user_id) DO UPDATE
  SET role = 'founder',
      email = EXCLUDED.email;

  RETURN v_row;
END;
$$;

-- Restrict execution privileges:
-- Remove execution rights from PUBLIC, anon, and ordinary authenticated users
REVOKE ALL ON FUNCTION public.provision_founder_account(uuid, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.provision_founder_account(uuid, text, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.provision_founder_account(uuid, text, text, text) FROM authenticated;

-- Grant execution ONLY to service_role (and postgres / database owner)
GRANT EXECUTE ON FUNCTION public.provision_founder_account(uuid, text, text, text) TO service_role;

-- -----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) & PRIVATE STORAGE BUCKET POLICIES
-- -----------------------------------------------------------------------------

ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_permission_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_agreement_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_employment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_dual_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_verification_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_category_requirements ENABLE ROW LEVEL SECURITY;

-- Staff members can read their own staff_profile; Founder/staff with staff.permissions.manage can read all
DROP POLICY IF EXISTS "staff_profiles_self_or_founder_select" ON public.staff_profiles;
CREATE POLICY "staff_profiles_self_or_founder_select"
  ON public.staff_profiles
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.has_staff_permission_for_user(auth.uid(), 'staff.permissions.manage')
    OR public.has_staff_permission_for_user(auth.uid(), 'staff.hire_approve')
  );

-- Sellers can only view and insert their own verification documents; authorised reviewers with seller.verify_documents can read
DROP POLICY IF EXISTS "seller_own_verification_docs_select" ON public.seller_verification_documents;
CREATE POLICY "seller_own_verification_docs_select"
  ON public.seller_verification_documents
  FOR SELECT
  USING (
    auth.uid() = seller_user_id
    OR public.has_staff_permission_for_user(auth.uid(), 'seller.verify_documents')
    OR public.has_staff_permission_for_user(auth.uid(), 'finance.review_agreements')
  );

DROP POLICY IF EXISTS "seller_own_verification_docs_insert" ON public.seller_verification_documents;
CREATE POLICY "seller_own_verification_docs_insert"
  ON public.seller_verification_documents
  FOR INSERT
  WITH CHECK (auth.uid() = seller_user_id);

-- Public read access to category requirements catalog
DROP POLICY IF EXISTS "public_read_category_requirements" ON public.marketplace_category_requirements;
CREATE POLICY "public_read_category_requirements"
  ON public.marketplace_category_requirements
  FOR SELECT
  USING (true);

-- Private Storage Buckets (staff-hr-docs & seller-verification-docs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('staff-hr-docs', 'staff-hr-docs', false, 10485760, ARRAY['application/pdf','image/jpeg','image/png','image/webp']),
  ('seller-verification-docs', 'seller-verification-docs', false, 10485760, ARRAY['application/pdf','image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['application/pdf','image/jpeg','image/png','image/webp'];

COMMIT;
