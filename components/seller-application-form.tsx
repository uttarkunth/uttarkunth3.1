'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Sparkles, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

export function SellerApplicationForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    business_name: '',
    maker_name: '',
    craft_type: '',
    valley: '',
    state: 'Himachal Pradesh',
    contact_email: '',
    contact_phone: '',
    bio: '',
    materials: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/products/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to submit application.');
      }

      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Submission failed. Please verify all fields.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-forest/15 shadow-soft text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-forest">
          Application Received
        </h2>
        <p className="text-xs sm:text-sm text-charcoal-muted max-w-lg mx-auto leading-relaxed">
          Thank you for applying to partner with Uttarkunth. Our mountain curation team will review your workshop provenance and respond to <strong>{formData.contact_email}</strong> within 48 hours.
        </p>
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => router.push('/account/products')}
            className="px-6 py-2.5 bg-forest text-white text-xs font-semibold rounded-xl hover:bg-forest-hover transition-colors"
          >
            Go to My Products
          </button>
          <button
            onClick={() => router.push('/products')}
            className="px-6 py-2.5 bg-ivory-warm border border-forest/20 text-forest text-xs font-semibold rounded-xl hover:bg-forest/10 transition-colors"
          >
            Browse Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-10 border border-forest/15 shadow-soft space-y-6">
      <div className="space-y-1">
        <h2 className="font-serif text-2xl font-bold text-forest">
          Artisan &amp; Maker Application
        </h2>
        <p className="text-xs text-charcoal-muted">
          Provide details about your craft, workshop, or harvest. All listings require authentic mountain provenance.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-800 text-xs rounded-xl border border-red-200">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-charcoal mb-1">
            Business / Cooperative Name *
          </label>
          <input
            type="text"
            required
            name="business_name"
            value={formData.business_name}
            onChange={handleChange}
            placeholder="e.g. Parvati Valley Weavers Collective"
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 focus:outline-hidden focus:ring-2 focus:ring-forest/30"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-charcoal mb-1">
            Lead Artisan / Contact Name *
          </label>
          <input
            type="text"
            required
            name="maker_name"
            value={formData.maker_name}
            onChange={handleChange}
            placeholder="e.g. Tenzing Norbu"
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 focus:outline-hidden focus:ring-2 focus:ring-forest/30"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-charcoal mb-1">
            Craft or Harvest Category *
          </label>
          <input
            type="text"
            required
            name="craft_type"
            value={formData.craft_type}
            onChange={handleChange}
            placeholder="e.g. Handloom Yak Shawls, Raw Pine Honey, Woodcarving"
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 focus:outline-hidden focus:ring-2 focus:ring-forest/30"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-charcoal mb-1">
            Valley / Sub-region *
          </label>
          <input
            type="text"
            required
            name="valley"
            value={formData.valley}
            onChange={handleChange}
            placeholder="e.g. Parvati Valley, Kullu Valley, Spiti"
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 focus:outline-hidden focus:ring-2 focus:ring-forest/30"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-charcoal mb-1">
            State *
          </label>
          <select
            name="state"
            value={formData.state}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 focus:outline-hidden focus:ring-2 focus:ring-forest/30 bg-white"
          >
            <option value="Himachal Pradesh">Himachal Pradesh</option>
            <option value="Uttarakhand">Uttarakhand</option>
            <option value="Ladakh">Ladakh</option>
            <option value="Jammu & Kashmir">Jammu &amp; Kashmir</option>
            <option value="Sikkim">Sikkim</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-charcoal mb-1">
            Contact Email *
          </label>
          <input
            type="email"
            required
            name="contact_email"
            value={formData.contact_email}
            onChange={handleChange}
            placeholder="artisan@example.com"
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 focus:outline-hidden focus:ring-2 focus:ring-forest/30"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-charcoal mb-1">
            Contact Phone / WhatsApp (Optional)
          </label>
          <input
            type="tel"
            name="contact_phone"
            value={formData.contact_phone}
            onChange={handleChange}
            placeholder="+91 98160 XXXXX"
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 focus:outline-hidden focus:ring-2 focus:ring-forest/30"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-charcoal mb-1">
            Workshop &amp; Heritage Narrative *
          </label>
          <textarea
            required
            rows={4}
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Share your story: how long has your family or cooperative practiced this craft? Where do you harvest raw materials? (Minimum 20 characters)"
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 focus:outline-hidden focus:ring-2 focus:ring-forest/30 resize-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-charcoal mb-1">
            Natural Materials Used
          </label>
          <input
            type="text"
            name="materials"
            value={formData.materials}
            onChange={handleChange}
            placeholder="e.g. 100% Indigenous sheep wool, wild walnut bark dye, alpine pine resin"
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 focus:outline-hidden focus:ring-2 focus:ring-forest/30"
          />
        </div>
      </div>

      <div className="pt-2 border-t border-forest/10 flex items-center justify-between">
        <span className="text-[11px] text-charcoal-muted">
          All submissions are manually reviewed before onboarding.
        </span>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 bg-forest hover:bg-forest-hover text-white px-6 py-3 rounded-xl font-semibold text-xs transition-all shadow-xs disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <Store className="w-4 h-4 text-ukorange" />
              <span>Submit Seller Application</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
