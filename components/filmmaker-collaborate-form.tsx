'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Clapperboard,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  Video,
  Film,
  Camera,
  MapPin,
  FileText,
  DollarSign,
  User,
  Mail,
  Phone,
  Link as LinkIcon,
} from 'lucide-react';

interface Props {
  initialEmail?: string;
  isLoggedIn: boolean;
  isDbReady?: boolean;
}

const CREATIVE_ROLES = [
  { value: 'director', label: 'Film Director / Documentarian' },
  { value: 'cinematographer', label: 'Cinematographer / DOP' },
  { value: 'sound_recordist', label: 'Field Sound Recordist' },
  { value: 'editor', label: 'Film Editor / Colorist' },
  { value: 'writer', label: 'Screenwriter / Story Researcher' },
  { value: 'researcher', label: 'Anthropologist / Ethnographer' },
  { value: 'other', label: 'Creative Contributor / Guide' },
];

const SKILL_OPTIONS = [
  '4K/6K Field Cinematography',
  'Drone & Aerial Photography',
  'Ambient Mountain Audio Recording',
  'Pahari / Hindi Dialect Translation',
  'Indigenous Oral Interviewing',
  'Archival Restoration',
  'Davinci Resolve Color Grading',
  'Wilderness Survival & Expedition Logistics',
];

const SUPPORT_OPTIONS = [
  'Co-Production Grant / Co-Financing',
  'On-Ground Village Access & Homestay Base in Parvati Valley',
  'Local Permitting & Community Council Introductions',
  'Field Audio & Production Equipment Sharing',
  'Editorial Mentorship & Post-Production',
  'Festival Circuit Submission & Digital Archiving on Uttarkunth',
];

export function FilmmakerCollaborateForm({ initialEmail = '', isLoggedIn, isDbReady = false }: Props) {
  const router = useRouter();

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [creativeRole, setCreativeRole] = useState('director');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['4K/6K Field Cinematography']);
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [bio, setBio] = useState('');

  // Proposal State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'documentary' | 'cultural_monologue' | 'visual_essay' | 'oral_history' | 'environmental' | 'other'>('documentary');
  const [proposedLocation, setProposedLocation] = useState('Parvati Valley, Himachal Pradesh');
  const [synopsis, setSynopsis] = useState('');
  const [concept, setConcept] = useState('');
  const [culturalRelevance, setCulturalRelevance] = useState('');
  const [supportNeeded, setSupportNeeded] = useState<string[]>(['On-Ground Village Access & Homestay Base in Parvati Valley']);
  const [estimatedBudget, setEstimatedBudget] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ title: string; message: string } | null>(null);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const toggleSupport = (sup: string) => {
    setSupportNeeded((prev) =>
      prev.includes(sup) ? prev.filter((s) => s !== sup) : [...prev, sup]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isLoggedIn) {
      router.push(`/login?next=/production/collaborate`);
      return;
    }

    if (selectedSkills.length === 0) {
      setErrorMsg('Please select at least one creative skill');
      return;
    }

    if (supportNeeded.length === 0) {
      setErrorMsg('Please select at least one form of co-production support needed');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Save Filmmaker Profile
      const applyRes = await fetch('/api/production/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          location,
          creative_role: creativeRole,
          skills: selectedSkills,
          portfolio_url: portfolioUrl,
          bio,
          collaboration_interests: supportNeeded,
        }),
      });

      const applyData = await applyRes.json();
      if (!applyRes.ok || !applyData.ok) {
        throw new Error(applyData.error || 'Failed to submit profile details');
      }

      // Step 2: Submit Project Proposal
      const propRes = await fetch('/api/production/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          synopsis,
          concept,
          proposed_location: proposedLocation,
          cultural_relevance: culturalRelevance,
          support_needed: supportNeeded,
          estimated_budget: estimatedBudget ? Number(estimatedBudget) : null,
          portfolio_links: portfolioUrl ? [portfolioUrl] : [],
        }),
      });

      const propData = await propRes.json();
      if (!propRes.ok || !propData.ok) {
        throw new Error(propData.error || 'Failed to submit film proposal');
      }

      setSuccessData({
        title,
        message: propData.message || 'Proposal received! Our editorial board will review your pitch.',
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while submitting your proposal.');
    } finally {
      setLoading(false);
    }
  };

  if (!isDbReady) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-amber-300 ring-1 ring-amber-200/60 shadow-soft space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
            <Clapperboard className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <span className="inline-block px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full uppercase tracking-wider">
              Online Portal Not Yet Open
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-forest">
              Co-Production Submissions Opening Soon
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed max-w-2xl">
              Our online filmmaker registration and pitch submission database module is prepared and currently awaiting production database activation. Online form submissions are temporarily unavailable so that no pitch is lost.
            </p>
          </div>
        </div>

        <div className="p-5 bg-ivory-warm rounded-2xl border border-forest/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-forest block">Share Your Pitch Directly With Our Editorial Desk</span>
            <p className="text-xs text-charcoal-muted">
              Send your documentary logline, treatment, proposed valley location, and showreel link directly to our team:
            </p>
          </div>
          <a
            href="mailto:info@uttarkunth.com?subject=Documentary%20Pitch%20%26%20Co-Production%20Enquiry"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex-shrink-0"
          >
            <Mail className="w-4 h-4 text-ukorange" />
            <span>Email info@uttarkunth.com</span>
          </a>
        </div>
      </div>
    );
  }

  if (successData) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-forest/15 shadow-lifted text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-forest/10 text-forest mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-forest" />
        </div>
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-widest text-ukorange font-bold">Proposal Registered</span>
          <h2 className="font-serif text-3xl font-bold text-forest">{successData.title}</h2>
          <p className="text-sm text-charcoal-muted max-w-lg mx-auto leading-relaxed">
            {successData.message}
          </p>
        </div>
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/account/productions"
            className="w-full sm:w-auto px-6 py-2.5 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            Go to My Productions Workspace
          </Link>
          <button suppressHydrationWarning
            onClick={() => setSuccessData(null)}
            className="w-full sm:w-auto px-6 py-2.5 bg-ivory-warm hover:bg-forest/10 text-forest text-xs font-semibold rounded-xl border border-forest/20 transition-colors"
          >
            Submit Another Proposal
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-10 border border-forest/15 shadow-soft space-y-10">
      {/* Header notice */}
      <div className="border-b border-forest/10 pb-6 space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-ukorange" />
          <span className="text-xs font-bold uppercase tracking-widest text-forest">Co-Production Application & Pitch</span>
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-forest">
          Submit Your Mountain Film Pitch
        </h2>
        <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
          We review documentary pitches, ethnographies, and independent film projects seeking funding, on-ground field access, or archival distribution.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Section 1: Creative Profile */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-forest text-white text-xs font-bold flex items-center justify-center">1</span>
          <h3 className="font-serif text-lg font-bold text-forest">Creative Collaborator Profile</h3>
        </div>

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
              placeholder="e.g. Maya Sharma"
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
              placeholder="you@domain.com"
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
              <MapPin className="w-3.5 h-3.5 text-forest/70" />
              Current Base / Location *
            </label>
            <input suppressHydrationWarning
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Kullu, HP / Mumbai / Dehradun"
              className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-xs text-charcoal focus:ring-2 focus:ring-ukorange/30 focus:border-forest outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-charcoal flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-forest/70" />
            Primary Creative Role *
          </label>
          <select suppressHydrationWarning
            value={creativeRole}
            onChange={(e) => setCreativeRole(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-xs text-charcoal bg-white focus:ring-2 focus:ring-ukorange/30 focus:border-forest outline-none transition-all"
          >
            {CREATIVE_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Skills */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-charcoal block">
            Skills & Technical Strengths (Select all that apply) *
          </label>
          <div className="flex flex-wrap gap-2">
            {SKILL_OPTIONS.map((skill) => {
              const active = selectedSkills.includes(skill);
              return (
                <button suppressHydrationWarning
                  type="button"
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    active
                      ? 'bg-forest text-white shadow-xs'
                      : 'bg-ivory-warm text-charcoal hover:bg-forest/10 border border-forest/15'
                  }`}
                >
                  {skill}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-charcoal flex items-center gap-1.5">
            <LinkIcon className="w-3.5 h-3.5 text-forest/70" />
            Portfolio, Vimeo, or Showreel URL
          </label>
          <input suppressHydrationWarning
            type="url"
            value={portfolioUrl}
            onChange={(e) => setPortfolioUrl(e.target.value)}
            placeholder="https://vimeo.com/... or https://yourportfolio.com"
            className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-xs text-charcoal focus:ring-2 focus:ring-ukorange/30 focus:border-forest outline-none transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-charcoal block">
            Creative Bio & Previous Work (min 20 characters) *
          </label>
          <textarea suppressHydrationWarning
            required
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about your background, previous documentary or ethnographic projects, and connection to Himalayan mountain culture..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-xs text-charcoal focus:ring-2 focus:ring-ukorange/30 focus:border-forest outline-none transition-all"
          />
        </div>
      </div>

      {/* Section 2: Film Proposal */}
      <div className="space-y-6 pt-6 border-t border-forest/10">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-forest text-white text-xs font-bold flex items-center justify-center">2</span>
          <h3 className="font-serif text-lg font-bold text-forest">Project Proposal & Treatment</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-charcoal block">Project Title *</label>
            <input suppressHydrationWarning
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Songs of the High Meadow"
              className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-xs text-charcoal focus:ring-2 focus:ring-ukorange/30 focus:border-forest outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-charcoal block">Format / Category *</label>
            <select suppressHydrationWarning
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-xs text-charcoal bg-white focus:ring-2 focus:ring-ukorange/30 focus:border-forest outline-none transition-all"
            >
              <option value="documentary">Ethnographic Documentary</option>
              <option value="cultural_monologue">Cultural Monologue / Oral Testimony</option>
              <option value="visual_essay">Cinematic Visual Essay</option>
              <option value="oral_history">Folk Song & Oral History Archive</option>
              <option value="environmental">Ecological & Wildlife Investigation</option>
              <option value="other">Independent Mountain Feature</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-charcoal block">Proposed Mountain Location / Valley *</label>
            <input suppressHydrationWarning
              type="text"
              required
              value={proposedLocation}
              onChange={(e) => setProposedLocation(e.target.value)}
              placeholder="e.g. Parvati Valley, Spiti, Tirthan, Malana"
              className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-xs text-charcoal focus:ring-2 focus:ring-ukorange/30 focus:border-forest outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-charcoal block">Estimated Budget (Optional, ₹ INR)</label>
            <input suppressHydrationWarning
              type="number"
              value={estimatedBudget}
              onChange={(e) => setEstimatedBudget(e.target.value)}
              placeholder="e.g. 250000"
              className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-xs text-charcoal focus:ring-2 focus:ring-ukorange/30 focus:border-forest outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-charcoal block">
            Logline / Short Synopsis (min 20 characters) *
          </label>
          <textarea suppressHydrationWarning
            required
            rows={2}
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
            placeholder="A one- or two-sentence summary capturing the emotional and cultural core of the story..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-xs text-charcoal focus:ring-2 focus:ring-ukorange/30 focus:border-forest outline-none transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-charcoal block">
            Detailed Concept & Creative Treatment (min 30 characters) *
          </label>
          <textarea suppressHydrationWarning
            required
            rows={4}
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            placeholder="Outline your directorial vision, characters, narrative arc, and visual language..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-xs text-charcoal focus:ring-2 focus:ring-ukorange/30 focus:border-forest outline-none transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-charcoal block">
            Cultural & Ecological Relevance (min 20 characters) *
          </label>
          <textarea suppressHydrationWarning
            required
            rows={3}
            value={culturalRelevance}
            onChange={(e) => setCulturalRelevance(e.target.value)}
            placeholder="Why must this story be told now? How does it honor village autonomy, tradition, or environmental preservation?"
            className="w-full px-3.5 py-2.5 rounded-xl border border-forest/20 text-xs text-charcoal focus:ring-2 focus:ring-ukorange/30 focus:border-forest outline-none transition-all"
          />
        </div>

        {/* Support Needed */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-charcoal block">
            Support Needed from Uttarkunth Productions *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SUPPORT_OPTIONS.map((opt) => {
              const active = supportNeeded.includes(opt);
              return (
                <div
                  key={opt}
                  onClick={() => toggleSupport(opt)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center gap-2.5 transition-all ${
                    active
                      ? 'bg-forest/5 border-forest text-forest font-semibold'
                      : 'bg-white border-forest/15 text-charcoal-muted hover:border-forest/30'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 ${
                      active ? 'bg-forest border-forest text-white' : 'border-forest/30'
                    }`}
                  >
                    {active && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <span>{opt}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-6 border-t border-forest/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-[11px] text-charcoal-muted leading-relaxed">
          {isLoggedIn ? (
            <span>Logged in as <strong>{initialEmail}</strong>. Submissions are saved to your account.</span>
          ) : (
            <span className="text-ukorange font-medium">Please sign in to submit. You will be redirected after submitting.</span>
          )}
        </p>

        <button suppressHydrationWarning
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
        >
          {loading ? (
            <span>Submitting Proposal...</span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Submit Film Pitch</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
