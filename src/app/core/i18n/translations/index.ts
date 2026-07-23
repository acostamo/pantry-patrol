import { en } from './en';
import { es } from './es';
import { pl } from './pl';

export type Lang = 'en' | 'es' | 'pl';

export const SUPPORTED_LANGS: Lang[] = ['en', 'es', 'pl'];

export const TRANSLATIONS: Record<Lang, Record<string, string>> = { en, es, pl };

export const LANG_NAMES: Record<Lang, string> = {
  en: 'English',
  es: 'Español',
  pl: 'Polski',
};

export const FALLBACK_LANG: Lang = 'en';

export function detectSystemLang(): Lang {
  const code = (navigator.language || 'en').toLowerCase();
  if (code.startsWith('es')) return 'es';
  if (code.startsWith('pl')) return 'pl';
  return 'en';
}
