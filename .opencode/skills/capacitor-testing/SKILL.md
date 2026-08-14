---
name: capacitor-testing
description: How to mock @capacitor plugins in this project's Karma/Jasmine tests. Use when writing or debugging spec files that call Preferences, LocalNotifications, Haptics, Network, Camera, Filesystem, or the ML Kit BarcodeScanner.
---

# Testing Capacitor plugins

Capacitor 8 plugin objects are **Proxies** created by `registerPlugin(...)`. Their
methods are generated on the fly by the proxy's `get` trap, so **`spyOn` on the
plugin object silently does nothing** — `spyOn(Preferences, 'get')` will "work" but
the real web implementation still runs, causing confusing test failures and timeouts.

## The pattern

Spy on the **web implementation class prototype** instead. Each plugin exposes a
`Web` class under `@capacitor/<plugin>/dist/esm/web` (and
`@capacitor-mlkit/barcode-scanning/dist/esm/web`). The proxy calls
`instance[method]`, which resolves to the prototype — so the spy intercepts.

```ts
import { PreferencesWeb } from '@capacitor/preferences/dist/esm/web';

let prefsGet: jasmine.Spy;
let prefsSet: jasmine.Spy;

beforeEach(() => {
  prefsGet = spyOn(PreferencesWeb.prototype, 'get').and.resolveTo({ value: null });
  prefsSet = spyOn(PreferencesWeb.prototype, 'set').and.resolveTo();
});
```

Assert on the **captured spy reference**, never on `Preferences.get` (that
property is a fresh wrapper each access and is not a spy):

```ts
expect(prefsSet).toHaveBeenCalledWith({ key: 'pantry_items', value: '...' });
```

## Web implementation classes

| Plugin | Import (subpath) | Prototype methods to spy |
| --- | --- | --- |
| `@capacitor/preferences` | `dist/esm/web` → `PreferencesWeb` | `get`, `set`, `remove`, `keys`, `clear`, `migrate` |
| `@capacitor/local-notifications` | `dist/esm/web` → `LocalNotificationsWeb` | `schedule`, `cancel`, `requestPermissions` |
| `@capacitor/haptics` | `dist/esm/web` → `HapticsWeb` | `impact` |
| `@capacitor/network` | `dist/esm/web` → `NetworkWeb` | `getStatus` |
| `@capacitor/camera` | `dist/esm/web` → `CameraWeb` | `takePhoto`, `chooseFromGallery` |
| `@capacitor/filesystem` | `dist/esm/web` → `FilesystemWeb` | `copy`, `deleteFile`, `getUri`, `readFile` |
| `@capacitor-mlkit/barcode-scanning` | `dist/esm/web` → `BarcodeScannerWeb` | `scan`, `requestPermissions` |

## Notes

- **`@capacitor/core`'s `Capacitor` is a plain object, not a proxy** — `spyOn(Capacitor, 'isNativePlatform')` works normally. `Capacitor.convertFileSrc` too.
- **`Capacitor.isNativePlatform()` is captured at construction** in some services (e.g. `PhotoService`). Set the spy **before** `TestBed.inject(...)` and use `TestBed.resetTestingModule()` between web/native suites so a cached instance isn't reused with the wrong flag.
- **Camera is v8.1+**: `Camera.getPhoto` / `CameraResultType` / `CameraSource` are **deprecated** (Sonar S1874). Use `Camera.takePhoto({ quality, webUseInput })` and `Camera.chooseFromGallery({ mediaType: MediaTypeSelection.Photo })`; native results expose `uri`, web results expose `webPath` (convert blob→data URL to survive reloads).
- Services that inject other app services (`PantryStore` → `NotificationService`, `PhotoService`) should get those as `jasmine.createSpyObj(...)` provided via `TestBed` with `{ provide: X, useValue: mock }`.
