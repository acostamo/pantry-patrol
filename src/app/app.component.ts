import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

import { PantryStore } from './core/services/pantry-store.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  private readonly store = inject(PantryStore);

  constructor() {
    // Hydrate the pantry inventory from on-device storage once at startup.
    void this.store.load();
  }
}
