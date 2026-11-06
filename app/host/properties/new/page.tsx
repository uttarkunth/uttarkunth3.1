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
  Plus,
  Trash2,
  Phone,
  MessageSquare,
  Mail,
  Clock,
  Camera,
  Layers,
  ArrowRight,
  Compass,
} from 'lucide-react';
import { PhotoUploader } from '@/components/host/photo-uploader';
import { MapLocationPicker } from '@/components/host/map-location-picker';

interface RoomFormState {
  name: string;
  room_type: string;
  base_price_inr: number;
  max_occupancy: number;
  has_attached_washroom: boolean;
  view_type: string;
  bed_type: string;
  features: string[];
  photos: string[];
  washroom_photos: string[];
}

const PROPERTY_TYPES = [
  { value: 'homestay', label: 'Village Homestay (Authentic & Family-run)' },
  { value: 'cottage', label: 'Himalayan Cottage' },
  { value: 'villa', label: 'Mountain Villa' },
  { value: 'guesthouse', label: 'Traditional Guesthouse' },
  { value: 'hotel', label: 'Eco-lodge / Small Hotel' },
  { value: 'resort', label: 'Wilderness Retreat' },
];

const AMENITY_OPTIONS = [
  'Fresh Mountain Water',
  'Home-Cooked Himalayan Meals',
  'Traditional Wood Fireplace (Bukhari)',
  'Organic Orchard & Garden',
  'Guided Forest Trails & Treks',
  'High-Speed Wi-Fi',
  'Hot Water (Geyser/Hamam)',
  'Private Balcony with Valley View',
  'Free Safe Parking',
  'Bonfire Facility',
  'Pet Friendly',
  'Local Village Cultural Tour',
  '24x7 Power Backup',
  'Herbal Tea & Local Apple Cider',
];

const ROOM_FEATURE_TAGS = [
  'Attached Private Washroom',
  'Geyser / Running Hot Water',
  'Balcony with Peak View',
  'Valley View',
  'Garden View',
  'Heater / Bukhari',
  'Electric Kettle & Herbal Teas',
  'Workstation / Desk',
  'Wooden Paneling & Pine Floors',
  'Large Bay Window',
  'Extra Mattress Available',
  'Sound of Rushing River',
];

export default function NewPropertyOnboardingPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Basic Property Details
  const [name, setName] = useState('');
  const [propertyType, setPropertyType] = useState('homestay');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('Uttarkashi');
  const [state, setState] = useState('Uttarakhand');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [amenities, setAmenities] = useState<string[]>([
    'Fresh Mountain Water',
    'Home-Cooked Himalayan Meals',
    'Hot Water (Geyser/Hamam)',
  ]);
  const [coverPhoto, setCoverPhoto] = useState('');
  const [propertyPhotos, setPropertyPhotos] = useState<string[]>([]);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // Step 2: Contact & Notification Preferences
  const [contactPhone, setContactPhone] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [notifyOnWhatsapp, setNotifyOnWhatsapp] = useState(true);
  const [notifyOnEmail, setNotifyOnEmail] = useState(true);

  // Step 3: Room Inventory
  const [rooms, setRooms] = useState<RoomFormState[]>([
    {
      name: 'Deluxe Himalayan Room (Room 1)',
      room_type: 'private_room',
      base_price_inr: 1800,
      max_occupancy: 2,
      has_attached_washroom: true,
      view_type: 'Snow Peak Mountain View',
      bed_type: 'King Bed',
      features: ['Attached Private Washroom', 'Geyser / Running Hot Water', 'Balcony with Peak View'],
      photos: [],
      washroom_photos: [],
    },
  ]);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedProperty, setSubmittedProperty] = useState<{
    id: string;
    slug: string;
    name: string;
  } | null>(null);

  const toggleAmenity = (item: string) => {
    setAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const handleAddRoom = () => {
    const nextNum = rooms.length + 1;
    setRooms((prev) => [
      ...prev,
      {
        name: `Cozy Mountain Room (Room ${nextNum})`,
        room_type: 'private_room',
        base_price_inr: 1500,
        max_occupancy: 2,
        has_attached_washroom: true,
        view_type: 'Valley View',
        bed_type: 'Double Bed',
        features: ['Attached Private Washroom', 'Geyser / Running Hot Water'],
        photos: [],
        washroom_photos: [],
      },
    ]);
  };

  const handleRemoveRoom = (index: number) => {
    if (rooms.length <= 1) {
      alert('Your homestay must have at least one room.');
      return;
    }
    setRooms((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRoom = (index: number, patch: Partial<RoomFormState>) => {
    setRooms((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...patch } : r))
    );
  };

  const toggleRoomFeature = (index: number, feature: string) => {
    setRooms((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r;
        const exists = r.features.includes(feature);
        const newFeatures = exists
          ? r.features.filter((f) => f !== feature)
          : [...r.features, feature];
        return { ...r, features: newFeatures };
      })
    );
  };

  const handleSubmitListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (!name.trim()) throw new Error('Please provide the homestay name.');
      if (!village.trim()) throw new Error('Please specify the village name.');
      if (description.trim().length < 20) {
        throw new Error('Please write at least 20 characters describing your homestay.');
      }
      if (!contactPhone.trim()) {
        throw new Error('Please provide a primary contact phone number.');
      }
      if (rooms.length === 0) {
        throw new Error('Please add at least 1 room to your homestay.');
      }

      for (let i = 0; i < rooms.length; i++) {
        const r = rooms[i];
        if (!r.name.trim()) throw new Error(`Room #${i + 1} is missing a name.`);
        if (!r.base_price_inr || r.base_price_inr <= 0) {
          throw new Error(`Room "${r.name}" must have a nightly rate greater than ₹0.`);
        }
      }

      const allPhotos = [coverPhoto, ...propertyPhotos].filter(Boolean);

      const payload = {
        name: name.trim(),
        property_type: propertyType,
        village: village.trim(),
        district: district.trim(),
        state: state.trim(),
        address: address.trim() || undefined,
        description: description.trim(),
        amenities,
        photos: allPhotos,
        cover_photo: coverPhoto || (allPhotos.length > 0 ? allPhotos[0] : null),
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        contact_phone: contactPhone.trim(),
        contact_whatsapp: (contactWhatsapp || contactPhone).trim(),
        contact_email: contactEmail.trim() || undefined,
        rooms: rooms.map((r) => ({
          name: r.name.trim(),
          room_type: r.room_type,
          base_price_inr: Number(r.base_price_inr),
          max_occupancy: Number(r.max_occupancy),
          has_attached_washroom: Boolean(r.has_attached_washroom),
          view_type: r.view_type.trim() || undefined,
          bed_type: r.bed_type.trim() || undefined,
          features: r.features,
          photos: r.photos || [],
          washroom_photos: r.washroom_photos || [],
          active: true,
        })),
      };

      const res = await fetch('/api/host/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to submit property application.');
      }

      setSubmittedProperty({
        id: data.property_id,
        slug: data.slug,
        name: name.trim(),
      });
      setStep(4);
    } catch (err: any) {
      setError(err.message || 'Something went wrong while submitting.');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 4: Submission Confirmation Screen
  if (step === 4 && submittedProperty) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-forest/15 shadow-soft text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Listing Submitted for Review
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif text-charcoal">
              &quot;{submittedProperty.name}&quot; is Under Curation Review
            </h1>
            <p className="text-sm text-stone-600 max-w-xl mx-auto leading-relaxed">
              Thank you for listing with Uttarkunth! Your homestay has been securely submitted to our
              curation desk. To preserve authentic Himalayan hospitality standards, our founder and
              assigned field team will review your photos, room features, and safety guidelines.
            </p>
          </div>

          <div className="bg-ivory-warm p-6 rounded-2xl border border-forest/10 text-left space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-800" />
              What Happens Next?
            </h4>
            <ul className="text-xs text-stone-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-emerald-800 font-bold">•</span>
                <span>
                  <strong>Review Notification:</strong> You will receive real-time updates via WhatsApp &amp; Email
                  when our team finishes reviewing your listing.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-800 font-bold">•</span>
                <span>
                  <strong>Direct Feedback:</strong> If anything needs refinement (like higher-resolution photos or
                  room clarification), our staff will send a note directly from the portal.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-800 font-bold">•</span>
                <span>
                  <strong>Going Live:</strong> Once approved, your property card will appear on the live Uttarkunth Stays
                  directory, allowing travelers to view your room calendar and send booking requests.
                </span>
              </li>
            </ul>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/account/stays/host"
              className="w-full sm:w-auto px-6 py-3 bg-forest hover:bg-forest/90 text-white font-medium rounded-xl text-sm transition shadow-soft flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Go to Host Dashboard
            </Link>
            <Link
              href={`/preview?slug=${submittedProperty.slug}`}
              className="w-full sm:w-auto px-6 py-3 bg-stone-100 hover:bg-stone-200 text-charcoal font-medium rounded-xl text-sm transition flex items-center justify-center gap-2"
            >
              <span>Preview Draft Card</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Top Header */}
      <div className="mb-8">
        <Link
          href="/account/stays/host"
          className="inline-flex items-center gap-2 text-xs text-stone-500 hover:text-forest transition mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Host Portal</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif text-charcoal">
              List Your Himalayan Homestay
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Add your rooms, high-definition photos, custom nightly rates, and notification preferences.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-medium shrink-0">
            <ShieldCheck className="w-4 h-4" />
            <span>Curated Himalayan Network</span>
          </div>
        </div>

        {/* Stepper Tabs */}
        <div className="grid grid-cols-3 gap-2 mt-6">
          <button suppressHydrationWarning
            type="button"
            onClick={() => setStep(1)}
            className={`py-3 px-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
              step === 1
                ? 'bg-forest text-white border-forest shadow-soft'
                : 'bg-white text-stone-600 border-forest/15 hover:bg-ivory-warm'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                step === 1 ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-700'
              }`}
            >
              1
            </span>
            <div className="truncate">
              <p className="text-xs font-bold leading-tight truncate">Property Details</p>
              <p className="text-[10px] opacity-80 leading-tight">Location &amp; Photos</p>
            </div>
          </button>

          <button suppressHydrationWarning
            type="button"
            onClick={() => setStep(2)}
            className={`py-3 px-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
              step === 2
                ? 'bg-forest text-white border-forest shadow-soft'
                : 'bg-white text-stone-600 border-forest/15 hover:bg-ivory-warm'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                step === 2 ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-700'
              }`}
            >
              2
            </span>
            <div className="truncate">
              <p className="text-xs font-bold leading-tight truncate">Contact &amp; Alerts</p>
              <p className="text-[10px] opacity-80 leading-tight">WhatsApp &amp; Email</p>
            </div>
          </button>

          <button suppressHydrationWarning
            type="button"
            onClick={() => setStep(3)}
            className={`py-3 px-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
              step === 3
                ? 'bg-forest text-white border-forest shadow-soft'
                : 'bg-white text-stone-600 border-forest/15 hover:bg-ivory-warm'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                step === 3 ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-700'
              }`}
            >
              3
            </span>
            <div className="truncate">
              <p className="text-xs font-bold leading-tight truncate">Room Inventory</p>
              <p className="text-[10px] opacity-80 leading-tight">{rooms.length} Room(s) Configured</p>
            </div>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmitListing} className="space-y-6">
        {/* STEP 1: Property Info & Photos */}
        {step === 1 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
            <div>
              <h3 className="text-lg font-serif text-charcoal">1. Property Essentials</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Tell travelers where your homestay is situated and what makes it special.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Homestay Name *
                </label>
                <input suppressHydrationWarning
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Yash Home Stay, Wonderway Retreat, Pine Haven"
                  required
                  className="w-full p-3 text-xs sm:text-sm bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Property Category
                </label>
                <select suppressHydrationWarning
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full p-3 text-xs sm:text-sm bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none focus:border-forest"
                >
                  {PROPERTY_TYPES.map((pt) => (
                    <option key={pt.value} value={pt.value}>
                      {pt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Village / Settlement *
                </label>
                <input suppressHydrationWarning
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder="e.g. Jari, Sankri, Harsil, Chopta"
                  required
                  className="w-full p-3 text-xs sm:text-sm bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  District *
                </label>
                <input suppressHydrationWarning
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Uttarkashi, Kullu, Chamoli, Rudraprayag"
                  required
                  className="w-full p-3 text-xs sm:text-sm bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  State
                </label>
                <input suppressHydrationWarning
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Uttarakhand"
                  className="w-full p-3 text-xs sm:text-sm bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none focus:border-forest"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Exact Address &amp; Landmarks
                </label>
                <input suppressHydrationWarning
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Near Old Temple, Above Apple Orchard, Main Village Path"
                  className="w-full p-3 text-xs sm:text-sm bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none focus:border-forest"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Authentic Property Description * (min 20 characters)
                </label>
                <textarea suppressHydrationWarning
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your family homestay, mountain view, home-cooked food, nearby trails, and what guests will experience..."
                  required
                  className="w-full p-3 text-xs sm:text-sm bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none focus:border-forest leading-relaxed"
                />
              </div>
            </div>

            {/* Interactive Map Pinning */}
            <div className="pt-2">
              <MapLocationPicker
                latitude={latitude}
                longitude={longitude}
                onChange={(coordsOrLat: any, maybeLng?: any) => {
                  const finalLat = typeof coordsOrLat === 'object' && coordsOrLat !== null ? coordsOrLat.latitude : coordsOrLat;
                  const finalLng = typeof coordsOrLat === 'object' && coordsOrLat !== null ? coordsOrLat.longitude : maybeLng;
                  if (typeof finalLat === 'number' && !isNaN(finalLat)) setLatitude(finalLat);
                  if (typeof finalLng === 'number' && !isNaN(finalLng)) setLongitude(finalLng);
                }}
                addressHint={address || village}
              />
            </div>

            {/* Amenities Selector */}
            <div className="pt-2 space-y-2">
              <label className="block text-xs font-semibold text-charcoal">
                Homestay Amenities &amp; Features
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AMENITY_OPTIONS.map((item) => {
                  const active = amenities.includes(item);
                  return (
                    <button suppressHydrationWarning
                      type="button"
                      key={item}
                      onClick={() => toggleAmenity(item)}
                      className={`text-left p-2.5 rounded-xl border text-xs transition flex items-center gap-2 ${
                        active
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-medium'
                          : 'bg-ivory-warm border-forest/10 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                          active ? 'bg-emerald-700 border-emerald-700 text-white' : 'border-stone-400'
                        }`}
                      >
                        {active && '✓'}
                      </span>
                      <span className="truncate">{item}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Direct Gallery Photo Uploaders with Photography Guidelines */}
            <div className="pt-4 border-t border-forest/10 space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-charcoal flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-800" />
                  Homestay Exterior &amp; Surroundings Photos
                </h4>
                <p className="text-xs text-stone-500 mt-0.5">
                  Upload directly from your device gallery or camera. Follow landscape orientation and 4000px resolution guidelines.
                </p>
              </div>

              {/* Cover Photo */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                <PhotoUploader
                  label="Primary Cover Photo (The First Image Guests See)"
                  description="Landscape hero shot of your homestay facade against the Himalayan peaks."
                  photos={coverPhoto ? [coverPhoto] : []}
                  maxPhotos={1}
                  onChange={(urls) => setCoverPhoto(urls[0] || '')}
                />
              </div>

              {/* General Property Gallery */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                <PhotoUploader
                  label="Common Areas, Dining Hall &amp; Surrounding Valley Photos"
                  description="Upload up to 8 wide landscape shots of dining areas, outdoor sitting, orchard, garden, and panoramic views."
                  photos={propertyPhotos}
                  maxPhotos={8}
                  onChange={setPropertyPhotos}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button suppressHydrationWarning
                type="button"
                onClick={() => {
                  if (!name.trim()) {
                    alert('Please enter a property name.');
                    return;
                  }
                  if (!village.trim()) {
                    alert('Please enter your village.');
                    return;
                  }
                  setStep(2);
                }}
                className="px-6 py-3 bg-forest hover:bg-forest/90 text-white font-medium rounded-xl text-xs sm:text-sm transition flex items-center gap-2 shadow-soft"
              >
                <span>Continue to Step 2: Contact &amp; Notifications</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Contact & Notifications */}
        {step === 2 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
            <div>
              <h3 className="text-lg font-serif text-charcoal">2. Contact &amp; Instant Notification Preferences</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Whenever a guest requests a booking, you will be notified instantly so you can accept or decline.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-800" />
                  Primary Phone Number *
                </label>
                <input suppressHydrationWarning
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="e.g. +91 98160 12345"
                  required
                  className="w-full p-3 text-xs sm:text-sm bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-800" />
                  WhatsApp Number (For Instant Booking Alerts) *
                </label>
                <input suppressHydrationWarning
                  type="tel"
                  value={contactWhatsapp}
                  onChange={(e) => setContactWhatsapp(e.target.value)}
                  placeholder="e.g. +91 98160 12345 (Leave blank if same as phone)"
                  className="w-full p-3 text-xs sm:text-sm bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none focus:border-forest"
                />
                <p className="text-[10px] text-stone-500 mt-1">
                  We send instant booking requests and review updates directly to this WhatsApp.
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-charcoal mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-800" />
                  Email Address (For Booking Vouchers &amp; Receipts)
                </label>
                <input suppressHydrationWarning
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="e.g. host@uttarkunth.com"
                  className="w-full p-3 text-xs sm:text-sm bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none focus:border-forest"
                />
              </div>
            </div>

            {/* Notification checkboxes */}
            <div className="bg-ivory-warm p-4 rounded-2xl border border-forest/10 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal">
                Notification Channels
              </h4>
              <label className="flex items-center gap-3 cursor-pointer text-xs text-stone-700">
                <input suppressHydrationWarning
                  type="checkbox"
                  checked={notifyOnWhatsapp}
                  onChange={(e) => setNotifyOnWhatsapp(e.target.checked)}
                  className="w-4 h-4 text-emerald-700 rounded border-stone-300 focus:ring-emerald-600"
                />
                <span>Send WhatsApp alerts when guests request a booking or cancel.</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-xs text-stone-700">
                <input suppressHydrationWarning
                  type="checkbox"
                  checked={notifyOnEmail}
                  onChange={(e) => setNotifyOnEmail(e.target.checked)}
                  className="w-4 h-4 text-emerald-700 rounded border-stone-300 focus:ring-emerald-600"
                />
                <span>Send email alerts with full guest details and stay dates.</span>
              </label>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button suppressHydrationWarning
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium rounded-xl text-xs sm:text-sm transition"
              >
                Back to Step 1
              </button>

              <button suppressHydrationWarning
                type="button"
                onClick={() => {
                  if (!contactPhone.trim()) {
                    alert('Please enter your primary contact number.');
                    return;
                  }
                  setStep(3);
                }}
                className="px-6 py-3 bg-forest hover:bg-forest/90 text-white font-medium rounded-xl text-xs sm:text-sm transition flex items-center gap-2 shadow-soft"
              >
                <span>Continue to Step 3: Room Inventory</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Room Inventory & Direct Photos */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-lg font-serif text-charcoal">3. Room Inventory &amp; Washroom Details</h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Configure each room, set individual nightly rates, attached washroom status, view, and upload photos.
                  </p>
                </div>

                <button suppressHydrationWarning
                  type="button"
                  onClick={handleAddRoom}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold rounded-xl transition shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Another Room</span>
                </button>
              </div>
            </div>

            {/* Room Cards */}
            <div className="space-y-6">
              {rooms.map((room, index) => (
                <div
                  key={index}
                  className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6 relative"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 bg-forest text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <h4 className="text-sm sm:text-base font-semibold text-charcoal">
                        {room.name || `Room #${index + 1}`}
                      </h4>
                    </div>

                    {rooms.length > 1 && (
                      <button suppressHydrationWarning
                        type="button"
                        onClick={() => handleRemoveRoom(index)}
                        className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Room</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-charcoal mb-1">
                        Room Name / Title *
                      </label>
                      <input suppressHydrationWarning
                        type="text"
                        value={room.name}
                        onChange={(e) => updateRoom(index, { name: e.target.value })}
                        placeholder="e.g. Deluxe Pine Room with Balcony"
                        required
                        className="w-full p-2.5 text-xs sm:text-sm bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none focus:border-forest"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-charcoal mb-1">
                        Nightly Rate (₹ INR) *
                      </label>
                      <input suppressHydrationWarning
                        type="number"
                        min="100"
                        step="50"
                        value={room.base_price_inr}
                        onChange={(e) =>
                          updateRoom(index, { base_price_inr: parseFloat(e.target.value) || 0 })
                        }
                        placeholder="1800"
                        required
                        className="w-full p-2.5 text-xs sm:text-sm bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none focus:border-forest font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-charcoal mb-1">
                        Bed Type
                      </label>
                      <input suppressHydrationWarning
                        type="text"
                        value={room.bed_type}
                        onChange={(e) => updateRoom(index, { bed_type: e.target.value })}
                        placeholder="e.g. King Bed, Double Bed, 2 Single Beds"
                        className="w-full p-2.5 text-xs sm:text-sm bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none focus:border-forest"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-charcoal mb-1">
                        Max Occupancy
                      </label>
                      <select suppressHydrationWarning
                        value={room.max_occupancy}
                        onChange={(e) =>
                          updateRoom(index, { max_occupancy: parseInt(e.target.value) || 2 })
                        }
                        className="w-full p-2.5 text-xs sm:text-sm bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none focus:border-forest"
                      >
                        <option value={1}>1 Guest</option>
                        <option value={2}>2 Guests</option>
                        <option value={3}>3 Guests</option>
                        <option value={4}>4 Guests</option>
                        <option value={5}>5 Guests (Family Suite)</option>
                        <option value={6}>6+ Guests (Dorm)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-charcoal mb-1">
                        Scenic View Type
                      </label>
                      <input suppressHydrationWarning
                        type="text"
                        value={room.view_type}
                        onChange={(e) => updateRoom(index, { view_type: e.target.value })}
                        placeholder="e.g. Snow Peak View, Pine Forest View"
                        className="w-full p-2.5 text-xs sm:text-sm bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none focus:border-forest"
                      />
                    </div>
                  </div>

                  {/* Attached Washroom Toggle */}
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-semibold text-emerald-900">
                        Attached Private Washroom
                      </h5>
                      <p className="text-[11px] text-emerald-700">
                        Does this room have its own attached bathroom, or is it shared?
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input suppressHydrationWarning
                        type="checkbox"
                        checked={room.has_attached_washroom}
                        onChange={(e) =>
                          updateRoom(index, { has_attached_washroom: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-700"></div>
                      <span className="ml-2 text-xs font-bold text-emerald-900">
                        {room.has_attached_washroom ? 'Yes (Private Attached)' : 'Shared Bathroom'}
                      </span>
                    </label>
                  </div>

                  {/* Room Feature Tags */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-charcoal">
                      Room Features &amp; In-Room Amenities
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {ROOM_FEATURE_TAGS.map((tag) => {
                        const active = room.features.includes(tag);
                        return (
                          <button suppressHydrationWarning
                            type="button"
                            key={tag}
                            onClick={() => toggleRoomFeature(index, tag)}
                            className={`text-xs px-2.5 py-1 rounded-full border transition ${
                              active
                                ? 'bg-forest text-white border-forest font-medium'
                                : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                            }`}
                          >
                            {active ? '✓ ' : '+ '}
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Room Photos & Washroom Photos */}
                  <div className="pt-4 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Room Interior Photos */}
                    <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                      <PhotoUploader
                        label={`Room ${index + 1} Interior Photos`}
                        description="Bed, windows, balcony view, and interior space. Landscape 4000px format."
                        photos={room.photos}
                        maxPhotos={5}
                        onChange={(newPhotos) => updateRoom(index, { photos: newPhotos })}
                      />
                    </div>

                    {/* Washroom Photos */}
                    <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                      <PhotoUploader
                        label={`Room ${index + 1} Washroom & Hygiene Photos`}
                        description="Show clean toilet, geyser/hot water setup, mirror, and tiles to build guest trust."
                        photos={room.washroom_photos}
                        maxPhotos={3}
                        onChange={(newWashroomPhotos) =>
                          updateRoom(index, { washroom_photos: newWashroomPhotos })
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
              <button suppressHydrationWarning
                type="button"
                onClick={() => setStep(2)}
                className="w-full sm:w-auto px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium rounded-xl text-xs sm:text-sm transition"
              >
                Back to Step 2
              </button>

              <div className="w-full sm:w-auto flex items-center gap-3">
                <button suppressHydrationWarning
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-8 py-3.5 bg-forest hover:bg-forest/90 text-white font-semibold rounded-xl text-sm transition shadow-soft flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {submitting ? 'Submitting Application...' : 'Submit Listing for Curation Review'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
