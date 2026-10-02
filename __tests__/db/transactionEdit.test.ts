import type { Database } from '@nozbe/watermelondb';
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from '../../src/db/operations';
import { seedDatabase } from '../../src/db/seed';
import { createTestDatabase } from '../../src/db/testDb';
import type Transaction from '../../src/db/models/Transaction';

let db: Database;

beforeEach(async () => {
  db = createTestDatabase();
  await seedDatabase(db);
});

const countTx = () => db.get<Transaction>('transactions').query().fetchCount();

describe('updateTransaction / deleteTransaction', () => {
  it('updates amount, category and re-signs on kind change', async () => {
    const tx = await createTransaction(db, {
      accountId: 'acc_cash',
      categoryId: 'cat_food',
      kind: 'expense',
      amountCents: 1000,
    });

    const moved = await updateTransaction(db, tx.id, {
      amountCents: 2000,
      categoryId: 'cat_transport',
    });
    expect(moved.amountCents).toBe(2000);
    expect(moved.amountSigned).toBe(-2000);
    expect(moved.categoryId).toBe('cat_transport');
    expect(moved.kind).toBe('expense');

    const asIncome = await updateTransaction(db, tx.id, { categoryId: 'cat_salary' });
    expect(asIncome.kind).toBe('income');
    expect(asIncome.amountSigned).toBe(2000);
  });

  it('rejects invalid amounts', async () => {
    const tx = await createTransaction(db, {
      accountId: 'acc_cash',
      categoryId: 'cat_food',
      kind: 'expense',
      amountCents: 1000,
    });
    await expect(updateTransaction(db, tx.id, { amountCents: 0 })).rejects.toThrow();
  });

  it('deletes a transaction', async () => {
    const tx = await createTransaction(db, {
      accountId: 'acc_cash',
      categoryId: 'cat_food',
      kind: 'expense',
      amountCents: 1000,
    });
    await deleteTransaction(db, tx.id);
    await expect(countTx()).resolves.toBe(0);
  });
});
