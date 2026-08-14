import {ComponentFixture, TestBed} from '@angular/core/testing';
import {computed, signal} from '@angular/core';
import {ModalController, provideIonicAngular, ToastController} from '@ionic/angular/standalone';

import {HomePage} from './home.page';
import {I18nService} from '../core/i18n/i18n.service';
import {PantryItem} from '../core/models/pantry-item.model';
import {PantryStore} from '../core/services/pantry-store.service';
import {PhotoService} from '../core/services/photo.service';
import {ProductResolverService} from '../core/services/product-resolver.service';
import {ScannerService} from '../core/services/scanner.service';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let itemsSignal: ReturnType<typeof signal<PantryItem[]>>;
  let store: PantryStore;
  let scanner: ScannerService;
  let scannerAvailable = false;
  let resolver: ProductResolverService;
  let modalCtrl: jasmine.SpyObj<ModalController>;
  let toastCtrl: jasmine.SpyObj<ToastController>;
  let i18n: jasmine.SpyObj<I18nService>;
  let modalResult: { role: string; data?: PantryItem };

  const item = (overrides: Partial<PantryItem> = {}): PantryItem => ({
    id: 'a',
    barcode: '',
    name: 'Milk',
    thumbUrl: '',
    expireDate: new Date(Date.now() + 10 * 86_400_000).toISOString(),
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
    itemsSignal = signal<PantryItem[]>([]);
    store = {
      items: computed(() => itemsSignal()),
      load: jasmine.createSpy('load').and.resolveTo(),
      add: jasmine.createSpy('add').and.resolveTo(),
      update: jasmine.createSpy('update').and.resolveTo(),
      remove: jasmine.createSpy('remove').and.resolveTo(),
      renew: jasmine.createSpy('renew').and.resolveTo(),
    } as unknown as PantryStore;
    scannerAvailable = false;
    scanner = {
      get isAvailable() {
        return scannerAvailable;
      },
      scan: jasmine.createSpy('scan').and.resolveTo(null),
    } as unknown as ScannerService;
    resolver = jasmine.createSpyObj('ProductResolverService', ['resolveBarcode']);
    (resolver.resolveBarcode as jasmine.Spy).and.resolveTo({ name: 'Milk 1L', thumbUrl: '' });
    modalResult = { role: 'confirm', data: item() };
    modalCtrl = jasmine.createSpyObj('ModalController', ['create']);
    modalCtrl.create.and.resolveTo({
      present: jasmine.createSpy('present').and.resolveTo(),
      onDidDismiss: jasmine.createSpy('onDidDismiss').and.callFake(async () => modalResult),
    } as never);
    toastCtrl = jasmine.createSpyObj('ToastController', ['create']);
    toastCtrl.create.and.resolveTo({ present: jasmine.createSpy('present').and.resolveTo() } as never);
    i18n = jasmine.createSpyObj('I18nService', ['lang', 'translate']);
    i18n.lang.and.returnValue('en');
    i18n.translate.and.callFake((key: string, ...args: string[]) =>
      args.length > 0 ? `${key}:${args.join(',')}` : key,
    );

    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideIonicAngular(),
        { provide: PantryStore, useValue: store },
        { provide: ScannerService, useValue: scanner },
        { provide: ProductResolverService, useValue: resolver },
        { provide: ModalController, useValue: modalCtrl },
        { provide: ToastController, useValue: toastCtrl },
        { provide: I18nService, useValue: i18n },
        { provide: PhotoService, useValue: { getDisplayUri: (u: string) => u } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('groups', () => {
    it('groups items by name and sums units', () => {
      itemsSignal.set([
        item({ id: 'a', name: 'Milk', quantity: 2, expireDate: '2026-06-01T00:00:00.000Z' }),
        item({ id: 'b', name: 'Milk', quantity: 1, expireDate: '2026-07-01T00:00:00.000Z' }),
        item({ id: 'c', name: 'Rice', expireDate: '2026-08-01T00:00:00.000Z' }),
      ]);
      fixture.detectChanges();

      const groups = component['groups']();
      expect(groups).toHaveSize(2);
      const milk = groups.find((g) => g.name === 'Milk');
      expect(milk?.units).toBe(3);
      expect(milk?.items.length).toBe(2);
    });

    it('sorts groups by soonest expiry', () => {
      itemsSignal.set([
        item({ id: 'a', name: 'Rice', expireDate: '2026-09-01T00:00:00.000Z' }),
        item({ id: 'b', name: 'Milk', expireDate: '2026-05-01T00:00:00.000Z' }),
      ]);

      expect(component['groups']().map((g) => g.name)).toEqual(['Milk', 'Rice']);
    });
  });

  describe('visibleGroups', () => {
    const milk = item({id: 'a', name: 'Whole Milk', tags: ['dairy', 'fresh'], expireDate: '2026-06-01T00:00:00.000Z'});
    const rice = item({id: 'b', name: 'Rice', tags: ['grains'], expireDate: '2026-09-01T00:00:00.000Z'});
    const setup = () => itemsSignal.set([milk, rice]);

    it('shows all groups with an empty query', () => {
      setup();
      expect(component['visibleGroups']()).toHaveSize(2);
    });

    it('filters by name case-insensitively', () => {
      setup();
      component['query'].set('MILK');
      expect(component['visibleGroups']().map((g) => g.name)).toEqual(['Whole Milk']);
    });

    it('filters by tag', () => {
      setup();
      component['query'].set('grains');
      expect(component['visibleGroups']().map((g) => g.name)).toEqual(['Rice']);
    });

    it('returns an empty list when nothing matches', () => {
      setup();
      component['query'].set('zzz');
      expect(component['visibleGroups']()).toHaveSize(0);
    });

    it('clears the filter again with an empty query', () => {
      setup();
      component['query'].set('milk');
      component['query'].set('');
      expect(component['visibleGroups']()).toHaveSize(2);
    });

    it('updates the query from the search bar', () => {
      component['onSearch']({detail: {value: 'rice'}} as unknown as Event);
      expect(component['query']()).toBe('rice');
    });
  });

  describe('summary', () => {
    it('counts items by expiration status', () => {
      itemsSignal.set([
        item({ id: 'a', expireDate: '2020-01-01T00:00:00.000Z' }),
        item({ id: 'b', expireDate: new Date(Date.now() + 2 * 86_400_000).toISOString() }),
        item({ id: 'c', expireDate: new Date(Date.now() + 30 * 86_400_000).toISOString() }),
      ]);

      expect(component['summary']()).toEqual({ expired: 1, impending: 1, stable: 1 });
    });
  });

  describe('expiryLabel', () => {
    it('labels past dates', () => {
      component['expiryLabel'](item({ expireDate: new Date(Date.now() - 5 * 86_400_000).toISOString() }));
      expect(i18n.translate).toHaveBeenCalledWith('expiry.past.plural', '5');
    });

    it('labels today', () => {
      component['expiryLabel'](item({ expireDate: new Date().toISOString() }));
      expect(i18n.translate).toHaveBeenCalledWith('expiry.today');
    });

    it('labels the future', () => {
      component['expiryLabel'](item({ expireDate: new Date(Date.now() + 3 * 86_400_000).toISOString() }));
      expect(i18n.translate).toHaveBeenCalledWith('expiry.future.plural', '3');
    });

    it('labels one day in the past', () => {
      component['expiryLabel'](item({ expireDate: new Date(Date.now() - 86_400_000).toISOString() }));
      expect(i18n.translate).toHaveBeenCalledWith('expiry.past.singular', '1');
    });

    it('labels one day in the future', () => {
      component['expiryLabel'](item({ expireDate: new Date(Date.now() + 86_400_000).toISOString() }));
      expect(i18n.translate).toHaveBeenCalledWith('expiry.future.singular', '1');
    });
  });

  describe('addManually', () => {
    it('opens the editor and adds on confirm', async () => {
      await component['addManually']();

      expect(modalCtrl.create).toHaveBeenCalled();
      const modalOptions = modalCtrl.create.calls.mostRecent().args[0] as unknown as {
        componentProps: { draft: PantryItem };
      };
      expect(modalOptions.componentProps['draft'].name).toBe('');
      expect(store.add).toHaveBeenCalledWith(modalResult.data as PantryItem);
      expect(toastCtrl.create).toHaveBeenCalled();
    });

    it('does not add when dismissed', async () => {
      modalResult = { role: 'cancel' };
      await component['addManually']();
      expect(store.add).not.toHaveBeenCalled();
    });
  });

  describe('scanAndAdd', () => {
    it('falls back to the manual editor on web', async () => {
      await component['scanAndAdd']();

      expect(scanner.scan).not.toHaveBeenCalled();
      expect(modalCtrl.create).toHaveBeenCalled();
      expect(store.add).toHaveBeenCalled();
    });

    it('scans, resolves and stages the product', async () => {
      scannerAvailable = true;
      (scanner.scan as jasmine.Spy).and.resolveTo('5901234123457');

      await component['scanAndAdd']();

      expect(resolver.resolveBarcode).toHaveBeenCalledWith('5901234123457');
      const modalOptions = modalCtrl.create.calls.mostRecent().args[0] as unknown as {
        componentProps: { draft: PantryItem };
      };
      const data = modalOptions.componentProps['draft'];
      expect(data.barcode).toBe('5901234123457');
      expect(data.name).toBe('Milk 1L');
    });

    it('does nothing when the scan is cancelled', async () => {
      scannerAvailable = true;
      (scanner.scan as jasmine.Spy).and.resolveTo(null);

      await component['scanAndAdd']();

      expect(modalCtrl.create).not.toHaveBeenCalled();
    });
  });

  describe('edit', () => {
    it('updates on confirm', async () => {
      const existing = item({ id: 'a' });
      itemsSignal.set([existing]);
      modalResult = { role: 'confirm', data: { ...existing, name: 'Whole Milk' } };

      await component['edit'](existing);

      expect(store.update).toHaveBeenCalledWith(modalResult.data as PantryItem);
    });
  });

  describe('renew', () => {
    it('renews the item and shows a toast', async () => {
      const existing = item();
      await component['renew'](existing);

      expect(store.renew).toHaveBeenCalledWith(existing);
      expect(i18n.translate).toHaveBeenCalledWith('toast.renewed', 'Milk');
    });
  });

  describe('remove', () => {
    it('removes the item and supports undo', async () => {
      const existing = item();
      await component['remove'](existing);

      expect(store.remove).toHaveBeenCalledWith(existing);
      const toast = toastCtrl.create.calls.mostRecent().args[0] as {
        message: string;
        buttons: { text: string; handler: () => void }[];
      };
      expect(toast.message).toBe('toast.removed:Milk');
      const undo = toast.buttons.find((b) => b.text === 'undo');
      expect(undo).toBeTruthy();
      await undo?.handler();
      expect(store.add).toHaveBeenCalledWith(existing);
    });
  });
});
