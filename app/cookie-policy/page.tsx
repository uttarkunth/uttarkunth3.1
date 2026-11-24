import React from 'react';
import Link from 'next/link';
import { BRAND } from '@/lib/constants';
import { ShieldCheck, Lock, SlidersHorizontal, CheckCircle2 } from 'lucide-react';
import { CookiePreferencesTrigger } from '@/components/cookie-preferences-trigger';
import { CONSENT_POLICY_VERSION } from '@/lib/cookie-consent';

export const metadata = {
  title: `Cookie Policy — ${BRAND.name}`,
  description: `Official Cookie Policy and browser storage disclosures for ${BRAND.name} (uttarkunth.com).`,
};

export default function CookiePolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 pb-24 space-y-10">
      <div className="space-y-4 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#263D32]/10 text-[#263D32] text-xs font-sans font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-[#C55B23]" />
          Transparency &amp; Browser Storage
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#263D32]">
          Cookie Policy
        </h1>
        <p className="font-sans text-sm text-[#29251F]/75 max-w-2xl mx-auto leading-relaxed">
          A verified technical inventory of every cookie, <code className="font-mono text-xs">localStorage</code> entry,
          and <code className="font-mono text-xs">sessionStorage</code> flag used by{' '}
          <span className="font-semibold text-[#263D32]">uttarkunth.com</span>, how long each item
          is retained, and how you can control or clear them at any time.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <CookiePreferencesTrigger
            label="Manage Cookie Preferences"
            testId="cookie-policy-manage-btn"
            className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#263D32] text-[#FFFDF9] font-sans text-xs sm:text-sm font-semibold hover:bg-[#1D2F26] shadow-soft transition-colors cursor-pointer"
          />
          <Link
            href="/privacy"
            className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#D9CCB8] bg-[#FFFDF9] text-[#263D32] font-sans text-xs sm:text-sm font-semibold hover:border-[#263D32] transition-colors"
          >
            Read Privacy Policy
          </Link>
        </div>
      </div>

      <div className="bg-[#FFFDF9] rounded-3xl p-8 sm:p-12 border border-[#D9CCB8] shadow-soft space-y-10 text-[#29251F] font-sans text-sm leading-relaxed">
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D9CCB8]/60 pb-3">
            <h2 className="font-serif text-2xl font-bold text-[#263D32]">
              1. How Uttarkunth Uses Cookies &amp; Browser Storage
            </h2>
            <span className="text-xs font-mono text-[#29251F]/60">
              Policy Version: {CONSENT_POLICY_VERSION}
            </span>
          </div>
          <p>
            Uttarkunth uses strictly necessary first-party HTTP cookies and consent storage to keep
            the platform secure, authenticate signed-in guests, hosts, sellers, staff, and founders,
            and remember your privacy preferences. Optional convenience features—such as saved
            favourites, recent search queries, notification read badges, and single-tab intro
            animation flags—use browser <code className="font-mono text-xs">localStorage</code> and{' '}
            <code className="font-mono text-xs">sessionStorage</code> only when you enable{' '}
            <strong>Functional / Preference Cookies</strong>.
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#263D32]" />
            <h2 className="font-serif text-2xl font-bold text-[#263D32]">
              2. Essential Cookies &amp; Consent Storage (Always Active)
            </h2>
          </div>
          <p>
            These technologies are strictly required for core platform operation, authentication
            security, and booking request workflows. They cannot be disabled through the preference
            panel, and choosing <strong>Reject Optional</strong> never clears your active login
            session.
          </p>

          <div className="overflow-x-auto rounded-2xl border border-[#D9CCB8]">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#F5F0E6] text-[#263D32] border-b border-[#D9CCB8]">
                  <th className="py-3 px-4 font-semibold">Name / Key</th>
                  <th className="py-3 px-4 font-semibold">Mechanism</th>
                  <th className="py-3 px-4 font-semibold">Purpose, Retention &amp; Deletion Behaviour</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9CCB8]/60">
                <tr>
                  <td className="py-3 px-4 font-mono text-xs text-[#263D32] align-top">
                    sb-&lt;project-ref&gt;-auth-token
                    <br />
                    <span className="text-[#29251F]/65">
                      (including chunked <code className="font-mono">.0</code>,{' '}
                      <code className="font-mono">.1</code> &amp; PKCE{' '}
                      <code className="font-mono">-code-verifier</code>)
                    </span>
                  </td>
                  <td className="py-3 px-4 align-top">
                    First-Party HTTP Cookie
                    <br />
                    <span className="text-xs text-[#29251F]/65">
                      (<code className="font-mono">@supabase/ssr</code> cookie session; not stored
                      in <code className="font-mono">localStorage</code>)
                    </span>
                  </td>
                  <td className="py-3 px-4 align-top">
                    Managed by <code className="font-mono text-xs">@supabase/ssr</code> (
                    <code className="font-mono text-xs">createBrowserClient</code> and{' '}
                    <code className="font-mono text-xs">createServerClient</code>) so authenticated
                    sessions work across Next.js Server Components, Middleware, API routes, and the
                    browser. Set only when a user signs in or initiates an authentication flow;
                    automatically refreshed while signed in and deleted upon sign-out or cookie
                    expiry.
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono text-xs text-[#263D32] align-top">
                    uttarkunth_cookie_consent_v1
                  </td>
                  <td className="py-3 px-4 align-top">
                    First-Party HTTP Cookie &amp; Browser <code className="font-mono text-xs">localStorage</code>
                  </td>
                  <td className="py-3 px-4 align-top">
                    Stores your consent decision (<code className="font-mono text-xs">accept_all</code>,{' '}
                    <code className="font-mono text-xs">reject_optional</code>, or{' '}
                    <code className="font-mono text-xs">custom</code>), category state, timestamp,
                    and policy version (<code className="font-mono text-xs">{CONSENT_POLICY_VERSION}</code>).
                    The HTTP cookie is set with <code className="font-mono text-xs">Path=/; Max-Age=31536000</code>{' '}
                    (365 days) and <code className="font-mono text-xs">SameSite=Lax</code> (plus{' '}
                    <code className="font-mono text-xs">Secure</code> over HTTPS). The{' '}
                    <code className="font-mono text-xs">localStorage</code> mirror has no automatic
                    browser TTL and persists until you clear browser storage or a material policy
                    update increments the version.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border border-[#D9CCB8]/80 bg-[#F5F0E6]/45 p-4 text-xs text-[#29251F]/80 space-y-1">
            <p className="font-semibold text-[#263D32]">
              Note on Edge &amp; Administrative Subdomain Security (Cloudflare Access)
            </p>
            <p>
              The Uttarkunth application does not set or generate Cloudflare cookies (such as{' '}
              <code className="font-mono">__cf_bm</code> or{' '}
              <code className="font-mono">CF_Authorization</code>) on public visitors. On internal
              administrative hostnames (<code className="font-mono">admin.uttarkunth.com</code> and{' '}
              <code className="font-mono">team.uttarkunth.com</code>), when{' '}
              <code className="font-mono">ENFORCE_CLOUDFLARE_ACCESS=true</code> is enabled in the
              deployment environment, server middleware verifies the incoming{' '}
              <code className="font-mono">cf-access-jwt-assertion</code> HTTP request header.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#C55B23]" />
            <h2 className="font-serif text-2xl font-bold text-[#263D32]">
              3. Functional / Preference &amp; Session Storage (Optional)
            </h2>
          </div>
          <p>
            These optional <code className="font-mono text-xs">localStorage</code> and{' '}
            <code className="font-mono text-xs">sessionStorage</code> entries remember your
            convenience preferences and single-tab UI animation state. They are disabled by default
            until you choose <strong>Accept All</strong> or enable{' '}
            <strong>Functional / Preference Cookies</strong>. When you choose{' '}
            <strong>Reject Optional</strong> (or disable Functional Cookies in preferences), every
            key in this table is immediately removed from your browser via{' '}
            <code className="font-mono text-xs">removeItem()</code> and subsequent writes are blocked.
          </p>

          <div className="overflow-x-auto rounded-2xl border border-[#D9CCB8]">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#F5F0E6] text-[#263D32] border-b border-[#D9CCB8]">
                  <th className="py-3 px-4 font-semibold">Name / Key</th>
                  <th className="py-3 px-4 font-semibold">Mechanism</th>
                  <th className="py-3 px-4 font-semibold">Purpose</th>
                  <th className="py-3 px-4 font-semibold">Retention &amp; Deletion Behaviour</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9CCB8]/60">
                <tr>
                  <td className="py-3 px-4 font-mono text-xs text-[#263D32] align-top">
                    uttarkunth_saved_items_v1
                  </td>
                  <td className="py-3 px-4 align-top">
                    Browser <code className="font-mono text-xs">localStorage</code>
                  </td>
                  <td className="py-3 px-4 align-top">
                    Remembers stays, mountain products, productions, and destinations you save to
                    your local favourites list.
                  </td>
                  <td className="py-3 px-4 align-top">
                    <code className="font-mono text-xs">localStorage</code> has no automatic TTL.
                    Persists until you unsave items, clear your saved list, select{' '}
                    <strong>Reject Optional</strong> / disable Functional Cookies (which immediately
                    deletes the key), or clear browser site data. When disabled, saved items fall
                    back to temporary in-memory page state only.
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono text-xs text-[#263D32] align-top">
                    uttarkunth_hero_recent_stays_v1
                    <br />
                    uttarkunth_hero_recent_products_v1
                    <br />
                    uttarkunth_hero_recent_originals_v1
                  </td>
                  <td className="py-3 px-4 align-top">
                    Browser <code className="font-mono text-xs">localStorage</code>
                  </td>
                  <td className="py-3 px-4 align-top">
                    Remembers up to 5 recent search queries per pillar (<code className="font-mono text-xs">MAX_RECENT_SEARCHES = 5</code>)
                    in the homepage search bar.
                  </td>
                  <td className="py-3 px-4 align-top">
                    <code className="font-mono text-xs">localStorage</code> has no automatic TTL.
                    Persists until you click &ldquo;Clear&rdquo; in the recent searches dropdown,
                    select <strong>Reject Optional</strong> / disable Functional Cookies (which
                    immediately deletes all three keys), or clear browser site data.
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono text-xs text-[#263D32] align-top">
                    uttarkunth_read_notification_ids
                  </td>
                  <td className="py-3 px-4 align-top">
                    Browser <code className="font-mono text-xs">localStorage</code>
                  </td>
                  <td className="py-3 px-4 align-top">
                    Stores the list of notification IDs you have marked as read in the header
                    notification drawer.
                  </td>
                  <td className="py-3 px-4 align-top">
                    <code className="font-mono text-xs">localStorage</code> has no automatic TTL.
                    Persists until you select <strong>Reject Optional</strong> / disable Functional
                    Cookies (which immediately deletes the key) or clear browser site data.
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono text-xs text-[#263D32] align-top">
                    uk_splash_seen
                  </td>
                  <td className="py-3 px-4 align-top">
                    Browser <code className="font-mono text-xs">sessionStorage</code>
                  </td>
                  <td className="py-3 px-4 align-top">
                    Remembers that the introductory Uttarkunth curtain animation has already completed
                    in the current tab.
                  </td>
                  <td className="py-3 px-4 align-top">
                    Tab-scoped <code className="font-mono text-xs">sessionStorage</code>.
                    Automatically deleted by the browser when you close the tab or window, or
                    immediately deleted if you select <strong>Reject Optional</strong> / disable
                    Functional Cookies.
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono text-xs text-[#263D32] align-top">
                    uttarkunth_explore_spotlight_shown_v1
                  </td>
                  <td className="py-3 px-4 align-top">
                    Browser <code className="font-mono text-xs">sessionStorage</code>
                  </td>
                  <td className="py-3 px-4 align-top">
                    Remembers that the one-time homepage Four Pillars spotlight transition has
                    played in the current tab.
                  </td>
                  <td className="py-3 px-4 align-top">
                    Tab-scoped <code className="font-mono text-xs">sessionStorage</code>.
                    Automatically deleted by the browser when you close the tab or window, or
                    immediately deleted if you select <strong>Reject Optional</strong> / disable
                    Functional Cookies.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#263D32]" />
            <h2 className="font-serif text-2xl font-bold text-[#263D32]">
              4. Analytics &amp; Marketing Cookies
            </h2>
          </div>
          <p>
            Uttarkunth does <strong>not</strong> install third-party analytics services (such as
            Google Analytics), advertising networks, retargeting pixels, or cross-site behavioural
            tracking cookies. If we ever introduce optional analytics in a future release, we will
            update this Cookie Policy, increment the consent policy version, and request your
            explicit opt-in consent before any analytics script is initialized.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-bold text-[#263D32]">
            5. Updating Your Consent Choices
          </h2>
          <p>
            You can review, change, or withdraw your optional cookie consent at any time by clicking{' '}
            <strong>Cookie Preferences</strong> in the website footer or using the button below.
          </p>
          <div className="pt-2">
            <CookiePreferencesTrigger
              label="Open Cookie Preferences"
              testId="cookie-policy-bottom-manage-btn"
              className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F5F0E6] border border-[#263D32]/30 text-[#263D32] font-sans text-xs sm:text-sm font-semibold hover:border-[#263D32] transition-colors cursor-pointer"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
