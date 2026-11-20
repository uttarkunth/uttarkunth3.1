'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { StickySubnavShell } from '@/components/sticky-subnav-shell';
import { resolveUserWorkspaces } from '@/lib/marketplace';
import {
  Layers,
  Luggage,
  ShoppingBag,
  Film,
  Users,
  User,
  Settings,
  Home,
  Store,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

interface AccountNavProps {
  isAdmin?: boolean;
  isHost?: boolean;
  sellerStatus?: string | null;
  tripsCount?: number;
}

export function AccountNav({
  isAdmin = false,
  isHost = false,
  sellerStatus = null,
  tripsCount = 0,
}: AccountNavProps) {
  const pathname = usePathname();

  const workspaceState = resolveUserWorkspaces({
    isHost,
    sellerStatus,
  });

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
      isActive:
        pathname.startsWith('/trips') ||
        pathname.startsWith('/guest/trips') ||
        pathname === '/account/stays',
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
    <StickySubnavShell
      testId="account-secondary-nav"
      className="w-full bg-warm-surface/95 backdrop-blur-md border-b border-beige/80 shadow-xs"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 overflow-x-auto no-scrollbar py-2.5">
          {/* Main Account Tabs */}
          <nav
            className="flex items-center gap-1 sm:gap-1.5 flex-nowrap"
            aria-label="Account Navigation"
          >
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
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      item.isActive ? 'text-terracotta-light' : 'text-charcoal-muted'
                    }`}
                  />
                  <span>{item.label}</span>
                  {typeof item.badge !== 'undefined' && (
                    <span
                      className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold tabular-nums rounded-md ${
                        item.isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-forest/10 text-forest'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Part 7: Dynamic Workspaces (Host Dashboard & Seller Desk side-by-side) */}
          <div
            className="flex items-center gap-2 flex-shrink-0"
            data-testid="account-nav-workspaces"
          >
            {(workspaceState.showHostDashboard || isAdmin) && (
              <Link
                href="/account/stays/host"
                data-testid="nav-host-dashboard-link"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-forest bg-warm-canvas hover:bg-forest hover:text-warm-surface border border-beige-dark/60 rounded-xl transition-all duration-200 ease-editorial group whitespace-nowrap"
                title="Host Dashboard for homestay management"
              >
                <Home className="w-3.5 h-3.5 text-terracotta group-hover:text-terracotta-light transition-colors" />
                <span>Host Dashboard</span>
                <ArrowUpRight className="w-3 h-3 text-charcoal-muted group-hover:text-warm-surface/80 transition-colors" />
              </Link>
            )}

            {(workspaceState.showSellerDesk || isAdmin) && (
              <Link
                href="/seller/dashboard"
                data-testid="nav-seller-desk-link"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#FFFDF9] bg-[#1F332A] hover:bg-[#C55B23] border border-[#2B4438] rounded-xl transition-all duration-200 ease-editorial group whitespace-nowrap"
                title="Seller Desk for product & order management"
              >
                <Store className="w-3.5 h-3.5 text-[#FDE2A8]" />
                <span>Seller Desk</span>
                <ArrowUpRight className="w-3 h-3 text-[#FDE2A8]/80 transition-colors" />
              </Link>
            )}

            {!workspaceState.showSellerDesk &&
              !isAdmin &&
              workspaceState.showPendingSellerBanner && (
                <Link
                  href="/seller/dashboard"
                  data-testid="nav-seller-application-status-link"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl transition-all whitespace-nowrap"
                  title="View your Seller Application Status"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  <span>
                    {workspaceState.sellerLifecycleStatus === 'draft'
                      ? 'Seller Application (Draft)'
                      : 'Seller Application (Pending Review)'}
                  </span>
                </Link>
              )}
          </div>
        </div>
      </div>
    </StickySubnavShell>
  );
}
