-- Uttarkunth Stays — guest accounts & trips. PROPOSED: review, back up, then run once in the SQL editor. Safe to re-run.
-- Adds only nullable columns + an index. Existing booking rows are untouched (guest_user_id stays NULL for past anonymous requests;
-- they are NOT matched to accounts by email, because an unverified email is not proof of ownership).
alter table public.stay_bookings
  add column if not exists guest_user_id uuid references auth.users(id) on delete set null,
  add column if not exists cancelled_at  timestamptz,
  add column if not exists cancel_reason text;
create index if not exists stay_bookings_guest_idx on public.stay_bookings (guest_user_id, created_at desc);
-- No grants change: guests still reach bookings only through the Netlify functions (service_role); RLS stays enabled.
