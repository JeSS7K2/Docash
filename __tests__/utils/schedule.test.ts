import { describe, expect, it } from '@jest/globals';
import { advanceSchedule, budgetWindow, isoWeekday } from '../../src/utils/schedule';

const at = (y: number, m: number, d: number, h = 12, min = 0) =>
  new Date(y, m - 1, d, h, min).getTime();
const asDate = (ms: number) => new Date(ms);

describe('advanceSchedule', () => {
  it('daily moves one day keeping the time', () => {
    const next = asDate(advanceSchedule({ frequency: 'daily' }, at(2026, 10, 15, 9, 30)));
    expect(next.getDate()).toBe(16);
    expect(next.getHours()).toBe(9);
    expect(next.getMinutes()).toBe(30);
  });

  it('weekly lands on the requested ISO weekday (1=Mon)', () => {
    const next = asDate(advanceSchedule({ frequency: 'weekly', day: 1 }, at(2026, 10, 1)));
    expect(isoWeekday(next)).toBe(1);
    expect(next.getDate()).toBe(5);
  });

  it('weekly goes to next week when the day matches', () => {
    const next = asDate(advanceSchedule({ frequency: 'weekly', day: 4 }, at(2026, 10, 1)));
    expect(next.getDate()).toBe(8);
  });

  it('monthly takes this month if the day is ahead', () => {
    const next = asDate(advanceSchedule({ frequency: 'monthly', day: 15 }, at(2026, 10, 10)));
    expect(next.getMonth()).toBe(9);
    expect(next.getDate()).toBe(15);
  });

  it('monthly rolls over when the day already passed', () => {
    const next = asDate(advanceSchedule({ frequency: 'monthly', day: 15 }, at(2026, 10, 20)));
    expect(next.getMonth()).toBe(10);
    expect(next.getDate()).toBe(15);
  });

  it('monthly clamps to the last day of short months', () => {
    const next = asDate(advanceSchedule({ frequency: 'monthly', day: 31 }, at(2026, 2, 1)));
    expect(next.getMonth()).toBe(1);
    expect(next.getDate()).toBe(28);
  });

  it('custom advances N days/weeks/months', () => {
    expect(
      asDate(advanceSchedule({ frequency: 'custom', count: 10, unit: 'day' }, at(2026, 10, 1))).getDate(),
    ).toBe(11);
    expect(
      asDate(advanceSchedule({ frequency: 'custom', count: 2, unit: 'week' }, at(2026, 10, 1))).getDate(),
    ).toBe(15);
    expect(
      asDate(advanceSchedule({ frequency: 'custom', count: 3, unit: 'month' }, at(2026, 10, 1))).getMonth(),
    ).toBe(0); // enero (0-index) del año siguiente
  });
});

describe('budgetWindow', () => {
  it('daily spans the day', () => {
    const w = budgetWindow('daily', 0, 'day', at(2026, 10, 15, 18));
    expect(asDate(w.from).getHours()).toBe(0);
    expect(asDate(w.from).getDate()).toBe(15);
    expect(w.to - w.from).toBe(24 * 60 * 60 * 1000);
  });

  it('weekly starts on Monday', () => {
    const w = budgetWindow('weekly', 0, 'day', at(2026, 10, 1));
    expect(isoWeekday(asDate(w.from))).toBe(1);
    expect(asDate(w.from).getDate()).toBe(28);
  });

  it('monthly spans the calendar month', () => {
    const w = budgetWindow('monthly', 0, 'day', at(2026, 10, 15));
    expect(asDate(w.from).getMonth()).toBe(9);
    expect(asDate(w.to).getMonth()).toBe(10);
  });

  it('custom covers the last N days including today', () => {
    const w = budgetWindow('custom', 7, 'day', at(2026, 10, 15, 18));
    expect(asDate(w.from).getDate()).toBe(9);
    expect(asDate(w.to).getDate()).toBe(16);
    expect(asDate(w.to).getHours()).toBe(0);
  });

  it('custom supports weeks and months', () => {
    const weeks = budgetWindow('custom', 2, 'week', at(2026, 10, 15));
    expect(asDate(weeks.from).getDate()).toBe(2); // 14 días atrás
    const months = budgetWindow('custom', 3, 'month', at(2026, 10, 15));
    expect(asDate(months.from).getMonth()).toBe(7); // agosto
  });
});
