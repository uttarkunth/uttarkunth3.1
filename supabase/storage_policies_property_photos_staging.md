# Uttarkunth Storage Configuration Specification: Private Property Photo Staging

> **Status:** Pending Explicit User Approval — Do not apply to production without authorization.

## 1. Overview & Architecture

To satisfy content moderation requirements, uploaded photos for already live/approved properties must not directly overwrite or become publicly visible until reviewed and approved by a platform administrator.

- **Public Bucket (`property-photos`):**
  - Contains approved, publicly visible photographs for active properties.
  - Public read access (`SELECT`) is permitted to all users (`anon`, `authenticated`).
  - Direct writes are restricted.

- **Private Staging Bucket (`property-photos-staging`):**
  - `public: false` (non-public bucket).
  - Unauthenticated access is completely denied.
  - Hosts can upload photos only for properties they own or manage.
  - Admin users and server-side service role can generate short-lived signed URLs for moderation previews.
  - Upon approval, the server-side moderation API (`POST /api/admin/moderation/[id]/apply`) copies approved staging objects to the public `property-photos` bucket and cleans up the staging object.
  - Upon rejection (`POST /api/admin/moderation/[id]/discard`), staging objects are purged.

---

## 2. Bucket Creation SQL (Pending User Approval)

```sql
-- 1. Create the private staging bucket if it does not already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-photos-staging',
  'property-photos-staging',
  false,
  10485760, -- 10MB limit per photo
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];
```

---

## 3. Storage Row Level Security (RLS) Policies

```sql
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Policy A: Host Upload Access to Staging Bucket
-- -----------------------------------------------------------------------------
-- Allows authenticated hosts to upload images under their property folder:
-- Object path convention: {property_id}/{random_uuid}.{ext}
CREATE POLICY "Hosts can upload staging photos for their properties"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-photos-staging'
  AND (
    -- The first path token must match a property_id where auth.uid() is primary host or manager
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id::text = (storage.foldername(name))[1]
        AND p.host_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.property_hosts ph
      WHERE ph.property_id::text = (storage.foldername(name))[1]
        AND ph.user_id = auth.uid()
        AND ph.role IN ('primary_host', 'property_manager')
    )
    OR public.is_platform_admin()
  )
);

-- -----------------------------------------------------------------------------
-- Policy B: Read Access for Host and Admin Only
-- -----------------------------------------------------------------------------
CREATE POLICY "Hosts and Admins can view staged photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'property-photos-staging'
  AND (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id::text = (storage.foldername(name))[1]
        AND p.host_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.property_hosts ph
      WHERE ph.property_id::text = (storage.foldername(name))[1]
        AND ph.user_id = auth.uid()
    )
    OR public.is_platform_admin()
  )
);

-- -----------------------------------------------------------------------------
-- Policy C: Service Role Full Access
-- -----------------------------------------------------------------------------
-- Enables server API to promote staged photos to public bucket or purge on discard
CREATE POLICY "Service role full control on staging photos"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'property-photos-staging')
WITH CHECK (bucket_id = 'property-photos-staging');
```

---

## 4. Promotion & Cleanup Workflow

1. **Host Upload:**
   - Client calls `POST /api/host/properties/[id]/photos`.
   - The route detects that the property is live/approved.
   - The file is saved to bucket `property-photos-staging` under `{property_id}/{filename}`.
   - The private staging URL/path is registered in `properties.pending_changes.photos`.
   - The live `properties.photos` array remains unchanged.

2. **Admin Review:**
   - Admin views the moderation panel in `/account/admin/moderation`.
   - The API generates a 1-hour signed URL via `supabase.storage.from('property-photos-staging').createSignedUrl(path, 3600)` to render the comparison preview in the admin UI.

3. **Admin Decision:**
   - **On Approve:**
     - Server downloads/copies the image from `property-photos-staging` to `property-photos`.
     - Server updates `properties.photos` with the new public URL.
     - Server clears `pending_changes.photos`.
     - Server deletes the object from `property-photos-staging`.
     - Writes to `admin_audit_log` (`action: 'approve_property_changes'`).
   - **On Discard:**
     - Server deletes the staged object from `property-photos-staging`.
     - Server clears `pending_changes.photos`.
     - Writes to `admin_audit_log` (`action: 'discard_property_changes'`).
