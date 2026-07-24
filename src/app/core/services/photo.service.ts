import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Directory, Filesystem } from '@capacitor/filesystem';

/**
 * Captures, persists, and disposes of product photos.
 *
 * On native platforms the photo is saved as a JPEG file in the app's
 * private Documents directory so the pantry JSON stays lean. On web the
 * in-memory base64 data URL is stored directly — good enough for dev
 * mode (lost on page reload, which is acceptable).
 */
@Injectable({ providedIn: 'root' })
export class PhotoService {
  private readonly isNative = Capacitor.isNativePlatform();

  /** Opens the device camera and returns a temporary URI ready for preview. */
  async capturePhoto(): Promise<string | null> {
    return this.pickImage(CameraSource.Camera);
  }

  /** Opens the photo gallery and returns a temporary URI ready for preview. */
  async pickFromGallery(): Promise<string | null> {
    return this.pickImage(CameraSource.Photos);
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

  private async pickImage(source: CameraSource): Promise<string | null> {
    try {
      const photo = await Camera.getPhoto({
        resultType: this.isNative ? CameraResultType.Uri : CameraResultType.DataUrl,
        source,
        quality: 85,
        webUseInput: true,
      });
      return this.isNative ? (photo.path ?? null) : (photo.dataUrl ?? null);
    } catch {
      return null; // user cancelled or permission denied
    }
  }
}
