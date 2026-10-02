import type { Database } from '@nozbe/watermelondb';
import { createTransaction } from '../../src/db/operations';
import { getAccountBalance, getPieMonth } from '../../src/db/queries';
import { seedDatabase } from '../../src/db/seed';
import { createTestDatabase } from '../../src/db/testDb';
import type Account from '../../src/db/models/Account';

let db: Database;

beforeEach(async () => {
  db = createTestDatabase();
  await seedDatabase(db);
});

const expense = (overrides = {}) =>
  createTransaction(db, {
    accountId: 'acc_cash',
    categoryId: 'cat_food',
    kind: 'expense',
    amountCents: 1000,
    occurredOn: new Date(2026, 9, 5, 13, 0, 0).getTime(),
    ...overrides,
  });

describe('createTransaction', () => {
  it('signs expenses negative and stamps month/date keys', async () => {
    const tx = await expense({ amountCents: 1050 });
    expect(tx.amountCents).toBe(1050);
    expect(tx.amountSigned).toBe(-1050);
    expect(tx.monthKey).toBe('2026-10');
    expect(tx.dateKey).toBe('2026-10-05');
  });

  it('signs income positive', async () => {
    const tx = await createTransaction(db, {
      accountId: 'acc_cash',
      categoryId: 'cat_salary',
      kind: 'income',
      amountCents: 200000,
    });
    expect(tx.amountSigned).toBe(200000);
  });

  it.each([[0], [-100], [10.5], [NaN]])('rejects amount %p', async amount => {
    await expect(
      createTransaction(db, {
        accountId: 'acc_cash',
        categoryId: 'cat_food',
        kind: 'expense',
        amountCents: amount as number,
      }),
    ).rejects.toThrow();
  });

  it('rejects transfer kind (must use createTransfer)', async () => {
    await expect(
      createTransaction(db, {
        accountId: 'acc_cash',
        categoryId: 'cat_food',
        kind: 'transfer' as never,
        amountCents: 100,
      }),
    ).rejects.toThrow(/createTransfer/);
  });

  it('rejects category kind mismatch', async () => {
    await expect(
      createTransaction(db, {
        accountId: 'acc_cash',
        categoryId: 'cat_salary',
        kind: 'expense',
        amountCents: 100,
      }),
    ).rejects.toThrow(/not expense/);
  });

  it('rejects unknown account', async () => {
    await expect(
      createTransaction(db, {
        accountId: 'nope',
        categoryId: 'cat_food',
        kind: 'expense',
        amountCents: 100,
      }),
    ).rejects.toThrow();
  });

  it('derives balance and monthly pie', async () => {
    await expense({ amountCents: 1000 });
    await expense({ amountCents: 500, categoryId: 'cat_transport' });
    await createTransaction(db, {
      accountId: 'acc_cash',
      categoryId: 'cat_salary',
      kind: 'income',
      amountCents: 5000,
      occurredOn: new Date(2026, 9, 6).getTime(),
    });

    const account = (await db.get<Account>('accounts').find('acc_cash')) as Account;
    await expect(getAccountBalance(db, account)).resolves.toBe(3500);

    const pie = await getPieMonth(db, '2026-10');
    expect(pie).toHaveLength(2);
    expect(pie[0]).toMatchObject({ categoryId: 'cat_food', totalCents: 1000 });
    expect(pie[1]).toMatchObject({ categoryId: 'cat_transport', totalCents: 500 });
  });

  it('writes 1000 transactions in reasonable time (perf smoke)', async () => {
    const start = Date.now();
    for (let i = 0; i < 1000; i++) {
      await expense({ note: `tx-${i}` });
    }
    const elapsed = Date.now() - start;
    // Loki en memoria; en SQLite nativo el presupuesto es p95 <5ms por write.
    expect(elapsed).toBeLessThan(60000);
  }, 90000);
});
