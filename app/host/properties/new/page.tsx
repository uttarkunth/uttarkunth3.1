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
  ExternalLink,
} from 'lucide-react';
import { PhotoUploader } from '@/components/host/photo-uploader';
import { validateGoogleMapsUrl } from '@/lib/validations';

const AMENITY_OPTIONS = [
  'Mountain View Balcony',
  'Home-Cooked Himalayan Meals',
  'Wood-Fired Bukhari / Room Heater',
  'High-Speed Wi-Fi',
  '24x7 Hot Water Geyser',
  'Apple Orchard / Garden Sit-Out',
  'On-Site Safe Parking',
  'Guided Village & Forest Treks',
  'Evening Bonfire Facility',
  'Power Backup / Inverter',
  'Workstation Setup (Desk & Chair)',
  'Pet Friendly',
  'Traditional Pahadi Kitchen Access',
  'Stargazing Rooftop Terrace',
];

const VIEW_TYPE_OPTIONS = [
  { value: 'mountain', label: 'Snow-Capped Mountain View' },
  { value: 'valley', label: 'Lush Pine Valley View' },
  { value: 'river', label: 'River / Stream View' },
  { value: 'garden', label: 'Apple Orchard / Garden View' },
  { value: 'forest', label: 'Deodar Forest View' },
  { value: 'village', label: 'Traditional Village View' },
  { value: 'courtyard', label: 'Inner Stone Courtyard View' },
  { value: 'none', label: 'Standard Room' },
];

const BED_OPTIONS = [
  'King / Double Bed',
  'Queen Bed',
  'Twin Single Beds',
  'King Bed + Single Bed (Triple)',
  'Traditional Himachali Wooden Bedding',
  'Family Suite (2 Double Beds)',
];

interface RoomDraft {
  room_name: string;
  base_price: number;
  max_guests: number;
  attached_washroom: boolean;
  view_type: string;
  bed_type: string;
  description: string;
  photos: string[];
  washroom_photos: string[];
}

export default function HostNewPropertyApplicationPage() {
  // Step 1: Property Details
  const [name, setName] = useState('');
  const [propertyType, setPropertyType] = useState('homestay');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('Uttarkashi');
  const [state, setState] = useState('Uttarakhand');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [amenities, setAmenities] = useState<string[]>([
    'Mountain View Balcony',
    'Home-Cooked Himalayan Meals',
    '24x7 Hot Water Geyser',
    'High-Speed Wi-Fi',
  ]);

  // Google Maps Share Link & Host Confirmation
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [mapsLinkError, setMapsLinkError] = useState<string | null>(null);

  // Step 2: Contact & Notification Settings
  const [contactPhone, setContactPhone] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');
  const [sameAsPhone, setSameAsPhone] = useState(true);
  const [contactEmail, setContactEmail] = useState('');
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);

  // Step 3: Multi-Room Inventory Configuration
  const [rooms, setRooms] = useState<RoomDraft[]>([
    {
      room_name: 'Room 1 - Mountain View Deluxe',
      base_price: 1800,
      max_guests: 2,
      attached_washroom: true,
      view_type: 'mountain',
      bed_type: 'King / Double Bed',
      description: 'Spacious room with large windows overlooking snow-clad Himalayan peaks.',
      photos: [],
      washroom_photos: [],
    },
  ]);

  // Step 4: House Rules & Timings
  const [checkInTime, setCheckInTime] = useState('12:00 PM');
  const [checkOutTime, setCheckOutTime] = useState('11:00 AM');
  const [houseRules, setHouseRules] = useState(
    'Quiet hours after 9:30 PM. Home-cooked meals served on advance notice. Please maintain cleanliness.'
  );

  // Step 5: General Property Photos & Cover
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [sharedWashroomPhotos, setSharedWashroomPhotos] = useState<string[]>([]);
  const [coverPhoto, setCoverPhoto] = useState<string>('');

  // Operational State
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

  const handlePhoneChange = (val: string) => {
    setContactPhone(val);
    if (sameAsPhone) {
      setContactWhatsapp(val);
    }
  };

  const handleAddRoom = () => {
    const roomCount = rooms.length + 1;
    setRooms((prev) => [
      ...prev,
      {
        room_name: `Room ${roomCount} - Mountain View`,
        base_price: 1800,
        max_guests: 2,
        attached_washroom: true,
        view_type: 'mountain',
        bed_type: 'King / Double Bed',
        description: 'Quiet room with scenic Himalayan views.',
        photos: [],
        washroom_photos: [],
      },
    ]);
  };

  const handleRemoveRoom = (index: number) => {
    if (rooms.length <= 1) return;
    setRooms((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRoomFieldChange = (index: number, field: keyof RoomDraft, value: any) => {
    setRooms((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value, ...(field === 'attached_washroom' && !value ? { washroom_photos: [] } : {}) };
      return copy;
    });
  };

  const getOtherRoomPhotoUrls = (roomIndex: number) => rooms.filter((r, index) => index !== roomIndex).flatMap((r) => [...(r.photos || []), ...(r.attached_washroom ? (r.washroom_photos || []) : [])]);
  const allRoomPhotoUrls = rooms.flatMap((r) => [...(r.photos || []), ...(r.attached_washroom ? (r.washroom_photos || []) : [])]);

  const handleTestGoogleMapsLink = () => {
    setMapsLinkError(null);
    const check = validateGoogleMapsUrl(googleMapsUrl);
    if (!check.valid || !check.normalizedUrl) {
      setMapsLinkError(
        check.error ||
          'Please enter a valid Google Maps share link (for example, https://maps.app.goo.gl/... or https://www.google.com/maps/...).'
      );
      return;
    }
    window.open(check.normalizedUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMapsLinkError(null);
    setSubmitting(true);

    if (rooms.length === 0) {
      setError('Please add at least one room unit to your property.');
      setSubmitting(false);
      return;
    }

    const mapsCheck = validateGoogleMapsUrl(googleMapsUrl);
    if (!mapsCheck.valid || !mapsCheck.normalizedUrl) {
      const msg =
        mapsCheck.error ||
        'Please enter a valid Google Maps share link (for example, https://maps.app.goo.gl/... or https://www.google.com/maps/...).';
      setMapsLinkError(msg);
      setError(msg);
      setSubmitting(false);
      return;
    }

    if (!locationConfirmed) {
      setError(
        'Please confirm that your Google Maps link points to your actual property location.'
      );
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        property_type: propertyType,
        village: village.trim(),
        district: district.trim(),
        state: state.trim(),
        address: address.trim(),
        google_maps_url: mapsCheck.normalizedUrl,
        location_confirmed: locationConfirmed,
        description: description.trim(),
        contact_phone: contactPhone.trim(),
        contact_whatsapp: contactWhatsapp.trim(),
        contact_email: contactEmail.trim() || undefined,
        notify_whatsapp: notifyWhatsapp,
        notify_email: notifyEmail,
        amenities,
        photos: photoUrls,
        shared_washroom_photos: sharedWashroomPhotos,
        cover_photo: coverPhoto || photoUrls[0] || undefined,
        house_rules: houseRules.trim(),
        check_in_time: checkInTime.trim(),
        check_out_time: checkOutTime.trim(),
        rooms: rooms.map((r) => ({
          room_name: r.room_name.trim(),
          base_price: Number(r.base_price),
          max_guests: Number(r.max_guests),
          attached_washroom: Boolean(r.attached_washroom),
          view_type: r.view_type,
          bed_type: r.bed_type,
          description: r.description.trim(),
          photos: r.photos || [],
          washroom_photos: r.attached_washroom ? (r.washroom_photos || []) : [],
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
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-forest/15 shadow-soft text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
              Application Submitted &amp; Under Curation Review
            </span>
            <h1 className="font-serif text-3xl font-bold text-forest">
              {submittedProperty.name}
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-muted max-w-md mx-auto leading-relaxed">
              Your homestay in <strong>{submittedProperty.village}</strong> has been safely recorded. You will receive real-time notifications on WhatsApp and Email once verified by our curation team.
            </p>
          </div>

          <div className="p-4 bg-ivory-warm rounded-2xl border border-forest/10 text-xs text-charcoal space-y-1.5 text-left">
            <div className="flex justify-between font-mono">
              <span className="text-charcoal-muted">Application ID:</span>
              <span className="font-bold">{submittedProperty.id}</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-charcoal-muted">Moderation Status:</span>
              <span className="text-ukorange font-bold uppercase">{submittedProperty.moderation_status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal-muted">Rooms Configured:</span>
              <span className="font-semibold">{rooms.length} room units</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/account/stays/host"
              className="w-full sm:w-auto px-6 py-2.5 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <span>Go to Host Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Breadcrumb */}
      <div>
        <Link
          href="/account/stays/host"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-muted hover:text-forest transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Host Overview</span>
        </Link>
        <span className="text-xs font-bold uppercase tracking-widest text-ukorange block">
          Homestay Onboarding Portal
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-forest mt-1">
          List Your Mountain Homestay
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-muted mt-1 leading-relaxed">
          Provide your property details, room configurations, direct gallery photos, and a verified Google Maps share link. All listings undergo curation review before going live.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION 1: HOMESTAY BASICS */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-forest/10">
            <div className="w-10 h-10 rounded-2xl bg-forest/10 text-forest flex items-center justify-center">
              <Home className="w-5 h-5 text-ukorange" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-forest">1. Homestay Details &amp; Location</h2>
              <p className="text-xs text-charcoal-muted">Core identity of your property</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Homestay / Property Name *
              </label>
              <input suppressHydrationWarning
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Yash Home Stay"
                required
                className="w-full p-3 text-sm bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none focus:border-forest"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Property Type
              </label>
              <select suppressHydrationWarning
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full p-3 text-sm bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none focus:border-forest"
              >
                <option value="homestay">Traditional Himalayan Homestay</option>
                <option value="cottage">Mountain Cottage / Cabin</option>
                <option value="guesthouse">Family-Run Guesthouse</option>
                <option value="villa">Mountain Villa</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Village / Town *
              </label>
              <input suppressHydrationWarning
                type="text"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder="e.g. Harsil, Chopta, Sankri, or Mana"
                required
                className="w-full p-3 text-sm bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none focus:border-forest"
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
                placeholder="e.g. Uttarkashi, Rudraprayag, Chamoli"
                required
                className="w-full p-3 text-sm bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none focus:border-forest"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                State *
              </label>
              <input suppressHydrationWarning
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. Uttarakhand"
                required
                className="w-full p-3 text-sm bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none focus:border-forest"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Exact Address &amp; Landmarks *
              </label>
              <input suppressHydrationWarning
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Near Old Apple Orchard, Upper Village Road"
                required
                className="w-full p-3 text-sm bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none focus:border-forest"
              />
              <p className="text-[11px] text-charcoal-muted mt-1">
                Kept private until a booking is confirmed. Public pages show only your village, district, and state.
              </p>
            </div>

            <div className="sm:col-span-2 p-4 sm:p-5 rounded-2xl bg-ivory-warm border border-forest/15 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="block text-xs font-semibold text-charcoal flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-ukorange" />
                  <span>Google Maps Location Link *</span>
                </label>
                <button
                  type="button"
                  onClick={handleTestGoogleMapsLink}
                  disabled={!googleMapsUrl.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-forest/20 text-xs font-semibold text-forest hover:bg-forest hover:text-white disabled:opacity-50 transition-colors self-start sm:self-auto"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Test Link</span>
                </button>
              </div>

              <input suppressHydrationWarning
                type="url"
                value={googleMapsUrl}
                onChange={(e) => {
                  setGoogleMapsUrl(e.target.value);
                  setMapsLinkError(null);
                  setLocationConfirmed(false);
                }}
                placeholder="Paste your Google Maps share link here"
                required
                className="w-full p-3 text-sm bg-white border border-forest/20 rounded-xl focus:outline-none focus:border-forest font-mono"
              />

              {mapsLinkError && (
                <p className="text-xs text-red-700 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{mapsLinkError}</span>
                </p>
              )}

              <div className="text-[11px] text-charcoal-muted space-y-1 bg-white/80 p-3 rounded-xl border border-forest/10">
                <p className="font-semibold text-charcoal">How to copy your Google Maps link:</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>Open Google Maps on your phone or computer</li>
                  <li>Find your exact property location</li>
                  <li>Tap <strong>Share</strong></li>
                  <li>Copy the link and paste it here</li>
                </ol>
              </div>

              <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={locationConfirmed}
                  onChange={(e) => setLocationConfirmed(e.target.checked)}
                  required
                  className="mt-0.5 rounded border-forest/30 text-forest focus:ring-forest"
                />
                <span className="text-xs font-medium text-charcoal leading-relaxed">
                  I have checked this Google Maps link and confirm that it points to my actual property location.
                </span>
              </label>
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
                    className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between ${
                      active
                        ? 'bg-forest/10 border-forest text-forest font-semibold'
                        : 'bg-ivory-warm border-forest/15 text-charcoal-muted hover:border-forest/30'
                    }`}
                  >
                    <span>{item}</span>
                    {active && <CheckCircle2 className="w-3.5 h-3.5 text-forest flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* SECTION 2: HOST CONTACT & NOTIFICATION PREFERENCES */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-forest/10">
            <div className="w-10 h-10 rounded-2xl bg-forest/10 text-forest flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-ukorange" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-forest">
                2. Host Contact &amp; Booking Notifications
              </h2>
              <p className="text-xs text-charcoal-muted">
                Receive instant booking requests and updates on your phone and email
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-forest" />
                <span>Primary Contact Phone *</span>
              </label>
              <input suppressHydrationWarning
                type="tel"
                value={contactPhone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="+91 98160 00000"
                required
                className="w-full p-3 text-sm bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none focus:border-forest"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-charcoal flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp Number for Alerts</span>
                </label>
                <label className="text-[11px] text-charcoal-muted flex items-center gap-1 cursor-pointer">
                  <input suppressHydrationWarning
                    type="checkbox"
                    checked={sameAsPhone}
                    onChange={(e) => {
                      setSameAsPhone(e.target.checked);
                      if (e.target.checked) setContactWhatsapp(contactPhone);
                    }}
                    className="rounded text-forest focus:ring-forest"
                  />
                  <span>Same as phone</span>
                </label>
              </div>
              <input suppressHydrationWarning
                type="tel"
                value={contactWhatsapp}
                onChange={(e) => {
                  setContactWhatsapp(e.target.value);
                  setSameAsPhone(false);
                }}
                placeholder="+91 98160 00000"
                className="w-full p-3 text-sm bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none focus:border-forest"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-charcoal mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-forest" />
                <span>Official Contact Email (Optional)</span>
              </label>
              <input suppressHydrationWarning
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="yourhomestay@example.com"
                className="w-full p-3 text-sm bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none focus:border-forest"
              />
            </div>
          </div>

          {/* Notification Alert Toggles */}
          <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 block">
              Automated Booking Alerts
            </span>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 text-xs text-charcoal cursor-pointer">
                <input suppressHydrationWarning
                  type="checkbox"
                  checked={notifyWhatsapp}
                  onChange={(e) => setNotifyWhatsapp(e.target.checked)}
                  className="rounded text-forest focus:ring-forest"
                />
                <span className="font-semibold text-forest">
                  Send immediate WhatsApp notification when a guest requests a booking
                </span>
              </label>
              <label className="flex items-center gap-2.5 text-xs text-charcoal cursor-pointer">
                <input suppressHydrationWarning
                  type="checkbox"
                  checked={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.checked)}
                  className="rounded text-forest focus:ring-forest"
                />
                <span className="font-semibold text-forest">
                  Send email notifications for booking requests and status updates
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* SECTION 3: MULTI-ROOM INVENTORY CONFIGURATION */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-forest/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-forest/10 text-forest flex items-center justify-center">
                <BedDouble className="w-5 h-5 text-ukorange" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-forest">
                  3. Room Inventory &amp; Specifications ({rooms.length} {rooms.length === 1 ? 'Room' : 'Rooms'})
                </h2>
                <p className="text-xs text-charcoal-muted">
                  Configure attached washrooms, views, capacity, rates, and direct gallery photos for each room
                </p>
              </div>
            </div>

            <button suppressHydrationWarning
              type="button"
              onClick={handleAddRoom}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 text-ukorange" />
              <span>Add Another Room</span>
            </button>
          </div>

          <div className="space-y-6">
            {rooms.map((room, idx) => (
              <div
                key={idx}
                className="p-5 sm:p-6 bg-ivory-warm/70 rounded-2xl border border-forest/20 space-y-5 relative"
              >
                <div className="flex items-center justify-between pb-3 border-b border-forest/10">
                  <span className="text-xs font-bold uppercase tracking-wider text-forest flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-forest text-white text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span>Room #{idx + 1} Specifications</span>
                  </span>

                  {rooms.length > 1 && (
                    <button suppressHydrationWarning
                      type="button"
                      onClick={() => handleRemoveRoom(idx)}
                      className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Room</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-charcoal mb-1">
                      Room Name / Title *
                    </label>
                    <input suppressHydrationWarning
                      type="text"
                      value={room.room_name}
                      onChange={(e) => handleRoomFieldChange(idx, 'room_name', e.target.value)}
                      placeholder="e.g. Upper Valley View Room"
                      required
                      className="w-full p-2.5 text-xs bg-white border border-forest/20 rounded-xl focus:outline-none focus:border-forest font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-charcoal mb-1">
                      Nightly Rate (₹) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-charcoal-muted">₹</span>
                      <input suppressHydrationWarning
                        type="number"
                        value={room.base_price}
                        onChange={(e) => handleRoomFieldChange(idx, 'base_price', Number(e.target.value))}
                        min={100}
                        required
                        className="w-full pl-7 pr-3 py-2.5 text-xs bg-white border border-forest/20 rounded-xl focus:outline-none focus:border-forest font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-charcoal mb-1">
                      Max Guests
                    </label>
                    <input suppressHydrationWarning
                      type="number"
                      value={room.max_guests}
                      onChange={(e) => handleRoomFieldChange(idx, 'max_guests', Number(e.target.value))}
                      min={1}
                      max={16}
                      className="w-full p-2.5 text-xs bg-white border border-forest/20 rounded-xl focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-charcoal mb-1">
                      Himalayan View Type
                    </label>
                    <select suppressHydrationWarning
                      value={room.view_type}
                      onChange={(e) => handleRoomFieldChange(idx, 'view_type', e.target.value)}
                      className="w-full p-2.5 text-xs bg-white border border-forest/20 rounded-xl focus:outline-none"
                    >
                      {VIEW_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-charcoal mb-1">
                      Bedding Setup
                    </label>
                    <select suppressHydrationWarning
                      value={room.bed_type}
                      onChange={(e) => handleRoomFieldChange(idx, 'bed_type', e.target.value)}
                      className="w-full p-2.5 text-xs bg-white border border-forest/20 rounded-xl focus:outline-none"
                    >
                      {BED_OPTIONS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Attached Washroom Toggle */}
                  <div className="sm:col-span-3 flex items-center justify-between p-3 bg-white rounded-xl border border-forest/15">
                    <div>
                      <span className="text-xs font-bold text-forest block">
                        Attached Private Washroom
                      </span>
                      <span className="text-[11px] text-charcoal-muted">
                        Does this room have an exclusive ensuite bathroom with hot water geyser?
                      </span>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input suppressHydrationWarning
                        type="checkbox"
                        checked={room.attached_washroom}
                        onChange={(e) => handleRoomFieldChange(idx, 'attached_washroom', e.target.checked)}
                        className="w-4 h-4 rounded text-forest focus:ring-forest"
                      />
                      <span className="text-xs font-semibold text-charcoal">
                        {room.attached_washroom ? 'Yes (Attached Washroom)' : 'No (Shared Washroom)'}
                      </span>
                    </label>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-charcoal mb-1">
                      Room Description / Features
                    </label>
                    <input suppressHydrationWarning
                      type="text"
                      value={room.description}
                      onChange={(e) => handleRoomFieldChange(idx, 'description', e.target.value)}
                      placeholder="e.g. Private balcony, wooden interiors, kettle, mountain view windows"
                      className="w-full p-2.5 text-xs bg-white border border-forest/20 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                {/* Direct Gallery Photos for this Room */}
                <div className="pt-3 border-t border-forest/10 space-y-4">
                  <PhotoUploader
                    label={`Room #${idx + 1} Bedroom Photos`}
                    description="Upload wide landscape photos of the bed, window view, and living area from your phone gallery."
                    photos={room.photos}
                    onChange={(urls) => handleRoomFieldChange(idx, 'photos', urls)}
                    category="room"
                    maxPhotos={6}
                    excludePhotos={[...photoUrls, ...sharedWashroomPhotos, ...(room.washroom_photos || []), ...getOtherRoomPhotoUrls(idx)]}
                  />

                  {room.attached_washroom && (
                    <PhotoUploader
                      label={`Room #${idx + 1} Private Washroom Photos`}
                      description="Upload photos of this room’s own attached private bathroom, geyser and fittings."
                      photos={room.washroom_photos || []}
                      onChange={(urls) => handleRoomFieldChange(idx, 'washroom_photos', urls)}
                      category="washroom"
                      maxPhotos={4}
                      excludePhotos={[...photoUrls, ...sharedWashroomPhotos, ...(room.photos || []), ...getOtherRoomPhotoUrls(idx)]}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: HOUSE RULES & TIMINGS */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-forest/10">
            <div className="w-10 h-10 rounded-2xl bg-forest/10 text-forest flex items-center justify-center">
              <Clock className="w-5 h-5 text-ukorange" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-forest">4. Stay Rules &amp; Check-In Times</h2>
              <p className="text-xs text-charcoal-muted">Set expectations for arriving travelers</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Standard Check-In Time
              </label>
              <input suppressHydrationWarning
                type="text"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                placeholder="12:00 PM"
                className="w-full p-3 text-sm bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Standard Check-Out Time
              </label>
              <input suppressHydrationWarning
                type="text"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                placeholder="11:00 AM"
                className="w-full p-3 text-sm bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-charcoal mb-1">
                House Rules &amp; Local Mountain Etiquette
              </label>
              <textarea suppressHydrationWarning
                rows={3}
                value={houseRules}
                onChange={(e) => setHouseRules(e.target.value)}
                placeholder="e.g. Quiet hours after 9:30 PM. No loud outdoor speakers. Traditional village etiquette applies."
                className="w-full p-3 text-xs bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* SECTION 5: GENERAL PROPERTY PHOTOGRAPHY WITH SPECIFICATIONS */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-forest/10">
            <div className="w-10 h-10 rounded-2xl bg-forest/10 text-forest flex items-center justify-center">
              <Camera className="w-5 h-5 text-ukorange" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-forest">
                5. Other Property Photos — Guest Gallery
              </h2>
              <p className="text-xs text-charcoal-muted">
                Upload exterior, outdoor spaces, mountain views, common areas, dining spaces, gardens and entrance. Guests can browse these in the property photo gallery. Keep bedroom and washroom photos in their dedicated sections.
              </p>
            </div>
          </div>

          <PhotoUploader
            label="Property Exterior, Views &amp; Common Areas"
            description="Select multiple landscape photos from your phone or camera gallery. Tap 'Make Cover' on your best exterior shot."
            photos={photoUrls}
            onChange={setPhotoUrls}
            coverPhoto={coverPhoto}
            onCoverChange={setCoverPhoto}
            category="general"
            maxPhotos={12}
            showGuidelines={true}
            excludePhotos={[...sharedWashroomPhotos, ...allRoomPhotoUrls]}
          />

          {rooms.some((room) => !room.attached_washroom) && (
            <div className="pt-5 border-t border-forest/10 space-y-3">
              <div><h3 className="font-serif text-lg font-bold text-forest">Shared Washroom Photos — One Gallery</h3><p className="text-xs text-charcoal-muted">Upload the common bathroom photos once here, not inside each room. This gallery is shown to guests booking any room marked Shared Washroom.</p></div>
              <PhotoUploader label="Upload Shared Washroom Photos" description="One shared gallery for all rooms marked Shared Washroom. Do not upload bedroom photos here." photos={sharedWashroomPhotos} onChange={setSharedWashroomPhotos} category="washroom" maxPhotos={8} excludePhotos={[...photoUrls, ...allRoomPhotoUrls]} />
            </div>
          )}
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-charcoal-muted">
            <span className="font-semibold text-forest">Verification Guarantee:</span> Your property will be verified by the Uttarkunth team. You will receive WhatsApp &amp; Email alerts as it progresses.
          </div>

          <button suppressHydrationWarning
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-8 py-3.5 bg-forest hover:bg-forest-hover text-white text-sm font-semibold rounded-2xl shadow-lifted transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4 text-ukorange" />
            <span>{submitting ? 'Submitting Application...' : 'Submit Property for Curation'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
