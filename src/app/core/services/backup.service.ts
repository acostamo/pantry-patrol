import {Injectable} from '@angular/core';
import {Capacitor} from '@capacitor/core';
import {Directory, Filesystem} from '@capacitor/filesystem';
import {Share} from '@capacitor/share';
import {FilePicker} from '@capawesome/capacitor-file-picker';

import {normalizeItem, PantryItem} from '../models/pantry-item.model';

export type BackupFormat = 'json' | 'csv';

const BACKUP_APP = 'pantry-patrol';
const BACKUP_FORMAT = 1;

export interface BackupEnvelope {
  app: 'pantry-patrol';
  format: number;
  exportedAt: string;
  items: PantryItem[];
}

/**
 * Export/import of the pantry inventory as a JSON backup (round-trip safe)
 * or a CSV spreadsheet.
 *
 * On native platforms export shares the file through the OS share sheet and
 * import uses the system file picker; on web (testing only) export triggers a
 * browser download and import is driven by an `<input type="file">` in the
 * caller.
 */
@Injectable({providedIn: 'root'})
export class BackupService {
  readonly isNative = Capacitor.isNativePlatform();

  exportJson(items: PantryItem[]): string {
    const envelope: BackupEnvelope = {
      app: BACKUP_APP,
      format: BACKUP_FORMAT,
      exportedAt: new Date().toISOString(),
      items,
    };
    return JSON.stringify(envelope, null, 2);
  }

  exportCsv(items: PantryItem[]): string {
    const header = [
      'name',
      'barcode',
      'expireDate',
      'quantity',
      'price',
      'favorite',
      'notes',
      'tags',
      'thumbUrl',
      'addedDate',
      'notificationId',
      'id',
    ] as const;
    const escape = (value: unknown): string => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = items.map((item) => header.map((key) => escape(item[key])).join(','));
    return [header.map(escape).join(','), ...rows].join('\n');
  }

  parseJson(text: string): PantryItem[] {
    const parsed = JSON.parse(text) as Partial<BackupEnvelope> | null;
    if (!parsed || parsed.app !== BACKUP_APP || !Array.isArray(parsed.items)) {
      throw new Error('Not a Pantry Patrol backup file');
    }
    return parsed.items.map(normalizeItem);
  }

  async share(format: BackupFormat, items: PantryItem[]): Promise<void> {
    const filename = this.filename(format);
    const data = format === 'json' ? this.exportJson(items) : this.exportCsv(items);
    if (this.isNative) {
      await this.shareFile(filename, data);
    } else {
      this.download(filename, format === 'json' ? 'application/json' : 'text/csv', data);
    }
  }

  /** Opens the native file picker and returns the chosen file's text ('' if cancelled). */
  async pickNativeFile(): Promise<string> {
    const {files} = await FilePicker.pickFiles({types: ['application/json'], limit: 1});
    const file = files[0];
    if (!file?.path) return '';
    const response = await fetch(Capacitor.convertFileSrc(file.path));
    return response.text();
  }

  private async shareFile(filename: string, data: string): Promise<void> {
    const result = await Filesystem.writeFile({
      path: `pantry-backups/${filename}`,
      data,
      directory: Directory.Cache,
      recursive: true,
    });
    await Share.share({files: [result.uri], title: filename, dialogTitle: filename});
  }

  private download(filename: string, mime: string, data: string): void {
    const blob = new Blob([data], {type: mime});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private filename(format: BackupFormat): string {
    const date = new Date().toISOString().slice(0, 10);
    return `pantry-patrol-backup-${date}.${format}`;
  }
}
