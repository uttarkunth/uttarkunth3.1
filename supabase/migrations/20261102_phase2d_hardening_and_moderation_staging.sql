-- Phase 2D Final Hardening: Public Content Moderation Staging & Role Permission Matrix
-- Date: 2 November 2026

-- 1. Add pending_changes staging columns to public.properties
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS pending_changes jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pending_changes_submitted_at timestamptz DEFAULT NULL;

-- 2. Update enforce_property_ownership_and_moderation trigger
-- Enforces:
-- - Material changes by hosts to approved/published properties are staged into pending_changes
--   so live listings remain visible without disruption.
-- - Only primary host can submit material changes.
-- - Host ownership, published flag, and moderation_status cannot be changed by host/manager.
CREATE OR REPLACE FUNCTION public.enforce_property_ownership_and_moderation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
declare
  v_admin boolean := false;
  v_is_primary_host boolean := false;
  v_is_manager boolean := false;
  v_material_change boolean := false;
  v_staged jsonb;
begin
  if current_setting('request.jwt.claim.role', true) = 'service_role' then
    return new;
  end if;

  v_admin := public.is_platform_admin();
  if v_admin then
    return new;
  end if;

  if auth.uid() is null then
    raise exception 'Authenticated account required to manage a property.';
  end if;

  if tg_op = 'INSERT' then
    new.host_id := auth.uid();
    new.published := false;
    new.moderation_status := 'pending';
    new.moderation_notes := 'Initial property application submitted';
    new.pending_changes := null;
    new.pending_changes_submitted_at := null;
    new.reviewed_at := null;
    new.reviewed_by := null;
    return new;
  end if;

  -- Check roles
  v_is_primary_host := (old.host_id = auth.uid());
  select exists (
    select 1 from public.property_hosts ph 
    where ph.property_id = old.id and ph.user_id = auth.uid() and ph.role = 'manager'
  ) into v_is_manager;

  if not v_is_primary_host and not v_is_manager then
    raise exception 'You do not have permission to modify this property listing.';
  end if;

  -- Protect ownership: host_id can never be changed by host or manager
  if new.host_id is distinct from old.host_id then
    raise exception 'Property ownership cannot be changed by host or manager.';
  end if;

  -- Protect moderation and publication flags: cannot be self-approved or self-published
  if new.moderation_status is distinct from old.moderation_status then
    raise exception 'Moderation status can only be updated by platform administrators.';
  end if;

  if new.published is distinct from old.published and old.moderation_status is distinct from 'approved' then
    raise exception 'Only approved properties may be published.';
  end if;

  -- Detect material public content changes
  v_material_change :=
       new.name is distinct from old.name
    or new.slug is distinct from old.slug
    or new.description is distinct from old.description
    or new.address is distinct from old.address
    or new.village is distinct from old.village
    or new.district is distinct from old.district
    or new.state is distinct from old.state
    or new.latitude is distinct from old.latitude
    or new.longitude is distinct from old.longitude
    or new.property_type is distinct from old.property_type
    or new.amenities is distinct from old.amenities
    or new.photos is distinct from old.photos;

  if v_material_change then
    -- Co-hosts and managers cannot alter public content; only primary hosts can propose material changes
    if not v_is_primary_host then
      raise exception 'Only the primary property host can propose public content or structural changes.';
    end if;

    -- If property is currently approved and live: stage proposed changes without disrupting the live listing
    if old.published = true and old.moderation_status = 'approved' then
      v_staged := jsonb_build_object(
        'name', new.name,
        'description', new.description,
        'address', new.address,
        'village', new.village,
        'district', new.district,
        'state', new.state,
        'property_type', new.property_type,
        'amenities', new.amenities,
        'photos', new.photos
      );

      -- Revert live columns to currently approved versions
      new.name := old.name;
      new.slug := old.slug;
      new.description := old.description;
      new.address := old.address;
      new.village := old.village;
      new.district := old.district;
      new.state := old.state;
      new.latitude := old.latitude;
      new.longitude := old.longitude;
      new.property_type := old.property_type;
      new.amenities := old.amenities;
      new.photos := old.photos;

      -- Preserve live publication state
      new.published := old.published;
      new.moderation_status := old.moderation_status;
      new.pending_changes := v_staged;
      new.pending_changes_submitted_at := now();
      new.moderation_notes := 'Proposed updates staged for administrative review. Approved listing remains live.';
    else
      -- Initial unapproved draft: update directly and keep pending
      new.published := false;
      new.moderation_status := 'pending';
      new.pending_changes := null;
      new.pending_changes_submitted_at := null;
    end if;
  end if;

  return new;
end;
$function$;

-- 3. Update respond_to_stay_booking to enforce manager/host decider role
CREATE OR REPLACE FUNCTION public.respond_to_stay_booking(
  p_stay_booking_id uuid,
  p_action text,
  p_actor_user_id uuid,
  p_host_notes text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
declare
  v_booking public.stay_bookings%rowtype;
  v_property public.properties%rowtype;
  v_room public.room_units%rowtype;
  v_agreement public.host_agreements%rowtype;
  v_is_admin boolean := false;
  v_is_authorized_decider boolean := false;
  v_has_block boolean := false;
  v_conflicts integer := 0;
  v_new_status text;
  v_commission numeric(5,2);
  v_commission_amount numeric(12,2);
begin
  if p_stay_booking_id is null or p_actor_user_id is null or p_action not in ('confirm','decline','cancel') then
    raise exception 'Invalid booking decision request.';
  end if;

  select * into v_booking from public.stay_bookings where id = p_stay_booking_id for update;
  if not found then raise exception 'Booking not found.'; end if;

  select * into v_property from public.properties where id = v_booking.property_id;
  if not found then raise exception 'Property not found.'; end if;

  -- Concurrency Anchor: Lock the room row to serialize concurrent actions on this room
  select * into v_room from public.room_units
    where id = v_booking.room_unit_id and property_id = v_booking.property_id for update;
  if not found then raise exception 'Room not found.'; end if;

  -- Authorization check: Primary host, manager, or platform admin
  select public.is_platform_admin() into v_is_admin;
  select (v_property.host_id = p_actor_user_id or exists (
    select 1 from public.property_hosts ph 
    where ph.property_id = v_property.id and ph.user_id = p_actor_user_id and ph.role = 'manager'
  )) into v_is_authorized_decider;

  if not v_is_admin and not coalesce(v_is_authorized_decider, false) then
    raise exception 'Not authorised to decide bookings for this property. Only primary hosts, managers, or platform administrators may confirm or decline reservations.';
  end if;

  if p_action in ('confirm','decline') and v_booking.status <> 'pending' then
    raise exception 'Only pending booking requests can be decided.';
  end if;

  if p_action = 'cancel' and v_booking.status not in ('pending','confirmed') then
    raise exception 'Only pending or confirmed bookings can be cancelled.';
  end if;

  if p_action = 'confirm' then
    if v_property.published is distinct from true or v_property.moderation_status is distinct from 'approved' then
      raise exception 'Property is not approved and published.';
    end if;
    if v_room.active is distinct from true then
      raise exception 'Room is inactive.';
    end if;
    if v_booking.check_in < current_date or v_booking.check_out <= v_booking.check_in or v_booking.check_out - v_booking.check_in > 60 then
      raise exception 'Booking dates are invalid.';
    end if;
    if coalesce(v_booking.adults,1) + coalesce(v_booking.children,0) > v_room.max_guests then
      raise exception 'Guest count exceeds room capacity.';
    end if;

    -- Verify manual availability blocks inside transaction
    select exists (
      select 1 from public.room_availability_blocks b
      where b.room_unit_id = v_booking.room_unit_id
        and b.blocked_from < v_booking.check_out
        and b.blocked_until > v_booking.check_in
    ) into v_has_block;
    if v_has_block then
      raise exception 'Cannot confirm request: This room is marked unavailable by host blocks for the selected dates.';
    end if;

    -- Concurrency check: ONLY confirmed bookings block confirmation (pending requests do NOT block dates)
    select count(*) into v_conflicts from public.stay_bookings other
      where other.id <> v_booking.id
        and other.room_unit_id = v_booking.room_unit_id
        and other.status = 'confirmed'
        and other.check_in < v_booking.check_out
        and other.check_out > v_booking.check_in;
    if v_conflicts > 0 then
      raise exception 'Room already has a confirmed reservation for these dates.';
    end if;

    -- Commercial commission snapshot: strictly from explicit active host agreement
    select * into v_agreement from public.host_agreements ha
      where ha.property_id = v_booking.property_id
        and ha.host_user_id = v_property.host_id
        and ha.agreement_status = 'active'
        and ha.accepted_at is not null
        and ha.agreement_start <= current_date
        and (ha.agreement_end is null or ha.agreement_end >= current_date)
      order by ha.agreement_start desc, ha.created_at desc limit 1;

    v_commission := null;
    v_commission_amount := null;
    if found then
      if v_agreement.intro_period_months is not null and v_agreement.intro_commission_percent is not null and v_agreement.standard_commission_percent is not null then
        if current_date < (v_agreement.agreement_start + make_interval(months => v_agreement.intro_period_months))::date then
          v_commission := v_agreement.intro_commission_percent;
        else
          v_commission := v_agreement.standard_commission_percent;
        end if;
      else
        v_commission := v_agreement.commission_percent;
      end if;
      v_commission_amount := round(coalesce(v_booking.total_estimate,0) * coalesce(v_commission,0) / 100, 2);
    end if;

    v_new_status := 'confirmed';
    update public.stay_bookings
    set status = v_new_status,
        host_notes = coalesce(nullif(btrim(p_host_notes),''), host_notes),
        agreement_id = case when v_agreement.id is not null then v_agreement.id else null end,
        commission_percent_snapshot = v_commission,
        commission_amount_snapshot = v_commission_amount,
        updated_at = now()
    where id = v_booking.id;

  elsif p_action = 'decline' then
    v_new_status := 'declined';
    update public.stay_bookings
    set status = v_new_status,
        host_notes = coalesce(nullif(btrim(p_host_notes),''), host_notes),
        updated_at = now()
    where id = v_booking.id;

  else
    v_new_status := 'cancelled';
    update public.stay_bookings
    set status = v_new_status,
        updated_at = now()
    where id = v_booking.id;
  end if;

  insert into public.admin_audit_log(actor_user_id, action, target_type, target_id, details)
  values (
    p_actor_user_id,
    'booking_decided',
    'booking',
    v_booking.id,
    jsonb_build_object(
      'decision', v_new_status,
      'booking_reference', v_booking.booking_reference
    )
  );

  return jsonb_build_object(
    'success', true,
    'booking_id', v_booking.id,
    'booking_reference', v_booking.booking_reference,
    'status', v_new_status,
    'commission_percent_snapshot', v_commission,
    'commission_amount_snapshot', v_commission_amount
  );
end;
$function$;

-- 4. Update set_room_availability_block to enforce manager/host decider role
CREATE OR REPLACE FUNCTION public.set_room_availability_block(
  p_room_unit_id uuid,
  p_blocked_from date,
  p_blocked_until date,
  p_reason text,
  p_actor_user_id uuid,
  p_block_id uuid DEFAULT NULL::uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
declare
  v_room public.room_units%rowtype;
  v_property public.properties%rowtype;
  v_is_admin boolean := false;
  v_is_authorized_manager boolean := false;
  v_conflicts integer := 0;
  v_result_id uuid;
begin
  if p_room_unit_id is null or p_actor_user_id is null then
    raise exception 'Invalid availability block parameters.';
  end if;

  select * into v_room from public.room_units where id = p_room_unit_id for update;
  if not found then
    raise exception 'Room unit not found.';
  end if;

  select * into v_property from public.properties where id = v_room.property_id;
  if not found then
    raise exception 'Associated property not found.';
  end if;

  select public.is_platform_admin() into v_is_admin;
  select (v_property.host_id = p_actor_user_id or exists (
    select 1 from public.property_hosts ph 
    where ph.property_id = v_property.id and ph.user_id = p_actor_user_id and ph.role = 'manager'
  )) into v_is_authorized_manager;

  if not v_is_admin and not coalesce(v_is_authorized_manager, false) then
    raise exception 'Not authorised to manage availability blocks for this property. Only primary hosts, managers, or platform administrators may block room dates.';
  end if;

  if p_blocked_from is null or p_blocked_until is null or p_blocked_until <= p_blocked_from then
    raise exception 'Invalid date range: blocked_until must be after blocked_from.';
  end if;

  select count(*) into v_conflicts from public.stay_bookings
    where room_unit_id = p_room_unit_id
      and status = 'confirmed'
      and check_in < p_blocked_until
      and check_out > p_blocked_from;

  if v_conflicts > 0 then
    raise exception 'Cannot block room: dates conflict with an existing confirmed reservation.';
  end if;

  if p_block_id is null then
    insert into public.room_availability_blocks (
      room_unit_id, blocked_from, blocked_until, reason, created_by
    )
    values (
      p_room_unit_id, p_blocked_from, p_blocked_until, btrim(p_reason), p_actor_user_id
    )
    returning id into v_result_id;

    return jsonb_build_object('success', true, 'action', 'created', 'block_id', v_result_id);
  else
    update public.room_availability_blocks
    set blocked_from = p_blocked_from,
        blocked_until = p_blocked_until,
        reason = btrim(p_reason)
    where id = p_block_id and room_unit_id = p_room_unit_id;

    return jsonb_build_object('success', true, 'action', 'updated', 'block_id', p_block_id);
  end if;
end;
$function$;

-- 5. Admin Review Function for Staged Changes
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
declare
  v_property public.properties%rowtype;
  v_is_admin boolean := false;
  v_changes jsonb;
begin
  select public.is_platform_admin() into v_is_admin;
  if not v_is_admin then
    raise exception 'Unauthorized: Only platform administrators can review property changes.';
  end if;

  if p_action not in ('approve', 'reject') then
    raise exception 'Invalid action. Must be approve or reject.';
  end if;

  select * into v_property from public.properties where id = p_property_id for update;
  if not found then
    raise exception 'Property not found.';
  end if;

  v_changes := v_property.pending_changes;
  if v_changes is null then
    raise exception 'No pending changes to review for this property.';
  end if;

  if p_action = 'approve' then
    update public.properties
    set name = coalesce(nullif(btrim(v_changes->>'name'), ''), name),
        description = coalesce(nullif(btrim(v_changes->>'description'), ''), description),
        address = coalesce(nullif(btrim(v_changes->>'address'), ''), address),
        village = coalesce(nullif(btrim(v_changes->>'village'), ''), village),
        district = coalesce(nullif(btrim(v_changes->>'district'), ''), district),
        state = coalesce(nullif(btrim(v_changes->>'state'), ''), state),
        property_type = coalesce(nullif(btrim(v_changes->>'property_type'), ''), property_type),
        amenities = case when v_changes ? 'amenities' and jsonb_typeof(v_changes->'amenities') = 'array' then v_changes->'amenities' else amenities end,
        photos = case when v_changes ? 'photos' and jsonb_typeof(v_changes->'photos') = 'array' then v_changes->'photos' else photos end,
        pending_changes = null,
        pending_changes_submitted_at = null,
        moderation_status = 'approved',
        moderation_notes = coalesce(p_admin_notes, 'Proposed changes approved by platform administrator.'),
        reviewed_at = now(),
        reviewed_by = p_admin_user_id,
        updated_at = now()
    where id = p_property_id;

    insert into public.admin_audit_log(actor_user_id, action, target_type, target_id, details)
    values (
      p_admin_user_id,
      'property_changes_approved',
      'property',
      p_property_id,
      jsonb_build_object('applied_changes', v_changes, 'notes', p_admin_notes)
    );

    return jsonb_build_object('success', true, 'action', 'approved', 'property_id', p_property_id);
  else
    update public.properties
    set pending_changes = null,
        pending_changes_submitted_at = null,
        moderation_notes = coalesce(p_admin_notes, 'Proposed changes rejected by platform administrator.'),
        reviewed_at = now(),
        reviewed_by = p_admin_user_id,
        updated_at = now()
    where id = p_property_id;

    insert into public.admin_audit_log(actor_user_id, action, target_type, target_id, details)
    values (
      p_admin_user_id,
      'property_changes_rejected',
      'property',
      p_property_id,
      jsonb_build_object('rejected_changes', v_changes, 'notes', p_admin_notes)
    );

    return jsonb_build_object('success', true, 'action', 'rejected', 'property_id', p_property_id);
  end if;
end;
$function$;
