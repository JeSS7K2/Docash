import { buildDailyFlow } from '../../src/utils/flow';

describe('buildDailyFlow', () => {
  it('sums income and expense per day inside the range', () => {
    const now = new Date(2026, 9, 18, 12).getTime(); // Oct 18 2026, mediodía local
    const txs = [
      { occurredOn: new Date(2026, 9, 18, 9).getTime(), amountCents: 1000, kind: 'expense' },
      { occurredOn: new Date(2026, 9, 18, 10).getTime(), amountCents: 500, kind: 'expense' },
      { occurredOn: new Date(2026, 9, 18, 11).getTime(), amountCents: 2000, kind: 'income' },
      { occurredOn: new Date(2026, 8, 1, 10).getTime(), amountCents: 9999, kind: 'expense' }, // fuera de 1W
    ];
    const points = buildDailyFlow('1W', txs, 'en', now);
    expect(points).toHaveLength(7);
    const last = points[points.length - 1];
    expect(last.expenseCents).toBe(1500);
    expect(last.incomeCents).toBe(2000);
    expect(points.some(p => p.expenseCents === 9999)).toBe(false);
  });
});
