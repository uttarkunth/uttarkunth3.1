# UTTARKUNTH 3.1 — MASTER TECHNICAL REFERENCE FOR CHATGPT (COPY & PASTE)

Copy and paste everything below into ChatGPT. No file attachment is required.

---

```markdown
# UTTARKUNTH 3.1 — CONSOLIDATED CODEBASE & ARCHITECTURE REFERENCE

**Repository:** `uttarkunth/uttarkunth3.1`  
**Working Branch:** `uttarkunthmain2`  
**Domains:** `uttarkunth.com` (Public Ecosystem) & `team.uttarkunth.com` (Internal Staff Portal)  
**Stack:** Next.js 14.2.35 (App Router) + TypeScript 5.7.3 + Tailwind CSS 3.4.17 + Supabase (Auth, PostgreSQL, Private Storage) + OpenNext (`@opennextjs/cloudflare`) + Cloudflare Workers.  
**Build & Test Status:**
- `npx tsc --noEmit`: PASS (0 errors)
- `npm run lint`: PASS (0 warnings, 0 errors)
- `npm test`: PASS (127 / 127 tests passing across 11 suites, including 26 Phase 2 security & governance scenarios)
- `npm run build`: PASS (77 / 77 routes compiled)
- `npm run build:worker`: PASS (`.open-next/worker.js` and `.open-next/assets` generated)

## 1. Core Architectural Changes & Security Remediations Completed

1. **Founder Account Provisioning Security Lockdown (`supabase/migrations/20261104120000_phase2_staff_governance_and_seller_verification_pending_approval.sql`)**:
   - Explicitly revoked execution from `PUBLIC`, `anon`, and `authenticated` (`REVOKE ALL ON FUNCTION public.provision_founder_account FROM PUBLIC, anon, authenticated;`).
   - Granted execute permissions strictly to `service_role` and the database owner (`GRANT EXECUTE ON FUNCTION public.provision_founder_account TO service_role;`).
   - Verifies that `v_founder_auth_id` genuinely exists in `auth.users` and that `v_founder_email` matches `auth.users.email`.
   - Removed all fake MFA assertions, fabricated passport numbers, false agreements, and dummy phone numbers.
   - Provides a SQL verification query using `has_function_privilege` for auditing.

2. **Reconciled Canonical Staff Contracts & Database Column Names**:
   - Unified on `role_slug`, `permission_key`, `founder_approved_at`, and `founder_approved_by` across the SQL migration, TypeScript interfaces (`lib/staff-rbac-shared.ts`, `lib/supabase/types.ts`), and API routes (`app/api/admin/staff/route.ts`, `app/api/staff/onboard/route.ts`).
   - Backward-compatibility triggers (`trg_sync_staff_profile_role`, `trg_sync_staff_invitation_role`) synchronize `role_slug` and `role_code` automatically.

3. **Separated Identity Systems & Removal of All Auth Bypasses (`middleware.ts`, `lib/auth.ts`, `lib/staff-rbac.ts`)**:
   - Removed `FOUNDER_PREVIEW_USER`, `ENFORCE_STRICT_STAFF_LOGIN`, and deleted `lib/staff-preview-store.ts`.
   - Unauthenticated requests to `/admin/*` strictly redirect to `/staff/login?next=...`.
   - Open staff registration routes (`/admin/register`, `/admin/signup`, `/staff/register`, `/staff/signup`) redirect to `/staff/login?error=open_registration_prohibited`.
   - `checkIsPlatformAdmin(userId)` and `resolveFounderOrAdminSession()` strictly fail closed (`false` / `{ user: null, isAdmin: false }`) if unauthenticated or if DB verification fails.
   - `requireStaffPermission()` verifies real Supabase Auth TOTP MFA (`aal2`) via `supabase.auth.mfa.getAuthenticatorAssuranceLevel()` and `listFactors()`, checks `staff_profiles` (`status === 'active'`, `founder_approved_at`, `staff_id`, `session_revoked_at`), merges `staff_permission_assignments`, enforces `HIGH_RISK_ACTIONS_REQUIRING_DUAL_APPROVAL` via `staff_dual_approvals` (blocking self-approval), and logs every action to append-only `staff_audit_log`.

4. **Real Staff Invitation, Onboarding & Governance Persistence (`app/api/admin/staff/route.ts`, `app/api/staff/onboard/route.ts`, `app/api/staff/documents/route.ts`)**:
   - Single-use expiring invitations (`staff_invitations`) store SHA-256 `token_hash`.
   - `POST /api/staff/onboard` verifies all 8 mandatory staff agreements using canonical SHA-256 hashes (`ag.canonicalContent.trim()`), uploads HR identity documents to private bucket `staff-hr-docs` via `/api/staff/documents`, creates or verifies a real Supabase Auth user UUID (handling existing-email accounts via password verification without creating duplicate users), atomically locks the invitation, and writes real UUID rows into `staff_profiles`, `staff_agreement_acceptances`, and `staff_documents`.
   - Suspending or terminating staff (`suspend_staff`, `terminate_staff`) sets `session_revoked_at`, revokes `staff_permission_assignments`, removes from `platform_admins`, and calls `adminClient.auth.admin.signOut(userId, 'global')`.

5. **Unified Common Member Registration, `public.profiles` & Host Application (`app/signup/page.tsx`, `app/register/page.tsx`, `lib/roles.ts`, `app/api/account/profile/route.ts`, `app/api/host/apply/route.ts`, `app/host/properties/new/page.tsx`)**:
   - Public signup registers every user as a common Uttarkunth Member without setting `user_metadata.role`.
   - `lib/roles.ts` (`evaluateMemberCapabilities` / `resolveMemberCapabilities`) derives capabilities (Host, Seller, Filmmaker, Community Contributor) strictly from verified DB rows (`properties`, `property_hosts`, `sellers`, `filmmaker_profiles`, `community_participations`).
   - `/api/account/profile` reads/upserts `public.profiles` (while `public.public_member_profiles` view excludes private `phone`).
   - Replaced the `/stays/partner` <-> `/host/properties/new` redirect loop with an authenticated Host Property Application form (`POST /api/host/apply`, `published: false`, `moderation_status: 'pending'`).

6. **Seller Brand & Private Business Verification (`lib/seller-verification.ts`, `app/api/products/apply/route.ts`, `app/api/products/documents/route.ts`, `app/api/products/seller-desk/route.ts`, `app/api/admin/products/route.ts`)**:
   - Validates 15-character Indian GSTIN format, state code, PAN segment, and Modulo-36 check digit (`validateIndianGSTIN`).
   - Records Official GST Portal (`services.gst.gov.in`) verification checks in `seller_verification_checks` (blocking `verified` status if taxpayer status is not `Active` or legal/trade name mismatches).
   - Uploads private verification documents to private bucket `seller-verification-docs` (`POST /api/products/documents`) and serves 60-second signed URLs (`GET /api/products/documents?id=...`) only to the document owner or active staff with `seller.verify_documents` / `finance.review_agreements` + AAL2 MFA + audit log (Support Executives and other sellers receive `403`).
   - Seller Desk (`POST /api/products/seller-desk`) blocks bank/payout details, prevents self-approval, and triggers `reverification_pending` (`status: 'pending'`) whenever legal business name or GSTIN is modified.

7. **Productions Honesty & Filmmaker Takedown Workflow (`app/account/productions/page.tsx`, `components/filmmaker-takedown-button.tsx`, `app/api/production/proposals/route.ts`, `app/api/admin/productions/route.ts`)**:
   - Explicitly displays `"Audience & Streaming Telemetry: Analytics not connected"` with zero fabricated view or revenue metrics.
   - Filmmakers can submit takedown/archival requests (`action: 'request_takedown'` -> `status: 'takedown_requested'`), and Productions Editors can approve/archive (`status: 'archived'`) with `recordStaffAuditLog`.

8. **Next.js Client/Server Boundary & Supabase Client Hardening (`lib/destinations.ts`, `lib/destinations.server.ts`, `lib/supabase/admin.ts`, `lib/supabase/server.ts`, `lib/supabase/client.ts`, `next.config.mjs`)**:
   - `lib/destinations.ts` is 100% browser-safe (zero server imports); DB-backed `getActiveDestinations()` lives in `lib/destinations.server.ts`.
   - Clean `next.config.mjs` with no webpack workaround alias (`next/headers` alias removed).
   - Removed all hardcoded Supabase project URLs and anon keys from `lib/supabase/{admin,server,client}.ts`. `createAdminClient()` throws if `SUPABASE_SERVICE_ROLE_KEY` is missing and never falls back to the anon key.

9. **Pending Production Isolation**:
   - All migrations and Cloudflare Worker deployments remain in staged, pending-approval status. Live Supabase database tables and data are untouched.
```
