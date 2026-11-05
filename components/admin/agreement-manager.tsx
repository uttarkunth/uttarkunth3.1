'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Percent, FileText, CheckCircle2, AlertTriangle, Calendar,
  ShieldCheck, PlusCircle, Building2, User, Phone, Sparkles, CheckSquare
} from 'lucide-react';

interface PropertyItem {
  id: string;
  name: string;
  village?: string | null;
  district?: string | null;
}

interface HostAgreement {
  id: string;
  property_id: string;
  host_name: string;
  host_contact: string | null;
  agreement_start: string;
  agreement_end: string | null;
  commission_percent: number;
  intro_commission_percent: number;
  intro_period_months: number;
  standard_commission_percent: number;
  agreement_status: string;
  notes: string | null;
  terms_version: string | null;
  created_at: string;
  accepted_at: string | null;
}

interface AgreementManagerProps {
  properties: PropertyItem[];
  agreements: HostAgreement[];
}

export function CommercialAgreementManager({ properties, agreements }: AgreementManagerProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form states
  const [propertyId, setPropertyId] = useState(properties[0]?.id || '');
  const [hostName, setHostName] = useState('');
  const [hostContact, setHostContact] = useState('');
  const [agreementStart, setAgreementStart] = useState(new Date().toISOString().split('T')[0]);
  const [agreementEnd, setAgreementEnd] = useState('');
  const [standardCommission, setStandardCommission] = useState('10');
  const [introCommission, setIntroCommission] = useState('0');
  const [introMonths, setIntroMonths] = useState('12');
  const [agreementStatus, setAgreementStatus] = useState('active');
  const [hostAccepted, setHostAccepted] = useState(false);
  const [acceptanceReference, setAcceptanceReference] = useState('');
  const [notes, setNotes] = useState('');

  const handleCreateAgreement = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/agreements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: propertyId,
          host_name: hostName,
          host_contact: hostContact || null,
          agreement_start: agreementStart,
          agreement_end: agreementEnd || null,
          standard_commission_percent: Number(standardCommission),
          intro_commission_percent: Number(introCommission),
          intro_period_months: Number(introMonths),
          agreement_status: agreementStatus,
          host_accepted: hostAccepted,
          acceptance_reference: acceptanceReference || null,
          notes: notes || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to record agreement.');
      }

      setSuccessMessage(data.message || 'Agreement recorded successfully.');
      setShowCreateForm(false);
      setHostName('');
      setHostContact('');
      setAcceptanceReference('');
      setHostAccepted(false);
      setNotes('');
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const getPropertyName = (pId: string) => {
    const found = properties.find((p) => p.id === pId);
    return found ? `${found.name} (${found.village || 'Uttarakhand'})` : pId;
  };

  return (
    <div className="space-y-8">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-ukorange">
            Commercial Governance
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-forest mt-1">
            Host Commercial Agreements
          </h1>
          <p className="text-sm text-charcoal-muted mt-1 max-w-2xl">
            Authoritative registry of bilaterally authorized and host-accepted partnership agreements.
          </p>
        </div>

        <button suppressHydrationWarning
          type="button"
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-forest text-white text-xs font-semibold rounded-2xl hover:bg-forest-light transition-all shadow-sm"
        >
          <PlusCircle className="w-4 h-4 text-ukorange" />
          <span>{showCreateForm ? 'Close Form' : 'Authorize New Agreement'}</span>
        </button>
      </div>

      {/* Strict Policy Reminders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-white rounded-3xl border border-forest/15 shadow-soft space-y-2">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-ukorange" />
            <span className="text-xs font-bold uppercase tracking-wider text-forest">Zero Default Promise Policy</span>
          </div>
          <p className="text-xs text-charcoal-muted leading-relaxed">
            No public 0% or 10% commission promises are advertised on the public website. Commercial commission rates activate strictly and solely upon an explicit, demonstrably accepted bilateral agreement recorded in this registry.
          </p>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-forest/15 shadow-soft space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-ukorange" />
            <span className="text-xs font-bold uppercase tracking-wider text-forest">Direct Settlement Standard</span>
          </div>
          <p className="text-xs text-charcoal-muted leading-relaxed">
            All guest bookings operate on the Direct Local Settlement model: <em>&ldquo;No online payment is currently collected by Uttarkunth. Guests pay their hosts directly at the property.&rdquo;</em>
          </p>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-2xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-50 text-green-800 border border-green-200 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* CREATE AGREEMENT FORM */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateAgreement}
          className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6"
        >
          <div className="pb-4 border-b border-forest/10">
            <h3 className="font-serif text-xl font-bold text-forest">Record Commercial Host Agreement</h3>
            <p className="text-xs text-charcoal-muted mt-1">
              Creates a formal bilateral record. Commission calculations activate only if host acceptance is demonstrably recorded.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-muted mb-1.5">
                Target Property *
              </label>
              <select suppressHydrationWarning
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                required
                className="w-full text-xs bg-ivory-warm border border-forest/20 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-forest"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.village || 'Uttarakhand'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-muted mb-1.5">
                Host / Entity Legal Name *
              </label>
              <input suppressHydrationWarning
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="e.g. Yashpal Rawat"
                required
                className="w-full text-xs bg-ivory-warm border border-forest/20 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-forest"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-muted mb-1.5">
                Host Contact (Phone or Email)
              </label>
              <input suppressHydrationWarning
                type="text"
                value={hostContact}
                onChange={(e) => setHostContact(e.target.value)}
                placeholder="e.g. +91 9876543210 or host@uttarkunth.com"
                className="w-full text-xs bg-ivory-warm border border-forest/20 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-forest"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-muted mb-1.5">
                Agreement Status
              </label>
              <select suppressHydrationWarning
                value={agreementStatus}
                onChange={(e) => setAgreementStatus(e.target.value)}
                className="w-full text-xs bg-ivory-warm border border-forest/20 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-forest"
              >
                <option value="active">Active (Requires Host Acceptance)</option>
                <option value="draft">Draft / Offer (Pending Host Review)</option>
                <option value="expired">Terminated / Expired</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-muted mb-1.5">
                Agreement Start Date *
              </label>
              <input suppressHydrationWarning
                type="date"
                value={agreementStart}
                onChange={(e) => setAgreementStart(e.target.value)}
                required
                className="w-full text-xs bg-ivory-warm border border-forest/20 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-forest"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-muted mb-1.5">
                Agreement End Date (Optional)
              </label>
              <input suppressHydrationWarning
                type="date"
                value={agreementEnd}
                onChange={(e) => setAgreementEnd(e.target.value)}
                className="w-full text-xs bg-ivory-warm border border-forest/20 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-forest"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-muted mb-1.5">
                Introductory Commission Rate (%)
              </label>
              <input suppressHydrationWarning
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={introCommission}
                onChange={(e) => setIntroCommission(e.target.value)}
                className="w-full text-xs bg-ivory-warm border border-forest/20 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-forest"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-muted mb-1.5">
                Introductory Period (Months)
              </label>
              <input suppressHydrationWarning
                type="number"
                min="0"
                max="60"
                value={introMonths}
                onChange={(e) => setIntroMonths(e.target.value)}
                className="w-full text-xs bg-ivory-warm border border-forest/20 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-forest"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-muted mb-1.5">
                Standard Commission Rate (%)
              </label>
              <input suppressHydrationWarning
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={standardCommission}
                onChange={(e) => setStandardCommission(e.target.value)}
                className="w-full text-xs bg-ivory-warm border border-forest/20 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-forest"
              />
            </div>

            <div className="sm:col-span-2 p-4 bg-ivory rounded-2xl border border-forest/15 space-y-3">
              <div className="flex items-center gap-2">
                <input suppressHydrationWarning
                  type="checkbox"
                  id="hostAccepted"
                  checked={hostAccepted}
                  onChange={(e) => setHostAccepted(e.target.checked)}
                  className="w-4 h-4 text-forest rounded border-forest/20 focus:ring-forest"
                />
                <label htmlFor="hostAccepted" className="text-xs font-bold text-forest cursor-pointer">
                  Host Acceptance Demonstrably Recorded (Bilateral Execution)
                </label>
              </div>

              {hostAccepted ? (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-charcoal-muted mb-1">
                    Acceptance Reference or Document Signature Details *
                  </label>
                  <input suppressHydrationWarning
                    type="text"
                    value={acceptanceReference}
                    onChange={(e) => setAcceptanceReference(e.target.value)}
                    placeholder="e.g. Counter-signed MOU #UK-2026-YASH dated 2 Nov 2026 or Host Digital Acceptance"
                    required={hostAccepted}
                    className="w-full text-xs bg-white border border-forest/20 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-forest"
                  />
                </div>
              ) : (
                <p className="text-[11px] text-charcoal-muted italic">
                  Without recorded host acceptance, this agreement will be recorded as a Draft/Offer and will NOT activate platform commission calculations.
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-muted mb-1.5">
                Administrative Notes & Special Terms
              </label>
              <textarea suppressHydrationWarning
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Reference formal executed memorandum of understanding or bilateral approval notes..."
                className="w-full text-xs bg-ivory-warm border border-forest/20 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-forest"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-forest/10">
            <button suppressHydrationWarning
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 text-xs font-semibold text-charcoal-muted hover:text-charcoal"
            >
              Cancel
            </button>
            <button suppressHydrationWarning
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-forest text-white text-xs font-semibold rounded-xl hover:bg-forest-light transition-all disabled:opacity-50"
            >
              {submitting ? 'Recording Agreement...' : 'Authorize & Record Agreement'}
            </button>
          </div>
        </form>
      )}

      {/* AGREEMENTS LIST */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-forest/10">
          <div>
            <h2 className="font-serif text-2xl font-bold text-forest">Registered Commercial Agreements</h2>
            <p className="text-xs text-charcoal-muted mt-0.5">
              {agreements.length} authorized agreements currently registered in Supabase.
            </p>
          </div>
        </div>

        {agreements.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory-warm text-charcoal-muted uppercase tracking-wider border-b border-forest/10">
                <tr>
                  <th className="p-3">Property</th>
                  <th className="p-3">Host / Partner</th>
                  <th className="p-3">Validity</th>
                  <th className="p-3">Rates (Intro / Std)</th>
                  <th className="p-3">Bilateral Status</th>
                  <th className="p-3">Acceptance Record</th>
                  <th className="p-3">Recorded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest/10">
                {agreements.map((a) => (
                  <tr key={a.id} className="hover:bg-forest/5 transition-colors">
                    <td className="p-3 font-semibold text-forest">
                      {getPropertyName(a.property_id)}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-charcoal">{a.host_name}</div>
                      {a.host_contact && (
                        <div className="text-[11px] text-charcoal-muted">{a.host_contact}</div>
                      )}
                    </td>
                    <td className="p-3 whitespace-nowrap text-charcoal-muted">
                      {a.agreement_start} {a.agreement_end ? `→ ${a.agreement_end}` : '(Ongoing)'}
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-forest">
                        {a.intro_commission_percent}%
                      </span>
                      <span className="text-[11px] text-charcoal-muted ml-1">
                        ({a.intro_period_months}m)
                      </span>
                      <span className="mx-1 text-charcoal-muted">/</span>
                      <span className="font-semibold text-charcoal">
                        {a.standard_commission_percent}%
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                        a.agreement_status === 'active' && a.accepted_at
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {a.agreement_status === 'active' && a.accepted_at ? 'Active (Bilateral)' : 'Draft (Unaccepted)'}
                      </span>
                    </td>
                    <td className="p-3 text-charcoal-muted">
                      {a.accepted_at ? (
                        <span className="text-[11px] text-emerald-700 font-medium">
                          Accepted {new Date(a.accepted_at).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-700 font-medium italic">
                          Awaiting Host Acceptance
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-charcoal-muted whitespace-nowrap">
                      {new Date(a.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center space-y-2 bg-ivory-warm rounded-2xl border border-dashed border-forest/20">
            <FileText className="w-8 h-8 text-charcoal-muted/50 mx-auto" />
            <p className="text-xs font-semibold text-charcoal">No individual host agreements on file</p>
            <p className="text-xs text-charcoal-muted max-w-md mx-auto leading-relaxed">
              In accordance with platform policy, all properties default to bilateral direct guest settlement with zero automated commissions until an agreement is formally recorded and host-accepted.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
