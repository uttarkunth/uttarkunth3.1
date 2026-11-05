'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Logo } from '@/components/logo';
import {
  REQUIRED_STAFF_AGREEMENTS,
  STAFF_ROLE_DEFINITIONS,
  type StaffAgreementCode,
  type StaffRoleCode,
} from '@/lib/staff-rbac-shared';
import {
  ShieldCheck,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  UserCheck,
  Briefcase,
  FileText,
} from 'lucide-react';

interface AgreementAcceptanceState {
  accepted: boolean;
  acceptedAt: string | null;
  documentHash: string;
}

function StaffOnboardingContent() {
  const searchParams = useSearchParams();
  const initialToken = searchParams.get('token') || '';

  const [invitationToken, setInvitationToken] = useState(initialToken);
  const [tokenVerified, setTokenVerified] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<{
    official_email?: string;
    department?: string;
    proposed_designation?: string;
    role_code?: StaffRoleCode;
    employment_category?: string;
    expires_at?: string;
  } | null>(null);

  // Personal fields
  const [fullLegalName, setFullLegalName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [officialEmail, setOfficialEmail] = useState('');
  const [verifiedMobile, setVerifiedMobile] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [password, setPassword] = useState('');

  // Professional fields
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('Operations');
  const [employmentCategory, setEmploymentCategory] = useState<
    'full_time' | 'part_time' | 'contractor' | 'advisor' | 'fellow'
  >('full_time');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().slice(0, 10));
  const [previousExperience, setPreviousExperience] = useState('');
  const [professionalQualifications, setProfessionalQualifications] = useState('');
  const [reportingManager, setReportingManager] = useState('Founder');
  const [assignedResponsibilities, setAssignedResponsibilities] = useState('');

  // Identity & HR verification (Aadhaar is NEVER the mandatory default; Passport is default)
  const [identityDocumentType, setIdentityDocumentType] = useState<
    'passport' | 'voter_id' | 'driving_licence' | 'pan_card' | 'other_government_id'
  >('passport');
  const [identityDocumentReference, setIdentityDocumentReference] = useState('');
  const [identityFile, setIdentityFile] = useState<File | null>(null);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [privacyNoticeAccepted, setPrivacyNoticeAccepted] = useState(false);

  // 8 Mandatory Staff Agreements state
  const [agreementStates, setAgreementStates] = useState<
    Record<StaffAgreementCode, AgreementAcceptanceState>
  >({} as Record<StaffAgreementCode, AgreementAcceptanceState>);
  const [activeAgreementModal, setActiveAgreementModal] = useState<StaffAgreementCode | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedResult, setSubmittedResult] = useState<{
    message: string;
    status: string;
    official_email: string;
  } | null>(null);

  // Precompute SHA-256 hashes in browser Web Crypto API for all 8 agreements
  useEffect(() => {
    async function initAgreementHashes() {
      const nextStates: Record<string, AgreementAcceptanceState> = {};
      for (const ag of REQUIRED_STAFF_AGREEMENTS) {
        const encoder = new TextEncoder();
        const data = encoder.encode(ag.canonicalContent.trim());
        const digest = await window.crypto.subtle.digest('SHA-256', data);
        const hashHex = Array.from(new Uint8Array(digest))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        nextStates[ag.code] = {
          accepted: false,
          acceptedAt: null,
          documentHash: hashHex,
        };
      }
      setAgreementStates(nextStates as Record<StaffAgreementCode, AgreementAcceptanceState>);
    }
    initAgreementHashes();
  }, []);

  const handleValidateToken = async () => {
    setError(null);
    if (!invitationToken || invitationToken.trim().length < 16) {
      setError('Enter a valid single-use Founder invitation token (minimum 16 characters).');
      return;
    }

    try {
      const res = await fetch(
        `/api/staff/onboard?token=${encodeURIComponent(invitationToken.trim())}`,
        { cache: 'no-store' }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid or expired staff invitation token.');
        return;
      }
      setTokenVerified(true);
      if (data.invitation) {
        setTokenInfo(data.invitation);
        if (data.invitation.official_email) setOfficialEmail(data.invitation.official_email);
        if (data.invitation.department) setDepartment(data.invitation.department);
        if (data.invitation.proposed_designation)
          setDesignation(data.invitation.proposed_designation);
        if (data.invitation.employment_category)
          setEmploymentCategory(data.invitation.employment_category);
      }
    } catch (err: any) {
      setError(err?.message || 'Could not validate invitation token.');
    }
  };

  const toggleAgreementAcceptance = (code: StaffAgreementCode) => {
    setAgreementStates((prev) => {
      const current = prev[code];
      if (!current) return prev;
      const nextAccepted = !current.accepted;
      return {
        ...prev,
        [code]: {
          ...current,
          accepted: nextAccepted,
          acceptedAt: nextAccepted ? new Date().toISOString() : null,
        },
      };
    });
  };

  const acceptedAgreementsCount = Object.values(agreementStates).filter((a) => a?.accepted).length;
  const allAgreementsAccepted = acceptedAgreementsCount === REQUIRED_STAFF_AGREEMENTS.length;

  const handleSubmitOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!allAgreementsAccepted) {
      setError(
        `You must review and accept all ${REQUIRED_STAFF_AGREEMENTS.length} mandatory Uttarkunth Staff Agreements & Conduct Policies before submitting.`
      );
      return;
    }

    if (!privacyNoticeAccepted) {
      setError('You must acknowledge the Staff HR & Governance Privacy Notice.');
      return;
    }

    setSubmitting(true);
    try {
      const uploadedHrDocuments: any[] = [];

      const uploadHrDocument = async (file: File, docType: string) => {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('invitation_token', invitationToken.trim());
        fd.append('official_email', officialEmail.trim());
        fd.append('document_type', docType);

        const upRes = await fetch('/api/staff/documents', {
          method: 'POST',
          body: fd,
        });
        const upData = await upRes.json();
        if (!upRes.ok || !upData.ok) {
          throw new Error(upData.error || `Failed to upload ${docType} to private HR storage.`);
        }
        return upData.document;
      };

      if (identityFile) {
        const uploadedIdDoc = await uploadHrDocument(identityFile, identityDocumentType);
        uploadedHrDocuments.push(uploadedIdDoc);
      }
      if (contractFile) {
        const uploadedContractDoc = await uploadHrDocument(
          contractFile,
          'signed_employment_contract'
        );
        uploadedHrDocuments.push(uploadedContractDoc);
      }

      const agreementsPayload = REQUIRED_STAFF_AGREEMENTS.map((ag) => ({
        agreement_code: ag.code,
        version: ag.version,
        document_hash: agreementStates[ag.code]?.documentHash || '',
        accepted: Boolean(agreementStates[ag.code]?.accepted),
      }));

      const res = await fetch('/api/staff/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitation_token: invitationToken.trim(),
          full_legal_name: fullLegalName,
          preferred_name: preferredName || undefined,
          personal_email: personalEmail,
          official_email: officialEmail,
          verified_mobile: verifiedMobile,
          current_address: currentAddress || undefined,
          emergency_contact_name: emergencyContactName || undefined,
          emergency_contact_phone: emergencyContactPhone || undefined,
          designation,
          department,
          employment_category: employmentCategory,
          joining_date: joiningDate,
          previous_experience: previousExperience || undefined,
          professional_qualifications: professionalQualifications || undefined,
          reporting_manager: reportingManager || undefined,
          assigned_responsibilities: assignedResponsibilities,
          identity_document_type: identityDocumentType,
          identity_document_reference: identityDocumentReference,
          privacy_notice_accepted: privacyNoticeAccepted,
          password,
          agreements: agreementsPayload,
          hr_documents: uploadedHrDocuments,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit staff onboarding application.');
        setSubmitting(false);
        return;
      }

      setSubmittedResult({
        message: data.message,
        status: data.status,
        official_email: officialEmail,
      });
    } catch (err: any) {
      setError(err?.message || 'Unexpected error during onboarding submission.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedResult) {
    return (
      <div className="min-h-screen bg-[#161513] text-[#FBF9F5] p-6 md:p-12 flex items-center justify-center">
        <div className="max-w-xl w-full bg-[#1F1D1A] border border-emerald-500/40 p-8 md:p-10 space-y-6">
          <div className="flex items-center gap-3 text-emerald-400">
            <CheckCircle2 className="w-7 h-7" />
            <span className="text-xs uppercase tracking-[0.25em] font-semibold">
              Onboarding Dossier & 8 Agreements Recorded
            </span>
          </div>
          <h1 className="font-serif text-3xl text-[#FBF9F5]">
            Awaiting Founder Final Review & Approval
          </h1>
          <p className="text-sm text-[#FBF9F5]/75 leading-relaxed">{submittedResult.message}</p>
          <div className="bg-[#161513] border border-white/10 p-4 text-xs space-y-2 font-mono">
            <div>
              <span className="text-white/50">Official Account:</span> {submittedResult.official_email}
            </div>
            <div>
              <span className="text-white/50">Current Lifecycle Status:</span>{' '}
              <span className="text-amber-300">{submittedResult.status}</span>
            </div>
            <div>
              <span className="text-white/50">Privileged Access:</span> Locked until Founder approval & immutable UK-STAFF-ID issuance
            </div>
          </div>
          <div className="pt-4 flex items-center justify-between">
            <Link
              href="/staff/login"
              className="bg-[#C55B23] hover:bg-[#A94918] text-white px-6 py-3 text-xs uppercase tracking-widest font-semibold"
            >
              Proceed to Staff Login
            </Link>
            <Link href="/" className="text-xs text-white/60 hover:text-white">
              Return to uttarkunth.com
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#161513] text-[#FBF9F5] py-10 px-6 md:px-12">
      {/* Header */}
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6 mb-10">
        <div className="flex items-center gap-4">
          <Logo variant="dark" />
          <span className="text-[10px] uppercase tracking-[0.25em] px-2.5 py-1 bg-[#C55B23]/20 text-[#E07A43] border border-[#C55B23]/40 font-mono">
            Staff Onboarding & Policy Acceptance
          </span>
        </div>
        <Link
          href="/staff/login"
          className="text-xs text-[#FBF9F5]/70 hover:text-[#E07A43] underline underline-offset-4"
        >
          Already approved? Sign in to Staff Portal
        </Link>
      </div>

      <div className="max-w-5xl mx-auto space-y-10">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[#E07A43] font-semibold mb-2">
            Founder-Controlled Staff Governance
          </p>
          <h1 className="font-serif text-3xl md:text-4xl text-[#FBF9F5] mb-3">
            Internal Staff Onboarding & Legal Undertakings
          </h1>
          <p className="text-sm text-[#FBF9F5]/70 max-w-3xl leading-relaxed">
            Uttarkunth staff identities are strictly separated from public member accounts. No open self-registration is permitted. To complete onboarding, validate your single-use Founder invitation token, submit required HR & identity records, and accept all eight mandatory Staff Agreements.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Section 1: Single-Use Invitation Token Gate */}
        <section className="bg-[#1F1D1A] border border-white/15 p-6 md:p-8">
          <div className="flex items-center gap-2.5 mb-4">
            <Lock className="w-4 h-4 text-[#C55B23]" />
            <h2 className="text-sm uppercase tracking-[0.2em] font-semibold text-[#FBF9F5]">
              1. Single-Use Founder Invitation Token
            </h2>
          </div>
          <p className="text-xs text-[#FBF9F5]/65 mb-4">
            Enter the unique, expiring invitation token issued to your official email by the Founder/Superadmin.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input suppressHydrationWarning
              type="text"
              value={invitationToken}
              onChange={(e) => setInvitationToken(e.target.value)}
              placeholder="Paste single-use invitation token (e.g. UK-INV-2026-...)"
              className="flex-1 bg-[#161513] border border-white/20 px-4 py-3 text-xs font-mono text-[#FBF9F5] focus:outline-none focus:border-[#C55B23]"
            />
            <button suppressHydrationWarning
              type="button"
              onClick={handleValidateToken}
              className="bg-[#C55B23] hover:bg-[#A94918] text-white px-6 py-3 text-xs uppercase tracking-widest font-semibold shrink-0"
            >
              Verify Invitation Token
            </button>
          </div>
          {tokenVerified && tokenInfo && (
            <div className="mt-4 p-4 bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono">
              <div>Invited Email: {tokenInfo.official_email}</div>
              <div>Department: {tokenInfo.department}</div>
              <div>Proposed Role: {tokenInfo.proposed_designation || tokenInfo.role_code}</div>
            </div>
          )}
        </section>

        <form onSubmit={handleSubmitOnboarding} className="space-y-10">
          {/* Section 2: Personal & Account Credentials */}
          <section className="bg-[#1F1D1A] border border-white/15 p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
              <UserCheck className="w-4 h-4 text-[#C55B23]" />
              <h2 className="text-sm uppercase tracking-[0.2em] font-semibold text-[#FBF9F5]">
                2. Personal Details & Dedicated Staff Credentials
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-white/70 mb-2">
                  Full Legal Name *
                </label>
                <input suppressHydrationWarning
                  type="text"
                  required
                  value={fullLegalName}
                  onChange={(e) => setFullLegalName(e.target.value)}
                  placeholder="As per government identity document"
                  className="w-full bg-[#161513] border border-white/20 px-4 py-2.5 text-sm text-[#FBF9F5]"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-white/70 mb-2">
                  Preferred Name
                </label>
                <input suppressHydrationWarning
                  type="text"
                  value={preferredName}
                  onChange={(e) => setPreferredName(e.target.value)}
                  placeholder="Optional preferred display name"
                  className="w-full bg-[#161513] border border-white/20 px-4 py-2.5 text-sm text-[#FBF9F5]"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-white/70 mb-2">
                  Official Staff Email *
                </label>
                <input suppressHydrationWarning
                  type="email"
                  required
                  value={officialEmail}
                  onChange={(e) => setOfficialEmail(e.target.value)}
                  placeholder="Must match Founder invitation email"
                  className="w-full bg-[#161513] border border-white/20 px-4 py-2.5 text-sm text-[#FBF9F5]"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-white/70 mb-2">
                  Personal Email (for HR Record) *
                </label>
                <input suppressHydrationWarning
                  type="email"
                  required
                  value={personalEmail}
                  onChange={(e) => setPersonalEmail(e.target.value)}
                  placeholder="personal@example.com"
                  className="w-full bg-[#161513] border border-white/20 px-4 py-2.5 text-sm text-[#FBF9F5]"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-white/70 mb-2">
                  Verified Mobile Number *
                </label>
                <input suppressHydrationWarning
                  type="tel"
                  required
                  value={verifiedMobile}
                  onChange={(e) => setVerifiedMobile(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-[#161513] border border-white/20 px-4 py-2.5 text-sm text-[#FBF9F5]"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-white/70 mb-2">
                  Create Strong Staff Account Password (Min 12 chars) *
                </label>
                <input suppressHydrationWarning
                  type="password"
                  required
                  minLength={12}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 12 characters"
                  className="w-full bg-[#161513] border border-white/20 px-4 py-2.5 text-sm text-[#FBF9F5]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11px] uppercase tracking-widest text-white/70 mb-2">
                  Current Residential Address (When Required for HR/Contract Records)
                </label>
                <input suppressHydrationWarning
                  type="text"
                  value={currentAddress}
                  onChange={(e) => setCurrentAddress(e.target.value)}
                  placeholder="Street, Town/Village, District, State, PIN"
                  className="w-full bg-[#161513] border border-white/20 px-4 py-2.5 text-sm text-[#FBF9F5]"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-white/70 mb-2">
                  Emergency Contact Name (Optional)
                </label>
                <input suppressHydrationWarning
                  type="text"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  placeholder="Full name & relationship"
                  className="w-full bg-[#161513] border border-white/20 px-4 py-2.5 text-sm text-[#FBF9F5]"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-white/70 mb-2">
                  Emergency Contact Phone (Optional)
                </label>
                <input suppressHydrationWarning
                  type="tel"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  placeholder="+91 ..."
                  className="w-full bg-[#161513] border border-white/20 px-4 py-2.5 text-sm text-[#FBF9F5]"
                />
              </div>
            </div>
          </section>

          {/* Section 3: Professional & Departmental Assignment */}
          <section className="bg-[#1F1D1A] border border-white/15 p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
              <Briefcase className="w-4 h-4 text-[#C55B23]" />
              <h2 className="text-sm uppercase tracking-[0.2em] font-semibold text-[#FBF9F5]">
                3. Professional Assignment & Responsibilities
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-white/70 mb-2">
                  Designation *
                </label>
                <input suppressHydrationWarning
                  type="text"
                  required
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Marketplace & Seller Reviewer"
                  className="w-full bg-[#161513] border border-white/20 px-4 py-2.5 text-sm text-[#FBF9F5]"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-white/70 mb-2">
                  Department *
                </label>
                <select suppressHydrationWarning
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-[#161513] border border-white/20 px-4 py-2.5 text-sm text-[#FBF9F5]"
                >
                  <option value="Executive & Governance">Executive & Governance</option>
                  <option value="Operations">Operations</option>
                  <option value="Stays & Host Relations">Stays & Host Relations</option>
                  <option value="Marketplace & Compliance">Marketplace & Compliance</option>
                  <option value="Uttarkunth Productions">Uttarkunth Productions</option>
                  <option value="Community & Impact">Community & Impact</option>
                  <option value="Member Support">Member Support</option>
                  <option value="Finance, Legal & Compliance">Finance, Legal & Compliance</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-white/70 mb-2">
                  Employment Category *
                </label>
                <select suppressHydrationWarning
                  value={employmentCategory}
                  onChange={(e) => setEmploymentCategory(e.target.value as any)}
                  className="w-full bg-[#161513] border border-white/20 px-4 py-2.5 text-sm text-[#FBF9F5]"
                >
                  <option value="full_time">Full-Time Employee</option>
                  <option value="part_time">Part-Time Staff</option>
                  <option value="contractor">Independent Contractor</option>
                  <option value="advisor">Advisor / Specialist</option>
                  <option value="fellow">Regional Fellow</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-white/70 mb-2">
                  Proposed Joining Date *
                </label>
                <input suppressHydrationWarning
                  type="date"
                  required
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="w-full bg-[#161513] border border-white/20 px-4 py-2.5 text-sm text-[#FBF9F5]"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-white/70 mb-2">
                  Reporting Manager
                </label>
                <input suppressHydrationWarning
                  type="text"
                  value={reportingManager}
                  onChange={(e) => setReportingManager(e.target.value)}
                  className="w-full bg-[#161513] border border-white/20 px-4 py-2.5 text-sm text-[#FBF9F5]"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-white/70 mb-2">
                  Professional Qualifications
                </label>
                <input suppressHydrationWarning
                  type="text"
                  value={professionalQualifications}
                  onChange={(e) => setProfessionalQualifications(e.target.value)}
                  placeholder="Relevant degrees, certifications"
                  className="w-full bg-[#161513] border border-white/20 px-4 py-2.5 text-sm text-[#FBF9F5]"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-[11px] uppercase tracking-widest text-white/70 mb-2">
                  Assigned Responsibilities & Scope Summary *
                </label>
                <textarea suppressHydrationWarning
                  rows={2}
                  required
                  value={assignedResponsibilities}
                  onChange={(e) => setAssignedResponsibilities(e.target.value)}
                  placeholder="Describe your assigned operational responsibilities across Uttarkunth pillars..."
                  className="w-full bg-[#161513] border border-white/20 px-4 py-2.5 text-sm text-[#FBF9F5]"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-[11px] uppercase tracking-widest text-white/70 mb-2">
                  Previous Relevant Experience
                </label>
                <textarea suppressHydrationWarning
                  rows={2}
                  value={previousExperience}
                  onChange={(e) => setPreviousExperience(e.target.value)}
                  placeholder="Summary of prior experience in hospitality, craft verification, film production, or compliance..."
                  className="w-full bg-[#161513] border border-white/20 px-4 py-2.5 text-sm text-[#FBF9F5]"
                />
              </div>
            </div>
          </section>

          {/* Section 4: Identity & Employment Verification (Aadhaar NOT mandatory default) */}
          <section className="bg-[#1F1D1A] border border-white/15 p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#C55B23]" />
                <h2 className="text-sm uppercase tracking-[0.2em] font-semibold text-[#FBF9F5]">
                  4. Identity & Employment Verification (Private Bucket: staff-hr-docs)
                </h2>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 border border-emerald-500/30">
                Aadhaar Not Mandatory Default · Data Minimisation Enforced
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-white/70 mb-2">
                  Identity Document Type *
                </label>
                <select suppressHydrationWarning
                  value={identityDocumentType}
                  onChange={(e) => setIdentityDocumentType(e.target.value as any)}
                  className="w-full bg-[#161513] border border-white/20 px-4 py-2.5 text-sm text-[#FBF9F5]"
                >
                  <option value="passport">Indian / International Passport (Default)</option>
                  <option value="pan_card">Income Tax PAN Card</option>
                  <option value="voter_id">Election Commission Voter ID (EPIC)</option>
                  <option value="driving_licence">State Driving Licence</option>
                  <option value="other_government_id">Other Government-Issued Photo ID</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-white/70 mb-2">
                  Document Reference / Last 4 Characters *
                </label>
                <input suppressHydrationWarning
                  type="text"
                  required
                  value={identityDocumentReference}
                  onChange={(e) => setIdentityDocumentReference(e.target.value)}
                  placeholder="Document number or masked reference"
                  className="w-full bg-[#161513] border border-white/20 px-4 py-2.5 text-sm text-[#FBF9F5]"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-white/70 mb-2">
                  Identity Verification Document (Private HR Storage)
                </label>
                <input suppressHydrationWarning
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => setIdentityFile(e.target.files?.[0] || null)}
                  className="w-full bg-[#161513] border border-white/20 px-3 py-2 text-xs text-white/70"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-white/70 mb-2">
                  Signed Appointment / Contractor Record (Private HR Storage)
                </label>
                <input suppressHydrationWarning
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => setContractFile(e.target.files?.[0] || null)}
                  className="w-full bg-[#161513] border border-white/20 px-3 py-2 text-xs text-white/70"
                />
              </div>
            </div>

            {/* Mandatory Privacy Notice */}
            <div className="p-4 bg-[#161513] border border-white/10 text-xs text-white/70 space-y-2">
              <p className="font-semibold text-[#FBF9F5]">
                HR & Governance Data Protection Notice (DPDP Act Compliance)
              </p>
              <p>
                Uttarkunth collects personal, professional, and identity verification records strictly for legitimate employment, contractor governance, access control, and statutory compliance purposes. Aadhaar is never required as a default document. All uploaded HR records are stored in the private <code className="text-[#E07A43]">staff-hr-docs</code> bucket accessible solely to the Founder and explicitly authorised HR/compliance personnel.
              </p>
              <label className="flex items-center gap-2.5 pt-2 cursor-pointer text-[#FBF9F5]">
                <input suppressHydrationWarning
                  type="checkbox"
                  checked={privacyNoticeAccepted}
                  onChange={(e) => setPrivacyNoticeAccepted(e.target.checked)}
                  className="accent-[#C55B23] w-4 h-4"
                />
                <span>
                  I have read and understood the Staff HR & Governance Privacy Notice. *
                </span>
              </label>
            </div>
          </section>

          {/* Section 5: 8 Mandatory Staff Agreements & Conduct Policies */}
          <section className="bg-[#1F1D1A] border border-white/15 p-6 md:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <FileCheck2 className="w-4 h-4 text-[#C55B23]" />
                <h2 className="text-sm uppercase tracking-[0.2em] font-semibold text-[#FBF9F5]">
                  5. Mandatory Staff Agreements & Conduct Policies ({acceptedAgreementsCount}/
                  {REQUIRED_STAFF_AGREEMENTS.length} Accepted)
                </h2>
              </div>
              <span className="text-[11px] font-mono text-white/60">
                SHA-256 Document Hash & Timestamp Recorded per Agreement
              </span>
            </div>

            <p className="text-xs text-[#FBF9F5]/70">
              No staff account may be approved by the Founder or granted administrative permissions until all eight legal and operational undertakings below are reviewed and accepted.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {REQUIRED_STAFF_AGREEMENTS.map((ag, idx) => {
                const state = agreementStates[ag.code];
                const isAccepted = Boolean(state?.accepted);
                return (
                  <div
                    key={ag.code}
                    className={`p-4 border transition-colors ${
                      isAccepted
                        ? 'bg-emerald-950/25 border-emerald-500/40'
                        : 'bg-[#161513] border-white/15'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-[#E07A43]">
                          Policy 0{idx + 1} · {ag.version}
                        </span>
                        <h3 className="text-sm font-semibold text-[#FBF9F5]">{ag.title}</h3>
                      </div>
                      <button suppressHydrationWarning
                        type="button"
                        onClick={() =>
                          setActiveAgreementModal(activeAgreementModal === ag.code ? null : ag.code)
                        }
                        className="text-[11px] text-[#E07A43] hover:underline flex items-center gap-1 shrink-0"
                      >
                        <FileText className="w-3 h-3" />
                        {activeAgreementModal === ag.code ? 'Hide Text' : 'Read Full Text'}
                      </button>
                    </div>

                    <p className="text-xs text-white/65 mb-3">{ag.summary}</p>

                    {activeAgreementModal === ag.code && (
                      <div className="mb-3 p-3 bg-black/40 border border-white/10 text-[11px] text-white/80 leading-relaxed font-serif">
                        {ag.content}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input suppressHydrationWarning
                          type="checkbox"
                          checked={isAccepted}
                          onChange={() => toggleAgreementAcceptance(ag.code)}
                          className="accent-[#C55B23] w-4 h-4"
                        />
                        <span className={isAccepted ? 'text-emerald-300 font-medium' : 'text-white/80'}>
                          I accept and undertake to comply
                        </span>
                      </label>
                      {state?.documentHash && (
                        <span
                          className="text-[9px] font-mono text-white/40"
                          title={`SHA-256: ${state.documentHash}`}
                        >
                          SHA256: {state.documentHash.slice(0, 10)}…
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Submit Bar */}
          <div className="bg-[#1F1D1A] border border-white/15 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-white/70">
              <p className="font-semibold text-[#FBF9F5]">
                Submission Lifecycle: Invited → Onboarding In Progress → Pending Founder Approval
              </p>
              <p>
                Submitting this form does not self-activate staff access. The Founder must review your dossier and issue your immutable Staff ID (<code className="text-[#E07A43]">UK-STAFF-2026-XXXX</code>).
              </p>
            </div>
            <button suppressHydrationWarning
              type="submit"
              disabled={submitting || !allAgreementsAccepted || !privacyNoticeAccepted}
              className="bg-[#C55B23] hover:bg-[#A94918] text-white px-8 py-4 text-xs uppercase tracking-[0.2em] font-semibold transition-colors disabled:opacity-40 shrink-0"
            >
              {submitting ? 'Submitting Staff Dossier...' : 'Submit Onboarding for Founder Approval'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StaffOnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#161513] text-[#FBF9F5] flex items-center justify-center text-xs uppercase tracking-widest">Loading Staff Onboarding...</div>}>
      <StaffOnboardingContent />
    </Suspense>
  );
}
