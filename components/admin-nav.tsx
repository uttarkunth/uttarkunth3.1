'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Shield,
  Home,
  Inbox,
  Users,
  Percent,
  FileText,
  ArrowLeft,
  Sparkles,
  ShoppingBag,
  Film,
  Heart,
  UserCog,
  Briefcase,
} from 'lucide-react';

interface StaffRolePayload {
  staff_id: string;
  role: string;
  role_title: string;
  department: string;
  operational_department?: string;
  allowed_modules: string[];
}

export function AdminNav() {
  const pathname = usePathname();
  const [staffProfile, setStaffProfile] = useState<StaffRolePayload | null>(null);

  useEffect(() => {
    fetch('/api/auth/role', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data?.staffProfile) {
          setStaffProfile(data.staffProfile);
        }
      })
      .catch(() => {
        // Ignore network errors
      });
  }, []);

  const isFounder = staffProfile?.role === 'founder';

  const allLinks = [
    {
      href: '/admin/dashboard',
      label: isFounder ? 'Command Centre' : 'Overview',
      icon: Shield,
      active: pathname === '/admin/dashboard' || pathname === '/admin',
      alwaysAllowed: true,
    },
    {
      href: '/staff',
      label: 'Staff Portal',
      icon: Briefcase,
      active: pathname === '/staff',
      alwaysAllowed: true,
    },
    {
      href: '/admin/staff',
      label: 'Hiring & Governance',
      icon: UserCog,
      active: pathname === '/admin/staff',
    },
    {
      href: '/admin/properties',
      label: 'Stays',
      icon: Home,
      active: pathname === '/admin/properties',
    },
    {
      href: '/admin/products',
      label: 'Products & Sellers',
      icon: ShoppingBag,
      active: pathname === '/admin/products',
    },
    {
      href: '/admin/productions',
      label: 'Productions',
      icon: Film,
      active: pathname === '/admin/productions',
    },
    {
      href: '/admin/community',
      label: 'Community',
      icon: Heart,
      active: pathname === '/admin/community',
    },
    {
      href: '/admin/users',
      label: 'Hosts',
      icon: Users,
      active: pathname === '/admin/users',
    },
    {
      href: '/admin/settings',
      label: 'Finance & Agreements',
      icon: Percent,
      active: pathname === '/admin/settings',
    },
    {
      href: '/admin/bookings',
      label: 'Bookings',
      icon: Inbox,
      active: pathname === '/admin/bookings',
    },
    {
      href: '/admin/audit',
      label: 'Audit & Quality',
      icon: FileText,
      active: pathname === '/admin/audit',
    },
  ];

  // Filter links by allowed_modules when staffProfile is loaded (departmental isolation)
  const visibleLinks = allLinks.filter((l) => {
    if (l.alwaysAllowed) return true;
    if (!staffProfile?.allowed_modules || staffProfile.allowed_modules.length === 0) {
      return false;
    }
    return staffProfile.allowed_modules.includes(l.href);
  });

  return (
    <div className="bg-forest-dark text-ivory border-b border-forest/20 -mt-2 mb-8 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between overflow-x-auto no-scrollbar py-2 gap-4">
          <nav className="flex items-center gap-1 sm:gap-2">
            {visibleLinks.map((l) => {
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

          <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
            {staffProfile?.staff_id && (
              <span className="text-[10px] font-mono text-ivory/80 bg-white/10 px-2.5 py-1 rounded-full">
                {staffProfile.staff_id}
              </span>
            )}
            <span className="text-[11px] font-semibold text-ukorange bg-ukorange/15 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-ukorange" />
              {staffProfile?.role_title || 'Staff Governance'}
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