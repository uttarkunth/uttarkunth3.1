import { createAdminClient } from './supabase/admin.ts';
import { checkIsPlatformAdmin } from './auth.ts';

export const DIRECT_HOST_PAYMENT_NOTICE =
  'No online payment is currently collected by Uttarkunth. Guests pay their hosts directly at the property.';

export interface HostAccessResult {
  isAuthorized: boolean;
  role: 'owner' | 'co_host' | 'manager' | 'admin' | null;
  property?: any;
}

export async function getHostProperties(userId: string) {
  const adminClient = createAdminClient();
  const isAdmin = await checkIsPlatformAdmin(userId);

  if (isAdmin) {
    const { data: properties } = await adminClient
      .from('properties')
      .select('*, room_units(*)')
      .order('created_at', { ascending: false });

    return {
      properties: properties || [],
      isHost: (properties || []).length > 0,
      isAdmin: true,
    };
  }

  // Find properties where user is primary host
  const { data: ownedProps } = await adminClient
    .from('properties')
    .select('*, room_units(*)')
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
      .select('*, room_units(*)')
      .in('id', missingCoHostIds);
    coHostProps = additional || [];
  }

  const allProps = [...(ownedProps || []), ...coHostProps];

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
      .select('*, room_units(*)')
      .eq('id', propertyId)
      .single();

    return {
      isAuthorized: !!prop,
      role: 'admin',
      property: prop || undefined,
    };
  }

  const { data: prop } = await adminClient
    .from('properties')
    .select('*, room_units(*)')
    .eq('id', propertyId)
    .single();

  if (!prop) {
    return { isAuthorized: false, role: null };
  }

  if (prop.host_id === userId) {
    return {
      isAuthorized: true,
      role: 'owner',
      property: prop,
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
      property: prop,
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
