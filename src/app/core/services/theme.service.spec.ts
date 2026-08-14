import {TestBed} from '@angular/core/testing';
import {PreferencesWeb} from '@capacitor/preferences/dist/esm/web';

import {ThemeService} from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;
  let prefsGet: jasmine.Spy;
  let prefsSet: jasmine.Spy;
  let mql: {matches: boolean; addEventListener: jasmine.Spy; removeEventListener: jasmine.Spy};

  const setupMatchMedia = (matches: boolean): void => {
    mql = {
      matches,
      addEventListener: jasmine.createSpy('addEventListener'),
      removeEventListener: jasmine.createSpy('removeEventListener'),
    };
    spyOn(window, 'matchMedia').and.returnValue(mql as never);
  };

  const hasDarkClass = (): boolean =>
    document.documentElement.classList.contains('ion-palette-dark');

  beforeEach(() => {
    TestBed.resetTestingModule();
    prefsGet = spyOn(PreferencesWeb.prototype, 'get').and.resolveTo({value: null});
    prefsSet = spyOn(PreferencesWeb.prototype, 'set').and.resolveTo();
    document.documentElement.classList.remove('ion-palette-dark');
    service = TestBed.inject(ThemeService);
  });

  it('defaults to system', () => {
    expect(service.theme()).toBe('system');
  });

  it('loads a persisted theme and applies it', async () => {
    prefsGet.and.resolveTo({value: 'dark'});

    await service.init();

    expect(service.theme()).toBe('dark');
    expect(hasDarkClass()).toBe(true);
  });

  it('ignores an invalid persisted value', async () => {
    prefsGet.and.resolveTo({value: 'sepia'});

    await service.init();

    expect(service.theme()).toBe('system');
  });

  it('applies dark and persists the choice', async () => {
    await service.setTheme('dark');

    expect(hasDarkClass()).toBe(true);
    expect(prefsSet).toHaveBeenCalledWith({key: 'app_theme', value: 'dark'});
  });

  it('applies light and removes the dark class', async () => {
    await service.setTheme('dark');
    await service.setTheme('light');

    expect(hasDarkClass()).toBe(false);
  });

  it('follows the system preference in system mode', async () => {
    setupMatchMedia(true);

    await service.setTheme('system');

    expect(hasDarkClass()).toBe(true);
    expect(mql.addEventListener).toHaveBeenCalledWith('change', jasmine.any(Function));
  });

  it('reacts to system changes while in system mode', async () => {
    setupMatchMedia(false);
    await service.setTheme('system');
    expect(hasDarkClass()).toBe(false);

    mql.matches = true;
    const handler = mql.addEventListener.calls.mostRecent().args[1] as () => void;
    handler();

    expect(hasDarkClass()).toBe(true);
  });

  it('stops watching the system when switching to an explicit theme', async () => {
    setupMatchMedia(true);
    await service.setTheme('system');
    await service.setTheme('light');

    expect(mql.removeEventListener).toHaveBeenCalled();
    expect(hasDarkClass()).toBe(false);
  });
});
