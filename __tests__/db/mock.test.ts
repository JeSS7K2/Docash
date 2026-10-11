import { describe, expect, it } from '@jest/globals';
import { seedDatabase } from '../../src/db/seed';
import { seedMockData } from '../../src/db/mock';
import { createTestDatabase } from '../../src/db/testDb';
import type Transaction from '../../src/db/models/Transaction';

describe('seedMockData', () => {
  it('creates six months of realistic transactions and is idempotent', async () => {
    const db = createTestDatabase();
    await seedDatabase(db);

    await seedMockData(db);
    const first = await db.get<Transaction>('transactions').query().fetch();
    const months = new Set(first.map(transaction => transaction.monthKey));

    expect(months.size).toBe(6);
    expect(first.some(transaction => transaction.kind === 'income')).toBe(true);
    expect(first.some(transaction => transaction.kind === 'expense')).toBe(true);

    await seedMockData(db);
    await expect(db.get<Transaction>('transactions').query().fetchCount()).resolves.toBe(first.length);
  });
});
