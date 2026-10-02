import { Q, type Database } from '@nozbe/watermelondb';
import type Budget from './models/Budget';
import type { BudgetPeriod, IntervalUnit } from '../utils/schedule';

export const DEFAULT_BUDGET_PERIOD: BudgetPeriod = 'monthly';

export async function getBudgets(db: Database): Promise<Budget[]> {
  return db.get<Budget>('budgets').query().fetch();
}

/**
 * Upsert del presupuesto de una categoría. amountCents === 0 lo elimina.
 * `count`+`unit` solo aplican al periodo custom.
 */
export async function setBudget(
  db: Database,
  categoryId: string,
  amountCents: number,
  period: BudgetPeriod = DEFAULT_BUDGET_PERIOD,
  count = 1,
  unit: IntervalUnit = 'day',
): Promise<Budget | null> {
  if (!Number.isInteger(amountCents) || amountCents < 0) {
    throw new Error(`Budget must be a non-negative integer of cents, got: ${amountCents}`);
  }
  if (amountCents === 0) {
    await removeBudget(db, categoryId);
    return null;
  }
  const budgets = db.get<Budget>('budgets');
  const now = Date.now();
  return db.write(async () => {
    const existing = await budgets.query(Q.where('category_id', categoryId)).fetch();
    if (existing[0]) {
      return existing[0].update(b => {
        b.amountCents = amountCents;
        b.period = period;
        b.intervalDays = count;
        b.intervalUnit = unit;
        b.updatedAt = now;
      });
    }
    return budgets.create(b => {
      b.categoryId = categoryId;
      b.amountCents = amountCents;
      b.period = period;
      b.intervalDays = count;
      b.intervalUnit = unit;
      b.createdAt = now;
      b.updatedAt = now;
    });
  });
}

export async function removeBudget(db: Database, categoryId: string): Promise<void> {
  const budgets = db.get<Budget>('budgets');
  await db.write(async () => {
    const existing = await budgets.query(Q.where('category_id', categoryId)).fetch();
    for (const b of existing) {
      await b.destroyPermanently();
    }
  });
}
