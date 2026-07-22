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
