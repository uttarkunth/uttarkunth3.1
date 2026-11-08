-- Stage all host changes to approved property listings until administrator approval.
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS pending_changes_status text,
  ADD COLUMN IF NOT EXISTS pending_changes_admin_notes text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'properties_pending_changes_status_check'
      AND conrelid = 'public.properties'::regclass
  ) THEN
    ALTER TABLE public.properties
      ADD CONSTRAINT properties_pending_changes_status_check
      CHECK (pending_changes_status IS NULL OR pending_changes_status IN ('pending', 'rejected'));
  END IF;
END;
$$;

UPDATE public.properties p
SET pending_changes_status = 'pending'
WHERE p.pending_changes_status IS NULL
  AND (
    p.pending_changes IS NOT NULL
    OR EXISTS (
      SELECT 1 FROM public.property_private_locations l
      WHERE l.property_id = p.id
        AND (l.pending_exact_address IS NOT NULL OR l.pending_google_maps_url IS NOT NULL)
    )
  );

CREATE OR REPLACE FUNCTION public.admin_review_property_changes(p_property_id uuid, p_action text, p_admin_notes text DEFAULT NULL::text, p_admin_user_id uuid DEFAULT auth.uid())
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
  v_location jsonb;
  v_room jsonb;
  v_room_id uuid;
  v_attached boolean;
  v_deleted boolean;
  v_next_village text;
  v_next_district text;
  v_next_state text;
BEGIN
  IF current_setting('request.jwt.claim.role', true) = 'service_role'
     OR current_user IN ('postgres', 'supabase_admin') THEN
    v_is_admin := true;
  ELSE
    SELECT (public.is_platform_admin() OR public.is_platform_admin_for_user(p_admin_user_id))
      INTO v_is_admin;
  END IF;

  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'Unauthorized: Only platform administrators can review property changes.';
  END IF;

  IF p_action NOT IN ('approve', 'reject') THEN
    RAISE EXCEPTION 'Invalid action. Must be approve or reject.';
  END IF;

  SELECT * INTO v_property
  FROM public.properties
  WHERE id = p_property_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Property not found.';
  END IF;

  SELECT * INTO v_private_loc
  FROM public.property_private_locations
  WHERE property_id = p_property_id
  FOR UPDATE;

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
    v_next_village := CASE WHEN v_changes ? 'village' THEN v_changes->>'village' ELSE v_property.village END;
    v_next_district := CASE WHEN v_changes ? 'district' THEN v_changes->>'district' ELSE v_property.district END;
    v_next_state := CASE WHEN v_changes ? 'state' THEN v_changes->>'state' ELSE v_property.state END;

    UPDATE public.properties
    SET name = CASE WHEN v_changes ? 'name' THEN COALESCE(NULLIF(btrim(v_changes->>'name'), ''), name) ELSE name END,
        description = CASE WHEN v_changes ? 'description' THEN v_changes->>'description' ELSE description END,
        village = v_next_village,
        district = v_next_district,
        state = v_next_state,
        address = CASE
          WHEN v_changes ? 'village' OR v_changes ? 'district' OR v_changes ? 'state'
          THEN CONCAT_WS(', ', NULLIF(btrim(v_next_village), ''), NULLIF(btrim(v_next_district), ''), NULLIF(btrim(v_next_state), ''))
          ELSE address
        END,
        property_type = CASE WHEN v_changes ? 'property_type' THEN COALESCE(NULLIF(btrim(v_changes->>'property_type'), ''), property_type) ELSE property_type END,
        amenities = CASE WHEN v_changes ? 'amenities' AND jsonb_typeof(v_changes->'amenities') = 'array' THEN v_changes->'amenities' ELSE amenities END,
        photos = CASE WHEN v_changes ? 'photos' AND jsonb_typeof(v_changes->'photos') = 'array' THEN v_changes->'photos' ELSE photos END,
        shared_washroom_photos = CASE WHEN v_changes ? 'shared_washroom_photos' AND jsonb_typeof(v_changes->'shared_washroom_photos') = 'array' THEN v_changes->'shared_washroom_photos' ELSE shared_washroom_photos END,
        cover_photo = CASE WHEN v_changes ? 'cover_photo' THEN v_changes->>'cover_photo' ELSE cover_photo END,
        contact_phone = CASE WHEN v_changes ? 'contact_phone' THEN v_changes->>'contact_phone' ELSE contact_phone END,
        contact_whatsapp = CASE WHEN v_changes ? 'contact_whatsapp' THEN v_changes->>'contact_whatsapp' ELSE contact_whatsapp END,
        contact_email = CASE WHEN v_changes ? 'contact_email' THEN v_changes->>'contact_email' ELSE contact_email END,
        notify_email = CASE WHEN v_changes ? 'notify_email' THEN COALESCE((v_changes->>'notify_email')::boolean, notify_email) ELSE notify_email END,
        notify_whatsapp = CASE WHEN v_changes ? 'notify_whatsapp' THEN COALESCE((v_changes->>'notify_whatsapp')::boolean, notify_whatsapp) ELSE notify_whatsapp END,
        house_rules = CASE WHEN v_changes ? 'house_rules' THEN v_changes->>'house_rules' ELSE house_rules END,
        check_in_time = CASE WHEN v_changes ? 'check_in_time' THEN v_changes->>'check_in_time' ELSE check_in_time END,
        check_out_time = CASE WHEN v_changes ? 'check_out_time' THEN v_changes->>'check_out_time' ELSE check_out_time END,
        pending_changes = NULL,
        pending_changes_status = NULL,
        pending_changes_admin_notes = NULL,
        pending_changes_submitted_at = NULL,
        moderation_status = 'approved',
        moderation_notes = COALESCE(NULLIF(btrim(p_admin_notes), ''), 'Proposed changes approved by platform administrator.'),
        reviewed_at = now(),
        reviewed_by = p_admin_user_id,
        updated_at = now()
    WHERE id = p_property_id;

    -- Reconcile room inventory without physically deleting room rows referenced by past bookings.
    IF jsonb_typeof(v_changes->'rooms') = 'array' THEN
      UPDATE public.room_units ru
      SET active = false
      WHERE ru.property_id = p_property_id
        AND NOT EXISTS (
          SELECT 1
          FROM jsonb_array_elements(v_changes->'rooms') AS submitted(value)
          WHERE NULLIF(submitted.value->>'id', '')::uuid = ru.id
        );

      FOR v_room IN
        SELECT submitted.value
        FROM jsonb_array_elements(v_changes->'rooms') AS submitted(value)
      LOOP
        v_room_id := NULLIF(v_room->>'id', '')::uuid;
        v_deleted := COALESCE(NULLIF(v_room->>'deleted', '')::boolean, false);
        v_attached := COALESCE(NULLIF(v_room->>'attached_washroom', '')::boolean, false);

        IF v_room_id IS NOT NULL THEN
          UPDATE public.room_units
          SET active = CASE
                WHEN v_deleted THEN false
                ELSE COALESCE(NULLIF(v_room->>'active', '')::boolean, true)
              END,
              room_name = CASE WHEN v_deleted THEN room_name ELSE COALESCE(NULLIF(btrim(v_room->>'room_name'), ''), room_name) END,
              description = CASE WHEN v_deleted THEN description WHEN v_room ? 'description' THEN v_room->>'description' ELSE description END,
              max_guests = CASE WHEN v_deleted THEN max_guests ELSE COALESCE(NULLIF(v_room->>'max_guests', '')::integer, max_guests) END,
              base_price = CASE WHEN v_deleted THEN base_price ELSE COALESCE(NULLIF(v_room->>'base_price', '')::numeric, base_price) END,
              attached_washroom = CASE WHEN v_deleted THEN attached_washroom ELSE COALESCE(NULLIF(v_room->>'attached_washroom', '')::boolean, attached_washroom) END,
              view_type = CASE WHEN v_deleted THEN view_type ELSE COALESCE(NULLIF(v_room->>'view_type', ''), view_type) END,
              bed_type = CASE WHEN v_deleted THEN bed_type WHEN v_room ? 'bed_type' THEN v_room->>'bed_type' ELSE bed_type END,
              features = CASE WHEN v_deleted THEN features WHEN jsonb_typeof(v_room->'features') = 'array' THEN v_room->'features' ELSE features END,
              photos = CASE WHEN v_deleted THEN photos WHEN jsonb_typeof(v_room->'photos') = 'array' THEN v_room->'photos' ELSE photos END,
              washroom_photos = CASE
                WHEN v_deleted THEN washroom_photos
                WHEN NOT v_attached THEN '[]'::jsonb
                WHEN jsonb_typeof(v_room->'washroom_photos') = 'array' THEN v_room->'washroom_photos'
                ELSE washroom_photos
              END,
              sort_order = CASE WHEN v_deleted THEN sort_order ELSE COALESCE(NULLIF(v_room->>'sort_order', '')::integer, sort_order) END
          WHERE id = v_room_id
            AND property_id = p_property_id;

          IF NOT FOUND THEN
            RAISE EXCEPTION 'A submitted room no longer belongs to this property. Please refresh and resubmit.';
          END IF;
        ELSIF NOT v_deleted THEN
          INSERT INTO public.room_units (
            property_id, room_name, description, max_guests, base_price, active,
            attached_washroom, view_type, bed_type, features, photos,
            washroom_photos, sort_order
          )
          VALUES (
            p_property_id,
            COALESCE(NULLIF(btrim(v_room->>'room_name'), ''), 'New Room'),
            v_room->>'description',
            COALESCE(NULLIF(v_room->>'max_guests', '')::integer, 2),
            COALESCE(NULLIF(v_room->>'base_price', '')::numeric, 0),
            COALESCE(NULLIF(v_room->>'active', '')::boolean, true),
            v_attached,
            COALESCE(NULLIF(v_room->>'view_type', ''), 'none'),
            v_room->>'bed_type',
            CASE WHEN jsonb_typeof(v_room->'features') = 'array' THEN v_room->'features' ELSE '[]'::jsonb END,
            CASE WHEN jsonb_typeof(v_room->'photos') = 'array' THEN v_room->'photos' ELSE '[]'::jsonb END,
            CASE WHEN v_attached AND jsonb_typeof(v_room->'washroom_photos') = 'array' THEN v_room->'washroom_photos' ELSE '[]'::jsonb END,
            COALESCE(NULLIF(v_room->>'sort_order', '')::integer, 0)
          );
        END IF;
      END LOOP;
    END IF;

    -- Exact address and Google Maps URL remain private; publish them only on approval.
    IF v_changes ? 'location' OR v_has_private_pending THEN
      v_location := COALESCE(v_changes->'location', '{}'::jsonb);
      INSERT INTO public.property_private_locations (
        property_id, exact_address, google_maps_url, location_confirmed,
        pending_exact_address, pending_google_maps_url, updated_at
      )
      VALUES (
        p_property_id,
        COALESCE(
          NULLIF(v_location->>'exact_address', ''),
          NULLIF(v_private_loc.pending_exact_address, ''),
          NULLIF(v_private_loc.exact_address, ''),
          v_property.address,
          'Address pending verification'
        ),
        CASE
          WHEN v_location ? 'google_maps_url' THEN NULLIF(v_location->>'google_maps_url', '')
          ELSE COALESCE(NULLIF(v_private_loc.pending_google_maps_url, ''), v_private_loc.google_maps_url)
        END,
        CASE
          WHEN v_location ? 'location_confirmed' THEN COALESCE((v_location->>'location_confirmed')::boolean, false)
          ELSE COALESCE(v_private_loc.location_confirmed, false)
        END,
        NULL,
        NULL,
        now()
      )
      ON CONFLICT (property_id) DO UPDATE
      SET exact_address = EXCLUDED.exact_address,
          google_maps_url = EXCLUDED.google_maps_url,
          location_confirmed = EXCLUDED.location_confirmed,
          pending_exact_address = NULL,
          pending_google_maps_url = NULL,
          updated_at = now();
    END IF;

    INSERT INTO public.admin_audit_log(actor_user_id, action, target_type, target_id, details)
    VALUES (
      p_admin_user_id,
      'property_changes_approved',
      'property',
      p_property_id,
      jsonb_build_object(
        'applied_changes', v_changes,
        'location_updated', (v_changes ? 'location' OR v_has_private_pending),
        'notes', p_admin_notes
      )
    );

    RETURN jsonb_build_object('success', true, 'action', 'approved', 'property_id', p_property_id);
  ELSE
    -- Keep the complete rejected proposal so the host can correct and resubmit it.
    UPDATE public.properties
    SET pending_changes_status = 'rejected',
        pending_changes_admin_notes = NULLIF(btrim(p_admin_notes), ''),
        pending_changes_submitted_at = NULL,
        moderation_notes = COALESCE(NULLIF(btrim(p_admin_notes), ''), 'Proposed changes need corrections before approval.'),
        reviewed_at = now(),
        reviewed_by = p_admin_user_id,
        updated_at = now()
    WHERE id = p_property_id;

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
$function$

