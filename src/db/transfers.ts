import { Q, type Database } from '@nozbe/watermelondb';
import { randomId } from '@nozbe/watermelondb/utils/common';
import { dateKeyFromEpoch, monthKeyFromEpoch } from '../utils/currency';
import { validateAmountCents } from './operations';
import type Account from './models/Account';
import type Transaction from './models/Transaction';
import type TransferRecord from './models/TransferRecord';

export interface CreateTransferInput {
  fromAccountId: string;
  toAccountId: string;
  amountCents: number;
  feeCents?: number;
  note?: string;
  occurredOn?: number;
}

export interface TransferResult {
  groupId: string;
  fromTxId: string;
  toTxId: string;
}

/**
 * Transferencia de doble entrada en UN solo writer (atómica): si falla
 * cualquier pata, no persiste nada. La comisión se carga al origen.
 *
 * Motor implementado pero sin UI (flags.TRANSFERS_UI=false). La fila de
 * transfers comparte id con transfer_group_id de ambas patas.
 */
export async function createTransfer(
  db: Database,
  input: CreateTransferInput,
): Promise<TransferResult> {
  const { fromAccountId, toAccountId, amountCents } = input;
  validateAmountCents(amountCents);
  const feeCents = input.feeCents ?? 0;
  if (!Number.isInteger(feeCents) || feeCents < 0) {
    throw new Error(`Fee must be a non-negative integer of cents, got: ${feeCents}`);
  }
  if (!fromAccountId || !toAccountId) {
    throw new Error('fromAccountId and toAccountId are required');
  }
  if (fromAccountId === toAccountId) {
    throw new Error('Cannot transfer within the same account');
  }
  const note = (input.note ?? '').trim();
  const occurredOn = input.occurredOn ?? Date.now();
  const monthKey = monthKeyFromEpoch(occurredOn);
  const dateKey = dateKeyFromEpoch(occurredOn);
  const now = Date.now();

  const txs = db.get<Transaction>('transactions');
  const records = db.get<TransferRecord>('transfers');
  const accounts = db.get<Account>('accounts');

  const buildLeg = (
    prep: Transaction,
    opts: { accountId: string; signed: number; groupId: string },
  ) => {
    prep.accountId = opts.accountId;
    prep.kind = 'transfer';
    prep.amountCents = amountCents;
    prep.amountSigned = opts.signed;
    prep.note = note;
    prep.occurredOn = occurredOn;
    prep.monthKey = monthKey;
    prep.dateKey = dateKey;
    prep.transferGroupId = opts.groupId;
    prep.createdAt = now;
    prep.updatedAt = now;
  };

  return db.write(async () => {
    // Las cuentas se verifican dentro del writer para que la transferencia
    // sea atómica también frente a borrados concurrentes.
    const fromAccount = await accounts.find(fromAccountId);
    const toAccount = await accounts.find(toAccountId);

    // groupId pre-generado con el mismo alfabeto que los ids Watermelon.
    // Todas las mutaciones ocurren DENTRO de los callbacks prepareCreate
    // (Watermelon prohíbe mutar fuera de create/update).
    const groupId = randomId();
    const fromPrep = txs.prepareCreate(t =>
      buildLeg(t, { accountId: fromAccount.id, signed: -(amountCents + feeCents), groupId }),
    );
    const toPrep = txs.prepareCreate(t =>
      buildLeg(t, { accountId: toAccount.id, signed: amountCents, groupId }),
    );
    const recordPrep = records.prepareCreate(r => {
      r.fromTxId = fromPrep.id;
      r.toTxId = toPrep.id;
      r.fromAccountId = fromAccount.id;
      r.toAccountId = toAccount.id;
      r.amountCents = amountCents;
      r.feeCents = feeCents;
      // Mutación directa de _raw (bypass del guard create/update), válida
      // dentro del callback de preparación — mismo patrón que seed.ts.
      (r as unknown as { _raw: { id: string } })._raw.id = groupId;
    });

    await db.batch([fromPrep, toPrep, recordPrep]);
    return { groupId, fromTxId: fromPrep.id, toTxId: toPrep.id };
  });
}

/**
 * Revierte una transferencia por su groupId: ambas patas se marcan como
 * borradas (soft delete, excluidas de queries/balances) y se destruye la fila
 * de pareo. Atómico en un solo writer.
 */
export async function deleteTransfer(db: Database, groupId: string): Promise<void> {
  const txs = db.get<Transaction>('transactions');
  const records = db.get<TransferRecord>('transfers');
  await db.write(async () => {
    const record = await records.find(groupId);
    const legs = await txs.query(Q.where('transfer_group_id', groupId)).fetch();
    await db.batch([
      ...legs.map(leg => leg.prepareMarkAsDeleted()),
      record.prepareDestroyPermanently(),
    ]);
  });
}
