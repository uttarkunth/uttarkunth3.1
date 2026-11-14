'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Agreement = {
  type: string;
  code: string;
  title: string;
  version: string;
  summary: string;
  canonicalContent: string;
  documentHash: string;
};

export default function FounderSetupPage() {
  const router = useRouter();
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/staff/founder-setup', { cache: 'no-store' })\n      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.error || 'Founder setup could not be loaded.');
        if (!active) return;\n        if (data.alreadyCompleted) {
          router.replace('/staff/login?next=/admin/dashboard');
          return;
        }
        setAgreements(Array.isArray(data.agreements) ? data.agreements : []);
      })
      .catch((err: any) => {
        if (active) setError(err?.message || 'Unable to verify the Founder account.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [router]);

  const allAccepted = useMemo(
    () => agreements.length === 8 && agreements.every((agreement) => accepted[agreement.type] === true),
    [agreements, accepted]
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!privacyAccepted || !allAccepted) {
      setError('Accept the privacy notice and all eight current agreements before continuing.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/staff/founder-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          privacy_notice_accepted: true,
          agreements: agreements.map((agreement) => ({
            agreement_type: agreement.type,
            agreement_code: agreement.code,
            agreement_version: agreement.version,
            version: agreement.version,
            document_hash: agreement.documentHash,
            accepted: accepted[agreement.type] === true,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Could not record agreement acceptance.');

      setSuccess(data.message || 'Founder agreements recorded.');
      const supabase = createClient();
      await supabase.auth.signOut();
      router.replace('/staff/login?next=/admin/dashboard&setup=complete');
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Could not complete Founder setup.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <main className="min-h-screen bg-[#161513] text-[#FBF9F5] flex items-center justify-center p-6">Verifying Founder identity...</main>;
  }

  return (
    <main className="min-h-screen bg-[#161513] text-[#FBF9F5] px-5 py-10">
      <div className="mx-auto max-w-3xl space-y-7">
        <header className="border-b border-white/15 pb-6">
          <p className="text-xs uppercase tracking-[0.25em] text-[#E07A43]">Founder Office · Initial Setup</p>
          <h1 className="mt-3 font-serif text-3xl md:text-4xl">Founder Agreements &amp; Privacy Notice</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/65">
            This one-time step records your own informed acceptance. No agreement, privacy consent, or MFA state is pre-approved on your behalf.
          </p>
        </header>

        {error && <div role="alert" className="border border-red-500/40 bg-red-950/40 p-4 text-sm text-red-200">{error}</div>}
        {success && <div role="status" className="border border-emerald-500/40 bg-emerald-950/30 p-4 text-sm text-emerald-200">{success}</div>}

        <form onSubmit={submit} className="space-y-6">
          {agreements.map((agreement) => (
            <section key={agreement.type} className="border border-white/15 bg-[#1F1D1A] p-5 space-y-3">
              <div className="flex items-start gap-3">
                <input
                  id={`agreement-${agreement.type}`}
                  type="checkbox"
                  checked={accepted[agreement.type] === true}
                  onChange={(event) => setAccepted((current) => ({ ...current, [agreement.type]: event.target.checked }))}
                  className="mt-1 h-4 w-4 accent-[#C55B23]"
                />
                <div className="flex-1">
                  <label htmlFor={`agreement-${agreement.type}`} className="font-semibold cursor-pointer">
                    {agreement.title}
                  </label>
                  <p className="mt-1 text-xs text-white/55">Version {agreement.version} · {agreement.summary}</p>
                </div>
              </div>
              <details className="text-sm text-white/70">
                <summary className="cursor-pointer text-[#E07A43]">Read full agreement</summary>
                <p className="mt-3 leading-relaxed">{agreement.canonicalContent}</p>
              </details>
            </section>
          ))}

          <section className="border border-white/15 bg-[#1F1D1A] p-5">
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={privacyAccepted}
                onChange={(event) => setPrivacyAccepted(event.target.checked)}
                className="mt-1 h-4 w-4 accent-[#C55B23]"
              />
              <span>
                I have read and accept the Uttarkunth Staff Privacy Notice and understand how my staff profile, access logs, and submitted HR information are handled.
              </span>
            </label>
          </section>

          <button
            type="submit"
            disabled={submitting || !allAccepted || !privacyAccepted}
            className="w-full bg-[#C55B23] px-6 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? 'Recording acceptance...' : 'Accept Agreements & Continue to MFA'}
          </button>
        </form>

        <p className="text-xs text-white/45">
          After this step you will sign in again and complete TOTP MFA before entering the Founder Command Centre.
        </p>
      </div>
    </main>
  );
}
