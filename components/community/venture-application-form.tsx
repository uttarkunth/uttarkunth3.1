'use client';

import React, { useState } from 'react';
import { Sparkles, Send, CheckCircle2, AlertCircle, Building2, Users, MapPin, Heart } from 'lucide-react';

export function VentureApplicationForm() {
  const [formData, setFormData] = useState({
    identityType: 'individual',
    leadName: '',
    contactEmail: '',
    contactPhone: '',
    contactWhatsapp: '',
    village: 'Jari',
    district: 'Kullu',
    ventureName: '',
    category: 'Stays & Hospitality',
    whyStarted: '',
    vision: '',
    karmayogAttachment: '',
    detailsWhenWhereWhyHow: '',
    voluntaryFundCommitment: 'A defined percentage of net profits dedicated to village development',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/community/ventures/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit venture application.');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-emerald-500/30 shadow-soft text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="font-serif text-2xl sm:text-3xl font-bold text-forest">
          Application Received
        </h3>
        <p className="text-sm text-charcoal-muted max-w-lg mx-auto leading-relaxed">
          Thank you for sharing your venture and commitment to Karmayog. Founder Gaurav Negi and the Uttarkunth Community Council review every application personally. We will reach out to you via WhatsApp or phone.
        </p>
        <div className="pt-4">
          <button
            onClick={() => setSuccess(false)}
            className="text-xs font-bold text-ukorange hover:underline uppercase tracking-wider"
          >
            Submit Another Initiative
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-10 border border-forest/15 shadow-soft space-y-6">
      <div className="space-y-1">
        <span className="text-[11px] font-bold text-ukorange uppercase tracking-wider block">
          Community Incubation Portal
        </span>
        <h3 className="font-serif text-2xl sm:text-3xl font-bold text-forest">
          Submit Your Venture to the Uttarkunth Ecosystem
        </h3>
        <p className="text-xs text-charcoal-muted leading-relaxed">
          Whether you are one person with an idea, an operational team, or an entire village council — if you adhere to Karmayog (5% think, 95% work) and community reinvestment, we want to walk this path with you.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Who Are You? */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-forest block">
          1. Who are you?
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'individual', title: '1 Person', sub: 'Individual Founder' },
            { id: 'team', title: 'A Team', sub: 'Co-founders / Collective' },
            { id: 'village', title: 'Whole Village', sub: 'Community / Panchayat' },
          ].map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setFormData({ ...formData, identityType: type.id })}
              className={`p-4 rounded-2xl border text-left transition-all ${
                formData.identityType === type.id
                  ? 'bg-forest text-ivory border-forest shadow-sm'
                  : 'bg-canvas text-charcoal border-forest/15 hover:border-forest/40'
              }`}
            >
              <span className="font-serif font-bold text-base block">{type.title}</span>
              <span className={`text-[11px] block mt-0.5 ${formData.identityType === type.id ? 'text-ivory/80' : 'text-charcoal-muted'}`}>
                {type.sub}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Contact Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-forest block mb-1">
            Founder / Representative Name *
          </label>
          <input
            type="text"
            required
            value={formData.leadName}
            onChange={(e) => setFormData({ ...formData, leadName: e.target.value })}
            placeholder="e.g. Ramesh Thakur"
            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-forest/20 bg-canvas focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-forest block mb-1">
            Phone / WhatsApp Number *
          </label>
          <input
            type="tel"
            required
            value={formData.contactPhone}
            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value, contactWhatsapp: e.target.value })}
            placeholder="e.g. 98160XXXXX"
            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-forest/20 bg-canvas focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-forest block mb-1">
            Email Address (Optional)
          </label>
          <input
            type="email"
            value={formData.contactEmail}
            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
            placeholder="you@example.com"
            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-forest/20 bg-canvas focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-bold text-forest block mb-1">Village</label>
            <input
              type="text"
              value={formData.village}
              onChange={(e) => setFormData({ ...formData, village: e.target.value })}
              placeholder="e.g. Jari / Tosh"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-forest/20 bg-canvas focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-forest block mb-1">District / Valley</label>
            <input
              type="text"
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              placeholder="e.g. Kullu"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-forest/20 bg-canvas focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest"
            />
          </div>
        </div>
      </div>

      {/* Venture Name & Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-forest block mb-1">
            Venture / Startup / Project Name *
          </label>
          <input
            type="text"
            required
            value={formData.ventureName}
            onChange={(e) => setFormData({ ...formData, ventureName: e.target.value })}
            placeholder="e.g. Parvati Valley Herbal & Tea Collective"
            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-forest/20 bg-canvas focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-forest block mb-1">
            Venture Category
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-forest/20 bg-canvas focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest"
          >
            <option value="Stays & Hospitality">Stays &amp; Hospitality (Homestays / Camps)</option>
            <option value="Café & Food Experiences">Café &amp; Food Experiences</option>
            <option value="Handloom, Crafts & Wool">Handloom, Crafts &amp; Wool</option>
            <option value="Indigenous Agriculture & Agroforestry">Indigenous Agriculture &amp; Agroforestry</option>
            <option value="Productions & Storytelling Media">Productions &amp; Storytelling Media</option>
            <option value="Cleanliness & Waste Management">Cleanliness &amp; Waste Management</option>
            <option value="Rural Technology & Connectivity">Rural Technology &amp; Connectivity</option>
          </select>
        </div>
      </div>

      {/* Deep Questions: Why Started, Vision, Karmayog, Details */}
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-forest block mb-1">
            Why did you start this? What real problem did you observe? *
          </label>
          <textarea
            required
            rows={3}
            value={formData.whyStarted}
            onChange={(e) => setFormData({ ...formData, whyStarted: e.target.value })}
            placeholder="Describe what you saw in your village or community that made you take action..."
            className="w-full text-xs p-3.5 rounded-xl border border-forest/20 bg-canvas focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest leading-relaxed"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-forest block mb-1">
            What is your vision and long-term goal?
          </label>
          <textarea
            rows={2}
            value={formData.vision}
            onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
            placeholder="Where do you see this initiative in 3 to 5 years?"
            className="w-full text-xs p-3.5 rounded-xl border border-forest/20 bg-canvas focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest leading-relaxed"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-forest block mb-1">
            How do Karmayog (5% think, 95% work) and Community Welfare attach to your venture? *
          </label>
          <textarea
            required
            rows={3}
            value={formData.karmayogAttachment}
            onChange={(e) => setFormData({ ...formData, karmayogAttachment: e.target.value })}
            placeholder="How do you ensure this is not just talk, but disciplined daily work? How will the surrounding community benefit?"
            className="w-full text-xs p-3.5 rounded-xl border border-forest/20 bg-canvas focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest leading-relaxed"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-forest block mb-1">
            Details: When, Where, Why and How is your project executed?
          </label>
          <textarea
            rows={3}
            value={formData.detailsWhenWhereWhyHow}
            onChange={(e) => setFormData({ ...formData, detailsWhenWhereWhyHow: e.target.value })}
            placeholder="Key operational details: timeline, physical location, operational steps, current traction..."
            className="w-full text-xs p-3.5 rounded-xl border border-forest/20 bg-canvas focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest leading-relaxed"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-forest block mb-1">
            Community Fund &amp; Voluntary Profit-Sharing Commitment
          </label>
          <input
            type="text"
            value={formData.voluntaryFundCommitment}
            onChange={(e) => setFormData({ ...formData, voluntaryFundCommitment: e.target.value })}
            placeholder="e.g. 5% to 10% of annual net profit directly into village cleanliness and children fund"
            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-forest/20 bg-canvas focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest"
          />
          <p className="text-[11px] text-charcoal-muted mt-1 leading-relaxed">
            Uttarkunth does not ask you to donate all profits like an NGO. You need healthy profits to expand capability, purchase tools, and hire people. But a disciplined, voluntary share must flow directly to ground-level community welfare.
          </p>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-forest hover:bg-forest-dark text-ivory text-xs font-bold py-3.5 px-6 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <span>Submitting to Community Council...</span>
          ) : (
            <>
              <Send className="w-4 h-4 text-ukorange" />
              <span>Submit Venture for Uttarkunth Ecosystem Incubation</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
