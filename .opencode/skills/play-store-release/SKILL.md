---
name: play-store-release
description: Google Play Console submission details for this app — release notes, store listing, privacy policy, data-safety/AD_ID declarations, and store assets. Use when preparing a release.
---

# Play Store release

Version source of truth: `package.json` `version` (currently `0.0.1`).

## Release notes ("What's new")

- Google Play's console **no longer parses `<lang>…</lang>` XML tags** — paste **plain text** per language after selecting the language in the "What's new" field. (If using the Play Developer API, send `releaseNotes` as `[{ "language": "en-US", "text": "..." }, ...]`.)
- Limit: **500 characters** per language. Supported store languages: **en-US, es-ES, pl-PL** (mirrors in-app i18n).
- Current v0.0.1 draft (short form): EN "Scan barcodes, track expiration dates, and get reminders. Renew or remove items with a swipe. Add photos and organize items with quantity, price, notes, tags and favorites. Fully offline. Available in English, Spanish and Polish." — plus ES and PL equivalents in `docs/` conversations.

## Store listing

- App name ≤30 chars, short description ≤80 chars, full description ≤4000 chars (per language). Drafts exist for EN/ES/PL from earlier planning — keep them consistent with the app's actual features.

## Privacy policy

- `docs/PRIVACY_POLICY.md` must be reachable at a **public HTTPS URL** (GitHub Pages). Fill the Section 9 placeholders (contact email, developer name) before submitting.
- Content must match reality: 100% offline, no accounts/ads/analytics, data stays on device; the only external call is the optional Open Food Facts barcode lookup on user request.

## Declarations

- **Advertising ID: No.** The app has no ads/analytics SDK. Verify before shipping by checking the merged manifest at `android/app/build/intermediates/merged_manifests/release/.../AndroidManifest.xml` for `com.google.android.gms.permission.AD_ID` (ML Kit's `play-services-code-scanner` does not pull in `play-services-ads`).
- **Data Safety**: no data collected/shared; photos and inventory stored locally; barcode lookup is user-initiated. Keep in sync with the privacy policy.

## Assets required

- **App icon**: 512×512 PNG, logo within the center 66% safe zone.
- **Feature graphic**: 1024×500, no transparency, keep ~60px margin.
- **Phone screenshots**: 9:16 (1080×1920 ideal), 2+; capture from the app on an emulator via `adb exec-out screencap`.
- **Tablet screenshots**: 10" 1920×1200 (landscape) or 1200×1920 (portrait).
- Native icons/splash are regenerated with `yarn.cmd capacitor-assets generate --android` (see `android-windows-build` skill).

## Build the .aab

```
yarn.cmd ng build
yarn.cmd cap sync android
# then Gradle bundleRelease with your signing config (release keystore)
```
