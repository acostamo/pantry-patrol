import {TestBed} from '@angular/core/testing';
import {PreferencesWeb} from '@capacitor/preferences/dist/esm/web';

import {PantryItem, RENEW_EXTENSION_DAYS} from '../models/pantry-item.model';
import {NotificationService} from './notification.service';
import {PhotoService} from './photo.service';
import {PantryStore} from './pantry-store.service';

describe('PantryStore', () => {
  let store: PantryStore;
  let notifications: jasmine.SpyObj<NotificationService>;
  let photos: jasmine.SpyObj<PhotoService>;
  let prefsGet: jasmine.Spy;
  let prefsSet: jasmine.Spy;

  const baseItem = (overrides: Partial<PantryItem> = {}): PantryItem => ({
    id: 'a',
    barcode: '',
    name: 'Milk',
    thumbUrl: '',
    expireDate: '2026-12-01T00:00:00.000Z',
    notificationId: 1,
    quantity: 1,
    addedDate: '2026-01-01T00:00:00.000Z',
    favorite: false,
    notes: '',
    tags: [],
    price: 0,
    ...overrides,
  });

  beforeEach(() => {
    prefsGet = spyOn(PreferencesWeb.prototype, 'get').and.resolveTo({ value: null });
    prefsSet = spyOn(PreferencesWeb.prototype, 'set').and.resolveTo();
    notifications = jasmine.createSpyObj('NotificationService', [
      'scheduleExpirationAlert',
      'cancelExpirationAlert',
    ]);
    photos = jasmine.createSpyObj('PhotoService', ['deleteIfLocal']);
    photos.deleteIfLocal.and.resolveTo();

    TestBed.configureTestingModule({
      providers: [
        { provide: NotificationService, useValue: notifications },
        { provide: PhotoService, useValue: photos },
      ],
    });
    store = TestBed.inject(PantryStore);
  });

  it('starts empty', () => {
    expect(store.items()).toEqual([]);
  });

  it('load() normalizes persisted items', async () => {
    const stored = [{ id: 'x', name: 'Legacy', expireDate: '2026-06-01T00:00:00.000Z', notificationId: 9 }];
    prefsGet.and.resolveTo({ value: JSON.stringify(stored) });

    await store.load();

    const items = store.items();
    expect(items).toHaveSize(1);
    expect(items[0].quantity).toBe(1);
    expect(items[0].favorite).toBe(false);
    expect(items[0].notes).toBe('');
    expect(items[0].tags).toEqual([]);
    expect(items[0].price).toBe(0);
  });

  it('add() persists and schedules a notification', async () => {
    const item = baseItem();
    await store.add(item);

    expect(store.items()).toContain(item);
    expect(prefsSet).toHaveBeenCalledWith({
      key: 'pantry_items',
      value: JSON.stringify([item]),
    });
    expect(notifications.scheduleExpirationAlert).toHaveBeenCalledWith(item);
  });

  it('update() replaces the item and reschedules the notification', async () => {
    const item = baseItem({ id: 'a' });
    await store.add(item);
    const updated = { ...item, name: 'Whole Milk' };
    prefsSet.calls.reset();

    await store.update(updated);

    expect(store.items()[0].name).toBe('Whole Milk');
    expect(notifications.cancelExpirationAlert).toHaveBeenCalledWith(item.notificationId);
    expect(notifications.scheduleExpirationAlert).toHaveBeenCalledWith(updated);
    expect(prefsSet).toHaveBeenCalled();
  });

  it('remove() removes, cancels the alert and deletes the local photo', async () => {
    const item = baseItem({ id: 'a', thumbUrl: 'file:///local/photo.jpg' });
    await store.add(item);

    await store.remove(item);

    expect(store.items()).toEqual([]);
    expect(notifications.cancelExpirationAlert).toHaveBeenCalledWith(item.notificationId);
    expect(photos.deleteIfLocal).toHaveBeenCalledWith(item.thumbUrl);
  });

  it('delegates photo cleanup to the photo service on remove', async () => {
    const item = baseItem({ id: 'a', thumbUrl: 'https://example.com/pic.jpg' });
    await store.add(item);

    await store.remove(item);

    expect(photos.deleteIfLocal).toHaveBeenCalledWith(item.thumbUrl);
  });

  it('renew() pushes the expiry date forward', async () => {
    const item = baseItem({ id: 'a', expireDate: '2026-06-01T00:00:00.000Z' });
    await store.add(item);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await store.renew(item);

    const renewedDate = new Date(store.items()[0].expireDate);
    renewedDate.setHours(0, 0, 0, 0);
    const expected = new Date(today);
    expected.setDate(expected.getDate() + RENEW_EXTENSION_DAYS);
    expect(renewedDate.getTime()).toBe(expected.getTime());
    expect(notifications.cancelExpirationAlert).toHaveBeenCalled();
    expect(notifications.scheduleExpirationAlert).toHaveBeenCalled();
  });

  it('sorts favorites first, then by soonest expiration', async () => {
    const soon = baseItem({ id: 'b', name: 'Yogurt', expireDate: '2026-05-01T00:00:00.000Z' });
    const fav = baseItem({ id: 'a', name: 'Milk', favorite: true, expireDate: '2026-12-01T00:00:00.000Z' });
    const stable = baseItem({ id: 'c', name: 'Rice', expireDate: '2026-10-01T00:00:00.000Z' });

    await store.add(soon);
    await store.add(fav);
    await store.add(stable);

    expect(store.items().map((i) => i.id)).toEqual(['a', 'b', 'c']);
  });
});
