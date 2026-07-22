import { ChangeDetectionStrategy, Component, inject, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
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
import { barcodeOutline } from 'ionicons/icons';

import { PantryItem } from '../core/models/pantry-item.model';

/**
 * Staging phase of the blueprint lifecycle: captures the item name and the
 * expiration threshold before the record is committed to storage.
 *
 * Receives a `draft` (a fresh pre-filled item when creating, or the existing
 * item when editing) and dismisses with the updated item on save.
 */
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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemEditorComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);

  /** Item being edited, or a pre-filled draft when creating. */
  @Input({ required: true }) draft!: PantryItem;
  /** Controls the header title and the action button label. */
  @Input() isNew = true;

  protected name = '';
  protected expireDate = '';
  protected readonly minDate = new Date().toISOString();

  constructor() {
    addIcons({ barcodeOutline });
  }

  ngOnInit(): void {
    this.name = this.draft.name;
    // Default new items to one week from today.
    this.expireDate = this.draft.expireDate || new Date(Date.now() + 7 * 86_400_000).toISOString();
  }

  protected get canSave(): boolean {
    return this.name.trim().length > 0 && this.expireDate.length > 0;
  }

  protected cancel(): void {
    void this.modalCtrl.dismiss(undefined, 'cancel');
  }

  protected save(): void {
    if (!this.canSave) return;
    const item: PantryItem = {
      ...this.draft,
      name: this.name.trim(),
      expireDate: new Date(this.expireDate).toISOString(),
    };
    void this.modalCtrl.dismiss(item, 'confirm');
  }
}
