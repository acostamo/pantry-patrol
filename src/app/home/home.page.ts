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
  IonMenuButton,
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
import { I18nService } from '../core/i18n/i18n.service';
import { TranslatePipe } from '../core/i18n/translate.pipe';

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
    IonMenuButton,
    IonThumbnail,
    IonTitle,
    IonToolbar,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly store = inject(PantryStore);
  private readonly scanner = inject(ScannerService);
  private readonly resolver = inject(ProductResolverService);
  private readonly modalCtrl = inject(ModalController);
  private readonly toastCtrl = inject(ToastController);
  private readonly i18n = inject(I18nService);

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
    await this.showToast(this.i18n.translate('toast.renewed', item.name));
  }

  protected async remove(item: PantryItem): Promise<void> {
    await this.store.remove(item);
    await this.showToast(this.i18n.translate('toast.removed', item.name));
  }

  protected expiryLabel(item: PantryItem): string {
    const days = daysUntilExpiry(item.expireDate);
    const i = this.i18n;
    if (days < 0) {
      return i.translate(days === -1 ? 'expiry.past.singular' : 'expiry.past.plural', String(-days));
    }
    if (days === 0) return i.translate('expiry.today');
    return i.translate(days === 1 ? 'expiry.future.singular' : 'expiry.future.plural', String(days));
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
      await this.showToast(this.i18n.translate('toast.added', data.name));
    } else {
      await this.store.update(data);
      await this.showToast(this.i18n.translate('toast.updated', data.name));
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
