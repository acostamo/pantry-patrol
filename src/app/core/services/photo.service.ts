import {Injectable} from '@angular/core';
import {Capacitor} from '@capacitor/core';
import type {MediaResult} from '@capacitor/camera';
import {Camera, MediaTypeSelection} from '@capacitor/camera';
import {Directory, Filesystem} from '@capacitor/filesystem';

/**
 * Captures, persists, and disposes of product photos.
 *
 * On native platforms the photo is saved as a JPEG file in the app's
 * private Documents directory so the pantry JSON stays lean. On web the
 * image is stored as a data URL directly — good enough for dev mode
 * (lost on page reload, which is acceptable).
 */
@Injectable({ providedIn: 'root' })
export class PhotoService {
  private readonly isNative = Capacitor.isNativePlatform();

  /** Opens the device camera and returns a temporary URI ready for preview. */
  async capturePhoto(): Promise<string | null> {
    return this.pickMedia(() => Camera.takePhoto({ quality: 85, webUseInput: true }));
  }

  /** Opens the photo gallery and returns a temporary URI ready for preview. */
  async pickFromGallery(): Promise<string | null> {
    return this.pickMedia(async () =>
      (await Camera.chooseFromGallery({ mediaType: MediaTypeSelection.Photo })).results[0],
    );
  }

  /**
   * Copies a temporary photo to app-owned permanent storage.
   * On web the temp URI is already a data-url — returned unchanged.
   */
  async savePermanent(tempUri: string, itemId: string): Promise<string> {
    if (!this.isNative) return tempUri;
    const fileName = `pantry-photos/${itemId}.jpg`;
    const result = await Filesystem.copy({
      from: tempUri,
      to: fileName,
      directory: Directory.Documents,
    });
    return result.uri;
  }

  /** Deletes a locally-owned photo file. Safe to call with http/data URIs or empty strings. */
  async deleteIfLocal(thumbUrl: string): Promise<void> {
    if (!thumbUrl || thumbUrl.startsWith('http') || thumbUrl.startsWith('data:')) return;
    try {
      await Filesystem.deleteFile({ path: thumbUrl });
    } catch {
      // already gone — no-op
    }
  }

  /** Converts a stored thumb URL into something an <img> tag can display in the WebView. */
  getDisplayUri(thumbUrl: string): string {
    if (!thumbUrl) return '';
    if (thumbUrl.startsWith('http') || thumbUrl.startsWith('data:')) return thumbUrl;
    return Capacitor.convertFileSrc(thumbUrl);
  }

  private async pickMedia(call: () => Promise<MediaResult | undefined>): Promise<string | null> {
    try {
      const media = await call();
      if (!media) return null;
      if (this.isNative) return media.uri ?? null;
      return media.webPath ? await this.toPersistableDataUrl(media.webPath) : null;
    } catch {
      return null; // user cancelled or permission denied
    }
  }

  /**
   * On web the new Camera API hands back a blob URL for large images.
   * Converting to a data URL keeps the preview working after a page reload.
   */
  private async toPersistableDataUrl(webPath: string): Promise<string> {
    if (webPath.startsWith('data:')) return webPath;
    const blob = await (await fetch(webPath)).blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error(reader.error?.message ?? 'Failed to read image data'));
      reader.readAsDataURL(blob);
    });
  }
}
