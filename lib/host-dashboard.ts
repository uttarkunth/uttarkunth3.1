export function calculateNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(`${checkIn.slice(0, 10)}T00:00:00Z`);
  const end = new Date(`${checkOut.slice(0, 10)}T00:00:00Z`);
  const diffMs = end.getTime() - start.getTime();
  if (!Number.isFinite(diffMs) || diffMs <= 0) return 0;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export interface HostPropertyRoomRecord {
  id: string;
  property_id?: string;
  room_name?: string;
  name?: string;
  max_guests?: number | null;
  capacity?: number | null;
  total_rooms?: number | null;
  base_price?: number | null;
  price_per_night?: number | null;
  active?: boolean | null;
  is_active?: boolean | null;
}

export interface HostPropertyRecord {
  id: string;
  name?: string;
  title?: string;
  slug: string;
  property_type?: string | null;
  type?: string | null;
  short_description?: string | null;
  description?: string | null;
  village?: string | null;
  district?: string | null;
  state?: string | null;
  address?: string | null;
  exact_address?: string | null;
  google_maps_url?: string | null;
  location_confirmed?: boolean | null;
  moderation_status?: string | null;
  approval_status?: string | null;
  status?: string | null;
  published?: boolean | null;
  is_published?: boolean | null;
  photos?: string[] | null;
  cover_photo?: string | null;
  cover_image?: string | null;
  host_role?: string | null;
  host_id?: string | null;
  contact_phone?: string | null;
  contact_whatsapp?: string | null;
  contact_email?: string | null;
  notify_email?: boolean | null;
  notify_whatsapp?: boolean | null;
  room_units?: HostPropertyRoomRecord[] | null;
  rooms?: HostPropertyRoomRecord[] | null;
}

export interface HostBookingRecord {
  id: string;
  booking_reference?: string | null;
  property_id: string;
  room_unit_id?: string;
  room_id?: string;
  guest_name: string;
  guest_email?: string | null;
  guest_phone: string;
  adults?: number | null;
  children?: number | null;
  guests_count?: number | null;
  check_in: string;
  check_out: string;
  total_estimate?: number | null;
  total_price?: number | null;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'declined' | 'rejected' | 'completed' | string;
  booking_status?: 'pending' | 'confirmed' | 'cancelled' | 'declined' | 'rejected' | 'completed' | string;
  special_requests?: string | null;
  host_notes?: string | null;
  created_at: string;
  properties?: {
    id?: string;
    name?: string;
    title?: string;
    slug?: string;
    village?: string | null;
    district?: string | null;
  } | null;
  room_units?: {
    id?: string;
    room_name?: string;
    base_price?: number | null;
  } | null;
  rooms?: {
    id?: string;
    name?: string;
    price_per_night?: number | null;
  } | null;
}

export interface HostAvailabilityBlockRecord {
  id: string;
  room_unit_id?: string;
  room_id?: string;
  blocked_from?: string;
  blocked_until?: string;
  start_date?: string;
  end_date?: string;
  blocked_count?: number | null;
  reason?: string | null;
  created_at?: string;
  room_units?: {
    id?: string;
    room_name?: string;
    property_id: string;
    properties?: {
      name?: string;
      title?: string;
    } | null;
  } | null;
  rooms?: {
    id?: string;
    name?: string;
    property_id: string;
    properties?: {
      name?: string;
      title?: string;
    } | null;
  } | null;
}

export interface HostReviewRecord {
  id: string;
  property_id?: string;
  entity_id?: string;
  reviewer_name?: string | null;
  rating: number;
  comment?: string | null;
  moderation_status?: string | null;
  created_at: string;
  properties?: {
    name?: string;
    title?: string;
  } | null;
}

export interface HostDashboardKpis {
  totalPropertiesCount: number;
  activePropertiesCount: number;
  totalRoomUnitsCount: number;
  pendingRequestsCount: number;
  confirmedStaysCount: number;
  completedStaysCount: number;
  declinedOrCancelledCount: number;
  bookedRoomNights: number;
  estimatedConfirmedValue: number;
  upcomingArrivalsCount: number;
}

export interface OccupancySnapshot {
  monthLabel: string;
  bookedRoomNights: number;
  totalAvailableRoomNights: number;
  occupancyPercent: number;
  pendingRequestsCount: number;
}

export interface ActivityBarPoint {
  label: string;
  confirmedCount: number;
  pendingCount: number;
  totalCount: number;
  heightPercent: number;
}

export interface StayScheduleItem {
  id: string;
  bookingRef: string;
  guestName: string;
  guestPhone: string;
  guestsCount: number;
  propertyTitle: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  scheduleType: 'in_house' | 'arriving_soon' | 'departing_soon' | 'upcoming';
  badgeLabel: string;
  dateSummary: string;
  booking: HostBookingRecord;
}

export interface ListingQualityItem {
  id: string;
  title: string;
  description: string;
  statusLabel: string;
  isComplete: boolean;
}

export interface ReviewDistributionSummary {
  averageRating: number;
  totalReviews: number;
  countsByStar: Record<1 | 2 | 3 | 4 | 5, number>;
  percentagesByStar: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface CalendarDayEvent {
  id: string;
  kind: 'confirmed' | 'pending' | 'blocked';
  title: string;
  subtitle: string;
  propertyId: string;
  propertyTitle: string;
  roomId: string;
  roomName: string;
  startDate: string;
  endDate: string;
  statusBadge: string;
  guestPhone?: string;
  guestsCount?: number;
  totalPrice?: number | null;
  booking?: HostBookingRecord;
  block?: HostAvailabilityBlockRecord;
}

export interface MonthlyValuePoint {
  monthKey: string;
  label: string;
  confirmedValue: number;
  confirmedStays: number;
  roomNights: number;
}

export function getPropertyDisplayName(prop?: HostPropertyRecord | null): string {
  if (!prop) return 'Homestay';
  return prop.name || prop.title || 'Homestay';
}

export function getPropertyRooms(prop?: HostPropertyRecord | null): HostPropertyRoomRecord[] {
  if (!prop) return [];
  if (Array.isArray(prop.room_units)) return prop.room_units;
  if (Array.isArray(prop.rooms)) return prop.rooms;
  return [];
}

export function getRoomDisplayName(room?: HostPropertyRoomRecord | null): string {
  if (!room) return 'Room Unit';
  return room.room_name || room.name || 'Room Unit';
}

export function getRoomNightlyRate(room?: HostPropertyRoomRecord | null): number {
  if (!room) return 0;
  return Number(room.base_price ?? room.price_per_night ?? 0) || 0;
}

export function getRoomMaxGuests(room?: HostPropertyRoomRecord | null): number {
  if (!room) return 2;
  return Number(room.max_guests ?? room.capacity ?? 2) || 2;
}

export function isRoomActive(room?: HostPropertyRoomRecord | null): boolean {
  if (!room) return false;
  if (typeof room.active === 'boolean') return room.active;
  if (typeof room.is_active === 'boolean') return room.is_active;
  return true;
}

export function isPropertyLive(prop?: HostPropertyRecord | null): boolean {
  if (!prop) return false;
  if (typeof prop.published === 'boolean') return prop.published;
  if (typeof prop.is_published === 'boolean') return prop.is_published;
  return prop.moderation_status === 'approved' || prop.approval_status === 'approved';
}

export function getPropertyCoverPhoto(prop?: HostPropertyRecord | null): string {
  if (!prop) return 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80';
  if (prop.cover_photo) return prop.cover_photo;
  if (prop.cover_image) return prop.cover_image;
  if (Array.isArray(prop.photos) && prop.photos.length > 0 && prop.photos[0]) {
    return prop.photos[0];
  }
  return 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80';
}

export function getPropertyPhotosCount(prop?: HostPropertyRecord | null): number {
  if (!prop) return 0;
  if (Array.isArray(prop.photos)) return prop.photos.filter(Boolean).length;
  return prop.cover_photo || prop.cover_image ? 1 : 0;
}

export function getPropertyStartingRate(prop?: HostPropertyRecord | null): number {
  const rooms = getPropertyRooms(prop).filter(isRoomActive);
  const rates = rooms.map(getRoomNightlyRate).filter((r) => r > 0);
  if (rates.length === 0) return 0;
  return Math.min(...rates);
}

export function getBookingStatus(booking: HostBookingRecord): string {
  const raw = (booking.status || booking.booking_status || 'pending').toLowerCase();
  if (raw === 'rejected') return 'declined';
  return raw;
}

export function getBookingRoomId(booking: HostBookingRecord): string {
  return booking.room_unit_id || booking.room_id || '';
}

export function getBookingPropertyTitle(booking: HostBookingRecord): string {
  return booking.properties?.name || booking.properties?.title || 'Homestay';
}

export function getBookingRoomName(booking: HostBookingRecord): string {
  return booking.room_units?.room_name || booking.rooms?.name || 'Room Unit';
}

export function getBookingGuestCount(booking: HostBookingRecord): number {
  if (typeof booking.guests_count === 'number' && booking.guests_count > 0) {
    return booking.guests_count;
  }
  const adults = Number(booking.adults ?? 1) || 1;
  const children = Number(booking.children ?? 0) || 0;
  return Math.max(1, adults + children);
}

export function formatBookingReference(bookingOrId: HostBookingRecord | string): string {
  if (typeof bookingOrId === 'object' && bookingOrId !== null) {
    if (bookingOrId.booking_reference) {
      const ref = bookingOrId.booking_reference.trim();
      return ref.startsWith('UTK-') || ref.startsWith('#') ? ref : `#${ref}`;
    }
    const cleanId = (bookingOrId.id || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return `UTK-${cleanId.slice(0, 6) || 'STAY'}`;
  }
  const clean = (bookingOrId || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return `UTK-${clean.slice(0, 6) || 'STAY'}`;
}

export function formatInrCurrency(amount: number | null | undefined): string {
  const numeric = typeof amount === 'number' && Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0;
  return `₹${numeric.toLocaleString('en-IN')}`;
}

export function filterRecordsByProperty<T extends { property_id?: string }>(
  records: T[],
  selectedPropertyId: string | null | undefined
): T[] {
  if (!selectedPropertyId || selectedPropertyId === 'all') {
    return records;
  }
  return records.filter((item) => item.property_id === selectedPropertyId);
}

export function filterBlocksByProperty(
  blocks: HostAvailabilityBlockRecord[],
  selectedPropertyId: string | null | undefined
): HostAvailabilityBlockRecord[] {
  if (!selectedPropertyId || selectedPropertyId === 'all') {
    return blocks;
  }
  return blocks.filter((block) => {
    const propId = block.room_units?.property_id || block.rooms?.property_id;
    return propId === selectedPropertyId;
  });
}

export function filterReviewsByProperty(
  reviews: HostReviewRecord[],
  selectedPropertyId: string | null | undefined
): HostReviewRecord[] {
  if (!selectedPropertyId || selectedPropertyId === 'all') {
    return reviews;
  }
  return reviews.filter((review) => (review.property_id || review.entity_id) === selectedPropertyId);
}

export function getBookingNights(booking: Pick<HostBookingRecord, 'check_in' | 'check_out'>): number {
  const nights = calculateNights(booking.check_in, booking.check_out);
  return nights > 0 ? nights : 1;
}

export function getBookingEstimatedValue(booking: HostBookingRecord): number {
  const est = Number(booking.total_estimate ?? booking.total_price ?? 0);
  if (Number.isFinite(est) && est > 0) {
    return Math.round(est);
  }
  const rate = Number(booking.room_units?.base_price ?? booking.rooms?.price_per_night ?? 0);
  if (rate > 0) {
    return Math.round(rate * getBookingNights(booking));
  }
  return 0;
}

export function computeHostDashboardKpis(
  properties: HostPropertyRecord[],
  bookings: HostBookingRecord[],
  selectedPropertyId: string = 'all',
  referenceDateStr?: string
): HostDashboardKpis {
  const scopedProperties =
    !selectedPropertyId || selectedPropertyId === 'all'
      ? properties
      : properties.filter((p) => p.id === selectedPropertyId);
  const scopedBookings = filterRecordsByProperty(bookings, selectedPropertyId);

  const todayIso = referenceDateStr || new Date().toISOString().split('T')[0];

  const activePropertiesCount = scopedProperties.filter(isPropertyLive).length;

  let totalRoomUnitsCount = 0;
  for (const prop of scopedProperties) {
    for (const room of getPropertyRooms(prop)) {
      if (isRoomActive(room)) {
        totalRoomUnitsCount += Math.max(1, Number(room.total_rooms ?? 1));
      }
    }
  }

  let pendingRequestsCount = 0;
  let confirmedStaysCount = 0;
  let completedStaysCount = 0;
  let declinedOrCancelledCount = 0;
  let bookedRoomNights = 0;
  let estimatedConfirmedValue = 0;
  let upcomingArrivalsCount = 0;

  for (const b of scopedBookings) {
    const status = getBookingStatus(b);
    const nights = getBookingNights(b);
    const val = getBookingEstimatedValue(b);

    if (status === 'pending') {
      pendingRequestsCount += 1;
    } else if (status === 'confirmed') {
      confirmedStaysCount += 1;
      bookedRoomNights += nights;
      estimatedConfirmedValue += val;
      if (b.check_in >= todayIso) {
        upcomingArrivalsCount += 1;
      }
    } else if (status === 'completed') {
      completedStaysCount += 1;
      bookedRoomNights += nights;
      estimatedConfirmedValue += val;
    } else if (status === 'declined' || status === 'cancelled') {
      declinedOrCancelledCount += 1;
    }
  }

  return {
    totalPropertiesCount: scopedProperties.length,
    activePropertiesCount,
    totalRoomUnitsCount,
    pendingRequestsCount,
    confirmedStaysCount,
    completedStaysCount,
    declinedOrCancelledCount,
    bookedRoomNights,
    estimatedConfirmedValue,
    upcomingArrivalsCount,
  };
}

export function computeOccupancySnapshot(
  properties: HostPropertyRecord[],
  bookings: HostBookingRecord[],
  selectedPropertyId: string = 'all',
  referenceDate: Date = new Date()
): OccupancySnapshot {
  const scopedProperties =
    !selectedPropertyId || selectedPropertyId === 'all'
      ? properties
      : properties.filter((p) => p.id === selectedPropertyId);
  const scopedBookings = filterRecordsByProperty(bookings, selectedPropertyId);

  const year = referenceDate.getUTCFullYear();
  const monthIndex = referenceDate.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const monthStartStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
  const monthEndExclusiveDate = new Date(Date.UTC(year, monthIndex + 1, 1));
  const monthEndExclusiveStr = monthEndExclusiveDate.toISOString().split('T')[0];

  let activeUnits = 0;
  for (const prop of scopedProperties) {
    for (const room of getPropertyRooms(prop)) {
      if (isRoomActive(room)) {
        activeUnits += Math.max(1, Number(room.total_rooms ?? 1));
      }
    }
  }

  const totalAvailableRoomNights = activeUnits * daysInMonth;
  let bookedRoomNights = 0;
  let pendingRequestsCount = 0;

  for (const b of scopedBookings) {
    const status = getBookingStatus(b);
    if (status === 'pending') {
      pendingRequestsCount += 1;
      continue;
    }
    if (status !== 'confirmed' && status !== 'completed') {
      continue;
    }
    const overlapStart = b.check_in > monthStartStr ? b.check_in : monthStartStr;
    const overlapEnd = b.check_out < monthEndExclusiveStr ? b.check_out : monthEndExclusiveStr;
    if (overlapEnd > overlapStart) {
      bookedRoomNights += calculateNights(overlapStart, overlapEnd);
    }
  }

  const monthLabel = referenceDate.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

  const occupancyPercent =
    totalAvailableRoomNights > 0
      ? Math.min(100, Math.round((bookedRoomNights / totalAvailableRoomNights) * 100))
      : 0;

  return {
    monthLabel,
    bookedRoomNights,
    totalAvailableRoomNights,
    occupancyPercent,
    pendingRequestsCount,
  };
}

export function computeBookingActivitySeries(
  bookings: HostBookingRecord[],
  period: '7d' | '30d' | '90d',
  selectedPropertyId: string = 'all',
  referenceDate: Date = new Date()
): ActivityBarPoint[] {
  const scoped = filterRecordsByProperty(bookings, selectedPropertyId);
  const buckets: { label: string; startIso: string; endIso: string; confirmed: number; pending: number }[] = [];

  const refUtc = new Date(
    Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate())
  );

  if (period === '7d') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(refUtc);
      d.setUTCDate(d.getUTCDate() - i);
      const iso = d.toISOString().split('T')[0];
      const next = new Date(d);
      next.setUTCDate(next.getUTCDate() + 1);
      const label = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
      buckets.push({
        label,
        startIso: iso,
        endIso: next.toISOString().split('T')[0],
        confirmed: 0,
        pending: 0,
      });
    }
  } else if (period === '30d') {
    for (let i = 5; i >= 0; i--) {
      const end = new Date(refUtc);
      end.setUTCDate(end.getUTCDate() - i * 5 + 1);
      const start = new Date(end);
      start.setUTCDate(start.getUTCDate() - 5);
      const label = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
      buckets.push({
        label,
        startIso: start.toISOString().split('T')[0],
        endIso: end.toISOString().split('T')[0],
        confirmed: 0,
        pending: 0,
      });
    }
  } else {
    for (let i = 5; i >= 0; i--) {
      const end = new Date(refUtc);
      end.setUTCDate(end.getUTCDate() - i * 15 + 1);
      const start = new Date(end);
      start.setUTCDate(start.getUTCDate() - 15);
      const label = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
      buckets.push({
        label,
        startIso: start.toISOString().split('T')[0],
        endIso: end.toISOString().split('T')[0],
        confirmed: 0,
        pending: 0,
      });
    }
  }

  for (const b of scoped) {
    const status = getBookingStatus(b);
    const dateKey = (b.check_in || b.created_at || '').slice(0, 10);
    if (!dateKey) continue;
    for (const bucket of buckets) {
      if (dateKey >= bucket.startIso && dateKey < bucket.endIso) {
        if (status === 'confirmed' || status === 'completed') {
          bucket.confirmed += getBookingNights(b);
        } else if (status === 'pending') {
          bucket.pending += getBookingNights(b);
        }
        break;
      }
    }
  }

  const maxTotal = Math.max(1, ...buckets.map((b) => b.confirmed + b.pending));

  return buckets.map((b) => {
    const totalCount = b.confirmed + b.pending;
    const heightPercent = totalCount === 0 ? 12 : Math.max(20, Math.round((totalCount / maxTotal) * 100));
    return {
      label: b.label,
      confirmedCount: b.confirmed,
      pendingCount: b.pending,
      totalCount,
      heightPercent,
    };
  });
}

export function computeMonthlyValueSeries(
  bookings: HostBookingRecord[],
  monthsCount: 3 | 6 | 12 = 6,
  selectedPropertyId: string = 'all',
  referenceDate: Date = new Date()
): MonthlyValuePoint[] {
  const scoped = filterRecordsByProperty(bookings, selectedPropertyId);
  const points: MonthlyValuePoint[] = [];

  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth() - i, 1));
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const monthKey = `${year}-${month}`;
    const label = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
    points.push({
      monthKey,
      label,
      confirmedValue: 0,
      confirmedStays: 0,
      roomNights: 0,
    });
  }

  for (const b of scoped) {
    const status = getBookingStatus(b);
    if (status !== 'confirmed' && status !== 'completed') continue;
    const monthKey = (b.check_in || b.created_at || '').slice(0, 7);
    const target = points.find((p) => p.monthKey === monthKey);
    if (target) {
      target.confirmedValue += getBookingEstimatedValue(b);
      target.confirmedStays += 1;
      target.roomNights += getBookingNights(b);
    }
  }

  return points;
}

export function computeStaySchedule(
  bookings: HostBookingRecord[],
  selectedPropertyId: string = 'all',
  referenceDateStr?: string
): StayScheduleItem[] {
  const scoped = filterRecordsByProperty(bookings, selectedPropertyId);
  const todayIso = referenceDateStr || new Date().toISOString().split('T')[0];

  const items: StayScheduleItem[] = [];

  for (const b of scoped) {
    const status = getBookingStatus(b);
    if (status !== 'confirmed') continue;
    if (b.check_out < todayIso) continue;

    const nights = getBookingNights(b);
    let scheduleType: StayScheduleItem['scheduleType'] = 'upcoming';
    let badgeLabel = 'Confirmed stay';

    if (b.check_in < todayIso && b.check_out > todayIso) {
      scheduleType = 'in_house';
      badgeLabel = 'Currently in-house';
    } else if (b.check_in === todayIso) {
      scheduleType = 'arriving_soon';
      badgeLabel = 'Arriving today';
    } else if (b.check_out === todayIso) {
      scheduleType = 'departing_soon';
      badgeLabel = 'Checking out today';
    } else {
      const diffDays = calculateNights(todayIso, b.check_in);
      if (diffDays <= 7) {
        scheduleType = 'arriving_soon';
        badgeLabel = diffDays === 1 ? 'Arriving tomorrow' : `Arriving in ${diffDays} days`;
      }
    }

    items.push({
      id: b.id,
      bookingRef: formatBookingReference(b),
      guestName: b.guest_name,
      guestPhone: b.guest_phone,
      guestsCount: getBookingGuestCount(b),
      propertyTitle: getBookingPropertyTitle(b),
      roomName: getBookingRoomName(b),
      checkIn: b.check_in,
      checkOut: b.check_out,
      nights,
      scheduleType,
      badgeLabel,
      dateSummary: `${b.check_in} → ${b.check_out} · ${nights} ${nights === 1 ? 'night' : 'nights'}`,
      booking: b,
    });
  }

  return items.sort((a, b) => a.checkIn.localeCompare(b.checkIn)).slice(0, 6);
}

export function computeListingQualityChecklist(
  properties: HostPropertyRecord[],
  selectedPropertyId: string = 'all'
): ListingQualityItem[] {
  const scoped =
    !selectedPropertyId || selectedPropertyId === 'all'
      ? properties
      : properties.filter((p) => p.id === selectedPropertyId);

  if (scoped.length === 0) {
    return [
      {
        id: 'description',
        title: 'Property description',
        description: 'Clear story, setting and host warmth.',
        statusLabel: 'No properties assigned',
        isComplete: false,
      },
      {
        id: 'rooms',
        title: 'Room capacity & rates',
        description: 'Guest capacity, room count and nightly prices.',
        statusLabel: 'No rooms configured',
        isComplete: false,
      },
      {
        id: 'photos',
        title: 'Property photographs',
        description: 'Warm, clear photos of rooms, views and dining.',
        statusLabel: 'No photos uploaded',
        isComplete: false,
      },
      {
        id: 'location',
        title: 'Location & directions',
        description: 'Village, district and arrival guidance.',
        statusLabel: 'Pending location details',
        isComplete: false,
      },
    ];
  }

  const withDescription = scoped.filter((p) =>
    Boolean(
      (p.description && p.description.trim().length >= 30) ||
        (p.short_description && p.short_description.trim().length >= 20)
    )
  ).length;

  const withRooms = scoped.filter((p) =>
    getPropertyRooms(p).some((r) => getRoomNightlyRate(r) > 0 && getRoomMaxGuests(r) > 0)
  ).length;

  const withPhotos = scoped.filter((p) => getPropertyPhotosCount(p) >= 1).length;

  const withLocation = scoped.filter(
    (p) => Boolean(p.village || p.address || p.exact_address) && Boolean(p.district || p.state)
  ).length;

  const total = scoped.length;

  return [
    {
      id: 'description',
      title: 'Property description',
      description: 'Clear story, setting and host warmth.',
      statusLabel:
        withDescription === total
          ? 'Complete across listings'
          : `${withDescription} of ${total} properties complete`,
      isComplete: withDescription === total,
    },
    {
      id: 'rooms',
      title: 'Room capacity & rates',
      description: 'Guest capacity, room count and nightly prices.',
      statusLabel:
        withRooms === total ? 'Verified' : `${withRooms} of ${total} properties configured`,
      isComplete: withRooms === total,
    },
    {
      id: 'photos',
      title: 'Property photographs',
      description: 'Warm, clear photos of rooms, views and dining.',
      statusLabel:
        withPhotos === total
          ? 'Photos uploaded'
          : `${withPhotos} of ${total} properties have cover photos`,
      isComplete: withPhotos === total,
    },
    {
      id: 'location',
      title: 'Location & directions',
      description: 'Village, district and arrival guidance.',
      statusLabel:
        withLocation === total ? 'Complete' : `${withLocation} of ${total} properties verified`,
      isComplete: withLocation === total,
    },
  ];
}

export function computeReviewDistribution(
  reviews: HostReviewRecord[],
  selectedPropertyId: string = 'all'
): ReviewDistributionSummary {
  const scoped = filterReviewsByProperty(reviews, selectedPropertyId);
  const countsByStar: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  let sum = 0;
  for (const r of scoped) {
    const star = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 5))) as 1 | 2 | 3 | 4 | 5;
    countsByStar[star] += 1;
    sum += Number(r.rating) || 0;
  }

  const totalReviews = scoped.length;
  const averageRating = totalReviews > 0 ? Number((sum / totalReviews).toFixed(1)) : 0;

  const percentagesByStar: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: totalReviews > 0 ? Math.round((countsByStar[1] / totalReviews) * 100) : 0,
    2: totalReviews > 0 ? Math.round((countsByStar[2] / totalReviews) * 100) : 0,
    3: totalReviews > 0 ? Math.round((countsByStar[3] / totalReviews) * 100) : 0,
    4: totalReviews > 0 ? Math.round((countsByStar[4] / totalReviews) * 100) : 0,
    5: totalReviews > 0 ? Math.round((countsByStar[5] / totalReviews) * 100) : 0,
  };

  return {
    averageRating,
    totalReviews,
    countsByStar,
    percentagesByStar,
  };
}

export function getEventsForCalendarDate(
  dateIso: string,
  bookings: HostBookingRecord[],
  blocks: HostAvailabilityBlockRecord[],
  selectedPropertyId: string = 'all',
  selectedRoomId: string = 'all'
): CalendarDayEvent[] {
  const events: CalendarDayEvent[] = [];

  for (const b of bookings) {
    if (selectedPropertyId !== 'all' && b.property_id !== selectedPropertyId) continue;
    const roomId = getBookingRoomId(b);
    if (selectedRoomId !== 'all' && roomId !== selectedRoomId) continue;
    const status = getBookingStatus(b);
    if (status !== 'confirmed' && status !== 'pending') continue;

    // In hospitality date ranges, check_in is inclusive and check_out is exclusive for overnight stays
    if (dateIso >= b.check_in && dateIso < b.check_out) {
      const isConfirmed = status === 'confirmed';
      const propTitle = getBookingPropertyTitle(b);
      const roomName = getBookingRoomName(b);
      events.push({
        id: `booking-${b.id}`,
        kind: isConfirmed ? 'confirmed' : 'pending',
        title: isConfirmed ? `${b.guest_name}` : `Pending · ${b.guest_name}`,
        subtitle: `${roomName} · ${propTitle}`,
        propertyId: b.property_id,
        propertyTitle: propTitle,
        roomId,
        roomName,
        startDate: b.check_in,
        endDate: b.check_out,
        statusBadge: isConfirmed ? 'Confirmed · Locks availability' : 'Pending · Does not block dates',
        guestPhone: b.guest_phone,
        guestsCount: getBookingGuestCount(b),
        totalPrice: getBookingEstimatedValue(b),
        booking: b,
      });
    }
  }

  for (const bl of blocks) {
    const roomUnit = bl.room_units || bl.rooms;
    const propId = roomUnit?.property_id || '';
    const roomId = bl.room_unit_id || bl.room_id || '';
    if (selectedPropertyId !== 'all' && propId !== selectedPropertyId) continue;
    if (selectedRoomId !== 'all' && roomId !== selectedRoomId) continue;

    const startDate = bl.blocked_from || bl.start_date || '';
    const endDate = bl.blocked_until || bl.end_date || '';
    if (!startDate || !endDate) continue;

    if (dateIso >= startDate && dateIso < endDate) {
      const roomName = (roomUnit as any)?.room_name || (roomUnit as any)?.name || 'Room Unit';
      const propTitle =
        roomUnit?.properties?.name || roomUnit?.properties?.title || 'Assigned Property';
      events.push({
        id: `block-${bl.id}`,
        kind: 'blocked',
        title: `Host block · ${bl.reason || 'Unavailable'}`,
        subtitle: `${roomName} · ${propTitle}`,
        propertyId: propId,
        propertyTitle: propTitle,
        roomId,
        roomName,
        startDate,
        endDate,
        statusBadge: 'Host Block · Unavailable',
        block: bl,
      });
    }
  }

  const order = { confirmed: 0, pending: 1, blocked: 2 };
  return events.sort((a, b) => order[a.kind] - order[b.kind]);
}
