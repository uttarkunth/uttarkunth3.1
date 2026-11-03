-- ==============================================================================
-- Uttarkunth Phase 2D: Host Workspace, Concurrency Controls & Co-Host Model
-- Date: 2026-11-02
-- Objectives:
-- 1. Database-level room lock and concurrency for booking decisions & availability blocks
-- 2. Reconcile respond_to_stay_booking: only confirmed bookings block availability
-- 3. Room-level atomic lock for manage_room_availability_block to prevent overlaps
-- 4. Co-host role on property_hosts with admin-only assignment
-- 5. Safe operational vs structural property moderation separation
-- 6. Consistent RLS across properties, rooms, bookings, and blocks
-- ==============================================================================

-- 1. Ensure platform admin parity across database and TypeScript
create or replace function public.is_platform_admin()
returns boolean
language sql
stable
set search_path to ''
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    or lower(coalesce(auth.jwt() ->> 'email', '')) in ('gauravnegi748@gmail.com', 'info@uttarkunth.com', 'uttarkunth@gmail.com')
    or exists (select 1 from public.platform_admins pa where pa.user_id = auth.uid() and pa.role = 'admin'),
    false
  );
$$;

-- 2. Co-host authorization column on property_hosts
alter table public.property_hosts
  add column if not exists role text not null default 'co_host' check (role in ('co_host', 'manager'));

-- 3. Concurrency Strategy: Reconcile respond_to_stay_booking
create or replace function public.respond_to_stay_booking(
  p_stay_booking_id uuid,
  p_action text,
  p_actor_user_id uuid,
  p_host_notes text default null::text
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_booking public.stay_bookings%rowtype;
  v_property public.properties%rowtype;
  v_room public.room_units%rowtype;
  v_agreement public.host_agreements%rowtype;
  v_is_admin boolean := false;
  v_is_host boolean := false;
  v_has_block boolean := false;
  v_conflicts integer := 0;
  v_new_status text;
  v_commission numeric(5,2);
  v_commission_amount numeric(12,2);
begin
  if p_stay_booking_id is null or p_actor_user_id is null or p_action not in ('confirm','decline','cancel') then
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

  -- 3. Authorization check (Primary host, co-host/manager, or platform admin)
  select public.is_platform_admin() into v_is_admin;
  select (v_property.host_id = p_actor_user_id or exists (
    select 1 from public.property_hosts ph where ph.property_id = v_property.id and ph.user_id = p_actor_user_id
  )) into v_is_host;

  if not v_is_admin and not coalesce(v_is_host, false) then
    raise exception 'Not authorised to decide this booking.';
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
      raise exception 'Room is blocked for these dates.';
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

-- 4. Concurrency Strategy: Atomic room availability block manager
create or replace function public.manage_room_availability_block(
  p_room_unit_id uuid,
  p_blocked_from date,
  p_blocked_until date,
  p_reason text,
  p_actor_user_id uuid,
  p_block_id uuid default null,
  p_action text default 'create'
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_room public.room_units%rowtype;
  v_property public.properties%rowtype;
  v_is_admin boolean := false;
  v_is_host boolean := false;
  v_conflicts integer := 0;
  v_result_id uuid;
begin
  if p_room_unit_id is null or p_actor_user_id is null or p_action not in ('create','update','delete') then
    raise exception 'Invalid availability block parameters.';
  end if;

  -- 1. Acquire room-level lock FOR UPDATE
  select * into v_room from public.room_units where id = p_room_unit_id for update;
  if not found then
    raise exception 'Room unit not found.';
  end if;

  select * into v_property from public.properties where id = v_room.property_id;
  if not found then
    raise exception 'Associated property not found.';
  end if;

  -- 2. Authorization check
  select public.is_platform_admin() into v_is_admin;
  select (v_property.host_id = p_actor_user_id or exists (
    select 1 from public.property_hosts ph where ph.property_id = v_property.id and ph.user_id = p_actor_user_id
  )) into v_is_host;

  if not v_is_admin and not coalesce(v_is_host, false) then
    raise exception 'Not authorised to manage availability for this property.';
  end if;

  -- Delete action
  if p_action = 'delete' then
    if p_block_id is null then
      raise exception 'Block ID is required for deletion.';
    end if;
    delete from public.room_availability_blocks
      where id = p_block_id and room_unit_id = p_room_unit_id;
    return jsonb_build_object('success', true, 'action', 'deleted', 'block_id', p_block_id);
  end if;

  -- Validate dates
  if p_blocked_from is null or p_blocked_until is null or p_blocked_until <= p_blocked_from then
    raise exception 'Invalid date range: blocked_until must be after blocked_from.';
  end if;

  -- 3. Check for overlapping confirmed reservations inside the transaction
  select count(*) into v_conflicts from public.stay_bookings
    where room_unit_id = p_room_unit_id
      and status = 'confirmed'
      and check_in < p_blocked_until
      and check_out > p_blocked_from;

  if v_conflicts > 0 then
    raise exception 'Cannot block room: dates conflict with an existing confirmed reservation.';
  end if;

  -- 4. Execute create or update
  if p_action = 'create' then
    insert into public.room_availability_blocks (
      room_unit_id, blocked_from, blocked_until, reason, created_by
    )
    values (
      p_room_unit_id, p_blocked_from, p_blocked_until, btrim(p_reason), p_actor_user_id
    )
    returning id into v_result_id;

    return jsonb_build_object('success', true, 'action', 'created', 'block_id', v_result_id);
  elsif p_action = 'update' then
    if p_block_id is null then
      raise exception 'Block ID is required for update.';
    end if;

    update public.room_availability_blocks
    set blocked_from = p_blocked_from,
        blocked_until = p_blocked_until,
        reason = btrim(p_reason)
    where id = p_block_id and room_unit_id = p_room_unit_id;

    return jsonb_build_object('success', true, 'action', 'updated', 'block_id', p_block_id);
  end if;

  return jsonb_build_object('success', false, 'error', 'Unhandled action.');
end;
$function$;

-- 5. Safe Separation of Structural vs Operational Property Changes
create or replace function public.enforce_property_ownership_and_moderation()
returns trigger
language plpgsql
set search_path to ''
as $function$
declare
  v_admin boolean := false;
  v_structural_change boolean := false;
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
    new.reviewed_at := null;
    new.reviewed_by := null;
    return new;
  end if;

  -- Check update authorization (Primary host or assigned property co-host)
  if old.host_id is distinct from auth.uid() and not exists (
    select 1 from public.property_hosts ph where ph.property_id = old.id and ph.user_id = auth.uid()
  ) then
    raise exception 'You are not authorised to modify this property.';
  end if;

  -- Protect ownership: host_id can never be changed by host
  if new.host_id is distinct from old.host_id then
    raise exception 'Property ownership cannot be changed by a host.';
  end if;

  -- Structural changes that affect authenticity or identity trigger administrative re-review
  v_structural_change :=
       new.name is distinct from old.name
    or new.slug is distinct from old.slug
    or new.address is distinct from old.address
    or new.village is distinct from old.village
    or new.district is distinct from old.district
    or new.state is distinct from old.state
    or new.latitude is distinct from old.latitude
    or new.longitude is distinct from old.longitude
    or new.property_type is distinct from old.property_type;

  if v_structural_change then
    -- Structural changes require re-moderation
    new.published := false;
    new.moderation_status := 'pending';
    new.moderation_notes := 'Structural details updated by host; pending admin review';
    new.reviewed_at := null;
    new.reviewed_by := null;
  else
    -- Operational updates (e.g. amenities, check-in instructions, photos, house rules)
    -- preserve current publication and moderation state
    new.published := old.published;
    new.moderation_status := old.moderation_status;
    new.moderation_notes := old.moderation_notes;
    new.reviewed_at := old.reviewed_at;
    new.reviewed_by := old.reviewed_by;
  end if;

  return new;
end;
$function$;

-- 6. Reconcile RLS Policies
-- Drop the restrictive policy that was blocking legitimate co-hosts and reads
drop policy if exists "Restrict direct property table reads" on public.properties;

-- Properties policies
drop policy if exists "Hosts manage their own properties" on public.properties;
create policy "Hosts and co-hosts manage their properties"
  on public.properties
  for all
  to authenticated
  using (
    host_id = auth.uid()
    or exists (select 1 from public.property_hosts ph where ph.property_id = properties.id and ph.user_id = auth.uid())
    or is_platform_admin()
  )
  with check (
    host_id = auth.uid()
    or exists (select 1 from public.property_hosts ph where ph.property_id = properties.id and ph.user_id = auth.uid())
    or is_platform_admin()
  );

-- Room units policies
drop policy if exists "Hosts manage room units for their own properties" on public.room_units;
create policy "Hosts and co-hosts manage room units for their properties"
  on public.room_units
  for all
  to authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = room_units.property_id
        and (p.host_id = auth.uid() or exists (
          select 1 from public.property_hosts ph where ph.property_id = p.id and ph.user_id = auth.uid()
        ) or is_platform_admin())
    )
  )
  with check (
    exists (
      select 1 from public.properties p
      where p.id = room_units.property_id
        and (p.host_id = auth.uid() or exists (
          select 1 from public.property_hosts ph where ph.property_id = p.id and ph.user_id = auth.uid()
        ) or is_platform_admin())
    )
  );

-- Stay bookings policies
drop policy if exists "Primary hosts can view their stay bookings" on public.stay_bookings;
create policy "Hosts and co-hosts can view their stay bookings"
  on public.stay_bookings
  for select
  to authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = stay_bookings.property_id
        and (p.host_id = auth.uid() or exists (
          select 1 from public.property_hosts ph where ph.property_id = p.id and ph.user_id = auth.uid()
        ) or is_platform_admin())
    )
    or guest_user_id = auth.uid()
    or guest_email = (select auth.jwt() ->> 'email')
  );

-- Room availability blocks policies
drop policy if exists "Primary hosts can view their availability blocks" on public.room_availability_blocks;
create policy "Hosts and co-hosts can view availability blocks"
  on public.room_availability_blocks
  for select
  to authenticated
  using (
    exists (
      select 1 from public.room_units r
      join public.properties p on p.id = r.property_id
      where r.id = room_availability_blocks.room_unit_id
        and (p.host_id = auth.uid() or exists (
          select 1 from public.property_hosts ph where ph.property_id = p.id and ph.user_id = auth.uid()
        ) or is_platform_admin())
    )
  );

drop policy if exists "Primary hosts can insert availability blocks" on public.room_availability_blocks;
create policy "Hosts and co-hosts can insert availability blocks"
  on public.room_availability_blocks
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.room_units r
      join public.properties p on p.id = r.property_id
      where r.id = room_availability_blocks.room_unit_id
        and (p.host_id = auth.uid() or exists (
          select 1 from public.property_hosts ph where ph.property_id = p.id and ph.user_id = auth.uid()
        ) or is_platform_admin())
    )
  );

drop policy if exists "Primary hosts can delete availability blocks" on public.room_availability_blocks;
create policy "Hosts and co-hosts can delete availability blocks"
  on public.room_availability_blocks
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.room_units r
      join public.properties p on p.id = r.property_id
      where r.id = room_availability_blocks.room_unit_id
        and (p.host_id = auth.uid() or exists (
          select 1 from public.property_hosts ph where ph.property_id = p.id and ph.user_id = auth.uid()
        ) or is_platform_admin())
    )
  );
