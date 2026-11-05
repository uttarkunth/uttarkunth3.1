# Uttarkunth 3.1 — Master Platform Architecture

**Repository**: `https://github.com/uttarkunth/uttarkunth3.1` (branch `uttarkunthmain2`)  
**Supabase Backend**: `https://xyplgugxpmlnjsvlosdg.supabase.co`  

---

## 1. Three-Portal Single-Codebase Architecture

Uttarkunth 3.1 operates three distinct portals from one unified Next.js App Router codebase, one Cloudflare deployment, and one Supabase database:

| Portal | Domain | Canonical Path | Allowed Identities | Required Auth Level |
|---|---|---|---|---|
| **Public Platform** | `uttarkunth.com` | `/`, `/stays`, `/products`, `/productions`, `/community`, `/account` | Visitors, Guests, Hosts, Sellers, Filmmakers, Community Members | Public or Authenticated (`aal1`) |
| **Founder Command Centre** | `admin.uttarkunth.com` | `/admin/dashboard`, `/admin/staff`, `/admin/*` | Founder & Chief Executive (`role_slug === 'founder'`) **ONLY** | Active `staff_profiles` + Mandatory TOTP MFA (`aal2`) |
| **Uttarkunth Staff Portal** | `team.uttarkunth.com` | `/staff` (plus department desks `/admin/properties`, `/admin/products`, `/admin/productions`, `/admin/community`) | Active, Founder-approved Staff and Founder | Active `staff_profiles` + Completed 8 Agreements + Mandatory TOTP MFA (`aal2`) |

### Key Security Invariant
**Domain/hostname is never treated as proof of authorization.** Every request passes through:
1. Edge hostname & security header middleware (`/middleware.ts`).
2. Server Component layout guards (`/app/admin/layout.tsx`, `/app/staff/page.tsx`).
3. Server API route RBAC + AAL2 MFA + department isolation checks (`requireStaffPermission` in `/lib/staff-rbac.ts`).
4. PostgreSQL Row Level Security (`FORCE ROW LEVEL SECURITY`) and `BEFORE UPDATE` immutability triggers.

---

## 2. Four Operational Pillars & Centralized Shared Functions

### Four Operational Departments
1. **UTTARKUNTH STAYS** (`stays` / `stays_curation`)
2. **UTTARKUNTH PRODUCTS** (`products` / `marketplace_compliance`)
3. **UTTARKUNTH PRODUCTIONS** (`productions`)
4. **UTTARKUNTH COMMUNITY** (`community`)

### Centralized Founder-Managed Shared Functions (`founder_office`)
- Human Resources (Staff Invitations, Onboarding Dossiers, 8 Mandatory Agreements, Suspension/Termination)
- Finance, Tax & Commercial Agreements (`host_agreements`, Modulo-36 GSTIN verification)
- Legal & Regulatory Compliance (`seller-verification-docs`, `staff-hr-docs`)
- Technology, Security & RBAC Governance (`staff_permission_assignments`, `staff_dual_approvals`)
- Customer Support & Cross-Pillar Escalations
