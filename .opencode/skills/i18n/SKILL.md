---
name: i18n
description: Internationalization conventions for this app. Use when editing translations, adding a language, or touching the TranslatePipe / I18nService.
---

# i18n

Lightweight custom i18n lives in `src/app/core/i18n/`.

## Where things live

- `translations/en.ts`, `translations/es.ts`, `translations/pl.ts` — plain `Record<string, string>` maps.
- `translations/index.ts` — `Lang = 'en' | 'es' | 'pl'`, `SUPPORTED_LANGS`, `LANG_NAMES`, `FALLBACK_LANG = 'en'`, `detectSystemLang()`.
- `i18n.service.ts` — `I18nService.lang` is a **signal**; `init()` loads the persisted `app_lang` Preference; `translate(key, ...args)` interpolates `{0}`, `{1}`.
- `translate.pipe.ts` — impure (`pure: false`) so the UI updates when the language switches without changing the key.
- The language menu is in `src/app/app-menu/`.

## Rules

- **The three language files must stay exact mirrors** — same keys in the same order. When you add a key, add it to all three (ES and PL are easy to miss).
- Key namespacing: `home.*`, `editor.*`, `expiry.*`, `toast.*`, `photo.*`, `menu.*`, `notification.*`, plus bare `EXPIRED` / `IMPENDING` / `STABLE`.
- Use `i18n.translate(key, ...args)` in code (toasts, expiry labels). `{0}` placeholders are positional.
- `detectSystemLang()` reads `navigator.language`; `en` is the fallback.

## Adding a language

1. Create `translations/<code>.ts` mirroring `en.ts`.
2. Register it in `translations/index.ts`: add to `Lang`, `SUPPORTED_LANGS`, `LANG_NAMES`, and `detectSystemLang()`.
3. Keep `FALLBACK_LANG = 'en'`.
4. Add any new keys to all languages including the new one.
