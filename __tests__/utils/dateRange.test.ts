import { describe, expect, it } from '@jest/globals';
import { labelForPeriod, rangeForPeriod, shiftAnchor } from '../../src/utils/dateRange';

// Todas las fechas se construyen en hora local para no depender de la TZ.
const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();
const asDate = (ms: number) => new Date(ms);

describe('rangeForPeriod', () => {
  it('returns null for all-time', () => {
    expect(rangeForPeriod('all', at(2026, 10, 1))).toBeNull();
  });

  it('day spans local midnight to midnight', () => {
    const r = rangeForPeriod('day', at(2026, 10, 1, 15))!;
    expect(asDate(r.from).getHours()).toBe(0);
    expect(asDate(r.from).getDate()).toBe(1);
    expect(r.to - r.from).toBe(24 * 60 * 60 * 1000);
  });

  it('week starts on Monday', () => {
    // 2026-10-01 es jueves -> lunes 2026-09-28
    const r = rangeForPeriod('week', at(2026, 10, 1))!;
    expect(asDate(r.from).getDay()).toBe(1); // lunes
    expect(asDate(r.from).getDate()).toBe(28);
    expect(asDate(r.from).getMonth()).toBe(8); // septiembre (0-index)
  });

  it('month spans the calendar month', () => {
    const r = rangeForPeriod('month', at(2026, 10, 15))!;
    expect(asDate(r.from).getMonth()).toBe(9);
    expect(asDate(r.from).getDate()).toBe(1);
    expect(asDate(r.to).getMonth()).toBe(10); // noviembre
    expect(asDate(r.to).getDate()).toBe(1);
  });

  it('year spans the calendar year', () => {
    const r = rangeForPeriod('year', at(2026, 6, 15))!;
    expect(asDate(r.from).getFullYear()).toBe(2026);
    expect(asDate(r.from).getMonth()).toBe(0);
    expect(asDate(r.to).getFullYear()).toBe(2027);
  });

  it('is inclusive of the start and exclusive of the end', () => {
    const r = rangeForPeriod('day', at(2026, 10, 1))!;
    expect(at(2026, 10, 1, 0) >= r.from).toBe(true);
    expect(at(2026, 10, 1, 23) < r.to).toBe(true);
    expect(at(2026, 10, 2, 0) < r.to).toBe(false);
  });
});

describe('shiftAnchor', () => {
  it('moves month back and forward across year boundaries', () => {
    const jan = at(2026, 1, 15);
    expect(new Date(shiftAnchor('month', jan, -1)).getMonth()).toBe(11); // dic 2025
    expect(new Date(shiftAnchor('month', jan, -1)).getFullYear()).toBe(2025);
    expect(new Date(shiftAnchor('month', jan, 1)).getMonth()).toBe(1); // feb
  });

  it('moves week by 7 days and is a no-op for all', () => {
    const a = at(2026, 10, 1);
    expect(shiftAnchor('week', a, 1) - a).toBe(7 * 24 * 60 * 60 * 1000);
    expect(shiftAnchor('all', a, 1)).toBe(a);
  });
});

describe('labelForPeriod', () => {
  it('labels month, year and all', () => {
    expect(labelForPeriod('month', at(2026, 10, 5))).toMatch(/October 2026/);
    expect(labelForPeriod('year', at(2026, 10, 5))).toBe('2026');
    expect(labelForPeriod('all', at(2026, 10, 5))).toBe('All time');
  });
});
