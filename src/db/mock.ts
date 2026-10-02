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

const DAY = 24 * 60 * 60 * 1000;

/**
 * Siembra ~1 mes de transacciones variadas para ver gráficas/tendencias.
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

  const spend = async (categoryId: string, cents: number, when: number) => {
    await createTransaction(db, {
      accountId: account.id,
      categoryId,
      kind: 'expense',
      amountCents: Math.max(Math.round(cents), 1),
      occurredOn: when,
    });
  };
  const earn = async (categoryId: string, cents: number, when: number) => {
    await createTransaction(db, {
      accountId: account.id,
      categoryId,
      kind: 'income',
      amountCents: Math.max(Math.round(cents), 1),
      occurredOn: when,
    });
  };

  for (let d = 29; d >= 0; d--) {
    const dayStart = new Date(now.getTime() - d * DAY);
    dayStart.setHours(9 + Math.floor(random() * 10), Math.floor(random() * 60), 0, 0);
    const t = dayStart.getTime();

    // Comida casi a diario
    if (byId.has('cat_food')) {
      await spend('cat_food', 400 + random() * 4000, t);
    }
    // Transporte algunos días
    if (byId.has('cat_transport') && random() > 0.4) {
      await spend('cat_transport', 150 + random() * 1500, t + 3600_000);
    }
    // Ocio / salud / ropa esporádicos
    if (byId.has('cat_fun') && random() > 0.75) {
      await spend('cat_fun', 500 + random() * 5000, t);
    }
    if (byId.has('cat_health') && random() > 0.9) {
      await spend('cat_health', 1000 + random() * 8000, t);
    }
    if (byId.has('cat_clothes') && random() > 0.88) {
      await spend('cat_clothes', 1500 + random() * 6000, t);
    }
    // Servicios y casa según día del mes
    const dom = dayStart.getDate();
    if (dom === 1 && byId.has('cat_home')) {
      await spend('cat_home', 45000, t);
    }
    if (dom === 5 && byId.has('cat_bills')) {
      await spend('cat_bills', 8000 + random() * 4000, t);
    }
    // Salario el día 1
    if (dom === 1 && byId.has('cat_salary')) {
      await earn('cat_salary', 180000, t);
    }
    // Extra puntual
    if (byId.has('cat_extra') && random() > 0.92) {
      await earn('cat_extra', 2000 + random() * 20000, t);
    }
  }
}
