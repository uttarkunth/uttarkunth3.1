'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './logo';
import { createClient } from '@/lib/supabase/client';
import {
  getProfileMenuItems,
  hasUnreadNotifications,
  resolveUserAvatarDisplay,
  type ProfileMenuIconName,
  type UserIdentityInput,
} from '@/lib/mobile-navigation';
import {
  ArrowUp,
  User,
  LogOut,
  Bell,
  Handshake,
  Mail,
  Home,
  Package,
  Film,
  Users,
  Compass,
  Briefcase,
  ShoppingBag,
  Clapperboard,
  Settings,
  Info,
} from 'lucide-react';

const READ_NOTIFICATIONS_STORAGE_KEY = 'uttarkunth_read_notification_ids';

const ARROW_NAV_ITEMS = [
  {
    label: 'Stays',
    href: '/stays',
    icon: Home,
    iconColor: 'text-forest',
    match: (p: string) => p.startsWith('/stays') || p.startsWith('/properties'),
  },
  {
    label: 'Products',
    href: '/products',
    icon: Package,
    iconColor: 'text-terracotta',
    match: (p: string) => p.startsWith('/products'),
  },
  {
    label: 'Productions',
    href: '/production',
    icon: Film,
    iconColor: 'text-terracotta',
    match: (p: string) => p.startsWith('/production'),
  },
  {
    label: 'Community',
    href: '/community',
    icon: Users,
    iconColor: 'text-forest',
    match: (p: string) => p.startsWith('/community'),
  },
  {
    label: 'About',
    href: '/about',
    icon: Compass,
    iconColor: 'text-terracotta',
    match: (p: string) => p === '/about',
  },
];

function renderProfileMenuIcon(iconName: ProfileMenuIconName) {
  switch (iconName) {
    case 'user':
      return <User strokeWidth={1.75} className="w-4 h-4 text-forest shrink-0" />;
    case 'bell':
      return <Bell strokeWidth={1.75} className="w-4 h-4 text-terracotta shrink-0" />;
    case 'briefcase':
      return <Briefcase strokeWidth={1.75} className="w-4 h-4 text-forest shrink-0" />;
    case 'shopping-bag':
      return <ShoppingBag strokeWidth={1.75} className="w-4 h-4 text-terracotta shrink-0" />;
    case 'clapperboard':
      return <Clapperboard strokeWidth={1.75} className="w-4 h-4 text-terracotta shrink-0" />;
    case 'settings':
      return <Settings strokeWidth={1.75} className="w-4 h-4 text-forest shrink-0" />;
    case 'info':
      return <Info strokeWidth={1.75} className="w-4 h-4 text-forest shrink-0" />;
    case 'handshake':
      return <Handshake strokeWidth={1.75} className="w-4 h-4 text-terracotta shrink-0" />;
    case 'mail':
      return <Mail strokeWidth={1.75} className="w-4 h-4 text-terracotta shrink-0" />;
    case 'log-out':
      return <LogOut strokeWidth={1.75} className="w-4 h-4 text-charcoal-muted shrink-0" />;
  }
}

export function Header() {
  const pathname = usePathname();
  const [navExpanded, setNavExpanded] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);
  const [user, setUser] = useState<UserIdentityInput | null>(null);
  const [notifications, setNotifications] = useState<Array<{ id?: string; read?: boolean }>>([]);
  const [locallyReadIds, setLocallyReadIds] = useState<string[]>([]);
  const headerRef = useRef<HTMLElement>(null);
  const lastScrollYRef = useRef(0);

  const loadLocallyReadIds = useCallback((): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(READ_NOTIFICATIONS_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    setLocallyReadIds(loadLocallyReadIds());
  }, [loadLocallyReadIds]);

  // Hide logo and side medallions on scroll down; reveal on scroll up
  useEffect(() => {
    lastScrollYRef.current = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollYRef.current;

      if (currentScrollY <= 16) {
        setHeaderHidden(false);
      } else if (delta > 6) {
        setHeaderHidden(true);
        setNavExpanded(false);
        setAccountDropdownOpen(false);
      } else if (delta < -6) {
        setHeaderHidden(false);
      }

      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Global passive pointermove listener to update --mouse-x and --mouse-y on all lantern buttons & cards
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        '.lantern-btn, .lantern-card, .btn-primary, .btn-secondary, .btn-terracotta, .btn-outline'
      );
      if (el) {
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        el.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      }
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  // Close menus when clicking outside the header or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setAccountDropdownOpen(false);
        setNavExpanded(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setAccountDropdownOpen(false);
        setNavExpanded(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Close dropdown and expanded nav on route change
  useEffect(() => {
    setAccountDropdownOpen(false);
    setNavExpanded(false);
  }, [pathname]);

  // Fetch notifications from existing /api/account/notifications endpoint
  const fetchUserNotifications = useCallback(async (activeUser: UserIdentityInput | null) => {
    if (typeof window !== 'undefined' && (window as any).__uttarkunthTestAuth?.notifications) {
      setNotifications((window as any).__uttarkunthTestAuth.notifications);
      return;
    }
    if (!activeUser) {
      setNotifications([]);
      return;
    }
    try {
      const res = await fetch('/api/account/notifications', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data?.ok && Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
        }
      }
    } catch {
      // Ignore network errors cleanly
    }
  }, []);

  // When visiting /account/notifications, mark currently loaded notifications as read in local read-status sync
  useEffect(() => {
    if (pathname === '/account/notifications' && notifications.length > 0) {
      const allIds = Array.from(
        new Set([
          ...loadLocallyReadIds(),
          ...notifications.map((n) => (n.id ? String(n.id) : '')).filter(Boolean),
        ])
      );
      setLocallyReadIds(allIds);
      try {
        window.localStorage.setItem(READ_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(allIds));
      } catch {
        // Ignore storage errors
      }
    }
  }, [pathname, notifications, loadLocallyReadIds]);

  // Auth session tracking + optional profile enrichment from profiles table
  useEffect(() => {
    const syncTestAuthOverride = () => {
      const testAuth = typeof window !== 'undefined' ? (window as any).__uttarkunthTestAuth : undefined;
      if (testAuth && 'user' in testAuth) {
        setUser(testAuth.user);
        setNotifications(Array.isArray(testAuth.notifications) ? testAuth.notifications : []);
        return true;
      }
      return false;
    };

    if (syncTestAuthOverride()) {
      const handleOverrideEvent = () => {
        syncTestAuthOverride();
        setLocallyReadIds(loadLocallyReadIds());
      };
      window.addEventListener('uttarkunth-auth-override-changed', handleOverrideEvent);
      return () => window.removeEventListener('uttarkunth-auth-override-changed', handleOverrideEvent);
    }

    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      return;
    }

    const enrichUserWithProfile = async (sessionUser: any) => {
      if (!sessionUser) {
        setUser(null);
        setNotifications([]);
        return;
      }
      setUser(sessionUser);
      fetchUserNotifications(sessionUser);
      try {
        const { data: profileRow } = await (supabase.from('profiles' as any) as any)
          .select('full_name, preferred_name, avatar_url')
          .eq('id', sessionUser.id)
          .maybeSingle();
        if (profileRow) {
          setUser((prev) =>
            prev
              ? {
                  ...prev,
                  full_name: profileRow.full_name || prev.full_name,
                  preferred_name: profileRow.preferred_name || prev.preferred_name,
                  avatar_url: profileRow.avatar_url || prev.avatar_url,
                }
              : prev
          );
        }
      } catch {
        // Ignore if profiles table doesn't have avatar_url or RLS blocks
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (syncTestAuthOverride()) return;
      enrichUserWithProfile(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (syncTestAuthOverride()) return;
      enrichUserWithProfile(session?.user ?? null);
    });

    const handleOverrideEvent = () => {
      if (!syncTestAuthOverride()) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          enrichUserWithProfile(session?.user ?? null);
        });
      }
      setLocallyReadIds(loadLocallyReadIds());
    };
    window.addEventListener('uttarkunth-auth-override-changed', handleOverrideEvent);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('uttarkunth-auth-override-changed', handleOverrideEvent);
    };
  }, [fetchUserNotifications, loadLocallyReadIds]);

  const handleSignOut = async () => {
    if (typeof window !== 'undefined' && (window as any).__uttarkunthTestAuth) {
      delete (window as any).__uttarkunthTestAuth;
      window.dispatchEvent(new CustomEvent('uttarkunth-auth-override-changed'));
      setUser(null);
      setNotifications([]);
      setAccountDropdownOpen(false);
      return;
    }
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore error
    }
    window.location.href = '/';
  };

  // Mutual exclusivity handlers: tapping Arrow closes Profile; tapping Profile closes Arrow
  const handleToggleArrowNav = () => {
    setNavExpanded((prev) => {
      const next = !prev;
      if (next) {
        setAccountDropdownOpen(false);
      }
      return next;
    });
  };

  const handleToggleProfileMenu = () => {
    setAccountDropdownOpen((prev) => {
      const next = !prev;
      if (next) {
        setNavExpanded(false);
      }
      return next;
    });
  };

  const avatarDisplay = resolveUserAvatarDisplay(user);
  const isAuthenticated = avatarDisplay.isAuthenticated;
  const unreadNotificationExists =
    isAuthenticated && hasUnreadNotifications(notifications, locallyReadIds);
  const profileMenuItems = getProfileMenuItems(isAuthenticated, pathname);

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-header transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] relative overflow-visible bg-transparent ${
        headerHidden
          ? '-translate-y-24 opacity-0 pointer-events-none'
          : 'translate-y-0 opacity-100'
      }`}
    >
      {/* Main Header Content Container */}
      <div className="relative z-40 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 bg-transparent">
        {/* DESKTOP ONLY (md+): Left 135° Tilted Arrow + Showcase Card */}
        <div className="hidden md:flex items-center shrink-0">
          <div className="relative">
            <button
              type="button"
              suppressHydrationWarning
              onClick={handleToggleArrowNav}
              className={`group w-10 h-10 rounded-full bg-[#FFFDF9] hover:bg-white border transition-colors duration-200 ease-out flex items-center justify-center shadow-[0_4px_14px_rgba(12,20,16,0.18)] focus:outline-none ${
                navExpanded
                  ? 'border-[#C55B23] text-[#C55B23] ring-2 ring-[#C55B23]/20'
                  : 'border-[#E5DEC9] hover:border-[#C55B23]/45 text-[#1F332A]'
              }`}
              aria-label={navExpanded ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={navExpanded}
              aria-haspopup="menu"
              aria-controls="uttarkunth-expanded-pillars"
              title={
                navExpanded
                  ? 'Close navigation'
                  : 'Open Stays, Products, Productions, Community & About Uttarkunth'
              }
            >
              <ArrowUp
                strokeWidth={1.75}
                className={`w-4 h-4 transition-transform duration-250 ease-out ${
                  navExpanded
                    ? 'rotate-180 text-[#C55B23]'
                    : 'rotate-[135deg] text-[#1F332A] group-hover:text-[#C55B23]'
                }`}
              />
            </button>

            {/* Left Showcase Card — Direct Stays, Products, Productions, Community, About */}
            {navExpanded && (
              <div
                id="uttarkunth-expanded-pillars"
                role="menu"
                aria-label="Ecosystem navigation"
                className="absolute left-0 mt-2.5 w-56 rounded-2xl bg-warm-surface border border-beige shadow-elevated py-1.5 z-dropdown animate-scale-in origin-top-left"
              >
                {ARROW_NAV_ITEMS.map((item) => {
                  const active = item.match(pathname);
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      aria-current={active ? 'page' : undefined}
                      onClick={() => setNavExpanded(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 text-xs sm:text-sm font-medium transition-colors ${
                        active
                          ? 'bg-forest/10 text-forest font-semibold'
                          : 'text-charcoal hover:bg-forest/5 hover:text-forest'
                      }`}
                    >
                      <IconComponent className={`w-4 h-4 shrink-0 ${item.iconColor}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* LOGO — Left-aligned on Mobile (<md), Centered on Desktop (md+) */}
        <div className="flex items-center md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-20">
          <Logo centerMark />
        </div>

        {/* RIGHT — Profile Icon / Avatar / Initial with Subtle Terracotta Notification Dot */}
        <div className="flex items-center shrink-0">
          <div className="relative">
            <button
              type="button"
              suppressHydrationWarning
              onClick={handleToggleProfileMenu}
              data-testid="header-profile-button"
              className={`relative group w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#FFFDF9] hover:bg-white border transition-colors duration-200 ease-out flex items-center justify-center shadow-[0_4px_14px_rgba(12,20,16,0.18)] focus:outline-none ${
                accountDropdownOpen
                  ? 'border-[#C55B23] text-[#C55B23] ring-2 ring-[#C55B23]/20'
                  : 'border-[#E5DEC9] hover:border-[#C55B23]/45 text-[#1F332A]'
              }`}
              aria-label={
                unreadNotificationExists
                  ? 'User Profile & Quick Links (Unread notifications)'
                  : 'User Profile & Quick Links'
              }
              aria-expanded={accountDropdownOpen}
              aria-haspopup="menu"
            >
              {avatarDisplay.avatarUrl ? (
                <img
                  src={avatarDisplay.avatarUrl}
                  alt={avatarDisplay.displayName || 'Profile'}
                  referrerPolicy="no-referrer"
                  data-testid="header-profile-avatar-img"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : avatarDisplay.initial ? (
                <span
                  data-testid="header-profile-initial"
                  className="text-xs font-semibold text-[#1F332A]"
                >
                  {avatarDisplay.initial}
                </span>
              ) : (
                <User
                  strokeWidth={1.75}
                  className={`w-4 h-4 transition-colors duration-200 ${
                    accountDropdownOpen
                      ? 'text-[#C55B23]'
                      : 'text-[#1F332A] group-hover:text-[#C55B23]'
                  }`}
                />
              )}

              {/* Subtle Terracotta Notification Indicator Dot when unread notifications exist */}
              {unreadNotificationExists && (
                <span
                  data-testid="profile-unread-dot"
                  aria-label="Unread notifications"
                  className="absolute -bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-[#C55B23] ring-2 ring-[#FFFDF9]"
                />
              )}
            </button>

            {/* Adaptive Profile Menu Card — No "Not logged in / Logged in" words; bottom Login/Signup or Logout CTA */}
            {accountDropdownOpen && (
              <div
                role="menu"
                aria-label="Profile and quick navigation"
                data-testid="adaptive-profile-menu"
                className="absolute right-0 mt-2.5 w-64 rounded-2xl bg-[#FFFDF9] border border-[#E5DEC9] shadow-[0_14px_34px_rgba(18,28,22,0.16)] py-1.5 z-dropdown animate-scale-in origin-top-right"
              >
                {/* Menu Links */}
                <div className="py-1">
                  {profileMenuItems.map((item) => {
                    const showNotifBadge =
                      item.id === 'notifications' && unreadNotificationExists;
                    const isMyProfileItem = item.id === 'my-profile';

                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        role="menuitem"
                        onClick={() => setAccountDropdownOpen(false)}
                        className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs sm:text-sm font-medium text-[#29251F] hover:bg-[#263D32]/6 hover:text-[#263D32] transition-colors"
                      >
                        <span className="flex items-center gap-3 min-w-0">
                          {isMyProfileItem && avatarDisplay.avatarUrl ? (
                            <img
                              src={avatarDisplay.avatarUrl}
                              alt={avatarDisplay.displayName || 'Profile'}
                              referrerPolicy="no-referrer"
                              data-testid="menu-profile-avatar-img"
                              className="w-5 h-5 rounded-full object-cover shrink-0 border border-[#E5DEC9]"
                            />
                          ) : isMyProfileItem && avatarDisplay.initial ? (
                            <span
                              data-testid="menu-profile-initial"
                              className="w-5 h-5 rounded-full bg-[#263D32] text-[#FFFDF9] text-[10px] font-bold flex items-center justify-center shrink-0"
                            >
                              {avatarDisplay.initial}
                            </span>
                          ) : (
                            renderProfileMenuIcon(item.iconName)
                          )}
                          <span className="truncate">{item.label}</span>
                        </span>
                        {showNotifBadge && (
                          <span
                            aria-hidden="true"
                            className="w-2 h-2 rounded-full bg-[#C55B23] shrink-0"
                          />
                        )}
                      </Link>
                    );
                  })}
                </div>

                {/* Bottom CTA Footer — Login / Sign Up when logged out, Log Out when signed in */}
                <div className="pt-1.5 mt-1 border-t border-[#E5DEC9]/70 px-3 pb-1">
                  {isAuthenticated ? (
                    <button
                      type="button"
                      role="menuitem"
                      data-testid="profile-menu-logout-cta"
                      suppressHydrationWarning
                      onClick={handleSignOut}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-[#29251F] bg-[#F5F0E6] hover:bg-status-danger-bg/60 hover:text-status-danger border border-[#E2D9C5] transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5 shrink-0" />
                      <span>Log Out</span>
                    </button>
                  ) : (
                    <div
                      data-testid="profile-menu-guest-ctas"
                      className="flex items-center gap-2"
                    >
                      <Link
                        href={`/login?returnUrl=${encodeURIComponent(pathname || '/')}`}
                        role="menuitem"
                        data-testid="profile-menu-login-cta"
                        onClick={() => setAccountDropdownOpen(false)}
                        className="flex-1 flex items-center justify-center py-2 text-xs font-semibold text-[#FFFDF9] bg-[#263D32] hover:bg-[#1E3128] rounded-full transition-colors"
                      >
                        Log In
                      </Link>
                      <Link
                        href={`/signup?returnUrl=${encodeURIComponent(pathname || '/')}`}
                        role="menuitem"
                        data-testid="profile-menu-signup-cta"
                        onClick={() => setAccountDropdownOpen(false)}
                        className="flex-1 flex items-center justify-center py-2 text-xs font-semibold text-[#29251F] bg-[#F5F0E6] hover:bg-white border border-[#D9CCB8] rounded-full transition-colors"
                      >
                        Sign Up
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
