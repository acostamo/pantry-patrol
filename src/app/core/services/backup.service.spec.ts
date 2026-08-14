import {TestBed} from '@angular/core/testing';
import {Capacitor} from '@capacitor/core';
import {FilesystemWeb} from '@capacitor/filesystem/dist/esm/web';
import {ShareWeb} from '@capacitor/share/dist/esm/web';
import {FilePickerWeb} from '@capawesome/capacitor-file-picker/dist/esm/web';

import {PantryItem} from '../models/pantry-item.model';
import {BackupService} from './backup.service';

describe('BackupService', () => {
  let service: BackupService;

  const item = (overrides: Partial<PantryItem> = {}): PantryItem => ({
    id: 'a',
    barcode: '5901234123457',
    name: 'Milk',
    thumbUrl: '',
    expireDate: '2026-12-01T00:00:00.000Z',
    notificationId: 1,
    quantity: 2,
    addedDate: '2026-01-01T00:00:00.000Z',
    favorite: true,
    notes: 'door shelf',
    tags: ['dairy'],
    price: 1.5,
    ...overrides,
  });

  describe('serialization', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(false);
      service = TestBed.inject(BackupService);
    });

    it('wraps items in a versioned JSON envelope', () => {
      const items = [item()];
      const parsed = JSON.parse(service.exportJson(items));

      expect(parsed.app).toBe('pantry-patrol');
      expect(parsed.format).toBe(1);
      expect(parsed.items).toEqual(items);
    });

    it('round-trips through parseJson', () => {
      const items = [item({name: 'Whole Milk', tags: ['dairy', 'fresh']})];

      expect(service.parseJson(service.exportJson(items))).toEqual(items);
    });

    it('normalizes legacy or partial items on import', () => {
      const text = JSON.stringify({
        app: 'pantry-patrol',
        format: 1,
        exportedAt: '2026-01-01T00:00:00.000Z',
        items: [{id: 'x', name: 'Old item'}],
      });

      const parsed = service.parseJson(text);

      expect(parsed).toHaveSize(1);
      expect(parsed[0].quantity).toBe(1);
      expect(parsed[0].tags).toEqual([]);
      expect(parsed[0].favorite).toBe(false);
    });

    it('rejects non-backup content', () => {
      expect(() => service.parseJson('{"foo":1}')).toThrow();
      expect(() => service.parseJson('not json')).toThrow();
    });

    it('exports CSV with header and escaped values', () => {
      const csv = service.exportCsv([item({name: 'Milk, 2%', notes: 'has "quotes"'})]);
      const lines = csv.split('\n');

      expect(lines[0]).toContain('name');
      expect(lines[0]).toContain('expireDate');
      expect(lines[1]).toContain('"Milk, 2%"');
      expect(lines[1]).toContain('"has ""quotes"""');
      expect(lines[1]).toContain('"dairy"');
    });
  });

  describe('share on native', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
      service = TestBed.inject(BackupService);
    });

    it('writes a temp file and shares it', async () => {
      const writeSpy = spyOn(FilesystemWeb.prototype, 'writeFile').and.resolveTo({
        uri: 'file:///cache/pantry-backups/backup.json',
      } as never);
      const shareSpy = spyOn(ShareWeb.prototype, 'share').and.resolveTo({} as never);

      await service.share('json', [item()]);

      expect(writeSpy).toHaveBeenCalled();
      expect(shareSpy).toHaveBeenCalledWith(
        jasmine.objectContaining({files: ['file:///cache/pantry-backups/backup.json']}),
      );
    });
  });

  describe('share on web', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(false);
      service = TestBed.inject(BackupService);
    });

    it('downloads the file in the browser', async () => {
      spyOn(URL, 'createObjectURL').and.returnValue('blob:test');
      const revoke = spyOn(URL, 'revokeObjectURL');
      const click = spyOn(HTMLAnchorElement.prototype, 'click');

      await service.share('json', [item()]);

      expect(click).toHaveBeenCalled();
      expect(revoke).toHaveBeenCalledWith('blob:test');
    });
  });

  describe('pickNativeFile', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
      service = TestBed.inject(BackupService);
    });

    it('reads the picked file as text', async () => {
      spyOn(FilePickerWeb.prototype, 'pickFiles').and.resolveTo({
        files: [{path: 'file:///tmp/backup.json'}],
      } as never);
      spyOn(Capacitor, 'convertFileSrc').and.returnValue('capacitor://localhost/_file_/backup.json');
      spyOn(window, 'fetch').and.resolveTo({text: async () => '{"app":"pantry-patrol"}'} as never);

      expect(await service.pickNativeFile()).toBe('{"app":"pantry-patrol"}');
    });

    it('returns an empty string when the picker is cancelled', async () => {
      spyOn(FilePickerWeb.prototype, 'pickFiles').and.resolveTo({files: []} as never);

      expect(await service.pickNativeFile()).toBe('');
    });
  });
});
