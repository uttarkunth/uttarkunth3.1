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
  Eye,
  Camera,
  Layers,
  ArrowRight
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
  'Bonfire Facility',
  'Power Backup',
  'Workstation Setup',
  'Pet Friendly',
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
}

export default function HostNewPropertyApplicationPage() {
  // Step 1: Property Details
  const [name, setName] = useState('Yash Home Stay');
  const [propertyType, setPropertyType] = useState('homestay');
  const [village, setVillage] = useState('Jari');
  const [district, setDistrict] = useState('Kullu');
  const [state, setState] = useState('Himachal Pradesh');
  const [address, setAddress] = useState('Near Primary School, Jari, Parvati Valley');
  const [description, setDescription] = useState(
    'Authentic Himachali wooden homestay nestled amidst apple orchards with panoramic views of snow-clad Himalayan peaks. Experience peaceful village hospitality, farm-fresh traditional pahadi meals, and deodar forest air.'
  );
  const [amenities, setAmenities] = useState<string[]>([
    'Mountain View Balcony',
    'Home-Cooked Himachali Meals',
    'Hot Water Geyser',
    'High-Speed Wi-Fi',
    'Orchard / Garden Sit-Out',
  ]);

  // Step 2: Contact & Notification Settings
  const [contactPhone, setContactPhone] = useState('+91 98160 12345');
  const [contactWhatsapp, setContactWhatsapp] = useState('+91 98160 12345');
  const [sameAsPhone, setSameAsPhone] = useState(true);
  const [contactEmail, setContactEmail] = useState('');
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);

  // Step 3: Multi-Room Inventory Configuration
  const [rooms, setRooms] = useState<RoomDraft[]>([
    {
      room_name: 'Upper Valley View Room',
      base_price: 1800,
      max_guests: 2,
      attached_washroom: true,
      view_type: 'mountain',
      bed_type: 'King / Double Bed',
      description: 'First-floor room with private wooden balcony overlooking snow peaks and Parvati Valley.',
    },
    {
      room_name: 'Apple Orchard Deluxe Suite',
      base_price: 2400,
      max_guests: 3,
      attached_washroom: true,
      view_type: 'garden',
      bed_type: 'King Bed + Single Bed (Triple)',
      description: 'Spacious family room looking into the organic apple orchard with wood-panelled interiors.',
    },
    {
      room_name: 'Traditional Deodar Room',
      base_price: 1500,
      max_guests: 2,
      attached_washroom: true,
      view_type: 'forest',
      bed_type: 'King / Double Bed',
      description: 'Cosy ground-level stone and timber room with authentic Kath-Kuni styling.',
    },
    {
      room_name: 'Standard Mountain Sit-Out Room',
      base_price: 1200,
      max_guests: 2,
      attached_washroom: false,
      view_type: 'mountain',
      bed_type: 'King / Double Bed',
      description: 'Affordable quiet room with shared modern washroom and front sit-out veranda.',
    },
  ]);

  // Step 4: House Rules & Timings
  const [checkInTime, setCheckInTime] = useState('12:00 PM');
  const [checkOutTime, setCheckOutTime] = useState('11:00 AM');
  const [houseRules, setHouseRules] = useState(
    'Quiet hours after 9:30 PM. Home-cooked vegetarian meals served on advance notice. Smoking strictly outdoors only.'
  );

  // Step 5: Photos
  const [photoUrls, setPhotoUrls] = useState<string[]>([
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
  ]);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');

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
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddPhoto = () => {
    if (!newPhotoUrl.trim()) return;
    setPhotoUrls((prev) => [...prev, newPhotoUrl.trim()]);
    setNewPhotoUrl('');
  };

  const handleRemovePhoto = (index: number) => {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (rooms.length === 0) {
      setError('Please add at least one room unit to your property.');
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
        description: description.trim(),
        contact_phone: contactPhone.trim(),
        contact_whatsapp: contactWhatsapp.trim(),
        contact_email: contactEmail.trim() || undefined,
        notify_whatsapp: notifyWhatsapp,
        notify_email: notifyEmail,
        amenities,
        photos: photoUrls,
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
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-forest/20 shadow-lifted text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <span className="text-xs font-bold uppercase tracking-widest text-ukorange block">
            Application Received · Under Review
          </span>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-forest">
            {submittedProperty.name} Submitted for Curation
          </h1>

          <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed max-w-lg mx-auto">
            Your homestay in <strong>{submittedProperty.village}</strong> has been registered with status{' '}
            <code className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono font-bold">
              pending review
            </code>.
            Our Founder and Stays Curation team will review the photos, rooms, and contact details. You will receive an instant notification once approved or if any update is required.
          </p>

          <div className="p-4 bg-ivory-warm rounded-2xl border border-forest/15 text-left text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-forest">
              <Sparkles className="w-4 h-4 text-ukorange" />
              <span>What Happens Next?</span>
            </div>
            <p className="text-charcoal-muted">
              1. <strong>Curation Check</strong>: Staff verifies Himalayan authenticity, amenities, and room rates.
            </p>
            <p className="text-charcoal-muted">
              2. <strong>Direct Communication</strong>: If anything requires updates, the reviewer will leave notes in your workspace.
            </p>
            <p className="text-charcoal-muted">
              3. <strong>Going Live</strong>: Once approved, your listing and availability calendar will be published live on uttarkunth.com.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/account/stays/host"
              className="px-6 py-3 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <span>Open Host Workspace</span>
              <ArrowRight className="w-4 h-4 text-ukorange" />
            </Link>
            <Link
              href="/account/notifications"
              className="px-6 py-3 bg-ivory-warm border border-forest/20 text-forest text-xs font-semibold rounded-xl hover:bg-forest/10 transition-colors"
            >
              Check Notifications
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Breadcrumb */}
      <div>
        <Link
          href="/account/stays/host"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-muted hover:text-forest mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Host Workspace</span>
        </Link>

        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-ukorange" />
          <span className="text-xs font-bold uppercase tracking-widest text-ukorange">
            New Listing Wizard
          </span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-forest mt-1">
          List Your Mountain Property &amp; Rooms
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-muted mt-1 leading-relaxed">
          Provide complete details, configure multi-room inventory, set your rates, and specify WhatsApp/email alert channels for instant booking notifications.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Error Banner */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Please check the form:</span>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* SECTION 1: PROPERTY IDENTITY & LOCATION */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-forest/10">
            <div className="w-10 h-10 rounded-2xl bg-forest/10 text-forest flex items-center justify-center">
              <Home className="w-5 h-5 text-ukorange" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-forest">1. Property Identity &amp; Location</h2>
              <p className="text-xs text-charcoal-muted">Basic overview of your homestay or retreat</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Property Name *
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
                <option value="homestay">Homestay (Family Hosted)</option>
                <option value="cottage">Traditional Wooden Cottage</option>
                <option value="villa">Mountain Villa</option>
                <option value="resort">Eco-Retreat</option>
                <option value="guesthouse">Village Guesthouse</option>
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
                placeholder="e.g. Jari"
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
                placeholder="e.g. Kullu"
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
                placeholder="e.g. Himachal Pradesh"
                required
                className="w-full p-3 text-sm bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none focus:border-forest"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Detailed Address / Landmark Directions
              </label>
              <input suppressHydrationWarning
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Near Primary School, Jari, Parvati Valley"
                className="w-full p-3 text-sm bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none focus:border-forest"
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
                placeholder="Describe your family homestay, scenic views, local food, and what makes your location special..."
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
                Receive instant booking requests and updates on your preferred channels
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
                placeholder="yashhomestay@example.com"
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
                  Send email notification on new booking requests and curation reviews
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
                  Configure attached washrooms, mountain/valley views, capacity, and nightly rates
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
                className="p-5 bg-ivory-warm/70 rounded-2xl border border-forest/20 space-y-4 relative"
              >
                <div className="flex items-center justify-between pb-2 border-b border-forest/10">
                  <span className="text-xs font-bold uppercase tracking-wider text-forest flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-forest text-white text-[10px] flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span>Room #{idx + 1}</span>
                  </span>

                  {rooms.length > 1 && (
                    <button suppressHydrationWarning
                      type="button"
                      onClick={() => handleRemoveRoom(idx)}
                      className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
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
                      placeholder="e.g. Deluxe Mountain View Room"
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
                      max={12}
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
                        {room.attached_washroom ? 'Yes (Attached)' : 'No (Shared)'}
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
                      placeholder="e.g. Wooden balcony, kettle, deodar wood paneling, quiet mountain breeze"
                      className="w-full p-2.5 text-xs bg-white border border-forest/20 rounded-xl focus:outline-none"
                    />
                  </div>
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

        {/* SECTION 5: PROPERTY PHOTOGRAPHY */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-forest/10">
            <div className="w-10 h-10 rounded-2xl bg-forest/10 text-forest flex items-center justify-center">
              <Camera className="w-5 h-5 text-ukorange" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-forest">
                5. Property Photography ({photoUrls.length} {photoUrls.length === 1 ? 'Photo' : 'Photos'})
              </h2>
              <p className="text-xs text-charcoal-muted">
                Visual proof of authentic Himalayan rooms, balconies, and exterior grounds
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <input suppressHydrationWarning
                type="url"
                value={newPhotoUrl}
                onChange={(e) => setNewPhotoUrl(e.target.value)}
                placeholder="Paste image URL (e.g. https://images.unsplash.com/...)"
                className="flex-1 p-2.5 text-xs bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none"
              />
              <button suppressHydrationWarning
                type="button"
                onClick={handleAddPhoto}
                className="px-4 py-2 bg-forest text-white text-xs font-semibold rounded-xl"
              >
                Add Image
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photoUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="relative h-32 rounded-2xl overflow-hidden border border-forest/20 group"
                >
                  <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-forest text-white text-[10px] font-bold rounded-md shadow-xs">
                      Primary Cover
                    </span>
                  )}
                  <button suppressHydrationWarning
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-red-700 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-charcoal-muted">
            <span className="font-semibold text-forest">Verification Guarantee:</span> Your property will be reviewed by Uttarkunth curation staff before appearing publicly on uttarkunth.com.
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
