import {ChangeDetectionStrategy, Component, ElementRef, inject, ViewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {
  AlertController,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonMenu,
  IonRadio,
  IonRadioGroup,
  IonTitle,
  IonToolbar,
  MenuController,
  ToastController,
} from '@ionic/angular/standalone';
import {addIcons} from 'ionicons';
import {cloudUploadOutline, downloadOutline} from 'ionicons/icons';

import {Lang, LANG_NAMES, SUPPORTED_LANGS} from '../core/i18n/translations';
import {I18nService} from '../core/i18n/i18n.service';
import {TranslatePipe} from '../core/i18n/translate.pipe';
import {PantryItem} from '../core/models/pantry-item.model';
import {BackupService} from '../core/services/backup.service';
import {PantryStore} from '../core/services/pantry-store.service';
import {ThemePreference, ThemeService} from '../core/services/theme.service';

@Component({
  selector: 'app-menu',
  templateUrl: './app-menu.component.html',
  imports: [
    FormsModule,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    IonMenu,
    IonRadio,
    IonRadioGroup,
    IonTitle,
    IonToolbar,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppMenuComponent {
  private readonly i18n = inject(I18nService);
  private readonly menuCtrl = inject(MenuController);
  private readonly themeService = inject(ThemeService);
  private readonly backup = inject(BackupService);
  private readonly store = inject(PantryStore);
  private readonly alertCtrl = inject(AlertController);
  private readonly toastCtrl = inject(ToastController);

  @ViewChild('importInput') private readonly importInput?: ElementRef<HTMLInputElement>;

  protected readonly langs = SUPPORTED_LANGS;
  protected readonly LANG_NAMES = LANG_NAMES;
  protected readonly themes: ThemePreference[] = ['light', 'dark', 'system'];

  constructor() {
    addIcons({cloudUploadOutline, downloadOutline});
  }

  protected get lang(): Lang {
    return this.i18n.lang();
  }

  protected set lang(value: Lang) {
    void this.i18n.setLanguage(value);
    void this.menuCtrl.close();
  }

  protected get theme(): ThemePreference {
    return this.themeService.theme();
  }

  protected set theme(value: ThemePreference) {
    void this.themeService.setTheme(value);
    void this.menuCtrl.close();
  }

  protected async exportJson(): Promise<void> {
    await this.backup.share('json', this.store.items());
    await this.menuCtrl.close();
    await this.showToast(this.i18n.translate('toast.exported'));
  }

  protected async exportCsv(): Promise<void> {
    await this.backup.share('csv', this.store.items());
    await this.menuCtrl.close();
    await this.showToast(this.i18n.translate('toast.exported'));
  }

  protected async importBackup(): Promise<void> {
    await this.menuCtrl.close();
    if (this.backup.isNative) {
      const text = await this.backup.pickNativeFile();
      await this.importFromText(text);
    } else {
      this.importInput?.nativeElement.click();
    }
  }

  protected async onFileChosen(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) {
      await this.importFromText(await file.text());
    }
  }

  private async importFromText(text: string): Promise<void> {
    if (!text) return;
    let items: PantryItem[];
    try {
      items = this.backup.parseJson(text);
    } catch {
      await this.showToast(this.i18n.translate('toast.import.invalid'));
      return;
    }
    const alert = await this.alertCtrl.create({
      header: this.i18n.translate('import.confirm.title'),
      message: this.i18n.translate('import.confirm.message', String(items.length)),
      buttons: [
        {text: this.i18n.translate('import.confirm.cancel'), role: 'cancel'},
        {
          text: this.i18n.translate('import.confirm.ok'),
          handler: () => {
            void this.applyImport(items);
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  private async applyImport(items: PantryItem[]): Promise<void> {
    await this.store.replaceAll(items);
    await this.showToast(this.i18n.translate('toast.imported'));
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({message, duration: 2000, position: 'bottom'});
    await toast.present();
  }
}
