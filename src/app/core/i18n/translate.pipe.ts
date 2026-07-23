import { inject, Pipe, PipeTransform } from '@angular/core';

import { I18nService } from './i18n.service';

/**
 * Impure pipe so it re-runs on every change detection cycle — necessary
 * because the pipe's input (the translation key) stays the same when only
 * the language changes.
 */
@Pipe({ name: 'translate', standalone: true, pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(key: string, ...args: string[]): string {
    return this.i18n.translate(key, ...args);
  }
}
