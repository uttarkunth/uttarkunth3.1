import React from 'react';
import { PropertyImage, getPropertyPhotoList } from '@/components/property-image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createPublicServerSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { BRAND } from '@/lib/constants';
import { BookingWidget } from '@/components/booking-widget';
import { RoomAvailabilityCalendar } from '@/components/stays/room-availability-calendar';
import { MapPin, Users, CheckCircle2, ShieldCheck, Clock, Home, Sparkles, ChevronLeft, Wifi, Coffee, Utensils, Car, Image as ImageIcon } from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const property = await getPropertyBySlug(params.slug);
  if (!property) {
    return {
      title: `Stay Not Found — ${BRAND.name}`,
    };
  }
  return {
    title: `${property.name} — Mountain Stay in ${property.village || 'Jari'}, ${property.district || 'Kullu'} — ${BRAND.name}`,
    description: property.description?.slice(0, 160) || `Stay at ${property.name} in Himachal Pradesh. No online payment is currently collected by Uttarkunth. Guests pay their hosts directly at the property.`,
  };
}

interface PropertyDetailPageProps {
  params: {
    slug: string;
  };
  searchParams: {
    checkIn?: string;
    checkOut?: string;
    guests?: string;
  };
}

async function getPropertyBySlug(slug: string) {
  try {
    const supabase = createPublicServerSupabaseClient();
    const { data: property, error } = await supabase
      .from('properties')
      .select('id, slug, name, description, village, district, state, property_type, booking_mode, amenities, photos, cover_photo, published, moderation_status')
      .eq('slug', slug)
      .eq('published', true)
      .eq('moderation_status', 'approved')
      .single();

    if (error || !property) {
      return null;
    }

    const { data: rooms } = await supabase
      .from('room_units')
      .select('id, property_id, room_name, description, max_guests, base_price, attached_washroom, view_type, bed_type, features, photos, active')
      .eq('property_id', property.id)
      .eq('active', true)
      .order('sort_order', { ascending: true });

    return {
      ...property,
      rooms: rooms || []
    };
  } catch {
    return null;
  }
}

async function getRelatedStays(currentId: string) {
  try {
    const supabase = createPublicServerSupabaseClient();
    const { data: properties } = await supabase
      .from('properties')
      .select('id, slug, name, description, village, district, state, property_type, amenities, photos, cover_photo')
      .eq('published', true)
      .eq('moderation_status', 'approved')
      .neq('id', currentId)
      .limit(2);

    return properties || [];
  } catch {
    return [];
  }
}

export default async function PropertyDetailPage({ params, searchParams }: PropertyDetailPageProps) {
  const property = await getPropertyBySlug(params.slug);

  if (!property) {
    notFound();
  }

  const relatedStays = await getRelatedStays(property.id);

  const photos = getPropertyPhotoList(property.cover_photo, property.photos);
  const primaryPhoto = photos[0] || '';
  const secondaryPhotos = photos.slice(1);
  const amenitiesList = Array.isArray(property.amenities) ? (property.amenities as unknown as string[]) : [];
  const rooms = property.rooms || [];

  let currentUser = null;
  try {
    const userClient = createServerSupabaseClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (user) {
      currentUser = {
        name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        email: user.email || '',
        phone: user.user_metadata?.phone || user.phone || '',
      };
    }
  } catch {
    currentUser = null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Link */}
      <div>
        <Link
          href="/stays"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-muted hover:text-forest transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to All Stays</span>
        </Link>
      </div>

      {/* Property Header */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-0.5 bg-forest/10 text-forest text-xs font-bold uppercase rounded-full">
            {property.property_type === 'homestay' ? 'Authentic Homestay' : 'Mountain Retreat'}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-ukorange/10 text-ukorange text-xs font-semibold rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved Local Host
          </span>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-forest">
          {property.name}
        </h1>

        <p className="flex items-center gap-1.5 text-sm text-charcoal-muted">
          <MapPin className="w-4 h-4 text-ukorange flex-shrink-0" />
          <span>{`${property.village}, ${property.district}, ${property.state}, India`}</span>
        </p>
      </div>

      {/* Photo Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-3xl overflow-hidden shadow-soft max-h-[500px]">
        {/* Main Photo */}
        <div className="md:col-span-2 relative h-80 sm:h-96 md:h-[480px]">
          {primaryPhoto ? (
            <PropertyImage
              src={primaryPhoto}
              alt={property.name}
              fill
              sizes="(max-width: 768px) 100vw, 66vw"
              transformWidth={1200}
              transformHeight={800}
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-forest-dark text-ivory/70">
              <ImageIcon className="w-12 h-12" />
              <span className="text-sm">Property photographs coming soon</span>
            </div>
          )}
        </div>

        {/* Side Photos */}
        <div className="hidden md:flex flex-col gap-3 h-[480px]">
          {secondaryPhotos.slice(0, 2).map((photoUrl, idx) => (
            <div key={idx} className="relative flex-1 overflow-hidden">
              <PropertyImage
                src={photoUrl}
                alt={property.name + ' view ' + (idx + 2)}
                fill
                sizes="33vw"
                transformWidth={600}
                transformHeight={400}
                className="object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          ))}
          {secondaryPhotos.length === 0 && (
            <div className="relative flex-1 bg-ivory-warm flex items-center justify-center p-6 text-center text-xs text-charcoal-muted">
              <span>Serene mountain surroundings in Jari</span>
            </div>
          )}
        </div>
      </div>

      {/* Content & Booking Widget Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-4">
        {/* Main Details Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-10">
          {/* Overview */}
          <div className="space-y-4 pb-8 border-b border-forest/10">
            <h2 className="font-serif text-2xl font-bold text-forest">About This Stay</h2>
            <p className="text-sm sm:text-base text-charcoal leading-relaxed whitespace-pre-line font-sans">
              {property.description}
            </p>
          </div>

          {/* Room Units & Accommodations */}
          <div className="space-y-4 pb-8 border-b border-forest/10">
            <h2 className="font-serif text-2xl font-bold text-forest">Room Types &amp; Inventory</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rooms.map((roomItem) => {
                const room = roomItem as any;
                return (
                  <div key={room.id} className="p-5 bg-white rounded-2xl border border-forest/15 shadow-sm space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-serif text-lg font-bold text-forest">{room.room_name}</h3>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="text-[11px] text-charcoal-muted flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-ukorange" />
                              Max {room.max_guests} Guests
                            </span>
                            {room.attached_washroom !== undefined && (
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${room.attached_washroom ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}`}>
                                {room.attached_washroom ? 'Attached Washroom' : 'Shared Washroom'}
                              </span>
                            )}
                            {room.view_type && room.view_type !== 'none' && (
                              <span className="px-2 py-0.5 text-[10px] font-semibold bg-sky-100 text-sky-800 rounded-full capitalize">
                                {room.view_type} View
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="font-serif text-xl font-bold text-forest whitespace-nowrap">
                          ₹{Number(room.base_price)}
                          <span className="text-xs text-charcoal-muted font-sans font-normal"> / night</span>
                        </span>
                      </div>
                      {room.description && (
                        <p className="text-xs text-charcoal-muted leading-relaxed">
                          {room.description}
                        </p>
                      )}
                    </div>
                    <div className="pt-2 text-[11px] font-medium text-forest flex items-center gap-1 border-t border-forest/5">
                      <CheckCircle2 className="w-3 h-3 text-ukorange" />
                      <span>{room.bed_type || 'Double Bed'} • Clean mountain linens included</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Room Availability Calendar */}
          <RoomAvailabilityCalendar
            propertyId={property.id}
            propertyName={property.name}
            rooms={rooms as any}
          />

          {/* Amenities */}
          <div className="space-y-4 pb-8 border-b border-forest/10">
            <h2 className="font-serif text-2xl font-bold text-forest">Amenities & Stays Features</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {amenitiesList.map((amenity: any) => (
                <div key={amenity} className="flex items-center gap-2 p-3 bg-white rounded-xl border border-forest/10 text-xs font-medium text-charcoal">
                  <CheckCircle2 className="w-4 h-4 text-ukorange flex-shrink-0" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Host Story & Himalayan Hospitality */}
          <div className="p-6 bg-ivory-warm rounded-2xl border border-forest/15 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-forest text-ivory flex items-center justify-center font-serif text-xl font-bold">
                U
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-forest">Local Himalayan Host</h3>
                <span className="text-xs text-charcoal-muted">Approved Host Partner of {BRAND.name}</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-charcoal leading-relaxed">
              Our hosts in Jari are native mountain residents who take genuine pride in opening their homes to travelers. You will enjoy peaceful valley views, home-cooked local meals, and direct cultural exchange.
            </p>
          </div>

          {/* General Location & Privacy Policy */}
          <div className="space-y-2 pb-8 border-b border-forest/10">
            <h2 className="font-serif text-2xl font-bold text-forest flex items-center gap-2">
              <MapPin className="w-5 h-5 text-ukorange" />
              <span>Location &amp; Arrival Privacy</span>
            </h2>
            <p className="text-sm font-semibold text-charcoal">
              {[property.village, property.district, property.state].filter(Boolean).join(', ')}
            </p>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              To protect host and guest privacy, the exact property address, local landmarks, and direct Google Maps navigation link are shared exclusively inside your trip itinerary once your booking is confirmed.
            </p>
          </div>

          {/* Stay Rules & Cancellation Policy */}
          <div className="space-y-4 pb-8 border-b border-forest/10 text-xs text-charcoal-muted leading-relaxed">
            <h2 className="font-serif text-2xl font-bold text-forest text-charcoal">House Rules & Stay Policy</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>Check-in: 12:00 PM onwards • Check-out: strictly before 11:00 AM.</li>
              <li>Host Approval: Every booking request is personally reviewed by the host before confirmation.</li>
              <li>Cancellation: Free cancellation for pending requests. For confirmed stays, cancellation is permitted online prior to check-in day.</li>
              <li>Respectful Tourism: The Himalayas are a sacred, fragile mountain ecosystem. Loud outdoor music is prohibited after 9:30 PM.</li>
            </ul>
          </div>
        </div>

        {/* Sticky Booking Widget Column (1 Col) */}
        <div>
          <BookingWidget
            propertyId={property.id}
            propertyName={property.name}
            rooms={rooms}
            initialCheckIn={searchParams.checkIn}
            initialCheckOut={searchParams.checkOut}
            initialGuests={searchParams.guests ? parseInt(searchParams.guests, 10) : 2}
            currentUser={currentUser}
          />
        </div>
      </div>

      {/* Related Real Stays (Directive C) */}
      {relatedStays.length > 0 && (
        <div className="pt-12 border-t border-forest/15 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-ukorange uppercase tracking-wider">
                Explore More in Parvati Valley
              </span>
              <h2 className="font-serif text-3xl font-bold text-forest mt-1">
                Other Authentic Himalayan Stays
              </h2>
            </div>
            <Link
              href="/stays"
              className="text-xs font-bold text-forest hover:text-ukorange transition-colors"
            >
              All Stays →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {relatedStays.map((rel: any) => {
              const relPhoto = getPropertyPhotoList(rel.cover_photo, rel.photos)[0] || null;
              return (
                <div
                  key={rel.id}
                  className="bg-white rounded-3xl border border-forest/15 overflow-hidden shadow-soft hover:shadow-lifted transition-all flex flex-col group"
                >
                  <div className="relative aspect-[3/2] bg-forest-dark overflow-hidden">
                    {relPhoto ? (
                      <PropertyImage
                        src={relPhoto}
                        alt={rel.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        transformWidth={600}
                        transformHeight={400}
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-forest-dark text-ivory/70">
                        <ImageIcon className="w-9 h-9" />
                        <span className="text-xs">Property photographs coming soon</span>
                      </div>
                    )}
                    <span className="absolute top-3 left-3 bg-forest/90 text-ivory text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      {rel.property_type || 'Homestay'}
                    </span>
                  </div>
                  <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-xs text-ukorange font-semibold">
                        📍 {rel.village || 'Jari'}, {rel.district || 'Kullu'}
                      </div>
                      <h3 className="font-serif text-xl font-bold text-forest mt-1">
                        {rel.name}
                      </h3>
                      <p className="text-xs text-charcoal-muted line-clamp-2 mt-1">
                        {rel.description}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-forest/10 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Request-Based Booking
                      </span>
                      <Link
                        href={`/stays/${rel.slug}`}
                        className="text-xs font-bold text-forest hover:text-ukorange"
                      >
                        View Stay Details →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
