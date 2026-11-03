-- Uttarkunth Stays — listing review lifecycle
-- STATUS: PROPOSED. Not applied by the local package. Review, back up the project, then run once in the
--         Supabase SQL editor. Safe to re-run. No table is dropped or renamed; the only existing-data change
--         is step 2's backfill (already-published listings become review_status = 'approved').
--
-- Keeps these concepts separate:
--   account email verification  -> auth.users.email_confirmed_at   (unchanged)
--   host/property review        -> properties.review_status + property_review_checks
--   publication                 -> properties.published            (only reachable through approval)
--   booking status              -> stay_bookings.status            (unchanged)

begin;

-- 1. Trusted admin role. Readable only by the server (service_role). Rows are added by the project owner
--    in the SQL editor (see the commented statement at the bottom) — never from the browser.
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now(),
  note       text
);
alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to service_role;

-- 2. Review state on properties.
alter table public.properties
  add column if not exists review_status text not null default 'draft',
  add column if not exists review_reason text,
  add column if not exists submitted_at  timestamptz,
  add column if not exists reviewed_at   timestamptz,
  add column if not exists reviewed_by   uuid references auth.users(id) on delete set null;

alter table public.properties drop constraint if exists properties_review_status_check;
alter table public.properties add constraint properties_review_status_check
  check (review_status in ('draft','pending_review','changes_requested','approved','rejected'));

-- Listings that are public today stay public: they are treated as already approved.
update public.properties set review_status = 'approved'
 where published is true and review_status = 'draft';

-- Database-level guarantee: nothing can be public unless it is approved.
alter table public.properties drop constraint if exists properties_published_requires_approval;
alter table public.properties add constraint properties_published_requires_approval
  check (published is not true or review_status = 'approved');

-- 3. The four checks shown in the Listing Moderation design. Defaults mean "not yet checked":
--    nothing is ever pre-marked verified.
create table if not exists public.property_review_checks (
  property_id      uuid primary key references public.properties(id) on delete cascade,
  identity_status  text not null default 'pending'      check (identity_status  in ('pending','verified','failed')),
  ownership_status text not null default 'not_reviewed' check (ownership_status in ('not_reviewed','verified','failed')),
  agreement_status text not null default 'not_accepted' check (agreement_status in ('not_accepted','accepted')),
  location_status  text not null default 'not_set'      check (location_status  in ('not_set','set','unclear')),
  updated_by       uuid references auth.users(id) on delete set null,
  updated_at       timestamptz not null default now()
);
alter table public.property_review_checks enable row level security;
revoke all on public.property_review_checks from anon, authenticated;
grant select, insert, update on public.property_review_checks to service_role;

-- 4. Moderation history (append-only from the application).
create table if not exists public.property_review_events (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  actor_id    uuid references auth.users(id) on delete set null,
  actor_role  text not null check (actor_role in ('host','admin','system')),
  action      text not null,
  from_status text,
  to_status   text,
  reason      text,
  created_at  timestamptz not null default now()
);
create index if not exists property_review_events_property_idx
  on public.property_review_events (property_id, created_at desc);
alter table public.property_review_events enable row level security;
revoke all on public.property_review_events from anon, authenticated;
grant select, insert on public.property_review_events to service_role;

-- 5. Hosts can never set or change review/publication fields, whatever grants or policies exist.
--    (A column-level REVOKE would not work if a table-level UPDATE grant exists; a trigger always applies.)
create or replace function public.guard_property_review_fields()
returns trigger language plpgsql as $$
begin
  if coalesce(auth.role(), '') in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.published := false;  new.review_status := 'draft';  new.review_reason := null;
      new.submitted_at := null; new.reviewed_at := null;       new.reviewed_by := null;
    else
      new.published := old.published;  new.review_status := old.review_status;
      new.review_reason := old.review_reason; new.submitted_at := old.submitted_at;
      new.reviewed_at := old.reviewed_at;     new.reviewed_by := old.reviewed_by;
      new.host_id := old.host_id;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists guard_property_review_fields on public.properties;
create trigger guard_property_review_fields
  before insert or update on public.properties
  for each row execute function public.guard_property_review_fields();

-- 6. Transactional operations, callable ONLY by the server (service_role). The Netlify functions validate
--    the caller first; these functions make the writes all-or-nothing.

-- 6a. Host submits a property + first room: no orphans, always pending review, never published.
create or replace function public.submit_host_application(p_host uuid, p_property jsonb, p_room jsonb)
returns jsonb language plpgsql as $$
declare v_id uuid;
begin
  insert into public.properties
    (slug, name, address, village, district, state, description, amenities, photos,
     booking_mode, host_id, published, review_status, submitted_at)
  values
    (p_property->>'slug', p_property->>'name', p_property->>'address', p_property->>'village',
     p_property->>'district', p_property->>'state', p_property->>'description',
     (jsonb_populate_record(null::public.properties, jsonb_build_object('amenities', p_property->'amenities'))).amenities,
     (jsonb_populate_record(null::public.properties, jsonb_build_object('photos',    p_property->'photos'))).photos,
     'request', p_host, false, 'pending_review', now())
  returning id into v_id;

  insert into public.room_units (property_id, room_name, description, base_price, max_guests, active)
  values (v_id, p_room->>'room_name', nullif(p_room->>'description',''),
          (p_room->>'base_price')::numeric, (p_room->>'max_guests')::int, true);

  insert into public.property_review_checks (property_id) values (v_id);
  insert into public.property_review_events (property_id, actor_id, actor_role, action, from_status, to_status)
  values (v_id, p_host, 'host', 'submitted', null, 'pending_review');

  return jsonb_build_object('property_id', v_id, 'slug', p_property->>'slug');
end $$;

-- 6b. Host resubmits after changes were requested (keeps all existing details).
create or replace function public.resubmit_property(p_host uuid, p_property uuid)
returns jsonb language plpgsql as $$
declare v_from text;
begin
  select review_status into v_from from public.properties
   where id = p_property and host_id = p_host for update;
  if v_from is null then raise exception 'property_not_found'; end if;
  if v_from not in ('draft', 'changes_requested') then raise exception 'invalid_transition'; end if;
  update public.properties set review_status = 'pending_review', submitted_at = now(), review_reason = null
   where id = p_property;
  insert into public.property_review_checks (property_id) values (p_property) on conflict do nothing;
  insert into public.property_review_events (property_id, actor_id, actor_role, action, from_status, to_status)
  values (p_property, p_host, 'host', 'resubmitted', v_from, 'pending_review');
  return jsonb_build_object('property_id', p_property);
end $$;

-- 6c. Admin decision. Re-checks the admin role and the approval requirements inside the transaction.
create or replace function public.admin_apply_review_decision(p_admin uuid, p_property uuid, p_decision text, p_reason text)
returns jsonb language plpgsql as $$
declare v_from text; v_to text; v_pub boolean; c public.property_review_checks;
begin
  if not exists (select 1 from public.admin_users where user_id = p_admin) then raise exception 'not_admin'; end if;
  select review_status into v_from from public.properties where id = p_property for update;
  if v_from is null then raise exception 'property_not_found'; end if;

  if p_decision = 'approve' then
    if v_from <> 'pending_review' then raise exception 'invalid_transition'; end if;
    select * into c from public.property_review_checks where property_id = p_property;
    if c.property_id is null or c.identity_status <> 'verified' or c.ownership_status <> 'verified'
       or c.agreement_status <> 'accepted' or c.location_status <> 'set' then
      raise exception 'requirements_incomplete';
    end if;
    v_to := 'approved'; v_pub := true;
  elsif p_decision = 'request_changes' then
    if v_from <> 'pending_review' then raise exception 'invalid_transition'; end if;
    if coalesce(btrim(p_reason), '') = '' then raise exception 'reason_required'; end if;
    v_to := 'changes_requested'; v_pub := false;
  elsif p_decision = 'reject' then
    if v_from not in ('pending_review', 'changes_requested') then raise exception 'invalid_transition'; end if;
    if coalesce(btrim(p_reason), '') = '' then raise exception 'reason_required'; end if;
    v_to := 'rejected'; v_pub := false;
  elsif p_decision = 'unpublish' then
    if v_from <> 'approved' then raise exception 'invalid_transition'; end if;
    v_to := 'approved'; v_pub := false;
  elsif p_decision = 'republish' then
    if v_from <> 'approved' then raise exception 'invalid_transition'; end if;
    v_to := 'approved'; v_pub := true;
  else
    raise exception 'unknown_decision';
  end if;

  update public.properties
     set review_status = v_to, published = v_pub,
         review_reason = case when p_decision in ('request_changes','reject') then btrim(p_reason) else null end,
         reviewed_at = now(), reviewed_by = p_admin
   where id = p_property;
  insert into public.property_review_events (property_id, actor_id, actor_role, action, from_status, to_status, reason)
  values (p_property, p_admin, 'admin', p_decision, v_from, v_to, nullif(btrim(coalesce(p_reason,'')), ''));
  return jsonb_build_object('property_id', p_property, 'review_status', v_to, 'published', v_pub);
end $$;

-- 6d. Admin records the outcome of the four checks.
create or replace function public.admin_set_review_checks(p_admin uuid, p_property uuid,
  p_identity text, p_ownership text, p_agreement text, p_location text)
returns jsonb language plpgsql as $$
begin
  if not exists (select 1 from public.admin_users where user_id = p_admin) then raise exception 'not_admin'; end if;
  if not exists (select 1 from public.properties where id = p_property) then raise exception 'property_not_found'; end if;
  insert into public.property_review_checks (property_id, identity_status, ownership_status, agreement_status, location_status, updated_by, updated_at)
  values (p_property, p_identity, p_ownership, p_agreement, p_location, p_admin, now())
  on conflict (property_id) do update
    set identity_status = excluded.identity_status, ownership_status = excluded.ownership_status,
        agreement_status = excluded.agreement_status, location_status = excluded.location_status,
        updated_by = excluded.updated_by, updated_at = now();
  insert into public.property_review_events (property_id, actor_id, actor_role, action)
  values (p_property, p_admin, 'admin', 'checks_updated');
  return jsonb_build_object('property_id', p_property);
end $$;

revoke execute on function public.submit_host_application(uuid, jsonb, jsonb)                 from public, anon, authenticated;
revoke execute on function public.resubmit_property(uuid, uuid)                               from public, anon, authenticated;
revoke execute on function public.admin_apply_review_decision(uuid, uuid, text, text)         from public, anon, authenticated;
revoke execute on function public.admin_set_review_checks(uuid, uuid, text, text, text, text) from public, anon, authenticated;
grant  execute on function public.submit_host_application(uuid, jsonb, jsonb)                 to service_role;
grant  execute on function public.resubmit_property(uuid, uuid)                               to service_role;
grant  execute on function public.admin_apply_review_decision(uuid, uuid, text, text)         to service_role;
grant  execute on function public.admin_set_review_checks(uuid, uuid, text, text, text, text) to service_role;

commit;

-- ---------------------------------------------------------------------------------------------
-- MANUAL, SEPARATE STEP — grant the admin role (do not automate; run only after the account exists and
-- its email is confirmed, and check that exactly one row is returned by the select first):
--
--   select id, email, email_confirmed_at from auth.users where lower(email) in ('info@uttarkunth.com', 'uttarkunth@gmail.com');
--   insert into public.admin_users (user_id, note)
--     select id, 'initial platform admin' from auth.users
--      where lower(email) in ('info@uttarkunth.com', 'uttarkunth@gmail.com') and email_confirmed_at is not null
--     on conflict do nothing;
--
-- Existing properties with host_id IS NULL are NOT assigned by this migration. Assign each only after the
-- real owner has been verified, e.g.  update public.properties set host_id = '<verified user id>' where id = '<id>';
-- ---------------------------------------------------------------------------------------------
