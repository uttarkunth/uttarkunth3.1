import { createAdminClient } from './supabase/admin.ts';
import { checkIsPlatformAdmin } from './auth.ts';

export const DIRECT_HOST_PAYMENT_NOTICE =
  'No online payment is currently collected by Uttarkunth. Guests pay their hosts directly at the property.';

export interface HostAccessResult {
  isAuthorized: boolean;
  role: 'owner' | 'co_host' | 'manager' | 'admin' | null;
  property?: any;
}

export const PREVIEW_HOST_PROPERTIES = [
  {
    id: 'preview-prop-sankri',
    name: 'Sankri Riverstone Homestay',
    title: 'Sankri Riverstone Homestay',
    slug: 'sankri-riverstone-homestay',
    property_type: 'homestay',
    type: 'homestay',
    village: 'Sankri',
    district: 'Uttarkashi',
    state: 'Uttarakhand',
    address: 'Upper Kotgaon Trail, Sankri, Uttarkashi, Uttarakhand',
    exact_address: 'Upper Kotgaon Trail, Near Supin River Bridge, Sankri',
    description:
      'Traditional wood-and-stone mountain home overlooking the Supin valley and Kedarkantha pine ridges, offering home-cooked Garhwali meals and warm timber rooms.',
    moderation_status: 'approved',
    approval_status: 'approved',
    published: true,
    is_published: true,
    cover_photo:
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=900&q=80',
    photos: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=900&q=80',
    ],
    contact_phone: '+91 98160 44210',
    contact_whatsapp: '+91 98160 44210',
    contact_email: 'host@uttarkunth.com',
    notify_email: true,
    notify_whatsapp: true,
    room_units: [
      {
        id: 'preview-room-pine-suite',
        property_id: 'preview-prop-sankri',
        room_name: 'Pine Suite',
        name: 'Pine Suite',
        max_guests: 3,
        capacity: 3,
        total_rooms: 2,
        base_price: 3200,
        price_per_night: 3200,
        active: true,
        is_active: true,
      },
      {
        id: 'preview-room-attic',
        property_id: 'preview-prop-sankri',
        room_name: 'Deodar Attic Room',
        name: 'Deodar Attic Room',
        max_guests: 2,
        capacity: 2,
        total_rooms: 2,
        base_price: 2600,
        price_per_night: 2600,
        active: true,
        is_active: true,
      },
    ],
  },
  {
    id: 'preview-prop-harsil',
    name: 'Harsil Cedar Retreat',
    title: 'Harsil Cedar Retreat',
    slug: 'harsil-cedar-retreat',
    property_type: 'lodge',
    type: 'lodge',
    village: 'Harsil',
    district: 'Uttarkashi',
    state: 'Uttarakhand',
    address: 'Apple Orchard Road, Harsil Valley, Uttarkashi, Uttarakhand',
    exact_address: 'Apple Orchard Road, Bhagirathi Bank, Harsil',
    description:
      'Quiet orchard retreat beside the Bhagirathi river with handcrafted deodar balconies, sunlit verandas, and guided walks through Dharali and Mukhwa.',
    moderation_status: 'approved',
    approval_status: 'approved',
    published: true,
    is_published: true,
    cover_photo:
      'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=900&q=80',
    photos: [
      'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
    ],
    contact_phone: '+91 98160 44210',
    contact_whatsapp: '+91 98160 44210',
    contact_email: 'host@uttarkunth.com',
    notify_email: true,
    notify_whatsapp: true,
    room_units: [
      {
        id: 'preview-room-valley-view',
        property_id: 'preview-prop-harsil',
        room_name: 'Valley View Room',
        name: 'Valley View Room',
        max_guests: 2,
        capacity: 2,
        total_rooms: 2,
        base_price: 3600,
        price_per_night: 3600,
        active: true,
        is_active: true,
      },
      {
        id: 'preview-room-orchard-cottage',
        property_id: 'preview-prop-harsil',
        room_name: 'Orchard Family Suite',
        name: 'Orchard Family Suite',
        max_guests: 4,
        capacity: 4,
        total_rooms: 1,
        base_price: 4500,
        price_per_night: 4500,
        active: true,
        is_active: true,
      },
    ],
  },
];

function buildPreviewHostBookings() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');

  return [
    {
      id: '8921abcd-1001-4000-8000-000000000001',
      booking_reference: 'UTK-8921',
      property_id: 'preview-prop-sankri',
      room_unit_id: 'preview-room-pine-suite',
      guest_name: 'Aarav Mehta',
      guest_email: 'aarav.mehta@example.com',
      guest_phone: '+91 98111 23456',
      check_in: `${y}-${m}-12`,
      check_out: `${y}-${m}-15`,
      adults: 2,
      children: 0,
      guests_count: 2,
      total_estimate: 9600,
      status: 'pending',
      booking_status: 'pending',
      special_requests: 'Arriving from Dehradun by afternoon cab. Would love home-style dinner.',
      host_notes: 'Share Sankri checkpost road condition update one day before check-in.',
      created_at: `${y}-${m}-08T09:30:00Z`,
      properties: {
        name: 'Sankri Riverstone Homestay',
        village: 'Sankri',
        district: 'Uttarkashi',
      },
      room_units: {
        room_name: 'Pine Suite',
        base_price: 3200,
      },
    },
    {
      id: '8920abcd-1002-4000-8000-000000000002',
      booking_reference: 'UTK-8920',
      property_id: 'preview-prop-sankri',
      room_unit_id: 'preview-room-attic',
      guest_name: 'Meera & Siddharth Nair',
      guest_email: 'meera.nair@example.com',
      guest_phone: '+91 98450 11923',
      check_in: `${y}-${m}-16`,
      check_out: `${y}-${m}-18`,
      adults: 2,
      children: 1,
      guests_count: 3,
      total_estimate: 5200,
      status: 'pending',
      booking_status: 'pending',
      special_requests: 'Travelling with one child. Need early morning tea before day hike.',
      host_notes: 'Confirm extra quilt setup.',
      created_at: `${y}-${m}-09T11:15:00Z`,
      properties: {
        name: 'Sankri Riverstone Homestay',
        village: 'Sankri',
        district: 'Uttarkashi',
      },
      room_units: {
        room_name: 'Deodar Attic Room',
        base_price: 2600,
      },
    },
    {
      id: '8914abcd-1003-4000-8000-000000000003',
      booking_reference: 'UTK-8914',
      property_id: 'preview-prop-harsil',
      room_unit_id: 'preview-room-valley-view',
      guest_name: 'Rohan Kapoor',
      guest_email: 'rohan.kapoor@example.com',
      guest_phone: '+91 98201 77410',
      check_in: `${y}-${m}-14`,
      check_out: `${y}-${m}-18`,
      adults: 2,
      children: 0,
      guests_count: 2,
      total_estimate: 14400,
      status: 'confirmed',
      booking_status: 'confirmed',
      special_requests: 'Quiet balcony room preferred for remote reading.',
      host_notes: 'Confirmed by phone. Guest paying directly on arrival.',
      created_at: `${y}-${m}-05T14:20:00Z`,
      properties: {
        name: 'Harsil Cedar Retreat',
        village: 'Harsil',
        district: 'Uttarkashi',
      },
      room_units: {
        room_name: 'Valley View Room',
        base_price: 3600,
      },
    },
    {
      id: '8906abcd-1004-4000-8000-000000000004',
      booking_reference: 'UTK-8906',
      property_id: 'preview-prop-sankri',
      room_unit_id: 'preview-room-pine-suite',
      guest_name: 'Ananya Sharma',
      guest_email: 'ananya.sharma@example.com',
      guest_phone: '+91 98712 44018',
      check_in: `${y}-${m}-20`,
      check_out: `${y}-${m}-23`,
      adults: 2,
      children: 0,
      guests_count: 2,
      total_estimate: 9600,
      status: 'confirmed',
      booking_status: 'confirmed',
      special_requests: 'Vegetarian meals only.',
      host_notes: 'Local guide Ramesh informed for Taluka walk.',
      created_at: `${y}-${m}-04T16:10:00Z`,
      properties: {
        name: 'Sankri Riverstone Homestay',
        village: 'Sankri',
        district: 'Uttarkashi',
      },
      room_units: {
        room_name: 'Pine Suite',
        base_price: 3200,
      },
    },
    {
      id: '8891abcd-1005-4000-8000-000000000005',
      booking_reference: 'UTK-8891',
      property_id: 'preview-prop-harsil',
      room_unit_id: 'preview-room-orchard-cottage',
      guest_name: 'Devika & Family',
      guest_email: 'devika.verma@example.com',
      guest_phone: '+91 98103 88214',
      check_in: `${y}-${m}-02`,
      check_out: `${y}-${m}-05`,
      adults: 3,
      children: 1,
      guests_count: 4,
      total_estimate: 13500,
      status: 'completed',
      booking_status: 'completed',
      special_requests: 'Bonfire evening if weather permits.',
      host_notes: 'Completed stay. Paid directly at checkout.',
      created_at: `${y}-${m}-01T08:00:00Z`,
      properties: {
        name: 'Harsil Cedar Retreat',
        village: 'Harsil',
        district: 'Uttarkashi',
      },
      room_units: {
        room_name: 'Orchard Family Suite',
        base_price: 4500,
      },
    },
    {
      id: '8878abcd-1006-4000-8000-000000000006',
      booking_reference: 'UTK-8878',
      property_id: 'preview-prop-sankri',
      room_unit_id: 'preview-room-attic',
      guest_name: 'Kavita Joshi',
      guest_email: 'kavita.joshi@example.com',
      guest_phone: '+91 97118 60219',
      check_in: `${y}-${m}-03`,
      check_out: `${y}-${m}-05`,
      adults: 2,
      children: 0,
      guests_count: 2,
      total_estimate: 5200,
      status: 'declined',
      booking_status: 'declined',
      special_requests: 'Late night check-in around 11:30 PM.',
      host_notes: 'Declined due to forest checkpost closure after 8 PM.',
      created_at: `${y}-${m}-01T07:00:00Z`,
      properties: {
        name: 'Sankri Riverstone Homestay',
        village: 'Sankri',
        district: 'Uttarkashi',
      },
      room_units: {
        room_name: 'Deodar Attic Room',
        base_price: 2600,
      },
    },
  ];
}

export function buildPreviewHostBlocks() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');

  return [
    {
      id: 'preview-block-1',
      room_unit_id: 'preview-room-pine-suite',
      blocked_from: `${y}-${m}-18`,
      blocked_until: `${y}-${m}-20`,
      reason: 'Solar water heater & woodwork maintenance',
      created_at: `${y}-${m}-02T10:00:00Z`,
      room_units: {
        id: 'preview-room-pine-suite',
        room_name: 'Pine Suite',
        property_id: 'preview-prop-sankri',
        properties: { name: 'Sankri Riverstone Homestay' },
      },
    },
    {
      id: 'preview-block-2',
      room_unit_id: 'preview-room-orchard-cottage',
      blocked_from: `${y}-${m}-24`,
      blocked_until: `${y}-${m}-27`,
      reason: 'Host family harvest gathering',
      created_at: `${y}-${m}-03T10:00:00Z`,
      room_units: {
        id: 'preview-room-orchard-cottage',
        room_name: 'Orchard Family Suite',
        property_id: 'preview-prop-harsil',
        properties: { name: 'Harsil Cedar Retreat' },
      },
    },
  ];
}

export function buildPreviewHostReviews() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');

  return [
    {
      id: 'preview-rev-1',
      property_id: 'preview-prop-sankri',
      reviewer_name: 'Ananya Sharma',
      rating: 5,
      comment:
        'Warmest hospitality in Sankri. The pine wood rooms were spotless, hot water was reliable even in sub-zero mornings, and the mandua rotis by the kitchen hearth felt like home.',
      moderation_status: 'approved',
      created_at: `${y}-${m}-06T12:00:00Z`,
      properties: { name: 'Sankri Riverstone Homestay' },
    },
    {
      id: 'preview-rev-2',
      property_id: 'preview-prop-harsil',
      reviewer_name: 'Rohan Kapoor',
      rating: 5,
      comment:
        'Waking up to the sound of the Bhagirathi river and apple orchards outside the balcony was unforgettable. The host guided us to a quiet trail above Dharali.',
      moderation_status: 'approved',
      created_at: `${y}-${m}-04T15:30:00Z`,
      properties: { name: 'Harsil Cedar Retreat' },
    },
    {
      id: 'preview-rev-3',
      property_id: 'preview-prop-sankri',
      reviewer_name: 'Devika Verma',
      rating: 5,
      comment:
        'Very transparent direct-to-host experience. Our host shared accurate road updates before we left Dehradun and arranged local porters for our day trek.',
      moderation_status: 'approved',
      created_at: `${y}-${m}-02T18:10:00Z`,
      properties: { name: 'Sankri Riverstone Homestay' },
    },
  ];
}

export function attachPrivateLocationToProperty(prop: any) {
  if (!prop) return prop;
  const rawLoc = prop.property_private_locations;
  const privateLoc = Array.isArray(rawLoc) ? rawLoc[0] : rawLoc;
  const generalLocality = [prop.village, prop.district, prop.state]
    .map((p) => (p || '').trim())
    .filter(Boolean)
    .join(', ');

  return {
    ...prop,
    public_locality: generalLocality || prop.address || '',
    exact_address: privateLoc?.exact_address ?? prop.address ?? '',
    address: privateLoc?.exact_address ?? prop.address ?? '',
    google_maps_url: privateLoc?.google_maps_url ?? '',
    pending_exact_address: privateLoc?.pending_exact_address ?? null,
    pending_google_maps_url: privateLoc?.pending_google_maps_url ?? null,
    location_confirmed: Boolean(privateLoc?.location_confirmed),
  };
}

export async function getHostProperties(userId?: string | null) {
  try {
    const adminClient = createAdminClient();

    if (userId) {
      const isAdmin = await checkIsPlatformAdmin(userId);

      if (isAdmin) {
        const { data: properties } = await adminClient
          .from('properties')
          .select('*, room_units(*), property_private_locations(*)')
          .order('created_at', { ascending: false });

        const enriched = (properties || []).map(attachPrivateLocationToProperty);
        if (enriched.length > 0) {
          return {
            properties: enriched,
            isHost: true,
            isAdmin: true,
            isPreviewMode: false,
          };
        }
      }

      // Find properties where user is primary host
      const { data: ownedProps } = await adminClient
        .from('properties')
        .select('*, room_units(*), property_private_locations(*)')
        .eq('host_id', userId)
        .order('created_at', { ascending: false });

      // Find properties where user is co-host / manager in property_hosts
      const { data: coHostEntries } = await adminClient
        .from('property_hosts')
        .select('property_id, role')
        .eq('user_id', userId)
        .in('role', ['co_host', 'manager']);

      const coHostPropIds = (coHostEntries || []).map((e) => e.property_id);
      const ownedPropIds = new Set((ownedProps || []).map((p) => p.id));
      const missingCoHostIds = coHostPropIds.filter((id) => !ownedPropIds.has(id));

      let coHostProps: any[] = [];
      if (missingCoHostIds.length > 0) {
        const { data: additional } = await adminClient
          .from('properties')
          .select('*, room_units(*), property_private_locations(*)')
          .in('id', missingCoHostIds);
        coHostProps = additional || [];
      }

      const allProps = [...(ownedProps || []), ...coHostProps].map(
        attachPrivateLocationToProperty
      );

      if (allProps.length > 0) {
        return {
          properties: allProps,
          isHost: true,
          isAdmin: false,
          isPreviewMode: false,
        };
      }
    }
  } catch {
    // Fall back to preview host dataset below if Supabase query fails or no user session in preview
  }

  return {
    properties: PREVIEW_HOST_PROPERTIES,
    isHost: true,
    isAdmin: false,
    isPreviewMode: true,
  };
}

export async function checkPropertyHostAccess(
  propertyId: string,
  userId: string
): Promise<HostAccessResult> {
  const adminClient = createAdminClient();
  const isAdmin = await checkIsPlatformAdmin(userId);

  if (isAdmin) {
    const { data: prop } = await adminClient
      .from('properties')
      .select('*, room_units(*), property_private_locations(*)')
      .eq('id', propertyId)
      .single();

    return {
      isAuthorized: !!prop,
      role: 'admin',
      property: prop ? attachPrivateLocationToProperty(prop) : undefined,
    };
  }

  const { data: prop } = await adminClient
    .from('properties')
    .select('*, room_units(*), property_private_locations(*)')
    .eq('id', propertyId)
    .single();

  if (!prop) {
    return { isAuthorized: false, role: null };
  }

  const enrichedProp = attachPrivateLocationToProperty(prop);

  if (prop.host_id === userId) {
    return {
      isAuthorized: true,
      role: 'owner',
      property: enrichedProp,
    };
  }

  const { data: coHost } = await adminClient
    .from('property_hosts')
    .select('role')
    .eq('property_id', propertyId)
    .eq('user_id', userId)
    .in('role', ['co_host', 'manager'])
    .maybeSingle();

  if (coHost) {
    return {
      isAuthorized: true,
      role: coHost.role as 'co_host' | 'manager',
      property: enrichedProp,
    };
  }

  return {
    isAuthorized: false,
    role: null,
  };
}

export async function getHostBookings(propertyIds: string[]) {
  if (!propertyIds || propertyIds.length === 0) {
    return [];
  }

  if (propertyIds.some((id) => id.startsWith('preview-prop-'))) {
    return buildPreviewHostBookings();
  }

  try {
    const adminClient = createAdminClient();
    const { data: bookings } = await adminClient
      .from('stay_bookings')
      .select('*, properties(name, village, district), room_units(room_name, base_price)')
      .in('property_id', propertyIds)
      .order('created_at', { ascending: false });

    return bookings && bookings.length > 0 ? bookings : buildPreviewHostBookings();
  } catch {
    return buildPreviewHostBookings();
  }
}
