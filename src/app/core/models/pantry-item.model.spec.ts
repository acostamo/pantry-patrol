import {daysUntilExpiry, DEFAULT_QUANTITY, expirationStatus, normalizeItem, PantryItem} from './pantry-item.model';

describe('normalizeItem', () => {
  it('fills defaults for missing fields', () => {
    const item = normalizeItem({ id: 'a', name: 'Milk' });

    expect(item.quantity).toBe(DEFAULT_QUANTITY);
    expect(item.favorite).toBe(false);
    expect(item.notes).toBe('');
    expect(item.tags).toEqual([]);
    expect(item.price).toBe(0);
    expect(item.addedDate).toBeTruthy();
    expect(item.barcode).toBe('');
    expect(item.thumbUrl).toBe('');
    expect(item.notificationId).toBeGreaterThanOrEqual(0);
  });

  it('keeps provided values', () => {
    const addedDate = '2026-01-01T00:00:00.000Z';
    const item = normalizeItem({
      id: 'a',
      name: 'Milk',
      quantity: 3,
      favorite: true,
      notes: 'door shelf',
      tags: ['dairy', 'fresh'],
      price: 1.5,
      addedDate,
    });

    expect(item.quantity).toBe(3);
    expect(item.favorite).toBe(true);
    expect(item.notes).toBe('door shelf');
    expect(item.tags).toEqual(['dairy', 'fresh']);
    expect(item.price).toBe(1.5);
    expect(item.addedDate).toBe(addedDate);
  });

  it('clamps quantity and price to their lower bounds', () => {
    const item = normalizeItem({ id: 'a', quantity: 0, price: -5 });

    expect(item.quantity).toBe(1);
    expect(item.price).toBe(0);
  });

  it('coerces numeric strings and rejects non-array tags', () => {
    const item = normalizeItem({
      id: 'a',
      quantity: '4',
      price: '2.75',
      tags: 'oops',
    } as unknown as Partial<PantryItem>);

    expect(item.quantity).toBe(4);
    expect(item.price).toBe(2.75);
    expect(item.tags).toEqual([]);
  });
});

describe('daysUntilExpiry', () => {
  it('returns negative for a date in the past', () => {
    expect(daysUntilExpiry('2020-01-01T00:00:00.000Z')).toBeLessThan(0);
  });
});

describe('expirationStatus', () => {
  const base = {
    id: 'a',
    barcode: '',
    name: 'Milk',
    thumbUrl: '',
    notificationId: 1,
    quantity: 1,
    addedDate: '2026-01-01T00:00:00.000Z',
    favorite: false,
    notes: '',
    tags: [],
    price: 0,
  };

  it('flags already expired items', () => {
    expect(expirationStatus({ ...base, expireDate: '2020-01-01T00:00:00.000Z' })).toBe('EXPIRED');
  });

  it('flags items expiring within the threshold as impending', () => {
    const soon = new Date(Date.now() + 2 * 86_400_000).toISOString();
    expect(expirationStatus({ ...base, expireDate: soon })).toBe('IMPENDING');
  });

  it('flags far-future items as stable', () => {
    const far = new Date(Date.now() + 30 * 86_400_000).toISOString();
    expect(expirationStatus({ ...base, expireDate: far })).toBe('STABLE');
  });
});
