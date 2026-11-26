'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export function AccountLayoutFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHostWorkspace = pathname?.startsWith('/account/stays/host');

  if (isHostWorkspace) {
    return <div className="w-full">{children}</div>;
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {children}
    </main>
  );
}
