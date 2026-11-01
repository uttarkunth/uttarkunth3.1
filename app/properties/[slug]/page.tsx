import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { EXISTING_PROPERTIES, BRAND } from '@/lib/constants';
import { BookingWidget } from '@/components/booking-widget';
import { MapPin, Users, CheckCircle2, ShieldCheck, Clock, Home, Sparkles, ChevronLeft, Wifi, Coffee, Utensils, Car } from 'lucide-react';

export const revalidate = 60;

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
    const supabase = createAdminClient();
    const { data: property, error } = await supabase
      .from('properties')
      .select('id, slug, name, description, address, village, district, state, property_type, booking_mode, amenities, photos, published, moderation_status')
      .eq('slug', slug)
      .eq('published', true)
      .eq('moderation_status', 'approved')
      .single();

    if (error || !property) {
      const fallback = EXISTING_PROPERTIES.find(p => p.slug === slug);
      return fallback || null;
    }

    const { data: rooms } = await supabase
      .from('room_units')
      .select('id, property_id, room_name, description, max_guests, base_price, active')
      .eq('property_id', property.id)
      .eq('active', true);

    return {
      ...property,
      rooms: rooms || []
    };
  } catch {
    const fallback = EXISTING_PROPERTIES.find(p => p.slug === slug);
    return fallback || null;
  }
}

export default async function PropertyDetailPage({ params, searchParams }: PropertyDetailPageProps) {
  const property = await getPropertyBySlug(params.slug);

  if (!property) {
    notFound();
  }

  const photos = Array.isArray(property.photos) ? property.photos : [];
  const primaryPhoto = photos[0] || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80';
  const secondaryPhotos = photos.slice(1);
  const amenitiesList = Array.isArray(property.amenities) ? property.amenities : [];
  const rooms = property.rooms || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Link */}
      <div>
        <Link
          href="/properties"
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
            Vetted Local Host
          </span>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-forest">
          {property.name}
        </h1>

        <p className="flex items-center gap-1.5 text-sm text-charcoal-muted">
          <MapPin className="w-4 h-4 text-ukorange flex-shrink-0" />
          <span>{property.address || `${property.village}, ${property.district}, ${property.state}, India`}</span>
        </p>
      </div>

      {/* Photo Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-3xl overflow-hidden shadow-soft max-h-[500px]">
        {/* Main Photo */}
        <div className="md:col-span-2 relative h-80 sm:h-96 md:h-[480px]">
          <Image
            src={primaryPhoto}
            alt={property.name}
            fill
            sizes="(max-width: 768px) 100vw, 66vw"
            className="object-cover"
            priority
          />
        </div>

        {/* Side Photos */}
        <div className="hidden md:flex flex-col gap-3 h-[480px]">
          {secondaryPhotos.slice(0, 2).map((photoUrl, idx) => (
            <div key={idx} className="relative flex-1 overflow-hidden">
              <Image
                src={photoUrl}
                alt={`${property.name} view ${idx + 2}`}
                fill
                sizes="33vw"
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
            <h2 className="font-serif text-2xl font-bold text-forest">Room Types & Inventory</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rooms.map(room => (
                <div key={room.id} className="p-5 bg-white rounded-2xl border border-forest/15 shadow-sm space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-forest">{room.room_name}</h3>
                      <span className="text-xs text-charcoal-muted flex items-center gap-1 mt-0.5">
                        <Users className="w-3.5 h-3.5 text-ukorange" />
                        Max {room.max_guests} Guests
                      </span>
                    </div>
                    <span className="font-serif text-xl font-bold text-forest">
                      ₹{Number(room.base_price)}
                      <span className="text-xs text-charcoal-muted font-sans font-normal"> / night</span>
                    </span>
                  </div>
                  {room.description && (
                    <p className="text-xs text-charcoal-muted leading-relaxed">
                      {room.description}
                    </p>
                  )}
                  <div className="pt-2 text-[11px] font-medium text-forest flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-ukorange" />
                    Clean linens & mountain views included
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-4 pb-8 border-b border-forest/10">
            <h2 className="font-serif text-2xl font-bold text-forest">Amenities & Stays Features</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {amenitiesList.map((amenity: string) => (
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
                <span className="text-xs text-charcoal-muted">Verified Partner of {BRAND.name}</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-charcoal leading-relaxed">
              Our hosts in Jari are native mountain residents who take genuine pride in opening their homes to travelers. You will enjoy peaceful valley views, home-cooked local meals, and direct cultural exchange.
            </p>
          </div>

          {/* Stay Rules & Cancellation Policy */}
          <div className="space-y-4 pb-8 border-b border-forest/10 text-xs text-charcoal-muted leading-relaxed">
            <h2 className="font-serif text-2xl font-bold text-forest text-charcoal">House Rules & Stay Policy</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>Check-in: 12:00 PM onwards • Check-out: strictly before 11:00 AM.</li>
              <li>Host Approval: Every booking request is personally reviewed by the host before confirmation.</li>
              <li>Cancellation: Free cancellation for pending requests. For confirmed stays, cancellation is permitted online prior to check-in day.</li>
              <li>Respectful Tourism: Parvati Valley is a sacred, fragile mountain ecosystem. Loud outdoor music is prohibited after 9:00 PM.</li>
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
          />
        </div>
      </div>
    </div>
  );
}
