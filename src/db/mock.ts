import type { Database } from '@nozbe/watermelondb';
import { createTransaction } from './operations';
import type Account from './models/Account';
import type Category from './models/Category';

// Generador pseudoaleatorio determinista (LCG) para datos de ejemplo estables.
function rng(seed: number) {
  /* eslint-disable no-bitwise */
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  /* eslint-enable no-bitwise */
}

/**
 * Siembra 6 meses de transacciones variadas para ver gráficas/tendencias.
 * Solo actúa si no hay ninguna transacción. Se controla con flags.MOCK_DATA.
 */
export async function seedMockData(db: Database): Promise<void> {
  const existing = await db.get('transactions').query().fetchCount();
  if (existing > 0) {
    return;
  }
  const accounts = await db.get<Account>('accounts').query().fetch();
  const account = accounts[0];
  if (!account) {
    return;
  }
  const cats = await db.get<Category>('categories').query().fetch();
  const byId = new Map(cats.map(c => [c.id, c]));
  const random = rng(20261001);
  const now = new Date();
  now.setHours(20, 0, 0, 0);

  const spend = async (categoryId: string, cents: number, when: number, note = '') => {
    await createTransaction(db, {
      accountId: account.id,
      categoryId,
      kind: 'expense',
      amountCents: Math.max(Math.round(cents), 1),
      occurredOn: when,
      note,
    });
  };
  const earn = async (categoryId: string, cents: number, when: number, note = '') => {
    await createTransaction(db, {
      accountId: account.id,
      categoryId,
      kind: 'income',
      amountCents: Math.max(Math.round(cents), 1),
      occurredOn: when,
      note,
    });
  };

  const timeForDay = (monthStart: Date, day: number, hour: number) => {
    const date = new Date(monthStart);
    date.setDate(day);
    date.setHours(hour, Math.floor(random() * 60), 0, 0);
    return date.getTime() <= now.getTime() ? date.getTime() : null;
  };

  for (let monthOffset = 5; monthOffset >= 0; monthOffset -= 1) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1, 8, 0, 0, 0);

    const salaryAt = timeForDay(monthStart, 1, 8);
    if (byId.has('cat_salary') && salaryAt !== null) {
      await earn('cat_salary', 180000, salaryAt, 'Salary');
    }
    const rentAt = timeForDay(monthStart, 2, 8);
    if (byId.has('cat_home') && rentAt !== null) {
      await spend('cat_home', 55000, rentAt, 'Rent');
    }
    const billsAt = timeForDay(monthStart, 5, 8);
    if (byId.has('cat_bills') && billsAt !== null) {
      await spend('cat_bills', 10000 + random() * 3000, billsAt, 'Utilities');
    }
    const extraAt = timeForDay(monthStart, 14, 8);
    if (byId.has('cat_extra') && extraAt !== null && random() > 0.45) {
      await earn('cat_extra', 12000 + random() * 18000, extraAt, 'Side income');
    }

    const lastDay = monthOffset === 0 ? Math.min(now.getDate(), 27) : 27;
    for (let day = 3; day <= lastDay; day += 2) {
      const dayStart = new Date(monthStart);
      dayStart.setDate(day);
      dayStart.setHours(9 + Math.floor(random() * 10), Math.floor(random() * 60), 0, 0);
      const t = dayStart.getTime();

      if (byId.has('cat_food')) {
        await spend('cat_food', 900 + random() * 2800, t, 'Groceries');
      }
      if (byId.has('cat_transport') && random() > 0.3) {
        await spend('cat_transport', 350 + random() * 1100, t + 3600_000, 'Transport');
      }
      if (byId.has('cat_fun') && random() > 0.78) {
        await spend('cat_fun', 1200 + random() * 4200, t, 'Leisure');
      }
      if (byId.has('cat_health') && random() > 0.9) {
        await spend('cat_health', 1800 + random() * 7000, t, 'Pharmacy');
      }
      if (byId.has('cat_clothes') && random() > 0.93) {
        await spend('cat_clothes', 2500 + random() * 7500, t, 'Clothes');
      }
      if (byId.has('cat_edu') && random() > 0.94) {
        await spend('cat_edu', 1500 + random() * 5000, t, 'Learning');
      }
    }
  }
}
