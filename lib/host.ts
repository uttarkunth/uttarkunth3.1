import { createAdminClient } from './supabase/admin.ts';
import { checkIsPlatformAdmin } from './auth.ts';

export const DIRECT_HOST_PAYMENT_NOTICE =
  'No online payment is currently collected by Uttarkunth. Guests pay their hosts directly at the property.';

export interface HostAccessResult {
  isAuthorized: boolean;
  role: 'owner' | 'co_host' | 'manager' | 'admin' | null;
  property?: any;
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

export async function getHostProperties(userId: string) {
  const adminClient = createAdminClient();
  const isAdmin = await checkIsPlatformAdmin(userId);

  if (isAdmin) {
    const { data: properties } = await adminClient
      .from('properties')
      .select('*, room_units(*), property_private_locations(*)')
      .order('created_at', { ascending: false });

    const enriched = (properties || []).map(attachPrivateLocationToProperty);
    return {
      properties: enriched,
      isHost: enriched.length > 0,
      isAdmin: true,
    };
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

  const allProps = [...(ownedProps || []), ...coHostProps].map(attachPrivateLocationToProperty);

  return {
    properties: allProps,
    isHost: allProps.length > 0,
    isAdmin: false,
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

  const adminClient = createAdminClient();
  const { data: bookings } = await adminClient
    .from('stay_bookings')
    .select('*, properties(name, village, district), room_units(room_name)')
    .in('property_id', propertyIds)
    .order('created_at', { ascending: false });

  return bookings || [];
}
