import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ActionSheetController, ModalController, provideIonicAngular} from '@ionic/angular/standalone';

import {I18nService} from '../core/i18n/i18n.service';
import {PantryItem} from '../core/models/pantry-item.model';
import {PhotoService} from '../core/services/photo.service';
import {ItemEditorComponent} from './item-editor.component';

describe('ItemEditorComponent', () => {
  let component: ItemEditorComponent;
  let fixture: ComponentFixture<ItemEditorComponent>;
  let modalCtrl: jasmine.SpyObj<ModalController>;
  let actionSheetCtrl: jasmine.SpyObj<ActionSheetController>;
  let i18n: jasmine.SpyObj<I18nService>;
  let photos: jasmine.SpyObj<PhotoService>;

  const draft = (overrides: Partial<PantryItem> = {}): PantryItem => ({
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
    modalCtrl = jasmine.createSpyObj('ModalController', ['dismiss']);
    modalCtrl.dismiss.and.resolveTo();
    actionSheetCtrl = jasmine.createSpyObj('ActionSheetController', ['create']);
    actionSheetCtrl.create.and.resolveTo({ present: jasmine.createSpy('present').and.resolveTo() } as never);
    i18n = jasmine.createSpyObj('I18nService', ['lang', 'translate']);
    i18n.lang.and.returnValue('en');
    i18n.translate.and.callFake((key: string) => key);
    photos = jasmine.createSpyObj('PhotoService', [
      'getDisplayUri',
      'savePermanent',
      'deleteIfLocal',
      'capturePhoto',
      'pickFromGallery',
    ]);
    photos.getDisplayUri.and.callFake((uri: string) => uri);
    photos.savePermanent.and.resolveTo('file:///new.jpg');
    photos.deleteIfLocal.and.resolveTo();

    await TestBed.configureTestingModule({
      imports: [ItemEditorComponent],
      providers: [
        provideIonicAngular(),
        { provide: ModalController, useValue: modalCtrl },
        { provide: ActionSheetController, useValue: actionSheetCtrl },
        { provide: I18nService, useValue: i18n },
        { provide: PhotoService, useValue: photos },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ItemEditorComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    component.draft = draft();
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('prefills fields from the draft', () => {
      component.draft = draft({ name: 'Rice', quantity: 3, favorite: true, notes: 'basmati', price: 2.5, tags: ['grains'] });
      fixture.detectChanges();

      expect(component['name']).toBe('Rice');
      expect(component['quantity']).toBe(3);
      expect(component['favorite']).toBe(true);
      expect(component['notes']).toBe('basmati');
      expect(component['price']).toBe(2.5);
      expect(component['tags']).toEqual(['grains']);
    });

    it('defaults the expiry date to a week out when missing', () => {
      component.draft = draft({ expireDate: '' });
      fixture.detectChanges();

      const expected = new Date(Date.now() + 7 * 86_400_000);
      const actual = new Date(component['expireDate']);
      expect(Math.abs(actual.getTime() - expected.getTime())).toBeLessThan(60_000);
    });
  });

  describe('validation', () => {
    it('disallows saving without a name or date', () => {
      component.draft = draft({ name: '', expireDate: '' });
      fixture.detectChanges();
      expect(component['canSave']).toBe(false);
    });

    it('allows saving with a name and date', () => {
      component.draft = draft();
      fixture.detectChanges();
      expect(component['canSave']).toBe(true);
    });
  });

  describe('save', () => {
    it('dismisses with the merged item on confirm', async () => {
      component.draft = draft();
      fixture.detectChanges();
      component['name'] = ' Whole Milk ';

      await component['save']();

      expect(modalCtrl.dismiss).toHaveBeenCalledWith(
        jasmine.objectContaining({ name: 'Whole Milk', quantity: 1, favorite: false, notes: '', price: 0, tags: [] }),
        'confirm',
      );
    });

    it('does nothing when invalid', async () => {
      component.draft = draft({ name: '' });
      fixture.detectChanges();
      component['name'] = '';

      await component['save']();

      expect(modalCtrl.dismiss).not.toHaveBeenCalled();
    });

    it('persists a new photo and cleans up the old one', async () => {
      component.draft = draft({ thumbUrl: 'file:///old.jpg' });
      fixture.detectChanges();
      component['tempPhotoUri'] = 'file:///tmp.jpg';

      await component['save']();

      expect(photos.deleteIfLocal).toHaveBeenCalledWith('file:///old.jpg');
      expect(photos.savePermanent).toHaveBeenCalledWith('file:///tmp.jpg', 'a');
      expect(modalCtrl.dismiss.calls.mostRecent().args[0].thumbUrl).toBe('file:///new.jpg');
    });

    it('removes the photo when the user chose to', async () => {
      component.draft = draft({ thumbUrl: 'file:///old.jpg' });
      fixture.detectChanges();
      component['tempPhotoUri'] = null;

      await component['save']();

      expect(photos.deleteIfLocal).toHaveBeenCalledWith('file:///old.jpg');
      expect(modalCtrl.dismiss.calls.mostRecent().args[0].thumbUrl).toBe('');
    });
  });

  describe('cancel', () => {
    it('dismisses without data', async () => {
      component.draft = draft();
      fixture.detectChanges();

      await component['cancel']();

      expect(modalCtrl.dismiss).toHaveBeenCalledWith(undefined, 'cancel');
    });
  });

  describe('quantity stepper', () => {
    beforeEach(() => {
      component.draft = draft();
      fixture.detectChanges();
    });

    it('increments the quantity', () => {
      component['incrementQuantity']();
      expect(component['quantity']).toBe(2);
    });

    it('clamps at 99', () => {
      component['quantity'] = 99;
      component['incrementQuantity']();
      expect(component['quantity']).toBe(99);
    });

    it('decrements the quantity', () => {
      component['quantity'] = 3;
      component['decrementQuantity']();
      expect(component['quantity']).toBe(2);
    });

    it('clamps at 1', () => {
      component['quantity'] = 1;
      component['decrementQuantity']();
      expect(component['quantity']).toBe(1);
    });
  });

  describe('tags', () => {
    beforeEach(() => {
      component.draft = draft();
      fixture.detectChanges();
    });

    it('adds a trimmed lowercase tag', () => {
      component['tagInput'] = '  DAIRY, ';
      component['addTag']();
      expect(component['tags']).toEqual(['dairy']);
      expect(component['tagInput']).toBe('');
    });

    it('does not duplicate tags', () => {
      component['tagInput'] = 'dairy';
      component['addTag']();
      component['tagInput'] = 'dairy';
      component['addTag']();
      expect(component['tags']).toEqual(['dairy']);
    });

    it('removes a tag', () => {
      component['tags'] = ['dairy', 'fresh'];
      component['removeTag']('dairy');
      expect(component['tags']).toEqual(['fresh']);
    });
  });

  it('toggles the favorite flag', () => {
    component.draft = draft();
    fixture.detectChanges();
    component['toggleFavorite']();
    expect(component['favorite']).toBe(true);
    component['toggleFavorite']();
    expect(component['favorite']).toBe(false);
  });

  it('computes the total price', () => {
    component.draft = draft();
    fixture.detectChanges();
    component['price'] = 2.5;
    component['quantity'] = 4;
    expect(component['totalPrice']).toBe(10);
  });

  it('formats the added-date caption', () => {
    component.draft = draft();
    fixture.detectChanges();
    const label = component['addedDateLabel'];
    expect(label).toContain('2026');
  });

  it('returns an empty caption for an invalid date', () => {
    component.draft = draft({ addedDate: 'garbage' });
    fixture.detectChanges();
    expect(component['addedDateLabel']).toBe('');
  });

  it('opens the photo action sheet', async () => {
    component.draft = draft();
    fixture.detectChanges();

    await component['pickPhoto']();

    expect(actionSheetCtrl.create).toHaveBeenCalled();
    const options = actionSheetCtrl.create.calls.mostRecent().args[0] as { buttons: { text: string }[] };
    expect(options.buttons.map((b) => b.text)).toContain('photo.camera');
  });
});
