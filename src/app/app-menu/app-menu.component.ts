import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
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
} from '@ionic/angular/standalone';

import { Lang, SUPPORTED_LANGS, LANG_NAMES } from '../core/i18n/translations';
import { I18nService } from '../core/i18n/i18n.service';
import { TranslatePipe } from '../core/i18n/translate.pipe';

@Component({
  selector: 'app-menu',
  templateUrl: './app-menu.component.html',
  styleUrl: './app-menu.component.scss',
  imports: [
    FormsModule,
    IonContent,
    IonHeader,
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

  protected readonly langs = SUPPORTED_LANGS;
  protected readonly LANG_NAMES = LANG_NAMES;

  protected get lang(): Lang {
    return this.i18n.lang();
  }

  protected set lang(value: Lang) {
    void this.i18n.setLanguage(value);
    void this.menuCtrl.close();
  }
}
