'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AMENITIES_LIST, PROPERTY_TYPES } from '@/lib/constants';
import { formatINR } from '@/lib/utils';
import {
  Save, AlertTriangle, CheckCircle2, Trash2, PlusCircle,
  Eye, ArrowLeft, Image as ImageIcon, BedDouble, ShieldAlert, Sparkles,
  Phone, MessageSquare, Mail, Clock, MapPin, ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react';
import { PhotoUploader } from '@/components/host/photo-uploader';
import { validateGoogleMapsUrl } from '@/lib/validations';

interface RoomUnit {
  id?: string;
  room_name: string;
  description?: string;
  max_guests: number;
  base_price: number;
  attached_washroom?: boolean;
  view_type?: string;
  bed_type?: string;
  photos?: string[];
  washroom_photos?: string[];
  active: boolean;
  deleted?: boolean;
}

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

interface PropertyEditorProps {
  initialProperty: any;
}

export function PropertyEditor({ initialProperty }: PropertyEditorProps) {
  const router = useRouter();

  // Operational State
  const [description, setDescription] = useState(initialProperty.description || '');
  const [amenities, setAmenities] = useState<string[]>(
    Array.isArray(initialProperty.amenities) ? initialProperty.amenities : []
  );
  const [photos, setPhotos] = useState<string[]>(
    Array.isArray(initialProperty.photos) ? initialProperty.photos : []
  );
  const [sharedWashroomPhotos, setSharedWashroomPhotos] = useState<string[]>(
    Array.isArray(initialProperty.shared_washroom_photos) ? initialProperty.shared_washroom_photos : []
  );
  const [coverPhoto, setCoverPhoto] = useState<string>(
    initialProperty.cover_photo || (Array.isArray(initialProperty.photos) ? initialProperty.photos[0] : '') || ''
  );

  // Structural & Private Location State
  const [name, setName] = useState(initialProperty.name || '');
  const [address, setAddress] = useState(
    initialProperty.exact_address || initialProperty.address || ''
  );
  const [googleMapsUrl, setGoogleMapsUrl] = useState(
    initialProperty.google_maps_url || ''
  );
  const [locationConfirmed, setLocationConfirmed] = useState(
    Boolean(initialProperty.location_confirmed && initialProperty.google_maps_url)
  );
  const [mapsLinkError, setMapsLinkError] = useState<string | null>(null);
  const [village, setVillage] = useState(initialProperty.village || '');
  const [district, setDistrict] = useState(initialProperty.district || 'Uttarkashi');
  const [state, setState] = useState(initialProperty.state || 'Uttarakhand');
  const [propertyType, setPropertyType] = useState(initialProperty.property_type || 'homestay');

  // Contact & Notifications State
  const [contactPhone, setContactPhone] = useState(initialProperty.contact_phone || '');
  const [contactWhatsapp, setContactWhatsapp] = useState(initialProperty.contact_whatsapp || '');
  const [contactEmail, setContactEmail] = useState(initialProperty.contact_email || '');
  const [notifyEmail, setNotifyEmail] = useState(initialProperty.notify_email ?? true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(initialProperty.notify_whatsapp ?? false);
  const [houseRules, setHouseRules] = useState(initialProperty.house_rules || '');
  const [checkInTime, setCheckInTime] = useState(initialProperty.check_in_time || '12:00 PM');
  const [checkOutTime, setCheckOutTime] = useState(initialProperty.check_out_time || '11:00 AM');

  // Room Units State
  const [rooms, setRooms] = useState<RoomUnit[]>(
    Array.isArray(initialProperty.room_units) && initialProperty.room_units.length > 0
      ? initialProperty.room_units.map((r: any) => ({
          id: r.id,
          room_name: r.room_name || 'Room',
          description: r.description || '',
          max_guests: Number(r.max_guests) || 2,
          base_price: Number(r.base_price) || 1500,
          attached_washroom: Boolean(r.attached_washroom),
          view_type: r.view_type || 'mountain',
          bed_type: r.bed_type || 'King / Double Bed',
          photos: Array.isArray(r.photos) ? r.photos : [],
          washroom_photos: Array.isArray(r.washroom_photos) ? r.washroom_photos : [],
          active: r.active !== undefined ? Boolean(r.active) : true,
        }))
      : [
          {
            room_name: 'Room 1 - Mountain View Deluxe',
            description: 'Comfortable Himalayan room with scenic mountain views',
            max_guests: 2,
            base_price: 1500,
            attached_washroom: true,
            view_type: 'mountain',
            bed_type: 'King / Double Bed',
            photos: [],
            washroom_photos: [],
            active: true,
          },
        ]
  );

  // Expanded room indices for inline detail editing
  const [expandedRoomIndices, setExpandedRoomIndices] = useState<number[]>([0]);

  // Saving state
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const toggleAmenity = (item: string) => {
    setAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const toggleRoomExpand = (idx: number) => {
    setExpandedRoomIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const updateRoomField = (idx: number, field: keyof RoomUnit, value: any) => {
    setRooms((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value, ...(field === 'attached_washroom' && !value ? { washroom_photos: [] } : {}) };
      return copy;
    });
  };

  const handleAddRoom = () => {
    const nextIdx = rooms.length + 1;
    setRooms((prev) => [
      ...prev,
      {
        room_name: `Room ${nextIdx} - Mountain View`,
        description: 'Peaceful room with mountain vista.',
        max_guests: 2,
        base_price: 1800,
        attached_washroom: true,
        view_type: 'mountain',
        bed_type: 'King / Double Bed',
        photos: [],
        washroom_photos: [],
        active: true,
      },
    ]);
    setExpandedRoomIndices((prev) => [...prev, rooms.length]);
  };

  const handleDeleteRoom = (idx: number) => {
    const room = rooms[idx];
    if (room.id) {
      // Mark as deleted so backend deletes it from DB
      setRooms((prev) => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], deleted: true };
        return copy;
      });
    } else {
      // Unsaved new room: just remove from state
      setRooms((prev) => prev.filter((_, i) => i !== idx));
    }
  };

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setMapsLinkError(null);

    const trimmedMapsUrl = googleMapsUrl.trim();
    const initialMapsUrl = (initialProperty.google_maps_url || '').trim();
    const isMapsUrlChanged = trimmedMapsUrl !== initialMapsUrl;

    if (trimmedMapsUrl !== '') {
      const mapsCheck = validateGoogleMapsUrl(trimmedMapsUrl);
      if (!mapsCheck.valid || !mapsCheck.normalizedUrl) {
        const errMsg =
          mapsCheck.error ||
          'Please enter a valid Google Maps share link (for example, https://maps.app.goo.gl/... or https://www.google.com/maps/...).';
        setMapsLinkError(errMsg);
        setMessage({ type: 'error', text: errMsg });
        setSaving(false);
        return;
      }

      if (isMapsUrlChanged && !locationConfirmed) {
        const confirmErr =
          'Please confirm that your Google Maps link points to your actual property location.';
        setMapsLinkError(confirmErr);
        setMessage({ type: 'error', text: confirmErr });
        setSaving(false);
        return;
      }
    }

    try {
      const payload = {
        name,
        description,
        address,
        village,
        district,
        state,
        google_maps_url: trimmedMapsUrl || undefined,
        location_confirmed: locationConfirmed,
        cover_photo: coverPhoto || photos[0] || null,
        property_type: propertyType,
        amenities,
        photos,
        shared_washroom_photos: sharedWashroomPhotos,
        rooms: rooms.map((r) => ({
          ...r,
          base_price: Number(r.base_price),
          max_guests: Number(r.max_guests),
          photos: r.photos || [],
          washroom_photos: r.attached_washroom ? (r.washroom_photos || []) : [],
        })),
        contact_phone: contactPhone,
        contact_whatsapp: contactWhatsapp,
        contact_email: contactEmail,
        notify_email: notifyEmail,
        notify_whatsapp: notifyWhatsapp,
        house_rules: houseRules,
        check_in_time: checkInTime,
        check_out_time: checkOutTime,
      };

      const res = await fetch(`/api/host/properties/${initialProperty.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to save property changes');
      }

      setMessage({
        type: 'success',
        text: data.message || 'Property details, room rates, and photos updated successfully.',
      });
      router.refresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const visibleRooms = rooms.filter((r) => !r.deleted);
  const getOtherRoomPhotoUrls = (roomIndex: number) => rooms.filter((r, index) => index !== roomIndex && !r.deleted).flatMap((r) => [...(r.photos || []), ...(r.attached_washroom ? (r.washroom_photos || []) : [])]);
  const allRoomPhotoUrls = rooms.filter((r) => !r.deleted).flatMap((r) => [...(r.photos || []), ...(r.attached_washroom ? (r.washroom_photos || []) : [])]);

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Top Banner & Status */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-forest/10">
          <div>
            <Link
              href="/account/stays/host/properties"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-muted hover:text-forest transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Properties Catalog</span>
            </Link>
            <h1 className="font-serif text-3xl font-bold text-forest">{initialProperty.name}</h1>
            <p className="text-xs text-charcoal-muted mt-0.5">
              Property ID: <span className="font-mono">{initialProperty.id}</span> • Status:{' '}
              <span className="font-bold uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                {initialProperty.moderation_status}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/stays/${initialProperty.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-forest bg-warm-canvas hover:bg-forest/10 border border-forest/20 rounded-xl transition-all"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Public Listing</span>
            </Link>

            <button suppressHydrationWarning
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`p-4 rounded-2xl text-xs flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}
      </div>

      {/* Section 1: Room Units & Inventory Management */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-forest/10">
          <div>
            <h2 className="font-serif text-2xl font-bold text-forest flex items-center gap-2">
              <BedDouble className="w-5 h-5 text-ukorange" />
              <span>Manage Room Inventory &amp; Nightly Rates ({visibleRooms.length} Rooms)</span>
            </h2>
            <p className="text-xs text-charcoal-muted">
              Edit rates, max guests, attached washrooms, and upload bedroom &amp; washroom photos per room.
            </p>
          </div>

          <button suppressHydrationWarning
            type="button"
            onClick={handleAddRoom}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl shadow-xs transition-all self-start sm:self-auto"
          >
            <PlusCircle className="w-3.5 h-3.5 text-ukorange" />
            <span>Add New Room Unit</span>
          </button>
        </div>

        <div className="space-y-6">
          {rooms.map((room, idx) => {
            if (room.deleted) return null;
            const isExpanded = expandedRoomIndices.includes(idx);

            return (
              <div
                key={room.id || idx}
                className="p-5 sm:p-6 bg-ivory-warm/60 rounded-2xl border border-forest/20 space-y-4 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-forest/10">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-forest text-white text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <h3 className="font-serif text-lg font-bold text-forest">{room.room_name}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-charcoal-muted mt-0.5">
                        <span className="font-semibold text-emerald-800">
                          ₹{room.base_price.toLocaleString('en-IN')}/night
                        </span>
                        <span>•</span>
                        <span>Max {room.max_guests} Guests</span>
                        <span>•</span>
                        <span className={room.attached_washroom ? 'text-emerald-700 font-medium' : 'text-stone-500'}>
                          {room.attached_washroom ? 'Attached Washroom' : 'Shared Washroom'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button suppressHydrationWarning
                      type="button"
                      onClick={() => updateRoomField(idx, 'active', !room.active)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                        room.active
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-stone-100 text-stone-600 border border-stone-200'
                      }`}
                    >
                      {room.active ? 'Active' : 'Paused'}
                    </button>

                    <button suppressHydrationWarning
                      type="button"
                      onClick={() => toggleRoomExpand(idx)}
                      className="p-1.5 text-stone-600 hover:text-forest bg-white border border-stone-200 rounded-lg transition"
                      title={isExpanded ? 'Collapse' : 'Expand full room editor'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {visibleRooms.length > 1 && (
                      <button suppressHydrationWarning
                        type="button"
                        onClick={() => handleDeleteRoom(idx)}
                        className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition"
                        title="Delete Room"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Editing Fields (Expanded) */}
                {isExpanded && (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-charcoal mb-1">
                          Room Name / Title *
                        </label>
                        <input suppressHydrationWarning
                          type="text"
                          value={room.room_name}
                          onChange={(e) => updateRoomField(idx, 'room_name', e.target.value)}
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
                            onChange={(e) => updateRoomField(idx, 'base_price', Number(e.target.value))}
                            min={100}
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
                          onChange={(e) => updateRoomField(idx, 'max_guests', Number(e.target.value))}
                          min={1}
                          max={16}
                          className="w-full p-2.5 text-xs bg-white border border-forest/20 rounded-xl focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-charcoal mb-1">
                          Himalayan View
                        </label>
                        <select suppressHydrationWarning
                          value={room.view_type || 'mountain'}
                          onChange={(e) => updateRoomField(idx, 'view_type', e.target.value)}
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
                          value={room.bed_type || 'King / Double Bed'}
                          onChange={(e) => updateRoomField(idx, 'bed_type', e.target.value)}
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
                            Ensuite private bathroom with running hot water geyser.
                          </span>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input suppressHydrationWarning
                            type="checkbox"
                            checked={room.attached_washroom}
                            onChange={(e) => updateRoomField(idx, 'attached_washroom', e.target.checked)}
                            className="w-4 h-4 rounded text-forest focus:ring-forest"
                          />
                          <span className="text-xs font-semibold text-charcoal">
                            {room.attached_washroom ? 'Yes (Attached)' : 'No (Shared)'}
                          </span>
                        </label>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-semibold text-charcoal mb-1">
                          Room Description / Key Highlights
                        </label>
                        <input suppressHydrationWarning
                          type="text"
                          value={room.description || ''}
                          onChange={(e) => updateRoomField(idx, 'description', e.target.value)}
                          placeholder="e.g. Balcony, tea kettle, mountain view windows"
                          className="w-full p-2.5 text-xs bg-white border border-forest/20 rounded-xl focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Room Photos & Washroom Photos */}
                    <div className="pt-3 border-t border-forest/10 space-y-4">
                      <PhotoUploader
                        label={`Room #${idx + 1} Bedroom Photos`}
                        description="Direct gallery upload of bedroom space, bed setup, and mountain view windows."
                        photos={room.photos || []}
                        onChange={(urls) => updateRoomField(idx, 'photos', urls)}
                        category="room"
                        maxPhotos={6}
                        excludePhotos={[...photos, ...sharedWashroomPhotos, ...(room.washroom_photos || []), ...getOtherRoomPhotoUrls(idx)]}
                      />

                      {room.attached_washroom && (
                        <PhotoUploader
                          label={`Room #${idx + 1} Private Washroom Photos`}
                          description="Upload photos of this room’s own attached private bathroom, geyser and fittings."
                          photos={room.washroom_photos || []}
                          onChange={(urls) => updateRoomField(idx, 'washroom_photos', urls)}
                          category="washroom"
                          maxPhotos={4}
                          excludePhotos={[...photos, ...sharedWashroomPhotos, ...(room.photos || []), ...getOtherRoomPhotoUrls(idx)]}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Property Photography Gallery */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
        <div>
          <h2 className="font-serif text-2xl font-bold text-forest flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-ukorange" />
            <span>Other Property Photos — Guest Gallery</span>
          </h2>
          <p className="text-xs text-charcoal-muted">
            Upload exterior, outdoor spaces, mountain views, common areas, dining spaces, gardens and entrance. Guests can browse these in the property photo gallery. Keep bedroom and washroom photos in their dedicated sections.
          </p>
        </div>

        <PhotoUploader
          label="Property Exterior, Views &amp; Common Areas"
          photos={photos}
          onChange={setPhotos}
          coverPhoto={coverPhoto}
          onCoverChange={setCoverPhoto}
          category="general"
          maxPhotos={14}
          showGuidelines={true}
          excludePhotos={[...sharedWashroomPhotos, ...allRoomPhotoUrls]}
        />

        {visibleRooms.some((room) => !room.attached_washroom) && (
          <div className="pt-5 border-t border-forest/10 space-y-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-forest">Shared Washroom Photos — One Gallery</h3>
              <p className="text-xs text-charcoal-muted">Upload the common bathroom photos once here, not inside each room. This gallery is shown to guests booking any room marked Shared Washroom.</p>
            </div>
            <PhotoUploader label="Upload Shared Washroom Photos" description="One shared gallery for all rooms marked Shared Washroom. Do not upload bedroom photos here." photos={sharedWashroomPhotos} onChange={setSharedWashroomPhotos} category="washroom" maxPhotos={8} excludePhotos={[...photos, ...allRoomPhotoUrls]} />
          </div>
        )}
      </div>

      {/* Section 4: Operational Details & Amenities */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
        <div>
          <h2 className="font-serif text-2xl font-bold text-forest">
            Operational Details &amp; Guest Amenities
          </h2>
          <p className="text-xs text-charcoal-muted">
            Operational settings update directly without resetting your approved listing status.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal-muted mb-1.5">
              Property Description &amp; Mountain Experience
            </label>
            <textarea suppressHydrationWarning
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 text-xs bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none leading-relaxed"
              placeholder="Describe your homestay, surroundings, organic meals, and mountain view..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-muted mb-2">
              Verified Amenities &amp; Experiences
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {AMENITIES_LIST.map((item) => {
                const checked = amenities.includes(item);
                return (
                  <button suppressHydrationWarning
                    key={item}
                    type="button"
                    onClick={() => toggleAmenity(item)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between ${
                      checked
                        ? 'bg-forest text-white border-forest shadow-xs'
                        : 'bg-ivory-warm text-charcoal-muted border-forest/15 hover:border-forest/30'
                    }`}
                  >
                    <span>{item}</span>
                    <span
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[10px] ${
                        checked ? 'border-white bg-white text-forest' : 'border-forest/30'
                      }`}
                    >
                      {checked ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Section 5: Contact & Alert Preferences */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
        <div>
          <h2 className="font-serif text-2xl font-bold text-forest flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-ukorange" />
            <span>Contact &amp; Notification Settings</span>
          </h2>
          <p className="text-xs text-charcoal-muted">
            Phone numbers and email addresses where you receive guest reservation requests.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-forest" />
              <span>Contact Phone</span>
            </label>
            <input suppressHydrationWarning
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full p-2.5 text-xs bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp Alert Number</span>
            </label>
            <input suppressHydrationWarning
              type="tel"
              value={contactWhatsapp}
              onChange={(e) => setContactWhatsapp(e.target.value)}
              className="w-full p-2.5 text-xs bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-forest" />
              <span>Alert Email</span>
            </label>
            <input suppressHydrationWarning
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full p-2.5 text-xs bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-forest" />
              <span>Check-In Time</span>
            </label>
            <input suppressHydrationWarning
              type="text"
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
              className="w-full p-2.5 text-xs bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-forest" />
              <span>Check-Out Time</span>
            </label>
            <input suppressHydrationWarning
              type="text"
              value={checkOutTime}
              onChange={(e) => setCheckOutTime(e.target.value)}
              className="w-full p-2.5 text-xs bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-charcoal mb-1">
              House Rules
            </label>
            <textarea suppressHydrationWarning
              rows={2}
              value={houseRules}
              onChange={(e) => setHouseRules(e.target.value)}
              className="w-full p-2.5 text-xs bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* Section 6: Structural Identity (Name & Legal Physical Location) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-300/80 shadow-soft space-y-6">
        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs">
          <ShieldAlert className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Core Structural Identity Notice:</span>
            <p>
              Modifying fundamental property details below (Name, Village, District, State, Address, or Property Type) stages those legal fields for review by platform administrators while keeping your current listing live.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal-muted mb-1">
              Property Name
            </label>
            <input suppressHydrationWarning
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 text-xs bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-muted mb-1">
              Property Type
            </label>
            <select suppressHydrationWarning
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full p-2.5 text-xs bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none capitalize"
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t.id} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-muted mb-1">
              Village / Settlement
            </label>
            <input suppressHydrationWarning
              type="text"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              className="w-full p-2.5 text-xs bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-muted mb-1">
              District
            </label>
            <input suppressHydrationWarning
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full p-2.5 text-xs bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-muted mb-1">
              State
            </label>
            <input suppressHydrationWarning
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full p-2.5 text-xs bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-charcoal-muted mb-1">
              Detailed Address
            </label>
            <input suppressHydrationWarning
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Near Primary School, Upper Village Road"
              className="w-full p-2.5 text-xs bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none"
            />
            {initialProperty.pending_exact_address && (
              <p className="text-[11px] text-amber-800 mt-1">
                Staged address awaiting admin review: <strong>{initialProperty.pending_exact_address}</strong>
              </p>
            )}
          </div>

          <div className="sm:col-span-2 p-4 rounded-2xl bg-ivory-warm border border-forest/15 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="block text-xs font-semibold text-charcoal flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-ukorange" />
                <span>Google Maps Location Link</span>
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
              className="w-full p-2.5 text-xs bg-white border border-forest/20 rounded-xl focus:outline-none focus:border-forest font-mono"
            />

            {initialProperty.pending_google_maps_url && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-center justify-between gap-2">
                <span className="truncate">
                  Staged Google Maps link awaiting admin review: <strong>{initialProperty.pending_google_maps_url}</strong>
                </span>
                <a
                  href={initialProperty.pending_google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-900 underline font-semibold flex-shrink-0"
                >
                  Open Staged
                </a>
              </div>
            )}

            {mapsLinkError && (
              <p className="text-xs text-red-700 font-medium flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{mapsLinkError}</span>
              </p>
            )}

            <div className="text-[11px] text-charcoal-muted space-y-1 bg-white/80 p-3 rounded-xl border border-forest/10">
              <p className="font-semibold text-charcoal">How to update your Google Maps link:</p>
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
                className="mt-0.5 rounded border-forest/30 text-forest focus:ring-forest"
              />
              <span className="text-xs font-medium text-charcoal leading-relaxed">
                I have checked this Google Maps link and confirm that it points to my actual property location.
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4 pb-12">
        <button suppressHydrationWarning
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-8 py-3 bg-forest hover:bg-forest-hover text-white text-sm font-semibold rounded-2xl shadow-lifted transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving Changes...' : 'Save All Property & Room Updates'}</span>
        </button>
      </div>
    </form>
  );
}
