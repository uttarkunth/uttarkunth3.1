'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Layers, Luggage, ShoppingBag, Film, Users, User, Settings, Shield, Home, ArrowUpRight 
} from 'lucide-react';

interface AccountNavProps {
  isAdmin?: boolean;
  isHost?: boolean;
  tripsCount?: number;
}

export function AccountNav({ isAdmin = false, isHost = false, tripsCount = 0 }: AccountNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Overview',
      href: '/account',
      icon: Layers,
      isActive: pathname === '/account',
    },
    {
      label: 'Stays & Trips',
      href: '/trips',
      icon: Luggage,
      isActive: pathname.startsWith('/trips') || pathname.startsWith('/guest/trips') || pathname === '/account/stays',
      badge: tripsCount > 0 ? tripsCount : undefined,
    },
    {
      label: 'Himalayan Products',
      href: '/account/products',
      icon: ShoppingBag,
      isActive: pathname.startsWith('/account/products'),
    },
    {
      label: 'Productions',
      href: '/account/productions',
      icon: Film,
      isActive: pathname.startsWith('/account/productions'),
    },
    {
      label: 'Community',
      href: '/account/community',
      icon: Users,
      isActive: pathname.startsWith('/account/community'),
    },
    {
      label: 'Profile',
      href: '/account/profile',
      icon: User,
      isActive: pathname === '/account/profile' || pathname === '/guest/profile',
    },
    {
      label: 'Settings',
      href: '/account/settings',
      icon: Settings,
      isActive: pathname === '/account/settings',
    },
  ];

  return (
    <div className="w-full bg-warm-surface/95 backdrop-blur-md border-b border-beige/80 sticky top-20 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 overflow-x-auto no-scrollbar py-2.5">
          {/* Main Account Tabs */}
          <nav className="flex items-center gap-1 sm:gap-1.5 flex-nowrap" aria-label="Account Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={item.isActive ? 'page' : undefined}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all duration-200 ease-editorial ${
                    item.isActive
                      ? 'bg-forest text-warm-surface shadow-xs'
                      : 'text-charcoal-muted hover:text-forest hover:bg-warm-canvas/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${item.isActive ? 'text-terracotta-light' : 'text-charcoal-muted'}`} />
                  <span>{item.label}</span>
                  {typeof item.badge !== 'undefined' && (
                    <span
                      className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold tabular-nums rounded-md ${
                        item.isActive ? 'bg-white/20 text-white' : 'bg-forest/10 text-forest'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Elevated Portals: Host Shortcut */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            {(isHost || isAdmin) && (
              <Link
                href="/account/stays/host"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-forest bg-warm-canvas hover:bg-forest hover:text-warm-surface border border-beige-dark/60 rounded-xl transition-all duration-200 ease-editorial group"
                title="Host Workspace for homestay management"
              >
                <Home className="w-3.5 h-3.5 text-terracotta group-hover:text-terracotta-light transition-colors" />
                <span>Host Workspace</span>
                <ArrowUpRight className="w-3 h-3 text-charcoal-muted group-hover:text-warm-surface/80 transition-colors" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
