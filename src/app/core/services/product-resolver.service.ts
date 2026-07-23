import { Injectable, inject } from '@angular/core';
import { Network } from '@capacitor/network';

import { I18nService } from '../i18n/i18n.service';

export interface ResolvedProduct {
  name: string;
  thumbUrl: string;
}

/**
 * Resolves barcodes against the Open Food Facts public REST API.
 *
 * This is the app's only network call and it is strictly optional: when the
 * device is offline (or the product is unknown), a placeholder is returned and
 * the user can simply type the name by hand. The pantry itself never leaves
 * the device.
 */
@Injectable({ providedIn: 'root' })
export class ProductResolverService {
  private readonly i18n = inject(I18nService);
  private readonly baseUri = 'https://world.openfoodfacts.org/api/v2/product';

  async resolveBarcode(barcode: string): Promise<ResolvedProduct> {
    const { connected } = await Network.getStatus();
    if (!connected) {
      return { name: this.i18n.translate('product.cached', barcode), thumbUrl: '' };
    }

    try {
      const response = await fetch(`${this.baseUri}/${barcode}.json`);
      const payload = await response.json();
      if (payload.status === 1) {
        return {
          name: payload.product.product_name || this.i18n.translate('product.unidentified'),
          thumbUrl: payload.product.image_thumb_url || '',
        };
      }
    } catch (err) {
      console.error('System failed network mapping processing:', err);
    }

    return { name: this.i18n.translate('product.manual'), thumbUrl: '' };
  }
}
