# Uttarkunth 3.1 — Cloudflare Workers, Staff Subdomain & Supabase Deployment Guide

**Platform:** Uttarkunth (`uttarkunth.com` & `team.uttarkunth.com`)  
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
- `ALLOWED_ORIGINS` = `https://uttarkunth.com,https://team.uttarkunth.com`

---

## 4. Dedicated Staff Portal Hostname (`team.uttarkunth.com`) & Cloudflare Access

### A. Custom Domain Routing
1. In **Workers & Pages > `uttarkunth3-1` > Settings > Domains & Routes**, add custom domains:
   - `uttarkunth.com`
   - `team.uttarkunth.com`
2. `middleware.ts` automatically enforces staff portal isolation:
   - Any unauthenticated request to `/admin/*` redirects to `/staff/login?next=...`.
   - Open staff registration paths (`/admin/register`, `/admin/signup`, `/staff/register`, `/staff/signup`) are permanently blocked and redirected to `/staff/login?error=open_registration_prohibited`.

### B. Cloudflare Access (Zero Trust External Perimeter Gate — Recommended)
1. In **Cloudflare Zero Trust > Access > Applications**, create a **Self-hosted Application** for:
   - `team.uttarkunth.com/*`
   - `uttarkunth.com/staff/*`
   - `uttarkunth.com/admin/*`
2. Create an **Allow** policy restricted to authorised Uttarkunth staff emails (`@uttarkunth.com` or Founder email list) requiring One-Time PIN or hardware MFA.
3. **Defense-in-Depth:** Cloudflare Access is an outer perimeter gate only; application-level authentication (`middleware.ts`, `lib/auth.ts`, `requireStaffPermission()` in `lib/staff-rbac.ts`) and Supabase Auth TOTP MFA (`aal2`) remain mandatory on every request.

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
