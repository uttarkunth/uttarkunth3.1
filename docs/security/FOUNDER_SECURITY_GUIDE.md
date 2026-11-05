# Uttarkunth 3.1 — Founder Security & Governance Guide

**Portal**: Founder Command Centre (`admin.uttarkunth.com` / `/admin/dashboard`)  
**Required Identity**: Active `public.staff_profiles` row with `role_slug = 'founder'` and TOTP MFA (`aal2`)  

---

## 1. Accessing the Founder Command Centre

1. Navigate to `https://admin.uttarkunth.com` (or `/staff/login?portal=founder&next=/admin/dashboard`).
2. Authenticate using your official Founder email and password.
   - **Never** enter your immutable Staff ID (`UK-STAFF-2026-0001`) as a password; the system automatically blocks and logs any attempt to use a Staff ID as a credential.
3. Complete **Step 2: Mandatory TOTP Authenticator Check (AAL2)** using your enrolled authenticator app (Google Authenticator, 1Password, or Authy).
   - If signing in for the first time, scan the TOTP QR code displayed on screen and enter the 6-digit verification code to upgrade your session to `aal2`.
4. Non-Founder staff accounts are strictly blocked from `admin.uttarkunth.com` (`403 FOUNDER_ONLY_PORTAL`).

---

## 2. Applying Pending Database Migrations in Supabase

To activate the Phase 2 Staff Governance & Seller Verification tables and the Phase 3 Master Security & Storage Hardening rules on live Supabase (`xyplgugxpmlnjsvlosdg`), execute the following two additive SQL migrations in order inside the **Supabase Dashboard -> SQL Editor**:

1. `supabase/migrations/20261104120000_phase2_staff_governance_and_seller_verification_pending_approval.sql`
2. `supabase/migrations/20261105120000_phase3_master_security_rls_and_storage_hardening_pending_approval.sql`

Both migrations are 100% additive, idempotent, and preserve all existing properties (`Yash Home Stay`, `Wonderway Retreat`), room units, bookings, sellers, products, filmmakers, and community records.

---

## 3. Bootstrapping & Managing Staff Onboarding (`/admin/staff`)

1. **Issue a Single-Use Invitation**:
   - Open **Hiring & People (`/admin/staff`)**.
   - Enter the candidate's official email, proposed designation, employment category, assigned role (`property_reviewer`, `marketplace_reviewer`, `productions_editor`, `community_manager`, etc.), and operational department (`stays`, `products`, `productions`, or `community`).
   - Copy the generated single-use invitation link (raw token is shown once; only its SHA-256 hash is stored in the database).
2. **Candidate Onboarding (`/staff/onboard`)**:
   - The candidate signs in with the invited email, reviews and accepts all **8 mandatory legal agreements** (verified via canonical SHA-256 hashes), and submits their onboarding dossier.
3. **Founder Review & Approval**:
   - Review the candidate's accepted agreements and private HR documents (`staff-hr-docs`) in `/admin/staff`.
   - Click **Approve & Activate Staff** (requires Founder `aal2` MFA). The platform assigns an immutable `UK-STAFF-YYYY-XXXX` identifier and activates their department workspace at `/staff` (`team.uttarkunth.com`).

---

## 4. Delegating Shared Functions & Revoking Access

- **Granting or Revoking Granular Permissions**:
  - HR, Finance, Legal & Compliance, Technology, and Customer Support are centralized under the Founder Office.
  - To delegate a specific capability (e.g., `finance.review_agreements` or `support.manage_tickets`), add it to the staff member's `custom_permissions` or `staff_permission_assignments` (`grant_type = 'grant'`).
  - To revoke an inherited role permission without changing the staff member's role, add the permission to `revoked_permissions` (`grant_type = 'revoke'`). Explicit revocations always override role defaults.
- **Immediate Suspension or Termination**:
  - In `/admin/staff`, click **Suspend** or **Terminate** and provide a mandatory audit reason.
  - This sets `status = 'suspended' | 'terminated'` and stamps `session_revoked_at = now()`, immediately invalidating all existing JWT sessions for that staff member across all portals and API routes.
