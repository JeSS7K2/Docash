import type { Database } from '@nozbe/watermelondb';
import { getBudgets, removeBudget, setBudget } from '../../src/db/budgets';
import { seedDatabase } from '../../src/db/seed';
import { createTestDatabase } from '../../src/db/testDb';

let db: Database;

beforeEach(async () => {
  db = createTestDatabase();
  await seedDatabase(db);
});

describe('budgets', () => {
  it('upserts a budget per category', async () => {
    await setBudget(db, 'cat_food', 20000);
    await setBudget(db, 'cat_food', 25000);
    const all = await getBudgets(db);
    expect(all).toHaveLength(1);
    expect(all[0].amountCents).toBe(25000);
  });

  it('setting 0 removes the budget', async () => {
    await setBudget(db, 'cat_food', 20000);
    await setBudget(db, 'cat_food', 0);
    await expect(getBudgets(db)).resolves.toHaveLength(0);
  });

  it('rejects negative budgets', async () => {
    await expect(setBudget(db, 'cat_food', -1)).rejects.toThrow();
  });

  it('removeBudget deletes it', async () => {
    await setBudget(db, 'cat_food', 10000);
    await removeBudget(db, 'cat_food');
    await expect(getBudgets(db)).resolves.toHaveLength(0);
  });
});
