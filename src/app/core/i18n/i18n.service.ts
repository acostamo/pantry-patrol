import {Injectable, signal} from '@angular/core';
import {Preferences} from '@capacitor/preferences';

import {detectSystemLang, FALLBACK_LANG, Lang, TRANSLATIONS,} from './translations';

const LANG_KEY = 'app_lang';

@Injectable({ providedIn: 'root' })
export class I18nService {
  /** Active language. Defaults to `detectSystemLang()` so the first render already matches the OS. */
  readonly lang = signal<Lang>(detectSystemLang());

  /** Loads a persisted language override (if any) from on-device storage. */
  async init(): Promise<void> {
    const { value } = await Preferences.get({ key: LANG_KEY });
    if (value === 'en' || value === 'es' || value === 'pl') {
      this.lang.set(value);
    }
  }

  async setLanguage(lang: Lang): Promise<void> {
    this.lang.set(lang);
    await Preferences.set({ key: LANG_KEY, value: lang });
  }

  /** Translate a key, replacing `{0}`, `{1}`, … placeholders in order. */
  translate(key: string, ...args: string[]): string {
    const template =
      TRANSLATIONS[this.lang()][key] ?? TRANSLATIONS[FALLBACK_LANG][key] ?? key;
    return template.replace(/\{(\d+)\}/g, (_, idx) => args[+idx] ?? `{${idx}}`);
  }
}
