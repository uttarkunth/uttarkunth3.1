'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/logo';
import { isValidStaffIdFormat } from '@/lib/staff-rbac-shared';
import { ShieldCheck, Lock, KeyRound, AlertTriangle, HelpCircle, CheckCircle2, ArrowRight } from 'lucide-react';

function StaffLoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // MFA step state
  const [mfaStep, setMfaStep] = useState<'none' | 'verify' | 'enroll'>('none');
  const [mfaFactorId, setMfaFactorId] = useState<string>('');
  const [mfaChallengeId, setMfaChallengeId] = useState<string>('');
  const [mfaQrCode, setMfaQrCode] = useState<string>('');
  const [mfaSecret, setMfaSecret] = useState<string>('');
  const [totpCode, setTotpCode] = useState('');

  // Recovery modal state
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryStaffId, setRecoveryStaffId] = useState('');
  const [recoveryReason, setRecoveryReason] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState<string | null>(null);
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/admin/dashboard';
  const queryError = searchParams.get('error');

  const handleStaffSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Explicitly block using immutable Staff ID as a password
    if (isValidStaffIdFormat(password.trim())) {
      setError(
        'Security Violation: Your immutable Uttarkunth Staff ID (UK-STAFF-YYYY-XXXX) is an audit identifier and must never be used as a password.'
      );
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError || !signInData.user) {
        setError(signInError?.message || 'Invalid work email or password.');
        setLoading(false);
        return;
      }

      // Verify that this account is an authorized staff identity (never an ordinary public member)
      const roleRes = await fetch('/api/auth/role', { cache: 'no-store' });
      const roleData = await roleRes.json();

      if (!roleData?.isAdmin || !roleData?.staffProfile) {
        await supabase.auth.signOut();
        setError(
          'Access Denied: Ordinary public Uttarkunth member accounts cannot sign in to the internal Staff Portal. Staff access requires an approved internal staff profile and Founder sign-off.'
        );
        setLoading(false);
        return;
      }

      // Check Authenticator Assurance Level (TOTP MFA)
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const verifiedTotpFactor = factorsData?.totp?.find((f) => f.status === 'verified');

      if (verifiedTotpFactor && aalData?.currentLevel !== 'aal2') {
        const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({
          factorId: verifiedTotpFactor.id,
        });
        if (challengeErr || !challengeData) {
          setError(challengeErr?.message || 'Unable to initiate TOTP MFA challenge.');
          setLoading(false);
          return;
        }
        setMfaFactorId(verifiedTotpFactor.id);
        setMfaChallengeId(challengeData.id);
        setMfaStep('verify');
        setLoading(false);
        return;
      }

      router.push(nextPath);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Unexpected error during staff authentication.');
      setLoading(false);
    }
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      let challengeId = mfaChallengeId;
      if (!challengeId && mfaFactorId) {
        const { data: chData, error: chErr } = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
        if (chErr || !chData) {
          setError(chErr?.message || 'Failed to create MFA challenge.');
          setLoading(false);
          return;
        }
        challengeId = chData.id;
      }

      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId,
        code: totpCode.trim(),
      });

      if (verifyErr) {
        setError(verifyErr.message || 'Invalid 6-digit authenticator code.');
        setLoading(false);
        return;
      }

      router.push(nextPath);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'MFA verification failed.');
      setLoading(false);
    }
  };

  const handleStartMfaEnrollment = async () => {
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: enrollErr } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Uttarkunth Staff Authenticator',
      });
      if (enrollErr || !data) {
        setError(enrollErr?.message || 'Sign in with your password first to enroll TOTP MFA.');
        setLoading(false);
        return;
      }
      setMfaFactorId(data.id);
      setMfaQrCode(data.totp.qr_code);
      setMfaSecret(data.totp.secret);
      setMfaStep('enroll');
    } catch (err: any) {
      setError(err?.message || 'Unable to start TOTP enrollment.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryLoading(true);
    setRecoverySuccess(null);
    setError(null);
    try {
      const res = await fetch('/api/staff/mfa-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          official_email: recoveryEmail,
          staff_id: recoveryStaffId || undefined,
          reason: recoveryReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not submit MFA recovery request.');
      } else {
        setRecoverySuccess(data.message);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to submit MFA recovery request.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#161513] text-[#FBF9F5] flex flex-col justify-between p-6 md:p-12">
      {/* Top Security Bar */}
      <div className="max-w-6xl w-full mx-auto flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <Logo variant="dark" />
          <span className="text-[10px] uppercase tracking-[0.25em] px-2.5 py-1 bg-[#C55B23]/20 text-[#E07A43] border border-[#C55B23]/40 font-mono">
            team.uttarkunth.com · Internal Governance
          </span>
        </div>
        <div className="flex items-center gap-6 text-xs text-[#FBF9F5]/60">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C55B23]" />
            No Open Self-Registration
          </span>
          <Link
            href="/staff/onboard"
            className="text-[#E07A43] hover:text-[#FBF9F5] underline underline-offset-4 transition-colors"
          >
            Have a Founder Invitation Token? Complete Onboarding
          </Link>
        </div>
      </div>

      {/* Center Authentication Box */}
      <div className="max-w-lg w-full mx-auto my-12 bg-[#1F1D1A] border border-white/15 p-8 md:p-10 shadow-2xl">
        <div className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.25em] text-[#E07A43] font-semibold mb-2">
            Uttarkunth Staff Identity System
          </p>
          <h1 className="font-serif text-3xl text-[#FBF9F5] mb-2">Internal Staff Sign In</h1>
          <p className="text-xs text-[#FBF9F5]/65 leading-relaxed">
            Restricted exclusively to authorised Uttarkunth personnel with Founder-approved permissions and active TOTP Multi-Factor Authentication.
          </p>
        </div>

        {queryError === 'open_registration_prohibited' && (
          <div className="mb-6 p-4 bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Public Staff Self-Registration is Strictly Prohibited</p>
              <p className="text-amber-200/80">
                Staff accounts can only be provisioned via a single-use, expiring Founder invitation token and mandatory onboarding approval.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {mfaStep === 'none' && (
          <form onSubmit={handleStaffSignIn} className="space-y-5">
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-[#FBF9F5]/70 mb-2 font-semibold">
                Official Work Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@uttarkunth.com"
                className="w-full bg-[#161513] border border-white/20 px-4 py-3 text-sm text-[#FBF9F5] placeholder:text-white/30 focus:outline-none focus:border-[#C55B23]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] uppercase tracking-widest text-[#FBF9F5]/70 font-semibold">
                  Staff Password
                </label>
                <span className="text-[10px] text-[#FBF9F5]/45 font-mono">
                  Never enter UK-STAFF-ID as password
                </span>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••••••"
                className="w-full bg-[#161513] border border-white/20 px-4 py-3 text-sm text-[#FBF9F5] placeholder:text-white/30 focus:outline-none focus:border-[#C55B23]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C55B23] hover:bg-[#A94918] text-white py-3.5 px-6 text-xs uppercase tracking-[0.2em] font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              {loading ? 'Verifying Staff Identity...' : 'Authenticate Staff Session'}
            </button>
          </form>
        )}

        {mfaStep === 'verify' && (
          <form onSubmit={handleVerifyMfa} className="space-y-5">
            <div className="p-4 bg-[#161513] border border-[#C55B23]/40 text-xs text-[#FBF9F5]/80">
              <p className="font-semibold text-[#E07A43] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" />
                Step 2: Mandatory TOTP Authenticator Check (AAL2)
              </p>
              <p>
                Enter the 6-digit verification code from your enrolled Authenticator app to unlock privileged staff operations.
              </p>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-widest text-[#FBF9F5]/70 mb-2 font-semibold">
                6-Digit TOTP Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                required
                placeholder="000000"
                className="w-full bg-[#161513] border border-white/20 px-4 py-3 text-lg tracking-[0.4em] font-mono text-center text-[#FBF9F5] focus:outline-none focus:border-[#C55B23]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C55B23] hover:bg-[#A94918] text-white py-3.5 px-6 text-xs uppercase tracking-[0.2em] font-semibold transition-colors"
            >
              {loading ? 'Verifying AAL2 Code...' : 'Verify & Enter Staff Portal'}
            </button>
          </form>
        )}

        {mfaStep === 'enroll' && (
          <form onSubmit={handleVerifyMfa} className="space-y-5">
            <div className="p-4 bg-[#161513] border border-white/15 text-xs space-y-3">
              <p className="font-semibold text-[#E07A43] uppercase tracking-wider">
                Enroll TOTP Multi-Factor Authenticator
              </p>
              <p className="text-[#FBF9F5]/75">
                Scan this QR code with an authenticator app (Google Authenticator, 1Password, Authy) and enter the 6-digit code below.
              </p>
              {mfaQrCode && (
                <div className="bg-white p-3 w-44 h-44 mx-auto flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mfaQrCode} alt="TOTP QR Code" className="w-full h-full object-contain" />
                </div>
              )}
              {mfaSecret && (
                <p className="font-mono text-[11px] text-center text-[#FBF9F5]/70 break-all">
                  Manual Key: {mfaSecret}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-widest text-[#FBF9F5]/70 mb-2 font-semibold">
                Confirm 6-Digit Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                required
                placeholder="000000"
                className="w-full bg-[#161513] border border-white/20 px-4 py-3 text-lg tracking-[0.4em] font-mono text-center text-[#FBF9F5]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C55B23] hover:bg-[#A94918] text-white py-3.5 px-6 text-xs uppercase tracking-[0.2em] font-semibold transition-colors"
            >
              Complete MFA Enrollment
            </button>
          </form>
        )}

        {/* Governance & Recovery Footer Links */}
        <div className="mt-8 pt-6 border-t border-white/10 space-y-3 text-xs text-[#FBF9F5]/60">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowRecoveryModal(!showRecoveryModal)}
              className="text-[#FBF9F5]/70 hover:text-[#E07A43] flex items-center gap-1.5 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Lost Authenticator Device? Request Founder MFA Recovery
            </button>
            <button
              type="button"
              onClick={handleStartMfaEnrollment}
              className="text-[#E07A43] hover:underline"
            >
              Enroll TOTP Factor
            </button>
          </div>

          <div className="pt-2 flex items-center justify-between text-[11px] text-[#FBF9F5]/50">
            <span>New invitee with a token?</span>
            <Link
              href="/staff/onboard"
              className="text-[#FBF9F5] hover:text-[#E07A43] inline-flex items-center gap-1 font-medium"
            >
              Staff Onboarding & Agreements <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Lost Authenticator Recovery Panel */}
        {showRecoveryModal && (
          <div className="mt-6 pt-6 border-t border-white/15">
            <h3 className="text-xs uppercase tracking-widest text-[#E07A43] font-semibold mb-2">
              Lost Authenticator Recovery Request
            </h3>
            <p className="text-[11px] text-[#FBF9F5]/65 mb-4">
              Logs an immutable governance alert for the Founder to verify your identity out-of-band and reset your TOTP factor.
            </p>
            {recoverySuccess ? (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{recoverySuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitRecovery} className="space-y-3">
                <input
                  type="email"
                  required
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  placeholder="Official email (e.g. name@uttarkunth.com)"
                  className="w-full bg-[#161513] border border-white/20 px-3 py-2 text-xs text-[#FBF9F5]"
                />
                <input
                  type="text"
                  value={recoveryStaffId}
                  onChange={(e) => setRecoveryStaffId(e.target.value)}
                  placeholder="Immutable Staff ID (optional, e.g. UK-STAFF-2026-0002)"
                  className="w-full bg-[#161513] border border-white/20 px-3 py-2 text-xs text-[#FBF9F5] font-mono"
                />
                <textarea
                  required
                  rows={2}
                  value={recoveryReason}
                  onChange={(e) => setRecoveryReason(e.target.value)}
                  placeholder="Explain why your TOTP authenticator needs reset (minimum 10 characters)..."
                  className="w-full bg-[#161513] border border-white/20 px-3 py-2 text-xs text-[#FBF9F5]"
                />
                <button
                  type="submit"
                  disabled={recoveryLoading}
                  className="w-full bg-white/10 hover:bg-white/20 text-[#FBF9F5] py-2.5 text-xs uppercase tracking-widest font-semibold"
                >
                  {recoveryLoading ? 'Recording Recovery Request...' : 'Submit Out-of-Band Recovery Request'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Bottom Notice */}
      <div className="max-w-6xl w-full mx-auto flex flex-wrap items-center justify-between gap-4 text-[11px] text-[#FBF9F5]/45 border-t border-white/10 pt-6">
        <span>
          Every login, permission check, moderation decision, and document view is recorded in the immutable Staff Audit Log.
        </span>
        <Link href="/" className="hover:text-[#FBF9F5] transition-colors">
          Return to Public Website (uttarkunth.com)
        </Link>
      </div>
    </div>
  );
}

export default function StaffLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#161513] text-[#FBF9F5] flex items-center justify-center text-xs uppercase tracking-widest">Loading Staff Portal...</div>}>
      <StaffLoginContent />
    </Suspense>
  );
}
