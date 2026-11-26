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
  ChevronDown,
  Shield,
  ArrowLeft,
  Bell,
  Sparkles,
  ExternalLink,
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

  if (!isHost && !isAdmin) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    );
  }

  const activeCount = properties.filter(isPropertyLive).length;
  const currentSelectedProp =
    selectedPropertyId === 'all'
      ? null
      : properties.find((p) => p.id === selectedPropertyId) || null;
  const switcherMonogram = currentSelectedProp
    ? getPropertyDisplayName(currentSelectedProp).charAt(0).toUpperCase()
    : properties[0]
    ? getPropertyDisplayName(properties[0]).charAt(0).toUpperCase()
    : 'U';

  const navGroups: {
    groupLabel: string;
    items: {
      id: string;
      label: string;
      href: string;
      icon: React.ComponentType<{ className?: string }>;
      isActive: boolean;
      badge?: number;
      badgeType?: 'count' | 'pending';
    }[];
  }[] = [
    {
      groupLabel: 'Workspace',
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
      groupLabel: 'Property workspace',
      items: [
        {
          id: 'properties',
          label: 'My Properties',
          href: '/account/stays/host/properties',
          icon: Home,
          isActive: pathname?.startsWith('/account/stays/host/properties') || false,
          badge: properties.length,
          badgeType: 'count',
        },
      ],
    },
    {
      groupLabel: 'Manage stays',
      items: [
        {
          id: 'bookings',
          label: 'Bookings',
          href: '/account/stays/host/bookings',
          icon: Inbox,
          isActive: pathname?.startsWith('/account/stays/host/bookings') || false,
          badge: pendingCount,
          badgeType: 'pending',
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
      groupLabel: 'Insights',
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
      groupLabel: 'Account & support',
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
        {!collapsed && (
          <div className="flex items-center justify-between px-2.5 pt-1">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#D9CCB8]">
              HOST WORKSPACE
            </span>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-[#A84C1C]/40 text-[#FFFDF9] border border-[#FFFDF9]/20">
                <Shield className="w-2.5 h-2.5" /> Admin
              </span>
            )}
          </div>
        )}

        {/* Top Property Switcher matching V2 Prototype */}
        {!collapsed ? (
          <div className="relative mx-1 p-2.5 rounded-[13px] bg-[#FFFDF9]/[0.075] hover:bg-[#FFFDF9]/[0.11] border border-[#FFFDF9]/16 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-[9px] bg-gradient-to-br from-[#78927E] to-[#345244] border border-white/20 flex items-center justify-center text-white font-serif text-lg font-semibold shrink-0">
                {switcherMonogram}
              </div>
              <div className="min-w-0 flex-1">
                <div className="relative">
                  <select
                    id="host-sidebar-property-select"
                    aria-label="Select property workspace"
                    data-testid="host-property-selector"
                    value={selectedPropertyId}
                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                    className="w-full appearance-none bg-transparent pr-5 text-[#FFFDF9] text-xs font-extrabold truncate focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-[#1A2B23] text-[#FFFDF9]">
                      All properties
                    </option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id} className="bg-[#1A2B23] text-[#FFFDF9]">
                        {getPropertyDisplayName(p)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#D9CCB8] absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-bold text-[#B8D8C1]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#77BD8F] shrink-0" />
                  <span className="truncate">
                    {activeCount} active {activeCount === 1 ? 'listing' : 'listings'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-1">
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(false)}
              title="Expand sidebar to switch property"
              className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-[#78927E] to-[#345244] border border-white/20 flex items-center justify-center text-white font-serif text-lg font-semibold cursor-pointer"
            >
              {switcherMonogram}
            </button>
          </div>
        )}

        {/* Navigation Groups */}
        <nav aria-label="Host Workspace Navigation" className="space-y-4">
          {navGroups.map((group) => (
            <div key={group.groupLabel} className="space-y-1">
              {!collapsed && (
                <div className="px-3 text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#BEB3A3]">
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
                      className={`group flex items-center justify-between gap-2.5 min-h-[41px] px-3 rounded-[11px] text-xs font-bold transition-all duration-150 ${
                        item.isActive
                          ? 'bg-[#A84C1C] text-white border border-[#FFDAC2]/16 shadow-[0_6px_16px_rgba(0,0,0,0.18)]'
                          : 'text-[#E1DDD4] border border-transparent hover:bg-[#FFFDF9]/[0.09] hover:text-[#FFFDF9]'
                      } ${collapsed ? 'justify-center px-2' : ''}`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-[17px] h-[17px] shrink-0 transition-colors ${
                            item.isActive
                              ? 'text-white'
                              : 'text-[#BFB8AA] group-hover:text-[#F2B58E]'
                          }`}
                        />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </span>

                      {!collapsed && typeof item.badge !== 'undefined' && (
                        <span
                          className={`min-w-[20px] px-1.5 py-0.5 rounded-[7px] text-[10px] font-extrabold tabular-nums text-center ${
                            item.badgeType === 'count'
                              ? 'bg-[#FFFDF9]/[0.13] text-[#FFFDF9] border border-[#FFFDF9]/14'
                              : item.isActive
                              ? 'bg-[#FFFDF9] text-[#8E3E17]'
                              : 'bg-[#F5E4DA] text-[#8E3E17]'
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

      {/* Bottom Help Card & Footer */}
      <div className="space-y-3 pt-2">
        {!collapsed && (
          <div className="mx-1 p-3.5 rounded-[14px] bg-[#FFFDF9]/[0.075] border border-[#FFFDF9]/[0.13] space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#FFFDF9]">
              <Sparkles className="w-3.5 h-3.5 text-[#F2B58E]" />
              <span>Here when you need us</span>
            </div>
            <p className="text-[11px] text-[#D5CCBE] leading-relaxed">
              Get help with guest requests, property details and availability.
            </p>
            <Link
              href="/account/stays/host/support"
              className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#F2B58E] hover:text-white transition-colors pt-0.5"
            >
              <span>Visit host support</span>
              <span>&rarr;</span>
            </Link>
          </div>
        )}

        <div className="pt-3 border-t border-[#FFFDF9]/14 flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href="/account"
              title="Return to general Account overview"
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#BEB3A3] hover:text-[#FFFDF9] transition-colors truncate"
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
              {!collapsed && <span className="truncate">Uttarkunth Host Desk</span>}
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            data-testid="host-sidebar-collapse-toggle"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden md:inline-flex w-7 h-7 rounded-lg bg-[#FFFDF9]/8 hover:bg-[#FFFDF9]/15 border border-[#FFFDF9]/12 items-center justify-center text-[#BEB3A3] hover:text-[#FFFDF9] transition-colors cursor-pointer shrink-0"
          >
            {collapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
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
        className="min-h-[calc(100vh-4rem)] bg-[#F5F0E6] text-[#29251F] flex flex-col md:flex-row max-w-[1600px] mx-auto"
      >
        {/* ===================================================================
            MOBILE TOP WORKSPACE BAR (< 768px)
           =================================================================== */}
        <div
          data-testid="host-mobile-topbar"
          className="md:hidden sticky top-16 z-30 bg-[#1A2B23] text-[#FFFDF9] border-b border-[#FFFDF9]/12 px-3.5 py-2.5 flex items-center justify-between gap-2.5 shadow-sm"
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
              <span className="block text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#F2B58E]">
                Uttarkunth Host Desk
              </span>
              <select
                aria-label="Filter by assigned property"
                data-testid="host-mobile-property-selector"
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="bg-transparent text-[#FFFDF9] text-xs font-extrabold focus:outline-none truncate max-w-[175px] sm:max-w-[260px] cursor-pointer"
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
              className="relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#FFFDF9]/10 border border-[#FFFDF9]/15 text-xs font-bold text-[#FFFDF9]"
              title="Pending booking requests"
            >
              <Bell className="w-3.5 h-3.5 text-[#F2B58E]" />
              <span className="tabular-nums">{pendingCount}</span>
              {pendingCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#C55B23] absolute -top-0.5 -right-0.5" />
              )}
            </Link>
          </div>
        </div>

        {/* ===================================================================
            MOBILE SLIDE-IN NAVIGATION DRAWER (< 768px)
           =================================================================== */}
        {isMobileDrawerOpen && (
          <div
            className="md:hidden fixed inset-0 z-50 flex"
            role="dialog"
            aria-modal="true"
            aria-label="Host Workspace Navigation Drawer"
            data-testid="host-mobile-drawer"
          >
            <div
              className="fixed inset-0 bg-[#141F19]/50 backdrop-blur-[2px]"
              onClick={() => setIsMobileDrawerOpen(false)}
              aria-hidden="true"
            />
            <aside className="relative z-10 w-[272px] max-w-[85vw] bg-[#1A2B23] text-[#FFFDF9] h-full overflow-y-auto p-4 flex flex-col justify-between shadow-2xl border-r border-[#FFFDF9]/12">
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#FFFDF9]/12">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-[10px] bg-[#263D32] border border-[#FFFDF9]/15 flex items-center justify-center text-[#F7E8D4] font-serif text-lg font-semibold">
                    उ
                  </div>
                  <div>
                    <span className="font-serif text-lg font-semibold text-[#FFFDF9] leading-none block">
                      Uttarkunth
                    </span>
                    <span className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#BEB3A3] block mt-0.5">
                      Host Desk
                    </span>
                  </div>
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
            TABLET & DESKTOP PERSISTENT VERTICAL SIDEBAR (768px+)
           =================================================================== */}
        <aside
          data-testid="host-desktop-sidebar"
          className={`hidden md:flex flex-col shrink-0 bg-[#1A2B23] text-[#FFFDF9] border-r border-[#FFFDF9]/10 px-3.5 py-5 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto transition-all duration-200 ${
            isSidebarCollapsed ? 'w-[76px]' : 'w-[224px] lg:w-[238px]'
          }`}
        >
          {renderSidebarContent(isSidebarCollapsed)}
        </aside>

        {/* ===================================================================
            MAIN HOST WORKSPACE CONTENT SURFACE
           =================================================================== */}
        <main className="flex-1 min-w-0 px-3.5 sm:px-5 lg:px-8 py-5 sm:py-6 pb-24 md:pb-12">
          {children}
        </main>

        {/* ===================================================================
            MOBILE HOST WORKSPACE BOTTOM NAVIGATION (< 768px)
           =================================================================== */}
        <nav
          aria-label="Mobile Host Quick Navigation"
          data-testid="host-mobile-bottom-bar"
          className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#FFFDF9]/98 backdrop-blur-md border-t border-[#263D32]/12 shadow-[0_-6px_20px_rgba(26,43,35,0.08)] px-2 py-1.5 grid grid-cols-5 gap-1"
        >
          <Link
            href="/account/stays/host"
            className={`min-h-[48px] rounded-xl flex flex-col items-center justify-center gap-0.5 text-[10px] font-extrabold transition-colors ${
              pathname === '/account/stays/host'
                ? 'text-[#263D32]'
                : 'text-[#948B7E]'
            }`}
          >
            <LayoutGrid
              className={`w-4 h-4 ${
                pathname === '/account/stays/host' ? 'text-[#C55B23]' : 'text-[#948B7E]'
              }`}
            />
            <span>Home</span>
          </Link>

          <Link
            href="/account/stays/host/bookings"
            className={`relative min-h-[48px] rounded-xl flex flex-col items-center justify-center gap-0.5 text-[10px] font-extrabold transition-colors ${
              pathname?.startsWith('/account/stays/host/bookings')
                ? 'text-[#263D32]'
                : 'text-[#948B7E]'
            }`}
          >
            <Inbox
              className={`w-4 h-4 ${
                pathname?.startsWith('/account/stays/host/bookings')
                  ? 'text-[#C55B23]'
                  : 'text-[#948B7E]'
              }`}
            />
            <span>Bookings</span>
            {pendingCount > 0 && (
              <span className="absolute top-1 right-3 min-w-[16px] h-4 px-1 rounded-full bg-[#C55B23] text-[#FFFDF9] text-[9px] font-extrabold flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </Link>

          <Link
            href="/account/stays/host/calendar"
            className={`min-h-[48px] rounded-xl flex flex-col items-center justify-center gap-0.5 text-[10px] font-extrabold transition-colors ${
              pathname?.startsWith('/account/stays/host/calendar')
                ? 'text-[#263D32]'
                : 'text-[#948B7E]'
            }`}
          >
            <CalendarDays
              className={`w-4 h-4 ${
                pathname?.startsWith('/account/stays/host/calendar')
                  ? 'text-[#C55B23]'
                  : 'text-[#948B7E]'
              }`}
            />
            <span>Calendar</span>
          </Link>

          <Link
            href="/account/stays/host/properties"
            className={`min-h-[48px] rounded-xl flex flex-col items-center justify-center gap-0.5 text-[10px] font-extrabold transition-colors ${
              pathname?.startsWith('/account/stays/host/properties')
                ? 'text-[#263D32]'
                : 'text-[#948B7E]'
            }`}
          >
            <Home
              className={`w-4 h-4 ${
                pathname?.startsWith('/account/stays/host/properties')
                  ? 'text-[#C55B23]'
                  : 'text-[#948B7E]'
              }`}
            />
            <span>Properties</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="min-h-[48px] rounded-xl flex flex-col items-center justify-center gap-0.5 text-[10px] font-extrabold text-[#948B7E] hover:text-[#263D32] cursor-pointer"
          >
            <Menu className="w-4 h-4" />
            <span>More</span>
          </button>
        </nav>
      </div>
    </HostWorkspaceContext.Provider>
  );
}
