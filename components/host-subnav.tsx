'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Home, Calendar, Inbox, Sparkles, PlusCircle } from 'lucide-react';

interface HostSubnavProps {
  pendingCount?: number;
  propertiesCount?: number;
}

export function HostSubnav({ pendingCount = 0, propertiesCount = 0 }: HostSubnavProps) {
  const pathname = usePathname();

  const links = [
    {
      href: '/account/stays/host',
      label: 'Host Overview',
      icon: LayoutDashboard,
      active: pathname === '/account/stays/host',
    },
    {
      href: '/account/stays/host/properties',
      label: 'My Properties',
      icon: Home,
      active: pathname === '/account/stays/host/properties' || (pathname.startsWith('/account/stays/host/properties/') && !pathname.includes('/new')),
      badge: propertiesCount > 0 ? propertiesCount : undefined,
    },
    {
      href: '/account/stays/host/calendar',
      label: 'Availability Calendar',
      icon: Calendar,
      active: pathname.startsWith('/account/stays/host/calendar'),
    },
    {
      href: '/account/stays/host/bookings',
      label: 'Booking Requests',
      icon: Inbox,
      active: pathname.startsWith('/account/stays/host/bookings'),
      badge: pendingCount > 0 ? pendingCount : undefined,
      badgeColor: 'bg-ukorange text-white',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-forest/15 shadow-sm p-2 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5" aria-label="Host Sub Navigation">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all duration-150 ${
                  link.active
                    ? 'bg-forest text-white shadow-xs'
                    : 'text-charcoal-muted hover:text-forest hover:bg-forest/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${link.active ? 'text-white' : 'text-ukorange'}`} />
                <span>{link.label}</span>
                {typeof link.badge !== 'undefined' && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full ${
                      link.badgeColor || (link.active ? 'bg-white/20 text-white' : 'bg-forest/10 text-forest')
                    }`}
                  >
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:flex items-center gap-2 pr-2">
          <div className="text-[11px] font-semibold text-ukorange bg-ukorange/10 px-2.5 py-1 rounded-full flex items-center gap-1.5" title="Direct host payment model active across all Uttarkunth stays">
            <Sparkles className="w-3 h-3 text-ukorange" />
            <span>Direct Host Payment Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
