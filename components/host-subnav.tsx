'use client';

import React from 'react';

interface HostSubnavProps {
  pendingCount?: number;
  propertiesCount?: number;
}

/**
 * HostSubnav is superseded by the persistent HostWorkspaceShell sidebar
 * in /app/account/stays/host/layout.tsx to prevent duplicate navigation bars.
 */
export function HostSubnav(_props: HostSubnavProps) {
  return null;
}
