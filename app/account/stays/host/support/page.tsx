import React from 'react';
import { HostSupportClient } from '@/components/host/host-support-client';

export const dynamic = 'force-dynamic';

export default async function HostSupportPage() {
  return <HostSupportClient />;
}
