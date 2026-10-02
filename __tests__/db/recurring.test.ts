import type { Database } from '@nozbe/watermelondb';
import {
  createRecurringRule,
  deleteRecurringRule,
  runDueRecurring,
} from '../../src/db/recurring';
import { seedDatabase } from '../../src/db/seed';
import { createTestDatabase } from '../../src/db/testDb';
import type RecurringRule from '../../src/db/models/RecurringRule';
import type Transaction from '../../src/db/models/Transaction';

let db: Database;

beforeEach(async () => {
  db = createTestDatabase();
  await seedDatabase(db);
});

const countTx = () => db.get<Transaction>('transactions').query().fetchCount();
const dayMs = 24 * 60 * 60 * 1000;

describe('recurring engine', () => {
  it('creates catch-up transactions and advances next_run', async () => {
    const now = Date.now();
    await createRecurringRule(db, {
      accountId: 'acc_cash',
      categoryId: 'cat_food',
      kind: 'expense',
      amountCents: 500,
      frequency: 'daily',
      nextRun: now - 3 * dayMs,
    });

    const created = await runDueRecurring(db, now);
    // -3d, -2d, -1d, 0d (<= now) = 4
    expect(created).toBe(4);
    await expect(countTx()).resolves.toBe(4);

    const rule = (await db.get<RecurringRule>('recurring_rules').query().fetch())[0];
    expect(rule.nextRun).toBeGreaterThan(now);
  });

  it('does nothing when no rule is due', async () => {
    await createRecurringRule(db, {
      accountId: 'acc_cash',
      categoryId: 'cat_food',
      kind: 'expense',
      amountCents: 500,
      frequency: 'monthly',
      nextRun: Date.now() + dayMs,
    });
    await expect(runDueRecurring(db)).resolves.toBe(0);
    await expect(countTx()).resolves.toBe(0);
  });

  it('deletes a rule', async () => {
    const rule = await createRecurringRule(db, {
      accountId: 'acc_cash',
      categoryId: 'cat_food',
      kind: 'expense',
      amountCents: 500,
      frequency: 'monthly',
    });
    await deleteRecurringRule(db, rule.id);
    await expect(db.get('recurring_rules').query().fetchCount()).resolves.toBe(0);
  });
});
