/** Days before expiry at which an item is considered "impending". */
export const IMPENDING_DAYS_THRESHOLD = 3;

/** Extra days granted by the swipe-right "quick renew" gesture. */
export const RENEW_EXTENSION_DAYS = 7;

export type ExpirationStatus = 'EXPIRED' | 'IMPENDING' | 'STABLE';

export interface PantryItem {
  /** Unique id (UUID). */
  id: string;
  /** Scanned UPC/EAN code; empty string when added manually. */
  barcode: string;
  name: string;
  /** Product thumbnail URL from Open Food Facts; empty when unknown. */
  thumbUrl: string;
  /** ISO-8601 date string. */
  expireDate: string;
  /** Numeric id used to schedule/cancel the OS local notification. */
  notificationId: number;
  /** Number of identical units sharing this expiry (always >= 1). */
  quantity: number;
  /** ISO-8601 date string, set once when the item is first added. */
  addedDate: string;
  /** Pinned items sort first on the home list. */
  favorite: boolean;
  /** Free-form notes. */
  notes: string;
  /** Free-form tags. */
  tags: string[];
  /** Price per unit (>= 0). */
  price: number;
}

/** Default unit count for a freshly created item. */
export const DEFAULT_QUANTITY = 1;

/**
 * Random numeric id used to schedule/cancel the OS local notification.
 * Crypto-secure so ids can't be guessed or collide predictably.
 */
export function randomNotificationId(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000_000;
}

/**
 * Coerces raw persisted data into a fully-populated item, filling defaults
 * for any fields absent in the stored JSON. Used on hydration so older
 * documents upgrade in place and the rest of the app can assume presence.
 */
export function normalizeItem(raw: Partial<PantryItem>): PantryItem {
  const quantity = Math.max(DEFAULT_QUANTITY, Math.floor(Number(raw.quantity) || DEFAULT_QUANTITY));
  const price = Math.max(0, Number(raw.price) || 0);
  return {
    id: raw.id ?? crypto.randomUUID(),
    barcode: raw.barcode ?? '',
    name: raw.name ?? '',
    thumbUrl: raw.thumbUrl ?? '',
    expireDate: raw.expireDate ?? '',
    notificationId: raw.notificationId ?? randomNotificationId(),
    quantity,
    addedDate: raw.addedDate ?? new Date().toISOString(),
    favorite: !!raw.favorite,
    notes: raw.notes ?? '',
    tags: Array.isArray(raw.tags) ? raw.tags.filter((t): t is string => typeof t === 'string') : [],
    price,
  };
}

/** Whole days from today until the expiration date (negative when already expired). */
export function daysUntilExpiry(expireDate: string, from: Date = new Date()): number {
  const expiry = new Date(expireDate);
  const startOfToday = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const startOfExpiryDay = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
  return Math.round((startOfExpiryDay.getTime() - startOfToday.getTime()) / 86_400_000);
}

export function expirationStatus(item: PantryItem): ExpirationStatus {
  const days = daysUntilExpiry(item.expireDate);
  if (days < 0) return 'EXPIRED';
  if (days <= IMPENDING_DAYS_THRESHOLD) return 'IMPENDING';
  return 'STABLE';
}
