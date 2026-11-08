'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './logo';
import { createClient } from '@/lib/supabase/client';
import { PILLARS } from '@/lib/constants';
import { 
  Menu, X, User, ChevronDown, LogOut, Shield, 
  Luggage, Compass, Sparkles, Layers, Settings, Home, Search, Bell
} from 'lucide-react';

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAccountDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setAccountDropdownOpen(false);
  }, [pathname]);

  // Auth session tracking with server-authoritative admin verification
  useEffect(() => {
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      return;
    }

    const verifyAdmin = async (currentUser: any) => {
      if (!currentUser) {
        setIsAdmin(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/role');
        if (res.ok) {
          const data = await res.json();
          setIsAdmin(Boolean(data?.isAdmin));
        } else {
          setIsAdmin(false);
        }
      } catch {
        setIsAdmin(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        verifyAdmin(session.user);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        verifyAdmin(session.user);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  // Determine context-aware CTA based on current section
  const getContextualCTA = () => {
    if (pathname.startsWith('/stays') || pathname.startsWith('/properties')) {
      return { label: 'List Your Property', href: '/stays/partner' };
    }
    if (pathname.startsWith('/products')) {
      return { label: 'Sell Products', href: '/products/sell' };
    }
    if (pathname.startsWith('/production')) {
      return { label: 'Collaborate', href: '/production/collaborate' };
    }
    if (pathname.startsWith('/community')) {
      return { label: 'Join Our Mission', href: '/community/join' };
    }
    return { label: 'Partner With Us', href: '/community' };
  };

  const contextualCTA = getContextualCTA();

  return (
    <header className="sticky top-0 z-40 bg-warm-canvas/95 backdrop-blur-md border-b border-beige/60 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Logo />

        {/* Desktop Navigation Links — Four Pillars & Heritage */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-charcoal" aria-label="Main Navigation">
          <Link
            href="/stays"
            className={`transition-colors hover:text-terracotta py-1 border-b-2 ${
              pathname.startsWith('/stays') || pathname.startsWith('/properties') 
                ? 'border-forest text-forest font-semibold' 
                : 'border-transparent text-charcoal'
            }`}
          >
            Stays
          </Link>
          <Link
            href="/products"
            className={`transition-colors hover:text-terracotta py-1 border-b-2 ${
              pathname.startsWith('/products') 
                ? 'border-forest text-forest font-semibold' 
                : 'border-transparent text-charcoal'
            }`}
          >
            Products
          </Link>
          <Link
            href="/production"
            className={`transition-colors hover:text-terracotta py-1 border-b-2 ${
              pathname.startsWith('/production') 
                ? 'border-forest text-forest font-semibold' 
                : 'border-transparent text-charcoal'
            }`}
          >
            Productions
          </Link>
          <Link
            href="/community"
            className={`transition-colors hover:text-terracotta py-1 border-b-2 ${
              pathname.startsWith('/community') 
                ? 'border-forest text-forest font-semibold' 
                : 'border-transparent text-charcoal'
            }`}
          >
            Community
          </Link>
          <span className="w-px h-4 bg-beige" aria-hidden="true" />
          <Link
            href="/about"
            className={`transition-colors hover:text-terracotta py-1 border-b-2 ${
              pathname === '/about' 
                ? 'border-forest text-forest font-semibold' 
                : 'border-transparent text-charcoal/80'
            }`}
          >
            About
          </Link>
          <Link
            href="/contact"
            className={`transition-colors hover:text-terracotta py-1 border-b-2 ${
              pathname === '/contact' 
                ? 'border-forest text-forest font-semibold' 
                : 'border-transparent text-charcoal/80'
            }`}
          >
            Contact
          </Link>
        </nav>

        {/* Action Controls: Search, Contextual CTA & Unified Account Icon */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Universal Search Link */}
          <Link
            href="/search"
            className="p-2 rounded-full border border-beige bg-warm-card hover:border-forest/40 text-charcoal hover:text-terracotta transition-all duration-200"
            aria-label="Search Ecosystem"
          >
            <Search className="w-4 h-4" />
          </Link>

          {/* Context-Aware Partnership CTA */}
          <Link
            href={contextualCTA.href}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-forest bg-forest/5 hover:bg-forest/10 border border-beige/80 rounded-full transition-all duration-200"
          >
            <Sparkles className="w-3.5 h-3.5 text-terracotta" />
            <span>{contextualCTA.label}</span>
          </Link>

          {/* Global Notifications Shortcut — vertically centred with the account control */}
          <Link
            href={user ? "/account/notifications" : `/login?returnUrl=${encodeURIComponent(pathname)}`}
            className={`w-10 h-10 inline-flex shrink-0 items-center justify-center rounded-full border border-beige bg-warm-card hover:border-forest/40 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta ${
              pathname.startsWith('/account/notifications') ? 'text-forest' : 'text-charcoal'
            }`}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell className="block w-5 h-5" aria-hidden="true" />
          </Link>

          {/* Canonical Account / Profile Icon with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              suppressHydrationWarning
              onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
              className="inline-flex items-center gap-2 p-1.5 rounded-full border border-beige bg-warm-card hover:border-forest/40 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
              aria-label="User Account Menu"
              aria-expanded={accountDropdownOpen}
            >
              <div className="w-8 h-8 rounded-full bg-forest text-warm-canvas flex items-center justify-center font-medium text-xs">
                {user ? (user.email?.[0]?.toUpperCase() || <User className="w-4 h-4" />) : <User className="w-4 h-4" />}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-charcoal-muted mr-1 transition-transform duration-200 ${accountDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {accountDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-warm-surface border border-beige shadow-lifted py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {user ? (
                  // Logged In Menu
                  <>
                    <div className="px-4 py-2.5 border-b border-beige/60">
                      <p className="text-xs text-charcoal-muted">Signed in as</p>
                      <p className="text-sm font-semibold text-charcoal truncate">{user.email}</p>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/account"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-forest/5 hover:text-forest transition-colors"
                      >
                        <Layers className="w-4 h-4 text-forest" />
                        <span>My Uttarkunth</span>
                      </Link>
                      <Link
                        href="/account/notifications"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-forest/5 hover:text-forest transition-colors"
                      >
                        <Bell className="w-4 h-4 text-ukorange" />
                        <span>Activity &amp; Notifications</span>
                      </Link>
                      <Link
                        href="/trips"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-forest/5 hover:text-forest transition-colors"
                      >
                        <Luggage className="w-4 h-4 text-terracotta" />
                        <span>My Trips</span>
                      </Link>
                      <Link
                        href="/account/profile"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-forest/5 hover:text-forest transition-colors"
                      >
                        <User className="w-4 h-4 text-charcoal-muted" />
                        <span>My Profile</span>
                      </Link>
                      <Link
                        href="/account/settings"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-forest/5 hover:text-forest transition-colors"
                      >
                        <Settings className="w-4 h-4 text-charcoal-muted" />
                        <span>Account Settings</span>
                      </Link>
                    </div>

                    <div className="pt-1 mt-1 border-t border-beige/60">
                      <button suppressHydrationWarning
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left text-charcoal-muted hover:text-charcoal hover:bg-forest/5 transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-charcoal-muted" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </>
                ) : (
                  // Logged Out Menu
                  <div className="py-1">
                    <Link
                      href={`/login?returnUrl=${encodeURIComponent(pathname)}`}
                      className="flex items-center justify-center mx-3 my-1.5 px-4 py-2 text-sm font-medium text-warm-canvas bg-forest hover:bg-forest-hover rounded-full transition-colors"
                    >
                      Log In
                    </Link>
                    <Link
                      href={`/signup?returnUrl=${encodeURIComponent(pathname)}`}
                      className="flex items-center justify-center mx-3 my-1 px-4 py-2 text-sm font-medium text-charcoal bg-warm-card hover:bg-white border border-beige rounded-full transition-colors"
                    >
                      Create Account
                    </Link>
                    <div className="pt-2 mt-2 border-t border-beige/60">
                      <Link
                        href="/community"
                        className="flex items-center gap-2 px-4 py-2 text-xs text-charcoal-muted hover:text-forest transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-terracotta" />
                        <span>Partner With Uttarkunth</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Header Actions — equal-size controls keep all icons on one vertical centre line */}
        <div className="flex items-center gap-3 lg:hidden">
          {/* Global Notifications Shortcut */}
          <Link
            href={user ? "/account/notifications" : `/login?returnUrl=${encodeURIComponent(pathname)}`}
            className={`relative w-9 h-9 inline-flex shrink-0 items-center justify-center rounded-full border border-beige bg-warm-card hover:border-forest/40 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta ${
              pathname.startsWith('/account/notifications') ? 'text-forest' : 'text-charcoal'
            }`}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell className="block w-5 h-5" aria-hidden="true" />
          </Link>

          {/* Direct Account Shortcut for Mobile */}
          <Link
            href={user ? "/account" : `/login?returnUrl=${encodeURIComponent(pathname)}`}
            className="w-9 h-9 rounded-full bg-forest text-warm-canvas flex items-center justify-center text-xs font-medium"
            aria-label="Account"
          >
            {user ? (user.email?.[0]?.toUpperCase() || <User className="w-4 h-4" />) : <User className="w-4 h-4" />}
          </Link>

          <button
            suppressHydrationWarning
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-9 h-9 inline-flex shrink-0 items-center justify-center rounded-lg text-charcoal hover:text-forest hover:bg-forest/5 focus:outline-none focus:ring-2 focus:ring-terracotta"
            aria-label={mobileMenuOpen ? "Close Menu" : "Open Menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Accessible Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-20 bg-warm-canvas border-b border-beige shadow-lifted z-40 max-h-[calc(100vh-5rem)] overflow-y-auto">
          <div className="px-5 py-6 space-y-6">
            {/* The Four Pillars */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted mb-3">Ecosystem Pillars</p>
              <div className="grid grid-cols-2 gap-2.5">
                {PILLARS.map((pillar) => (
                  <Link
                    key={pillar.id}
                    href={pillar.href}
                    className="flex flex-col p-3 rounded-xl bg-warm-card border border-beige/80 hover:border-forest transition-colors"
                  >
                    <span className="font-serif text-base font-semibold text-charcoal">{pillar.title}</span>
                    <span className="text-[11px] text-charcoal-muted mt-0.5 line-clamp-1">{pillar.tagline}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Search link for mobile */}
            <div>
              <Link
                href="/search"
                className="flex items-center gap-2 p-3 rounded-xl bg-warm-card border border-beige/80 text-sm font-medium text-charcoal hover:border-forest transition-colors"
              >
                <Search className="w-4 h-4 text-terracotta" />
                <span>Search Uttarkunth Ecosystem</span>
              </Link>
            </div>

            {/* Heritage & Contact */}
            <div className="space-y-2 border-t border-beige/60 pt-4">
              <Link
                href="/about"
                className="block py-2 text-base font-medium text-charcoal hover:text-terracotta"
              >
                About Uttarkunth
              </Link>
              <Link
                href="/contact"
                className="block py-2 text-base font-medium text-charcoal hover:text-terracotta"
              >
                Contact & Support
              </Link>
            </div>

            {/* Contextual CTA for Mobile */}
            <div className="pt-2">
              <Link
                href={contextualCTA.href}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-forest text-warm-canvas font-medium text-sm transition-colors"
              >
                <Sparkles className="w-4 h-4 text-terracotta" />
                <span>{contextualCTA.label}</span>
              </Link>
            </div>

            {/* User Account Controls in Mobile Drawer */}
            <div className="border-t border-beige/60 pt-4">
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs text-charcoal-muted truncate">{user.email}</span>
                  </div>
                  <Link
                    href="/account"
                    className="block py-2 text-sm font-semibold text-forest"
                  >
                    My Uttarkunth Dashboard →
                  </Link>
                  <Link
                    href="/trips"
                    className="block py-1.5 text-sm text-charcoal"
                  >
                    My Trips
                  </Link>
                  <button suppressHydrationWarning
                    onClick={handleSignOut}
                    className="block py-2 text-sm text-charcoal-muted hover:text-charcoal"
                  >
                    Log Out
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href={`/login?returnUrl=${encodeURIComponent(pathname)}`}
                    className="flex items-center justify-center py-2.5 rounded-full bg-forest text-warm-canvas text-sm font-medium"
                  >
                    Log In
                  </Link>
                  <Link
                    href={`/signup?returnUrl=${encodeURIComponent(pathname)}`}
                    className="flex items-center justify-center py-2.5 rounded-full bg-warm-card border border-beige text-charcoal text-sm font-medium"
                  >
                    Create Account
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
