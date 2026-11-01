# Uttarkunth — Cloudflare & Supabase Deployment Guide

This guide walks you through deploying **Uttarkunth** to **Cloudflare Pages**, deploying the **Scheduled Expiry Worker**, configuring **Supabase Auth and Environment Variables**, and running the **20-Point Staging Verification Matrix**.

---

## 📋 Prerequisites
- A **Cloudflare Account** (Free tier is 100% sufficient; zero paid infrastructure required).
- A **GitHub Account** containing your uploaded `uttarkunth` repository.
- Access to your **Supabase Dashboard** for project `uttarkunth-stays` (`xyplgugxpmlnjsvlosdg`).

---

## Step 1: Deploy Frontend & APIs to Cloudflare Pages

Cloudflare Pages natively serves the static assets (`index.html`, CSS, JS, media) and automatically compiles all files in `functions/api/` into serverless Pages Functions on Cloudflare's edge network.

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. In the left navigation, click **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Select your GitHub account and choose the `uttarkunth` repository.
4. Configure your build settings:
   - **Project name:** `uttarkunth` (or `uttarkunth-staging`)
   - **Production branch:** `main`
   - **Framework preset:** `None`
   - **Build command:** *(Leave blank)*
   - **Build output directory:** `.` (Single dot represents repository root)
5. Click **Save and Deploy**. Cloudflare will deploy your application in under 60 seconds to a temporary URL like:
   `https://uttarkunth.pages.dev`

---

## Step 2: Configure Environment Variables in Cloudflare Pages

The backend Pages Functions require environment variables to communicate securely with Supabase. 
> [!IMPORTANT]
> Never put actual secrets in client JavaScript files or commit them to GitHub. Configure them in the Cloudflare Dashboard:

1. In Cloudflare Pages, go to **Settings** > **Environment variables**.
2. Under **Production** (and **Preview** if desired), add the following variables:

| Variable Name | Type | Description / Value |
| :--- | :--- | :--- |
| `SUPABASE_URL` | Plain text | `https://xyplgugxpmlnjsvlosdg.supabase.co` |
| `SUPABASE_ANON_KEY` | Plain text | Your public Supabase anon key (`eyJhbGci...`) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** (Encrypted) | Your privileged Supabase service-role key (used only inside `/functions/api/*`) |
| `ALLOWED_ORIGINS` | Plain text | `https://uttarkunth.pages.dev,https://uttarkunth.com` |

3. Click **Save**.
4. Go to the **Deployments** tab, click the three dots on your latest deployment, and select **Retry deployment** so the environment variables take effect.

---

## Step 3: Deploy the Scheduled Booking Expiry Worker

Cloudflare Pages Functions handle HTTP requests, while the booking auto-expiry engine runs as a lightweight scheduled Cloudflare Worker using **Cron Triggers** (hourly `"0 * * * *"` UTC).

1. Open your terminal in the `workers/expiry` folder:
   ```bash
   cd workers/expiry
   ```
2. Log in to your Cloudflare account via Wrangler (if not already logged in):
   ```bash
   npx wrangler login
   ```
3. Store the required Supabase secrets in Cloudflare:
   ```bash
   npx wrangler secret put SUPABASE_URL
   # When prompted, paste: https://xyplgugxpmlnjsvlosdg.supabase.co

   npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   # When prompted, paste your Supabase service_role key
   ```
4. Deploy the worker:
   ```bash
   npx wrangler deploy
   ```
5. Cloudflare will deploy `uttarkunth-worker-expiry` with the hourly schedule `0 * * * *`. You can test it immediately in the Cloudflare Dashboard under **Workers & Pages** > `uttarkunth-worker-expiry` > **Triggers** > **Test trigger**.

---

## Step 4: Configure Supabase Auth Redirects

To allow guests and hosts to sign in and receive authentication callback tokens on your temporary Cloudflare address:

1. Open the [Supabase Dashboard](https://supabase.com/dashboard/project/xyplgugxpmlnjsvlosdg).
2. Go to **Authentication** > **URL Configuration**.
3. Set **Site URL** to:
   `https://uttarkunth.pages.dev` (or your custom domain `https://uttarkunth.com` once connected).
4. In **Redirect URLs**, add the following entries:
   - `https://uttarkunth.pages.dev/**`
   - `https://*.pages.dev/**`
   - `http://localhost:8788/**` (for local development)
   - `https://uttarkunth.com/**`
5. Click **Save**.

---

## Step 5: Connecting Custom Domain `uttarkunth.com` (After Testing)

Once you test the platform on `https://uttarkunth.pages.dev` and purchase `uttarkunth.com`:
1. In Cloudflare Pages, go to **Custom domains** > **Set up a custom domain**.
2. Enter `uttarkunth.com` and `www.uttarkunth.com`.
3. Cloudflare will automatically provision SSL certificates and update DNS.

---

## 🧪 20-Point Staging Verification Matrix

> [!NOTE]
> In accordance with our engineering standards, deployment and tests are **NOT claimed to have succeeded** until you actually deploy the code and execute this checklist on your staging environment.

Execute each test case on `https://uttarkunth.pages.dev`:

### Brand & Navigation
- [ ] **TC-01 Editorial Homepage:** Verify the top navbar contains only 4 links: `Stays`, `Production`, `About`, `Contact` with the Terracotta logo. Ensure NO booking widgets appear on this root page.
- [ ] **TC-02 Hero Video Loop:** Verify the high-altitude cinematic video loop plays automatically, muted, without user controls.
- [ ] **TC-03 Dual Brand Gateways:** Click "Explore Stays" and verify clean navigation to `/stays`. Click "Explore Production" and verify navigation to `/production`.
- [ ] **TC-04 Global Deep Pine Footer:** Scroll to footer. Verify deep pine background (`#1E3128`), white logo, brand motto, "Stays in Jari" link, legal policy modal triggers, and WhatsApp contact link (`+91 86270 25502`).

### Stays Discovery & Stay in Bharat Property Detail Engine
- [ ] **TC-05 Stays Header Switching:** Navigate to `/stays`. Verify header dynamically displays: `List Your Property`, `My Trips`, `Host Desk`, `Curator Desk`, `Sign In`.
- [ ] **TC-06 Stays Search & Category Filter:** Select a category (e.g. `Homestay`, `Cottage`, `Hostel`) and verify property cards filter accordingly.
- [ ] **TC-07 Property Detail URL:** Click a property card (e.g. `Yash Home Stay`). Verify URL changes to `/stays/yash-home-stay` with proper breadcrumbs (`Home > Jari > Yash Home Stay`).
- [ ] **TC-08 8-Photo Gallery Grid:** Verify the 8-photo mosaic renders cleanly on desktop and stacks gracefully on mobile.
- [ ] **TC-09 Sticky Navigation Subtabs:** Click `Rooms & prices`, `Facilities`, `House rules`, `Host`, `Location`, `FAQs`. Verify smooth scrolling to corresponding sections.
- [ ] **TC-10 Dynamic Pricing Matrix:** Change check-in/check-out dates in the booking selector. Verify live price updates ($N \times \text{base\_price}$).
- [ ] **TC-11 Leaflet Interactive Map:** Verify open-source Leaflet map renders with exact property coordinates without paid Google Maps APIs.

### Booking Engine & GiST Exclusion Guarantee
- [ ] **TC-12 Unauthenticated Booking Attempt:** Fill out booking request while signed out. Verify auth modal prompts user to sign in or create an account.
- [ ] **TC-13 Authenticated Booking Submission:** Sign in as a test guest and submit a booking request. Verify HTTP 200 response and redirect to `/trips` with "Pending Host Confirmation" status.
- [ ] **TC-14 GiST Overlap Conflict (23P01):** In a second browser window, attempt to book the exact same room unit for overlapping dates. Verify the API rejects with HTTP `409 Conflict` and UI explains that dates are held by an active request.

### Guest Dashboard
- [ ] **TC-15 Active Trip Countdown:** On `/trips`, verify pending booking displays a live 48-hour countdown timer until host confirmation or auto-expiry.
- [ ] **TC-16 WhatsApp Concierge Bridge:** Click "Contact via WhatsApp" on a booking card. Verify it pre-populates a message to `+91 86270 25502` with the booking reference.
- [ ] **TC-17 Guest Self-Cancellation:** Click "Cancel Request". Verify booking updates to `cancelled` and the calendar date lock is immediately freed.

### Host Desk & Curator Desk
- [ ] **TC-18 Host 1-Click Decision:** Navigate to `/host-portal.html`. Sign in as a host. Verify pending booking appears in the decision queue. Click `[ Accept Stay ]`. Verify status updates to `confirmed`.
- [ ] **TC-19 Host Manual Date Block:** On `/host-portal.html`, select room and dates to block for maintenance. Verify block succeeds.
- [ ] **TC-20 Curator Review & Host Assignment:** Navigate to `/admin.html`. Sign in as administrator. Verify unassigned/curated properties can be assigned to an operational host UUID.
