# AGENTS.md

Pantry Patrol — 100% offline Ionic + Capacitor pantry inventory app (Angular 22 standalone, Capacitor 8, TypeScript 6).

## Environment gotchas (this machine)

- Windows PowerShell blocks `.ps1` scripts (execution policy): always call `yarn.cmd` instead of `yarn` and `yarnpkg.cmd` instead of `yarnpkg` (same issue as `npm.cmd`).
- `yarn.cmd cap sync ios` fails on Windows (pod install requires macOS). Use `yarn.cmd cap copy ios` here; run the full sync on a Mac.

## Commands

- Dev server: `yarn.cmd start`
- Build: `yarn.cmd ng build` → outputs to `www/` (Capacitor `webDir` is `www`, not `dist`)
- Lint: `yarn.cmd ng lint` (ESLint flat config `eslint.config.js`)
- Tests: `yarn.cmd ng test --watch=false --browsers=ChromeHeadless` (karma.conf.js defaults to **headed** Chrome). Single spec: append `--include='**/home.page.spec.ts'`. The "karma builder is deprecated" warning is expected noise.
- New page: `yarn.cmd ng generate @ionic/angular-toolkit:page <name>` (standalone + scss preconfigured)
- Native sync: **build first**, then `yarn.cmd cap sync android` / `yarn.cmd cap copy ios` — sync copies `www/`, so building after syncing ships stale assets.

## Architecture

- `src/app/core/services/pantry-store.service.ts` (`PantryStore`) is the single source of truth: a signal holding the whole inventory, persisted as one JSON document under the `pantry_items` @capacitor/preferences key. Every mutation also schedules/cancels the item's OS local notification — mutate inventory only through this service, never directly.
- Hydration happens once in the `AppComponent` constructor (`store.load()`); pages just read `store.items` (computed, sorted by soonest expiry).
- Native-only features (barcode scanner, local notifications, haptics) are guarded by `Capacitor.isNativePlatform()`; on web the scan FAB silently falls back to the manual editor — intentional, not a bug.
- The app's only network call is the Open Food Facts barcode lookup in `product-resolver.service.ts` (optional enhancement with offline fallback); everything else is fully offline.
- `ItemEditorComponent` deliberately uses classic decorator `@Input()` (not signal `input()`), because Ionic `ModalController` `componentProps` assigns properties directly.
- Each item carries a random integer `notificationId` so its scheduled notification can be cancelled on update/delete.
- tsconfig targets TypeScript 6: no `baseUrl`, `moduleResolution: "bundler"`. Do not re-add `baseUrl`/`paths` — the build fails on TS 6 deprecation errors.

## Conventions

- ESLint enforces component class suffixes `Page`/`Component` and `app` kebab-case selectors.
- Standalone Ionic imports only: import each `Ion*` component individually from `@ionic/angular/standalone`; register icons per component with `addIcons()` in the constructor.
- Native permission declarations live in `android/app/src/main/AndroidManifest.xml` (CAMERA, VIBRATE, POST_NOTIFICATIONS) and `ios/App/App/Info.plist` (NSCameraUsageDescription) — update them when native features change.
- I18n: light custom implementation in `src/app/core/i18n/`. `I18nService.lang` is a signal; an impure `TranslatePipe` (`pure: false`) reevaluates on every CD cycle so the UI updates when the user switches language. `translate(key, ...args)` with `{0}` interpolation is used in code (toasts, expiry labels). Supported languages are `'en'`, `'es'`, `'pl'`; the system language is auto-detected on first launch and persisted to the `app_lang` Preferences key. The language menu lives in `src/app/app-menu/`.
