import {TestBed} from '@angular/core/testing';
import {Capacitor} from '@capacitor/core';
import {BarcodeFormat} from '@capacitor-mlkit/barcode-scanning';
import {BarcodeScannerWeb} from '@capacitor-mlkit/barcode-scanning/dist/esm/web';

import {ScannerService} from './scanner.service';

describe('ScannerService', () => {
  let service: ScannerService;
  let requestSpy: jasmine.Spy;
  let scanSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.resetTestingModule();
    requestSpy = spyOn(BarcodeScannerWeb.prototype, 'requestPermissions').and.resolveTo({ camera: 'granted' });
    scanSpy = spyOn(BarcodeScannerWeb.prototype, 'scan').and.resolveTo({ barcodes: [] });
    service = TestBed.inject(ScannerService);
  });

  it('is not available on web', () => {
    spyOn(Capacitor, 'isNativePlatform').and.returnValue(false);
    expect(service.isAvailable).toBe(false);
  });

  it('is available on native', () => {
    spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
    expect(service.isAvailable).toBe(true);
  });

  it('returns null when not available', async () => {
    spyOn(Capacitor, 'isNativePlatform').and.returnValue(false);

    expect(await service.scan()).toBeNull();
    expect(scanSpy).not.toHaveBeenCalled();
  });

  it('returns null when the camera permission is denied', async () => {
    spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
    requestSpy.and.resolveTo({ camera: 'denied' });

    expect(await service.scan()).toBeNull();
    expect(scanSpy).not.toHaveBeenCalled();
  });

  it('returns the first barcode value on success', async () => {
    spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
    scanSpy.and.resolveTo({ barcodes: [{ rawValue: '5901234123457' }] });

    expect(await service.scan()).toBe('5901234123457');
    expect(scanSpy).toHaveBeenCalledWith({
      formats: [BarcodeFormat.UpcA, BarcodeFormat.UpcE, BarcodeFormat.Ean8, BarcodeFormat.Ean13],
    });
  });

  it('returns null when no barcode was detected', async () => {
    spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
    scanSpy.and.resolveTo({ barcodes: [] });

    expect(await service.scan()).toBeNull();
  });
});
