import React from 'react';
import { HostSettingsClient } from '@/components/host/host-settings-client';

export const dynamic = 'force-dynamic';

export default async function HostSettingsPage() {
  return <HostSettingsClient />;
}
