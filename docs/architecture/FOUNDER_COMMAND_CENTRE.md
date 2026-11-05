# Uttarkunth 3.1 — Founder Command Centre Architecture

**Domain**: `admin.uttarkunth.com`  
**Route**: `/admin/dashboard` (and `/admin/staff`, `/admin/audit`, `/admin/settings`)  
**Access Policy**: Restricted exclusively to `role_slug === 'founder'` with active TOTP MFA (`aal2`).

---

## 1. Authorization & Boundary Enforcement

1. **Middleware (`/middleware.ts`)**:
   - Detects `admin.uttarkunth.com` (`isFounderSubdomain`).
   - Blocks public member routes (`/signup`, `/login`, `/account`, `/host`, `/guest`, `/trips`) on the Founder domain.
   - Routes unauthenticated visitors to `/staff/login?portal=founder&next=/admin/dashboard`.
2. **Layout & Page Guard (`/app/admin/layout.tsx`, `/app/admin/dashboard/page.tsx`)**:
   - Verifies active `public.staff_profiles` record and `aal2` MFA session.
   - If accessed via `admin.uttarkunth.com` by any non-Founder staff role, renders a strict **403 Founder Command Centre Restricted** screen.
   - On `/admin/dashboard`, non-Founder staff are redirected to their department-scoped Staff Portal (`/staff`).
3. **API Guard (`requireStaffPermission` in `/lib/staff-rbac.ts`)**:
   - Enforces `FOUNDER_ONLY_PORTAL` (`403`) whenever `portalHost` starts with `admin.` and `role_slug !== 'founder'`.

---

## 2. The 9 Executive Governance Sections

1. **Executive Overview (19 Real-Time Database Metrics)**:
   - Total platform users, Total staff, Active staff, Pending staff invitations, Total properties, Active properties, Pending property approvals, Total bookings, Pending booking requests, Marketplace sellers, Pending seller verifications, Total products, Pending product approvals, Production proposals, Pending production reviews, Community members & entries, Pending community applications, Pending dual approvals, Security alerts.
2. **Four Operational Department Desks**:
   - Direct oversight of `UTTARKUNTH STAYS`, `UTTARKUNTH PRODUCTS`, `UTTARKUNTH PRODUCTIONS`, and `UTTARKUNTH COMMUNITY`.
3. **Hiring & People (`/admin/staff`)**:
   - Single-use invitation tokens, onboarding dossier inspection, 8 mandatory legal agreements verification, immutable `UK-STAFF-YYYY-XXXX` issuance, suspension, and termination.
4. **Audit & Quality (`/admin/audit`)**:
   - Append-only `staff_audit_log` and `admin_audit_log` inspection.
5. **Partnerships & Relations (`/admin/users`)**:
   - Primary host assignments, co-host delegations, and cross-pillar partner oversight.
6. **Finance, Tax & Compliance (`/admin/settings`)**:
   - Bilateral commercial commission agreements (`host_agreements`), SHA-256 canonical agreement digests, and GSTIN/licence compliance.
7. **Strategy & Regional Development**:
   - Curated coverage across 22 Himalayan destinations in Himachal Pradesh and Uttarakhand.
8. **Security & RBAC Governance (`/admin/staff`)**:
   - Granular permission grants (`grant_type = 'grant'`), explicit revocations (`grant_type = 'revoke'`), dual-approval workflows, and MFA recovery handling.
9. **Platform Settings (`/admin/settings`)**:
   - Commercial terms versions and platform-wide governance rules.
