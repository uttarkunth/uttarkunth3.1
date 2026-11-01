# Uttarkunth — Himalayan Stays & Creative Production

Production-ready, full-stack web application for **Uttarkunth** (`uttarkunth.com`), architected for deployment on **Cloudflare Pages**, **Cloudflare Workers (Cron Triggers)**, and **Supabase PostgreSQL & Auth**.

---

## 🏔️ Brand & Architecture Overview

Uttarkunth combines two distinct cultural offerings under one identity:
1. **Uttarkunth Stays:** Authentic boutique stays, ancestral homestays, riverside camps, and heritage cottages across Himachal Pradesh (Jari, Kasol, Dharamshala, Manali, Shimla, Kareri, Kullu Valley).
2. **Uttarkunth Production:** High-altitude filmmaking, cinematic storytelling, remote expedition documentation, and production logistics.

### Three Integrated Workspaces
- **Guest Experience (`/` and `/stays`):** Editorial parent homepage with 10-second hero video loop, founder monologue, and a dedicated Stay-in-Bharat-inspired Stays search, filter matrix, 8-photo property showcase, room availability selector, and Guest Dashboard (`/trips`).
- **Host Desk (`/host-portal.html` or `/host`):** Live host workspace to accept/decline booking requests with 1 click, view stay metrics, and block calendar dates.
- **Curator Desk (`/admin.html` or `/admin`):** Master platform operations desk for Uttarkunth team to review properties, assign operational hosts to unmanaged listings, and manage system bookings.

---

## 📁 Repository Structure

```text
uttarkunth3/
├── index.html                   # Master Public Site (SPA: Home, Stays, Production, About, Contact, Trips)
├── host-portal.html             # Host Desk Workspace
├── admin.html                   # Curator / Admin Desk Workspace
├── _redirects                   # Cloudflare Pages edge routing rules (clean URLs & portal redirects)
├── .gitignore                   # Ignores .env, .wrangler, node_modules, secrets
├── README.md                    # Project overview and GitHub upload guide
├── DEPLOYMENT.md                # Cloudflare Pages & Workers deployment instructions
├── assets/                      # Brand assets
│   ├── uttarkunth-logo.svg      # Terracotta SVG brand mark
│   ├── uttarkunth-logo.webp     # Lossless WebP mark
│   ├── uttarkunth-hero-video.webm # 10s silent high-altitude loop
│   └── gaurav-negi-founder.webp # Founder portrait
├── css/                         # Scoped, zero-dependency stylesheets
│   ├── brand.css                # Brand colors (#C55B23, #1E3128), typography, header, footer, modals
│   ├── stays.css                # Stays search bar, 11 categories, Stay in Bharat property detail engine
│   └── portal.css               # Host & Curator desk cards, queues, calendars, metrics
├── js/                          # Modular vanilla JavaScript
│   ├── supabase-client.js       # Client Auth & Session SDK (Anon key only)
│   ├── app.js                   # Client SPA router & view controller
│   ├── stays-engine.js          # Search, filters, Stay in Bharat property detail & booking form
│   ├── guest-dashboard.js       # Guest trips loader, countdown timers, WhatsApp bridge
│   ├── host-portal.js           # Host Desk controller (1-click accept/decline, calendar blocking)
│   └── admin-portal.js          # Curator Desk controller (listing review, host assignment)
├── functions/api/               # Cloudflare Pages Functions (Web Standards Fetch API)
│   ├── _middleware.js           # CORS security headers & origin allowlist
│   ├── bookings.js              # POST booking request (traps GiST 23P01) & availability check
│   ├── host.js                  # GET host booking queue & POST host decisions
│   ├── stays/
│   │   └── search.js            # Public stay search & filter API
│   ├── guest/
│   │   ├── bookings.js          # GET guest bookings & POST guest self-cancellation
│   │   └── saved.js             # GET / POST guest saved stays (wishlist)
│   ├── host/
│   │   └── blocks.js            # POST host manual room date blocking
│   └── admin/
│       ├── bookings.js          # GET admin master booking queue & hostless decisions
│       └── review.js            # POST property listing review & host assignment
├── workers/expiry/              # Cloudflare Worker Cron Trigger (Booking Expiry)
│   ├── wrangler.toml            # Worker configuration (Hourly cron: 0 * * * *)
│   └── worker-expiry.js         # Auto-expires pending booking requests older than 48 hours
└── supabase/migrations/         # Supabase PostgreSQL schema & migration references
    ├── 20261022_stays_booking_foundation.sql
    ├── 20261026_listing_review_lifecycle.sql
    ├── 20261027_guest_bookings.sql
    └── 20261028_saved_stays_and_blocks.sql
```

---

## 🚀 How to Upload to GitHub

Since Antigravity does not connect directly to your GitHub account, you can easily initialize and upload this repository manually:

### Option A: Using Git CLI (Recommended)
1. Extract the `uttarkunth3.zip` archive into a folder on your computer.
2. Open terminal in the `uttarkunth3` directory:
   ```bash
   git init
   git branch -M main
   git add .
   git commit -m "feat: initial commit of Uttarkunth 3.0 Cloudflare full-stack platform"
   ```
3. Create a new empty repository on [GitHub](https://github.com/new) named `uttarkunth` (or `uttarkunth3`).
4. Add your GitHub remote and push:
   ```bash
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/uttarkunth.git
   git push -u origin main
   ```

### Option B: Using GitHub Desktop or Web Upload
1. Create a new repository on GitHub.
2. Drag and drop the extracted files from `uttarkunth3` directly into the repository.
3. Commit and push changes to `main`.

---

## 💻 Local Testing with Cloudflare Wrangler

To preview the frontend and Cloudflare Pages Functions locally before deploying:

1. Ensure Node.js is installed (`node -v`).
2. Run Wrangler inside the `uttarkunth3` root:
   ```bash
   npx wrangler pages dev .
   ```
3. Open `http://localhost:8788` in your browser.

See **[DEPLOYMENT.md](file:///C:/Users/Rahul%20Negi/.gemini/antigravity/scratch/uttarkunth3/DEPLOYMENT.md)** for detailed instructions on connecting to Cloudflare Pages, configuring environment variables, deploying the scheduled expiry worker, and executing staging tests.
