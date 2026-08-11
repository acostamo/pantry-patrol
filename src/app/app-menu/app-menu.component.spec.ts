import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MenuController, provideIonicAngular} from '@ionic/angular/standalone';

import {I18nService} from '../core/i18n/i18n.service';
import {AppMenuComponent} from './app-menu.component';

describe('AppMenuComponent', () => {
  let component: AppMenuComponent;
  let fixture: ComponentFixture<AppMenuComponent>;
  let i18n: jasmine.SpyObj<I18nService>;
  let menuCtrl: jasmine.SpyObj<MenuController>;

  beforeEach(async () => {
    i18n = jasmine.createSpyObj('I18nService', ['lang', 'setLanguage', 'translate']);
    i18n.lang.and.returnValue('en');
    i18n.setLanguage.and.resolveTo();
    i18n.translate.and.returnValue('x');
    menuCtrl = jasmine.createSpyObj('MenuController', ['close']);
    menuCtrl.close.and.resolveTo();

    await TestBed.configureTestingModule({
      imports: [AppMenuComponent],
      providers: [
        provideIonicAngular(),
        { provide: I18nService, useValue: i18n },
        { provide: MenuController, useValue: menuCtrl },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exposes the supported languages', () => {
    expect(component['langs']).toEqual(['en', 'es', 'pl']);
  });

  it('reads the current language from the i18n service', () => {
    expect(component['lang']).toBe('en');
    expect(i18n.lang).toHaveBeenCalled();
  });

  it('persists the chosen language and closes the menu', () => {
    component['lang'] = 'es';

    expect(i18n.setLanguage).toHaveBeenCalledWith('es');
    expect(menuCtrl.close).toHaveBeenCalled();
  });
});
