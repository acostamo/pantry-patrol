import {TestBed} from '@angular/core/testing';
import {NetworkWeb} from '@capacitor/network/dist/esm/web';

import {I18nService} from '../i18n/i18n.service';
import {ProductResolverService} from './product-resolver.service';

describe('ProductResolverService', () => {
  let service: ProductResolverService;
  let i18n: jasmine.SpyObj<I18nService>;
  let networkStatus: jasmine.Spy;

  beforeEach(() => {
    networkStatus = spyOn(NetworkWeb.prototype, 'getStatus').and.resolveTo({
      connected: true,
      connectionType: 'wifi',
    });
    i18n = jasmine.createSpyObj('I18nService', ['translate']);
    i18n.translate.and.callFake((key: string, ...args: string[]) => `${key}:${args.join(',')}`);
    TestBed.configureTestingModule({
      providers: [{ provide: I18nService, useValue: i18n }],
    });
    service = TestBed.inject(ProductResolverService);
  });

  const mockFetchResponse = (payload: unknown) =>
    spyOn(window, 'fetch').and.resolveTo({ json: async () => payload } as never);

  it('returns a cached placeholder when offline', async () => {
    networkStatus.and.resolveTo({ connected: false, connectionType: 'none' });

    const result = await service.resolveBarcode('5901234123457');

    expect(result).toEqual({ name: 'product.cached:5901234123457', thumbUrl: '' });
  });

  it('resolves a known product', async () => {
    const fetchSpy = mockFetchResponse({
      status: 1,
      product: { product_name: 'Milk 1L', image_thumb_url: 'http://img' },
    });

    const result = await service.resolveBarcode('5901234123457');

    expect(result).toEqual({ name: 'Milk 1L', thumbUrl: 'http://img' });
    expect(fetchSpy).toHaveBeenCalledWith('https://world.openfoodfacts.org/api/v2/product/5901234123457.json');
  });

  it('falls back when the product is unknown', async () => {
    mockFetchResponse({ status: 0 });

    const result = await service.resolveBarcode('1');

    expect(result).toEqual({ name: 'product.manual:', thumbUrl: '' });
  });

  it('falls back when the lookup fails', async () => {
    spyOn(window, 'fetch').and.rejectWith(new Error('boom'));

    const result = await service.resolveBarcode('1');

    expect(result).toEqual({ name: 'product.manual:', thumbUrl: '' });
  });
});
