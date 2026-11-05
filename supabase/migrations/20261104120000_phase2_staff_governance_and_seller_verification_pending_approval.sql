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
  email text,
  phone text,
  address text,
  location text,
  city text,
  state text,
  country text NOT NULL DEFAULT 'India',
  bio text,
  avatar_url text,
  interests text[] NOT NULL DEFAULT '{}',
  mountain_interests text[] NOT NULL DEFAULT '{}',
  contact_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.profiles FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated, service_role;

-- Members can read and update their own full profile (including private phone & email)
DROP POLICY IF EXISTS "profiles_self_select" ON public.profiles;
CREATE POLICY "profiles_self_select"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR public.is_platform_admin()
  );

DROP POLICY IF EXISTS "profiles_self_insert" ON public.profiles;
CREATE POLICY "profiles_self_insert"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
CREATE POLICY "profiles_self_update"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Safe public view exposing only non-sensitive member display fields (never email, phone, or address)
-- Owned by postgres with security_invoker = false so public pages can resolve display names without granting SELECT on public.profiles to anon
CREATE OR REPLACE VIEW public.public_member_profiles
WITH (security_invoker = false) AS
SELECT
  id,
  full_name,
  preferred_name,
  location,
  city,
  state,
  country,
  bio,
  avatar_url,
  interests,
  mountain_interests,
  created_at
FROM public.profiles;

REVOKE ALL ON public.public_member_profiles FROM PUBLIC;
GRANT SELECT ON public.public_member_profiles TO anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 1. INTERNAL STAFF ROLES, PERMISSIONS & PROFILES (Reconciled Contract)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.staff_roles (
  role_slug text PRIMARY KEY,
  role_code text,
  title text NOT NULL,
  department text NOT NULL CHECK (department IN ('founder_office', 'stays', 'products', 'productions', 'community')),
  description text NOT NULL,
  allowed_modules text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.staff_permissions (
  permission_key text PRIMARY KEY,
  permission_code text,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.staff_role_permissions (
  role_slug text NOT NULL REFERENCES public.staff_roles(role_slug) ON DELETE CASCADE,
  permission_key text NOT NULL REFERENCES public.staff_permissions(permission_key) ON DELETE CASCADE,
  PRIMARY KEY (role_slug, permission_key)
);

-- Seed 8 Authoritative Staff Roles
INSERT INTO public.staff_roles (role_slug, role_code, title, department, description, allowed_modules)
VALUES
  ('founder', 'founder', 'Founder / Superadmin', 'founder_office', 'Full platform governance, staff hiring & termination, permission assignment, dual approvals, and full ecosystem oversight.', ARRAY['/admin/dashboard','/admin/staff','/admin/properties','/admin/products','/admin/productions','/admin/community','/admin/users','/admin/settings','/admin/bookings','/admin/audit']),
  ('operations_admin', 'operations_admin', 'Operations Administrator', 'founder_office', 'Coordinates cross-pillar operations and shared operational governance under the Founder Office, without unilateral staff hiring authority.', ARRAY['/admin/dashboard','/admin/properties','/admin/users','/admin/bookings']),
  ('property_reviewer', 'property_reviewer', 'Property & Host Reviewer', 'stays', 'Reviews and moderates homestay listings, staged property changes, and host assignments.', ARRAY['/admin/dashboard','/admin/properties','/admin/users']),
  ('marketplace_reviewer', 'marketplace_reviewer', 'Marketplace & Seller Reviewer', 'products', 'Reviews artisan and seller applications, verifies Indian GSTIN checksums, reviews category licences, and moderates product submissions.', ARRAY['/admin/dashboard','/admin/products']),
  ('productions_editor', 'productions_editor', 'Productions & Collaborations Editor', 'productions', 'Moderates independent filmmaker profiles and documentary proposals for Uttarkunth Productions.', ARRAY['/admin/dashboard','/admin/productions']),
  ('community_manager', 'community_manager', 'Community & Fellowships Manager', 'community', 'Moderates oral history community stories, Living University fellowship applications, and mountain initiatives.', ARRAY['/admin/dashboard','/admin/community']),
  ('support_executive', 'support_executive', 'Support Executive', 'founder_office', 'Handles member assistance and booking inquiries as a centralized shared service. Strictly prohibited from accessing private HR or seller verification documents.', ARRAY['/admin/dashboard','/admin/bookings']),
  ('finance_compliance_reviewer', 'finance_compliance_reviewer', 'Finance, Legal & Compliance Reviewer', 'founder_office', 'Provides centralized finance, legal, and compliance review under Founder Office governance; access remains limited by granular permissions.', ARRAY['/admin/dashboard','/admin/settings','/admin/products','/admin/audit'])
ON CONFLICT (role_slug) DO UPDATE
SET role_code = EXCLUDED.role_code,
    title = EXCLUDED.title,
    department = EXCLUDED.department,
    description = EXCLUDED.description,
    allowed_modules = EXCLUDED.allowed_modules;

-- Seed 18 Granular Staff Permissions
INSERT INTO public.staff_permissions (permission_key, permission_code, description)
VALUES
  ('staff.invite', 'staff.invite', 'Create and cancel single-use staff onboarding invitations'),
  ('staff.hire_approve', 'staff.hire_approve', 'Approve staff onboarding applications and issue UK-STAFF IDs'),
  ('staff.terminate', 'staff.terminate', 'Suspend or terminate staff members and revoke active sessions'),
  ('staff.permissions.manage', 'staff.permissions.manage', 'Assign and modify granular staff permissions and overrides'),
  ('staff.hr_docs.view', 'staff.hr_docs.view', 'View private staff HR and identity documents in staff-hr-docs bucket'),
  ('property.review', 'property.review', 'Review and moderate homestay listings and staged property edits'),
  ('property.assign_host', 'property.assign_host', 'Assign primary hosts and co-hosts to verified properties'),
  ('seller.approve', 'seller.approve', 'Approve, reject, or suspend artisan and seller accounts'),
  ('product.approve', 'product.approve', 'Approve or reject marketplace product submissions'),
  ('seller.verify_documents', 'seller.verify_documents', 'Access private seller verification documents in seller-verification-docs and record GSTIN checks'),
  ('productions.approve_profile', 'productions.approve_profile', 'Approve or reject filmmaker collaboration profiles'),
  ('productions.review_proposal', 'productions.review_proposal', 'Review, moderate, and archive film proposals'),
  ('community.moderate', 'community.moderate', 'Moderate community stories and Himalayan fellowship applications'),
  ('support.manage_tickets', 'support.manage_tickets', 'Supervise bookings and respond to member support inquiries'),
  ('finance.review_agreements', 'finance.review_agreements', 'Review bilateral commercial host agreements and commission records'),
  ('audit.view_full', 'audit.view_full', 'View immutable platform governance and staff audit logs'),
  ('governance.dual_approve', 'governance.dual_approve', 'Participate as a designated second approver for high-risk governance actions'),
  ('compliance.configure_licences', 'compliance.configure_licences', 'Manage category-to-licence requirements matrix')
ON CONFLICT (permission_key) DO UPDATE
SET permission_code = EXCLUDED.permission_code,
    description = EXCLUDED.description;

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
  department text NOT NULL CHECK (department IN ('founder_office', 'stays', 'products', 'productions', 'community')),
  proposed_designation text NOT NULL,
  designation text,
  role_slug text NOT NULL REFERENCES public.staff_roles(role_slug),
  role_code text,
  initial_permissions text[] NOT NULL DEFAULT '{}',
  employment_category text NOT NULL DEFAULT 'full_time' CHECK (
    employment_category IN (
      'full_time',
      'part_time',
      'contractor',
      'advisor',
      'fellow',
      'intern',
      'full_time_employee',
      'part_time_employee',
      'fixed_term_contractor',
      'independent_consultant'
    )
  ),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'used', 'expired', 'cancelled', 'withdrawn')),
  expires_at timestamptz NOT NULL,
  invited_by uuid REFERENCES auth.users(id),
  invited_by_user_id uuid REFERENCES auth.users(id),
  invited_by_email text,
  accepted_by uuid REFERENCES auth.users(id),
  accepted_at timestamptz,
  used_at timestamptz,
  cancelled_by uuid REFERENCES auth.users(id),
  cancelled_at timestamptz,
  cancel_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger to keep invitation aliases synchronized (designation, role_code, invited_by_user_id, used_at)
CREATE OR REPLACE FUNCTION public.sync_staff_invitation_cols()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.proposed_designation IS NULL AND NEW.designation IS NOT NULL THEN
    NEW.proposed_designation := NEW.designation;
  ELSIF NEW.designation IS NULL AND NEW.proposed_designation IS NOT NULL THEN
    NEW.designation := NEW.proposed_designation;
  END IF;

  IF NEW.role_slug IS NULL AND NEW.role_code IS NOT NULL THEN
    NEW.role_slug := NEW.role_code;
  ELSIF NEW.role_code IS NULL AND NEW.role_slug IS NOT NULL THEN
    NEW.role_code := NEW.role_slug;
  END IF;

  IF NEW.invited_by IS NULL AND NEW.invited_by_user_id IS NOT NULL THEN
    NEW.invited_by := NEW.invited_by_user_id;
  ELSIF NEW.invited_by_user_id IS NULL AND NEW.invited_by IS NOT NULL THEN
    NEW.invited_by_user_id := NEW.invited_by;
  END IF;

  IF NEW.accepted_at IS NOT NULL AND NEW.used_at IS NULL THEN
    NEW.used_at := NEW.accepted_at;
  ELSIF NEW.used_at IS NOT NULL AND NEW.accepted_at IS NULL THEN
    NEW.accepted_at := NEW.used_at;
  END IF;

  IF (NEW.accepted_at IS NOT NULL OR NEW.used_at IS NOT NULL) AND NEW.status = 'pending' THEN
    NEW.status := 'accepted';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_staff_invitation_cols ON public.staff_invitations;
CREATE TRIGGER trg_sync_staff_invitation_cols
BEFORE INSERT OR UPDATE ON public.staff_invitations
FOR EACH ROW EXECUTE FUNCTION public.sync_staff_invitation_cols();

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
  department text NOT NULL CHECK (department IN ('founder_office', 'stays', 'products', 'productions', 'community')),
  role_slug text NOT NULL REFERENCES public.staff_roles(role_slug),
  role_code text,
  custom_permissions text[] NOT NULL DEFAULT '{}',
  revoked_permissions text[] NOT NULL DEFAULT '{}',
  resource_scope text[] NOT NULL DEFAULT '{}',
  region_scope text[] NOT NULL DEFAULT '{}',
  employment_category text NOT NULL DEFAULT 'full_time' CHECK (
    employment_category IN (
      'full_time',
      'part_time',
      'contractor',
      'advisor',
      'fellow',
      'intern',
      'full_time_employee',
      'part_time_employee',
      'fixed_term_contractor',
      'independent_consultant'
    )
  ),
  joining_date date NOT NULL DEFAULT CURRENT_DATE,
  previous_experience text,
  professional_qualifications text,
  reporting_manager text,
  assigned_responsibilities text,
  identity_document_type text CHECK (
    identity_document_type IS NULL OR identity_document_type IN (
      'passport',
      'voter_id',
      'driving_licence',
      'pan',
      'pan_card',
      'aadhaar_last4',
      'aadhaar_redacted',
      'government_id',
      'other_gov_id',
      'other_government_id',
      'other'
    )
  ),
  identity_document_reference text,
  identity_document_ref text,
  identity_document_number_masked text,
  privacy_notice_accepted boolean NOT NULL DEFAULT false,
  privacy_notice_accepted_at timestamptz,
  all_agreements_accepted boolean NOT NULL DEFAULT false,
  agreements_completed boolean NOT NULL DEFAULT false,
  onboarding_completed boolean NOT NULL DEFAULT false,
  mfa_enrolled boolean NOT NULL DEFAULT false,
  founder_approved boolean NOT NULL DEFAULT false,
  founder_approved_by uuid REFERENCES auth.users(id),
  founder_approved_at timestamptz,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  moderation_notes text,
  rejection_reason text,
  status text NOT NULL DEFAULT 'pending_founder_approval' CHECK (
    status IN (
      'invited',
      'onboarding_in_progress',
      'pending_founder_approval',
      'info_requested',
      'under_review',
      'active',
      'suspended',
      'terminated',
      'rejected',
      'archived'
    )
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

-- Trigger to keep staff_profiles column aliases synchronized
CREATE OR REPLACE FUNCTION public.sync_staff_profile_cols()
RETURNS trigger
LANGUAGE plpgsql
AS $$
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

  IF NEW.all_agreements_accepted = true AND NEW.agreements_completed = false THEN
    NEW.agreements_completed := true;
  ELSIF NEW.agreements_completed = true AND NEW.all_agreements_accepted = false THEN
    NEW.all_agreements_accepted := true;
  END IF;

  IF NEW.privacy_notice_accepted = true AND NEW.privacy_notice_accepted_at IS NULL THEN
    NEW.privacy_notice_accepted_at := now();
  ELSIF NEW.privacy_notice_accepted_at IS NOT NULL AND NEW.privacy_notice_accepted = false THEN
    NEW.privacy_notice_accepted := true;
  END IF;

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
  ELSIF NEW.founder_approved = true AND NEW.founder_approved_at IS NULL THEN
    NEW.founder_approved_at := now();
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_staff_profile_cols ON public.staff_profiles;
CREATE TRIGGER trg_sync_staff_profile_cols
BEFORE INSERT OR UPDATE ON public.staff_profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_staff_profile_cols();

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
  permission_code text,
  grant_type text NOT NULL DEFAULT 'allow' CHECK (grant_type IN ('allow', 'grant', 'revoke')),
  is_active boolean NOT NULL DEFAULT true,
  granted_by uuid REFERENCES auth.users(id),
  reason text,
  expires_at timestamptz,
  revoked_at timestamptz,
  granted_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_staff_permission_profile_key UNIQUE (staff_profile_id, permission_key),
  CONSTRAINT uq_staff_permission_user_key UNIQUE (user_id, permission_key)
);

-- Trigger to synchronize permission_code and handle revocation state
CREATE OR REPLACE FUNCTION public.sync_staff_permission_cols()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.permission_key IS NULL AND NEW.permission_code IS NOT NULL THEN
    NEW.permission_key := NEW.permission_code;
  ELSIF NEW.permission_code IS NULL AND NEW.permission_key IS NOT NULL THEN
    NEW.permission_code := NEW.permission_key;
  END IF;

  IF NEW.revoked_at IS NOT NULL THEN
    NEW.grant_type := 'revoke';
    NEW.is_active := false;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_staff_permission_cols ON public.staff_permission_assignments;
CREATE TRIGGER trg_sync_staff_permission_cols
BEFORE INSERT OR UPDATE ON public.staff_permission_assignments
FOR EACH ROW EXECUTE FUNCTION public.sync_staff_permission_cols();

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
  file_size_bytes integer,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.sync_staff_doc_size()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.size_bytes IS NULL AND NEW.file_size_bytes IS NOT NULL THEN
    NEW.size_bytes := NEW.file_size_bytes;
  ELSIF NEW.file_size_bytes IS NULL AND NEW.size_bytes IS NOT NULL THEN
    NEW.file_size_bytes := NEW.size_bytes;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_staff_doc_size ON public.staff_documents;
CREATE TRIGGER trg_sync_staff_doc_size
BEFORE INSERT OR UPDATE ON public.staff_documents
FOR EACH ROW EXECUTE FUNCTION public.sync_staff_doc_size();

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
  staff_user_id uuid REFERENCES auth.users(id),
  agreement_code text NOT NULL,
  agreement_type text,
  agreement_title text,
  version text NOT NULL DEFAULT '2026.1',
  agreement_version text,
  document_hash text NOT NULL,
  accepted boolean NOT NULL DEFAULT true,
  approval_status text NOT NULL DEFAULT 'accepted' CHECK (approval_status IN ('accepted', 'revoked')),
  accepted_ip text,
  ip_address text,
  user_agent text,
  signed_document_ref text,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_staff_agreement_acceptance UNIQUE (user_id, agreement_code)
);

CREATE OR REPLACE FUNCTION public.sync_staff_agreement_cols()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.agreement_code IS NULL AND NEW.agreement_type IS NOT NULL THEN
    NEW.agreement_code := NEW.agreement_type;
  ELSIF NEW.agreement_type IS NULL AND NEW.agreement_code IS NOT NULL THEN
    NEW.agreement_type := NEW.agreement_code;
  END IF;

  IF NEW.user_id IS NULL AND NEW.staff_user_id IS NOT NULL THEN
    NEW.user_id := NEW.staff_user_id;
  ELSIF NEW.staff_user_id IS NULL AND NEW.user_id IS NOT NULL THEN
    NEW.staff_user_id := NEW.user_id;
  END IF;

  IF NEW.accepted_ip IS NULL AND NEW.ip_address IS NOT NULL THEN
    NEW.accepted_ip := NEW.ip_address;
  ELSIF NEW.ip_address IS NULL AND NEW.accepted_ip IS NOT NULL THEN
    NEW.ip_address := NEW.accepted_ip;
  END IF;

  IF NEW.version IS NULL AND NEW.agreement_version IS NOT NULL THEN
    NEW.version := NEW.agreement_version;
  ELSIF NEW.agreement_version IS NULL AND NEW.version IS NOT NULL THEN
    NEW.agreement_version := NEW.version;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_staff_agreement_cols ON public.staff_agreement_acceptances;
CREATE TRIGGER trg_sync_staff_agreement_cols
BEFORE INSERT OR UPDATE ON public.staff_agreement_acceptances
FOR EACH ROW EXECUTE FUNCTION public.sync_staff_agreement_cols();

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
      'destructive_published_record_action',
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
  requested_by_user_id uuid REFERENCES auth.users(id),
  requested_by_staff_id text,
  requested_by_email text,
  reason text NOT NULL,
  justification text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'rejected', 'executed', 'expired')
  ),
  second_approver_id uuid REFERENCES auth.users(id),
  approved_by uuid REFERENCES auth.users(id),
  approved_by_user_id uuid REFERENCES auth.users(id),
  second_approver_staff_id text,
  decision_notes text,
  reviewer_notes text,
  decided_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.sync_dual_approval_cols()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.requested_by IS NULL AND NEW.requested_by_user_id IS NOT NULL THEN
    NEW.requested_by := NEW.requested_by_user_id;
  ELSIF NEW.requested_by_user_id IS NULL AND NEW.requested_by IS NOT NULL THEN
    NEW.requested_by_user_id := NEW.requested_by;
  END IF;

  IF NEW.reason IS NULL AND NEW.justification IS NOT NULL THEN
    NEW.reason := NEW.justification;
  ELSIF NEW.justification IS NULL AND NEW.reason IS NOT NULL THEN
    NEW.justification := NEW.reason;
  END IF;

  IF NEW.second_approver_id IS NOT NULL THEN
    NEW.approved_by := NEW.second_approver_id;
    NEW.approved_by_user_id := NEW.second_approver_id;
  ELSIF NEW.approved_by IS NOT NULL THEN
    NEW.second_approver_id := NEW.approved_by;
    NEW.approved_by_user_id := NEW.approved_by;
  END IF;

  IF NEW.decision_notes IS NULL AND NEW.reviewer_notes IS NOT NULL THEN
    NEW.decision_notes := NEW.reviewer_notes;
  ELSIF NEW.reviewer_notes IS NULL AND NEW.decision_notes IS NOT NULL THEN
    NEW.reviewer_notes := NEW.decision_notes;
  END IF;

  IF NEW.decided_at IS NOT NULL AND NEW.approved_at IS NULL THEN
    NEW.approved_at := NEW.decided_at;
  ELSIF NEW.approved_at IS NOT NULL AND NEW.decided_at IS NULL THEN
    NEW.decided_at := NEW.approved_at;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_dual_approval_cols ON public.staff_dual_approvals;
CREATE TRIGGER trg_sync_dual_approval_cols
BEFORE INSERT OR UPDATE ON public.staff_dual_approvals
FOR EACH ROW EXECUTE FUNCTION public.sync_dual_approval_cols();

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
  target_user_id uuid REFERENCES auth.users(id),
  target_staff_id text,
  result text NOT NULL DEFAULT 'success',
  reason text,
  before_state jsonb,
  after_state jsonb,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tamper-proof trigger preventing UPDATE or DELETE on audit logs
CREATE OR REPLACE FUNCTION public.prevent_staff_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Append-only audit trail violation: staff_audit_log entries cannot be updated or deleted.';
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_staff_audit_log_mutation ON public.staff_audit_log;
CREATE TRIGGER trg_prevent_staff_audit_log_mutation
BEFORE UPDATE OR DELETE ON public.staff_audit_log
FOR EACH ROW EXECUTE FUNCTION public.prevent_staff_audit_log_mutation();

-- -----------------------------------------------------------------------------
-- 2. SELLER BRAND & PRIVATE BUSINESS VERIFICATION TABLES (Reconciled Contract)
-- -----------------------------------------------------------------------------

-- Add additive seller compliance columns to public.sellers if missing
ALTER TABLE public.sellers
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS constitution text DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS business_constitution text DEFAULT 'individual_artisan',
  ADD COLUMN IF NOT EXISTS legal_business_name text,
  ADD COLUMN IF NOT EXISTS trade_name text,
  ADD COLUMN IF NOT EXISTS primary_category text DEFAULT 'crafts',
  ADD COLUMN IF NOT EXISTS secondary_categories text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS registered_address text,
  ADD COLUMN IF NOT EXISTS dispatch_address text,
  ADD COLUMN IF NOT EXISTS business_contact_name text,
  ADD COLUMN IF NOT EXISTS business_contact_phone text,
  ADD COLUMN IF NOT EXISTS tax_registration_status text DEFAULT 'gst_exempt_artisan',
  ADD COLUMN IF NOT EXISTS gstin text,
  ADD COLUMN IF NOT EXISTS gstin_status text DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS registration_number text,
  ADD COLUMN IF NOT EXISTS authorized_representative_name text,
  ADD COLUMN IF NOT EXISTS authorized_representative_role text,
  ADD COLUMN IF NOT EXISTS pan text,
  ADD COLUMN IF NOT EXISTS fssai_licence_number text,
  ADD COLUMN IF NOT EXISTS ayush_licence_number text,
  ADD COLUMN IF NOT EXISTS handloom_mark_number text,
  ADD COLUMN IF NOT EXISTS craft_gi_number text,
  ADD COLUMN IF NOT EXISTS organic_npop_pgs_number text,
  ADD COLUMN IF NOT EXISTS legal_metrology_number text,
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
  document_reference_number text,
  storage_bucket text NOT NULL DEFAULT 'seller-verification-docs' CHECK (storage_bucket = 'seller-verification-docs'),
  storage_path text NOT NULL,
  mime_type text NOT NULL CHECK (mime_type IN ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')),
  size_bytes integer CHECK (size_bytes IS NULL OR (size_bytes > 0 AND size_bytes <= 10485760)),
  file_size_bytes integer,
  expires_at date,
  expiry_date date,
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

CREATE OR REPLACE FUNCTION public.sync_seller_doc_size()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.size_bytes IS NULL AND NEW.file_size_bytes IS NOT NULL THEN
    NEW.size_bytes := NEW.file_size_bytes;
  ELSIF NEW.file_size_bytes IS NULL AND NEW.size_bytes IS NOT NULL THEN
    NEW.file_size_bytes := NEW.size_bytes;
  END IF;

  IF NEW.reference_number IS NULL AND NEW.document_reference_number IS NOT NULL THEN
    NEW.reference_number := NEW.document_reference_number;
  ELSIF NEW.document_reference_number IS NULL AND NEW.reference_number IS NOT NULL THEN
    NEW.document_reference_number := NEW.reference_number;
  END IF;

  IF NEW.expires_at IS NULL AND NEW.expiry_date IS NOT NULL THEN
    NEW.expires_at := NEW.expiry_date;
  ELSIF NEW.expiry_date IS NULL AND NEW.expires_at IS NOT NULL THEN
    NEW.expiry_date := NEW.expires_at;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_seller_doc_size ON public.seller_verification_documents;
CREATE TRIGGER trg_sync_seller_doc_size
BEFORE INSERT OR UPDATE ON public.seller_verification_documents
FOR EACH ROW EXECUTE FUNCTION public.sync_seller_doc_size();

-- Official GST Portal & Document Verification Checks Log (Explicitly marked as manual review)
CREATE TABLE IF NOT EXISTS public.seller_verification_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  check_type text NOT NULL DEFAULT 'manual_official_portal_review',
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
  reviewer_user_id uuid REFERENCES auth.users(id),
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
  ('himalayan', 'High-Altitude Harvests & Botanical Incense', ARRAY['maker_identity_document','workshop_cooperative_proof','craft_provenance_declaration'], ARRAY['legal_metrology_declaration','non_gst_declaration','gst_certificate'], 'Requires high-altitude origin verification and ethical wild-harvesting declaration.')
ON CONFLICT (category_code) DO UPDATE
SET title = EXCLUDED.title,
    required_documents = EXCLUDED.required_documents,
    optional_documents = EXCLUDED.optional_documents,
    regulatory_notes = EXCLUDED.regulatory_notes,
    updated_at = now();

-- -----------------------------------------------------------------------------
-- 3. NON-RECURSIVE SECURITY DEFINER HELPERS & RESTRICTED FOUNDER PROVISIONING
-- -----------------------------------------------------------------------------

-- Helper 1: Returns true if user is active staff
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

-- Helper 2: Returns true if user has specific staff permission
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
          WHERE (spa.staff_profile_id = sp.id OR spa.user_id = p_user_id)
            AND spa.permission_key = p_perm
            AND spa.grant_type = 'allow'
            AND spa.is_active = true
            AND spa.revoked_at IS NULL
        )
      )
      AND NOT (p_perm = ANY(sp.revoked_permissions))
  );
$$;

-- Restricted Founder Account Provisioning Procedure
-- Requirements:
-- 1. Must be executed by the trusted database owner or service_role in Supabase SQL Editor.
-- 2. Strictly verifies that p_user_id exists in auth.users and email_confirmed_at IS NOT NULL.
-- 3. Strictly verifies that p_official_email matches the registered auth user's email.
-- 4. Prevents duplicate Founder accounts across staff_profiles and platform_admins.
-- 5. Never fabricates MFA, signed agreements, verified mobile, or identity documents.
-- 6. Does NOT reference platform_admins.notes (column does not exist in production).
-- Confirmed Production Founder Identity:
--   Email: uttarkunth@gmail.com
--   Auth UUID: 28ba1250-9e0c-4daf-9348-0484175646ba
--   Designation: Founder & Chief Executive
--   Staff ID: UK-STAFF-2026-0001
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
  v_existing_founder_uid uuid;
  v_row public.staff_profiles;
BEGIN
  -- 1. Strictly verify the user exists in auth.users
  SELECT * INTO v_auth_user
  FROM auth.users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Security Violation: User UUID % does not exist in auth.users.', p_user_id;
  END IF;

  -- 1b. Strictly verify the account email is confirmed in Supabase Auth
  IF v_auth_user.email_confirmed_at IS NULL THEN
    RAISE EXCEPTION 'Security Violation: Auth account % (%) has not confirmed its email address.',
      p_user_id, v_auth_user.email;
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

  -- 2b. Prevent duplicate Founder accounts (only one UUID may hold UK-STAFF-2026-0001 / founder role)
  SELECT sp.user_id INTO v_existing_founder_uid
  FROM public.staff_profiles sp
  WHERE (sp.role_slug = 'founder' OR sp.staff_id = 'UK-STAFF-2026-0001')
    AND sp.user_id <> p_user_id
  LIMIT 1;

  IF v_existing_founder_uid IS NOT NULL THEN
    RAISE EXCEPTION 'Security Violation: A Founder account already exists for user_id %. Duplicate Founder provisioning is forbidden.',
      v_existing_founder_uid;
  END IF;

  -- 3. Upsert Founder staff profile anchored to p_user_id with honest, non-fabricated state
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
    role_code,
    employment_category,
    joining_date,
    assigned_responsibilities,
    identity_document_type,
    identity_document_reference,
    privacy_notice_accepted,
    all_agreements_accepted,
    agreements_completed,
    onboarding_completed,
    mfa_enrolled,
    founder_approved,
    founder_approved_by,
    founder_approved_at,
    approved_by,
    approved_at,
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
    'Founder & Chief Executive',
    'founder_office',
    'founder',
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
    false,
    true,
    p_user_id,
    now(),
    p_user_id,
    now(),
    'active'
  )
  ON CONFLICT (user_id) DO UPDATE
  SET designation = 'Founder & Chief Executive',
      role_slug = 'founder',
      role_code = 'founder',
      official_email = EXCLUDED.official_email,
      personal_email = EXCLUDED.personal_email,
      status = 'active',
      -- Preserve the existing consent/onboarding state; this function must never fabricate acceptance.
      founder_approved = true,
      founder_approved_by = p_user_id,
      founder_approved_at = COALESCE(public.staff_profiles.founder_approved_at, now()),
      approved_by = p_user_id,
      approved_at = COALESCE(public.staff_profiles.approved_at, now()),
      updated_at = now()
  RETURNING * INTO v_row;

  -- 4. Synchronize into public.platform_admins for backward compatibility (WITHOUT notes column)
  INSERT INTO public.platform_admins (user_id, email, role)
  VALUES (p_user_id, v_normalized_email, 'founder')
  ON CONFLICT (user_id) DO UPDATE
  SET role = 'founder',
      email = EXCLUDED.email;

  -- 5. Record immutable audit entry in staff_audit_log
  INSERT INTO public.staff_audit_log (
    actor_user_id,
    actor_staff_id,
    actor_role,
    action,
    target_type,
    target_id,
    target_user_id,
    target_staff_id,
    result,
    reason,
    after_state
  )
  VALUES (
    p_user_id,
    'UK-STAFF-2026-0001',
    'founder',
    'founder_account_provisioned',
    'staff_profile',
    v_row.id::text,
    p_user_id,
    'UK-STAFF-2026-0001',
    'allowed',
    'One-time verified Founder account provisioning anchored to Supabase Auth UUID.',
    jsonb_build_object(
      'user_id', p_user_id,
      'official_email', v_normalized_email,
      'staff_id', 'UK-STAFF-2026-0001',
      'designation', 'Founder & Chief Executive',
      'role_slug', 'founder'
    )
  );

  RETURN v_row;
END;
$$;

-- Synchronize informational email fields when a user (including Founder/Staff) confirms a new email in Supabase Auth.
-- Security invariant: Permissions remain strictly anchored to user_id (UUID). Changing email never resets permissions
-- or allows another user to claim Founder/Staff status using the old email address.
CREATE OR REPLACE FUNCTION public.sync_auth_user_email_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_new_email text;
  v_old_email text;
  v_staff public.staff_profiles%ROWTYPE;
BEGIN
  v_new_email := lower(trim(COALESCE(NEW.email, '')));
  v_old_email := lower(trim(COALESCE(OLD.email, '')));

  IF v_new_email = '' OR v_new_email = v_old_email THEN
    RETURN NEW;
  END IF;

  -- 1. Synchronize public.profiles informational email
  UPDATE public.profiles
  SET email = v_new_email,
      updated_at = now()
  WHERE id = NEW.id;

  -- 2. Synchronize public.platform_admins informational email (anchored by user_id)
  UPDATE public.platform_admins
  SET email = v_new_email
  WHERE user_id = NEW.id;

  -- 3. Synchronize public.staff_profiles informational email (anchored by user_id) and audit
  SELECT * INTO v_staff
  FROM public.staff_profiles
  WHERE user_id = NEW.id;

  IF FOUND THEN
    UPDATE public.staff_profiles
    SET official_email = v_new_email,
        personal_email = v_new_email,
        updated_at = now()
    WHERE user_id = NEW.id;

    INSERT INTO public.staff_audit_log (
      actor_user_id,
      actor_staff_id,
      actor_role,
      action,
      target_type,
      target_id,
      target_user_id,
      target_staff_id,
      result,
      reason,
      before_state,
      after_state
    )
    VALUES (
      NEW.id,
      v_staff.staff_id,
      v_staff.role_slug,
      'staff_auth_email_changed',
      'staff_profile',
      v_staff.id::text,
      NEW.id,
      v_staff.staff_id,
      'allowed',
      'Supabase Auth confirmed email change synchronized by UUID.',
      jsonb_build_object('email', v_old_email),
      jsonb_build_object('email', v_new_email)
    );
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_auth_user_email_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_sync_auth_user_email_change ON auth.users;
CREATE TRIGGER trg_sync_auth_user_email_change
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_auth_user_email_change();

-- Restrict execution privileges on provision_founder_account:
REVOKE ALL ON FUNCTION public.provision_founder_account(uuid, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.provision_founder_account(uuid, text, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.provision_founder_account(uuid, text, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.provision_founder_account(uuid, text, text, text) TO service_role;

-- Restrict helper function privileges:
REVOKE ALL ON FUNCTION public.is_active_staff_for_user(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_active_staff_for_user(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_active_staff_for_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_staff_for_user(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.has_staff_permission_for_user(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_staff_permission_for_user(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_staff_permission_for_user(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_staff_permission_for_user(uuid, text) TO service_role;

REVOKE ALL ON FUNCTION public.prevent_staff_id_mutation() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.prevent_staff_id_mutation() FROM anon;
REVOKE ALL ON FUNCTION public.prevent_staff_id_mutation() FROM authenticated;

REVOKE ALL ON FUNCTION public.prevent_staff_audit_log_mutation() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.prevent_staff_audit_log_mutation() FROM anon;
REVOKE ALL ON FUNCTION public.prevent_staff_audit_log_mutation() FROM authenticated;

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

-- Catalog tables read policies
DROP POLICY IF EXISTS "authenticated_read_staff_roles" ON public.staff_roles;
CREATE POLICY "authenticated_read_staff_roles"
  ON public.staff_roles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_read_staff_permissions" ON public.staff_permissions;
CREATE POLICY "authenticated_read_staff_permissions"
  ON public.staff_permissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_read_staff_role_permissions" ON public.staff_role_permissions;
CREATE POLICY "authenticated_read_staff_role_permissions"
  ON public.staff_role_permissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_read_staff_agreements" ON public.staff_agreements;
CREATE POLICY "authenticated_read_staff_agreements"
  ON public.staff_agreements FOR SELECT TO authenticated USING (true);

-- Staff profiles: read own profile or with staff.permissions.manage / staff.hire_approve
DROP POLICY IF EXISTS "staff_profiles_self_or_founder_select" ON public.staff_profiles;
CREATE POLICY "staff_profiles_self_or_founder_select"
  ON public.staff_profiles
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.has_staff_permission_for_user(auth.uid(), 'staff.permissions.manage')
    OR public.has_staff_permission_for_user(auth.uid(), 'staff.hire_approve')
  );

-- Staff agreement acceptances: read own acceptances or staff.hr_docs.view
DROP POLICY IF EXISTS "staff_agreements_self_or_reviewer_select" ON public.staff_agreement_acceptances;
CREATE POLICY "staff_agreements_self_or_reviewer_select"
  ON public.staff_agreement_acceptances
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.has_staff_permission_for_user(auth.uid(), 'staff.hr_docs.view')
    OR public.has_staff_permission_for_user(auth.uid(), 'staff.hire_approve')
  );

-- Sellers can only view and insert their own verification documents; authorised reviewers can read
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

-- Explicitly revoke public and anonymous access to internal governance tables
REVOKE ALL ON TABLE public.staff_invitations FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.staff_permission_assignments FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.staff_documents FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.staff_employment_history FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.staff_dual_approvals FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.staff_audit_log FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.seller_verification_checks FROM PUBLIC, anon;

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
