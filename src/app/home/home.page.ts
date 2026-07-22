import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  IonBadge,
  IonContent,
  IonFab,
  IonFabButton,
  IonFabList,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonThumbnail,
  IonTitle,
  IonToolbar,
  ModalController,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  add,
  barcodeOutline,
  basketOutline,
  createOutline,
  refreshOutline,
  trashOutline,
} from 'ionicons/icons';

import {
  daysUntilExpiry,
  ExpirationStatus,
  expirationStatus,
  PantryItem,
} from '../core/models/pantry-item.model';
import { PantryStore } from '../core/services/pantry-store.service';
import { ProductResolverService } from '../core/services/product-resolver.service';
import { ScannerService } from '../core/services/scanner.service';
import { ItemEditorComponent } from '../item-editor/item-editor.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    IonBadge,
    IonContent,
    IonFab,
    IonFabButton,
    IonFabList,
    IonHeader,
    IonIcon,
    IonItem,
    IonItemOption,
    IonItemOptions,
    IonItemSliding,
    IonLabel,
    IonList,
    IonThumbnail,
    IonTitle,
    IonToolbar,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly store = inject(PantryStore);
  private readonly scanner = inject(ScannerService);
  private readonly resolver = inject(ProductResolverService);
  private readonly modalCtrl = inject(ModalController);
  private readonly toastCtrl = inject(ToastController);

  protected readonly items = this.store.items;
  protected readonly daysUntilExpiry = daysUntilExpiry;
  protected readonly expirationStatus = expirationStatus;
  protected readonly statusColors: Record<ExpirationStatus, string> = {
    EXPIRED: 'danger',
    IMPENDING: 'warning',
    STABLE: 'success',
  };

  constructor() {
    addIcons({ add, barcodeOutline, basketOutline, createOutline, refreshOutline, trashOutline });
  }

  /** Capture + resolution phases: scan a barcode, resolve its metadata, stage it. */
  protected async scanAndAdd(): Promise<void> {
    if (!this.scanner.isAvailable) {
      // Web/dev builds have no camera scanner: go straight to manual staging.
      await this.openEditor(this.createDraft());
      return;
    }

    const barcode = await this.scanner.scan();
    if (!barcode) return; // user cancelled or denied the camera permission

    const resolved = await this.resolver.resolveBarcode(barcode);
    await this.openEditor(
      this.createDraft({ barcode, name: resolved.name, thumbUrl: resolved.thumbUrl }),
    );
  }

  protected async addManually(): Promise<void> {
    await this.openEditor(this.createDraft());
  }

  protected async edit(item: PantryItem): Promise<void> {
    await this.openEditor(item, false);
  }

  protected async renew(item: PantryItem): Promise<void> {
    await this.store.renew(item);
    await this.showToast(`"${item.name}" renewed for 7 more days`);
  }

  protected async remove(item: PantryItem): Promise<void> {
    await this.store.remove(item);
    await this.showToast(`"${item.name}" removed`);
  }

  protected expiryLabel(item: PantryItem): string {
    const days = daysUntilExpiry(item.expireDate);
    if (days < 0) return `Expired ${-days} day${days === -1 ? '' : 's'} ago`;
    if (days === 0) return 'Expires today';
    return `Expires in ${days} day${days === 1 ? '' : 's'}`;
  }

  private async openEditor(draft: PantryItem, isNew = true): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: ItemEditorComponent,
      componentProps: { draft, isNew },
    });
    await modal.present();

    const { data, role } = await modal.onDidDismiss<PantryItem>();
    if (role !== 'confirm' || !data) return;

    if (isNew) {
      await this.store.add(data);
      await this.showToast(`"${data.name}" added to your pantry`);
    } else {
      await this.store.update(data);
      await this.showToast(`"${data.name}" updated`);
    }
  }

  private createDraft(prefill: Partial<PantryItem> = {}): PantryItem {
    return {
      id: crypto.randomUUID(),
      barcode: '',
      name: '',
      thumbUrl: '',
      expireDate: '',
      notificationId: Math.floor(Math.random() * 1_000_000_000),
      ...prefill,
    };
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({ message, duration: 2000, position: 'bottom' });
    await toast.present();
  }
}
