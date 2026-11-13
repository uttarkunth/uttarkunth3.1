export type ActivePillarId = 'home' | 'stays' | 'products' | 'productions' | 'community';

export type DynamicNavIconName =
  | 'compass'
  | 'bed'
  | 'shopping-bag'
  | 'clapperboard'
  | 'users';

export type QuickActionIconName =
  | 'briefcase'
  | 'shopping-cart'
  | 'play-circle'
  | 'handshake';

export type ProfileMenuIconName =
  | 'user'
  | 'bell'
  | 'briefcase'
  | 'shopping-bag'
  | 'clapperboard'
  | 'settings'
  | 'info'
  | 'handshake'
  | 'mail'
  | 'log-out';

export interface DynamicSecondNavItem {
  id: ActivePillarId;
  label: 'Explore' | 'Stays' | 'Products' | 'Productions' | 'Community';
  iconName: DynamicNavIconName;
  href: string;
  isPillarRoute: boolean;
}

export interface PillarSelectorOption {
  id: Exclude<ActivePillarId, 'home'>;
  label: 'Stays' | 'Products' | 'Productions' | 'Community';
  iconName: Exclude<DynamicNavIconName, 'compass'>;
  href: string;
}

export interface ContextualQuickAction {
  id: 'my-trips' | 'my-cart' | 'continue-watching' | 'join-us';
  label: 'My Trips' | 'My Cart' | 'Continue Watching' | 'Join Us';
  href: string;
  iconName: QuickActionIconName;
  pillar: Exclude<ActivePillarId, 'home'>;
}

export interface ProfileMenuItem {
  id: string;
  label: string;
  href: string;
  iconName: ProfileMenuIconName;
  requiresAuth: boolean;
}

export interface UserIdentityInput {
  id?: string;
  email?: string | null;
  full_name?: string | null;
  preferred_name?: string | null;
  avatar_url?: string | null;
  user_metadata?: {
    full_name?: string | null;
    preferred_name?: string | null;
    name?: string | null;
    avatar_url?: string | null;
    picture?: string | null;
  } | null;
}

export interface ResolvedUserAvatarDisplay {
  isAuthenticated: boolean;
  avatarUrl: string | null;
  initial: string | null;
  displayName: string | null;
}

export type MobileSearchContext = 'global' | 'stays' | 'products' | 'productions';

export const PILLAR_SELECTOR_OPTIONS: readonly PillarSelectorOption[] = [
  {
    id: 'stays',
    label: 'Stays',
    iconName: 'bed',
    href: '/stays',
  },
  {
    id: 'products',
    label: 'Products',
    iconName: 'shopping-bag',
    href: '/products',
  },
  {
    id: 'productions',
    label: 'Productions',
    iconName: 'clapperboard',
    href: '/production',
  },
  {
    id: 'community',
    label: 'Community',
    iconName: 'users',
    href: '/community',
  },
] as const;

/**
 * Resolves the active pillar and the dynamic 2nd bottom navigation item directly from the URL pathname.
 */
export function resolveActivePillarFromPathname(pathname: string | null | undefined): DynamicSecondNavItem {
  const cleanPath = (pathname || '/').split('?')[0].split('#')[0] || '/';

  if (
    cleanPath === '/stays' ||
    cleanPath.startsWith('/stays/') ||
    cleanPath.startsWith('/properties') ||
    cleanPath === '/trips' ||
    cleanPath.startsWith('/trips/')
  ) {
    return {
      id: 'stays',
      label: 'Stays',
      iconName: 'bed',
      href: '/stays',
      isPillarRoute: true,
    };
  }

  if (
    cleanPath === '/products' ||
    cleanPath.startsWith('/products/') ||
    cleanPath === '/account/products'
  ) {
    return {
      id: 'products',
      label: 'Products',
      iconName: 'shopping-bag',
      href: '/products',
      isPillarRoute: true,
    };
  }

  if (
    cleanPath === '/production' ||
    cleanPath.startsWith('/production/') ||
    cleanPath === '/account/productions'
  ) {
    return {
      id: 'productions',
      label: 'Productions',
      iconName: 'clapperboard',
      href: '/production',
      isPillarRoute: true,
    };
  }

  if (cleanPath === '/community' || cleanPath.startsWith('/community/')) {
    return {
      id: 'community',
      label: 'Community',
      iconName: 'users',
      href: '/community',
      isPillarRoute: true,
    };
  }

  return {
    id: 'home',
    label: 'Explore',
    iconName: 'compass',
    href: '/',
    isPillarRoute: false,
  };
}

/**
 * Resolves the 5th bottom navigation item added after Favourites when a pillar is active:
 * - Stays: My Trips (briefcase icon) -> /trips
 * - Products: My Cart (shopping-cart icon) -> /account/products
 * - Productions: Continue Watching (play-circle icon) -> /account/productions
 * - Community: Join Us (handshake icon) -> /community/join
 * - Home: null (only 4 icons shown on Home)
 */
export function getContextualQuickAction(
  activePillar: ActivePillarId
): ContextualQuickAction | null {
  switch (activePillar) {
    case 'stays':
      return {
        id: 'my-trips',
        label: 'My Trips',
        href: '/trips',
        iconName: 'briefcase',
        pillar: 'stays',
      };
    case 'products':
      return {
        id: 'my-cart',
        label: 'My Cart',
        href: '/account/products',
        iconName: 'shopping-cart',
        pillar: 'products',
      };
    case 'productions':
      return {
        id: 'continue-watching',
        label: 'Continue Watching',
        href: '/account/productions',
        iconName: 'play-circle',
        pillar: 'productions',
      };
    case 'community':
      return {
        id: 'join-us',
        label: 'Join Us',
        href: '/community/join',
        iconName: 'handshake',
        pillar: 'community',
      };
    case 'home':
    default:
      return null;
  }
}

/**
 * Resolves the context-aware Partner With Us destination based on current pathname.
 */
export function getPartnerWithUsHref(pathname: string | null | undefined): string {
  const cleanPath = (pathname || '/').split('?')[0].split('#')[0] || '/';
  if (cleanPath.startsWith('/stays') || cleanPath.startsWith('/properties')) {
    return '/stays/partner';
  }
  if (cleanPath.startsWith('/products')) {
    return '/products/sell';
  }
  if (cleanPath.startsWith('/production')) {
    return '/production/collaborate';
  }
  if (cleanPath.startsWith('/community')) {
    return '/community/join';
  }
  return '/community/join';
}

/**
 * Returns the navigation links inside the profile menu card (excluding the bottom Login/Signup or Logout CTA footer).
 */
export function getProfileMenuItems(
  isAuthenticated: boolean,
  pathname: string | null | undefined
): ProfileMenuItem[] {
  const safePath = pathname || '/';
  const partnerHref = getPartnerWithUsHref(safePath);

  if (!isAuthenticated) {
    return [
      {
        id: 'my-profile',
        label: 'My Profile',
        href: `/login?returnUrl=${encodeURIComponent(safePath)}`,
        iconName: 'user',
        requiresAuth: false,
      },
      {
        id: 'notifications',
        label: 'Notifications',
        href: `/login?returnUrl=${encodeURIComponent('/account/notifications')}`,
        iconName: 'bell',
        requiresAuth: false,
      },
      {
        id: 'about-uttarkunth',
        label: 'About Uttarkunth',
        href: '/about',
        iconName: 'info',
        requiresAuth: false,
      },
      {
        id: 'partner-with-us',
        label: 'Partner With Us',
        href: partnerHref,
        iconName: 'handshake',
        requiresAuth: false,
      },
      {
        id: 'contact',
        label: 'Contact',
        href: '/contact',
        iconName: 'mail',
        requiresAuth: false,
      },
    ];
  }

  return [
    {
      id: 'my-profile',
      label: 'My Profile',
      href: '/account/profile',
      iconName: 'user',
      requiresAuth: true,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      href: '/account/notifications',
      iconName: 'bell',
      requiresAuth: true,
    },
    {
      id: 'my-trips',
      label: 'My Trips',
      href: '/trips',
      iconName: 'briefcase',
      requiresAuth: true,
    },
    {
      id: 'my-orders',
      label: 'My Orders',
      href: '/account/products',
      iconName: 'shopping-bag',
      requiresAuth: true,
    },
    {
      id: 'continue-watching',
      label: 'Continue Watching',
      href: '/account/productions',
      iconName: 'clapperboard',
      requiresAuth: true,
    },
    {
      id: 'settings',
      label: 'Settings',
      href: '/account/settings',
      iconName: 'settings',
      requiresAuth: true,
    },
    {
      id: 'about-uttarkunth',
      label: 'About Uttarkunth',
      href: '/about',
      iconName: 'info',
      requiresAuth: false,
    },
    {
      id: 'partner-with-us',
      label: 'Partner With Us',
      href: partnerHref,
      iconName: 'handshake',
      requiresAuth: false,
    },
    {
      id: 'contact',
      label: 'Contact',
      href: '/contact',
      iconName: 'mail',
      requiresAuth: false,
    },
  ];
}

/**
 * Resolves the user's profile avatar URL (if added) or the first letter of their name (falling back to email initial).
 * Used in both the Header profile button and the "My Profile" item inside the profile menu card.
 */
export function resolveUserAvatarDisplay(
  user: UserIdentityInput | null | undefined
): ResolvedUserAvatarDisplay {
  if (!user) {
    return {
      isAuthenticated: false,
      avatarUrl: null,
      initial: null,
      displayName: null,
    };
  }

  const meta = user.user_metadata || {};
  const rawAvatar =
    user.avatar_url || meta.avatar_url || meta.picture || null;
  const avatarUrl =
    typeof rawAvatar === 'string' && rawAvatar.trim().length > 0
      ? rawAvatar.trim()
      : null;

  const rawName =
    user.preferred_name ||
    user.full_name ||
    meta.preferred_name ||
    meta.full_name ||
    meta.name ||
    '';
  const cleanName = typeof rawName === 'string' ? rawName.trim() : '';

  const fallbackEmail = typeof user.email === 'string' ? user.email.trim() : '';
  const sourceForInitial = cleanName || fallbackEmail;
  const initial = sourceForInitial
    ? sourceForInitial.charAt(0).toUpperCase()
    : 'U';

  return {
    isAuthenticated: true,
    avatarUrl,
    initial,
    displayName: cleanName || fallbackEmail || null,
  };
}

/**
 * Determines whether the mobile search panel should operate in Global Ecosystem mode
 * (Homepage & Community) or pillar-specific mode (Stays, Products, Productions).
 */
export function resolveMobileSearchContext(pathname: string | null | undefined): MobileSearchContext {
  const active = resolveActivePillarFromPathname(pathname);
  if (active.id === 'stays') return 'stays';
  if (active.id === 'products') return 'products';
  if (active.id === 'productions') return 'productions';
  return 'global';
}

/**
 * Checks existing notification read-status records to determine if unread notifications exist.
 */
export function hasUnreadNotifications(
  notifications: Array<{ id?: string; read?: boolean }> | null | undefined,
  locallyReadIds: string[] = []
): boolean {
  if (!Array.isArray(notifications) || notifications.length === 0) {
    return false;
  }
  const readSet = new Set(locallyReadIds);
  return notifications.some((n) => n && n.read === false && (!n.id || !readSet.has(String(n.id))));
}
