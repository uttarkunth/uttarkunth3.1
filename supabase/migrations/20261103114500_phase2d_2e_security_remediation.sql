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

BEGIN;

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

-- ==============================================================================
-- SAFE TRANSACTION FAILURE & POST-COMMIT RECOVERY / FORWARD-FIX PROCEDURES
-- ==============================================================================
-- 1. TRANSACTION FAILURE BEHAVIOUR:
--    This migration is executed entirely within a single atomic transaction block
--    (BEGIN ... COMMIT). If any error, constraint collision, or privilege failure
--    occurs during execution, PostgreSQL automatically executes an immediate,
--    unconditional ROLLBACK. Zero database changes or partial states are persisted.
--
-- 2. SAFE POST-COMMIT RECOVERY & FORWARD-FIX PROCEDURES:
--    In the event of an operational issue following successful commit, recovery
--    MUST adhere strictly to security-preserving forward-fix principles.
--    NEVER re-grant EXECUTE privileges on sensitive RPCs to authenticated,
--    anon, or PUBLIC, as doing so reopens the actor impersonation vulnerability.
--
--    A. SERVICE_ROLE DIRECT MUTATION ISOLATION:
--       Direct write operations on room_availability_blocks are revoked from
--       service_role, enforcing 100% RPC-mediated mutation. If emergency bulk
--       administrative operations are required, the superuser (postgres) executes
--       them directly via migration scripts or authenticated psql sessions.
--
--    B. EXCLUSION CONSTRAINT MAINTENANCE:
--       If the GiST exclusion constraint on room_availability_blocks requires
--       temporary index maintenance or adjustment, execute:
--       ALTER TABLE public.room_availability_blocks
--         DROP CONSTRAINT IF EXISTS room_availability_blocks_no_overlapping_dates;
--       (Do NOT re-grant direct DELETE privileges to authenticated or anon).
--
--    C. AVAILABILITY RPC OR BOOKING DECISION FORWARD-FIX:
--       If the RPC implementation requires logic adjustments, deploy a revised
--       CREATE OR REPLACE FUNCTION. Ensure permissions remain strictly:
--       REVOKE ALL ON FUNCTION public.set_room_availability_block(uuid, date, date, text, uuid, uuid) FROM PUBLIC, anon, authenticated;
--       GRANT EXECUTE ON FUNCTION public.set_room_availability_block(uuid, date, date, text, uuid, uuid) TO service_role;
--       REVOKE ALL ON FUNCTION public.delete_room_availability_block(uuid, uuid) FROM PUBLIC, anon, authenticated;
--       GRANT EXECUTE ON FUNCTION public.delete_room_availability_block(uuid, uuid) TO service_role;
--       REVOKE ALL ON FUNCTION public.respond_to_stay_booking(uuid, text, uuid, text) FROM PUBLIC, anon, authenticated;
--       GRANT EXECUTE ON FUNCTION public.respond_to_stay_booking(uuid, text, uuid, text) TO service_role;
--
--    D. ADMIN HELPER INTEGRITY:
--       Do NOT drop public.is_platform_admin_for_user(uuid) while the zero-argument
--       public.is_platform_admin() wrapper or any RLS policies depend on it.
--       If authorization logic needs updates, replace both functions atomically.
--
--    E. AUDIT LOG & AGREEMENT IMMUTABILITY MAINTENANCE:
--       If maintenance requires disabling append-only triggers, perform it only
--       as postgres superuser in an explicit transaction and re-enable immediately:
--       ALTER TABLE public.admin_audit_log DISABLE TRIGGER trg_prevent_audit_log_row_mutation;
--       -- [Perform verified administrative correction]
--       ALTER TABLE public.admin_audit_log ENABLE TRIGGER trg_prevent_audit_log_row_mutation;
-- ==============================================================================
