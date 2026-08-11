# Privacy Policy

**Last updated:** [Date]

This Privacy Policy describes how Pantry Patrol ("we", "us", or "our") handles information when you use the Pantry Patrol mobile application (the "App").

## 1. Overview

Pantry Patrol is a pantry inventory app designed to be **fully offline and privacy-first**. It helps you track food items, expiration dates, quantities, prices, notes, tags, and favorites.

- We **do not** collect, store, or transmit any personal information.
- We **do not** require an account, login, or registration.
- We **do not** use analytics, advertising, tracking, or profiling.
- Your pantry data is stored **only on your device** and never leaves it.

## 2. Information stored on your device

All app data is stored locally on your device:

- **Pantry inventory** (item names, barcodes, expiration dates, quantities, prices, notes, tags, favorites, photos) is stored locally using the device's on-device storage (via @capacitor/preferences and, for photos, the app's private application directory).
- **App preferences** (your selected language and theme) are stored locally.
- **Scheduled expiration notifications** are created and managed by the operating system's local notification system. No notification content is transmitted anywhere.

None of this data is uploaded to our servers — because we have no servers.

## 3. Permissions we use

The App may request the following device permissions, used solely for the features described:

| Permission | Purpose |
| --- | --- |
| **Camera** | To scan product barcodes and to take product photos. |
| **Photo library / Gallery** | To import product photos you choose for an item. |
| **Notifications** | To show you local expiration reminders for your items. |
| **Internet** | Used only when you scan a barcode: the barcode is sent to the Open Food Facts service (see Section 4) to fetch the product name and a thumbnail. Everything else works offline. |

## 4. Third-party services

The App makes a single, optional network request:

- **Open Food Facts** (`world.openfoodfacts.org`) — when you scan a barcode, the barcode number is sent to this public, open product database to look up a product name and image. No other data is sent. This happens only on your request and is not required to use the App; if you are offline or the product is unknown, you can simply enter the item name manually.

We do not share, sell, or otherwise disclose any information to third parties beyond the barcode lookup described above.

## 5. Children's privacy

The App does not knowingly collect personal information from anyone, including children under the age of 13 (or the applicable age of consent in your jurisdiction).

## 6. Data deletion

- You can delete any individual item from your pantry at any time from within the App.
- Photos removed with an item are deleted from the app's storage.
- Uninstalling the App removes all locally stored data.

## 7. Security

Because your data never leaves your device and the App requires no account, there is no user data for us (or a third party) to compromise on our side. Data on your device is protected by the same security measures that protect your device.

## 8. Changes to this Privacy Policy

We may update this Privacy Policy from time to time. If we make changes, the "Last updated" date above will be revised, and the updated policy will be made available in this repository.

## 9. Contact

If you have any questions about this Privacy Policy or the App, please contact us at:

- Email: info@acostamo.com
- Developer: acostamo
- App: Pantry Patrol (`com.acostamo.pantrypatrol`)
