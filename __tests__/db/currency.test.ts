import {
  dateKeyFromEpoch,
  formatCents,
  monthKeyFromEpoch,
  toCents,
} from '../../src/utils/currency';

describe('toCents', () => {
  it.each([
    ['0', 0],
    ['10', 1000],
    ['10.00', 1000],
    ['0.5', 50],
    ['0.05', 5],
    ['$1,234.56', 123456],
    ['  7.2  ', 720],
  ])('parses "%s" as %i cents', (input, expected) => {
    expect(toCents(input)).toBe(expected);
  });

  it.each([[''], ['abc'], ['-5'], ['10.123'], ['1.2.3'], ['9999999999'], ['12a']])(
    'rejects "%s"',
    input => {
      expect(() => toCents(input)).toThrow();
    },
  );
});

describe('formatCents', () => {
  it('formats USD with $ symbol', () => {
    expect(formatCents(1000)).toBe('$10.00');
    expect(formatCents(-550)).toBe('-$5.50');
    expect(formatCents(0)).toBe('$0.00');
  });
});

describe('date keys (local timezone)', () => {
  it('builds month_key and date_key', () => {
    const ms = new Date(2026, 9, 1, 12, 0, 0).getTime();
    expect(monthKeyFromEpoch(ms)).toBe('2026-10');
    expect(dateKeyFromEpoch(ms)).toBe('2026-10-01');
  });
});
