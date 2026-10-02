import { Q, type Database } from '@nozbe/watermelondb';
import { BASE_CURRENCY } from '../utils/currency';
import type Account from './models/Account';
import type Transaction from './models/Transaction';

export const MAX_ACCOUNT_NAME_LENGTH = 40;

export interface CreateAccountInput {
  name: string;
  icon?: string;
  currency?: string;
  /** Puede ser negativo (deuda inicial). */
  initialBalanceCents?: number;
  sortOrder?: number;
}

function cleanName(name: string): string {
  const trimmed = (name ?? '').trim();
  if (!trimmed) {
    throw new Error('Account name is required');
  }
  if (trimmed.length > MAX_ACCOUNT_NAME_LENGTH) {
    throw new Error(`Account name exceeds ${MAX_ACCOUNT_NAME_LENGTH} chars`);
  }
  return trimmed;
}

function validateBalance(cents: number): void {
  if (!Number.isInteger(cents)) {
    throw new Error(`Initial balance must be integer cents, got: ${cents}`);
  }
}

const accountsOf = (db: Database) => db.get<Account>('accounts');

/**
 * Crea una cuenta (banco, efectivo, etc). Motor de Fase 3 sin UI
 * (flags.ACCOUNTS_UI=false).
 */
export async function createAccount(
  db: Database,
  input: CreateAccountInput,
): Promise<Account> {
  const name = cleanName(input.name);
  const initialBalance = input.initialBalanceCents ?? 0;
  validateBalance(initialBalance);
  const now = Date.now();

  return db.write(async () => {
    const count = await accountsOf(db).query().fetchCount();
    return accountsOf(db).create(a => {
      a.name = name;
      a.icon = input.icon ?? '💳';
      a.currency = input.currency ?? BASE_CURRENCY;
      a.initialBalance = initialBalance;
      a.isArchived = false;
      a.sortOrder = input.sortOrder ?? count;
      a.createdAt = now;
      a.updatedAt = now;
    });
  });
}

export async function renameAccount(
  db: Database,
  accountId: string,
  name: string,
): Promise<Account> {
  const next = cleanName(name);
  return db.write(async () => {
    const account = await accountsOf(db).find(accountId);
    return account.update(a => {
      a.name = next;
      a.updatedAt = Date.now();
    });
  });
}

/** Archivar la única cuenta activa dejaría la app sin cuenta: se rechaza. */
export async function setAccountArchived(
  db: Database,
  accountId: string,
  archived: boolean,
): Promise<Account> {
  return db.write(async () => {
    const accounts = accountsOf(db);
    const account = await accounts.find(accountId);
    if (archived && !account.isArchived) {
      const activeCount = await accounts
        .query(Q.where('is_archived', false))
        .fetchCount();
      if (activeCount <= 1) {
        throw new Error('Cannot archive the only active account');
      }
    }
    return account.update(a => {
      a.isArchived = archived;
      a.updatedAt = Date.now();
    });
  });
}

/**
 * Borrado físico. Se rechaza si la cuenta tiene transacciones (evita huérfanos)
 * o si es la última cuenta existente.
 */
export async function deleteAccount(db: Database, accountId: string): Promise<void> {
  const txCount = await db
    .get<Transaction>('transactions')
    .query(Q.where('account_id', accountId))
    .fetchCount();
  if (txCount > 0) {
    throw new Error(`Cannot delete account with ${txCount} transactions`);
  }
  const total = await accountsOf(db).query().fetchCount();
  if (total <= 1) {
    throw new Error('Cannot delete the last account');
  }
  await db.write(async () => {
    const account = await accountsOf(db).find(accountId);
    await account.destroyPermanently();
  });
}
