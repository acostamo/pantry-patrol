import { computed, inject, Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

import { PantryItem, RENEW_EXTENSION_DAYS } from '../models/pantry-item.model';
import { NotificationService } from './notification.service';
import { PhotoService } from './photo.service';

const STORAGE_KEY = 'pantry_items';

/**
 * Single source of truth for the pantry inventory.
 *
 * The full item list lives in a signal and is persisted as one JSON document
 * through @capacitor/preferences, which works identically on Android, iOS and
 * web (localStorage) — perfect for a household-sized inventory and a 100%
 * offline app. Every mutation is automatically mirrored to storage and to the
 * OS notification scheduler.
 */
@Injectable({ providedIn: 'root' })
export class PantryStore {
  private readonly notifications = inject(NotificationService);
  private readonly photoService = inject(PhotoService);
  private readonly itemsSignal = signal<PantryItem[]>([]);

  /** All items, sorted by soonest expiration first. */
  readonly items = computed(() =>
    [...this.itemsSignal()].sort((a, b) => a.expireDate.localeCompare(b.expireDate)),
  );

  /** Loads the persisted inventory from on-device storage (call once at startup). */
  async load(): Promise<void> {
    const { value } = await Preferences.get({ key: STORAGE_KEY });
    this.itemsSignal.set(value ? (JSON.parse(value) as PantryItem[]) : []);
  }

  async add(item: PantryItem): Promise<void> {
    this.itemsSignal.update((items) => [...items, item]);
    await this.persist();
    await this.notifications.scheduleExpirationAlert(item);
  }

  async update(item: PantryItem): Promise<void> {
    this.itemsSignal.update((items) => items.map((i) => (i.id === item.id ? item : i)));
    await this.persist();
    await this.notifications.cancelExpirationAlert(item.notificationId);
    await this.notifications.scheduleExpirationAlert(item);
  }

  async remove(item: PantryItem): Promise<void> {
    this.itemsSignal.update((items) => items.filter((i) => i.id !== item.id));
    await this.persist();
    await this.notifications.cancelExpirationAlert(item.notificationId);
    void this.photoService.deleteIfLocal(item.thumbUrl);
  }

  /** Swipe-right quick renew: push the expiration date into the future. */
  async renew(item: PantryItem): Promise<void> {
    const renewed = new Date();
    renewed.setDate(renewed.getDate() + RENEW_EXTENSION_DAYS);
    await this.update({ ...item, expireDate: renewed.toISOString() });
  }

  private async persist(): Promise<void> {
    await Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(this.itemsSignal()) });
  }
}
