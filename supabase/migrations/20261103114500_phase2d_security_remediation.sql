-- ==============================================================================
-- UTTARKUNTH — PHASE 2D: AVAILABILITY & BOOKING DECISION SECURITY REMEDIATION
-- Target: Remote Supabase uttarkunth-stays (xyplgugxpmlnjsvlosdg)
-- ==============================================================================
BEGIN;

-- ==============================================================================
-- UTTARKUNTH — PHASE 2D/2E FINAL SECURITY REMEDIATION MIGRATION (FINAL REVISION)
-- PENDING EXPLICIT USER APPROVAL - DO NOT EXECUTE ON PRODUCTION WITHOUT APPROVAL
-- ==============================================================================
-- Corrections Included:
-- 1. Explicit internal helper public.is_platform_admin_for_user(uuid) created with
--    restricted EXECUTE permissions (service_role only).
-- 2. Compatible zero-argument public.is_platform_admin() retained for existing
--    RLS policies and callers, evaluating auth.uid() via the internal helper.
-- 3. public.set_room_availability_block (6 arguments):
--    - Evaluates actor via is_platform_admin_for_user(p_actor_user_id).
--    - Locks room_units FOR UPDATE first to establish strict concurrency hierarchy.
--    - Added FOUND check on UPDATE: updates to nonexistent blocks or blocks on
--      different room units raise an exception instead of returning success.
--    - Direct EXECUTE REVOKED from PUBLIC, anon, authenticated; GRANTED to service_role.
-- 4. public.delete_room_availability_block (2 arguments):
--    - Dedicated RPC to delete manual room availability blocks under room-first locking hierarchy:
--        1. Read block to identify target room unit.
--        2. Lock room row FOR UPDATE (Concurrency Anchor matching set_room_availability_block).
--        3. Re-read and lock availability block FOR UPDATE.
--        4. Revalidate block belongs to target locked room unit.
--        5. Authorize actor via is_platform_admin_for_user(p_actor_user_id) or host/manager check.
--        6. Delete block.
--        7. Insert audit event into public.admin_audit_log (action = 'property_moderated',
--           target_type = 'property', details -> operation: 'availability_block_removed').
--    - Direct EXECUTE REVOKED from PUBLIC, anon, authenticated; GRANTED to service_role.
-- 5. public.respond_to_stay_booking (4 arguments):
--    - Evaluates actor via is_platform_admin_for_user(p_actor_user_id).
--    - Locks booking row FOR UPDATE, then room_units FOR UPDATE (strict lock hierarchy).
--    - Explicitly validates p_action IS NOT NULL and in ('confirm','decline','cancel'),
--      preventing SQL 3VL bypass into cancellation fallback.
--    - Strengthened booking confirmation pre-flight checks: validates property is approved
--      and published, room unit is active, booking property matches room property, guest count
--      does not exceed room capacity, and dates are valid (check_in >= current_date, check_out > check_in).
--    - Zero-commission default: In the absence of an active, valid, and demonstrably accepted
--      host agreement, commission is strictly 0.00% and host payout estimate equals the full booking total.
--    - Agreement resolution query matches active accepted agreements applicable to booking check_in dates.
--    - Direct EXECUTE REVOKED from PUBLIC, anon, authenticated; GRANTED to service_role.
-- 6. Room availability blocks access & sanitized public view:
--    - Direct table writes (INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES) REVOKED on
--      public.room_availability_blocks from authenticated, anon, PUBLIC, AND service_role.
--    - Direct table SELECT REVOKED from anon and PUBLIC to prevent leakage of internal block reasons,
--      creator user IDs, or administrative operational notes.
--    - Sanitized view public.public_room_availability created and granted to anon, authenticated,
--      service_role, exposing strictly room_unit_id, blocked_from, and blocked_until.
--    - Authenticated SELECT policy preserves full operational visibility for hosts, managers, and admins.
-- 7. Manual block exclusion constraint room_availability_blocks_no_overlapping_dates
--    scoped via conrelid = 'public.room_availability_blocks'::regclass.
-- 8. Audit log append-only immutability:
--    - Explicit INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES revoked from client roles.
--    - Structural/tampering privileges (UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES) revoked from service_role.
--    - SELECT and INSERT strictly granted to service_role.
--    - UPDATE/DELETE row trigger and TRUNCATE statement trigger enforced with safe search_path.
-- 9. Host commercial agreements write path secured & lifecycle integrity enforced:
--    - terms_digest column added to public.host_agreements for 64-char SHA-256 digest storage.
--    - Direct INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES revoked from client roles.
--    - Structural privileges (TRUNCATE, TRIGGER, REFERENCES) revoked from service_role.
--    - Explicit ALTER TABLE ... ENABLE ROW LEVEL SECURITY; and GRANT SELECT ... TO authenticated.
--    - Authenticated SELECT RLS policy restricted to property hosts, designated signatories, and admins.
--    - Draft-only INSERT trigger: enforce_host_agreement_draft_on_insert() guarantees new
--      agreements strictly enter as unaccepted drafts (agreement_status = 'draft', accepted_at IS NULL,
--      terms_digest IS NULL). Direct insertion of active/accepted agreements is blocked.
--    - Canonical digest calculation: public.calculate_host_agreement_digest() implements trusted
--      server/database-side canonical serialization and SHA-256 calculation.
--    - Agreement acceptance verification: enforce_host_agreement_immutability() recomputes the expected
--      digest from stored terms and mandates byte-for-byte match with NEW.terms_digest, preventing
--      client-supplied arbitrary digests. Signatory must be authorized for the property.
--    - Strict lifecycle state transitions enforced:
--        * draft -> active (only with valid acceptance and verified digest) or terminated
--        * active -> superseded or terminated
--        * superseded -> terminal state (no updates or reactivation allowed)
--        * terminated -> terminal state (no updates or reactivation allowed)
--    - Post-acceptance immutability trigger preventing silent mutation of terms, digest, and timestamps.
--    - Deletion protection trigger preventing removal of accepted agreements (drafts may be deleted).
--    - Statement-level TRUNCATE protection trigger preventing table truncation.
-- 10. Commercial agreement resolution in respond_to_stay_booking handles designated
--     authorized signatories and properties with host_id IS NULL (e.g. Yash Home Stay).
-- 11. Safe post-commit recovery and forward-fix procedure that strictly preserves
--     all restricted RPC permissions and never restores insecure client privileges.
-- ==============================================================================
-- ------------------------------------------------------------------------------
-- 1. INTERNAL PLATFORM ADMIN HELPER (SERVICE_ROLE ONLY)
-- ------------------------------------------------------------------------------
-- Authoritative check: Evaluates explicit administrator provisioning in
-- public.platform_admins as the SOLE authoritative source.
-- Raw app metadata, user metadata, email allowlists, and first-user assumptions are strictly removed.
-- Restricted to service_role to prevent untrusted callers from probing user privileges.
CREATE OR REPLACE FUNCTION public.is_platform_admin_for_user(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
declare
  v_is_admin boolean := false;
begin
  if p_user_id is null then
    return false;
  end if;

  -- Sole authoritative source: explicit entry in public.platform_admins
  select exists (
    select 1 from public.platform_admins pa
    where pa.user_id = p_user_id
      and pa.role in ('admin', 'superadmin', 'platform_admin')
  ) into v_is_admin;

  return coalesce(v_is_admin, false);
end;
$$;

REVOKE ALL ON FUNCTION public.is_platform_admin_for_user(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_platform_admin_for_user(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.is_platform_admin_for_user(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin_for_user(uuid) TO service_role;

-- ------------------------------------------------------------------------------
-- 2. COMPATIBLE ZERO-ARGUMENT IS_PLATFORM_ADMIN WRAPPER (FOR RLS CALLERS)
-- ------------------------------------------------------------------------------
-- Retains zero-argument signature expected by existing RLS policies on
-- properties, room_units, and destinations. Evaluates caller's ambient auth.uid()
-- through the internal helper. Obsolete email-based checks are removed.
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
declare
  v_uid uuid;
begin
  v_uid := (SELECT auth.uid());
  if v_uid is null then
    return false;
  end if;
  return public.is_platform_admin_for_user(v_uid);
end;
$$;

GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO service_role;

-- ------------------------------------------------------------------------------
-- 2B. PLATFORM_ADMINS REGISTRY TAMPER-PROOFING
-- ------------------------------------------------------------------------------
-- Verify that ordinary users cannot insert, update, or delete administrator records.
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.platform_admins FROM PUBLIC;
REVOKE ALL ON TABLE public.platform_admins FROM anon;
REVOKE ALL ON TABLE public.platform_admins FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON TABLE public.platform_admins FROM service_role;
GRANT SELECT ON TABLE public.platform_admins TO service_role;

-- ------------------------------------------------------------------------------
-- 3. SET_ROOM_AVAILABILITY_BLOCK (6-ARGUMENT IDENTITY SIGNATURE)
-- ------------------------------------------------------------------------------
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
AS $$
declare
  v_room public.room_units%rowtype;
  v_property public.properties%rowtype;
  v_existing_block public.room_availability_blocks%rowtype;
  v_is_admin boolean := false;
  v_is_authorized_manager boolean := false;
  v_conflicts integer := 0;
  v_result_id uuid;
begin
  if p_room_unit_id is null or p_actor_user_id is null then
    raise exception 'Invalid availability block parameters.';
  end if;

  -- Concurrency Anchor: Lock the room row first
  select * into v_room from public.room_units where id = p_room_unit_id for update;
  if not found then
    raise exception 'Room unit not found.';
  end if;

  select * into v_property from public.properties where id = v_room.property_id;
  if not found then
    raise exception 'Associated property not found.';
  end if;

  -- Authorize verified actor UUID via internal helper
  select public.is_platform_admin_for_user(p_actor_user_id) into v_is_admin;
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

    -- Audit log for block creation within same transaction
    insert into public.admin_audit_log(actor_user_id, action, target_type, target_id, details)
    values (
      p_actor_user_id,
      'property_moderated',
      'property',
      v_property.id,
      jsonb_build_object(
        'operation', 'availability_block_created',
        'block_id', v_result_id,
        'room_unit_id', p_room_unit_id,
        'property_id', v_property.id,
        'blocked_from', p_blocked_from,
        'blocked_until', p_blocked_until,
        'reason', btrim(p_reason)
      )
    );

    return jsonb_build_object('success', true, 'action', 'created', 'block_id', v_result_id);
  else
    -- Concurrency anchor: Lock the existing block FOR UPDATE
    select * into v_existing_block from public.room_availability_blocks
    where id = p_block_id and room_unit_id = p_room_unit_id for update;

    -- Strict validation: verify block exists and belongs to target room
    if not found then
      raise exception 'Availability block not found or does not belong to the specified room unit.';
    end if;

    update public.room_availability_blocks
    set blocked_from = p_blocked_from,
        blocked_until = p_blocked_until,
        reason = btrim(p_reason)
    where id = p_block_id and room_unit_id = p_room_unit_id;

    -- Audit log for block modification within same transaction
    insert into public.admin_audit_log(actor_user_id, action, target_type, target_id, details)
    values (
      p_actor_user_id,
      'property_moderated',
      'property',
      v_property.id,
      jsonb_build_object(
        'operation', 'availability_block_updated',
        'block_id', p_block_id,
        'room_unit_id', p_room_unit_id,
        'property_id', v_property.id,
        'previous', jsonb_build_object(
          'blocked_from', v_existing_block.blocked_from,
          'blocked_until', v_existing_block.blocked_until,
          'reason', v_existing_block.reason
        ),
        'new', jsonb_build_object(
          'blocked_from', p_blocked_from,
          'blocked_until', p_blocked_until,
          'reason', btrim(p_reason)
        )
      )
    );

    return jsonb_build_object('success', true, 'action', 'updated', 'block_id', p_block_id);
  end if;
end;
$$;

-- Revoke direct execution from client roles; grant only to service_role
REVOKE ALL ON FUNCTION public.set_room_availability_block(
  uuid, date, date, text, uuid, uuid
) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.set_room_availability_block(
  uuid, date, date, text, uuid, uuid
) FROM anon;

REVOKE ALL ON FUNCTION public.set_room_availability_block(
  uuid, date, date, text, uuid, uuid
) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.set_room_availability_block(
  uuid, date, date, text, uuid, uuid
) TO service_role;

-- ------------------------------------------------------------------------------
-- 4. DELETE_ROOM_AVAILABILITY_BLOCK (2-ARGUMENT IDENTITY SIGNATURE)
-- ------------------------------------------------------------------------------
-- Implements safe room-first locking hierarchy matching set_room_availability_block
-- and respond_to_stay_booking to eliminate concurrency collisions and race conditions.
CREATE OR REPLACE FUNCTION public.delete_room_availability_block(
  p_block_id uuid,
  p_actor_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
declare
  v_initial_block public.room_availability_blocks%rowtype;
  v_block public.room_availability_blocks%rowtype;
  v_room public.room_units%rowtype;
  v_property public.properties%rowtype;
  v_is_admin boolean := false;
  v_is_authorized_manager boolean := false;
begin
  if p_block_id is null or p_actor_user_id is null then
    raise exception 'Invalid delete block parameters.';
  end if;

  -- 1. Read the block to identify its room unit
  select * into v_initial_block from public.room_availability_blocks where id = p_block_id;
  if not found then
    raise exception 'Availability block not found.';
  end if;

  -- 2. Concurrency Anchor: Lock the room row FOR UPDATE first (hierarchical lock order)
  select * into v_room from public.room_units where id = v_initial_block.room_unit_id for update;
  if not found then
    raise exception 'Room unit not found.';
  end if;

  -- 3. Re-read and lock the availability block FOR UPDATE
  select * into v_block from public.room_availability_blocks where id = p_block_id for update;
  if not found then
    raise exception 'Availability block was removed by a concurrent transaction.';
  end if;

  -- 4. Revalidate that the block still belongs to the locked room
  if v_block.room_unit_id <> v_room.id then
    raise exception 'Availability block unit mismatch during lock acquisition.';
  end if;

  -- 5. Fetch associated property and revalidate actor permissions
  select * into v_property from public.properties where id = v_room.property_id;
  if not found then
    raise exception 'Associated property not found.';
  end if;

  -- Authorize verified actor UUID via internal helper
  select public.is_platform_admin_for_user(p_actor_user_id) into v_is_admin;
  select (v_property.host_id = p_actor_user_id or exists (
    select 1 from public.property_hosts ph 
    where ph.property_id = v_property.id and ph.user_id = p_actor_user_id and ph.role = 'manager'
  )) into v_is_authorized_manager;

  if not v_is_admin and not coalesce(v_is_authorized_manager, false) then
    raise exception 'Not authorised to delete availability blocks for this property. Only primary hosts, managers, or platform administrators may remove room blocks.';
  end if;

  -- 6. Delete the block
  delete from public.room_availability_blocks where id = p_block_id;

  -- 7. Insert audit event within the same atomic transaction
  -- Strictly complies with admin_audit_log constraints:
  -- action = 'property_moderated' (checked by admin_audit_log_action_check)
  -- target_type = 'property' (checked by admin_audit_log_target_type_check)
  -- target_id = v_property.id
  insert into public.admin_audit_log(actor_user_id, action, target_type, target_id, details)
  values (
    p_actor_user_id,
    'property_moderated',
    'property',
    v_property.id,
    jsonb_build_object(
      'operation', 'availability_block_removed',
      'block_id', p_block_id,
      'room_unit_id', v_block.room_unit_id,
      'property_id', v_property.id,
      'blocked_from', v_block.blocked_from,
      'blocked_until', v_block.blocked_until,
      'reason', v_block.reason
    )
  );

  return jsonb_build_object(
    'success', true,
    'action', 'deleted',
    'block_id', p_block_id
  );
end;
$$;

-- Revoke direct execution from client roles; grant only to service_role
REVOKE ALL ON FUNCTION public.delete_room_availability_block(
  uuid, uuid
) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.delete_room_availability_block(
  uuid, uuid
) FROM anon;

REVOKE ALL ON FUNCTION public.delete_room_availability_block(
  uuid, uuid
) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.delete_room_availability_block(
  uuid, uuid
) TO service_role;

-- ------------------------------------------------------------------------------
-- 5. RESPOND_TO_STAY_BOOKING (4-ARGUMENT IDENTITY SIGNATURE)
-- ------------------------------------------------------------------------------
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
AS $$
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
  v_commission numeric(5,2) := 0.00;
  v_commission_amount numeric(12,2) := 0.00;
begin
  if p_stay_booking_id is null
     or p_actor_user_id is null
     or p_action is null
     or p_action not in ('confirm','decline','cancel') then
    raise exception 'Invalid booking decision request.';
  end if;

  -- 1. Lock the booking row
  select * into v_booking from public.stay_bookings where id = p_stay_booking_id for update;
  if not found then raise exception 'Booking not found.'; end if;

  select * into v_property from public.properties where id = v_booking.property_id;
  if not found then raise exception 'Property not found.'; end if;

  -- 2. Concurrency Anchor: Lock the room row to serialize concurrent actions on this room
  select * into v_room from public.room_units
  where id = v_booking.room_unit_id and property_id = v_booking.property_id for update;
  if not found then raise exception 'Room not found.'; end if;

  -- 3. Authorization check with verified actor UUID
  select public.is_platform_admin_for_user(p_actor_user_id) into v_is_admin;
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
    if v_booking.property_id is distinct from v_room.property_id then
      raise exception 'Booking property ID does not match room unit property ID.';
    end if;
    if v_booking.check_in is null or v_booking.check_out is null or v_booking.check_in < current_date or v_booking.check_out <= v_booking.check_in or v_booking.check_out - v_booking.check_in > 60 then
      raise exception 'Booking dates are invalid.';
    end if;
    if coalesce(v_booking.adults, 1) + coalesce(v_booking.children, 0) > v_room.max_guests then
      raise exception 'Guest count exceeds room capacity.';
    end if;

    select exists (
      select 1 from public.room_availability_blocks b
      where b.room_unit_id = v_booking.room_unit_id
        and b.blocked_from < v_booking.check_out
        and b.blocked_until > v_booking.check_in
    ) into v_has_block;
    if v_has_block then
      raise exception 'Cannot confirm request: This room is marked unavailable by host blocks for the selected dates.';
    end if;

    -- Concurrency check: ONLY confirmed bookings block confirmation
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
    -- Invariant: Must belong to this property, be active, and have verifiable digital acceptance
    -- Applicable check: Agreement must be active for the booking dates
    select * into v_agreement from public.host_agreements ha
    where ha.property_id = v_booking.property_id
      and ha.agreement_status = 'active'
      and ha.accepted_at is not null
      and ha.host_user_id is not null
      and ha.agreement_start <= v_booking.check_in
      and (ha.agreement_end is null or ha.agreement_end >= v_booking.check_in)
    order by (case when v_property.host_id is not null and ha.host_user_id = v_property.host_id then 1 else 2 end),
             ha.agreement_start desc,
             ha.created_at desc
    limit 1;

    v_commission := 0.00;
    v_commission_amount := 0.00;
    if found and v_agreement.id is not null then
      if v_agreement.intro_period_months is not null and v_agreement.intro_commission_percent is not null and v_agreement.standard_commission_percent is not null then
        if v_booking.check_in < (v_agreement.agreement_start + make_interval(months => v_agreement.intro_period_months))::date then
          v_commission := v_agreement.intro_commission_percent;
        else
          v_commission := v_agreement.standard_commission_percent;
        end if;
      elsif v_agreement.standard_commission_percent is not null then
        v_commission := v_agreement.standard_commission_percent;
      elsif v_agreement.commission_percent is not null then
        v_commission := v_agreement.commission_percent;
      else
        v_commission := 0.00;
      end if;
      v_commission_amount := round(coalesce(v_booking.total_estimate, 0) * coalesce(v_commission, 0) / 100, 2);
    else
      -- No active, valid, and accepted host agreement:
      -- Strictly 0% Uttarkunth commission, 0 commission amount
      v_commission := 0.00;
      v_commission_amount := 0.00;
      v_agreement.id := null;
    end if;

    v_new_status := 'confirmed';
    update public.stay_bookings
    set status = v_new_status,
        host_notes = coalesce(nullif(btrim(p_host_notes),''), host_notes),
        agreement_id = v_agreement.id,
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

  elsif p_action = 'cancel' then
    v_new_status := 'cancelled';
    update public.stay_bookings
    set status = v_new_status,
        updated_at = now()
    where id = v_booking.id;
  else
    raise exception 'Invalid booking decision request.';
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
    'commission_amount_snapshot', v_commission_amount,
    'host_payout_estimate', round(coalesce(v_booking.total_estimate, 0) - coalesce(v_commission_amount, 0), 2)
  );
end;
$$;

-- Revoke direct execution from client roles; grant only to service_role
REVOKE ALL ON FUNCTION public.respond_to_stay_booking(
  uuid, text, uuid, text
) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.respond_to_stay_booking(
  uuid, text, uuid, text
) FROM anon;

REVOKE ALL ON FUNCTION public.respond_to_stay_booking(
  uuid, text, uuid, text
) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.respond_to_stay_booking(
  uuid, text, uuid, text
) TO service_role;

-- ------------------------------------------------------------------------------
-- 5B. HISTORICAL CONFIRMED BOOKING SNAPSHOT PROTECTION TRIGGER
-- ------------------------------------------------------------------------------
-- Guarantees that once a booking reaches 'confirmed' status, its commercial snapshots
-- (agreement_id, commission_percent_snapshot, commission_amount_snapshot, total_estimate)
-- and stay parameters (dates, room, property) cannot be silently mutated by any role.
-- Also guarantees:
--   - Cancelled and declined bookings are in permanent terminal states and cannot be re-confirmed.
--   - Snapshots remain immutable even if the booking transitions to or remains 'cancelled'.
--   - Host payout estimate is derived: host_payout_estimate = round(total_estimate - commission_amount_snapshot, 2).
--     By permanently locking total_estimate and commission_amount_snapshot immutably,
--     the derived host payout estimate is mathematically frozen and cannot diverge.
CREATE OR REPLACE FUNCTION public.protect_confirmed_booking_snapshots()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- 1. Status lifecycle invariants: terminal states cannot be reactivated or re-confirmed
  IF OLD.status = 'cancelled' AND NEW.status IS DISTINCT FROM 'cancelled' THEN
    RAISE EXCEPTION 'Cancelled bookings are in a terminal state and cannot be reactivated or modified (Booking ID: %, Ref: %).',
      OLD.id, OLD.booking_reference
      USING ERRCODE = '55000'; -- object_not_modifiable
  END IF;

  IF OLD.status = 'declined' AND NEW.status IS DISTINCT FROM 'declined' THEN
    RAISE EXCEPTION 'Declined bookings are in a terminal state and cannot be reactivated or modified (Booking ID: %, Ref: %).',
      OLD.id, OLD.booking_reference
      USING ERRCODE = '55000';
  END IF;

  -- 2. Snapshot immutability: applies to confirmed bookings and cancelled bookings that were confirmed
  IF OLD.status IN ('confirmed', 'cancelled') THEN
    IF OLD.agreement_id IS DISTINCT FROM NEW.agreement_id
       OR OLD.commission_percent_snapshot IS DISTINCT FROM NEW.commission_percent_snapshot
       OR OLD.commission_amount_snapshot IS DISTINCT FROM NEW.commission_amount_snapshot
       OR OLD.total_estimate IS DISTINCT FROM NEW.total_estimate
       OR OLD.room_unit_id IS DISTINCT FROM NEW.room_unit_id
       OR OLD.property_id IS DISTINCT FROM NEW.property_id
       OR OLD.check_in IS DISTINCT FROM NEW.check_in
       OR OLD.check_out IS DISTINCT FROM NEW.check_out
    THEN
      RAISE EXCEPTION 'Historical commercial snapshot of a confirmed booking is immutable (Booking ID: %, Ref: %). Commercial terms and stay dates cannot be modified after confirmation.',
        OLD.id, OLD.booking_reference
        USING ERRCODE = '55000'; -- object_not_modifiable
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_confirmed_booking_snapshots ON public.stay_bookings;
CREATE TRIGGER trg_protect_confirmed_booking_snapshots
BEFORE UPDATE ON public.stay_bookings
FOR EACH ROW
EXECUTE FUNCTION public.protect_confirmed_booking_snapshots();

-- ------------------------------------------------------------------------------
-- 6. REVOKE DIRECT WRITES & SECURE AVAILABILITY DATA EXPOSURE
-- ------------------------------------------------------------------------------
-- Direct table mutations are revoked from client roles AND service_role.
-- Direct table SELECT is revoked from anon and PUBLIC to prevent anonymous exposure
-- of internal block reasons, creator IDs, or staff operational notes.
REVOKE ALL ON TABLE public.room_availability_blocks FROM anon, PUBLIC;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON TABLE public.room_availability_blocks FROM authenticated, service_role;
GRANT SELECT ON TABLE public.room_availability_blocks TO authenticated, service_role;

DROP POLICY IF EXISTS "Primary hosts can insert availability blocks" ON public.room_availability_blocks;
DROP POLICY IF EXISTS "Primary hosts can update availability blocks" ON public.room_availability_blocks;
DROP POLICY IF EXISTS "Primary hosts can delete availability blocks" ON public.room_availability_blocks;
DROP POLICY IF EXISTS "Primary hosts can view their availability blocks" ON public.room_availability_blocks;
DROP POLICY IF EXISTS "Authorized hosts and admins can view availability blocks" ON public.room_availability_blocks;

CREATE POLICY "Authorized hosts and admins can view availability blocks"
ON public.room_availability_blocks
FOR SELECT
TO authenticated
USING (
  public.is_platform_admin()
  OR EXISTS (
    SELECT 1 FROM public.room_units r
    JOIN public.properties p ON p.id = r.property_id
    LEFT JOIN public.property_hosts ph ON ph.property_id = p.id AND ph.user_id = (SELECT auth.uid())
    WHERE r.id = room_availability_blocks.room_unit_id
      AND (p.host_id = (SELECT auth.uid()) OR ph.role IN ('manager', 'co_host'))
  )
);

-- Sanitized Public Availability View:
-- Exposes ONLY room_unit_id and date boundaries (blocked_from, blocked_until)
-- Strictly filters to active room units belonging to approved and published properties
-- Strictly hides internal block reasons, creator IDs, operational notes, and audit timestamps from public view
CREATE OR REPLACE VIEW public.public_room_availability
WITH (security_invoker = false)
AS
SELECT
  b.room_unit_id,
  b.blocked_from,
  b.blocked_until
FROM public.room_availability_blocks b
JOIN public.room_units r ON r.id = b.room_unit_id
JOIN public.properties p ON p.id = r.property_id
WHERE r.active = true
  AND p.published = true
  AND p.moderation_status = 'approved';

ALTER VIEW public.public_room_availability OWNER TO postgres;

REVOKE ALL ON public.public_room_availability FROM PUBLIC;
GRANT SELECT ON public.public_room_availability TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 7. MANUAL BLOCK OVERLAP PROTECTION (SCOPED GIST EXCLUSION CONSTRAINT)
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.room_availability_blocks'::regclass
      AND conname = 'room_availability_blocks_no_overlapping_dates'
  ) THEN
    ALTER TABLE public.room_availability_blocks
    ADD CONSTRAINT room_availability_blocks_no_overlapping_dates
    EXCLUDE USING gist (
      room_unit_id WITH =,
      daterange(blocked_from, blocked_until, '[)') WITH &&
    );
  END IF;
END $$;

-- ------------------------------------------------------------------------------

COMMIT;
