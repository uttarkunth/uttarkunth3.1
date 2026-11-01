'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Home, Inbox, Users, Star, Settings, ArrowLeft } from 'lucide-react';

export function AdminNav() {
  const pathname = usePathname();

  const links = [
    { href: '/admin/dashboard', label: 'Platform Overview', icon: Shield },
    { href: '/admin/properties', label: 'Property Moderation', icon: Home },
    { href: '/admin/bookings', label: 'All Bookings', icon: Inbox },
    { href: '/admin/users', label: 'Hosts & Users', icon: Users },
    { href: '/admin/reviews', label: 'Review Moderation', icon: Star },
    { href: '/admin/settings', label: 'Commission Settings', icon: Settings },
  ];

  return (
    <div className="bg-charcoal text-ivory border-b border-white/10 -mt-2 mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between overflow-x-auto py-2 gap-4">
          <nav className="flex items-center gap-1 sm:gap-2">
            {links.map(l => {
              const Icon = l.icon;
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-forest text-white shadow-sm'
                      : 'text-ivory/70 hover:text-ivory hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? 'text-ukorange' : 'text-ivory/50'}`} />
                  <span>{l.label}</span>
                </Link>
              );
            })}
          </nav>

          <Link
            href="/"
            className="hidden sm:flex items-center gap-1 text-xs text-ivory/60 hover:text-ukorange transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Site</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
