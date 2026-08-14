import {ComponentFixture, TestBed} from '@angular/core/testing';
import {computed} from '@angular/core';
import {AlertController, MenuController, provideIonicAngular, ToastController} from '@ionic/angular/standalone';

import {AppMenuComponent} from './app-menu.component';
import {I18nService} from '../core/i18n/i18n.service';
import {PantryItem} from '../core/models/pantry-item.model';
import {BackupService} from '../core/services/backup.service';
import {PantryStore} from '../core/services/pantry-store.service';
import {ThemeService} from '../core/services/theme.service';

describe('AppMenuComponent', () => {
  let component: AppMenuComponent;
  let fixture: ComponentFixture<AppMenuComponent>;
  let i18n: jasmine.SpyObj<I18nService>;
  let menuCtrl: jasmine.SpyObj<MenuController>;
  let themeService: jasmine.SpyObj<ThemeService>;
  let backup: jasmine.SpyObj<BackupService>;
  let store: jasmine.SpyObj<PantryStore>;
  let alertCtrl: jasmine.SpyObj<AlertController>;
  let toastCtrl: jasmine.SpyObj<ToastController>;

  const item = (overrides: Partial<PantryItem> = {}): PantryItem => ({
    id: 'a',
    barcode: '',
    name: 'Milk',
    thumbUrl: '',
    expireDate: '2026-12-01T00:00:00.000Z',
    notificationId: 1,
    quantity: 1,
    addedDate: '2026-01-01T00:00:00.000Z',
    favorite: false,
    notes: '',
    tags: [],
    price: 0,
    ...overrides,
  });

  beforeEach(async () => {
    i18n = jasmine.createSpyObj('I18nService', ['lang', 'setLanguage', 'translate']);
    i18n.lang.and.returnValue('en');
    i18n.setLanguage.and.resolveTo();
    i18n.translate.and.callFake((key: string, ...args: string[]) =>
      args.length > 0 ? `${key}:${args.join(',')}` : key,
    );
    menuCtrl = jasmine.createSpyObj('MenuController', ['close']);
    menuCtrl.close.and.resolveTo();
    themeService = jasmine.createSpyObj('ThemeService', ['theme', 'setTheme']);
    themeService.theme.and.returnValue('system');
    themeService.setTheme.and.resolveTo();
    backup = jasmine.createSpyObj('BackupService', ['share', 'pickNativeFile', 'parseJson']);
    (backup as unknown as {isNative: boolean}).isNative = false;
    backup.share.and.resolveTo();
    backup.pickNativeFile.and.resolveTo('');
    backup.parseJson.and.callFake(() => [item()]);
    store = jasmine.createSpyObj('PantryStore', ['replaceAll']);
    (store as unknown as {items: unknown}).items = computed(() => [item()]);
    store.replaceAll.and.resolveTo();
    alertCtrl = jasmine.createSpyObj('AlertController', ['create']);
    alertCtrl.create.and.resolveTo({present: jasmine.createSpy('present').and.resolveTo()} as never);
    toastCtrl = jasmine.createSpyObj('ToastController', ['create']);
    toastCtrl.create.and.resolveTo({present: jasmine.createSpy('present').and.resolveTo()} as never);

    await TestBed.configureTestingModule({
      imports: [AppMenuComponent],
      providers: [
        provideIonicAngular(),
        {provide: I18nService, useValue: i18n},
        {provide: MenuController, useValue: menuCtrl},
        {provide: ThemeService, useValue: themeService},
        {provide: BackupService, useValue: backup},
        {provide: PantryStore, useValue: store},
        {provide: AlertController, useValue: alertCtrl},
        {provide: ToastController, useValue: toastCtrl},
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exposes the supported languages and themes', () => {
    expect(component['langs']).toEqual(['en', 'es', 'pl']);
    expect(component['themes']).toEqual(['light', 'dark', 'system']);
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

  it('reads the current theme and persists a new one', () => {
    expect(component['theme']).toBe('system');
    component['theme'] = 'dark';

    expect(themeService.setTheme).toHaveBeenCalledWith('dark');
    expect(menuCtrl.close).toHaveBeenCalled();
  });

  it('exports JSON with the inventory', async () => {
    await component['exportJson']();

    expect(backup.share).toHaveBeenCalledWith('json', store.items());
    expect(toastCtrl.create).toHaveBeenCalled();
  });

  it('exports CSV with the inventory', async () => {
    await component['exportCsv']();

    expect(backup.share).toHaveBeenCalledWith('csv', store.items());
  });

  it('prompts before importing a parsed backup', async () => {
    const parsed = [item({id: 'b', name: 'Rice'})];
    backup.parseJson.and.returnValue(parsed);

    await component['importFromText']('{}');

    expect(alertCtrl.create).toHaveBeenCalled();
    const alertOptions = alertCtrl.create.calls.mostRecent().args[0] as {
      buttons: {text: string; handler: () => boolean}[];
    };
    const ok = alertOptions.buttons.find((b) => b.text === 'import.confirm.ok');
    ok?.handler();
    expect(store.replaceAll).toHaveBeenCalledWith(parsed);
  });

  it('shows an error toast for an invalid backup', async () => {
    backup.parseJson.and.throwError(new Error('bad'));

    await component['importFromText']('garbage');

    expect(toastCtrl.create).toHaveBeenCalledWith(
      jasmine.objectContaining({message: 'toast.import.invalid'}),
    );
    expect(store.replaceAll).not.toHaveBeenCalled();
  });
});
