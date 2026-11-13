import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveActivePillarFromPathname,
  getContextualQuickAction,
  getProfileMenuItems,
  resolveUserAvatarDisplay,
  resolveMobileSearchContext,
  hasUnreadNotifications,
} from '../lib/mobile-navigation';
import { globalEcosystemSearchHandler } from '../lib/smart-suggestions';
import { toggleSavedItemInList } from '../lib/favourites';
import { CURATED_DESTINATIONS } from '../lib/destinations';
import {
  AUTHENTIC_PRODUCTIONS,
  EXISTING_PROPERTIES,
  PRODUCT_CATEGORIES,
} from '../lib/constants';

test('resolveActivePillarFromPathname maps routes to dynamic 2nd bottom nav item', () => {
  const home = resolveActivePillarFromPathname('/');
  assert.equal(home.id, 'home');
  assert.equal(home.label, 'Explore');
  assert.equal(home.iconName, 'compass');
  assert.equal(home.isPillarRoute, false);

  const stays = resolveActivePillarFromPathname('/stays/destinations/manali');
  assert.equal(stays.id, 'stays');
  assert.equal(stays.label, 'Stays');
  assert.equal(stays.iconName, 'bed');
  assert.equal(stays.isPillarRoute, true);

  const products = resolveActivePillarFromPathname('/products');
  assert.equal(products.id, 'products');
  assert.equal(products.label, 'Products');
  assert.equal(products.iconName, 'shopping-bag');
  assert.equal(products.isPillarRoute, true);

  const productions = resolveActivePillarFromPathname('/production/aaj-ka-devta-dual-role');
  assert.equal(productions.id, 'productions');
  assert.equal(productions.label, 'Productions');
  assert.equal(productions.iconName, 'clapperboard');
  assert.equal(productions.isPillarRoute, true);

  const community = resolveActivePillarFromPathname('/community');
  assert.equal(community.id, 'community');
  assert.equal(community.label, 'Community');
  assert.equal(community.iconName, 'users');
  assert.equal(community.isPillarRoute, true);
});

test('getContextualQuickAction returns the 5th bottom nav item after Favourites for each pillar', () => {
  // Home: no 5th icon
  assert.equal(getContextualQuickAction('home'), null);

  // Stays: My Trips
  const staysAction = getContextualQuickAction('stays');
  assert.ok(staysAction);
  assert.equal(staysAction.id, 'my-trips');
  assert.equal(staysAction.label, 'My Trips');
  assert.equal(staysAction.href, '/trips');

  // Products: My Cart
  const productsAction = getContextualQuickAction('products');
  assert.ok(productsAction);
  assert.equal(productsAction.id, 'my-cart');
  assert.equal(productsAction.label, 'My Cart');
  assert.equal(productsAction.href, '/account/products');

  // Productions: Continue Watching
  const productionsAction = getContextualQuickAction('productions');
  assert.ok(productionsAction);
  assert.equal(productionsAction.id, 'continue-watching');
  assert.equal(productionsAction.label, 'Continue Watching');
  assert.equal(productionsAction.href, '/account/productions');

  // Community: Join Us
  const communityAction = getContextualQuickAction('community');
  assert.ok(communityAction);
  assert.equal(communityAction.id, 'join-us');
  assert.equal(communityAction.label, 'Join Us');
  assert.equal(communityAction.href, '/community/join');
});

test('getProfileMenuItems returns Guest (5) vs Authenticated (9) menu links above the bottom CTA footer', () => {
  const guestItems = getProfileMenuItems(false, '/');
  assert.deepEqual(
    guestItems.map((i) => i.label),
    ['My Profile', 'Notifications', 'About Uttarkunth', 'Partner With Us', 'Contact']
  );

  const authItems = getProfileMenuItems(true, '/stays');
  assert.deepEqual(
    authItems.map((i) => i.label),
    [
      'My Profile',
      'Notifications',
      'My Trips',
      'My Orders',
      'Continue Watching',
      'Settings',
      'About Uttarkunth',
      'Partner With Us',
      'Contact',
    ]
  );
});

test('resolveUserAvatarDisplay returns profile photo if added, otherwise first letter of name', () => {
  const guest = resolveUserAvatarDisplay(null);
  assert.equal(guest.isAuthenticated, false);
  assert.equal(guest.avatarUrl, null);
  assert.equal(guest.initial, null);

  const nameOnlyUser = resolveUserAvatarDisplay({
    id: 'u1',
    email: 'explorer@uttarkunth.com',
    user_metadata: { full_name: 'Gaurav Negi' },
  });
  assert.equal(nameOnlyUser.isAuthenticated, true);
  assert.equal(nameOnlyUser.avatarUrl, null);
  assert.equal(nameOnlyUser.initial, 'G');

  const avatarUser = resolveUserAvatarDisplay({
    id: 'u2',
    email: 'explorer@uttarkunth.com',
    user_metadata: {
      full_name: 'Gaurav Negi',
      avatar_url: 'https://picsum.photos/seed/avatar/100/100',
    },
  });
  assert.equal(avatarUser.isAuthenticated, true);
  assert.equal(avatarUser.avatarUrl, 'https://picsum.photos/seed/avatar/100/100');
  assert.equal(avatarUser.initial, 'G');
});

test('hasUnreadNotifications reflects existing notification read status', () => {
  assert.equal(hasUnreadNotifications([]), false);
  assert.equal(hasUnreadNotifications([{ id: '1', read: true }]), false);
  assert.equal(
    hasUnreadNotifications([
      { id: '1', read: true },
      { id: '2', read: false },
    ]),
    true
  );
  assert.equal(
    hasUnreadNotifications(
      [
        { id: '1', read: true },
        { id: '2', read: false },
      ],
      ['2']
    ),
    false
  );
});

test('resolveMobileSearchContext selects global on Home & Community and pillar-specific on Stays, Products, Productions', () => {
  assert.equal(resolveMobileSearchContext('/'), 'global');
  assert.equal(resolveMobileSearchContext('/community'), 'global');
  assert.equal(resolveMobileSearchContext('/community/participate'), 'global');
  assert.equal(resolveMobileSearchContext('/stays'), 'stays');
  assert.equal(resolveMobileSearchContext('/products'), 'products');
  assert.equal(resolveMobileSearchContext('/production'), 'productions');
});

test('globalEcosystemSearchHandler categorizes matching results by pillar only when content exists', () => {
  const productCategories = PRODUCT_CATEGORIES.filter((c) => c.id !== 'other').map((c) => ({
    ...c,
  }));
  const productions = AUTHENTIC_PRODUCTIONS.map((p) => ({ ...p }));

  const manaliResults = globalEcosystemSearchHandler({
    query: 'Manali',
    destinations: CURATED_DESTINATIONS,
    properties: EXISTING_PROPERTIES,
    products: [],
    productCategories,
    productions,
  });

  assert.ok(manaliResults.length > 0);
  assert.ok(manaliResults.some((r) => r.pillarBadge === 'Stays' && r.title.includes('Manali')));
  assert.ok(manaliResults.every((r) => r.pillarBadge === 'Stays'));

  const jariResults = globalEcosystemSearchHandler({
    query: 'Jari',
    destinations: CURATED_DESTINATIONS,
    properties: EXISTING_PROPERTIES,
    products: [],
    productCategories,
    productions,
  });
  const badges = new Set(jariResults.map((r) => r.pillarBadge));
  assert.ok(badges.has('Stays'));
  assert.ok(badges.has('Productions'));
  assert.ok(badges.has('Community'));
});

test('toggleSavedItemInList adds and removes saved items without sample data', () => {
  const first = toggleSavedItemInList([], {
    id: 'yash-home-stay-jari',
    category: 'stays',
    title: 'Yash Home Stay',
    subtitle: 'Jari, Kullu',
    href: '/stays/yash-home-stay-jari',
  });
  assert.equal(first.saved, true);
  assert.equal(first.nextList.length, 1);

  const second = toggleSavedItemInList(first.nextList, {
    id: 'yash-home-stay-jari',
    category: 'stays',
    title: 'Yash Home Stay',
    subtitle: 'Jari, Kullu',
    href: '/stays/yash-home-stay-jari',
  });
  assert.equal(second.saved, false);
  assert.equal(second.nextList.length, 0);
});
