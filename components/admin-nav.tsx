'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Home, Inbox, Users, Percent, FileText, ArrowLeft, Sparkles, ShoppingBag, Film, Heart } from 'lucide-react';

export function AdminNav() {
  const pathname = usePathname();

  const links = [
    { href: '/admin/dashboard', label: 'Overview', icon: Shield, active: pathname === '/admin/dashboard' || pathname === '/admin' },
    { href: '/admin/properties', label: 'Properties', icon: Home, active: pathname === '/admin/properties' },
    { href: '/admin/products', label: 'Products', icon: ShoppingBag, active: pathname === '/admin/products' },
    { href: '/admin/productions', label: 'Productions', icon: Film, active: pathname === '/admin/productions' },
    { href: '/admin/community', label: 'Community', icon: Heart, active: pathname === '/admin/community' },
    { href: '/admin/users', label: 'Hosts', icon: Users, active: pathname === '/admin/users' },
    { href: '/admin/settings', label: 'Agreements', icon: Percent, active: pathname === '/admin/settings' },
    { href: '/admin/bookings', label: 'Bookings', icon: Inbox, active: pathname === '/admin/bookings' },
    { href: '/admin/audit', label: 'Audit Log', icon: FileText, active: pathname === '/admin/audit' },
  ];

  return (
    <div className="bg-forest-dark text-ivory border-b border-forest/20 -mt-2 mb-8 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between overflow-x-auto no-scrollbar py-2 gap-4">
          <nav className="flex items-center gap-1 sm:gap-2">
            {links.map((l) => {
              const Icon = l.icon;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                    l.active
                      ? 'bg-forest text-white shadow-xs'
                      : 'text-ivory/70 hover:text-white hover:bg-forest/40'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${l.active ? 'text-ukorange' : 'text-ivory/50'}`} />
                  <span>{l.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
            <span className="text-[11px] font-semibold text-ukorange bg-ukorange/15 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-ukorange" />
              Superadmin Mode
            </span>

            <Link
              href="/"
              className="flex items-center gap-1 text-xs text-ivory/70 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Public Site</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
