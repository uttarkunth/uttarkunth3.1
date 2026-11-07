-- ============================================================================
-- UTTARKUNTH 3.1 — PROPERTY LOCATION SIMPLIFICATION, GOOGLE MAPS SHARE LINKS
-- & SUPABASE DATABASE CLEANUP
-- ============================================================================
-- 1. Creates strict database-level validator for Google Maps share/place URLs.
-- 2. Creates `public.property_private_locations` to store private exact address,
--    host-verified Google Maps share link, and staged location edits under
--    strict Row Level Security (accessible only to property host/managers,
--    platform admins, and guests with a confirmed booking).
-- 3. Updates trigger function `public.enforce_property_ownership_and_moderation`
--    and RPC `public.admin_review_property_changes` to remove legacy coordinate
--    references and support staged location review.
-- 4. Backfills existing property exact addresses into `property_private_locations`
--    and sanitizes `public.properties.address` to general locality only.
-- 5. Retires and deprecates legacy `latitude` and `longitude` columns on `public.properties`.
-- ============================================================================

-- 1. Google Maps Share URL Validator
CREATE OR REPLACE FUNCTION public.is_valid_google_maps_url(p_url text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO ''
AS $function$
DECLARE
  v_trimmed text;
BEGIN
  IF p_url IS NULL THEN
    RETURN false;
  END IF;

  v_trimmed := btrim(p_url);

  IF length(v_trimmed) < 18 OR length(v_trimmed) > 2048 THEN
    RETURN false;
  END IF;

  -- Reject any whitespace or control characters
  IF v_trimmed ~ '\s' THEN
    RETURN false;
  END IF;

  -- Reject open-redirect parameters embedded inside query strings
  IF v_trimmed ~* '([?&](url|q|continue|redirect|next|dest|destination)=https?:)' THEN
    RETURN false;
  END IF;

  RETURN v_trimmed ~ '^https://((maps\.app\.goo\.gl/[A-Za-z0-9_-]+([/?#][^\s]*)?)|(goo\.gl/maps/[A-Za-z0-9_-]+([/?#][^\s]*)?)|((www\.)?google\.(com|co\.in)/maps([/?#][^\s]*)?$)|(maps\.google\.(com|co\.in)([/?#][^\s]*)?$))';
END;
$function$;

-- 2. Private Property Locations Table
CREATE TABLE IF NOT EXISTS public.property_private_locations (
  property_id uuid PRIMARY KEY REFERENCES public.properties(id) ON DELETE CASCADE,
  exact_address text NOT NULL DEFAULT '',
  google_maps_url text NULL CHECK (google_maps_url IS NULL OR public.is_valid_google_maps_url(google_maps_url)),
  pending_exact_address text NULL,
  pending_google_maps_url text NULL CHECK (pending_google_maps_url IS NULL OR public.is_valid_google_maps_url(pending_google_maps_url)),
  location_confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.property_private_locations IS
  'Private property location details (exact address, landmarks, and host-confirmed Google Maps share URL). Protected by RLS so only the host, platform admins, and confirmed booking guests can read.';

-- 3. Update trigger function `public.enforce_property_ownership_and_moderation`
CREATE OR REPLACE FUNCTION public.enforce_property_ownership_and_moderation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
DECLARE
  v_admin boolean := false;
  v_is_primary_host boolean := false;
  v_is_manager boolean := false;
  v_material_change boolean := false;
  v_staged jsonb;
BEGIN
  IF current_setting('request.jwt.claim.role', true) = 'service_role'
     OR current_user IN ('postgres', 'supabase_admin') THEN
    RETURN new;
  END IF;

  v_admin := public.is_platform_admin();
  IF v_admin THEN
    RETURN new;
  END IF;

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authenticated account required to manage a property.';
  END IF;

  IF tg_op = 'INSERT' THEN
    new.host_id := auth.uid();
    new.address := CONCAT_WS(', ', NULLIF(btrim(new.village), ''), NULLIF(btrim(new.district), ''), NULLIF(btrim(new.state), ''));
    new.published := false;
    new.moderation_status := 'pending';
    new.moderation_notes := 'Initial property application submitted';
    new.pending_changes := null;
    new.pending_changes_submitted_at := null;
    new.reviewed_at := null;
    new.reviewed_by := null;
    RETURN new;
  END IF;

  v_is_primary_host := (old.host_id = auth.uid());
  SELECT EXISTS (
    SELECT 1 FROM public.property_hosts ph
    WHERE ph.property_id = old.id AND ph.user_id = auth.uid() AND ph.role = 'manager'
  ) INTO v_is_manager;

  IF NOT v_is_primary_host AND NOT v_is_manager THEN
    RAISE EXCEPTION 'You do not have permission to modify this property listing.';
  END IF;

  IF new.host_id IS DISTINCT FROM old.host_id THEN
    RAISE EXCEPTION 'Property ownership cannot be changed by host or manager.';
  END IF;

  IF new.moderation_status IS DISTINCT FROM old.moderation_status THEN
    RAISE EXCEPTION 'Moderation status can only be updated by platform administrators.';
  END IF;

  IF new.published IS DISTINCT FROM old.published AND old.moderation_status IS DISTINCT FROM 'approved' THEN
    RAISE EXCEPTION 'Only approved properties may be published.';
  END IF;

  new.address := CONCAT_WS(', ', NULLIF(btrim(new.village), ''), NULLIF(btrim(new.district), ''), NULLIF(btrim(new.state), ''));

  v_material_change :=
       new.name IS DISTINCT FROM old.name
    OR new.slug IS DISTINCT FROM old.slug
    OR new.description IS DISTINCT FROM old.description
    OR new.village IS DISTINCT FROM old.village
    OR new.district IS DISTINCT FROM old.district
    OR new.state IS DISTINCT FROM old.state
    OR new.property_type IS DISTINCT FROM old.property_type
    OR new.amenities IS DISTINCT FROM old.amenities
    OR new.photos IS DISTINCT FROM old.photos;

  IF v_material_change THEN
    IF NOT v_is_primary_host THEN
      RAISE EXCEPTION 'Only the primary property host can propose public content or structural changes.';
    END IF;

    IF old.published = true AND old.moderation_status = 'approved' THEN
      v_staged := jsonb_build_object(
        'name', new.name,
        'description', new.description,
        'village', new.village,
        'district', new.district,
        'state', new.state,
        'property_type', new.property_type,
        'amenities', new.amenities,
        'photos', new.photos
      );

      new.name := old.name;
      new.slug := old.slug;
      new.description := old.description;
      new.address := old.address;
      new.village := old.village;
      new.district := old.district;
      new.state := old.state;
      new.property_type := old.property_type;
      new.amenities := old.amenities;
      new.photos := old.photos;

      new.published := old.published;
      new.moderation_status := old.moderation_status;
      new.pending_changes := v_staged;
      new.pending_changes_submitted_at := now();
      new.moderation_notes := 'Proposed updates staged for administrative review. Approved listing remains live.';
    ELSE
      new.published := false;
      new.moderation_status := 'pending';
      new.pending_changes := null;
      new.pending_changes_submitted_at := null;
    END IF;
  END IF;

  RETURN new;
END;
$function$;

-- 4. Backfill existing properties into property_private_locations before sanitizing public.properties.address
INSERT INTO public.property_private_locations (
  property_id,
  exact_address,
  pending_exact_address,
  location_confirmed,
  created_at,
  updated_at
)
SELECT
  p.id,
  COALESCE(
    NULLIF(btrim(p.address), ''),
    CONCAT_WS(', ', NULLIF(btrim(p.village), ''), NULLIF(btrim(p.district), ''), NULLIF(btrim(p.state), ''))
  ),
  CASE
    WHEN p.pending_changes IS NOT NULL AND NULLIF(btrim(p.pending_changes->>'address'), '') IS NOT NULL
      THEN btrim(p.pending_changes->>'address')
    ELSE NULL
  END,
  false,
  COALESCE(p.created_at, now()),
  COALESCE(p.updated_at, now())
FROM public.properties p
ON CONFLICT (property_id) DO NOTHING;

-- Sanitize public.properties.address to hold only general locality (village, district, state)
UPDATE public.properties
SET
  address = CONCAT_WS(', ', NULLIF(btrim(village), ''), NULLIF(btrim(district), ''), NULLIF(btrim(state), '')),
  latitude = NULL,
  longitude = NULL,
  pending_changes = CASE
    WHEN pending_changes IS NOT NULL THEN pending_changes - 'address' - 'latitude' - 'longitude' - 'google_maps_url'
    ELSE NULL
  END;

COMMENT ON COLUMN public.properties.latitude IS 'DEPRECATED (Uttarkunth 3.1): Legacy coordinate column retired in favor of public.property_private_locations.google_maps_url. Do not read or write.';
COMMENT ON COLUMN public.properties.longitude IS 'DEPRECATED (Uttarkunth 3.1): Legacy coordinate column retired in favor of public.property_private_locations.google_maps_url. Do not read or write.';

-- 5. Update `public.admin_review_property_changes`
CREATE OR REPLACE FUNCTION public.admin_review_property_changes(
  p_property_id uuid,
  p_action text,
  p_admin_notes text DEFAULT NULL::text,
  p_admin_user_id uuid DEFAULT auth.uid()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_property public.properties%rowtype;
  v_private_loc public.property_private_locations%rowtype;
  v_has_private_pending boolean := false;
  v_is_admin boolean := false;
  v_changes jsonb;
  v_next_village text;
  v_next_district text;
  v_next_state text;
BEGIN
  IF current_setting('request.jwt.claim.role', true) = 'service_role'
     OR current_user IN ('postgres', 'supabase_admin') THEN
    v_is_admin := true;
  ELSE
    SELECT (public.is_platform_admin() OR public.is_platform_admin_for_user(p_admin_user_id)) INTO v_is_admin;
  END IF;

  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'Unauthorized: Only platform administrators can review property changes.';
  END IF;

  IF p_action NOT IN ('approve', 'reject') THEN
    RAISE EXCEPTION 'Invalid action. Must be approve or reject.';
  END IF;

  SELECT * INTO v_property FROM public.properties WHERE id = p_property_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Property not found.';
  END IF;

  SELECT * INTO v_private_loc FROM public.property_private_locations WHERE property_id = p_property_id FOR UPDATE;
  IF FOUND THEN
    v_has_private_pending := (
      v_private_loc.pending_exact_address IS NOT NULL
      OR v_private_loc.pending_google_maps_url IS NOT NULL
    );
  END IF;

  v_changes := v_property.pending_changes;
  IF v_changes IS NULL AND NOT v_has_private_pending THEN
    RAISE EXCEPTION 'No pending changes to review for this property.';
  END IF;

  v_changes := COALESCE(v_changes, '{}'::jsonb);

  IF p_action = 'approve' THEN
    v_next_village := COALESCE(NULLIF(btrim(v_changes->>'village'), ''), v_property.village);
    v_next_district := COALESCE(NULLIF(btrim(v_changes->>'district'), ''), v_property.district);
    v_next_state := COALESCE(NULLIF(btrim(v_changes->>'state'), ''), v_property.state);

    UPDATE public.properties
    SET name = COALESCE(NULLIF(btrim(v_changes->>'name'), ''), name),
        description = COALESCE(NULLIF(btrim(v_changes->>'description'), ''), description),
        village = v_next_village,
        district = v_next_district,
        state = v_next_state,
        address = CONCAT_WS(', ', NULLIF(btrim(v_next_village), ''), NULLIF(btrim(v_next_district), ''), NULLIF(btrim(v_next_state), '')),
        property_type = COALESCE(NULLIF(btrim(v_changes->>'property_type'), ''), property_type),
        amenities = CASE WHEN v_changes ? 'amenities' AND jsonb_typeof(v_changes->'amenities') = 'array' THEN v_changes->'amenities' ELSE amenities END,
        photos = CASE WHEN v_changes ? 'photos' AND jsonb_typeof(v_changes->'photos') = 'array' THEN v_changes->'photos' ELSE photos END,
        pending_changes = NULL,
        pending_changes_submitted_at = NULL,
        moderation_status = 'approved',
        moderation_notes = COALESCE(p_admin_notes, 'Proposed changes approved by platform administrator.'),
        reviewed_at = now(),
        reviewed_by = p_admin_user_id,
        updated_at = now()
    WHERE id = p_property_id;

    UPDATE public.property_private_locations
    SET exact_address = COALESCE(NULLIF(btrim(pending_exact_address), ''), exact_address),
        google_maps_url = COALESCE(NULLIF(btrim(pending_google_maps_url), ''), google_maps_url),
        location_confirmed = CASE
          WHEN NULLIF(btrim(pending_google_maps_url), '') IS NOT NULL THEN true
          ELSE location_confirmed
        END,
        pending_exact_address = NULL,
        pending_google_maps_url = NULL,
        updated_at = now()
    WHERE property_id = p_property_id;

    INSERT INTO public.admin_audit_log(actor_user_id, action, target_type, target_id, details)
    VALUES (
      p_admin_user_id,
      'property_changes_approved',
      'property',
      p_property_id,
      jsonb_build_object(
        'applied_changes', v_changes,
        'location_updated', v_has_private_pending,
        'notes', p_admin_notes
      )
    );

    RETURN jsonb_build_object('success', true, 'action', 'approved', 'property_id', p_property_id);
  ELSE
    UPDATE public.properties
    SET pending_changes = NULL,
        pending_changes_submitted_at = NULL,
        moderation_notes = COALESCE(p_admin_notes, 'Proposed changes rejected by platform administrator.'),
        reviewed_at = now(),
        reviewed_by = p_admin_user_id,
        updated_at = now()
    WHERE id = p_property_id;

    UPDATE public.property_private_locations
    SET pending_exact_address = NULL,
        pending_google_maps_url = NULL,
        updated_at = now()
    WHERE property_id = p_property_id;

    INSERT INTO public.admin_audit_log(actor_user_id, action, target_type, target_id, details)
    VALUES (
      p_admin_user_id,
      'property_changes_rejected',
      'property',
      p_property_id,
      jsonb_build_object(
        'rejected_changes', v_changes,
        'location_rejected', v_has_private_pending,
        'notes', p_admin_notes
      )
    );

    RETURN jsonb_build_object('success', true, 'action', 'rejected', 'property_id', p_property_id);
  END IF;
END;
$function$;

-- 6. Row Level Security on `public.property_private_locations`
ALTER TABLE public.property_private_locations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.property_private_locations FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.property_private_locations TO authenticated;
GRANT ALL ON TABLE public.property_private_locations TO service_role;

CREATE POLICY property_private_locations_service_all
  ON public.property_private_locations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY property_private_locations_host_or_admin_select
  ON public.property_private_locations
  FOR SELECT
  TO authenticated
  USING (public.is_platform_admin() OR public.is_property_host(property_id, auth.uid()));

CREATE POLICY property_private_locations_host_or_admin_insert
  ON public.property_private_locations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_private_locations.property_id
        AND p.host_id = auth.uid()
    )
  );

CREATE POLICY property_private_locations_host_or_admin_update
  ON public.property_private_locations
  FOR UPDATE
  TO authenticated
  USING (
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_private_locations.property_id
        AND p.host_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_private_locations.property_id
        AND p.host_id = auth.uid()
    )
  );

CREATE POLICY property_private_locations_confirmed_guest_select
  ON public.property_private_locations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.stay_bookings sb
      WHERE sb.property_id = property_private_locations.property_id
        AND sb.guest_user_id = auth.uid()
        AND sb.status = 'confirmed'
    )
    OR EXISTS (
      SELECT 1
      FROM public.booking_requests br
      WHERE br.property_id = property_private_locations.property_id
        AND br.guest_user_id = auth.uid()
        AND br.status = 'confirmed'
    )
  );
