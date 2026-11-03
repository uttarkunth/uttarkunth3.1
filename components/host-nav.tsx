'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Home, PlusCircle, Inbox, Calendar, Sparkles } from 'lucide-react';

export function HostNav() {
  const pathname = usePathname();

  const links = [
    { href: '/account/stays/host', label: 'Overview', icon: LayoutDashboard },
    { href: '/account/stays/host/properties', label: 'My Properties', icon: Home },
    { href: '/stays/partner', label: 'Add Property', icon: PlusCircle },
    { href: '/account/stays/host/bookings', label: 'Booking Requests', icon: Inbox },
    { href: '/account/stays/host/calendar', label: 'Stay Calendar', icon: Calendar },
  ];

  return (
    <div className="bg-white border-b border-forest/10 -mt-2 mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between overflow-x-auto py-2 gap-4">
          <nav className="flex items-center gap-1 sm:gap-2">
            {links.map((l) => {
              const Icon = l.icon;
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-forest text-white shadow-sm'
                      : 'text-charcoal-muted hover:text-forest hover:bg-forest/5'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-ukorange'}`} />
                  <span>{l.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            <span className="text-[11px] font-semibold text-ukorange bg-ukorange/10 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Direct Host Payment Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
