'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HostNav } from '@/components/host-nav';
import { createClient } from '@/lib/supabase/client';
import { PROPERTY_TYPES, AMENITIES_LIST } from '@/lib/constants';
import { PlusCircle, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export default function NewPropertyPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [village, setVillage] = useState('Jari');
  const [district, setDistrict] = useState('Kullu');
  const [state, setState] = useState('Himachal Pradesh');
  const [propertyType, setPropertyType] = useState('homestay');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'Free Wi-Fi',
    'Mountain-view room',
    'Breakfast and dinner meal plans'
  ]);

  // First room unit
  const [roomName, setRoomName] = useState('Mountain View Room');
  const [roomDescription, setRoomDescription] = useState('Cozy room overlooking Parvati Valley.');
  const [maxGuests, setMaxGuests] = useState(2);
  const [basePrice, setBasePrice] = useState(1200);

  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const toggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in to register a property.");
      }

      // Generate slug from name
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.floor(Math.random() * 1000);

      // 1. Insert property (Database trigger sets host_id, published=false, moderation_status='pending')
      const { data: propData, error: propErr } = await supabase
        .from('properties')
        .insert({
          name: name.trim(),
          slug,
          description: description.trim(),
          address: address.trim(),
          village: village.trim(),
          district: district.trim(),
          state: state.trim(),
          property_type: propertyType,
          amenities: selectedAmenities,
          photos: [photoUrl.trim()],
          booking_mode: 'request',
          host_id: user.id
        })
        .select('id')
        .single();

      if (propErr) {
        throw propErr;
      }

      // 2. Insert initial room unit
      const { error: roomErr } = await supabase
        .from('room_units')
        .insert({
          property_id: propData.id,
          room_name: roomName.trim(),
          description: roomDescription.trim(),
          max_guests: maxGuests,
          base_price: basePrice,
          active: true
        });

      if (roomErr) {
        console.error('Room creation note:', roomErr);
      }

      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit property application.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-16">
      <HostNav />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-ukorange">Host Application</span>
          <h1 className="font-serif text-3xl font-bold text-forest mt-1">Register a New Homestay</h1>
          <p className="text-sm text-charcoal-muted mt-1">
            Submit your property for moderation. Enjoy 0% commission during your first 12 months with signed terms.
          </p>
        </div>

        {submitted ? (
          <div className="bg-white rounded-3xl p-10 border border-forest/20 shadow-soft text-center space-y-4">
            <div className="w-14 h-14 bg-forest/10 text-forest rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-forest" />
            </div>
            <h2 className="font-serif text-3xl font-bold text-forest">Application Submitted!</h2>
            <p className="text-sm text-charcoal-muted max-w-lg mx-auto leading-relaxed">
              Your homestay <strong>"{name}"</strong> has been saved with status <strong>Pending Review</strong>. Gaurav Negi and our moderation team will review your photos and details before publishing it live on the Uttarkunth Stays marketplace.
            </p>
            <div className="pt-4 flex justify-center gap-4">
              <button
                onClick={() => router.push('/host/properties')}
                className="px-5 py-2.5 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl"
              >
                Go to My Properties
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 border border-forest/15 shadow-soft space-y-8">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Basic Property Details */}
            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-bold text-forest pb-2 border-b border-forest/10">
                1. Property Profile
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-muted mb-1">Property Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Parvati Valley Homestay"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 text-sm bg-ivory-warm border border-forest/20 rounded-xl font-medium focus:ring-2 focus:ring-forest focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-muted mb-1">Property Type</label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full p-2.5 text-sm bg-ivory-warm border border-forest/20 rounded-xl font-medium focus:ring-2 focus:ring-forest focus:outline-none"
                  >
                    {PROPERTY_TYPES.map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-muted mb-1">Description & Mountain Story</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Tell guests about your homestay, the mountain view, home food, and the surrounding village..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 text-sm bg-ivory-warm border border-forest/20 rounded-xl font-medium focus:ring-2 focus:ring-forest focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-muted mb-1">Full Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Near Old Bridge, Village Jari, Kullu District"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2.5 text-sm bg-ivory-warm border border-forest/20 rounded-xl font-medium focus:ring-2 focus:ring-forest focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-muted mb-1">Village</label>
                  <input
                    type="text"
                    required
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full p-2.5 text-sm bg-ivory-warm border border-forest/20 rounded-xl font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal-muted mb-1">District</label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full p-2.5 text-sm bg-ivory-warm border border-forest/20 rounded-xl font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal-muted mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full p-2.5 text-sm bg-ivory-warm border border-forest/20 rounded-xl font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-muted mb-1">Photo Image URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="w-full p-2.5 text-sm bg-ivory-warm border border-forest/20 rounded-xl font-medium focus:outline-none"
                />
              </div>
            </div>

            {/* Room Details */}
            <div className="space-y-4 pt-4 border-t border-forest/10">
              <h2 className="font-serif text-2xl font-bold text-forest pb-2 border-b border-forest/10">
                2. Room Unit Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-muted mb-1">Room Name</label>
                  <input
                    type="text"
                    required
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="w-full p-2.5 text-sm bg-ivory-warm border border-forest/20 rounded-xl font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-muted mb-1">Base Price / Night (INR)</label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    className="w-full p-2.5 text-sm bg-ivory-warm border border-forest/20 rounded-xl font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-muted mb-1">Max Guests</label>
                  <select
                    value={maxGuests}
                    onChange={(e) => setMaxGuests(Number(e.target.value))}
                    className="w-full p-2.5 text-sm bg-ivory-warm border border-forest/20 rounded-xl font-medium focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10].map(n => (
                      <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal-muted mb-1">Room Description</label>
                  <input
                    type="text"
                    value={roomDescription}
                    onChange={(e) => setRoomDescription(e.target.value)}
                    className="w-full p-2.5 text-sm bg-ivory-warm border border-forest/20 rounded-xl font-medium focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Amenities Checkboxes */}
            <div className="space-y-3 pt-4 border-t border-forest/10">
              <h2 className="font-serif text-2xl font-bold text-forest">
                3. Amenities
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AMENITIES_LIST.map(amenity => (
                  <label
                    key={amenity}
                    className="flex items-center gap-2 p-2.5 bg-ivory-warm rounded-xl border border-forest/15 text-xs font-medium cursor-pointer hover:bg-forest/5"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAmenities.includes(amenity)}
                      onChange={() => toggleAmenity(amenity)}
                      className="rounded text-forest focus:ring-forest w-4 h-4"
                    />
                    <span>{amenity}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-forest hover:bg-forest-hover disabled:bg-forest/50 text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Submitting Application...' : 'Submit Listing For Review'}
              <Sparkles className="w-4 h-4 text-ukorange" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
