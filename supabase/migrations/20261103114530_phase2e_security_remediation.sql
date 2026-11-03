-- ==============================================================================
-- UTTARKUNTH — PHASE 2E: AGREEMENTS, AUDIT LOG & SNAPSHOT IMMUTABILITY REMEDIATION
-- Target: Remote Supabase uttarkunth-stays (xyplgugxpmlnjsvlosdg)
-- ==============================================================================
BEGIN;

-- 8. ADMIN AUDIT LOG APPEND-ONLY INTEGRITY (EXPLICIT INSERT REVOCATION & MUTATION TRIGGERS)
-- ------------------------------------------------------------------------------
-- Revoke all modifications (INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES) from client roles
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON TABLE public.admin_audit_log FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON TABLE public.admin_audit_log FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON TABLE public.admin_audit_log FROM PUBLIC;

-- Revoke mutation/tampering privileges from service_role; preserve only SELECT and INSERT
REVOKE UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON TABLE public.admin_audit_log FROM service_role;
GRANT SELECT, INSERT ON TABLE public.admin_audit_log TO service_role;

CREATE OR REPLACE FUNCTION public.prevent_audit_log_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RAISE EXCEPTION 'admin_audit_log is append-only. % operations are strictly prohibited.', TG_OP
    USING ERRCODE = '55000'; -- object_not_modifiable
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_audit_log_row_mutation ON public.admin_audit_log;
CREATE TRIGGER trg_prevent_audit_log_row_mutation
BEFORE UPDATE OR DELETE ON public.admin_audit_log
FOR EACH ROW
EXECUTE FUNCTION public.prevent_audit_log_mutation();

DROP TRIGGER IF EXISTS trg_prevent_audit_log_truncate ON public.admin_audit_log;
CREATE TRIGGER trg_prevent_audit_log_truncate
BEFORE TRUNCATE ON public.admin_audit_log
FOR EACH STATEMENT
EXECUTE FUNCTION public.prevent_audit_log_mutation();

-- ------------------------------------------------------------------------------
-- 8B. IMMUTABLE LEGAL TERMS REGISTRY (MANDATORY CORRECTION)
-- ------------------------------------------------------------------------------
-- Immutable database-backed registry for official bilateral legal agreement documents.
-- Terms versions and their exact SHA-256 byte digests are registered here and
-- verified during agreement acceptance and canonical digest calculation.
CREATE TABLE IF NOT EXISTS public.legal_terms_documents (
  version text PRIMARY KEY,
  document_hash text NOT NULL CHECK (document_hash ~ '^[0-9a-f]{64}$'),
  title text NOT NULL,
  effective_date date NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Immutability enforcement trigger: rows cannot be modified or deleted
CREATE OR REPLACE FUNCTION public.enforce_legal_terms_documents_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RAISE EXCEPTION 'Legal terms documents in public.legal_terms_documents are immutable and cannot be modified or deleted (Version: %).', OLD.version
    USING ERRCODE = '55000'; -- object_not_modifiable
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_legal_terms_documents_immutability ON public.legal_terms_documents;
CREATE TRIGGER trg_enforce_legal_terms_documents_immutability
BEFORE UPDATE OR DELETE ON public.legal_terms_documents
FOR EACH ROW
EXECUTE FUNCTION public.enforce_legal_terms_documents_immutability();

-- Statement-level TRUNCATE protection
CREATE OR REPLACE FUNCTION public.prevent_legal_terms_documents_truncate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RAISE EXCEPTION 'TRUNCATE is strictly prohibited on legal_terms_documents to preserve immutable legal terms history.'
    USING ERRCODE = '55000'; -- object_not_modifiable
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_legal_terms_documents_truncate ON public.legal_terms_documents;
CREATE TRIGGER trg_prevent_legal_terms_documents_truncate
BEFORE TRUNCATE ON public.legal_terms_documents
FOR EACH STATEMENT
EXECUTE FUNCTION public.prevent_legal_terms_documents_truncate();

-- Table privileges and Row Level Security
ALTER TABLE public.legal_terms_documents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.legal_terms_documents FROM PUBLIC;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON TABLE public.legal_terms_documents FROM authenticated, anon;
GRANT SELECT ON TABLE public.legal_terms_documents TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Public can view registered legal terms documents" ON public.legal_terms_documents;
CREATE POLICY "Public can view registered legal terms documents"
ON public.legal_terms_documents
FOR SELECT
TO public
USING (true);

-- Commercial terms registration is deliberately deferred for the first production release.
-- In accordance with owner directives:
-- 1. No operative legal terms record is seeded with placeholder or unreviewed content.
-- 2. No automatic 3% or 5% commission rates are activated.
-- 3. In the absence of an approved legal document, host commercial agreements remain strictly
--    draft-only and cannot be accepted (enforce_host_agreement_immutability rejects acceptance).
-- 4. In the absence of an active accepted agreement, platform commission is strictly 0.00%
--    and host payout equals 100.00% of the booking estimate (respond_to_stay_booking).

-- ------------------------------------------------------------------------------
-- 9. HOST COMMERCIAL AGREEMENTS WRITE PATH HARDENING & ACCEPTED-RECORD PROTECTION
-- ------------------------------------------------------------------------------
-- A. Schema extension: add terms_digest, terminated_at, terminated_by, termination_reason
ALTER TABLE public.host_agreements
  ADD COLUMN IF NOT EXISTS terms_digest text,
  ADD COLUMN IF NOT EXISTS terminated_at timestamptz,
  ADD COLUMN IF NOT EXISTS terminated_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS termination_reason text;

ALTER TABLE public.host_agreements
  DROP CONSTRAINT IF EXISTS host_agreements_agreement_status_check;

ALTER TABLE public.host_agreements
  ADD CONSTRAINT host_agreements_agreement_status_check
  CHECK (agreement_status IN ('draft', 'active', 'superseded', 'terminated', 'ended'));

-- B. Revoke direct write privileges from client roles
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON TABLE public.host_agreements FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON TABLE public.host_agreements FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON TABLE public.host_agreements FROM PUBLIC;

-- C. Revoke structural privileges from service_role
REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLE public.host_agreements FROM service_role;

-- D. Explicit RLS Enabling and Authenticated SELECT Privilege Grant
ALTER TABLE public.host_agreements ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON TABLE public.host_agreements TO authenticated;

-- E. RLS Policy for Authenticated Reading (Hosts can only view their own agreements)
DROP POLICY IF EXISTS "Hosts can view agreements for their properties or where designated" ON public.host_agreements;
CREATE POLICY "Hosts can view agreements for their properties or where designated"
ON public.host_agreements
FOR SELECT
TO authenticated
USING (
  host_user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = host_agreements.property_id
      AND p.host_id = (SELECT auth.uid())
  )
  OR public.is_platform_admin()
);

-- F. Trigger function: Prevent direct creation of agreements in accepted or active state
CREATE OR REPLACE FUNCTION public.enforce_host_agreement_draft_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- New commercial agreements must strictly begin in 'draft' status
  IF NEW.agreement_status IS DISTINCT FROM 'draft' THEN
    RAISE EXCEPTION 'New commercial agreements must be created with draft status (attempted status: %). Direct creation in active or ended status is strictly prohibited.', NEW.agreement_status
      USING ERRCODE = '55000'; -- object_not_modifiable
  END IF;

  -- New agreements cannot be inserted with accepted_at populated
  IF NEW.accepted_at IS NOT NULL THEN
    RAISE EXCEPTION 'New commercial agreements cannot be inserted in an already accepted state. Acceptance must be performed via the authorized bilateral acceptance workflow.'
      USING ERRCODE = '55000'; -- object_not_modifiable
  END IF;

  -- New agreements cannot be inserted with terms_digest pre-populated
  IF NEW.terms_digest IS NOT NULL THEN
    RAISE EXCEPTION 'New commercial agreements cannot have a terms_digest pre-populated upon creation. The digest is generated exclusively upon digital acceptance.'
      USING ERRCODE = '55000'; -- object_not_modifiable
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_host_agreement_draft_on_insert ON public.host_agreements;
CREATE TRIGGER trg_enforce_host_agreement_draft_on_insert
BEFORE INSERT ON public.host_agreements
FOR EACH ROW
EXECUTE FUNCTION public.enforce_host_agreement_draft_on_insert();

-- G. Canonical Host Agreement Digest Calculation Function
-- Unambiguous, stable parameter sequence matching lib/commission.ts strictly.
-- Resolves the registered document hash from public.legal_terms_documents and binds it into the digest.
-- Uses schema-qualified pg_catalog.encode and extensions.digest with safe search_path.
DROP FUNCTION IF EXISTS public.calculate_host_agreement_digest(
  uuid, uuid, uuid, date, date, numeric, numeric, integer, numeric, text
);

CREATE OR REPLACE FUNCTION public.calculate_host_agreement_digest(
  p_agreement_id uuid,
  p_property_id uuid,
  p_signatory_user_id uuid,
  p_agreement_start date,
  p_agreement_end date,
  p_commission_percent numeric,
  p_intro_commission_percent numeric,
  p_intro_period_months integer,
  p_standard_commission_percent numeric,
  p_terms_version text,
  p_document_hash text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path TO ''
AS $$
declare
  v_doc_hash text;
  v_payload text;
begin
  -- Resolve registered legal document digest
  IF p_document_hash IS NOT NULL AND p_document_hash ~ '^[0-9a-f]{64}$' THEN
    v_doc_hash := p_document_hash;
  ELSE
    SELECT document_hash INTO v_doc_hash
    FROM public.legal_terms_documents
    WHERE version = p_terms_version;
  END IF;

  IF v_doc_hash IS NULL OR v_doc_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'A valid registered legal terms document hash is required for terms version "%".', p_terms_version
      USING ERRCODE = '22023';
  END IF;

  -- Strictly sorted alphabetically by parameter key
  v_payload :=
    'agreement_end=' || coalesce(to_char(p_agreement_end, 'YYYY-MM-DD'), 'NONE') ||
    '&agreement_id=' || coalesce(p_agreement_id::text, 'NONE') ||
    '&agreement_start=' || coalesce(to_char(p_agreement_start, 'YYYY-MM-DD'), 'NONE') ||
    '&commission_percent=' || case when p_commission_percent is not null then to_char(p_commission_percent, 'FM999999990.00') else 'NONE' end ||
    '&document_hash=' || v_doc_hash ||
    '&intro_commission_percent=' || case when p_intro_commission_percent is not null then to_char(p_intro_commission_percent, 'FM999999990.00') else 'NONE' end ||
    '&intro_period_months=' || case when p_intro_period_months is not null then p_intro_period_months::text else 'NONE' end ||
    '&property_id=' || coalesce(p_property_id::text, 'NONE') ||
    '&signatory_user_id=' || coalesce(p_signatory_user_id::text, 'NONE') ||
    '&standard_commission_percent=' || case when p_standard_commission_percent is not null then to_char(p_standard_commission_percent, 'FM999999990.00') else 'NONE' end ||
    '&terms_version=' || coalesce(p_terms_version, '');

  return pg_catalog.encode(extensions.digest(v_payload::bytea, 'sha256'), 'hex');
end;
$$;

REVOKE ALL ON FUNCTION public.calculate_host_agreement_digest(
  uuid, uuid, uuid, date, date, numeric, numeric, integer, numeric, text, text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.calculate_host_agreement_digest(
  uuid, uuid, uuid, date, date, numeric, numeric, integer, numeric, text, text
) TO anon, authenticated, service_role;

-- H. Immutability Trigger on Initial Acceptance Transition & Subsequent UPDATEs
CREATE OR REPLACE FUNCTION public.enforce_host_agreement_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
declare
  v_expected_digest text;
  v_is_authorized_signatory boolean := false;
  v_is_authorized_actor boolean := false;
begin
  -- Validate agreement_status value domain
  IF NEW.agreement_status NOT IN ('draft', 'active', 'superseded', 'terminated', 'ended') THEN
    RAISE EXCEPTION 'Invalid agreement_status: %. Must be one of draft, active, superseded, terminated, ended.', NEW.agreement_status
      USING ERRCODE = '22023'; -- invalid_parameter_value
  END IF;

  -- 1. Invariant: Commercial agreements cannot be active without demonstrable host acceptance
  IF NEW.agreement_status = 'active' AND NEW.accepted_at IS NULL THEN
    RAISE EXCEPTION 'Commercial agreements cannot be active without demonstrable host acceptance (accepted_at cannot be null).'
      USING ERRCODE = '55000'; -- object_not_modifiable
  END IF;

  -- 2. Lifecycle State Machine & Transition Rules
  -- A. From 'draft':
  IF OLD.agreement_status = 'draft' THEN
    -- May transition to 'active' ONLY with valid signatory acceptance
    -- May transition to 'terminated' (cancelled draft offer)
    -- May remain in 'draft'
    -- Cannot transition to 'superseded'
    IF NEW.agreement_status = 'superseded' THEN
      RAISE EXCEPTION 'Draft commercial agreements cannot transition directly to superseded (Agreement ID: %).', OLD.id
        USING ERRCODE = '55000';
    END IF;

  -- B. From 'active':
  ELSIF OLD.agreement_status = 'active' THEN
    -- May transition to 'superseded' (replaced by new agreement)
    -- May transition to 'terminated' or 'ended' (formal partnership termination)
    -- May remain in 'active'
    -- Cannot be reverted to 'draft'
    IF NEW.agreement_status = 'draft' THEN
      RAISE EXCEPTION 'Active commercial agreements cannot be reverted to draft status (Agreement ID: %).', OLD.id
        USING ERRCODE = '55000';
    END IF;

    -- Require documented termination evidence, timestamp, actor identity, and non-empty reason
    IF NEW.agreement_status IN ('terminated', 'ended') THEN
      IF NEW.terminated_at IS NULL THEN
        RAISE EXCEPTION 'Active commercial agreements cannot be terminated without a valid terminated_at timestamp (Agreement ID: %).', OLD.id
          USING ERRCODE = '55000';
      END IF;

      IF NEW.terminated_by IS NULL THEN
        RAISE EXCEPTION 'Active commercial agreements cannot be terminated without an authorized actor in terminated_by (Agreement ID: %).', OLD.id
          USING ERRCODE = '55000';
      END IF;

      IF NEW.termination_reason IS NULL OR length(trim(NEW.termination_reason)) < 10 THEN
        RAISE EXCEPTION 'Active commercial agreements cannot be terminated without a documented termination_reason of at least 10 characters (Agreement ID: %).', OLD.id
          USING ERRCODE = '55000';
      END IF;

      IF NEW.notes IS NULL OR (NEW.notes NOT LIKE '%[Terminated:%' AND NEW.notes NOT LIKE '%[Ended:%') THEN
        RAISE EXCEPTION 'Active commercial agreements cannot be terminated without documented termination evidence and audit record in notes (Agreement ID: %).', OLD.id
          USING ERRCODE = '55000';
      END IF;

      -- Verify actor authorization for termination
      SELECT EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id = OLD.property_id
          AND (
            public.is_platform_admin_for_user(NEW.terminated_by)
            OR (p.host_id IS NOT NULL AND p.host_id = NEW.terminated_by)
            OR (OLD.host_user_id IS NOT NULL AND OLD.host_user_id = NEW.terminated_by)
          )
      ) INTO v_is_authorized_actor;

      IF NOT v_is_authorized_actor THEN
        RAISE EXCEPTION 'Unauthorized termination actor: User % is not authorized to terminate commercial agreement %.', NEW.terminated_by, OLD.id
          USING ERRCODE = '42501'; -- insufficient_privilege
      END IF;
    END IF;

  -- C. From 'superseded': terminal state!
  ELSIF OLD.agreement_status = 'superseded' THEN
    IF NEW.agreement_status IS DISTINCT FROM 'superseded' THEN
      RAISE EXCEPTION 'Superseded commercial agreements are in a terminal state and cannot be reactivated or altered (Agreement ID: %). Attempted status: %.', OLD.id, NEW.agreement_status
        USING ERRCODE = '55000';
    END IF;

  -- D. From 'terminated' or 'ended': terminal state!
  ELSIF OLD.agreement_status IN ('terminated', 'ended') THEN
    IF NEW.agreement_status NOT IN ('terminated', 'ended')
       OR OLD.terminated_at IS DISTINCT FROM NEW.terminated_at
       OR OLD.terminated_by IS DISTINCT FROM NEW.terminated_by
       OR OLD.termination_reason IS DISTINCT FROM NEW.termination_reason
       OR OLD.property_id IS DISTINCT FROM NEW.property_id
       OR OLD.agreement_start IS DISTINCT FROM NEW.agreement_start
       OR OLD.agreement_end IS DISTINCT FROM NEW.agreement_end
       OR OLD.commission_percent IS DISTINCT FROM NEW.commission_percent
       OR OLD.standard_commission_percent IS DISTINCT FROM NEW.standard_commission_percent
       OR OLD.intro_commission_percent IS DISTINCT FROM NEW.intro_commission_percent
       OR OLD.intro_period_months IS DISTINCT FROM NEW.intro_period_months
       OR OLD.host_user_id IS DISTINCT FROM NEW.host_user_id
       OR OLD.terms_version IS DISTINCT FROM NEW.terms_version
       OR OLD.terms_digest IS DISTINCT FROM NEW.terms_digest
       OR OLD.accepted_at IS DISTINCT FROM NEW.accepted_at
    THEN
      RAISE EXCEPTION 'Terminated commercial agreements are in an immutable terminal state and cannot be reactivated or altered (Agreement ID: %). Attempted status: %.', OLD.id, NEW.agreement_status
        USING ERRCODE = '55000';
    END IF;
  END IF;

  -- 3. Initial acceptance transition verification:
  -- When transitioning from unaccepted (OLD.accepted_at IS NULL) to accepted (NEW.accepted_at IS NOT NULL):
  IF OLD.accepted_at IS NULL AND NEW.accepted_at IS NOT NULL THEN
    -- A. Agreement status must transition strictly to 'active'
    IF NEW.agreement_status IS DISTINCT FROM 'active' THEN
      RAISE EXCEPTION 'Agreement acceptance must transition agreement_status to active (attempted status: %).', NEW.agreement_status
        USING ERRCODE = '55000';
    END IF;

    -- B. Ensure original commercial terms and base terms_version remain unchanged from draft
    IF OLD.property_id IS DISTINCT FROM NEW.property_id
       OR OLD.agreement_start IS DISTINCT FROM NEW.agreement_start
       OR OLD.agreement_end IS DISTINCT FROM NEW.agreement_end
       OR OLD.commission_percent IS DISTINCT FROM NEW.commission_percent
       OR OLD.standard_commission_percent IS DISTINCT FROM NEW.standard_commission_percent
       OR OLD.intro_commission_percent IS DISTINCT FROM NEW.intro_commission_percent
       OR OLD.intro_period_months IS DISTINCT FROM NEW.intro_period_months
       OR OLD.terms_version IS DISTINCT FROM NEW.terms_version
    THEN
      RAISE EXCEPTION 'Material terms cannot be altered during agreement acceptance (Agreement ID: %). Acceptance must confirm terms as originally drafted.', OLD.id
        USING ERRCODE = '55000';
    END IF;

    -- B2. Verify legal agreement document version mapping against immutable registry:
    IF NEW.terms_version IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.legal_terms_documents
      WHERE version = NEW.terms_version
    ) THEN
      RAISE EXCEPTION 'Agreement acceptance requires a registered legal terms document version (terms_version: %).', NEW.terms_version
        USING ERRCODE = '22023';
    END IF;

    -- C. Signatory authorization verification:
    IF NEW.host_user_id IS NULL THEN
      RAISE EXCEPTION 'Agreement acceptance requires an authorized signatory (host_user_id cannot be null).'
        USING ERRCODE = '55000';
    END IF;

    IF OLD.host_user_id IS NOT NULL AND OLD.host_user_id IS DISTINCT FROM NEW.host_user_id THEN
      RAISE EXCEPTION 'Agreement signatory cannot be transferred during acceptance (Agreement ID: %).', OLD.id
        USING ERRCODE = '55000';
    END IF;

    -- Verify that signatory is authorized for the property:
    --   - If property has an assigned primary host (p.host_id IS NOT NULL):
    --     Signatory must be either primary host (p.host_id) OR an explicitly pre-designated signatory on the draft.
    --   - If property has NO assigned primary host (p.host_id IS NULL, e.g. Yash Home Stay, Wonderway Retreat):
    --     Acceptance strictly requires an explicit, pre-designated signatory assignment on the draft (OLD.host_user_id IS NOT NULL AND NEW.host_user_id = OLD.host_user_id).
    --     Arbitrary self-assignment when OLD.host_user_id IS NULL is strictly prohibited.
    --   - Platform administrators do NOT automatically sign commercial terms.
    --   - Property managers/co-hosts cannot sign without explicit legal signatory designation on the draft.
    SELECT EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = NEW.property_id
        AND (
          (p.host_id IS NOT NULL AND (p.host_id = NEW.host_user_id OR (OLD.host_user_id IS NOT NULL AND OLD.host_user_id = NEW.host_user_id)))
          OR
          (p.host_id IS NULL AND OLD.host_user_id IS NOT NULL AND OLD.host_user_id = NEW.host_user_id)
        )
    ) INTO v_is_authorized_signatory;

    IF NOT v_is_authorized_signatory THEN
      RAISE EXCEPTION 'Unauthorized signatory: User % is not authorized to sign commercial agreements for property %.', NEW.host_user_id, NEW.property_id
        USING ERRCODE = '42501'; -- insufficient_privilege
    END IF;

    -- D. Compute and verify exact canonical terms digest against stored terms
    v_expected_digest := public.calculate_host_agreement_digest(
      NEW.id,
      NEW.property_id,
      NEW.host_user_id,
      NEW.agreement_start,
      NEW.agreement_end,
      NEW.commission_percent,
      NEW.intro_commission_percent,
      NEW.intro_period_months,
      NEW.standard_commission_percent,
      NEW.terms_version
    );

    IF NEW.terms_digest IS NULL OR NEW.terms_digest !~ '^[0-9a-f]{64}$' THEN
      RAISE EXCEPTION 'A valid 64-character lowercase SHA-256 terms digest is required for agreement acceptance.'
        USING ERRCODE = '55000';
    END IF;

    IF NEW.terms_digest IS DISTINCT FROM v_expected_digest THEN
      RAISE EXCEPTION 'Terms digest mismatch: The submitted digest (%) does not match the computed digest of the stored agreement terms (%).',
        NEW.terms_digest, v_expected_digest
        USING ERRCODE = '55000';
    END IF;
  END IF;

  -- 4. Post-acceptance immutability:
  -- Once accepted (OLD.accepted_at IS NOT NULL), material terms, digest, signatory, and acceptance evidence can NEVER be altered.
  IF OLD.accepted_at IS NOT NULL THEN
    IF OLD.property_id IS DISTINCT FROM NEW.property_id
       OR OLD.agreement_start IS DISTINCT FROM NEW.agreement_start
       OR OLD.agreement_end IS DISTINCT FROM NEW.agreement_end
       OR OLD.commission_percent IS DISTINCT FROM NEW.commission_percent
       OR OLD.standard_commission_percent IS DISTINCT FROM NEW.standard_commission_percent
       OR OLD.intro_commission_percent IS DISTINCT FROM NEW.intro_commission_percent
       OR OLD.intro_period_months IS DISTINCT FROM NEW.intro_period_months
       OR OLD.host_user_id IS DISTINCT FROM NEW.host_user_id
       OR OLD.terms_version IS DISTINCT FROM NEW.terms_version
       OR OLD.terms_digest IS DISTINCT FROM NEW.terms_digest
       OR OLD.accepted_at IS DISTINCT FROM NEW.accepted_at
    THEN
      RAISE EXCEPTION 'Material terms of an accepted commercial agreement cannot be altered (Agreement ID: %). A material change requires drafting a new agreement version.', OLD.id
        USING ERRCODE = '55000';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_host_agreement_immutability ON public.host_agreements;
CREATE TRIGGER trg_enforce_host_agreement_immutability
BEFORE UPDATE ON public.host_agreements
FOR EACH ROW
EXECUTE FUNCTION public.enforce_host_agreement_immutability();

-- I. Deletion Protection Trigger (Accepted agreements cannot be deleted; drafts may be cleaned up)
CREATE OR REPLACE FUNCTION public.prevent_accepted_agreement_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF OLD.accepted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Accepted commercial agreements cannot be deleted (Agreement ID: %). To conclude or void an active partnership, set agreement_status to ended.', OLD.id
      USING ERRCODE = '55000'; -- object_not_modifiable
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_accepted_agreement_deletion ON public.host_agreements;
CREATE TRIGGER trg_prevent_accepted_agreement_deletion
BEFORE DELETE ON public.host_agreements
FOR EACH ROW
EXECUTE FUNCTION public.prevent_accepted_agreement_deletion();

-- J. Truncate Protection Trigger on host_agreements
CREATE OR REPLACE FUNCTION public.prevent_host_agreements_truncate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RAISE EXCEPTION 'TRUNCATE is strictly prohibited on host_agreements to preserve commercial audit history and binding partnership records.'
    USING ERRCODE = '55000'; -- object_not_modifiable
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_host_agreements_truncate ON public.host_agreements;
CREATE TRIGGER trg_prevent_host_agreements_truncate
BEFORE TRUNCATE ON public.host_agreements
FOR EACH STATEMENT
EXECUTE FUNCTION public.prevent_host_agreements_truncate();

-- K. Dedicated Stored RPC: terminate_host_agreement
-- Transactional bilateral termination workflow recording immutable timestamp,
-- authorized actor identity, and non-empty termination grounds.
CREATE OR REPLACE FUNCTION public.terminate_host_agreement(
  p_agreement_id uuid,
  p_actor_user_id uuid,
  p_termination_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
declare
  v_agreement record;
  v_is_authorized boolean := false;
  v_term_timestamp timestamptz := now();
  v_clean_reason text;
begin
  IF p_agreement_id IS NULL OR p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'Agreement ID and Actor User ID are required.' USING ERRCODE = '22023';
  END IF;

  v_clean_reason := trim(coalesce(p_termination_reason, ''));
  IF length(v_clean_reason) < 10 THEN
    RAISE EXCEPTION 'Termination reason must be at least 10 characters detailing bilateral termination grounds.' USING ERRCODE = '22023';
  END IF;

  -- Lock agreement row
  SELECT * INTO v_agreement
  FROM public.host_agreements
  WHERE id = p_agreement_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Host agreement not found (ID: %).', p_agreement_id USING ERRCODE = '02000';
  END IF;

  IF v_agreement.agreement_status IN ('terminated', 'ended', 'superseded') THEN
    RAISE EXCEPTION 'Agreement is already in a terminal state (%): cannot be re-terminated.', v_agreement.agreement_status USING ERRCODE = '55000';
  END IF;

  -- Verify actor is authorized (admin, primary host, or signatory)
  SELECT EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = v_agreement.property_id
      AND (
        public.is_platform_admin_for_user(p_actor_user_id)
        OR (p.host_id IS NOT NULL AND p.host_id = p_actor_user_id)
        OR (v_agreement.host_user_id IS NOT NULL AND v_agreement.host_user_id = p_actor_user_id)
      )
  ) INTO v_is_authorized;

  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Unauthorized: User % is not authorized to terminate commercial agreement %.', p_actor_user_id, p_agreement_id USING ERRCODE = '42501';
  END IF;

  -- Execute termination update conforming to immutability trigger
  UPDATE public.host_agreements
  SET agreement_status = 'terminated',
      terminated_at = v_term_timestamp,
      terminated_by = p_actor_user_id,
      termination_reason = v_clean_reason,
      notes = coalesce(notes, '') || E'\n[Terminated: ' || to_char(v_term_timestamp, 'YYYY-MM-DD HH24:MI:SS UTC') || ' by ' || p_actor_user_id::text || ' | Reason: ' || v_clean_reason || ']'
  WHERE id = p_agreement_id;

  -- Append to audit log
  INSERT INTO public.admin_audit_log(actor_user_id, action, target_type, target_id, details)
  VALUES (
    p_actor_user_id,
    'agreement_saved',
    'agreement',
    p_agreement_id,
    jsonb_build_object(
      'operation', 'host_agreement_terminated',
      'previous_status', v_agreement.agreement_status,
      'new_status', 'terminated',
      'property_id', v_agreement.property_id,
      'host_user_id', v_agreement.host_user_id,
      'terminated_by', p_actor_user_id,
      'terminated_at', v_term_timestamp,
      'termination_reason', v_clean_reason
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'agreement_id', p_agreement_id,
    'agreement_status', 'terminated',
    'terminated_at', v_term_timestamp,
    'terminated_by', p_actor_user_id,
    'termination_reason', v_clean_reason
  );
end;
$$;

REVOKE ALL ON FUNCTION public.terminate_host_agreement(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.terminate_host_agreement(uuid, uuid, text) TO service_role;

COMMIT;
