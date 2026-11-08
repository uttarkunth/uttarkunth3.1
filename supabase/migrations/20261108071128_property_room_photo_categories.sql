-- Keep room photographs separate from the shared property washroom gallery.
-- Original image files remain in the existing property-photos Supabase Storage bucket.

alter table public.properties
  add column if not exists shared_washroom_photos jsonb not null default '[]'::jsonb;

alter table public.room_units
  add column if not exists washroom_photos jsonb not null default '[]'::jsonb;
