import {TestBed} from '@angular/core/testing';
import {Capacitor} from '@capacitor/core';
import {CameraWeb} from '@capacitor/camera/dist/esm/web';
import {MediaTypeSelection} from '@capacitor/camera';
import {Directory} from '@capacitor/filesystem';
import {FilesystemWeb} from '@capacitor/filesystem/dist/esm/web';

import {PhotoService} from './photo.service';

describe('PhotoService', () => {
  let service: PhotoService;
  let takePhotoSpy: jasmine.Spy;
  let chooseSpy: jasmine.Spy;

  describe('on web', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(false);
      takePhotoSpy = spyOn(CameraWeb.prototype, 'takePhoto');
      chooseSpy = spyOn(CameraWeb.prototype, 'chooseFromGallery');
      service = TestBed.inject(PhotoService);
    });

    it('captures a data-url photo', async () => {
      takePhotoSpy.and.resolveTo({ webPath: 'data:image/png;base64,x', saved: false } as never);

      const uri = await service.capturePhoto();

      expect(uri).toBe('data:image/png;base64,x');
      expect(takePhotoSpy).toHaveBeenCalledWith({ quality: 85, webUseInput: true });
    });

    it('converts blob web paths into data urls for persistence', async () => {
      takePhotoSpy.and.resolveTo({ webPath: 'blob:http://localhost/abc', saved: false } as never);
      spyOn(window, 'fetch').and.resolveTo({
        blob: async () => new Blob(['x'], { type: 'image/png' }),
      } as never);

      const uri = await service.capturePhoto();

      expect(uri).toMatch(/^data:image\/png;base64,/);
    });

    it('picks from the gallery', async () => {
      chooseSpy.and.resolveTo({
        results: [{ webPath: 'data:image/png;base64,y', saved: false }],
      } as never);

      const uri = await service.pickFromGallery();

      expect(uri).toBe('data:image/png;base64,y');
      expect(chooseSpy).toHaveBeenCalledWith({ mediaType: MediaTypeSelection.Photo });
    });

    it('returns null when the user cancels', async () => {
      takePhotoSpy.and.rejectWith(new Error('cancelled'));

      expect(await service.capturePhoto()).toBeNull();
    });

    it('keeps web temp uris unchanged when saving permanently', async () => {
      const copy = spyOn(FilesystemWeb.prototype, 'copy');

      expect(await service.savePermanent('data:image/png;base64,z', 'id1')).toBe('data:image/png;base64,z');
      expect(copy).not.toHaveBeenCalled();
    });
  });

  describe('on native', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
      takePhotoSpy = spyOn(CameraWeb.prototype, 'takePhoto');
      chooseSpy = spyOn(CameraWeb.prototype, 'chooseFromGallery');
      service = TestBed.inject(PhotoService);
    });

    it('captures a file uri photo', async () => {
      takePhotoSpy.and.resolveTo({ uri: 'file:///tmp/photo.jpg', saved: false } as never);

      const uri = await service.capturePhoto();

      expect(uri).toBe('file:///tmp/photo.jpg');
    });

    it('copies temp uris into app storage', async () => {
      const copySpy = spyOn(FilesystemWeb.prototype, 'copy').and.resolveTo({
        uri: 'file:///documents/pantry-photos/id1.jpg',
      } as never);

      const uri = await service.savePermanent('file:///tmp/photo.jpg', 'id1');

      expect(uri).toBe('file:///documents/pantry-photos/id1.jpg');
      expect(copySpy).toHaveBeenCalledWith({
        from: 'file:///tmp/photo.jpg',
        to: 'pantry-photos/id1.jpg',
        directory: Directory.Documents,
      });
    });

    it('deletes local photo files', async () => {
      const deleteSpy = spyOn(FilesystemWeb.prototype, 'deleteFile').and.resolveTo();

      await service.deleteIfLocal('file:///documents/pantry-photos/id1.jpg');

      expect(deleteSpy).toHaveBeenCalledWith({ path: 'file:///documents/pantry-photos/id1.jpg' });
    });

    it('does not delete http or data uris', async () => {
      const deleteSpy = spyOn(FilesystemWeb.prototype, 'deleteFile');

      await service.deleteIfLocal('https://example.com/pic.jpg');
      await service.deleteIfLocal('data:image/png;base64,x');
      await service.deleteIfLocal('');

      expect(deleteSpy).not.toHaveBeenCalled();
    });

    it('swallows delete failures', async () => {
      const deleteSpy = spyOn(FilesystemWeb.prototype, 'deleteFile').and.rejectWith(new Error('gone'));

      await expectAsync(service.deleteIfLocal('file:///x.jpg')).toBeResolved();
      expect(deleteSpy).toHaveBeenCalled();
    });

    it('converts native file uris for display', () => {
      spyOn(Capacitor, 'convertFileSrc').and.returnValue('capacitor://localhost/_file_/x.jpg');

      expect(service.getDisplayUri('file:///documents/x.jpg')).toBe('capacitor://localhost/_file_/x.jpg');
    });

    it('passes through http and data uris for display', () => {
      expect(service.getDisplayUri('https://example.com/pic.jpg')).toBe('https://example.com/pic.jpg');
      expect(service.getDisplayUri('data:image/png;base64,x')).toBe('data:image/png;base64,x');
      expect(service.getDisplayUri('')).toBe('');
    });
  });
});
