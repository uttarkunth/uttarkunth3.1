'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle, Save, Loader2, User, Phone, MapPin, Home } from 'lucide-react';

interface ProfileFormProps {
  initialFullName: string;
  initialPreferredName?: string;
  initialPhone: string;
  initialAddress?: string;
  initialLocation: string;
  initialBio: string;
  initialInterests: string[];
}

const MOUNTAIN_INTEREST_OPTIONS = [
  'Homestays & Village Immersion',
  'Trekking & Alpine Routes',
  'Organic Farming & Harvests',
  'Himalayan Wool & Handloom',
  'Mountain Documentary Films',
  'Karmayog Environmental Action',
];

export function ProfileForm({
  initialFullName,
  initialPreferredName = '',
  initialPhone,
  initialAddress = '',
  initialLocation,
  initialBio,
  initialInterests,
}: ProfileFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialFullName);
  const [preferredName, setPreferredName] = useState(initialPreferredName || initialFullName);
  const [phone, setPhone] = useState(initialPhone);
  const [address, setAddress] = useState(initialAddress);
  const [location, setLocation] = useState(initialLocation);
  const [bio, setBio] = useState(initialBio);
  const [interests, setInterests] = useState<string[]>(initialInterests || []);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const toggleInterest = (tag: string) => {
    if (interests.includes(tag)) {
      setInterests(interests.filter((t) => t !== tag));
    } else {
      setInterests([...interests, tag]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          preferred_name: preferredName.trim() || fullName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          location: location.trim(),
          bio: bio.trim(),
          mountain_interests: interests,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to update profile.');
      }

      setMessage({ type: 'success', text: 'Profile details saved to your Uttarkunth Member record.' });
      router.refresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-xl flex items-start gap-2.5 text-xs ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-charcoal-muted mb-1.5">
            Full Legal / Display Name *
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-charcoal-muted absolute left-3 top-3" />
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-ivory-warm border border-forest/20 rounded-xl focus:ring-2 focus:ring-forest focus:outline-none"
              placeholder="Your full name"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-charcoal-muted mb-1.5">
            Preferred Name
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-charcoal-muted absolute left-3 top-3" />
            <input
              type="text"
              value={preferredName}
              onChange={(e) => setPreferredName(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-ivory-warm border border-forest/20 rounded-xl focus:ring-2 focus:ring-forest focus:outline-none"
              placeholder="Optional preferred name"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-charcoal-muted mb-1.5">
            Phone / Contact Number (Private)
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-charcoal-muted absolute left-3 top-3" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-ivory-warm border border-forest/20 rounded-xl focus:ring-2 focus:ring-forest focus:outline-none"
              placeholder="+91 98765 43210"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-charcoal-muted mb-1.5">
            Home Base / Region
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-charcoal-muted absolute left-3 top-3" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-ivory-warm border border-forest/20 rounded-xl focus:ring-2 focus:ring-forest focus:outline-none"
              placeholder="e.g. Kullu, Himachal Pradesh or New Delhi"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-charcoal-muted mb-1.5">
          Residential / Delivery Address (Private — never exposed publicly)
        </label>
        <div className="relative">
          <Home className="w-4 h-4 text-charcoal-muted absolute left-3 top-3" />
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-ivory-warm border border-forest/20 rounded-xl focus:ring-2 focus:ring-forest focus:outline-none"
            placeholder="Street, Village/Town, District, State, PIN"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-charcoal-muted mb-1.5">
          About You / Himalayan Connection
        </label>
        <textarea
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full p-3 text-xs bg-ivory-warm border border-forest/20 rounded-xl focus:ring-2 focus:ring-forest focus:outline-none"
          placeholder="Tell local hosts and creators a little bit about yourself and your relationship with mountain communities..."
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-charcoal-muted mb-2">
          Mountain Interests
        </label>
        <div className="flex flex-wrap gap-2">
          {MOUNTAIN_INTEREST_OPTIONS.map((tag) => {
            const isSelected = interests.includes(tag);
            return (
              <button
                type="button"
                key={tag}
                onClick={() => toggleInterest(tag)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                  isSelected
                    ? 'bg-forest text-white border-forest font-semibold'
                    : 'bg-ivory-warm text-charcoal border-forest/15 hover:border-forest/40'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-forest hover:bg-forest-hover disabled:bg-forest/50 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
        </button>
      </div>
    </form>
  );
}