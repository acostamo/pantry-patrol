import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ActionSheetController,
  IonButton,
  IonButtons,
  IonContent,
  IonDatetime,
  IonDatetimeButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { barcodeOutline, cameraOutline } from 'ionicons/icons';

import { PantryItem } from '../core/models/pantry-item.model';
import { I18nService } from '../core/i18n/i18n.service';
import { PhotoService } from '../core/services/photo.service';
import { TranslatePipe } from '../core/i18n/translate.pipe';

@Component({
  selector: 'app-item-editor',
  templateUrl: './item-editor.component.html',
  styleUrls: ['./item-editor.component.scss'],
  imports: [
    FormsModule,
    IonButton,
    IonButtons,
    IonContent,
    IonDatetime,
    IonDatetimeButton,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonModal,
    IonTitle,
    IonToolbar,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemEditorComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);
  private readonly actionSheetCtrl = inject(ActionSheetController);
  private readonly i18n = inject(I18nService);
  private readonly photoService = inject(PhotoService);
  private readonly cdr = inject(ChangeDetectorRef);

  /** Item being edited, or a pre-filled draft when creating. */
  @Input({ required: true }) draft!: PantryItem;
  /** Controls the header title and the action button label. */
  @Input() isNew = true;

  protected name = '';
  protected expireDate = '';
  protected readonly minDate = new Date().toISOString();

  /**
   * Photo state across editing:
   * - `undefined` (initial): no change — use `draft.thumbUrl` as is.
   * - `string`: a freshly captured/picked URI that needs to be persisted on Save.
   * - `null`: the user explicitly chose "Remove photo".
   */
  private tempPhotoUri?: string | null;

  constructor() {
    addIcons({ barcodeOutline, cameraOutline });
  }

  ngOnInit(): void {
    this.name = this.draft.name;
    this.expireDate = this.draft.expireDate || new Date(Date.now() + 7 * 86_400_000).toISOString();
  }

  protected get previewUri(): string {
    if (this.tempPhotoUri) return this.photoService.getDisplayUri(this.tempPhotoUri);
    if (this.tempPhotoUri === null) return '';
    return this.photoService.getDisplayUri(this.draft.thumbUrl);
  }

  protected get canSave(): boolean {
    return this.name.trim().length > 0 && this.expireDate.length > 0;
  }

  protected cancel(): void {
    void this.modalCtrl.dismiss(undefined, 'cancel');
  }

  protected async save(): Promise<void> {
    if (!this.canSave) return;

    let thumbUrl = this.draft.thumbUrl;

    if (this.tempPhotoUri) {
      // New photo captured — persist it and clean up the old one.
      if (this.draft.thumbUrl) void this.photoService.deleteIfLocal(this.draft.thumbUrl);
      try {
        thumbUrl = await this.photoService.savePermanent(this.tempPhotoUri, this.draft.id);
      } catch {
        // Filesystem write may fail with content:// URIs on some Android versions.
        // Fall back to the temp URI — it'll break after cache clear, but avoids data loss.
        thumbUrl = this.tempPhotoUri;
      }
    } else if (this.tempPhotoUri === null) {
      // User chose "Remove photo" — delete the old one.
      if (this.draft.thumbUrl) void this.photoService.deleteIfLocal(this.draft.thumbUrl);
      thumbUrl = '';
    }

    const item: PantryItem = {
      ...this.draft,
      name: this.name.trim(),
      expireDate: new Date(this.expireDate).toISOString(),
      thumbUrl,
    };
    void this.modalCtrl.dismiss(item, 'confirm');
  }

  protected async pickPhoto(): Promise<void> {
    const hasPhoto = !!(this.tempPhotoUri || this.draft.thumbUrl);
    const buttons: { text: string; role?: string; handler: () => boolean }[] = [
      {
        text: this.i18n.translate('photo.camera'),
        handler: () => { void this.capturePhoto(); return true; },
      },
      {
        text: this.i18n.translate('photo.gallery'),
        handler: () => { void this.pickFromGallery(); return true; },
      },
    ];
    if (hasPhoto || this.tempPhotoUri === null) {
      buttons.push({
        text: this.i18n.translate('photo.remove'),
        role: 'destructive',
        handler: () => { this.removePhoto(); return true; },
      });
    }
    buttons.push({
      text: this.i18n.translate('editor.cancel'),
      role: 'cancel',
      handler: () => true,
    });

    const sheet = await this.actionSheetCtrl.create({
      header: this.i18n.translate('photo.title'),
      buttons,
    });
    await sheet.present();
  }

  private async capturePhoto(): Promise<void> {
    const uri = await this.photoService.capturePhoto();
    if (uri) {
      this.tempPhotoUri = uri;
      this.cdr.markForCheck();
    }
  }

  private async pickFromGallery(): Promise<void> {
    const uri = await this.photoService.pickFromGallery();
    if (uri) {
      this.tempPhotoUri = uri;
      this.cdr.markForCheck();
    }
  }

  private removePhoto(): void {
    this.tempPhotoUri = null;
    this.cdr.markForCheck();
  }
}
