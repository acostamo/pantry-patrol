import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';

import { PantryItem } from '../models/pantry-item.model';

/**
 * Schedules kernel-level local notifications so expiration alerts fire even
 * when the app process has been killed by the OS memory manager.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  /** Days before expiry when the OS alert fires (blueprint default). */
  private readonly noticeDaysBuffer = 3;

  async scheduleExpirationAlert(item: PantryItem): Promise<void> {
    // Local notifications and haptics are native-only; silently skip on web.
    if (!Capacitor.isNativePlatform()) return;

    const status = await LocalNotifications.requestPermissions();
    if (status.display !== 'granted') return;

    const alertTime = new Date(item.expireDate);
    alertTime.setDate(alertTime.getDate() - this.noticeDaysBuffer);
    alertTime.setHours(9, 0, 0, 0); // fire at 9:00 local instead of midnight
    if (alertTime.getTime() < Date.now()) {
      alertTime.setTime(Date.now() + 10_000); // past target window: deploy in 10s
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: item.notificationId,
          title: 'Pantry Expiration Warning 🚨',
          body: `Your locked item "${item.name}" is scheduled to expire soon. Plan accordingly!`,
          schedule: { at: alertTime },
          extra: { itemId: item.id },
        },
      ],
    });

    await Haptics.impact({ style: ImpactStyle.Medium });
  }

  async cancelExpirationAlert(notificationId: number): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
  }
}
