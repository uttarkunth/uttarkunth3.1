# Uttarkunth 3.1 — Cloudflare Workers, Staff Subdomain & Supabase Deployment Guide

**Platform:** Uttarkunth (`uttarkunth.com`, `admin.uttarkunth.com` & `team.uttarkunth.com`)  
**Repository:** `uttarkunth/uttarkunth3.1`  
**Working Branch:** `uttarkunthmain2` (Release Candidate)  
**Supabase Project:** `xyplgugxpmlnjsvlosdg`  
**Deployment Target:** Cloudflare Workers via `@opennextjs/cloudflare`

> [!IMPORTANT]
> **Production Safety Rule:** Do not apply pending database migrations to live production or deploy to Cloudflare until explicitly reviewed and approved by the Founder. Live homestays (`Yash Home Stay` and `Wonderway Retreat`), existing bookings, and live Auth accounts must remain untouched.

---

## 1. Clean Build & Local Verification Commands

```bash
# Install dependencies
npm install

# Run full verification suite before building
npx tsc --noEmit
npm run lint
npm test

# Build Next.js production output (77 static/dynamic routes)
npm run build

# Build Cloudflare Worker bundle (.open-next/worker.js & .open-next/assets)
npm run build:worker

# Preview locally in Cloudflare Workers runtime (workerd)
npm run preview
```

---

## 2. Cloudflare Workers Builds Configuration (When Approved)

1. In the **Cloudflare Dashboard**, go to **Workers & Pages > Create Application > Workers > Connect to Git**.
2. Select repository `uttarkunth/uttarkunth3.1` and branch `uttarkunthmain2`.
3. Configure build settings:
   - **Root directory:** `/`
   - **Build command:** `npm run build:worker`
   - **Deploy command:** `npx wrangler deploy`
4. Verify `wrangler.jsonc` at the repository root:
   - `name`: `"uttarkunth3-1"`
   - `main`: `".open-next/worker.js"`
   - `assets.directory`: `".open-next/assets"` (`binding: "ASSETS"`)
   - `compatibility_date`: `"2024-12-30"`
   - `compatibility_flags`: `["nodejs_compat"]`

---

## 3. Environment Variables & Secrets in Cloudflare

### A. Build-Time Variables (Workers Builds > Settings > Builds > Build Variables)
- `NEXT_PUBLIC_SUPABASE_URL` = `https://xyplgugxpmlnjsvlosdg.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `<your-supabase-anon-key>`

### B. Runtime Variables & Encrypted Secrets (Workers & Pages > `uttarkunth3-1` > Settings > Variables and Secrets)
- `NEXT_PUBLIC_SUPABASE_URL` (Plain text)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Plain text)
- `SUPABASE_SERVICE_ROLE_KEY` (**Encrypted Secret** — strictly server-only; never prefix with `NEXT_PUBLIC_`)
- `ALLOWED_ORIGINS` = `https://uttarkunth.com,https://team.uttarkunth.com,https://admin.uttarkunth.com`
- `ENFORCE_CLOUDFLARE_ACCESS` = `true` (also enforced automatically in production)

---

## 4. Dedicated Staff Portal Hostname (`team.uttarkunth.com`) & Cloudflare Access

### A. Custom Domain Routing
1. In **Workers & Pages > `uttarkunth3-1` > Settings > Domains & Routes**, add custom domains:
   - `uttarkunth.com`
   - `team.uttarkunth.com`
   - `admin.uttarkunth.com`
2. `middleware.ts` automatically enforces staff portal isolation:
   - Any unauthenticated request to `/admin/*` redirects to `/staff/login?next=...`.
   - Open staff registration paths (`/admin/register`, `/admin/signup`, `/staff/register`, `/staff/signup`) are permanently blocked and redirected to `/staff/login?error=open_registration_prohibited`.

### B. Cloudflare Access (Mandatory Zero Trust Perimeter for Internal Subdomains)
1. In **Cloudflare Zero Trust > Access > Applications**, create two separate **Self-hosted Applications**:
   - Founder application: `admin.uttarkunth.com/*`
   - Staff application: `team.uttarkunth.com/*`
2. Restrict the Founder application to the Founder identity only. Restrict the Staff application to approved employee identities/groups. Require an appropriate strong identity factor and configure short session durations.
3. Add these Worker runtime variables:
   - `CLOUDFLARE_ACCESS_TEAM_DOMAIN` = `<your-team-name>.cloudflareaccess.com`
   - `CLOUDFLARE_ACCESS_AUD_FOUNDER` = `<Application Audience (AUD) tag for admin.uttarkunth.com>`
   - `CLOUDFLARE_ACCESS_AUD_STAFF` = `<Application Audience (AUD) tag for team.uttarkunth.com>`
   - `ENFORCE_CLOUDFLARE_ACCESS` = `true`
4. The middleware verifies the JWT signature against Cloudflare's published signing keys and checks issuer, the portal-specific audience, subject, and expiry. A missing or invalid token fails closed with HTTP 403. Do not substitute a mere header-presence check.
5. **Defense-in-Depth:** Cloudflare Access is only the outer perimeter. Supabase Auth, server-side staff RBAC, route-level permissions, and Supabase TOTP MFA (`aal2`) remain mandatory. Keep the Worker origin protected so requests cannot bypass the Access-gated custom hostnames.

---

## 5. Supabase Database Migrations & Secure Founder Provisioning

### A. Ordered Pending Migrations (Review Before Applying)
Run in the Supabase SQL Editor only after explicit Founder sign-off:
1. `supabase/migrations/20260418010000_phase2a_foundation_pending_approval.sql`
2. `supabase/migrations/20261101120000_products_marketplace_pending_approval.sql`
3. `supabase/migrations/20261102120000_phase2f_bilateral_agreements_pending_approval.sql`
4. `supabase/migrations/20261103120000_phase2g_2h_productions_community_pending_approval.sql`
5. `supabase/migrations/20261104120000_phase2_staff_governance_and_seller_verification_pending_approval.sql`

### B. Secure Provisioning of the Founder Account
In `20261104120000_phase2_staff_governance_and_seller_verification_pending_approval.sql`, `public.provision_founder_account` is locked down:
- Execution privileges are explicitly revoked from `PUBLIC`, `anon`, and `authenticated`.
- Only the postgres superuser / trusted database owner and `service_role` possess `EXECUTE` privileges.
- The function strictly validates that the supplied Auth UUID exists in `auth.users` and that the submitted official email exactly matches the registered email on that account.
- It does **not** falsely mark MFA as enrolled, does **not** create fictitious staff agreements, and does **not** store fabricated identity or mobile records. Genuine TOTP enrollment must occur through Supabase Auth.

To provision your Founder profile from the **Supabase SQL Editor** as the database owner:

```sql
SELECT public.provision_founder_account(
  'YOUR_ACTUAL_SUPABASE_AUTH_UUID'::uuid,
  'your-registered-founder-email@uttarkunth.com',
  'Gaurav Negi',
  '+919876543210' -- Your genuine registered contact number
);
```

### C. Verifying Function Privileges
Run this query in the Supabase SQL Editor to confirm that anonymous and public users cannot execute the Founder provisioning procedure:

```sql
SELECT
  has_function_privilege('anon', 'public.provision_founder_account(uuid, text, text, text)', 'EXECUTE') AS anon_can_exec,
  has_function_privilege('authenticated', 'public.provision_founder_account(uuid, text, text, text)', 'EXECUTE') AS auth_can_exec,
  has_function_privilege('service_role', 'public.provision_founder_account(uuid, text, text, text)', 'EXECUTE') AS service_role_can_exec;
```

**Expected Result:**
- `anon_can_exec`: `false`
- `auth_can_exec`: `false`
- `service_role_can_exec`: `true`


## 7. Phase 4 Corrective Migration (For Databases Where Phase 2/3 Are Already Applied)

If the Supabase migration history already contains `20261105191418` (Phase 2) and `20261105191649` (Phase 3), do not edit or replay those historical migrations. Review and apply the forward-only migration:

`supabase/migrations/20261106000100_correct_phase3_admin_host_and_private_storage_permissions.sql`

This migration resets `onboarding_completed` to false only where the privacy notice or required agreement flags are incomplete; it does not fabricate consent. It closes the arbitrary-user property-host check, requires completed staff approval/consent/onboarding plus AAL2 for privileged RLS access, and restricts private HR/seller/host/production/community documents to their owner or the verified Founder with AAL2.

Before applying it to production, verify the migration against a staging copy and test normal host/property access, staff onboarding, Founder first login, TOTP enrollment, and storage access for each owner bucket.
