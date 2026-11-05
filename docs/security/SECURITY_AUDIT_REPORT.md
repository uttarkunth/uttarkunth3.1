# Uttarkunth 3.1 — Complete Security Audit Report (Phase 1 & Phase 2 Architecture)

- **Platform**: Uttarkunth 3.1 Multi-Department Himalayan Ecosystem (Stays, Products, Productions, Community)
- **Portals**:
  1. `uttarkunth.com` — Public Platform (Guests, Hosts, Sellers, Creators, Community Members, Visitors)
  2. `admin.uttarkunth.com` — Founder Command Centre (Founder only)
  3. `team.uttarkunth.com` — Internal Staff Portal (Approved Staff & Founder)
- **Connected Supabase Project**: `https://xyplgugxpmlnjsvlosdg.supabase.co`
- **Audit Scope**: Live Supabase Auth, Live PostgreSQL Schema & RLS Policies, Storage Buckets, Next.js App Router Middleware & 25 API Routes, Staff/Founder RBAC Engine, and Cloudflare Edge Configuration.
- **Audit Status**: **Phase 1 Complete (Read-Only Non-Destructive Audit)** — No live production database mutations were executed during this phase.

---

## Executive Summary

A full-stack, non-destructive security audit was conducted across the Uttarkunth 3.1 codebase (`uttarkunthmain2`) and the live connected Supabase environment (`xyplgugxpmlnjsvlosdg`).

### Summary of Findings by Severity

| Severity | Count | Key Themes |
| :--- | :---: | :--- |
| **Critical** | **3** | 1. Unapplied Phase 2 Staff Governance & Seller Verification migration on live Supabase (`staff_profiles` missing in production)<br>2. Horizontal privilege escalation & MFA bypass across 5 `/api/admin/*` routes using legacy `checkIsPlatformAdmin()`<br>3. Unauthenticated arbitrary booking cancellation in `POST /api/bookings/cancel` |
| **High** | **5** | 1. Live `anon` RLS failure (`42501: permission denied for table property_hosts`) on `public.properties` and `public.room_units`<br>2. Explicit permission revocations (`grant_type = 'revoke'` & `revoked_permissions`) ignored in `lib/staff-rbac.ts`<br>3. Missing three-portal hostname isolation (`admin.uttarkunth.com` vs `team.uttarkunth.com`) and `aal1` read access to `/admin/*` pages<br>4. Open redirect vulnerabilities in `/api/auth/callback`, `/login`, and `/staff/login`<br>5. Staff login MFA enrollment bypass when no verified TOTP factor exists (`app/staff/login/page.tsx`) |
| **Medium** | **6** | 1. Host photo upload (`POST /api/host/properties/[id]/photos`) lacks server-side magic-byte inspection<br>2. Unauthenticated audit log flooding in `POST /api/staff/mfa-recovery`<br>3. Missing rate limiting enforcement in `POST /api/bookings/request` and `POST /api/staff/onboard`<br>4. Missing HTTP security headers (`CSP`, `HSTS`, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`)<br>5. Missing `FORCE ROW LEVEL SECURITY` on sensitive tables and split-brain `is_platform_admin()` vs `has_staff_permission_for_user()` in RLS<br>6. Missing private storage buckets (`host-verification-docs`, `production-private-docs`, `community-private-docs`) and `storage.objects` RLS policies |
| **Low** | **3** | 1. `app/api/properties/route.ts` uses `createAdminClient()` without filtering `published = true AND moderation_status = 'approved'`<br>2. Verbose database error strings returned to clients in select API catch blocks<br>3. Supabase Auth dashboard settings (password complexity,hibp check, CAPTCHA, MFA max enrolled factors) require manual dashboard confirmation |
| **Informational** | **2** | 1. PostgREST root OpenAPI schema enumeration is already blocked (`401 Secret API key required` with `sb_publishable_`)<br>2. Existing 144 unit tests pass (`tests/*.test.ts`), providing a solid baseline for Phase 5 security regression tests |

---

## Detailed Audit Findings (Classified by Severity)

### CRITICAL FINDINGS

#### [CRIT-01] Live Database Migration Drift — Phase 2 Staff Governance & Seller Verification Schema Not Applied in Production
- **Severity**: **Critical**
- **Affected Objects**:
  - Live Supabase project `xyplgugxpmlnjsvlosdg`
  - Migration file: `supabase/migrations/20261104120000_phase2_staff_governance_and_seller_verification_pending_approval.sql`
  - Codebase dependencies: `lib/auth.ts`, `lib/staff-rbac.ts`, `app/admin/**`, `app/api/admin/staff/route.ts`, `app/api/admin/products/route.ts`, `app/api/staff/**`, `app/api/products/documents/route.ts`
- **Existing Implementation**:
  - The repository contains `supabase/migrations/20261104120000_phase2_staff_governance_and_seller_verification_pending_approval.sql`, which defines 16 core governance and verification tables/views (`profiles`, `public_member_profiles`, `staff_roles`, `staff_permissions`, `staff_role_permissions`, `staff_invitations`, `staff_profiles`, `staff_permission_assignments`, `staff_documents`, `staff_agreements`, `staff_agreement_acceptances`, `staff_employment_history`, `staff_dual_approvals`, `staff_audit_log`, `seller_verification_documents`, `seller_verification_checks`, `marketplace_category_requirements`) and 3 RPC functions (`provision_founder_account`, `is_active_staff_for_user`, `has_staff_permission_for_user`).
  - Live non-destructive PostgREST probes against `https://xyplgugxpmlnjsvlosdg.supabase.co` confirmed that **all 16 tables/views return `PGRST205: Could not find the table in the schema cache`** and **all 3 RPC functions return `PGRST202: Could not find the function`**.
- **Identified Vulnerability / Operational Risk**:
  - `lib/auth.ts` (`checkIsPlatformAdmin`) and `lib/staff-rbac.ts` (`requireStaffPermission`) query `public.staff_profiles` as the sole authoritative source of truth and intentionally fail closed when `staff_profiles` does not exist.
  - Consequently, neither the Founder nor any Staff member can log in to `/admin/*` or `/staff/login` against the live Supabase project until the Phase 2 migration is applied and `provision_founder_account()` is executed.
- **Recommended Fix**:
  - Consolidate and harden the Phase 2 migration together with the Phase 4 additive security hardening migration, review all statements with the Founder, apply in the Supabase SQL Editor, and execute `SELECT public.provision_founder_account('<founder_auth_user_uuid>', 'founder@uttarkunth.com', 'Founder Legal Name');`.

---

#### [CRIT-02] Horizontal Privilege Escalation & MFA (AAL2) Bypass on 5 `/api/admin/*` Endpoints
- **Severity**: **Critical**
- **Affected Files**:
  - `app/api/admin/moderation/route.ts` (lines 19–22)
  - `app/api/admin/hosts/route.ts` (lines 17–20)
  - `app/api/admin/agreements/route.ts` (lines 17–20)
  - `app/api/admin/community/route.ts` (lines 12–13)
  - `app/api/admin/productions/route.ts` (lines 12–13)
  - `lib/auth.ts` (`checkIsPlatformAdmin`, lines 38–83)
- **Existing Implementation**:
  - Each of these 5 administrative mutation routes authenticates the caller solely with:
    ```ts
    const isAdmin = await checkIsPlatformAdmin(user.id);
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    ```
  - In `lib/auth.ts`, `checkIsPlatformAdmin(userId)` returns `true` for **any** row in `public.staff_profiles` where `status = 'active'` and `agreements_completed = true`, regardless of the staff member's `role_slug`, `department`, or specific permissions, and **without checking Supabase MFA Assurance Level (`aal2`)**.
- **Identified Vulnerability**:
  - **Horizontal Privilege Escalation across Departments**: An active `support_executive` (read-only support role) or `community_manager` can directly call:
    - `POST /api/admin/hosts` to assign or revoke property host ownership (`public.property_hosts`).
    - `POST /api/admin/agreements` to create commercial commission agreements (`public.host_agreements`).
    - `POST /api/admin/moderation` to approve, publish, unpublish, or reject Stays properties (`public.properties`).
    - `POST /api/admin/productions` to approve/reject film production proposals.
    - `POST /api/admin/community` to create community initiatives or approve/reject stories.
  - **MFA Bypass**: All 5 endpoints execute using `createAdminClient()` (`service_role`) even when the staff member is only at `aal1` (password-only, 2FA not verified).
- **Recommended Fix**:
  - Replace `checkIsPlatformAdmin(user.id)` in all 5 routes with `requireStaffPermission()` enforcing both the exact granular permission and `requireMfaAal2: true` on all state-changing operations:
    - `/api/admin/moderation` → `stays.properties.approve` (approve/reject) or `stays.properties.publish` (publish/unpublish)
    - `/api/admin/hosts` → `stays.hosts.verify`
    - `/api/admin/agreements` → `stays.agreements.manage`
    - `/api/admin/community` → `community.initiatives.manage` / `community.stories.moderate`
    - `/api/admin/productions` → `productions.proposals.approve` / `productions.proposals.review`
  - Record every administrative decision in `recordStaffAuditLog()` with `beforeState` and `afterState`.

---

#### [CRIT-03] Unauthenticated Arbitrary Booking Cancellation in `POST /api/bookings/cancel`
- **Severity**: **Critical**
- **Affected File**:
  - `app/api/bookings/cancel/route.ts` (lines 6–82)
- **Existing Implementation**:
  - `POST /api/bookings/cancel` accepts `{ booking_reference, reason }` from any unauthenticated request, instantiates `createAdminClient()` (`service_role`), looks up `stay_bookings` by `booking_reference`, and immediately sets `status = 'cancelled'` on both `stay_bookings` and `booking_requests`.
  - Although `POST /api/bookings/request` generates a 32-byte cryptographic `guest_access_token` and stores `guest_access_token_hash` (SHA-256) in `stay_bookings.guest_access_token_hash`, `POST /api/bookings/cancel` never requires or verifies either:
    1. The `guest_access_token` matching `guest_access_token_hash`, OR
    2. An authenticated session (`supabase.auth.getUser()`) whose email matches `guest_email`, OR
    3. An authenticated property host or authorized `stays` staff member (`stays.bookings.manage`).
- **Identified Vulnerability**:
  - Any unauthenticated actor who knows or guesses a `booking_reference` (e.g., `UK-2026-...`) can cancel any guest's pending or future confirmed reservation across the entire platform.
- **Recommended Fix**:
  - Require proof of authorization in `POST /api/bookings/cancel`:
    1. Valid `guest_access_token` whose SHA-256 hash matches `booking.guest_access_token_hash` (using constant-time comparison `crypto.timingSafeEqual`), OR
    2. Authenticated user whose verified email matches `booking.guest_email`, OR
    3. Authenticated host assigned to `booking.property_id`, OR
    4. Active staff member with `stays.bookings.manage` permission and `aal2`.

---

### HIGH FINDINGS

#### [HIGH-01] Live Database RLS Policy Failure on `public.properties` and `public.room_units` (`42501: permission denied for table property_hosts`)
- **Severity**: **High**
- **Affected Database Objects**:
  - Live Supabase table policies on `public.properties` and `public.room_units`
  - `public.property_hosts` table privileges
- **Existing Implementation**:
  - Live probe against `https://xyplgugxpmlnjsvlosdg.supabase.co/rest/v1/properties?select=id,slug,name&limit=5` using the publishable key (`anon` role) returned:
    `HTTP 401 — {"code":"42501","message":"permission denied for table property_hosts"}`
  - Live probe against `/rest/v1/room_units?select=id&limit=1` similarly returned:
    `HTTP 401 — {"code":"42501","message":"permission denied for table property_hosts"}`
- **Identified Vulnerability / Defect**:
  - In `20261103114500_phase2d_2e_security_remediation.sql`, table access on `public.property_hosts` was revoked from `anon` (`REVOKE ALL ON public.property_hosts FROM anon, public;`), which is good practice to hide host mapping data.
  - However, an existing `SELECT` policy on `public.properties` (and `public.room_units`) in the live database still contains a direct subquery `EXISTS (SELECT 1 FROM public.property_hosts ph WHERE ph.property_id = properties.id AND ph.user_id = auth.uid())` that is evaluated for `ALL` roles (including `anon`). When `anon` queries `public.properties` or `public.room_units`, PostgreSQL checks table permissions for every relation referenced in applicable RLS policies and aborts with `42501: permission denied for table property_hosts`.
  - Note: Server components currently mask this error only when `SUPABASE_SERVICE_ROLE_KEY` is configured or when fallback catalog logic triggers, but any standard client/SSR `anon` query via `@/lib/supabase/server` or `@/lib/supabase/client` fails!
- **Recommended Fix**:
  - Scope host-ownership `SELECT`/`UPDATE` policies on `properties` and `room_units` strictly `TO authenticated` (never `TO public` or `anon`), and wrap host ownership checks in a `SECURITY DEFINER` helper function `public.is_property_host(p_property_id uuid, p_user_id uuid)` with `SET search_path = public`.
  - Keep the public `anon` + `authenticated` `SELECT` policy on `properties` strictly limited to `published = true AND moderation_status = 'approved'` (and on `room_units` to rooms belonging to a published & approved property via a `SECURITY DEFINER` check or safe subquery).

---

#### [HIGH-02] Explicit Permission Revocations (`grant_type = 'revoke'` & `revoked_permissions`) Ignored in `lib/staff-rbac.ts`
- **Severity**: **High**
- **Affected File**:
  - `lib/staff-rbac.ts` (`evaluateStaffAuthorization` lines 709–716, and `requireStaffPermission` lines 871–895)
- **Existing Implementation**:
  1. In `requireStaffPermission()` (lines 871–882):
     ```ts
     const { data: assignRows } = await (
       adminClient.from('staff_permission_assignments' as any) as any
     )
       .select('permission_code, permission_key, revoked_at')
       .eq('user_id', user.id);
     const customPermissions = Array.isArray(assignRows)
       ? assignRows
           .filter((r: any) => !r.revoked_at)
           .map((r: any) => String(r.permission_code || r.permission_key || ''))
           .filter(Boolean)
       : [];
     ```
     The query does not select `grant_type` or `is_active`. In `public.staff_permission_assignments`, rows can have `grant_type = 'revoke'` (to strip a default role permission from a specific staff member) with `revoked_at IS NULL` and `is_active = true`. Because `requireStaffPermission()` only checks `!r.revoked_at`, **a `'revoke'` row in `staff_permission_assignments` is treated as an `'allow'` grant!**
  2. In `evaluateStaffAuthorization()` (lines 709–716):
     ```ts
     const rolePerms = ROLE_DEFAULT_PERMISSIONS[staffProfile.role_slug] ?? [];
     const customPerms = staffProfile.custom_permissions ?? [];
     const effectivePermissions = new Set<StaffPermissionKey>([...rolePerms, ...customPerms]);
     ```
     `staffProfile.revoked_permissions` is defined on `StaffProfileRecord` (line 262) and populated in `POST /api/admin/staff` (`revoke_permission` action), but `evaluateStaffAuthorization()` **never deletes `staffProfile.revoked_permissions` from `effectivePermissions`**!
- **Identified Vulnerability**:
  - If the Founder revokes a default role permission from a staff member (or inserts a `grant_type = 'revoke'` assignment), the revocation is either completely ignored or inverted into an active permission grant.
- **Recommended Fix**:
  - Update `requireStaffPermission()` to select `permission_code, permission_key, grant_type, is_active, revoked_at, expires_at` from `staff_permission_assignments`.
  - Separate active (`is_active !== false && !revoked_at && (!expires_at || new Date(expires_at) > now)`) rows by `grant_type`:
    - `grant_type === 'allow'` → add to `custom_permissions`
    - `grant_type === 'revoke'` → add to `revoked_permissions`
  - Update `evaluateStaffAuthorization()` so every permission in `staffProfile.revoked_permissions` is removed from `effectivePermissions` (`effectivePermissions.delete(revokedPerm)`).

---

#### [HIGH-03] Missing Three-Portal Hostname Isolation (`admin.uttarkunth.com` vs `team.uttarkunth.com`) and Unenforced `aal2` MFA on `/admin/*` Reads
- **Severity**: **High**
- **Affected Files**:
  - `middleware.ts`
  - `app/admin/layout.tsx`
  - `app/admin/staff/page.tsx`, `app/admin/products/page.tsx`, `app/admin/settings/page.tsx`, `app/admin/audit/page.tsx`, `app/admin/users/page.tsx`
  - `app/api/admin/staff/route.ts` (`GET`), `app/api/admin/products/route.ts` (`GET`)
- **Existing Implementation**:
  1. `middleware.ts` defines `isStaffSubdomain(hostname)` for `team.uttarkunth.com`, `team.localhost`, `staff.uttarkunth.com`, and `staff.localhost`, but has **zero handling for `admin.uttarkunth.com` or `admin.localhost`**.
  2. When a non-Founder staff member accesses `admin.uttarkunth.com`, they are not blocked at the portal boundary. Furthermore, `/admin/settings` and `/admin/users` are accessible in the shared `/admin` layout without enforcing `role_slug === 'founder'` at the portal hostname boundary.
  3. `app/admin/layout.tsx` calls `resolveFounderOrAdminSession()`, which checks `staff_profiles` status and agreements, **but does not check MFA `aal2`**.
  4. `app/admin/staff/page.tsx`, `app/admin/products/page.tsx`, `app/admin/settings/page.tsx`, `app/admin/audit/page.tsx`, `app/admin/users/page.tsx`, `GET /api/admin/staff`, and `GET /api/admin/products` explicitly pass `{ requireMfaAal2: false }` (or omit AAL2 checks) and then query sensitive data via `createAdminClient()` (`service_role`).
- **Identified Vulnerability**:
  - **Portal Boundary Violation**: The architectural requirement specifies that `admin.uttarkunth.com` is the **Founder Command Centre (Founder only)**, `team.uttarkunth.com` is the **Staff Portal (Approved staff and Founder)**, and both require **mandatory TOTP MFA (`aal2`)**.
  - **AAL1 Sensitive Data Exposure**: If a Founder or Staff password is compromised, an attacker with only an `aal1` session (without passing the 6-digit TOTP second factor) can browse `/admin/users` (all auth users), `/admin/staff` (all staff PII, mobile numbers, addresses, emergency contacts, invitation logs), `/admin/products` (seller PAN/GSTIN/FSSAI metadata), `/admin/settings` (host commercial commission agreements), and `/admin/audit`.
- **Recommended Fix**:
  - **Portal Hostname Isolation in `middleware.ts` & Server Guards**:
    - Recognize `admin.uttarkunth.com` (`isFounderSubdomain`) and `team.uttarkunth.com` (`isStaffSubdomain`).
    - Never trust hostname alone as proof of authorization; always verify identity, role, and AAL2 server-side.
    - On `admin.uttarkunth.com`, strictly require `role_slug === 'founder'` and `aal2`. Non-founder staff attempting to access `admin.uttarkunth.com` are denied (`403` / redirected to `team.uttarkunth.com`).
    - On `uttarkunth.com` in production (`ENFORCE_PORTAL_HOST_SEPARATION=true`), prevent internal `/admin/*` browsing from the public domain or redirect to the appropriate internal portal while keeping local/preview single-host development working seamlessly with strict server-side RBAC + AAL2.
  - **Mandatory AAL2 on `/admin/*` Layout & API Routes**:
    - Enforce `aal2` verification in `app/admin/layout.tsx` and across all `/admin/*` pages and `/api/admin/*` GET/POST handlers (redirecting `aal1` sessions to `/staff/login?mfa=required&next=...`).

---

#### [HIGH-04] Open Redirect Vulnerabilities in `/api/auth/callback`, `/login`, and `/staff/login`
- **Severity**: **High**
- **Affected Files**:
  - `app/api/auth/callback/route.ts` (line 14)
  - `app/login/page.tsx` (line 20)
  - `app/staff/login/page.tsx` (line 35)
- **Existing Implementation**:
  - In `app/api/auth/callback/route.ts`:
    ```ts
    const next = requestUrl.searchParams.get('next') || '/';
    return NextResponse.redirect(new URL(next, requestUrl.origin));
    ```
  - In JavaScript/Node.js, `new URL('https://malicious.example.com', 'https://uttarkunth.com')` or `new URL('//malicious.example.com', 'https://uttarkunth.com')` ignores the base origin and resolves to `https://malicious.example.com`.
- **Identified Vulnerability**:
  - An attacker can craft an official-looking Uttarkunth login or email confirmation URL (`https://uttarkunth.com/api/auth/callback?code=...&next=https://evil.example.com`) that authenticates the user and immediately redirects them to a phishing site.
- **Recommended Fix**:
  - Create a shared `sanitizeInternalRedirectPath(rawNext: string | null | undefined, fallback = '/'): string` utility that only allows relative paths starting with a single `/` (`rawNext.startsWith('/') && !rawNext.startsWith('//') && !rawNext.startsWith('/\\')`) and strips any protocol/host injection, and apply it in `/api/auth/callback`, `/login`, and `/staff/login`.

---

#### [HIGH-05] Staff Login Skips Mandatory TOTP MFA Enrollment When No Factor Is Verified Yet
- **Severity**: **High**
- **Affected File**:
  - `app/staff/login/page.tsx` (lines 78–99)
- **Existing Implementation**:
  ```ts
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const { data: factorsData } = await supabase.auth.mfa.listFactors();
  const verifiedTotpFactor = factorsData?.totp?.find((f) => f.status === 'verified');

  if (verifiedTotpFactor && aalData?.currentLevel !== 'aal2') {
    // prompts for 6-digit TOTP code
  }

  router.push(nextPath);
  ```
- **Identified Vulnerability**:
  - When a newly approved staff member (or Founder) signs in for the first time and has **not yet enrolled a verified TOTP factor** (`!verifiedTotpFactor`), `handleStaffSignIn` does not force them into `mfaStep = 'enroll'`. Instead, it redirects them directly to `/admin/dashboard` with an `aal1` session!
- **Recommended Fix**:
  - In `app/staff/login/page.tsx`, if `!verifiedTotpFactor`, immediately invoke TOTP factor enrollment (`supabase.auth.mfa.enroll({ factorType: 'totp' })`) and transition to `mfaStep = 'enroll'` so no staff member or Founder can enter the portal without an active `aal2` session.
  - Also clean up any unverified stale TOTP factors before enrolling a new one, and update `staff_profiles.mfa_enrolled = true` once verified.

---

### MEDIUM FINDINGS

#### [MED-01] Host Property Photo Upload Lacks Server-Side Magic-Byte File Content Inspection
- **Severity**: **Medium**
- **Affected File**:
  - `app/api/host/properties/[id]/photos/route.ts` (lines 67–75)
- **Existing Implementation**:
  - `POST /api/host/properties/[id]/photos` checks `['image/jpeg', 'image/png', 'image/webp'].includes(file.type)` using the client-supplied `Content-Type` header from `FormData`, without inspecting the binary magic bytes of the uploaded buffer.
  - By contrast, `app/api/staff/documents/route.ts` and `app/api/products/documents/route.ts` call `validateFileMagicBytes(bytes, file.type)`.
- **Identified Vulnerability**:
  - Because `property-photos` is a **public** bucket, an authenticated host could upload an HTML, SVG, or script file with a spoofed `Content-Type: image/jpeg` header and `.jpg` extension.
- **Recommended Fix**:
  - Enforce `validateFileMagicBytes(bytes, file.type)` in `POST /api/host/properties/[id]/photos` (allowing only genuine JPEG, PNG, and WebP magic bytes), enforce safe filename sanitization, and set `contentType` and `cacheControl` explicitly on upload.

---

#### [MED-02] Unauthenticated Audit Log Flooding & Spoofing in `POST /api/staff/mfa-recovery`
- **Severity**: **Medium**
- **Affected File**:
  - `app/api/staff/mfa-recovery/route.ts`
- **Existing Implementation**:
  - Accepts unauthenticated `POST` requests with `{ official_email, staff_id, reason }` and inserts directly into `staff_audit_log` / `admin_audit_log` via `createAdminClient()` without rate limiting or verifying that `official_email` belongs to an existing staff profile.
- **Identified Vulnerability**:
  - Any anonymous bot can flood `admin_audit_log` and `staff_audit_log` with millions of fake `staff_mfa_recovery_requested` entries for arbitrary emails.
- **Recommended Fix**:
  - Apply IP + email rate limiting via `public.rate_limits` (e.g., max 3 recovery requests per 15 minutes), verify that `official_email` corresponds to a real row in `public.staff_profiles` before writing to `staff_audit_log` (returning a generic success response if not found to prevent user enumeration), and sanitize reason length (10–500 chars).

---

#### [MED-03] Missing Rate Limiting Enforcement on Public/Onboarding Mutation Endpoints
- **Severity**: **Medium**
- **Affected Files**:
  - `app/api/bookings/request/route.ts`
  - `app/api/staff/onboard/route.ts`
  - `app/api/products/interest/route.ts`
- **Existing Implementation**:
  - `public.booking_rate_limits` and `public.rate_limits` exist in the live Supabase database, and `app/api/products/submit`, `app/api/production/apply`, `app/api/community/participate`, and `app/api/community/stories` enforce rate limits. However, `POST /api/bookings/request` and `POST /api/staff/onboard` do not check rate limits before hitting `createAdminClient()`.
- **Recommended Fix**:
  - Enforce server-side rate limiting on `POST /api/bookings/request` (per IP/email), `GET & POST /api/staff/onboard` (per IP to prevent token brute-forcing), and `POST /api/bookings/cancel` (per IP to prevent booking reference brute-forcing).

---

#### [MED-04] Missing HTTP Security Headers (`CSP`, `HSTS`, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`)
- **Severity**: **Medium**
- **Affected Files**:
  - `next.config.mjs`
  - `middleware.ts`
- **Existing Implementation**:
  - Neither `next.config.mjs` nor `middleware.ts` sets HTTP response security headers.
- **Recommended Fix**:
  - Configure comprehensive, production-grade security headers in `middleware.ts` and `next.config.mjs`:
    - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
    - `X-Content-Type-Options: nosniff`
    - `Referrer-Policy: strict-origin-when-cross-origin`
    - `X-DNS-Prefetch-Control: off`
    - `Permissions-Policy: camera=(), microphone=(), geolocation=(self), interest-cohort=()`
    - `Content-Security-Policy` allowing `self`, `https://*.supabase.co`, `wss://*.supabase.co`, `https://images.unsplash.com`, `https://picsum.photos`, and inline styles/scripts needed by Next.js while blocking `object-src 'none'` and `base-uri 'self'`.

---

#### [MED-05] Missing `FORCE ROW LEVEL SECURITY` on Sensitive Tables & Legacy `is_platform_admin()` Drift in RLS Policies
- **Severity**: **Medium**
- **Affected Database Objects**:
  - `supabase/migrations/20261103114600_phase2f_products_marketplace.sql`
  - `supabase/migrations/20261103140000_phase2g_2h_productions_community_pending_approval.sql`
  - `supabase/migrations/20261104120000_phase2_staff_governance_and_seller_verification_pending_approval.sql`
- **Existing Implementation**:
  1. Tables use `ENABLE ROW LEVEL SECURITY` without `FORCE ROW LEVEL SECURITY`.
  2. RLS policies in Phase 2F (`sellers`, `products`, `product_interests`) and Phase 2G/2H (`filmmaker_profiles`, `production_proposals`, `community_initiatives`, `community_participations`, `community_stories`, `user_notifications`) call `public.is_platform_admin()`, which checks the legacy `public.platform_admins` table instead of `public.has_staff_permission_for_user(auth.uid(), ...)`.
- **Recommended Fix**:
  - Add `ALTER TABLE ... FORCE ROW LEVEL SECURITY` on all sensitive tables.
  - Update `public.is_platform_admin()` in the additive security migration to delegate to `public.is_active_staff_for_user(auth.uid())` (with backward-compatible fallback only where appropriate) and add department-specific RLS policies using `public.has_staff_permission_for_user(auth.uid(), '<permission_code>')` + `public.current_session_is_aal2()` helper checking `(auth.jwt()->>'aal') = 'aal2'`.

---

#### [MED-06] Missing Private Storage Buckets & `storage.objects` RLS Policies
- **Severity**: **Medium**
- **Affected Database Objects**:
  - `storage.buckets` and `storage.objects`
- **Existing Implementation**:
  - Live Supabase currently has 0 storage buckets provisioned (`storage.listBuckets()` returned `[]` for `anon`).
  - `20261104120000_phase2_staff_governance_and_seller_verification_pending_approval.sql` provisions only `staff-hr-docs` and `seller-verification-docs` and defines **no RLS policies on `storage.objects`**.
  - Required buckets from the security specification (`property-photos`, `host-verification-docs`, `production-private-docs`, `community-private-docs`) are not provisioned in the migration.
- **Recommended Fix**:
  - Provision all 6 required buckets idempotently in the additive migration:
    - Public bucket (read-only public, authenticated/authorized upload): `property-photos` (5 MB limit, `image/jpeg`, `image/png`, `image/webp`)
    - Private buckets (`public = false`, 10 MB limit, `application/pdf`, `image/jpeg`, `image/png`, `image/webp`):
      1. `staff-hr-docs`
      2. `seller-verification-docs`
      3. `host-verification-docs`
      4. `production-private-docs`
      5. `community-private-docs`
  - Define strict `storage.objects` RLS policies scoping path prefixes to the owning user or authorized AAL2 staff with matching department permission.

---

### LOW & INFORMATIONAL FINDINGS

#### [LOW-01] `GET /api/properties` Uses `createAdminClient()` Without Filtering for Published & Approved Properties
- **Severity**: **Low**
- **Affected File**: `app/api/properties/route.ts`
- **Existing Implementation**:
  - `GET /api/properties` calls `createAdminClient().from('properties').select(...)` without `.eq('published', true).eq('moderation_status', 'approved')`.
- **Identified Vulnerability**:
  - Unauthenticated callers hitting `/api/properties` receive draft, pending-review, or rejected properties along with `host_id` and `moderation_notes`.
- **Recommended Fix**:
  - Filter `GET /api/properties` strictly to `.eq('published', true).eq('moderation_status', 'approved')` and select only public-safe columns (excluding `host_id` and `moderation_notes`).

#### [LOW-02] Verbose Internal Error Messages in API Catch Blocks
- **Severity**: **Low**
- **Affected Files**: Multiple `app/api/**/route.ts` files
- **Recommended Fix**: Sanitize `500` error responses so internal PostgreSQL table/constraint details are logged server-side but not leaked raw to public clients.

#### [LOW-03] Supabase Dashboard Auth Hardening Settings Require Manual Verification
- **Severity**: **Low**
- **Affected Component**: Supabase Dashboard (`Authentication -> Providers / Security / Rate Limits / Emails`)
- **Recommended Fix**: Follow the step-by-step instructions in `docs/security/SUPABASE_AUTH_CONFIGURATION.md` to enable Leaked Password Protection (HaveIBeenPwned), minimum 12-character passwords, CAPTCHA (Cloudflare Turnstile), custom SMTP, and strict rate limits.

---

## Phase 2: Complete Security Architecture Design

### 1. Three-Portal Isolation Architecture

| Portal Hostname | Purpose | Allowed Identities | Required Auth Assurance | Forbidden Routes / Actions |
| :--- | :--- | :--- | :--- | :--- |
| `uttarkunth.com` | Public Platform | Guests, Hosts, Sellers, Filmmakers, Community Members, Visitors | Standard Auth (`aal1` or `aal2` if enrolled) | Cannot access `/admin/*` or `/api/admin/*` unless authenticated as Staff/Founder; when `ENFORCE_PORTAL_HOST_SEPARATION=true`, `/admin/*` on public domain redirects to `team.uttarkunth.com` or `admin.uttarkunth.com`. |
| `team.uttarkunth.com` | Internal Staff Portal | Active Staff (`status = 'active'`, `agreements_completed = true`, `founder_approved_at IS NOT NULL`) & Founder | **Mandatory TOTP MFA (`aal2`)** | Blocks public `/signup`, `/login`, `/account`, `/host`, `/guest`. Blocks Founder-only routes (`/admin/staff` mutations, `/admin/users`, `/admin/settings` platform config) for non-Founder staff. |
| `admin.uttarkunth.com` | Founder Command Centre | **Founder Only** (`role_slug = 'founder'`) | **Mandatory TOTP MFA (`aal2`)** | Blocks all non-Founder staff, public members, and anonymous users. Full command over Staff Governance, Dual Approvals, Seller/Host/Production/Community overrides, and Audit Logs. |

### 2. Zero-Trust Authorization Matrix (Defense-in-Depth)

Every request passes through **4 independent security layers**:
1. **Layer 1 — Edge Middleware (`middleware.ts`)**:
   - Refreshes Supabase SSR session cookies safely.
   - Enforces portal hostname boundaries (`admin.uttarkunth.com` vs `team.uttarkunth.com` vs `uttarkunth.com`).
   - Blocks open staff registration (`/staff/signup`, `/staff/register`) on all domains.
   - Injects HTTP security headers (`CSP`, `HSTS`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) and portal context headers (`x-uttarkunth-portal`).
2. **Layer 2 — Server Component Layout & Page Guards (`app/admin/layout.tsx`, `app/admin/**/page.tsx`)**:
   - Validates user session via `supabase.auth.getUser()` (never trusting `getSession()` alone).
   - Verifies active `staff_profiles` row, 8/8 agreements, Founder sign-off, and **mandatory `aal2` MFA** (`requireMfaAal2: true`).
   - Enforces `role_slug === 'founder'` when accessed via `admin.uttarkunth.com` or on Founder-exclusive pages (`/admin/users`).
3. **Layer 3 — API Route Permission & Dual-Approval Guards (`app/api/admin/**/route.ts`)**:
   - Every `/api/admin/*` route calls `requireStaffPermission('<granular_permission>', { requireMfaAal2: true })`.
   - High-risk operations (`stays.properties.publish`, `stays.hosts.verify`, `products.sellers.approve`, `products.items.publish`, `staff.permissions.grant`) enforce `evaluateDualApprovalRequirement()` for non-Founder staff.
   - Every state change writes an immutable before/after entry to `public.staff_audit_log` and `public.admin_audit_log`.
4. **Layer 4 — PostgreSQL Row-Level Security (`RLS` + `FORCE ROW LEVEL SECURITY`)**:
   - Even if an application query uses the user's JWT client, PostgreSQL enforces ownership (`auth.uid() = user_id`), active staff permissions (`public.has_staff_permission_for_user(auth.uid(), ...)`), and AAL2 assurance (`public.current_session_is_aal2()`).
   - Immutable triggers (`prevent_audit_log_mutation`) block `UPDATE` and `DELETE` on `admin_audit_log` and `staff_audit_log` even for `service_role`.
