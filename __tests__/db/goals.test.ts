import { createTestDatabase } from '../../src/db/testDb';
import { seedDatabase } from '../../src/db/seed';
import { createGoal, getGoalProgressCents } from '../../src/db/goals';
import { createTransaction } from '../../src/db/operations';

const DAY = 24 * 60 * 60 * 1000;

describe('goal progress', () => {
  it('counts the whole balance only when includeBalance is on', async () => {
    const db = createTestDatabase();
    await seedDatabase(db);

    // Ingreso previo a la creación del objetivo (saldo ya existente).
    await createTransaction(db, {
      accountId: 'acc_cash',
      categoryId: 'cat_salary',
      kind: 'income',
      amountCents: 50000,
      occurredOn: Date.now() - 7 * DAY,
    });

    const plain = await createGoal(db, { name: 'Plain', targetCents: 100000 });
    const counting = await createGoal(db, {
      name: 'Counting',
      targetCents: 100000,
      includeBalance: true,
    });

    expect(await getGoalProgressCents(db, plain)).toBe(0);
    expect(await getGoalProgressCents(db, counting)).toBe(50000);
  });
});
