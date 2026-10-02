import type { Database } from '@nozbe/watermelondb';
import { dateKeyFromEpoch, monthKeyFromEpoch } from '../utils/currency';
import type Account from './models/Account';
import type Category from './models/Category';
import type Transaction from './models/Transaction';

export type EntryKind = 'expense' | 'income';

// 999,999,999.99 USD en céntimos (límite de 9 dígitos enteros del numpad).
export const MAX_AMOUNT_CENTS = 99999999999;
export const MAX_NOTE_LENGTH = 280;

export interface CreateTransactionInput {
  accountId: string;
  categoryId: string;
  kind: EntryKind;
  amountCents: number;
  note?: string;
  occurredOn?: number;
}

export function validateAmountCents(amountCents: number): void {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error(`Amount must be a positive integer of cents, got: ${amountCents}`);
  }
  if (amountCents > MAX_AMOUNT_CENTS) {
    throw new Error(`Amount exceeds maximum: ${amountCents}`);
  }
}

/**
 * Crea un gasto/ingreso en UN writer atómico. Presupuesto p95 <5ms.
 * kind='transfer' rechazado aquí: usar createTransfer (doble entrada).
 */
export async function createTransaction(
  db: Database,
  input: CreateTransactionInput,
): Promise<Transaction> {
  const { accountId, categoryId, kind, amountCents } = input;
  if (kind !== 'expense' && kind !== 'income') {
    throw new Error(`Use createTransfer for kind "${kind}"`);
  }
  validateAmountCents(amountCents);
  if (!accountId) {
    throw new Error('accountId is required');
  }
  if (!categoryId) {
    throw new Error('categoryId is required');
  }
  const note = (input.note ?? '').trim();
  if (note.length > MAX_NOTE_LENGTH) {
    throw new Error(`Note exceeds ${MAX_NOTE_LENGTH} chars`);
  }
  const occurredOn = input.occurredOn ?? Date.now();

  // Lecturas de integridad (~1ms c/u con índice por id). Fuera del writer
  // para no retener el lock de escritura.
  const account = await db.get<Account>('accounts').find(accountId);
  const category = await db.get<Category>('categories').find(categoryId);
  if (category.kind !== kind) {
    throw new Error(`Category "${categoryId}" is ${category.kind}, not ${kind}`);
  }

  const signed = kind === 'expense' ? -amountCents : amountCents;
  const now = Date.now();

  return db.write(() =>
    db.get<Transaction>('transactions').create(t => {
      t.accountId = account.id;
      t.categoryId = category.id;
      t.kind = kind;
      t.amountCents = amountCents;
      t.amountSigned = signed;
      t.note = note;
      t.occurredOn = occurredOn;
      t.monthKey = monthKeyFromEpoch(occurredOn);
      t.dateKey = dateKeyFromEpoch(occurredOn);
      t.createdAt = now;
      t.updatedAt = now;
    }),
  );
}

export interface UpdateTransactionInput {
  amountCents?: number;
  categoryId?: string;
  note?: string;
  occurredOn?: number;
}

/**
 * Edita un gasto/ingreso. El signed y la kind se recalculan desde la
 * categoría final, de modo que cambiar de categoría gasto<->ingreso es seguro.
 * Las patas de transferencia no se editan aquí.
 */
export async function updateTransaction(
  db: Database,
  txId: string,
  input: UpdateTransactionInput,
): Promise<Transaction> {
  if (input.amountCents !== undefined) {
    validateAmountCents(input.amountCents);
  }
  const note = input.note !== undefined ? input.note.trim() : undefined;
  if (note !== undefined && note.length > MAX_NOTE_LENGTH) {
    throw new Error(`Note exceeds ${MAX_NOTE_LENGTH} chars`);
  }
  const category = input.categoryId
    ? await db.get<Category>('categories').find(input.categoryId)
    : null;
  const now = Date.now();

  return db.write(async () => {
    const tx = await db.get<Transaction>('transactions').find(txId);
    if (tx.kind === 'transfer') {
      throw new Error('Cannot edit a transfer leg');
    }
    return tx.update(t => {
      if (input.amountCents !== undefined) {
        t.amountCents = input.amountCents;
      }
      if (category) {
        t.categoryId = category.id;
        t.kind = category.kind;
      }
      t.amountSigned = t.kind === 'expense' ? -t.amountCents : t.amountCents;
      if (note !== undefined) {
        t.note = note;
      }
      if (input.occurredOn !== undefined) {
        t.occurredOn = input.occurredOn;
        t.monthKey = monthKeyFromEpoch(input.occurredOn);
        t.dateKey = dateKeyFromEpoch(input.occurredOn);
      }
      t.updatedAt = now;
    });
  });
}

export async function deleteTransaction(db: Database, txId: string): Promise<void> {
  await db.write(async () => {
    const tx = await db.get<Transaction>('transactions').find(txId);
    await tx.destroyPermanently();
  });
}
