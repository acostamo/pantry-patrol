import {Injectable, signal} from '@angular/core';
import {Preferences} from '@capacitor/preferences';

export type ThemePreference = 'light' | 'dark' | 'system';

const THEME_KEY = 'app_theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';
const DARK_CLASS = 'ion-palette-dark';

/**
 * Light / Dark / System appearance preference.
 *
 * Ionic's dark palette is class-driven (`dark.class.css`): we toggle
 * `ion-palette-dark` on `<html>`. When the user picks "system" we follow the
 * OS `prefers-color-scheme` media query and react to its changes. The choice
 * is persisted under the `app_theme` Preferences key, mirroring how
 * `I18nService` persists the language.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  /** Active theme preference. Defaults to following the system setting. */
  readonly theme = signal<ThemePreference>('system');

  private mediaQuery?: MediaQueryList;
  private readonly onSystemChange = (): void => this.apply();

  /** Loads a persisted theme override (if any), then applies it. */
  async init(): Promise<void> {
    const { value } = await Preferences.get({ key: THEME_KEY });
    if (value === 'light' || value === 'dark' || value === 'system') {
      this.theme.set(value);
    }
    this.apply();
  }

  async setTheme(theme: ThemePreference): Promise<void> {
    this.theme.set(theme);
    await Preferences.set({ key: THEME_KEY, value: theme });
    this.apply();
  }

  /** Applies the resolved dark/light state to the document. */
  apply(): void {
    const preference = this.theme();
    this.unwatchSystem();
    let dark: boolean;
    if (preference === 'dark') {
      dark = true;
    } else if (preference === 'light') {
      dark = false;
    } else {
      this.watchSystem();
      dark = this.systemPrefersDark();
    }
    document.documentElement.classList.toggle(DARK_CLASS, dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  }

  private systemPrefersDark(): boolean {
    return typeof window !== 'undefined' && window.matchMedia(DARK_QUERY).matches;
  }

  private watchSystem(): void {
    if (typeof window === 'undefined') return;
    this.mediaQuery = window.matchMedia(DARK_QUERY);
    this.mediaQuery.addEventListener('change', this.onSystemChange);
  }

  private unwatchSystem(): void {
    this.mediaQuery?.removeEventListener('change', this.onSystemChange);
    this.mediaQuery = undefined;
  }
}
