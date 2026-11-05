# Uttarkunth 3.1 — Unified Himalayan Ecosystem Platform

**Learn by Doing • Grow by Serving 💜**

**Website:** [https://uttarkunth.com](https://uttarkunth.com)  
**Staff Portal Hostname:** `team.uttarkunth.com` (routes to `/staff/login` and `/admin/*`)  
**Repository:** `uttarkunth/uttarkunth3.1`  
**Working Branch:** `uttarkunthmain2`  
**Stack:** Next.js 14 App Router (`14.2.35`), TypeScript (`5.7.3`), Tailwind CSS (`3.4.17`), Supabase Auth / PostgreSQL / Private Storage, OpenNext for Cloudflare (`@opennextjs/cloudflare`), Cloudflare Workers.

---

## 1. Platform Ecosystem Overview

Uttarkunth 3.1 unites four public pillars with a strictly separated internal staff governance architecture:

1. **Uttarkunth Stays (`/stays`):** Curated Himalayan homestays in Jari, Parvati Valley, Kullu, Uttarakhand, and Jammu & Kashmir (`Yash Home Stay`, `Wonderway Retreat`), with request-only booking, room-level concurrency protection, 0% default commission, and direct host settlement.
2. **Uttarkunth Products / Marketplace (`/products`):** Authentic Himalayan crafts, woollens, and mountain harvests with a two-layer Seller Brand & Private Business Verification system (15-character Indian GSTIN Modulo-36 validation, Official GST Portal verification workflow, and configurable category licence checklists).
3. **Uttarkunth Productions (`/production`):** Independent Himalayan documentaries (*Aaj Ka Devta*, *Ruk Gayi Gupt Bali*), filmmaker collaboration registry, co-production pitch workflow, honest telemetry status (`Analytics not connected`), and filmmaker takedown/archival requests.
4. **Uttarkunth Community (`/community`):** Karmayog philosophy, Living University vision, 9 grassroots mountain initiatives, fellowship applications, and oral history story submissions.
5. **Unified Member Account (`/account`):** Every public registrant joins as a common **Uttarkunth Member** (`/signup` or `/register`). Capabilities (Homestay Host, Verified Seller, Filmmaker, Fellowship Applicant) are derived strictly from verified database records (`lib/roles.ts`), never from self-declared `user_metadata.role`.
6. **Private Staff Portal & Founder Governance (`/staff/login`, `/staff/onboard`, `/admin/*`):** Completely isolated internal staff identity (`public.staff_profiles`), Founder-controlled single-use expiring invitations (`public.staff_invitations`), 8 mandatory SHA-256 hashed staff agreements (`public.staff_agreement_acceptances`), immutable `UK-STAFF-YYYY-XXXX` IDs, 8 departmental roles, 18+ granular permissions, TOTP MFA (`aal2`) enforcement, Dual Authorisation (`public.staff_dual_approvals`), and append-only audit logs (`public.staff_audit_log`).

---

## 2. Supported Dependency Versions

| Package | Version | Purpose |
|---|---|---|
| `next` | `^14.2.35` | Next.js 14 App Router framework |
| `react` / `react-dom` | `^18.3.1` | React 18 UI runtime |
| `@opennextjs/cloudflare` | `^1.3.0` | OpenNext adapter for Cloudflare Workers |
| `@supabase/supabase-js` | `^2.49.1` | Supabase database & storage client |
| `@supabase/ssr` | `^0.5.2` | Cookie-based SSR Auth session management |
| `zod` | `^3.24.2` | Request payload & schema validation |
| `wrangler` | `^3.109.0` | Cloudflare Workers CLI |
| `typescript` | `^5.7.3` | Static type checking |

---

## 3. Clean Installation & Verification Steps

```bash
# 1. Install dependencies cleanly
npm install

# 2. Copy .env.example to .env.local and populate your Supabase credentials
cp .env.example .env.local

# 3. Run TypeScript static analysis
npx tsc --noEmit

# 4. Run Next.js ESLint checks
npm run lint

# 5. Run the automated test suite (127 tests across 11 test suites)
npm test

# 6. Build the production Next.js application (77 static/dynamic routes compiled)
npm run build

# 7. Build the Cloudflare Worker bundle (.open-next/worker.js and .open-next/assets)
npm run build:worker
```

---

## 4. Required Environment Variables

Create `.env.local` for local development (never commit `.env` or `.env.local`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xyplgugxpmlnjsvlosdg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-public-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-secret-key>
ALLOWED_ORIGINS=https://uttarkunth.com,https://team.uttarkunth.com,http://localhost:3000
```

- **`SUPABASE_SERVICE_ROLE_KEY`** is strictly server-only (`lib/supabase/admin.ts`). If missing, `createAdminClient()` throws an explicit configuration error and never falls back to the public anon key.

---

## 5. Security & Founder Governance Summary

1. **Founder Provisioning Lockdown:**
   - In `supabase/migrations/20261104120000_phase2_staff_governance_and_seller_verification_pending_approval.sql`, `public.provision_founder_account` is locked down with `REVOKE ALL ON FUNCTION public.provision_founder_account FROM PUBLIC, anon, authenticated;` and `GRANT EXECUTE ON FUNCTION public.provision_founder_account TO service_role;`.
   - The procedure strictly checks `auth.users` to confirm that the supplied UUID exists and that the submitted email matches the registered email on file.
   - It cannot be called anonymously or publicly via PostgREST RPC.
   - Verified via SQL:
     ```sql
     SELECT
       has_function_privilege('anon', 'public.provision_founder_account(uuid, text, text, text)', 'EXECUTE') AS anon_can_exec,
       has_function_privilege('authenticated', 'public.provision_founder_account(uuid, text, text, text)', 'EXECUTE') AS auth_can_exec,
       has_function_privilege('service_role', 'public.provision_founder_account(uuid, text, text, text)', 'EXECUTE') AS service_role_can_exec;
     ```
2. **Canonical Contract Reconciled:**
   - Standardized on `role_slug`, `permission_key`, `founder_approved_at`, and `founder_approved_by` across the SQL migration, TypeScript interfaces, and API routes.
3. **Pending Approval Isolation:**
   - All migrations and Cloudflare Worker deployments are held in pending-approval status. No live production database modifications are executed automatically.

---

## 6. Architecture & Audit Documentation

- [`docs/CHATGPT_MASTER_REFERENCE.md`](docs/CHATGPT_MASTER_REFERENCE.md) — Comprehensive technical reference for LLM and architectural review.
- [`docs/audit/CODEBASE_COMPARISON.md`](docs/audit/CODEBASE_COMPARISON.md) — Complete SHA-256 inventory and file-by-file comparison between Project A (AI Studio) and Project B (Antigravity).
- [`docs/security/SECURITY_REMEDIATION.md`](docs/security/SECURITY_REMEDIATION.md) — Detailed report of all 13 security vulnerabilities remediated and their automated verification tests.
- [`docs/database/MIGRATION_REVIEW.md`](docs/database/MIGRATION_REVIEW.md) — Database schema, RLS policies, private storage buckets (`staff-hr-docs`, `seller-verification-docs`), non-recursive `SECURITY DEFINER` helpers, and ordered migration plan.
- [`docs/testing/FINAL_TEST_REPORT.md`](docs/testing/FINAL_TEST_REPORT.md) — Complete verification and test execution report.
- [`DEPLOYMENT.md`](DEPLOYMENT.md) — Step-by-step Cloudflare Workers, `team.uttarkunth.com`, Cloudflare Access, and Supabase configuration guide.
