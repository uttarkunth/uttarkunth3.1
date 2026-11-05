'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Home,
  MapPin,
  BedDouble,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

const AMENITY_OPTIONS = [
  'Mountain View Balcony',
  'Home-Cooked Himachali Meals',
  'Wood-Fired Bukhari / Heater',
  'High-Speed Wi-Fi',
  'Hot Water Geyser',
  'Orchard / Garden Sit-Out',
  'On-Site Parking',
  'Guided Village Walks',
];

export default function HostNewPropertyApplicationPage() {
  const [name, setName] = useState('');
  const [propertyType, setPropertyType] = useState('homestay');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('Kullu');
  const [state, setState] = useState('Himachal Pradesh');
  const [address, setAddress] = useState('');
  const [hostPhone, setHostPhone] = useState('');
  const [description, setDescription] = useState('');
  const [amenities, setAmenities] = useState<string[]>([
    'Mountain View Balcony',
    'Home-Cooked Himachali Meals',
    'Hot Water Geyser',
  ]);

  const [initialRoomName, setInitialRoomName] = useState('Deodar Valley Room');
  const [initialRoomGuests, setInitialRoomGuests] = useState(2);
  const [initialRoomPrice, setInitialRoomPrice] = useState(2200);
  const [initialRoomDescription, setInitialRoomDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedProperty, setSubmittedProperty] = useState<{
    id: string;
    name: string;
    village: string;
    moderation_status: string;
  } | null>(null);

  const toggleAmenity = (item: string) => {
    setAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/host/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          property_type: propertyType,
          village,
          district,
          state,
          address,
          host_phone: hostPhone,
          description,
          amenities,
          initial_room_name: initialRoomName,
          initial_room_guests: Number(initialRoomGuests),
          initial_room_price: Number(initialRoomPrice),
          initial_room_description: initialRoomDescription,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || 'Could not submit homestay application.');
        setSubmitting(false);
        return;
      }

      setSubmittedProperty(data.property);
    } catch (err: any) {
      setError(err.message || 'Network error while submitting application.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedProperty) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 sm:px-6">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-forest/20 shadow-soft text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-ukorange block">
            Application Received · Pending Curation Review
          </span>
          <h1 className="font-serif text-3xl font-bold text-forest">
            {submittedProperty.name} Submitted for Review
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
            Your homestay in <strong>{submittedProperty.village}</strong> has been registered in your Host Workspace with status <code className="font-mono text-forest">pending</code>. Our Stays Curation team will verify your property details and contact you before publishing it live.
          </p>
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/account/stays/host"
              className="px-6 py-3 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-full transition-colors"
            >
              Open Host Workspace
            </Link>
            <Link
              href="/stays/partner"
              className="px-6 py-3 bg-ivory-warm border border-forest/20 text-forest text-xs font-semibold rounded-full hover:bg-forest/5 transition-colors"
            >
              Back to Partner Guide
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      <div>
        <Link
          href="/stays/partner"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-muted hover:text-forest mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Host Partnership Program</span>
        </Link>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-ukorange" />
          <span className="text-xs font-bold uppercase tracking-widest text-ukorange">
            Uttarkunth Stays Curation
          </span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-forest mt-1">
          Apply to List Your Mountain Homestay
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-muted mt-1 max-w-2xl leading-relaxed">
          Submit your property details for verification. All stays on Uttarkunth operate on request-based host autonomy and 100% direct guest payment at check-in.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Property Identity & Location */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-5">
          <div className="flex items-center gap-2.5 border-b border-forest/10 pb-3">
            <Home className="w-4 h-4 text-ukorange" />
            <h2 className="font-serif text-xl font-bold text-forest">
              1. Property Identity &amp; Himalayan Location
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Homestay / Property Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kath-Kuni Orchard House"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 bg-ivory-warm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Property Category *
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 bg-ivory-warm"
              >
                <option value="homestay">Traditional Family Homestay</option>
                <option value="retreat">Mountain Retreat / Cottage</option>
                <option value="farmstay">Orchard / Organic Farmstay</option>
                <option value="eco_lodge">Vernacular Eco-Lodge</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Village / Hamlet *
              </label>
              <input
                type="text"
                required
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder="e.g. Jari, Kalga, Shoja, Sarmoli"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 bg-ivory-warm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                District *
              </label>
              <input
                type="text"
                required
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Kullu, Shimla, Pithoragarh"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 bg-ivory-warm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                State / UT *
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 bg-ivory-warm"
              >
                <option value="Himachal Pradesh">Himachal Pradesh</option>
                <option value="Uttarakhand">Uttarakhand</option>
                <option value="Jammu and Kashmir">Jammu &amp; Kashmir</option>
                <option value="Ladakh">Ladakh</option>
                <option value="Sikkim">Sikkim</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Direct Host Phone / WhatsApp *
              </label>
              <input
                type="tel"
                required
                value={hostPhone}
                onChange={(e) => setHostPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 bg-ivory-warm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Landmark / Trail Directions
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Road access, walking trail distance, nearest bus stop..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 bg-ivory-warm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Story of Your Home &amp; Hosting Philosophy (Min 20 chars) *
              </label>
              <textarea
                rows={4}
                required
                minLength={20}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your architecture, family hospitality, local meals, and surrounding valley..."
                className="w-full p-3.5 text-xs rounded-xl border border-forest/20 bg-ivory-warm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-2">
              Available Amenities &amp; Experiences
            </label>
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map((item) => {
                const active = amenities.includes(item);
                return (
                  <button
                    type="button"
                    key={item}
                    onClick={() => toggleAmenity(item)}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                      active
                        ? 'bg-forest text-white border-forest font-semibold'
                        : 'bg-ivory-warm text-charcoal border-forest/15'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section 2: Initial Room Configuration */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-5">
          <div className="flex items-center gap-2.5 border-b border-forest/10 pb-3">
            <BedDouble className="w-4 h-4 text-ukorange" />
            <h2 className="font-serif text-xl font-bold text-forest">
              2. Initial Room Unit Configuration
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Room Title *
              </label>
              <input
                type="text"
                required
                value={initialRoomName}
                onChange={(e) => setInitialRoomName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 bg-ivory-warm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Max Guests per Room *
              </label>
              <input
                type="number"
                min={1}
                max={16}
                required
                value={initialRoomGuests}
                onChange={(e) => setInitialRoomGuests(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 bg-ivory-warm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Nightly Tariff (INR) *
              </label>
              <input
                type="number"
                min={500}
                step={100}
                required
                value={initialRoomPrice}
                onChange={(e) => setInitialRoomPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 bg-ivory-warm"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Room Notes (Bedding, Private Bath, View)
              </label>
              <input
                type="text"
                value={initialRoomDescription}
                onChange={(e) => setInitialRoomDescription(e.target.value)}
                placeholder="Queen timber bed, attached modern bath with solar/geyser hot water..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 bg-ivory-warm"
              />
            </div>
          </div>
        </section>

        <div className="bg-ivory-warm rounded-3xl p-6 border border-forest/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 text-xs text-charcoal-muted">
            <ShieldCheck className="w-5 h-5 text-forest shrink-0 mt-0.5" />
            <span>
              Your listing will be saved as <strong>Pending Review</strong>. It will only appear on public destination pages after verification by an authorised Uttarkunth Property Reviewer.
            </span>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-7 py-3.5 bg-ukorange hover:bg-ukorange-deep disabled:opacity-50 text-white text-xs font-semibold rounded-full shadow-lifted shrink-0 transition-all"
          >
            {submitting ? 'Submitting Application...' : 'Submit Homestay Application'}
          </button>
        </div>
      </form>
    </div>
  );
}