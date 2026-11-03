'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AMENITIES_LIST, PROPERTY_TYPES } from '@/lib/constants';
import { formatINR } from '@/lib/utils';
import {
  Save, AlertTriangle, CheckCircle2, Upload, Trash2, PlusCircle,
  Eye, ArrowLeft, Image as ImageIcon, BedDouble, ShieldAlert, Sparkles
} from 'lucide-react';

interface RoomUnit {
  id?: string;
  room_name: string;
  description?: string;
  max_guests: number;
  base_price: number;
  active: boolean;
}

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

  // Structural State
  const [name, setName] = useState(initialProperty.name || '');
  const [address, setAddress] = useState(initialProperty.address || '');
  const [village, setVillage] = useState(initialProperty.village || '');
  const [district, setDistrict] = useState(initialProperty.district || 'Kullu');
  const [state, setState] = useState(initialProperty.state || 'Himachal Pradesh');
  const [propertyType, setPropertyType] = useState(initialProperty.property_type || 'homestay');

  // Room Units State
  const [rooms, setRooms] = useState<RoomUnit[]>(
    Array.isArray(initialProperty.room_units) && initialProperty.room_units.length > 0
      ? initialProperty.room_units
      : [
          {
            room_name: 'Traditional Room',
            description: 'Comfortable Himalayan room',
            max_guests: 2,
            base_price: 1500,
            active: true
          }
        ]
  );

  // New room draft form
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomPrice, setNewRoomPrice] = useState(1500);
  const [newRoomGuests, setNewRoomGuests] = useState(2);
  const [showAddRoom, setShowAddRoom] = useState(false);

  // Uploading state
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const toggleAmenity = (item: string) => {
    setAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/host/properties/${initialProperty.id}/photos`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to upload photo');
      }

      setPhotos(data.photos || [...photos, data.photo_url]);
      setMessage({ type: 'success', text: 'Photo uploaded successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (photoUrl: string) => {
    setPhotos((prev) => prev.filter((p) => p !== photoUrl));
  };

  const updateRoomPrice = (index: number, price: number) => {
    setRooms((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], base_price: price };
      return copy;
    });
  };

  const updateRoomActive = (index: number, active: boolean) => {
    setRooms((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], active };
      return copy;
    });
  };

  const handleAddRoom = () => {
    if (!newRoomName.trim() || !newRoomPrice) return;
    setRooms((prev) => [
      ...prev,
      {
        room_name: newRoomName.trim(),
        max_guests: Number(newRoomGuests),
        base_price: Number(newRoomPrice),
        active: true,
      },
    ]);
    setNewRoomName('');
    setNewRoomPrice(1500);
    setNewRoomGuests(2);
    setShowAddRoom(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/host/properties/${initialProperty.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          address,
          village,
          district,
          state,
          property_type: propertyType,
          amenities,
          photos,
          rooms,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to save property changes');
      }

      setMessage({
        type: 'success',
        text: data.message || 'Property updated successfully.',
      });
      router.refresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

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
              Property ID: <span className="font-mono">{initialProperty.id}</span>
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

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-ukorange" />
              <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
            </button>
          </div>
        </div>

        {initialProperty.pending_changes && (
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900">
            <Sparkles className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Pending Administrative Review:</span>
              <p className="text-amber-800 mt-0.5">
                You have proposed updates to public content currently awaiting administrator moderation. Your currently approved listing remains live on the website.
              </p>
            </div>
          </div>
        )}

        {/* Live Status Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-ivory-warm rounded-2xl border border-forest/15 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-charcoal-muted uppercase tracking-wider block font-medium">
                Publication State
              </span>
              <span className="font-serif text-lg font-bold text-forest">
                {initialProperty.published ? 'Live (Bookable Online)' : 'Unpublished (Draft)'}
              </span>
            </div>
            <span
              className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${
                initialProperty.published
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-charcoal/10 text-charcoal'
              }`}
            >
              {initialProperty.published ? 'Live' : 'Draft'}
            </span>
          </div>

          <div className="p-4 bg-ivory-warm rounded-2xl border border-forest/15 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-charcoal-muted uppercase tracking-wider block font-medium">
                Moderation Status
              </span>
              <span className="font-serif text-lg font-bold text-forest capitalize">
                {initialProperty.moderation_status}
              </span>
            </div>
            <span
              className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${
                initialProperty.moderation_status === 'approved'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {initialProperty.moderation_status}
            </span>
          </div>
        </div>

        {message && (
          <div
            className={`p-4 rounded-2xl text-xs font-medium flex items-center gap-2 ${
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

      {/* Section 1: Room Units & Nightly Rates */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-forest/10">
          <div>
            <h2 className="font-serif text-2xl font-bold text-forest flex items-center gap-2">
              <BedDouble className="w-5 h-5 text-ukorange" />
              <span>Room Units & Nightly Rates</span>
            </h2>
            <p className="text-xs text-charcoal-muted">
              Configure room inventory and base pricing in INR. Updates apply immediately.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddRoom(!showAddRoom)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-forest bg-warm-canvas hover:bg-forest/10 border border-forest/20 rounded-xl"
          >
            <PlusCircle className="w-4 h-4 text-ukorange" />
            <span>Add Room Unit</span>
          </button>
        </div>

        {showAddRoom && (
          <div className="p-4 bg-ivory-warm rounded-2xl border border-forest/15 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-forest">
              New Room Unit Specification
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-charcoal-muted mb-1">
                  Room Name
                </label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. Cedar View Deluxe"
                  className="w-full p-2 text-xs bg-white border border-forest/20 rounded-lg focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-charcoal-muted mb-1">
                  Base Price per Night (₹)
                </label>
                <input
                  type="number"
                  value={newRoomPrice}
                  onChange={(e) => setNewRoomPrice(Number(e.target.value))}
                  min={100}
                  className="w-full p-2 text-xs bg-white border border-forest/20 rounded-lg focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-charcoal-muted mb-1">
                  Max Guests
                </label>
                <input
                  type="number"
                  value={newRoomGuests}
                  onChange={(e) => setNewRoomGuests(Number(e.target.value))}
                  min={1}
                  max={10}
                  className="w-full p-2 text-xs bg-white border border-forest/20 rounded-lg focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddRoom(false)}
                className="px-3 py-1.5 text-xs font-semibold text-charcoal-muted hover:text-charcoal"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddRoom}
                className="px-4 py-1.5 bg-forest text-white text-xs font-semibold rounded-lg shadow-xs"
              >
                Add Unit to Property
              </button>
            </div>
          </div>
        )}

        <div className="divide-y divide-forest/10">
          {rooms.map((room, idx) => (
            <div
              key={room.id || idx}
              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <h3 className="font-semibold text-sm text-forest">{room.room_name}</h3>
                <p className="text-xs text-charcoal-muted">
                  Capacity: {room.max_guests} Guests max • Status:{' '}
                  <span className={room.active ? 'text-emerald-700 font-medium' : 'text-charcoal-muted'}>
                    {room.active ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-charcoal-muted font-medium">Nightly Rate:</span>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs text-charcoal-muted">₹</span>
                    <input
                      type="number"
                      value={room.base_price}
                      onChange={(e) => updateRoomPrice(idx, Number(e.target.value))}
                      className="w-28 pl-6 pr-2 py-1.5 text-xs font-bold bg-ivory-warm border border-forest/20 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => updateRoomActive(idx, !room.active)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    room.active
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-charcoal/5 text-charcoal-muted border border-charcoal/10'
                  }`}
                >
                  {room.active ? 'Active' : 'Paused'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Property Photography Gallery */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-forest/10">
          <div>
            <h2 className="font-serif text-2xl font-bold text-forest flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-ukorange" />
              <span>Property Photography Gallery</span>
            </h2>
            <p className="text-xs text-charcoal-muted">
              Authentic high-resolution images of your property. Uploaded to secure property storage.
            </p>
          </div>

          <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer transition-all">
            <Upload className="w-3.5 h-3.5 text-ukorange" />
            <span>{uploading ? 'Uploading...' : 'Upload New Photo'}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>

        {photos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {photos.map((url, idx) => (
              <div
                key={url}
                className="group relative h-36 rounded-2xl overflow-hidden border border-forest/15 bg-forest/5"
              >
                <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(url)}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-700 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                {idx === 0 && (
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-forest/90 text-white text-[10px] font-bold rounded-md">
                    Cover Photo
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-ivory-warm rounded-2xl border border-forest/10 space-y-2">
            <ImageIcon className="w-8 h-8 text-forest/40 mx-auto" />
            <p className="text-xs text-charcoal-muted">
              No photos currently listed. Upload authentic photographs of rooms and views.
            </p>
          </div>
        )}
      </div>

      {/* Section 3: Operational Details & Amenities */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
        <div>
          <h2 className="font-serif text-2xl font-bold text-forest">
            Operational Details & Guest Amenities
          </h2>
          <p className="text-xs text-charcoal-muted">
            These operational details can be updated without resetting your property publication status.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal-muted mb-1.5">
              Property Description & Mountain Experience
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 text-xs bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none leading-relaxed"
              placeholder="Describe your homestay, surroundings, organic meals, and mountain view..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-muted mb-2">
              Verified Amenities & Experiences
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {AMENITIES_LIST.map((item) => {
                const checked = amenities.includes(item);
                return (
                  <button
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

      {/* Section 4: Structural Identity & Location (With Clear Warning) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-300/80 shadow-soft space-y-6">
        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs">
          <ShieldAlert className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Core Structural Identity Notice:</span>
            <p>
              Modifying fundamental property details below (Name, Village, District, State, Address, or Property Type) automatically resets publication to <strong>Draft</strong> and triggers safety re-moderation by Uttarkunth administrators.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal-muted mb-1">
              Property Name
            </label>
            <input
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
            <select
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
            <input
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
            <input
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
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full p-2.5 text-xs bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-muted mb-1">
              Full Physical Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2.5 text-xs bg-ivory-warm border border-forest/20 rounded-xl focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-forest/10 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4 text-ukorange" />
            <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
