'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { COMMUNITY_INITIATIVES } from '@/lib/constants';
import {
  Heart,
  Send,
  CheckCircle2,
  AlertCircle,
  User,
  Mail,
  Phone,
  Clock,
  Sparkles,
  MapPin,
} from 'lucide-react';

interface Props {
  initialEmail?: string;
  isLoggedIn: boolean;
  isDbReady?: boolean;
}

export function CommunityParticipationForm({ initialEmail = '', isLoggedIn, isDbReady = false }: Props) {
  const searchParams = useSearchParams();
  const initialInitiative = searchParams?.get('initiative') || COMMUNITY_INITIATIVES[0].slug;

  const [initiativeSlug, setInitiativeSlug] = useState(initialInitiative);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState('');
  const [duration, setDuration] = useState('2 weeks');
  const [motivation, setMotivation] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const fromQuery = searchParams?.get('initiative');
    if (fromQuery) {
      setInitiativeSlug(fromQuery);
    }
  }, [searchParams]);

  const selectedInit = COMMUNITY_INITIATIVES.find((i) => i.slug === initiativeSlug) || COMMUNITY_INITIATIVES[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/community/participate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initiative_slug: initiativeSlug,
          full_name: fullName,
          email,
          phone,
          skills,
          duration,
          motivation,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to submit application');
      }

      setSuccessMsg(data.message || 'Application received successfully!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while submitting');
    } finally {
      setLoading(false);
    }
  };

  if (!isDbReady) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-amber-300 ring-1 ring-amber-200/60 shadow-soft space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
            <Heart className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <span className="inline-block px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full uppercase tracking-wider">
              Online Portal Not Yet Open
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-forest">
              Field Participation Applications Opening Soon
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed max-w-2xl">
              Our 9 community initiatives are currently in the proposed planning stage, and our online participation database module is awaiting production activation. Online form submissions are not yet active so that no application is lost.
            </p>
          </div>
        </div>

        <div className="p-5 bg-ivory-warm rounded-2xl border border-forest/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-forest block">Express Interest Directly via Email</span>
            <p className="text-xs text-charcoal-muted">
              To collaborate on a proposed initiative ({selectedInit.title}), introduce yourself directly to our team:
            </p>
          </div>
          <a
            href={`mailto:info@uttarkunth.com?subject=${encodeURIComponent(`Community Initiative Enquiry: ${selectedInit.title}`)}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex-shrink-0"
          >
            <Mail className="w-4 h-4 text-ukorange" />
            <span>Email info@uttarkunth.com</span>
          </a>
        </div>
      </div>
    );
  }

  if (successMsg) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-forest/15 shadow-lifted text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-forest/10 text-forest mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-forest" />
        </div>
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-widest text-ukorange font-bold">Application Received</span>
          <h2 className="font-serif text-3xl font-bold text-forest">Thank You for Your Karmayog Spirit</h2>
          <p className="text-sm text-charcoal-muted max-w-lg mx-auto leading-relaxed">
            {successMsg}
          </p>
        </div>

        <div className="p-4 bg-ivory-warm rounded-2xl border border-forest/10 max-w-md mx-auto text-xs text-charcoal-muted">
          <span>Selected Initiative: <strong>{selectedInit.title}</strong></span>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/account/community"
            className="w-full sm:w-auto px-6 py-2.5 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            View in My Community Workspace
          </Link>
          <button suppressHydrationWarning
            onClick={() => {
              setSuccessMsg(null);
              setMotivation('');
            }}
            className="w-full sm:w-auto px-6 py-2.5 bg-ivory-warm hover:bg-forest/10 text-forest text-xs font-semibold rounded-xl border border-forest/20 transition-colors"
          >
            Submit Another Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-10 border border-forest/15 shadow-soft space-y-8">
      <div className="border-b border-forest/10 pb-6 space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-ukorange" />
          <span className="text-xs font-bold uppercase tracking-widest text-forest">Field Participation Application</span>
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-forest">
          Join a Grassroots Himalayan Cohort
        </h2>
        <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
          We match passionate individuals with ongoing community initiatives in Parvati Valley, Kullu, Spiti, and Kinnaur.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Initiative Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-charcoal block">
          Choose Your Primary Field Initiative *
        </label>
        <select suppressHydrationWarning
          value={initiativeSlug}
          onChange={(e) => setInitiativeSlug(e.target.value)}
          className="w-full px-3.5 py-3 rounded-xl border border-forest/20 text-xs text-charcoal bg-white focus:ring-2 focus:ring-ukorange/30 focus:border-forest outline-none transition-all font-medium"
        >
          {COMMUNITY_INITIATIVES.map((init) => (
            <option key={init.slug} value={init.slug}>
              {init.title} — ({init.valley} • {init.status})
            </option>
          ))}
        </select>

        <div className="p-3 bg-ivory-warm rounded-xl border border-forest/10 text-[11px] text-charcoal-muted">
          <strong>Focus:</strong> {selectedInit.tagline}
        </div>
      </div>

      {/* Personal Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-charcoal flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-forest/70" />
            Full Name *
          </label>
          <input suppressHydrationWarning
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Ananya Sen"
            className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-xs text-charcoal focus:ring-2 focus:ring-ukorange/30 focus:border-forest outline-none transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-charcoal flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-forest/70" />
            Contact Email *
          </label>
          <input suppressHydrationWarning
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ananya@example.com"
            className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-xs text-charcoal focus:ring-2 focus:ring-ukorange/30 focus:border-forest outline-none transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-charcoal flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-forest/70" />
            Phone / WhatsApp
          </label>
          <input suppressHydrationWarning
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-xs text-charcoal focus:ring-2 focus:ring-ukorange/30 focus:border-forest outline-none transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-charcoal flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-forest/70" />
            Availability Duration *
          </label>
          <select suppressHydrationWarning
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-xs text-charcoal bg-white focus:ring-2 focus:ring-ukorange/30 focus:border-forest outline-none transition-all"
          >
            <option value="1 to 2 weeks">1 to 2 weeks (Short field sprint)</option>
            <option value="1 month">1 month (Standard residency)</option>
            <option value="2 to 3 months">2 to 3 months (Seasonal cohort)</option>
            <option value="Long-term / Remote">Long-term / Remote collaboration</option>
          </select>
        </div>
      </div>

      {/* Skills */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-charcoal block">
          Your Skills, Craft, or Academic Background (min 5 characters) *
        </label>
        <textarea suppressHydrationWarning
          required
          rows={3}
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          placeholder="e.g. Vernacular architecture student with experience in measured drawing, botanical cataloging, audio editing, organic farming, or digital marketing..."
          className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-xs text-charcoal focus:ring-2 focus:ring-ukorange/30 focus:border-forest outline-none transition-all"
        />
      </div>

      {/* Motivation */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-charcoal block">
          Why do you want to contribute to this initiative? (min 20 characters) *
        </label>
        <textarea suppressHydrationWarning
          required
          rows={4}
          value={motivation}
          onChange={(e) => setMotivation(e.target.value)}
          placeholder="Describe what draws you to this work, your expectation of mountain life, and how your contribution embodies learning by doing..."
          className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-xs text-charcoal focus:ring-2 focus:ring-ukorange/30 focus:border-forest outline-none transition-all"
        />
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-forest/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-[11px] text-charcoal-muted">
          All initiatives provide modest homestay accommodation guidance and direct local mentorship.
        </p>

        <button suppressHydrationWarning
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
        >
          {loading ? (
            <span>Submitting Application...</span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Submit Participation Application</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
