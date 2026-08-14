---
name: android-windows-build
description: Android/iOS build, sync, and native config gotchas for this repo on Windows. Use when building, running `cap sync/copy`, editing AndroidManifest, gradle, permissions, minSdk, or generating app assets.
---

# Android / Capacitor build on Windows

## Windows PowerShell gotchas

- PowerShell blocks `.ps1` scripts (execution policy). Always use **`yarn.cmd`** (not `yarn`) and **`yarnpkg.cmd`** (not `yarnpkg`).
- `yarn.cmd cap sync ios` fails on Windows (pod install requires macOS). Use **`yarn.cmd cap copy ios`** here; run the full sync on a Mac.
- Android debug build: `& .\android\gradlew.bat :app:assembleDebug --no-daemon`. The SDK lives at `D:\Android\Sdk` (see `android/local.properties`).

## Ordering (important)

**Build first, then sync.** `cap sync android` / `cap copy ios` copies `www/` into the native project. If you build *after* syncing, the native app ships stale assets. Correct sequence:

```
yarn.cmd ng build
yarn.cmd cap sync android    # or: yarn.cmd cap copy ios
```

## AndroidManifest survives sync

`cap sync` / `cap copy` / `cap update` do **not** overwrite `android/app/src/main/AndroidManifest.xml` — only `cap add android` (fresh platform generation) regenerates it from the template. Current edits on it:

- `android:allowBackup="false"` (privacy stance; also clears Sonar S6358)
- `android:usesCleartextTraffic="false"` (S5332; HTTPS-only, Open Food Facts is HTTPS)
- Only `INTERNET` is declared; CAMERA/VIBRATE/POST_NOTIFICATIONS/RECEIVE_BOOT_COMPLETED/WAKE_LOCK are **merged from plugin manifests at Gradle build time**.

## Native settings

- `minSdkVersion = 24` in `android/variables.gradle` (Android 7.0); `compileSdkVersion`/`targetSdkVersion = 36`.
- The WebView is the Android System WebView. The bundle is emitted as **es2022**, so very old WebViews (stock API 24–33 images) can fail to parse it. If "works only on API 34+" complaints recur, either downlevel (`target: es2019` in angular.json) + polyfill, or raise minSdk.

## App assets

- Regenerate native icons/splash with `yarn.cmd capacitor-assets generate --android` using `resources/icon.png` (512×512 source is enough; outputs are ≤432px). Run again whenever the icon changes.
- AD_ID / advertising: the app has **no ads SDK**. The merged release manifest (`android/app/build/intermediates/merged_manifests/release/.../AndroidManifest.xml`) contains no `com.google.android.gms.permission.AD_ID` — answer **No** to the Play advertising-ID declaration. ML Kit's `play-services-code-scanner` does not pull in `play-services-ads`.
