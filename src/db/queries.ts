import { Q, type Database } from '@nozbe/watermelondb';
import type { EpochRange } from '../utils/dateRange';
import type Account from './models/Account';
import type Category from './models/Category';
import type Transaction from './models/Transaction';

export interface PieSlice {
  categoryId: string;
  name: string;
  color: string;
  totalCents: number;
}

const txs = (db: Database) => db.get<Transaction>('transactions');

function rangeClauses(range: EpochRange | null): ReturnType<typeof Q.where>[] {
  if (!range) {
    return [];
  }
  return [Q.where('occurred_on', Q.gte(range.from)), Q.where('occurred_on', Q.lt(range.to))];
}

function txQueryInRange(db: Database, range: EpochRange | null, accountId?: string | null) {
  const clauses = rangeClauses(range);
  if (accountId) {
    clauses.push(Q.where('account_id', accountId));
  }
  return txs(db).query(...clauses, Q.sortBy('occurred_on', Q.desc));
}

/** Cuentas visibles ordenadas. Reactivo. */
export function observeAccounts(db: Database) {
  return db
    .get<Account>('accounts')
    .query(Q.where('is_archived', false), Q.sortBy('sort_order', Q.asc))
    .observe();
}

/** Transacciones en un rango [from,to) por occurred_on; null = todas. Reactivo. */
export function observeTransactionsInRange(
  db: Database,
  range: EpochRange | null,
  accountId?: string | null,
) {
  return txQueryInRange(db, range, accountId).observe();
}

/** Misma query que observeTransactionsInRange, one-shot (para listas/export). */
export async function fetchTransactionsInRange(
  db: Database,
  range: EpochRange | null,
  accountId?: string | null,
) {
  return txQueryInRange(db, range, accountId).fetch();
}

/** Gasto de una categoría en un rango [from,to); null = todos los tiempos. */export async function getCategorySpentInRange(
  db: Database,
  categoryId: string,
  range: EpochRange | null,
): Promise<number> {
  const rows = await txs(db)
    .query(
      ...rangeClauses(range),
      Q.where('kind', 'expense'),
      Q.where('category_id', categoryId),
    )
    .fetch();
  return rows.reduce((acc, t) => acc + t.amountCents, 0);
}

/** Fecha (ms) de la transacción más antigua, o null si no hay ninguna. */
export async function getEarliestTransactionDate(db: Database): Promise<number | null> {
  const rows = await txs(db).query(Q.sortBy('occurred_on', Q.asc), Q.take(1)).fetch();
  return rows.length > 0 ? rows[0].occurredOn : null;
}

/**
 * Balance = initial_balance + SUM(amount_signed). One-shot.
 * Fase 4: migrar a SUM SQL crudo si >100k filas por cuenta.
 */
export async function getAccountBalance(db: Database, account: Account): Promise<number> {
  const rows = await txs(db).query(Q.where('account_id', account.id)).fetch();
  let signed = 0;
  for (const t of rows) {
    signed += t.amountSigned;
  }
  return account.initialBalance + signed;
}

async function buildPie(
  db: Database,
  rows: Transaction[],
): Promise<PieSlice[]> {
  const totals = new Map<string, number>();
  for (const t of rows) {
    if (!t.categoryId) {
      continue;
    }
    totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amountCents);
  }
  const slices: PieSlice[] = [];
  for (const [categoryId, totalCents] of totals) {
    let name = categoryId;
    let color = '#BDBDBD';
    try {
      const cat = await db.get<Category>('categories').find(categoryId);
      name = cat.name;
      color = cat.color;
    } catch {
      // Categoría borrada: se conserva el total bajo el id.
    }
    slices.push({ categoryId, name, color, totalCents });
  }
  slices.sort((a, b) => b.totalCents - a.totalCents);
  return slices;
}

/**
 * Agregado de gastos por categoría para el pie mensual. One-shot.
 * Las categorías con >8 slices se agrupan en UI ("Otros").
 */
export async function getPieMonth(
  db: Database,
  monthKey: string,
  accountId?: string | null,
): Promise<PieSlice[]> {
  const clauses: ReturnType<typeof Q.where>[] = [
    Q.where('month_key', monthKey),
    Q.where('kind', 'expense'),
  ];
  if (accountId) {
    clauses.push(Q.where('account_id', accountId));
  }
  return buildPie(db, await txs(db).query(...clauses).fetch());
}

/** Igual que getPieMonth pero por rango [from,to); null = todos los tiempos. */
export async function getPieInRange(
  db: Database,
  range: EpochRange | null,
  accountId?: string | null,
): Promise<PieSlice[]> {
  const clauses: ReturnType<typeof Q.where>[] = [
    ...rangeClauses(range),
    Q.where('kind', 'expense'),
  ];
  if (accountId) {
    clauses.push(Q.where('account_id', accountId));
  }
  return buildPie(db, await txs(db).query(...clauses).fetch());
}
