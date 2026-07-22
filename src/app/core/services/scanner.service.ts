import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { BarcodeFormat, BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

/** Target grocery barcode standards (UPC/EAN), per the blueprint. */
const GROCERY_FORMATS = [
  BarcodeFormat.UpcA,
  BarcodeFormat.UpcE,
  BarcodeFormat.Ean8,
  BarcodeFormat.Ean13,
];

/**
 * Thin wrapper over the native ML Kit barcode scanner.
 *
 * Uses the plugin's one-shot `scan()` method, which presents its own
 * ready-made native scanning UI on top of the app — so no WebView
 * transparency/overlay tricks are required.
 */
@Injectable({ providedIn: 'root' })
export class ScannerService {
  /** Hardware scanning only exists on native builds; web dev falls back to manual entry. */
  get isAvailable(): boolean {
    return Capacitor.isNativePlatform();
  }

  /** Returns the raw barcode string, or null when cancelled, denied or unsupported. */
  async scan(): Promise<string | null> {
    if (!this.isAvailable) return null;

    const status = await BarcodeScanner.requestPermissions();
    if (status.camera !== 'granted') return null;

    const { barcodes } = await BarcodeScanner.scan({ formats: GROCERY_FORMATS });
    return barcodes.length > 0 ? (barcodes[0].rawValue ?? null) : null;
  }
}
