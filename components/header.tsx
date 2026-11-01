'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './logo';
import { createClient } from '@/lib/supabase/client';
import { isPlatformAdmin } from '@/lib/constants';
import { Menu, X, User, Compass, Calendar, Shield, Home, LogOut } from 'lucide-react';

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        // Check admin or host status
        if (isPlatformAdmin(session.user.email)) {
          setIsAdmin(true);
        }
        setIsHost(true); // Allow hosts to view host portal
      } else {
        setUser(null);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        if (isPlatformAdmin(session.user.email)) {
          setIsAdmin(true);
        }
        setIsHost(true);
      } else {
        setUser(null);
        setIsAdmin(false);
        setIsHost(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <header className="sticky top-0 z-40 bg-ivory/95 backdrop-blur-md border-b border-forest/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Logo />

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-charcoal">
          <Link
            href="/properties"
            className={`transition-colors hover:text-ukorange ${pathname === '/properties' ? 'text-forest font-semibold' : ''}`}
          >
            Discover Stays
          </Link>
          <Link
            href="/about"
            className={`transition-colors hover:text-ukorange ${pathname === '/about' ? 'text-forest font-semibold' : ''}`}
          >
            Our Story
          </Link>
          <Link
            href="/contact"
            className={`transition-colors hover:text-ukorange ${pathname === '/contact' ? 'text-forest font-semibold' : ''}`}
          >
            Contact
          </Link>
          {user && (
            <Link
              href="/guest/trips"
              className={`transition-colors hover:text-ukorange ${pathname.startsWith('/guest/trips') ? 'text-forest font-semibold' : ''}`}
            >
              My Trips
            </Link>
          )}
        </nav>

        {/* Action Controls & Auth State */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/host/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-forest bg-forest/5 hover:bg-forest/10 rounded-full transition-colors"
          >
            <Home className="w-3.5 h-3.5 text-ukorange" />
            Host Portal
          </Link>

          {isAdmin && (
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-charcoal rounded-full hover:bg-black transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-ukorange" />
              Admin
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/guest/profile"
                className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-forest text-ivory hover:bg-forest-light transition-colors"
                title="Guest Profile"
              >
                <User className="w-4 h-4" />
              </Link>
              <button
                onClick={handleSignOut}
                className="p-2 text-charcoal-muted hover:text-ukorange transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-semibold text-charcoal hover:text-forest transition-colors px-2 py-1"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 text-sm font-semibold text-white bg-forest hover:bg-forest-hover rounded-lg shadow-sm transition-all hover:shadow"
              >
                Join
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-charcoal hover:text-forest focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-forest/10 bg-ivory px-4 pt-3 pb-6 space-y-3">
          <Link
            href="/properties"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-charcoal hover:text-ukorange"
          >
            Discover Stays
          </Link>
          <Link
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-charcoal hover:text-ukorange"
          >
            Our Story
          </Link>
          <Link
            href="/contact"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-charcoal hover:text-ukorange"
          >
            Contact & Support
          </Link>

          {user && (
            <Link
              href="/guest/trips"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-medium text-charcoal hover:text-ukorange"
            >
              My Trips
            </Link>
          )}

          <div className="pt-3 border-t border-forest/10 space-y-2">
            <Link
              href="/host/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-forest"
            >
              Host Portal
            </Link>

            {isAdmin && (
              <Link
                href="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-semibold text-ukorange"
              >
                Admin Platform Dashboard
              </Link>
            )}

            {user ? (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-charcoal-muted truncate max-w-[200px]">{user.email}</span>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="text-xs font-semibold text-ukorange"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 border border-forest/30 text-forest rounded-lg font-semibold text-sm"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 bg-forest text-white rounded-lg font-semibold text-sm"
                >
                  Join Stays
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
