# Uttarkunth — Cloudflare Workers Builds & Git Deployment Guide

Platform: **Uttarkunth**  
Production Website: [https://uttarkunth.com](https://uttarkunth.com)  
Official Email: `info@uttarkunth.com`  
Supabase Project: `uttarkunth-stays` (`xyplgugxpmlnjsvlosdg`)  
Architecture: **Next.js 14 App Router + OpenNext (`@opennextjs/cloudflare`) + Cloudflare Workers Builds**

---

## 📋 Architecture Overview

Uttarkunth is a multi-pillar Next.js 14 App Router platform packaged with `@opennextjs/cloudflare` to run on Cloudflare Workers.

The platform unites four connected pillars under one unified authentication and navigation model:
1. **Stays:** Mountain homestays in Jari and Parvati Valley with request-only bookings, room-level concurrency locking, 0% default commission, and direct host settlement.
2. **Products:** Curated Himalayan goods marketplace, interest registration, seller onboarding, and admin moderation (public launch scheduled Q1 2027).
3. **Productions:** Himalayan documentaries (*Aaj Ka Devta*, *Ruk Gayi Gupt Bali*) with on-site preview playback and filmmaker collaboration workflows (database tables pending Phase 2G migration).
4. **Community:** Karmayog philosophy, Living University vision, and 9 proposed grassroots initiatives (participation and oral story database tables pending Phase 2H migration).

---

## 🚀 Step 1: Git Repository Upload (Manual by Owner)

The owner initializes, commits, and pushes the codebase to their GitHub repository.

```bash
# Inside the workspace directory:
git init
git branch -M main
git status --ignored
git add .
git status
git commit -m "feat(uttarkunth): pre-release verified build and four-pillar platform"
git remote add origin https://github.com/<YOUR-GITHUB-USERNAME>/<YOUR-REPO-NAME>.git
git push -u origin main
```

> [!NOTE]
> `.gitignore` automatically excludes `node_modules/`, `.next/`, `.open-next/`, `.wrangler/`, `.wrangler_config/`, `temp-chrome-profile/`, `*.tsbuildinfo`, `.env`, `.env*.local`, and `.dev.vars*`.

---

## ⚙️ Step 2: Connect Cloudflare Workers Builds to GitHub

Cloudflare Workers Builds uses **separate Build and Deploy commands**, while static asset routing is configured inside `wrangler.jsonc`.

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Navigate to **Compute (Workers) > Workers & Pages > Create Application > Workers > Connect to Git**.
3. Select your GitHub repository and production branch (`main`).
4. Configure the **Cloudflare Workers Builds** settings:
   - **Root directory:** `/`
   - **Build command:** `npm run build:worker` *(build-only; runs `opennextjs-cloudflare build --dangerouslyUseUnsupportedNextVersion` and generates `.open-next/worker.js` and `.open-next/assets` without deploying)*
   - **Deploy command:** `npx wrangler deploy` *(Cloudflare Workers Builds executes this after the build completes on pushes to the connected branch)*
5. Verify `wrangler.jsonc` settings (already committed in repository root):
   - **Worker Name (`name`):** `"uttarkunth3-1"`
   - **Worker Entry Point (`main`):** `".open-next/worker.js"`
   - **Static Asset Directory (`assets.directory`):** `".open-next/assets"` (bound to `"ASSETS"`)
   - **Compatibility Date (`compatibility_date`):** `"2024-12-30"`
   - **Compatibility Flags (`compatibility_flags`):** `["nodejs_compat"]`

---

## 🔐 Step 3: Configure Build & Runtime Environment Variables

### A. Cloudflare Workers Builds — Build Variables
Configure in **Workers & Pages > `uttarkunth3-1` > Settings > Builds > Build Variables and Secrets** (used during `npm run build:worker` when Next.js compiles client bundles):

| Variable Name | Type | Purpose |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Plain text | `https://xyplgugxpmlnjsvlosdg.supabase.co` (inlined into client & server bundles at build time) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Plain text | Your public Supabase anon/publishable key (inlined into client & server bundles at build time) |

### B. Deployed Cloudflare Worker — Runtime Variables & Secrets
Configure in **Workers & Pages > `uttarkunth3-1` > Settings > Variables and Secrets** (available at edge runtime to server route handlers and server components):

| Variable Name | Type | Purpose |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Plain text | `https://xyplgugxpmlnjsvlosdg.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Plain text | Your public Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret (Encrypted)** | **Strictly server-only.** Used by `lib/supabase/admin.ts` in server route handlers and SSR queries. Never expose in `NEXT_PUBLIC_*` or client code. |
| `ALLOWED_ORIGINS` | Plain text | Optional comma-separated origin list (`https://uttarkunth.com,https://*.workers.dev`) |

---

## 🌐 Step 4: Supabase Authentication Redirects

In the Supabase Dashboard for `xyplgugxpmlnjsvlosdg`:
1. Go to **Authentication > URL Configuration**.
2. **Site URL:** `https://uttarkunth.com`
3. **Redirect URLs:**
   - `https://uttarkunth.com/**`
   - `https://*.workers.dev/**`
   - `http://localhost:3000/**`

---

## 🛡️ Step 5: Post-Deployment Smoke Test Checklist

- [ ] **Homepage & Branding:** Verify `https://uttarkunth.com` renders with all 4 pillars (Stays, Products, Productions, Community) and `info@uttarkunth.com`.
- [ ] **Stays Directory:** Verify `/stays`, `/stays/yash-home-stay`, and `/stays/wonderway-retreat` display live Supabase properties, room prices (`₹900` and `₹3,500`), and request-only booking with direct host settlement.
- [ ] **Products Marketplace:** Verify `/products` and `/products/sell` (interest form and seller application backed by Phase 2F tables).
- [ ] **Productions:** Verify `/production`, `/production/aaj-ka-devta`, `/production/ruk-gayi-gupt-bali`, and `/production/collaborate` (shows clear "not yet open" notice until Phase 2G migration is applied).
- [ ] **Community:** Verify `/community`, `/community/initiatives`, `/community/participate`, and `/community/stories` (shows proposed initiatives truthfully and clear "not yet open" notice on forms until Phase 2H migration is applied).
- [ ] **Authentication & Admin Gate:** Register or sign in as an ordinary user; confirm `/admin/*` denies access (`403` / Access Restricted) unless explicitly provisioned in `public.platform_admins`.
