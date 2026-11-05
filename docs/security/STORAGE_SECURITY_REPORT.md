# Storage & Document Security Audit Report (`docs/security/STORAGE_SECURITY_REPORT.md`)

- **Supabase Project**: `https://xyplgugxpmlnjsvlosdg.supabase.co`
- **Audit Scope**: All Supabase Storage buckets, `storage.objects` RLS policies, file upload API routes (`POST /api/host/properties/[id]/photos`, `POST /api/staff/documents`, `POST /api/products/documents`), and signed URL generation (`GET /api/staff/documents`, `GET /api/products/documents`).

---

## 1. Storage Bucket Architecture & Audit Status

| Bucket Name | Visibility | Purpose | Max File Size | Allowed MIME Types | Current State in Repo / Live DB |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `property-photos` | **Public** (`public = true`) | Published Stays property & room gallery images | 5 MB | `image/jpeg`, `image/png`, `image/webp` | Referenced in `app/api/host/properties/[id]/photos/route.ts`, **not yet created in live DB** |
| `staff-hr-docs` | **Private** (`public = false`) | Staff identity docs, signed NDAs, onboarding HR files | 10 MB | `application/pdf`, `image/jpeg`, `image/png`, `image/webp` | Defined in `20261104120000` migration, **not yet applied to live DB** |
| `seller-verification-docs` | **Private** (`public = false`) | Seller PAN, GST, FSSAI, Organic, GI Tag, Artisan certificates | 10 MB | `application/pdf`, `image/jpeg`, `image/png`, `image/webp` | Defined in `20261104120000` migration, **not yet applied to live DB** |
| `host-verification-docs` | **Private** (`public = false`) | Host KYC, homestay registration, commercial deeds | 10 MB | `application/pdf`, `image/jpeg`, `image/png`, `image/webp` | **Missing in migrations** — will be added in Phase 4 |
| `production-private-docs` | **Private** (`public = false`) | Film scripts, location permits, insurance & recce dossiers | 10 MB | `application/pdf`, `image/jpeg`, `image/png`, `image/webp` | **Missing in migrations** — will be added in Phase 4 |
| `community-private-docs` | **Private** (`public = false`) | Fellowship resumes, project proposals, field partner docs | 10 MB | `application/pdf`, `image/jpeg`, `image/png`, `image/webp` | **Missing in migrations** — will be added in Phase 4 |

---

## 2. File Upload & Download API Security Audit

### A. Staff HR Document Endpoint (`app/api/staff/documents/route.ts`)
- **Upload (`POST /api/staff/documents`)**:
  - **Authentication**: Requires valid single-use `invitation_token` (during onboarding) OR authenticated user session (`supabase.auth.getUser()`).
  - **MIME & Size Check**: Enforces `ALLOWED_DOCUMENT_MIME_TYPES` (`application/pdf`, `image/jpeg`, `image/png`, `image/webp`) and `MAX_DOCUMENT_SIZE_BYTES` (10 MB).
  - **Magic-Byte Inspection**: Calls `validateFileMagicBytes(bytes, file.type)` to verify `%PDF-` (`25 50 44 46 2D`), JPEG (`FF D8 FF`), PNG (`89 50 4E 47`), or WebP (`RIFF....WEBP`) binary headers. Rejects disguised `.exe`, `.html`, `.svg`, `.js`, or `.sh` files.
  - **Filename Sanitization**: Calls `sanitizeStorageFilename(file.name)` to strip `..`, `/`, `\`, null bytes, and double extensions.
  - **Storage Path Isolation**: Scopes uploads strictly to `staff-onboarding/<invitation_id>/<doc_type>_<timestamp>_<filename>` or `staff-hr/<user_id>/<doc_type>_<timestamp>_<filename>`.
- **Signed URL Download (`GET /api/staff/documents?path=...`)**:
  - **Authentication & Authorization**:
    - Allows the document owner to view only their own path (`staff-hr/<user.id>/...`).
    - Otherwise calls `requireStaffPermission('staff.documents.view', { requireMfaAal2: true })`, restricting cross-user HR document viewing to the Founder (`aal2`).
  - **Short-Lived Signed URL**: Generates a **120-second** (`expiresIn: 120`) signed URL via `adminClient.storage.from('staff-hr-docs').createSignedUrl(storagePath, 120)`.
  - **Immutable Audit Trail**: Calls `recordStaffAuditLog({ action: 'staff_hr_document_viewed', ... })` on every document view.
- **Assessment**: **Strong / Compliant**.

---

### B. Seller Verification Document Endpoint (`app/api/products/documents/route.ts`)
- **Upload (`POST /api/products/documents`)**:
  - **Authentication**: Requires authenticated user (`supabase.auth.getUser()`).
  - **Ownership Verification**: When `seller_id` is provided, verifies `sellerRow.user_id === user.id`.
  - **MIME, Size & Magic-Byte Inspection**: Enforces 10 MB limit, allowed MIME types, `validateFileMagicBytes(bytes, file.type)`, and `sanitizeStorageFilename(file.name)`.
  - **Storage Path Isolation**: Scopes uploads strictly to `seller-docs/<user.id>/<doc_type>_<timestamp>_<filename>`.
- **Signed URL Download (`GET /api/products/documents?id=...`)**:
  - **Authorization**: Allows the owning seller (`docRow.user_id === user.id`) OR an active staff member with `requireStaffPermission('products.sellers.view', { requireMfaAal2: true })`.
  - **Short-Lived Signed URL**: Generates a **120-second** signed URL from `seller-verification-docs`.
  - **Audit Logging**: Logs `seller_verification_document_viewed` in `public.staff_audit_log` whenever a staff/Founder reviewer accesses a seller document.
- **Assessment**: **Strong / Compliant**.

---

### C. Host Property Photo Upload Endpoint (`app/api/host/properties/[id]/photos/route.ts`)
- **Upload (`POST /api/host/properties/[id]/photos`)**:
  - **Authentication & Authorization**: Verifies `supabase.auth.getUser()`, checks `checkIsPropertyHost(user.id, propertyId)` or `checkIsPlatformAdmin(user.id)`.
  - **Identified Vulnerabilities**:
    1. **[MED-01] Missing Magic-Byte Inspection**: Checks `['image/jpeg', 'image/png', 'image/webp'].includes(file.type)` using only the browser-provided `Content-Type` header. Does not call `validateFileMagicBytes(bytes, file.type)`.
    2. **Weak Role Check for Staff Fallback**: Uses `checkIsPlatformAdmin(user.id)` instead of `requireStaffPermission('stays.properties.edit', { requireMfaAal2: true })`, allowing any non-Stays staff member at `aal1` to upload/delete property photos.
    3. **Missing Audit Log**: When a staff member modifies property photos on behalf of a host, no entry is written to `staff_audit_log`.
- **Remediation (Phase 3)**:
  - Add `validateFileMagicBytes(bytes, file.type)` (restricting to `image/jpeg`, `image/png`, `image/webp`) and `sanitizeStorageFilename(file.name)`.
  - Replace the staff fallback check with `requireStaffPermission('stays.properties.edit', { requireMfaAal2: true })` and log staff photo uploads/deletions to `staff_audit_log`.

---

## 3. Storage RLS Policies (`storage.objects`) for Phase 4 Migration

To ensure defense-in-depth at the Supabase Storage layer (even if a client attempts to query `/storage/v1/object/*` directly with a user JWT):

1. **`property-photos` (Public Bucket)**:
   - `SELECT`: Allowed for `anon, authenticated` (`bucket_id = 'property-photos'`).
   - `INSERT / UPDATE / DELETE`: Restricted to `service_role` (all uploads go through `POST /api/host/properties/[id]/photos` after magic-byte validation and host ownership verification).
2. **`staff-hr-docs`, `seller-verification-docs`, `host-verification-docs`, `production-private-docs`, `community-private-docs` (Private Buckets)**:
   - `public = false` on all 5 buckets (anonymous public URLs are completely disabled).
   - Direct client `SELECT / INSERT / UPDATE / DELETE` on `storage.objects` for these buckets is restricted so that all uploads pass through server-side magic-byte inspection and all downloads issue audited, 120-second signed URLs via server-side permission checks.
   - Owner-scoped defense-in-depth `SELECT` policies on `storage.objects` additionally require `bucket_id IN (...) AND (storage.foldername(name))[2] = auth.uid()::text`.
