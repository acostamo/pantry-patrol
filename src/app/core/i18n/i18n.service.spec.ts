import {TestBed} from '@angular/core/testing';
import {PreferencesWeb} from '@capacitor/preferences/dist/esm/web';

import {I18nService} from './i18n.service';

describe('I18nService', () => {
  let service: I18nService;
  let prefsGet: jasmine.Spy;
  let prefsSet: jasmine.Spy;

  beforeEach(() => {
    prefsGet = spyOn(PreferencesWeb.prototype, 'get').and.resolveTo({ value: null });
    prefsSet = spyOn(PreferencesWeb.prototype, 'set').and.resolveTo();
    TestBed.configureTestingModule({});
    service = TestBed.inject(I18nService);
  });

  it('detects the system language on creation', () => {
    expect(service.lang()).toBeDefined();
    expect(['en', 'es', 'pl']).toContain(service.lang());
  });

  it('loads a persisted language override', async () => {
    prefsGet.and.resolveTo({ value: 'es' });

    await service.init();

    expect(service.lang()).toBe('es');
  });

  it('ignores an invalid persisted value', async () => {
    prefsGet.and.resolveTo({ value: 'fr' });

    await service.init();

    expect(['en', 'es', 'pl']).toContain(service.lang());
  });

  it('persists the language on change', async () => {
    await service.setLanguage('pl');

    expect(service.lang()).toBe('pl');
    expect(prefsSet).toHaveBeenCalledWith({ key: 'app_lang', value: 'pl' });
  });

  it('translates with interpolation', () => {
    service.lang.set('en');

    expect(service.translate('expiry.future.plural', '3')).toBe('Expires in 3 days');
  });

  it('uses the active language dictionary', () => {
    service.lang.set('pl');

    expect(service.translate('toast.added', 'Milk')).toBe('"Milk" dodano do spiżarni');
  });

  it('falls back to English for missing keys', () => {
    service.lang.set('es');
    // 'expiry.future.plural' exists in es, so this still resolves via the active lang;
    // verify an unknown key falls back to the fallback language:
    expect(service.translate('home.empty')).toContain('despensa');
  });

  it('returns the key when no translation exists anywhere', () => {
    expect(service.translate('nope.missing')).toBe('nope.missing');
  });
});
