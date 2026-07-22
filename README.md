# Pantry Patrol

A 100% offline pantry inventory app that helps you stop wasting food and money. Catalog your groceries, track expiration dates, and get notified before items expire — all data stays on your device.

Built with **Ionic 8 + Angular 22 (standalone, signals) + Capacitor 8 + TypeScript 6**.

## Features

- **Barcode scanning** — native ML Kit scanner for UPC/EAN grocery codes
- **Product resolution** — optional Open Food Facts lookup for names/thumbnails, with graceful offline fallback to manual entry (the app's only network call)
- **Expiration tracking** — status badges (`EXPIRED` / `IMPENDING` / `STABLE`) and human-friendly labels, sorted by soonest expiry
- **Local notifications** — kernel-scheduled OS alerts 3 days before expiry; they fire even if the app was killed
- **Swipe gestures** — swipe right to quick-renew an item by 7 days, swipe left to dispose of it
- **Haptic feedback** on add/update actions
- **Fully offline** — the inventory lives in on-device storage (`@capacitor/preferences`); no account, no backend, no sync

## Prerequisites

- Node.js 20.19+ / 22.12+ / 24+ and npm
- For Android builds: Android Studio (SDK + device or emulator)
- For iOS builds: a Mac with Xcode and CocoaPods

## Getting started (web development)

```bash
npm install
npm start
```

Then open http://localhost:4200. On web, native-only features are stubbed: the scanner FAB falls back to manual entry, and local notifications/haptics are skipped. The pantry itself works fully (persisted to localStorage).

## Run on Android

```bash
npx ng build              # always build first — cap sync copies www/
npx cap sync android
npx cap open android      # opens Android Studio; run on a device/emulator
```

Declared permissions: `CAMERA` (barcode scanning), `VIBRATE` (haptics), `POST_NOTIFICATIONS` (expiration alerts on Android 13+).

## Run on iOS

iOS requires macOS. Copy the project to a Mac, then:

```bash
npx cap sync ios          # first time (runs pod install); later builds: npx cap copy ios
npx cap open ios          # opens Xcode
```

`NSCameraUsageDescription` is already declared in `ios/App/App/Info.plist`.

## Available scripts

| Command                    | Description                                        |
| -------------------------- | -------------------------------------------------- |
| `npm start`                | Dev server with live reload                        |
| `npx ng build`             | Production build → `www/`                          |
| `npx ng lint`              | ESLint (flat config)                               |
| `npx ng test`              | Karma + Jasmine tests (add `--watch=false --browsers=ChromeHeadless` for CI) |
| `npx cap sync android`     | Copy web assets + update native Android project    |
| `npx cap copy ios`         | Copy web assets into the iOS project (no pods)     |

## Project structure

```
src/app/
├── core/
│   ├── models/pantry-item.model.ts        # PantryItem + expiration status helpers
│   └── services/
│       ├── pantry-store.service.ts        # Signal store + persistence + notification sync
│       ├── scanner.service.ts             # ML Kit barcode scanning
│       ├── product-resolver.service.ts    # Open Food Facts lookup (offline-safe)
│       └── notification.service.ts        # Local notification scheduling + haptics
├── home/                                  # Inventory list, swipe actions, FAB
└── item-editor/                           # Add/edit modal with native date picker
```

## Data & privacy

Everything you scan or type stays on your device. The only outbound request is an optional, unauthenticated GET to the Open Food Facts API when resolving a scanned barcode; when offline, the app simply asks you to type the product name.

Product data: [Open Food Facts](https://world.openfoodfacts.org) (ODbL) — a free, crowdsourced food database.
