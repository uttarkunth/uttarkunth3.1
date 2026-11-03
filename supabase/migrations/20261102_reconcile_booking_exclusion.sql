-- Uttarkunth — Reconcile booking exclusion constraint to protect confirmed bookings only.
-- Pending requests represent requests, not confirmed room blocks.
-- Multiple pending requests may coexist; host approval atomically confirms one.

begin;

alter table public.stay_bookings
  drop constraint if exists stay_bookings_no_overlapping_active_dates;

alter table public.stay_bookings
  drop constraint if exists stay_bookings_no_overlapping_confirmed_dates;

alter table public.stay_bookings
  add constraint stay_bookings_no_overlapping_confirmed_dates
  exclude using gist (
    room_unit_id with =,
    daterange(check_in, check_out, '[)') with &&
  )
  where (status = 'confirmed');

commit;
