---
name: ionic-conventions
description: Code conventions for this Angular 22 + Ionic 8 standalone app. Use when creating or editing pages, components, templates, services, or state mutations.
---

# Pantry Patrol conventions

> **Target devices:** Android/iOS **phones and tablets** are the primary target. The web build exists for **development/testing only** — keep native UX first-class; web fallbacks (file `<input>`, browser download, no scanner) are for dev convenience, never an excuse to degrade the native experience.

## Generating pages

```
yarn.cmd ng generate @ionic/angular-toolkit:page <name>
```

Produces a standalone component with `Page` suffix and a preconfigured `.scss`.

## Imports & icons

- Import each Ionic component **individually** from `@ionic/angular/standalone` — never the whole module.
- Register icons per component in the **constructor**: `addIcons({ add, barcodeOutline, ... })`, importing from `ionicons/icons`.
- Class suffixes: pages end in `Page`, components in `Component`. Selectors are `app-` kebab-case (ESLint enforces both).

## State architecture

- `PantryStore` (`src/app/core/services/pantry-store.service.ts`) is the **single source of truth**: a signal holding the whole inventory, persisted as one JSON doc under the `pantry_items` Preferences key. Every mutation also schedules/cancels the item's OS notification. **Mutate inventory only through this service** — never write `Preferences` directly.
- `store.items` is computed, sorted by favorite-first then soonest expiry. Pages read it reactively; group/summary computed in `home.page.ts`.
- Old persisted docs are upgraded in place via `normalizeItem` (in `pantry-item.model.ts`). New item fields get defaults there.

## Editor & modal inputs

- `ItemEditorComponent` deliberately uses classic decorator `@Input()` (not signal `input()`) because Ionic `ModalController` `componentProps` assigns properties directly. Keep it that way.

## Native-only features

- Barcode scanner, local notifications, haptics are guarded by `Capacitor.isNativePlatform()`. On web the scan FAB silently falls back to the manual editor — intentional, not a bug.
- Each item carries a random integer `notificationId` (crypto-secure via `randomNotificationId()`) so its scheduled notification can be cancelled on update/delete.

## tsconfig

- TS 6, `moduleResolution: "bundler"`, **no `baseUrl`/`paths`** — re-adding them breaks the build (deprecation errors). Do not reintroduce.

## A11y (Sonar)

- `ion-button` / `ion-fab-button` already render native `<button>` with keyboard support — do **not** add `(keydown.enter)` handlers (they double-fire). Mark `Web:MouseEventWithoutKeyboardEquivalentCheck` on them as false positive.
- For a custom clickable `<div>`, use a real `<button type="button">` (fixes `Web:S6819` which rejects `div role="button"`, and the keyboard rule exempts native buttons). Inner `div`s inside a button should become `span`s.
