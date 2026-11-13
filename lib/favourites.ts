export type SavedItemCategory = 'stays' | 'products' | 'productions' | 'destinations';

export interface SavedEcosystemItem {
  id: string;
  category: SavedItemCategory;
  title: string;
  subtitle: string;
  href: string;
  meta?: string;
  savedAt: number;
}

export const FAVOURITES_STORAGE_KEY = 'uttarkunth_saved_items_v1';
export const FAVOURITES_UPDATED_EVENT = 'uttarkunth-favourites-updated';

export const SAVED_CATEGORY_LABELS: Record<SavedItemCategory, string> = {
  stays: 'Saved Stays',
  products: 'Saved Products',
  productions: 'Saved Productions',
  destinations: 'Saved Destinations',
};

/**
 * Pure helper to toggle an item in a saved items array without mutating the input.
 */
export function toggleSavedItemInList(
  currentList: SavedEcosystemItem[],
  item: Omit<SavedEcosystemItem, 'savedAt'>
): { nextList: SavedEcosystemItem[]; saved: boolean } {
  const exists = currentList.some((entry) => entry.id === item.id && entry.category === item.category);
  if (exists) {
    return {
      nextList: currentList.filter(
        (entry) => !(entry.id === item.id && entry.category === item.category)
      ),
      saved: false,
    };
  }
  const nextItem: SavedEcosystemItem = {
    ...item,
    savedAt: Date.now(),
  };
  return {
    nextList: [nextItem, ...currentList],
    saved: true,
  };
}

export function loadSavedItems(): SavedEcosystemItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(FAVOURITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is SavedEcosystemItem =>
        Boolean(item && typeof item.id === 'string' && typeof item.title === 'string' && typeof item.href === 'string')
    );
  } catch {
    return [];
  }
}

export function persistSavedItems(items: SavedEcosystemItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FAVOURITES_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(FAVOURITES_UPDATED_EVENT, { detail: items }));
  } catch {
    // Ignore storage quota errors
  }
}

export function isEcosystemItemSaved(category: SavedItemCategory, id: string): boolean {
  const list = loadSavedItems();
  return list.some((entry) => entry.category === category && entry.id === id);
}

export function toggleSavedEcosystemItem(
  item: Omit<SavedEcosystemItem, 'savedAt'>
): { saved: boolean; items: SavedEcosystemItem[] } {
  const current = loadSavedItems();
  const { nextList, saved } = toggleSavedItemInList(current, item);
  persistSavedItems(nextList);
  return { saved, items: nextList };
}
