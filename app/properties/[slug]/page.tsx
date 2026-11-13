import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getProperty, getProperties } from '@/lib/properties-data';
import PropertyDetailClient from '@/components/property-detail-client';
import PropertySchema from '@/components/property-schema';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Property } from '@/types/property';

// Set ISR revalidation to 60 seconds
export const revalidate = 60;

// Tell Next.js to dynamically render on-demand if a slug wasn't pre-rendered at build time
export const dynamicParams = true;

/**
 * Generate static params for the most popular/default properties so they are fast on initial load.
 */
export async function generateStaticParams() {
  const properties = await getProperties();
  return properties.map((property) => ({
    slug: property.slug,
  }));
}

/**
 * Generate rich, dynamic SEO metadata for each individual property page.
 */
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const property = await getProperty(params.slug);

  if (!property) {
    return {
      title: 'Property Not Found | Uttarkunth',
      description: 'The requested stay or retreat could not be found.',
    };
  }

  const title = `${property.name} - ${property.location.village}, ${property.location.district} | Uttarkunth`;
  const description =
    property.short_description ||
    property.description.slice(0, 160) ||
    `Experience authentic Himalayan hospitality at ${property.name} in ${property.location.state}.`;

  const ogImages = property.images && property.images.length > 0
    ? property.images.map((img) => ({
        url: img.url,
        alt: img.alt || property.name,
      }))
    : [
        {
          url: '/assets/gaurav-negi-founder.webp',
          alt: property.name,
        },
      ];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://uttarkunth.com/properties/${property.slug}`,
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImages.map((img) => img.url),
    },
    alternates: {
      canonical: `https://uttarkunth.com/properties/${property.slug}`,
    },
  };
}

export default async function PropertyDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  // First attempt: read from static data / local store
  let property = await getProperty(params.slug);

  // If not found in static data OR to ensure live availability/pricing from Supabase, query Supabase
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const cookieStore = cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
          },
        }
      );

      // Clean the incoming slug to prevent query injection and handle aliases
      const rawSlug = params.slug.trim().toLowerCase();
      // Handle known aliases (e.g. yash-homestay vs yash-home-stay)
      const slugQuery = (rawSlug === 'yash-homestay' || rawSlug === 'yash-home-stay')
        ? 'yash-homestay,yash-home-stay'
        : rawSlug;

      // Fetch the stay record from Supabase
      const { data: dbStay, error: stayError } = await supabase
        .from('stays')
        .select(`
          *,
          stay_images (
            id,
            image_url,
            caption,
            display_order,
            is_cover
          ),
          rooms (
            id,
            name,
            description,
            price_per_night,
            capacity,
            room_type,
            available_count
          )
        `)
        .or(slugQuery.includes(',') 
          ? `slug.in.(${slugQuery})` 
          : `slug.eq.${slugQuery}`
        )
        .eq('is_active', true)
        .maybeSingle();

      if (!stayError && dbStay) {
        // Map Supabase stay record into our canonical Property interface
        const sortedImages = Array.isArray(dbStay.stay_images)
          ? [...dbStay.stay_images]
              .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
              .map((img, idx) => ({
                id: img.id || `img-${idx}`,
                url: img.image_url,
                alt: img.caption || `${dbStay.name} photo ${idx + 1}`,
                is_cover: img.is_cover || idx === 0,
              }))
          : [];

        // If local property has fallback images and DB had none, preserve local images
        const finalImages = sortedImages.length > 0 ? sortedImages : (property?.images || []);

        const mappedProperty: Property = {
          id: dbStay.id,
          name: dbStay.name,
          slug: dbStay.slug,
          description: dbStay.description || property?.description || '',
          short_description: dbStay.short_description || property?.short_description || '',
          property_type: dbStay.property_type || property?.property_type || 'homestay',
          rating: dbStay.rating ? Number(dbStay.rating) : (property?.rating || 4.8),
          review_count: dbStay.reviews_count ? Number(dbStay.reviews_count) : (property?.review_count || 12),
          starting_price: dbStay.starting_price_per_night ? Number(dbStay.starting_price_per_night) : (property?.starting_price || 1500),
          location: {
            village: dbStay.village || property?.location.village || 'Uttarakhand',
            district: dbStay.district || property?.location.district || 'Garhwal',
            state: dbStay.state || property?.location.state || 'Uttarakhand',
            country: 'India',
            coordinates: dbStay.latitude && dbStay.longitude ? {
              latitude: Number(dbStay.latitude),
              longitude: Number(dbStay.longitude),
            } : property?.location.coordinates,
            altitude: dbStay.altitude_meters ? Number(dbStay.altitude_meters) : property?.location.altitude,
            how_to_reach: property?.location.how_to_reach || {
              by_air: 'Jolly Grant Airport, Dehradun',
              by_train: 'Rishikesh / Haridwar Railway Station',
              by_road: 'Well connected via state highway and local village roads',
            },
          },
          host: {
            name: dbStay.host_name || property?.host.name || 'Local Host',
            story: dbStay.host_story || property?.host.story || 'A warm and welcoming local family eager to share Himalayan traditions.',
            languages_spoken: dbStay.host_languages || property?.host.languages_spoken || ['Hindi', 'Garhwali', 'English'],
            is_superhost: dbStay.is_superhost ?? property?.host.is_superhost ?? true,
          },
          amenities: Array.isArray(dbStay.amenities) && dbStay.amenities.length > 0 
            ? dbStay.amenities 
            : (property?.amenities || [
                'Free Wi-Fi',
                'Home-cooked Himalayan meals',
                'Mountain view',
                'Hot water',
                'Bonfire upon request',
              ]),
          experiences: Array.isArray(dbStay.experiences) && dbStay.experiences.length > 0
            ? dbStay.experiences
            : (property?.experiences || [
                {
                  id: 'exp-1',
                  title: 'Village Culture Walk & Farm Visit',
                  description: 'Stroll through organic terraced fields and meet local artisans.',
                  duration: '2 hours',
                  price: 0,
                  included_with_stay: true,
                },
                {
                  id: 'exp-2',
                  title: 'Himalayan Sunrise Ridge Hike',
                  description: 'Guided morning trek offering panoramic views of snow-capped peaks.',
                  duration: '3 hours',
                  price: 500,
                  included_with_stay: false,
                },
              ]),
          house_rules: Array.isArray(dbStay.house_rules) && dbStay.house_rules.length > 0
            ? dbStay.house_rules
            : (property?.house_rules || [
                'Check-in: 12:00 PM | Check-out: 11:00 AM',
                'Respect quiet mountain hours after 10:00 PM',
                'No smoking indoors',
                'Zero-waste & plastic-free zone: carry back non-biodegradable waste',
              ]),
          rooms: Array.isArray(dbStay.rooms) && dbStay.rooms.length > 0
            ? dbStay.rooms.map((rm) => ({
                id: rm.id,
                name: rm.name,
                description: rm.description || '',
                price: Number(rm.price_per_night),
                capacity: Number(rm.capacity) || 2,
                room_type: rm.room_type || 'standard',
                available: Number(rm.available_count) > 0,
                amenities: ['Attached washroom', 'Mountain view', 'Linen included'],
                images: finalImages.slice(0, 2),
              }))
            : (property?.rooms || [
                {
                  id: 'room-std-1',
                  name: 'Traditional Valley View Room',
                  description: 'Cozy authentic Himalayan wood-and-stone room overlooking the terraced valleys.',
                  price: dbStay.starting_price_per_night ? Number(dbStay.starting_price_per_night) : 1500,
                  capacity: 2,
                  room_type: 'private_room',
                  available: true,
                  amenities: ['Mountain View', 'Hot Water', 'Traditional Architecture', 'Clean Linen'],
                  images: finalImages.slice(0, 2),
                },
              ]),
          images: finalImages,
          created_at: dbStay.created_at || new Date().toISOString(),
          updated_at: dbStay.updated_at || new Date().toISOString(),
        };

        property = mappedProperty;
      }
    } catch (e) {
      console.warn('Error hydrating stay details from Supabase; using static data fallback:', e);
    }
  }

  // If still not resolved via either Supabase or static database
  if (!property) {
    notFound();
  }

  return (
    <>
      <PropertySchema property={property} />
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 border-4 border-[#2C4A3E] border-t-transparent rounded-full animate-spin" />
              <p className="text-[#2C4A3E] font-medium font-serif">
                Loading authentic Himalayan stay details...
              </p>
            </div>
          </div>
        }
      >
        <PropertyDetailClient property={property} />
      </Suspense>
    </>
  );
}
