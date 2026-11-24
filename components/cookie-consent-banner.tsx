'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, SlidersHorizontal, X, Lock, Check } from 'lucide-react';
import {
  CONSENT_POLICY_VERSION,
  CONSENT_UPDATED_EVENT,
  CookieConsentRecord,
  createConsentRecord,
  enforceConsentStoragePolicy,
  getStoredCookieConsent,
  OPEN_COOKIE_PREFERENCES_EVENT,
  saveAndEnforceCookieConsent,
} from '@/lib/cookie-consent';

export function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [consentRecord, setConsentRecord] = useState<CookieConsentRecord | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [functionalEnabled, setFunctionalEnabled] = useState(false);

  const modalCloseBtnRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const stored = getStoredCookieConsent();
    // Enforce storage policy immediately on mount across both localStorage and sessionStorage
    if (typeof window !== 'undefined') {
      enforceConsentStoragePolicy(stored, window.localStorage, window.sessionStorage);
      if (stored) {
        document.documentElement.setAttribute(
          'data-uk-consent-functional',
          stored.categories.functional ? 'granted' : 'denied'
        );
        document.documentElement.setAttribute(
          'data-uk-consent-decision',
          stored.decision
        );
      } else {
        document.documentElement.setAttribute('data-uk-consent-functional', 'denied');
        document.documentElement.setAttribute('data-uk-consent-decision', 'unset');
      }
    }

    setConsentRecord(stored);
    setFunctionalEnabled(Boolean(stored?.categories?.functional));
    setShowBanner(!stored);
    setMounted(true);

    const handleOpenPreferences = () => {
      const latest = getStoredCookieConsent();
      setConsentRecord(latest);
      setFunctionalEnabled(Boolean(latest?.categories?.functional));
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      setIsModalOpen(true);
    };

    const handleConsentUpdated = (event: Event) => {
      const custom = event as CustomEvent<CookieConsentRecord>;
      if (custom.detail) {
        setConsentRecord(custom.detail);
        setFunctionalEnabled(Boolean(custom.detail.categories.functional));
        setShowBanner(false);
      }
    };

    window.addEventListener(OPEN_COOKIE_PREFERENCES_EVENT, handleOpenPreferences);
    window.addEventListener(CONSENT_UPDATED_EVENT, handleConsentUpdated);

    return () => {
      window.removeEventListener(OPEN_COOKIE_PREFERENCES_EVENT, handleOpenPreferences);
      window.removeEventListener(CONSENT_UPDATED_EVENT, handleConsentUpdated);
    };
  }, []);

  useEffect(() => {
    if (!isModalOpen) return;

    const timer = window.setTimeout(() => {
      modalCloseBtnRef.current?.focus();
    }, 30);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen]);

  const closeModal = () => {
    setIsModalOpen(false);
    if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
      previousFocusRef.current.focus();
    }
  };

  const handleAcceptAll = () => {
    const record = createConsentRecord('accept_all');
    saveAndEnforceCookieConsent(record);
    setConsentRecord(record);
    setFunctionalEnabled(true);
    setShowBanner(false);
    setIsModalOpen(false);
  };

  const handleRejectOptional = () => {
    const record = createConsentRecord('reject_optional');
    saveAndEnforceCookieConsent(record);
    setConsentRecord(record);
    setFunctionalEnabled(false);
    setShowBanner(false);
    setIsModalOpen(false);
  };

  const handleSaveCustomPreferences = () => {
    const record = createConsentRecord('custom', {
      functional: functionalEnabled,
    });
    saveAndEnforceCookieConsent(record);
    setConsentRecord(record);
    setShowBanner(false);
    setIsModalOpen(false);
  };

  const handleOpenCustomize = () => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    setFunctionalEnabled(Boolean(consentRecord?.categories?.functional));
    setIsModalOpen(true);
  };

  if (!mounted) return null;

  return (
    <>
      {/* Compact Floating Bottom Cookie Consent Banner */}
      {showBanner && !isModalOpen && (
        <aside
          role="region"
          aria-label="Cookie consent and privacy preferences"
          data-testid="cookie-consent-banner"
          className="fixed bottom-20 md:bottom-5 left-3 right-3 sm:left-6 sm:right-6 z-50 mx-auto max-w-5xl pointer-events-none"
        >
          <div className="pointer-events-auto rounded-2xl bg-[#FFFDF9] text-[#29251F] border border-[#D9CCB8] shadow-lifted px-5 py-4 sm:px-6 sm:py-5 transition-all">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-8">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#C55B23] shrink-0" aria-hidden="true" />
                  <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#263D32] tracking-tight leading-snug">
                    Your Privacy Matters
                  </h2>
                </div>
                <p className="font-sans text-xs sm:text-sm text-[#29251F]/85 leading-relaxed">
                  We use cookies and similar technologies to keep Uttarkunth working smoothly,
                  remember your preferences and understand how visitors use our website. You can
                  choose which optional cookies you allow.{' '}
                  <Link
                    href="/cookie-policy"
                    className="font-medium text-[#263D32] underline underline-offset-4 hover:text-[#C55B23] transition-colors"
                  >
                    Cookie Policy
                  </Link>
                </p>
              </div>

              <div className="grid grid-cols-2 sm:flex sm:flex-nowrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleCustomizeClick(handleOpenCustomize)}
                  data-testid="cookie-customize-btn"
                  className="col-span-2 sm:col-span-1 order-3 sm:order-1 min-h-[44px] px-3.5 py-2.5 rounded-xl font-sans text-xs sm:text-sm font-semibold text-[#29251F] hover:text-[#263D32] hover:bg-[#F5F0E6] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#263D32] focus-visible:ring-offset-2 cursor-pointer text-center"
                >
                  Customize Preferences
                </button>
                <button
                  type="button"
                  onClick={handleRejectOptional}
                  data-testid="cookie-reject-optional-btn"
                  className="order-2 min-h-[44px] px-4 py-2.5 rounded-xl font-sans text-xs sm:text-sm font-semibold text-[#263D32] bg-transparent border border-[#263D32]/35 hover:border-[#263D32] hover:bg-[#F5F0E6] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#263D32] focus-visible:ring-offset-2 cursor-pointer text-center"
                >
                  Reject Optional
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  data-testid="cookie-accept-all-btn"
                  className="order-1 sm:order-3 min-h-[44px] px-5 py-2.5 rounded-xl font-sans text-xs sm:text-sm font-semibold text-[#FFFDF9] bg-[#263D32] hover:bg-[#1D2F26] shadow-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#263D32] focus-visible:ring-offset-2 cursor-pointer text-center"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Cookie Preference Settings Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6 bg-[#29251F]/60 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-preferences-title"
            aria-describedby="cookie-preferences-desc"
            data-testid="cookie-preferences-modal"
            className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-[#FFFDF9] text-[#29251F] border border-[#D9CCB8] shadow-lifted overflow-hidden"
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-[#D9CCB8]/70 bg-[#F5F0E6]/65 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[11px] font-sans font-bold uppercase tracking-[0.16em] text-[#C55B23]">
                  <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Privacy &amp; Cookie Preferences</span>
                </div>
                <h2
                  id="cookie-preferences-title"
                  className="font-serif text-2xl sm:text-3xl font-semibold text-[#263D32] tracking-tight"
                >
                  Customize Your Cookie Preferences
                </h2>
              </div>
              <button
                ref={modalCloseBtnRef}
                type="button"
                onClick={closeModal}
                aria-label="Close cookie preferences"
                data-testid="cookie-modal-close-btn"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-[#29251F]/70 hover:text-[#263D32] hover:bg-[#D9CCB8]/35 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#263D32] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 overflow-y-auto space-y-5 font-sans text-sm">
              <p id="cookie-preferences-desc" className="text-xs sm:text-sm text-[#29251F]/80 leading-relaxed">
                Choose how Uttarkunth uses cookies and browser storage during your visit. Essential
                cookies are always active to protect account security, authentication sessions, and
                stay booking requests. Optional functional storage is off by default unless you
                enable it.
              </p>

              {/* Category 1: Essential Cookies */}
              <div
                data-testid="cookie-category-essential"
                className="rounded-xl border border-[#D9CCB8] bg-[#F5F0E6]/50 p-4 sm:p-5 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#263D32] shrink-0" aria-hidden="true" />
                    <h3 className="font-serif text-lg sm:text-xl font-semibold text-[#263D32]">
                      Essential Cookies
                    </h3>
                  </div>
                  <span
                    aria-label="Essential cookies are always enabled"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#263D32]/10 text-[#263D32] font-sans text-xs font-semibold"
                  >
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    Always Enabled
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#29251F]/80 leading-relaxed">
                  Required for core functionality, security headers, stay booking request integrity,
                  first-party HTTP authentication cookies managed via{' '}
                  <code className="text-xs font-mono text-[#263D32]">@supabase/ssr</code> (
                  <code className="text-xs font-mono text-[#263D32]">
                    sb-&lt;project-ref&gt;-auth-token
                  </code>
                  ), and storing your privacy consent record (
                  <code className="text-xs font-mono text-[#263D32]">
                    uttarkunth_cookie_consent_v1
                  </code>{' '}
                  HTTP cookie for 365 days &amp; <code className="text-xs font-mono text-[#263D32]">localStorage</code> mirror).
                  These cannot be disabled.
                </p>
              </div>

              {/* Category 2: Functional / Preference Cookies */}
              <div
                data-testid="cookie-category-functional"
                className="rounded-xl border border-[#D9CCB8] bg-[#FFFDF9] p-4 sm:p-5 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3
                      id="functional-cookies-heading"
                      className="font-serif text-lg sm:text-xl font-semibold text-[#263D32]"
                    >
                      Functional / Preference Cookies
                    </h3>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={functionalEnabled}
                    aria-labelledby="functional-cookies-heading"
                    data-testid="cookie-toggle-functional"
                    onClick={() => setFunctionalEnabled((prev) => !prev)}
                    className={`min-h-[44px] px-3 py-1.5 rounded-xl inline-flex items-center gap-2.5 border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#263D32] focus-visible:ring-offset-2 cursor-pointer ${
                      functionalEnabled
                        ? 'bg-[#263D32] border-[#263D32] text-[#FFFDF9]'
                        : 'bg-[#F5F0E6] border-[#D9CCB8] text-[#29251F]'
                    }`}
                  >
                    <span
                      className={`w-8 h-4 rounded-full relative transition-colors ${
                        functionalEnabled ? 'bg-[#FFFDF9]/25' : 'bg-[#29251F]/20'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${
                          functionalEnabled
                            ? 'right-0.5 bg-[#FFFDF9]'
                            : 'left-0.5 bg-[#29251F]/70'
                        }`}
                      />
                    </span>
                    <span className="text-xs font-semibold">
                      {functionalEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-[#29251F]/80 leading-relaxed">
                  Remembers optional interface preferences in <code className="text-xs font-mono text-[#263D32]">localStorage</code>{' '}
                  (saved favourites{' '}
                  <code className="text-xs font-mono text-[#263D32]">
                    uttarkunth_saved_items_v1
                  </code>
                  , up to 5 recent hero searches per pillar{' '}
                  <code className="text-xs font-mono text-[#263D32]">
                    uttarkunth_hero_recent_*_v1
                  </code>
                  , and read notifications{' '}
                  <code className="text-xs font-mono text-[#263D32]">
                    uttarkunth_read_notification_ids
                  </code>
                  ) as well as single-tab <code className="text-xs font-mono text-[#263D32]">sessionStorage</code> intro
                  animation flags (
                  <code className="text-xs font-mono text-[#263D32]">uk_splash_seen</code> and{' '}
                  <code className="text-xs font-mono text-[#263D32]">
                    uttarkunth_explore_spotlight_shown_v1
                  </code>
                  ). Turning this off or selecting <strong>Reject Optional</strong> immediately
                  deletes all of these optional keys without affecting your sign-in session.
                </p>
              </div>

              {/* Honest Audit Disclosure for Analytics & Marketing */}
              <div
                data-testid="cookie-audit-disclosure"
                className="rounded-xl border border-[#D9CCB8]/80 bg-[#F5F0E6]/40 px-4 py-3.5 text-xs text-[#29251F]/75 space-y-1 leading-relaxed"
              >
                <p className="font-semibold text-[#263D32]">
                  No Analytics or Marketing Trackers Installed
                </p>
                <p>
                  Uttarkunth does not use third-party analytics cookies, advertising pixels, or
                  cross-site behavioural tracking scripts. You can review our full technical
                  inventory on the{' '}
                  <Link
                    href="/cookie-policy"
                    onClick={closeModal}
                    className="font-semibold text-[#263D32] underline underline-offset-4 hover:text-[#C55B23]"
                  >
                    Cookie Policy
                  </Link>{' '}
                  and{' '}
                  <Link
                    href="/privacy"
                    onClick={closeModal}
                    className="font-semibold text-[#263D32] underline underline-offset-4 hover:text-[#C55B23]"
                  >
                    Privacy Policy
                  </Link>{' '}
                  pages.
                </p>
                {consentRecord && (
                  <p className="pt-1 text-[11px] text-[#29251F]/60">
                    Current status: Policy v{consentRecord.version} • Saved on{' '}
                    {new Date(consentRecord.timestamp).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                )}
                {!consentRecord && (
                  <p className="pt-1 text-[11px] text-[#29251F]/60">
                    Policy version: v{CONSENT_POLICY_VERSION} • Optional categories default to Off
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#D9CCB8]/70 bg-[#F5F0E6]/65 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleRejectOptional}
                  data-testid="modal-reject-optional-btn"
                  className="min-h-[44px] px-4 py-2.5 rounded-xl font-sans text-xs sm:text-sm font-semibold text-[#263D32] bg-transparent border border-[#263D32]/35 hover:border-[#263D32] hover:bg-[#FFFDF9] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#263D32] cursor-pointer"
                >
                  Reject Optional
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  data-testid="modal-accept-all-btn"
                  className="min-h-[44px] px-4 py-2.5 rounded-xl font-sans text-xs sm:text-sm font-semibold text-[#263D32] bg-[#FFFDF9] border border-[#D9CCB8] hover:border-[#263D32] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#263D32] cursor-pointer"
                >
                  Accept All
                </button>
              </div>

              <button
                type="button"
                onClick={handleSaveCustomPreferences}
                data-testid="modal-save-preferences-btn"
                className="min-h-[44px] px-5 py-2.5 rounded-xl font-sans text-xs sm:text-sm font-semibold text-[#FFFDF9] bg-[#263D32] hover:bg-[#1D2F26] shadow-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#263D32] cursor-pointer"
              >
                Save My Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function handleCustomizeClick(fn: () => void) {
  return () => fn();
}
