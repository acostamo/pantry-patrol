import {TestBed} from '@angular/core/testing';
import {Capacitor} from '@capacitor/core';
import {ImpactStyle} from '@capacitor/haptics';
import {HapticsWeb} from '@capacitor/haptics/dist/esm/web';
import {LocalNotificationsWeb} from '@capacitor/local-notifications/dist/esm/web';

import {I18nService} from '../i18n/i18n.service';
import {PantryItem} from '../models/pantry-item.model';
import {NotificationService} from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let i18n: jasmine.SpyObj<I18nService>;
  let scheduleSpy: jasmine.Spy;
  let cancelSpy: jasmine.Spy;
  let requestPermissionsSpy: jasmine.Spy;
  let hapticsSpy: jasmine.Spy;

  const expireDate = new Date(Date.now() + 30 * 86_400_000).toISOString();
  const item: PantryItem = {
    id: 'a',
    barcode: '',
    name: 'Milk',
    thumbUrl: '',
    expireDate,
    notificationId: 42,
    quantity: 1,
    addedDate: '2026-01-01T00:00:00.000Z',
    favorite: false,
    notes: '',
    tags: [],
    price: 0,
  };

  beforeEach(() => {
    requestPermissionsSpy = spyOn(LocalNotificationsWeb.prototype, 'requestPermissions').and.resolveTo({
      display: 'granted',
    });
    scheduleSpy = spyOn(LocalNotificationsWeb.prototype, 'schedule').and.resolveTo();
    cancelSpy = spyOn(LocalNotificationsWeb.prototype, 'cancel').and.resolveTo();
    hapticsSpy = spyOn(HapticsWeb.prototype, 'impact').and.resolveTo();
    i18n = jasmine.createSpyObj('I18nService', ['translate']);
    i18n.translate.and.returnValue('msg');
    TestBed.configureTestingModule({
      providers: [{ provide: I18nService, useValue: i18n }],
    });
    service = TestBed.inject(NotificationService);
  });

  it('skips scheduling on web', async () => {
    spyOn(Capacitor, 'isNativePlatform').and.returnValue(false);

    await service.scheduleExpirationAlert(item);

    expect(scheduleSpy).not.toHaveBeenCalled();
  });

  it('skips scheduling when permission is denied', async () => {
    spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
    requestPermissionsSpy.and.resolveTo({ display: 'denied' });

    await service.scheduleExpirationAlert(item);

    expect(scheduleSpy).not.toHaveBeenCalled();
  });

  it('schedules an alert 3 days before expiry at 9:00 and haptics', async () => {
    spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);

    await service.scheduleExpirationAlert(item);

    const expectedTime = new Date(item.expireDate);
    expectedTime.setDate(expectedTime.getDate() - 3);
    expectedTime.setHours(9, 0, 0, 0);
    expect(scheduleSpy).toHaveBeenCalledWith({
      notifications: [
        {
          id: 42,
          title: 'msg',
          body: 'msg',
          schedule: { at: expectedTime },
          extra: { itemId: 'a' },
        },
      ],
    });
    expect(hapticsSpy).toHaveBeenCalledWith({ style: ImpactStyle.Medium });
  });

  it('deploys in 10s when the target time is already in the past', async () => {
    spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
    const pastItem = { ...item, expireDate: new Date(Date.now() - 86_400_000).toISOString() };

    await service.scheduleExpirationAlert(pastItem);

    const options = scheduleSpy.calls.argsFor(0)[0] as {
      notifications: Array<{ schedule: { at?: Date } }>;
    };
    const scheduleAt = options.notifications[0]?.schedule.at as Date;
    expect(scheduleAt.getTime()).toBeGreaterThanOrEqual(Date.now() + 9_000);
    expect(scheduleAt.getTime()).toBeLessThanOrEqual(Date.now() + 60_000);
  });

  it('cancels an alert on native', async () => {
    spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);

    await service.cancelExpirationAlert(42);

    expect(cancelSpy).toHaveBeenCalledWith({ notifications: [{ id: 42 }] });
  });

  it('skips cancelling on web', async () => {
    spyOn(Capacitor, 'isNativePlatform').and.returnValue(false);

    await service.cancelExpirationAlert(42);

    expect(cancelSpy).not.toHaveBeenCalled();
  });
});
