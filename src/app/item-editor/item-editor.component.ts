import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, Input, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {
  ActionSheetController,
  IonButton,
  IonButtons,
  IonChip,
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
  IonTextarea,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import {addIcons} from 'ionicons';
import {add, barcodeOutline, cameraOutline, close, remove, star, starOutline} from 'ionicons/icons';

import {DEFAULT_QUANTITY, PantryItem} from '../core/models/pantry-item.model';
import {I18nService} from '../core/i18n/i18n.service';
import {PhotoService} from '../core/services/photo.service';
import {TranslatePipe} from '../core/i18n/translate.pipe';

@Component({
  selector: 'app-item-editor',
  templateUrl: './item-editor.component.html',
  styleUrls: ['./item-editor.component.scss'],
  imports: [
    FormsModule,
    IonButton,
    IonButtons,
    IonChip,
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
    IonTextarea,
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
  protected quantity = DEFAULT_QUANTITY;
  protected favorite = false;
  protected notes = '';
  protected price = 0;
  protected tagInput = '';
  protected tags: string[] = [];

  /**
   * Photo state across editing:
   * - `undefined` (initial): no change — use `draft.thumbUrl` as is.
   * - `string`: a freshly captured/picked URI that needs to be persisted on Save.
   * - `null`: the user explicitly chose "Remove photo".
   */
  private tempPhotoUri?: string | null;

  constructor() {
    addIcons({ add, barcodeOutline, cameraOutline, close, remove, star, starOutline });
  }

  ngOnInit(): void {
    this.name = this.draft.name;
    this.expireDate = this.draft.expireDate || new Date(Date.now() + 7 * 86_400_000).toISOString();
    this.quantity = this.draft.quantity || DEFAULT_QUANTITY;
    this.favorite = this.draft.favorite;
    this.notes = this.draft.notes ?? '';
    this.price = this.draft.price || 0;
    this.tags = [...(this.draft.tags ?? [])];
  }

  protected get previewUri(): string {
    if (this.tempPhotoUri) return this.photoService.getDisplayUri(this.tempPhotoUri);
    if (this.tempPhotoUri === null) return '';
    return this.photoService.getDisplayUri(this.draft.thumbUrl);
  }

  protected get canSave(): boolean {
    return this.name.trim().length > 0 && this.expireDate.length > 0;
  }

  /** Total cost hint = price per unit × quantity, shown only when a price is set. */
  protected get totalPrice(): number {
    return this.price * this.quantity;
  }

  /** Localized "added on" caption for existing items. */
  protected get addedDateLabel(): string {
    const d = new Date(this.draft.addedDate);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(this.i18n.lang(), {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  protected decrementQuantity(): void {
    this.quantity = Math.max(1, this.quantity - 1);
  }

  protected incrementQuantity(): void {
    this.quantity = Math.min(99, this.quantity + 1);
  }

  protected toggleFavorite(): void {
    this.favorite = !this.favorite;
  }

  /** Commits the pending tag on Enter or comma, then clears the input. */
  protected addTag(): void {
    let trimmed = this.tagInput.trim();
    while (trimmed.endsWith(',')) {
      trimmed = trimmed.slice(0, -1);
    }
    const tag = trimmed.toLowerCase();
    if (tag && !this.tags.includes(tag)) {
      this.tags = [...this.tags, tag];
    }
    this.tagInput = '';
  }

  protected removeTag(tag: string): void {
    this.tags = this.tags.filter((t) => t !== tag);
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
      quantity: this.quantity,
      favorite: this.favorite,
      notes: this.notes.trim(),
      price: Math.max(0, Number(this.price) || 0),
      tags: this.tags,
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
