'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  Home,
  Inbox,
  CalendarDays,
  Star,
  BarChart3,
  Settings,
  HelpCircle,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
  ArrowLeft,
  Bell,
  Building2,
} from 'lucide-react';
import {
  getPropertyDisplayName,
  isPropertyLive,
  type HostPropertyRecord,
} from '@/lib/host-dashboard';

interface HostWorkspaceContextValue {
  selectedPropertyId: string;
  setSelectedPropertyId: (id: string) => void;
  properties: HostPropertyRecord[];
  pendingCount: number;
  isHost: boolean;
  isAdmin: boolean;
  userEmail: string;
}

const HostWorkspaceContext = createContext<HostWorkspaceContextValue>({
  selectedPropertyId: 'all',
  setSelectedPropertyId: () => {},
  properties: [],
  pendingCount: 0,
  isHost: false,
  isAdmin: false,
  userEmail: '',
});

export function useHostWorkspace() {
  return useContext(HostWorkspaceContext);
}

interface HostWorkspaceShellProps {
  children: React.ReactNode;
  properties: HostPropertyRecord[];
  pendingCount: number;
  isHost: boolean;
  isAdmin: boolean;
  userEmail: string;
}

export function HostWorkspaceShell({
  children,
  properties,
  pendingCount,
  isHost,
  isAdmin,
  userEmail,
}: HostWorkspaceShellProps) {
  const pathname = usePathname();
  const [selectedPropertyId, setSelectedPropertyIdState] = useState<string>('all');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  // Restore persisted property selection if still valid
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('utk_host_selected_property');
      if (saved && (saved === 'all' || properties.some((p) => p.id === saved))) {
        setSelectedPropertyIdState(saved);
      }
    } catch {
      // ignore storage errors
    }
  }, [properties]);

  const setSelectedPropertyId = (nextId: string) => {
    setSelectedPropertyIdState(nextId);
    try {
      window.localStorage.setItem('utk_host_selected_property', nextId);
    } catch {
      // ignore storage errors
    }
  };

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [pathname]);

  // Close mobile drawer on Escape
  useEffect(() => {
    if (!isMobileDrawerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileDrawerOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMobileDrawerOpen]);

  // If user is neither host nor admin, render children directly (onboarding empty state)
  if (!isHost && !isAdmin) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    );
  }

  const activeCount = properties.filter(isPropertyLive).length;

  const navGroups: {
    groupLabel: string;
    items: {
      id: string;
      label: string;
      href: string;
      icon: React.ComponentType<{ className?: string }>;
      isActive: boolean;
      badge?: number;
      badgeHighlight?: boolean;
    }[];
  }[] = [
    {
      groupLabel: 'WORKSPACE',
      items: [
        {
          id: 'overview',
          label: 'Host Overview',
          href: '/account/stays/host',
          icon: LayoutGrid,
          isActive: pathname === '/account/stays/host',
        },
      ],
    },
    {
      groupLabel: 'PROPERTY WORKSPACE',
      items: [
        {
          id: 'properties',
          label: 'My Properties',
          href: '/account/stays/host/properties',
          icon: Home,
          isActive: pathname?.startsWith('/account/stays/host/properties') || false,
          badge: properties.length,
        },
      ],
    },
    {
      groupLabel: 'MANAGE STAYS',
      items: [
        {
          id: 'bookings',
          label: 'Bookings',
          href: '/account/stays/host/bookings',
          icon: Inbox,
          isActive: pathname?.startsWith('/account/stays/host/bookings') || false,
          badge: pendingCount > 0 ? pendingCount : undefined,
          badgeHighlight: pendingCount > 0,
        },
        {
          id: 'calendar',
          label: 'Calendar & Availability',
          href: '/account/stays/host/calendar',
          icon: CalendarDays,
          isActive: pathname?.startsWith('/account/stays/host/calendar') || false,
        },
        {
          id: 'reviews',
          label: 'Guest Reviews',
          href: '/account/stays/host/reviews',
          icon: Star,
          isActive: pathname?.startsWith('/account/stays/host/reviews') || false,
        },
      ],
    },
    {
      groupLabel: 'INSIGHTS',
      items: [
        {
          id: 'performance',
          label: 'Performance & Insights',
          href: '/account/stays/host/performance',
          icon: BarChart3,
          isActive: pathname?.startsWith('/account/stays/host/performance') || false,
        },
      ],
    },
    {
      groupLabel: 'ACCOUNT & SUPPORT',
      items: [
        {
          id: 'settings',
          label: 'Host Settings',
          href: '/account/stays/host/settings',
          icon: Settings,
          isActive: pathname?.startsWith('/account/stays/host/settings') || false,
        },
        {
          id: 'support',
          label: 'Help & Support',
          href: '/account/stays/host/support',
          icon: HelpCircle,
          isActive: pathname?.startsWith('/account/stays/host/support') || false,
        },
      ],
    },
  ];

  const renderSidebarContent = (collapsed: boolean) => (
    <div className="flex flex-col h-full justify-between gap-4">
      <div className="space-y-4">
        {/* Top Property Switcher */}
        {!collapsed ? (
          <div className="p-3 rounded-[14px] bg-[#FFFDF9]/[0.06] border border-[#FFFDF9]/12 space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="host-sidebar-property-select"
                className="text-[10px] uppercase tracking-[0.12em] text-[#FFFDF9]/60 font-bold"
              >
                Property view
              </label>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-[#C55B23]/25 text-[#FDE2A8] border border-[#C55B23]/40">
                  <Shield className="w-2.5 h-2.5" /> Admin
                </span>
              )}
            </div>
            <select
              id="host-sidebar-property-select"
              data-testid="host-property-selector"
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="w-full px-2.5 py-2 rounded-[10px] border border-[#FFFDF9]/15 bg-[#101C16]/60 text-[#FFFDF9] text-xs font-bold focus:outline-none focus:border-[#C55B23] cursor-pointer"
            >
              <option value="all" className="bg-[#1A2B23] text-[#FFFDF9]">
                All properties ({properties.length})
              </option>
              {properties.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#1A2B23] text-[#FFFDF9]">
                  {getPropertyDisplayName(p)}
                  {p.village ? ` · ${p.village}` : ''}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1.5 pt-0.5 text-[11px] text-[#FFFDF9]/70">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3E9B63] shrink-0" />
              <span className="truncate">
                {activeCount} published · Direct payment model
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-1">
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(false)}
              title="Expand sidebar to switch property"
              className="w-11 h-11 rounded-xl bg-[#FFFDF9]/8 border border-[#FFFDF9]/14 flex items-center justify-center text-[#FFFDF9] hover:bg-[#FFFDF9]/14 transition-colors"
            >
              <Building2 className="w-5 h-5 text-[#E57C44]" />
            </button>
          </div>
        )}

        {/* Navigation Groups */}
        <nav aria-label="Host Workspace Navigation" className="space-y-3.5">
          {navGroups.map((group) => (
            <div key={group.groupLabel} className="space-y-1">
              {!collapsed && (
                <div className="px-2.5 pt-1 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#FFFDF9]/45">
                  {group.groupLabel}
                </div>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      data-testid={`host-nav-${item.id}`}
                      title={collapsed ? item.label : undefined}
                      aria-current={item.isActive ? 'page' : undefined}
                      className={`group flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-[11px] text-[13px] font-semibold transition-all duration-150 ${
                        item.isActive
                          ? 'bg-[#A84C1C] text-[#FFFDF9] border border-[#FFFDF9]/16 shadow-[0_6px_16px_rgba(0,0,0,0.18)] font-bold'
                          : 'text-[#FFFDF9]/78 border border-transparent hover:bg-[#FFFDF9]/[0.07] hover:text-[#FFFDF9]'
                      } ${collapsed ? 'justify-center px-2' : ''}`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-[17px] h-[17px] shrink-0 ${
                            item.isActive
                              ? 'text-[#FFFDF9]'
                              : 'text-[#FFFDF9]/75 group-hover:text-[#FFFDF9]'
                          }`}
                        />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </span>

                      {!collapsed && typeof item.badge !== 'undefined' && (
                        <span
                          className={`min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-extrabold tabular-nums inline-flex items-center justify-center ${
                            item.isActive
                              ? 'bg-[#101C16]/30 text-[#FFFDF9] border border-[#FFFDF9]/25'
                              : item.badgeHighlight
                              ? 'bg-[#C55B23] text-[#FFFDF9]'
                              : 'bg-[#FFFDF9]/12 text-[#FFFDF9]'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Help Card & Collapse Toggle */}
      <div className="space-y-3 pt-3 border-t border-[#FFFDF9]/10">
        {!collapsed && (
          <div className="p-3 rounded-[14px] bg-[#FFFDF9]/[0.06] border border-[#FFFDF9]/12 space-y-1.5">
            <strong className="block text-xs font-bold text-[#FFFDF9]">
              Here when you need us
            </strong>
            <p className="text-[11px] text-[#FFFDF9]/70 leading-relaxed">
              Questions about bookings, property updates or availability blocks?
            </p>
            <Link
              href="/account/stays/host/support"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#F3B089] hover:text-[#FFFDF9] transition-colors pt-0.5"
            >
              <span>Open Help &amp; Support</span>
              <span>&rarr;</span>
            </Link>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <Link
            href="/account"
            title="Return to general Account overview"
            className={`inline-flex items-center gap-2 text-xs font-semibold text-[#FFFDF9]/70 hover:text-[#FFFDF9] px-2.5 py-2 rounded-lg hover:bg-[#FFFDF9]/8 transition-colors ${
              collapsed ? 'w-full justify-center' : ''
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
            {!collapsed && <span className="truncate">Personal Account</span>}
          </Link>

          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            data-testid="host-sidebar-collapse-toggle"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:inline-flex w-8 h-8 rounded-lg bg-[#FFFDF9]/8 hover:bg-[#FFFDF9]/15 border border-[#FFFDF9]/12 items-center justify-center text-[#FFFDF9]/80 hover:text-[#FFFDF9] transition-colors cursor-pointer shrink-0"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {!collapsed && (
          <div className="px-2 text-[11px] text-[#FFFDF9]/45 leading-snug">
            Uttarkunth Host Workspace
            <br />
            Direct-to-host model
          </div>
        )}
      </div>
    </div>
  );

  return (
    <HostWorkspaceContext.Provider
      value={{
        selectedPropertyId,
        setSelectedPropertyId,
        properties,
        pendingCount,
        isHost,
        isAdmin,
        userEmail,
      }}
    >
      <div
        data-testid="host-workspace-shell"
        className="min-h-[calc(100vh-4rem)] bg-[#F5F0E6] text-[#29251F] flex flex-col lg:flex-row max-w-[1600px] mx-auto"
      >
        {/* ===================================================================
            MOBILE / TABLET TOP WORKSPACE BAR (< 1024px)
           =================================================================== */}
        <div
          data-testid="host-mobile-topbar"
          className="lg:hidden sticky top-16 z-30 bg-[#1A2B23] text-[#FFFDF9] border-b border-[#FFFDF9]/12 px-3.5 py-2.5 flex items-center justify-between gap-2.5 shadow-sm"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              data-testid="host-mobile-menu-button"
              onClick={() => setIsMobileDrawerOpen(true)}
              aria-label="Open Host Workspace menu"
              className="w-10 h-10 rounded-xl bg-[#FFFDF9]/10 border border-[#FFFDF9]/15 flex items-center justify-center text-[#FFFDF9] active:scale-95 transition-transform shrink-0 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#E57C44]">
                Host Workspace
              </span>
              <select
                aria-label="Filter by assigned property"
                data-testid="host-mobile-property-selector"
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="bg-transparent text-[#FFFDF9] text-xs font-bold focus:outline-none truncate max-w-[175px] sm:max-w-[260px] cursor-pointer"
              >
                <option value="all" className="bg-[#1A2B23] text-[#FFFDF9]">
                  All properties ({properties.length})
                </option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#1A2B23] text-[#FFFDF9]">
                    {getPropertyDisplayName(p)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/account/stays/host/bookings"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#FFFDF9]/10 border border-[#FFFDF9]/15 text-xs font-bold text-[#FFFDF9]"
              title="Pending booking requests"
            >
              <Bell className="w-3.5 h-3.5 text-[#E57C44]" />
              <span className="tabular-nums">{pendingCount}</span>
            </Link>
          </div>
        </div>

        {/* ===================================================================
            MOBILE / TABLET SLIDE-IN NAVIGATION DRAWER (< 1024px)
           =================================================================== */}
        {isMobileDrawerOpen && (
          <div
            className="lg:hidden fixed inset-0 z-50 flex"
            role="dialog"
            aria-modal="true"
            aria-label="Host Workspace Navigation Drawer"
            data-testid="host-mobile-drawer"
          >
            <div
              className="fixed inset-0 bg-[#101C16]/60 backdrop-blur-[2px]"
              onClick={() => setIsMobileDrawerOpen(false)}
              aria-hidden="true"
            />
            <aside className="relative z-10 w-[284px] max-w-[85vw] bg-[#1A2B23] text-[#FFFDF9] h-full overflow-y-auto p-4 flex flex-col justify-between shadow-2xl border-r border-[#FFFDF9]/12">
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#FFFDF9]/12">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#E57C44] block">
                    Uttarkunth Stays
                  </span>
                  <span className="font-serif text-lg font-bold text-[#FFFDF9]">
                    Host Desk
                  </span>
                </div>
                <button
                  type="button"
                  data-testid="host-mobile-drawer-close"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  aria-label="Close Host navigation drawer"
                  className="w-9 h-9 rounded-xl bg-[#FFFDF9]/10 border border-[#FFFDF9]/15 flex items-center justify-center text-[#FFFDF9] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1">{renderSidebarContent(false)}</div>
            </aside>
          </div>
        )}

        {/* ===================================================================
            DESKTOP PERSISTENT VERTICAL SIDEBAR (1024px+)
           =================================================================== */}
        <aside
          data-testid="host-desktop-sidebar"
          className={`hidden lg:flex flex-col shrink-0 bg-[#1A2B23] text-[#FFFDF9] border-r border-[#FFFDF9]/10 p-3.5 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto transition-all duration-200 ${
            isSidebarCollapsed ? 'w-[76px]' : 'w-[244px]'
          }`}
        >
          {renderSidebarContent(isSidebarCollapsed)}
        </aside>

        {/* ===================================================================
            MAIN HOST WORKSPACE CONTENT SURFACE
           =================================================================== */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-7 py-5 sm:py-6 pb-24 lg:pb-10">
          {children}
        </main>

        {/* ===================================================================
            MOBILE HOST WORKSPACE BOTTOM NAVIGATION (< 1024px)
           =================================================================== */}
        <nav
          aria-label="Mobile Host Quick Navigation"
          data-testid="host-mobile-bottom-bar"
          className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#FFFDF9]/98 backdrop-blur-md border-t border-[#D9CCB8] shadow-[0_-6px_20px_rgba(26,43,35,0.08)] px-2 py-1.5 grid grid-cols-5 gap-1"
        >
          <Link
            href="/account/stays/host"
            className={`min-h-[48px] rounded-xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition-colors ${
              pathname === '/account/stays/host'
                ? 'bg-[#263D32]/10 text-[#263D32]'
                : 'text-[#5C5549]'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Home</span>
          </Link>

          <Link
            href="/account/stays/host/bookings"
            className={`relative min-h-[48px] rounded-xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition-colors ${
              pathname?.startsWith('/account/stays/host/bookings')
                ? 'bg-[#263D32]/10 text-[#263D32]'
                : 'text-[#5C5549]'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Bookings</span>
            {pendingCount > 0 && (
              <span className="absolute top-1 right-3 min-w-[16px] h-4 px-1 rounded-full bg-[#C55B23] text-[#FFFDF9] text-[10px] font-extrabold flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </Link>

          <Link
            href="/account/stays/host/calendar"
            className={`min-h-[48px] rounded-xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition-colors ${
              pathname?.startsWith('/account/stays/host/calendar')
                ? 'bg-[#263D32]/10 text-[#263D32]'
                : 'text-[#5C5549]'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Calendar</span>
          </Link>

          <Link
            href="/account/stays/host/properties"
            className={`min-h-[48px] rounded-xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition-colors ${
              pathname?.startsWith('/account/stays/host/properties')
                ? 'bg-[#263D32]/10 text-[#263D32]'
                : 'text-[#5C5549]'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Properties</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="min-h-[48px] rounded-xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold text-[#5C5549] hover:text-[#263D32] cursor-pointer"
          >
            <Menu className="w-4 h-4" />
            <span>More</span>
          </button>
        </nav>
      </div>
    </HostWorkspaceContext.Provider>
  );
}
