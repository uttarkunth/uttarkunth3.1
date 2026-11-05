# Uttarkunth 3.1 — Security Implementation Report

**Project**: Uttarkunth 3.1 Complete Security Audit & Master Architecture Implementation  
**Connected Supabase Project**: `https://xyplgugxpmlnjsvlosdg.supabase.co`  
**Date**: November 5, 2026  

---

## 1. Executive Summary of Implemented Security Controls

Following the complete live Supabase and codebase audit (`docs/security/SECURITY_AUDIT_REPORT.md`), we implemented defense-in-depth across all five layers of the Uttarkunth 3.1 platform:

1. **Three-Portal Hostname & Authorization Boundary (`/middleware.ts`, `/lib/staff-rbac.ts`, `/app/admin/layout.tsx`)**:
   - `uttarkunth.com` — Public Website & Unified Member Account (`/account`).
   - `admin.uttarkunth.com` — **Founder Command Centre** (strictly restricted to `role_slug === 'founder'` with verified TOTP MFA `aal2`; all non-Founder staff receive `403 FOUNDER_ONLY_PORTAL`).
   - `team.uttarkunth.com` — **Uttarkunth Staff Portal** (`/staff`, strictly restricted to active, Founder-approved staff with completed agreements, immutable `UK-STAFF-YYYY-XXXX` ID, and verified TOTP MFA `aal2`).
   - Hostname is never trusted as authorization; every page and API route re-verifies identity, status, agreements, AAL2 MFA, department, and permission on the server.

2. **Four-Department Restructuring & Strict Departmental Isolation (`/lib/staff-rbac-shared.ts`, `/lib/staff-rbac.ts`, `/app/staff/page.tsx`)**:
   - Consolidated operational staff into the four primary Uttarkunth pillars:
     1. `UTTARKUNTH STAYS` (`stays` / `stays_curation`)
     2. `UTTARKUNTH PRODUCTS` (`products` / `marketplace_compliance`)
     3. `UTTARKUNTH PRODUCTIONS` (`productions`)
     4. `UTTARKUNTH COMMUNITY` (`community`)
   - Centralized HR, Finance, Legal & Compliance, Technology, Customer Support, and Governance under the Founder (`founder_office`), delegable only via explicit Founder permission grants.
   - Enforced explicit permission revocation precedence: `revoked_permissions` and `staff_permission_assignments.grant_type === 'revoke'` always override inherited role permissions (`403 PERMISSION_REVOKED`).

3. **API Route Hardening Across All `/api/admin/*` and Public/Member Endpoints**:
   - Upgraded `/api/admin/moderation`, `/api/admin/hosts`, `/api/admin/agreements`, `/api/admin/community`, `/api/admin/productions`, `/api/admin/products` (`GET`), and `/api/admin/staff` (`GET`) from coarse `checkIsPlatformAdmin` checks to granular `requireStaffPermission(..., { requireMfaAal2: true, requiredDepartment })` + immutable `recordStaffAuditLog()`.
   - Secured `/api/bookings/cancel` against IDOR by requiring cryptographic `guest_access_token` verification against `guest_access_token_hash` (via `crypto.timingSafeEqual`), authenticated guest email match, property host/manager ownership, or AAL2 Stays staff permission (`stays.bookings.manage`).
   - Hardened `/api/host/properties/[id]/photos` with binary magic-byte inspection (`validateFileMagicBytes`), path traversal sanitization, and AAL2 Stays staff verification for staff overrides.
   - Secured `/api/staff/mfa-recovery` to verify `official_email` against `public.staff_profiles` before writing to `staff_audit_log`.
   - Closed Open Redirect vectors across `/api/auth/callback`, `/app/login/page.tsx`, and `/app/staff/login/page.tsx` via `sanitizeInternalRedirectPath()`.

4. **Mandatory TOTP MFA (AAL2) Enforcement on Staff & Founder Logins (`/app/staff/login/page.tsx`)**:
   - Eliminated the `aal1` login bypass when no TOTP factor is enrolled: staff or Founder users without a verified TOTP factor are immediately routed into mandatory TOTP QR enrollment before entering `/staff` or `/admin/dashboard`.

5. **Additive Database & Storage Hardening Migration (`supabase/migrations/20261105120000_phase3_master_security_rls_and_storage_hardening_pending_approval.sql`)**:
   - Prepared an idempotent, non-destructive SQL migration (pending Founder approval prior to live execution) that:
     - Fixes live `anon` error `42501: permission denied for table property_hosts` on `public.properties` and `public.room_units` via `SECURITY DEFINER` function `public.is_property_host(uuid, uuid)`.
     - Adds `public.current_session_is_aal2()` and unifies `public.is_platform_admin()` with `public.staff_profiles`.
     - Enables `FORCE ROW LEVEL SECURITY` on all sensitive tables.
     - Adds `BEFORE UPDATE` triggers (`enforce_property_moderation_guard`, `enforce_seller_status_immutability`, `enforce_product_moderation_immutability`, `enforce_filmmaker_status_immutability`) to block direct PostgREST self-approval.
     - Creates `public.reviews` with strict RLS and provisions all 6 storage buckets (`property-photos` public; `staff-hr-docs`, `seller-verification-docs`, `host-verification-docs`, `production-private-docs`, `community-private-docs` private).
