import { getPropertyPhotoList } from './property-images';

export type AmenityIconCategory =
  | 'wifi'
  | 'mountain'
  | 'meals'
  | 'tea'
  | 'parking'
  | 'balcony'
  | 'kitchen'
  | 'laundry'
  | 'pet'
  | 'water'
  | 'hike'
  | 'bonfire'
  | 'check';

export interface CategorizedAmenity {
  label: string;
  icon: AmenityIconCategory;
}

export interface QuickViewRoomItem {
  id: string;
  roomName: string;
  description: string;
  maxGuests: number;
  basePrice: number;
}

export interface PropertyQuickViewDetails {
  id: string;
  slug: string;
  name: string;
  href: string;
  propertyTypeLabel: string;
  locationLabel: string;
  fullLocationLabel: string;
  briefDescription: string;
  keyAmenities: CategorizedAmenity[];
  photos: string[];
  startingPrice: number;
  twoNightPrice: number;
  maxGuestsCapacity: number;
  roomCount: number;
  rooms: QuickViewRoomItem[];
  bookingModeLabel: string;
}

const DEFAULT_DESCRIPTION =
  'Authentic Himalayan accommodation with warm mountain hospitality, home-style meals, and tranquil valley views.';

export function classifyAmenityIcon(amenityLabel: string): AmenityIconCategory {
  const lower = (amenityLabel || '').toLowerCase().trim();
  if (lower.includes('wi-fi') || lower.includes('wifi') || lower.includes('internet')) {
    return 'wifi';
  }
  if (lower.includes('mountain') || lower.includes('view') || lower.includes('valley')) {
    return 'mountain';
  }
  if (
    lower.includes('breakfast') ||
    lower.includes('dinner') ||
    lower.includes('meal') ||
    lower.includes('food') ||
    lower.includes('thali')
  ) {
    return 'meals';
  }
  if (lower.includes('tea') || lower.includes('coffee') || lower.includes('chai')) {
    return 'tea';
  }
  if (lower.includes('parking') || lower.includes('car')) {
    return 'parking';
  }
  if (lower.includes('balcony') || lower.includes('terrace') || lower.includes('veranda')) {
    return 'balcony';
  }
  if (lower.includes('kitchen') || lower.includes('cooking')) {
    return 'kitchen';
  }
  if (lower.includes('laundry') || lower.includes('washing')) {
    return 'laundry';
  }
  if (lower.includes('pet') || lower.includes('dog')) {
    return 'pet';
  }
  if (lower.includes('hot water') || lower.includes('geyser') || lower.includes('heater')) {
    return 'water';
  }
  if (lower.includes('hike') || lower.includes('trek') || lower.includes('walk') || lower.includes('guide')) {
    return 'hike';
  }
  if (lower.includes('bonfire') || lower.includes('fire') || lower.includes('bukhari')) {
    return 'bonfire';
  }
  return 'check';
}

export function formatPropertyTypeLabel(rawType?: string | null): string {
  const cleaned = (rawType || '').toLowerCase().trim();
  switch (cleaned) {
    case 'homestay':
      return 'Homestay';
    case 'estate':
      return 'Heritage Estate';
    case 'cottage':
      return 'Mountain Cottage';
    case 'cabin':
      return 'Pine Cabin';
    case 'retreat':
      return 'Mountain Retreat';
    default:
      return 'Homestay';
  }
}

export function normalizeAmenitiesList(rawAmenities: unknown): CategorizedAmenity[] {
  let list: string[] = [];
  if (Array.isArray(rawAmenities)) {
    list = rawAmenities
      .map((item) => (typeof item === 'string' ? item.trim() : String(item || '').trim()))
      .filter(Boolean);
  } else if (typeof rawAmenities === 'string' && rawAmenities.trim()) {
    try {
      const parsed = JSON.parse(rawAmenities);
      if (Array.isArray(parsed)) {
        list = parsed.map((item) => String(item || '').trim()).filter(Boolean);
      } else {
        list = rawAmenities.split(',').map((s) => s.trim()).filter(Boolean);
      }
    } catch {
      list = rawAmenities.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }

  // Deduplicate while preserving order
  const seen = new Set<string>();
  const unique: CategorizedAmenity[] = [];
  for (const label of list) {
    const key = label.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push({
        label,
        icon: classifyAmenityIcon(label),
      });
    }
  }
  return unique;
}

export function normalizePropertyQuickView(property: Record<string, any>): PropertyQuickViewDetails {
  const id = String(property?.id || property?.slug || 'stay');
  const slug = String(property?.slug || property?.id || 'yash-home-stay');
  const name = String(property?.name || 'Himalayan Homestay').trim();
  const village = property?.village ? String(property.village).trim() : 'Jari';
  const district = property?.district ? String(property.district).trim() : 'Kullu';
  const state = property?.state ? String(property.state).trim() : 'Himachal Pradesh';

  const locationLabel = [village, district].filter(Boolean).join(', ');
  const fullLocationLabel = [village, district, state].filter(Boolean).join(', ');

  const rawDesc = typeof property?.description === 'string' ? property.description.trim() : '';
  const briefDescription = rawDesc.length > 0 ? rawDesc : DEFAULT_DESCRIPTION;

  const keyAmenities = normalizeAmenitiesList(property?.amenities);
  const photos = getPropertyPhotoList(property?.cover_photo, property?.photos);

  const rawRooms = Array.isArray(property?.rooms) ? property.rooms : [];
  const rooms: QuickViewRoomItem[] = rawRooms
    .filter((r: any) => r && r.active !== false)
    .map((r: any, idx: number) => ({
      id: String(r.id || `${id}-room-${idx + 1}`),
      roomName: String(r.room_name || r.name || `Mountain Room ${idx + 1}`).trim(),
      description: String(
        r.description || 'Comfortable mountain room with serene valley views and warm bedding.'
      ).trim(),
      maxGuests: Math.max(1, Number(r.max_guests) || 2),
      basePrice: Math.max(100, Number(r.base_price) || 900),
    }));

  const startingPrice =
    rooms.length > 0 ? Math.min(...rooms.map((r) => r.basePrice)) : 900;
  const maxGuestsCapacity =
    rooms.length > 0 ? Math.max(...rooms.map((r) => r.maxGuests)) : 2;
  const roomCount = Math.max(1, rooms.length);

  return {
    id,
    slug,
    name,
    href: `/stays/${slug}`,
    propertyTypeLabel: formatPropertyTypeLabel(property?.property_type),
    locationLabel,
    fullLocationLabel,
    briefDescription,
    keyAmenities,
    photos,
    startingPrice,
    twoNightPrice: startingPrice * 2,
    maxGuestsCapacity,
    roomCount,
    rooms,
    bookingModeLabel: 'Direct Host Payment • Request-Based Booking',
  };
}
