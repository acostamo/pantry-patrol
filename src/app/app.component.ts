import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

import { I18nService } from './core/i18n/i18n.service';
import { PantryStore } from './core/services/pantry-store.service';
import { AppMenuComponent } from './app-menu/app-menu.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [AppMenuComponent, IonApp, IonRouterOutlet],
})
export class AppComponent {
  private readonly store = inject(PantryStore);
  private readonly i18n = inject(I18nService);

  constructor() {
    void this.store.load();
    void this.i18n.init();
  }
}
