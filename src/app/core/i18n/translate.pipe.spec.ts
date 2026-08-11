import {TestBed} from '@angular/core/testing';

import {I18nService} from './i18n.service';
import {TranslatePipe} from './translate.pipe';

describe('TranslatePipe', () => {
  let i18n: jasmine.SpyObj<I18nService>;

  beforeEach(() => {
    i18n = jasmine.createSpyObj('I18nService', ['translate']);
    TestBed.configureTestingModule({
      providers: [{ provide: I18nService, useValue: i18n }],
    });
  });

  it('delegates to the i18n service', () => {
    i18n.translate.and.returnValue('Hello');
    const pipe = TestBed.runInInjectionContext(() => new TranslatePipe());

    expect(pipe.transform('home.title')).toBe('Hello');
    expect(i18n.translate).toHaveBeenCalledWith('home.title');
  });

  it('forwards interpolation arguments', () => {
    i18n.translate.and.returnValue('Expires in 3 days');
    const pipe = TestBed.runInInjectionContext(() => new TranslatePipe());

    expect(pipe.transform('expiry.future.plural', '3')).toBe('Expires in 3 days');
    expect(i18n.translate).toHaveBeenCalledWith('expiry.future.plural', '3');
  });
});
