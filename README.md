# Pantry Patrol

A 100% offline pantry inventory app that helps you stop wasting food and money. Catalog your groceries, track expiration dates, and get notified before items expire — all data stays on your device.

> **Target devices:** Android/iOS **phones and tablets**. The web build exists for development/testing only.

Built with **Ionic 8 + Angular 22 (standalone, signals) + Capacitor 8 + TypeScript 6**.

## Features

- **Barcode scanning** — native ML Kit scanner for UPC/EAN grocery codes
- **Product resolution** — optional Open Food Facts lookup for names/thumbnails, with graceful offline fallback to manual entry (the app's only network call)
- **Expiration tracking** — status badges (`EXPIRED` / `IMPENDING` / `STABLE`) and human-friendly labels, sorted by soonest expiry
- **Local notifications** — kernel-scheduled OS alerts 3 days before expiry; they fire even if the app was killed
- **Swipe gestures** — swipe right to quick-renew an item by 7 days, swipe left to dispose of it
- **Rich items** — quantity, price, notes, tags, favorites (pinned to the top), and product photos
- **Search** — filter your pantry by name or tag as it grows
- **Light / Dark / System theme** — follows the OS by default, with an explicit override
- **Backup** — export your inventory (JSON or CSV) and restore it on any device
- **Haptic feedback** on add/update actions
- **Fully offline** — the inventory lives in on-device storage (`@capacitor/preferences`); no account, no backend, no sync

## Prerequisites

- Node.js 20.19+ / 22.12+ / 24+ and **Yarn Classic** (`yarn --version` should show `1.x`)
- For Android builds: Android Studio (SDK + device or emulator)
- For iOS builds: a Mac with Xcode and CocoaPods

## Getting started (web development)

```bash
yarn install
yarn start
```

Then open http://localhost:4200. On web, native-only features are stubbed: the scanner FAB falls back to manual entry, and local notifications/haptics are skipped. The pantry itself works fully (persisted to localStorage).

## Run on Android

```bash
yarn ng build              # always build first — cap sync copies www/
yarn cap sync android
yarn cap open android      # opens Android Studio; run on a device/emulator
```

Declared permissions: `CAMERA` (barcode scanning), `VIBRATE` (haptics), `POST_NOTIFICATIONS` (expiration alerts on Android 13+).

## Run on iOS

iOS requires macOS. Copy the project to a Mac, then:

```bash
yarn cap sync ios          # first time (runs pod install); later builds: yarn cap copy ios
yarn cap open ios          # opens Xcode
```

> **Windows users:** PowerShell blocks `.ps1` scripts by default. Run `yarn.cmd` / `yarnpkg.cmd` instead of `yarn` / `yarnpkg` to work around this. The same applies to the commands below.

`NSCameraUsageDescription` is already declared in `ios/App/App/Info.plist`.

## Available scripts

| Command                        | Description                                        |
| ------------------------------ | -------------------------------------------------- |
| `yarn start`                   | Dev server with live reload                        |
| `yarn ng build`                | Production build → `www/`                          |
| `yarn ng lint`                 | ESLint (flat config)                               |
| `yarn ng test`                 | Karma + Jasmine tests (add `--watch=false --browsers=ChromeHeadless` for CI) |
| `yarn cap sync android`        | Copy web assets + update native Android project    |
| `yarn cap copy ios`            | Copy web assets into the iOS project (no pods)     |

## Project structure

```
src/app/
├── core/
│   ├── models/pantry-item.model.ts        # PantryItem + expiration status helpers
│   └── services/
│       ├── pantry-store.service.ts        # Signal store + persistence + notification sync
│       ├── scanner.service.ts             # ML Kit barcode scanning
│       ├── product-resolver.service.ts    # Open Food Facts lookup (offline-safe)
│       ├── notification.service.ts        # Local notification scheduling + haptics
│       ├── theme.service.ts               # Light/Dark/System appearance preference
│       ├── photo.service.ts               # Camera/gallery capture + file persistence
│       └── backup.service.ts              # JSON/CSV export + native/web import
├── home/                                  # Inventory list, search, swipe actions, FAB
├── app-menu/                              # Settings menu: language, theme, data/backup
└── item-editor/                           # Add/edit modal with native date picker
```

## Data & privacy

Everything you scan or type stays on your device. The only outbound request is an optional, unauthenticated GET to the Open Food Facts API when resolving a scanned barcode; when offline, the app simply asks you to type the product name.

Product data: [Open Food Facts](https://world.openfoodfacts.org) (ODbL) — a free, crowdsourced food database.
