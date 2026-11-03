'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, CheckCircle2, AlertTriangle, ShieldCheck, ChevronRight } from 'lucide-react';

interface AgreementData {
  id: string;
  property_id: string;
  host_name: string;
  standard_commission_percent: number;
  intro_commission_percent: number;
  intro_period_months: number;
  agreement_start: string;
  agreement_end: string | null;
  agreement_status: string;
  accepted_at: string | null;
  terms_version: string | null;
  notes: string | null;
  properties?: {
    name: string;
  };
}

interface AgreementAcceptorProps {
  agreements: AgreementData[];
}

export function AgreementAcceptor({ agreements }: AgreementAcceptorProps) {
  const router = useRouter();
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [confirmedIds, setConfirmedIds] = useState<{ [id: string]: boolean }>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const pendingAgreements = agreements.filter((a) => !a.accepted_at);

  if (pendingAgreements.length === 0) {
    return null;
  }

  const handleAccept = async (agreement: AgreementData) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmittingId(agreement.id);

    try {
      const res = await fetch('/api/host/agreements/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreement_id: agreement.id,
          expected_terms_version: agreement.terms_version || '2026.1'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to accept agreement terms.');
      }

      setSuccessMsg(data.message || 'Commercial terms successfully accepted.');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error accepting terms.');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-2xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-green-50 text-green-800 border border-green-200 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {pendingAgreements.map((a) => {
        const isConfirmed = confirmedIds[a.id] || false;
        const propName = a.properties?.name || 'Assigned Property';

        return (
          <div
            key={a.id}
            className="p-5 sm:p-6 bg-amber-50/70 border border-amber-200 rounded-3xl shadow-sm space-y-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-800 flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-full">
                    Action Required: Bilateral Host Agreement
                  </span>
                  <h3 className="font-serif text-lg font-bold text-forest mt-0.5">
                    Commercial Partnership Offer for {propName}
                  </h3>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white/90 rounded-2xl border border-amber-200/60 text-xs text-charcoal space-y-2">
              <p className="leading-relaxed">
                Uttarkunth has prepared a commercial agreement for your homestay. In accordance with platform integrity rules, no commissions apply until you review and explicitly accept these terms:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-charcoal">
                <div className="p-2.5 bg-ivory rounded-xl border border-forest/10">
                  <span className="text-[10px] text-charcoal-muted uppercase block">Introductory Rate</span>
                  <span className="font-bold text-forest text-sm">{a.intro_commission_percent}%</span>
                  <span className="text-[10px] text-charcoal-muted block">({a.intro_period_months} months)</span>
                </div>
                <div className="p-2.5 bg-ivory rounded-xl border border-forest/10">
                  <span className="text-[10px] text-charcoal-muted uppercase block">Standard Rate</span>
                  <span className="font-bold text-forest text-sm">{a.standard_commission_percent}%</span>
                </div>
                <div className="p-2.5 bg-ivory rounded-xl border border-forest/10">
                  <span className="text-[10px] text-charcoal-muted uppercase block">Effective Date</span>
                  <span className="font-bold text-forest text-sm">{a.agreement_start}</span>
                </div>
                <div className="p-2.5 bg-ivory rounded-xl border border-forest/10">
                  <span className="text-[10px] text-charcoal-muted uppercase block">Terms Version</span>
                  <span className="font-bold text-forest text-sm">{a.terms_version || '2026.1'}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-charcoal font-medium">
                <input
                  type="checkbox"
                  checked={isConfirmed}
                  onChange={(e) => setConfirmedIds({ ...confirmedIds, [a.id]: e.target.checked })}
                  className="w-4 h-4 text-forest rounded border-forest/20 focus:ring-forest"
                />
                <span>
                  I, <strong>{a.host_name}</strong>, formally accept these bilateral commercial terms on behalf of this homestay.
                </span>
              </label>

              <button
                type="button"
                onClick={() => handleAccept(a)}
                disabled={!isConfirmed || submittingId === a.id}
                className="px-4 py-2 bg-forest text-white text-xs font-semibold rounded-xl hover:bg-forest-light transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap self-start sm:self-auto"
              >
                {submittingId === a.id ? 'Recording Acceptance...' : 'Accept & Activate Agreement'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
