import {Component, inject, OnInit} from '@angular/core';
import {IonApp, IonRouterOutlet} from '@ionic/angular/standalone';

import {I18nService} from './core/i18n/i18n.service';
import {PantryStore} from './core/services/pantry-store.service';
import {ThemeService} from './core/services/theme.service';
import {AppMenuComponent} from './app-menu/app-menu.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [AppMenuComponent, IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private readonly store = inject(PantryStore);
  private readonly i18n = inject(I18nService);
  private readonly theme = inject(ThemeService);

  ngOnInit(): void {
    void this.store.load();
    void this.i18n.init();
    void this.theme.init();
  }
}
