import type { Database } from '@nozbe/watermelondb';
import {
  createAccount,
  deleteAccount,
  renameAccount,
  setAccountArchived,
} from '../../src/db/accounts';
import { createTransaction } from '../../src/db/operations';
import { seedDatabase } from '../../src/db/seed';
import { createTestDatabase } from '../../src/db/testDb';
import type Account from '../../src/db/models/Account';

let db: Database;

beforeEach(async () => {
  db = createTestDatabase();
  await seedDatabase(db);
});

const accountNames = async () =>
  (await db.get<Account>('accounts').query().fetch()).map(a => a.name).sort();

describe('createAccount (motor Fase 3, UI oculta)', () => {
  it('creates accounts with incremental sort order', async () => {
    const bank = await createAccount(db, { name: 'Bank', icon: '🏦', initialBalanceCents: -500 });
    expect(bank.name).toBe('Bank');
    expect(bank.initialBalance).toBe(-500);
    expect(bank.isArchived).toBe(false);
    expect(bank.sortOrder).toBe(1);
    await expect(accountNames()).resolves.toEqual(['Bank', 'Cash']);
  });

  it('rejects empty names', async () => {
    await expect(createAccount(db, { name: '   ' })).rejects.toThrow(/required/);
  });

  it('rejects non-integer balances', async () => {
    await expect(
      createAccount(db, { name: 'X', initialBalanceCents: 1.5 }),
    ).rejects.toThrow(/integer cents/);
  });
});

describe('renameAccount', () => {
  it('renames and trims', async () => {
    const acc = await renameAccount(db, 'acc_cash', '  Wallet  ');
    expect(acc.name).toBe('Wallet');
  });
});

describe('setAccountArchived', () => {
  it('archives a secondary account', async () => {
    const bank = await createAccount(db, { name: 'Bank' });
    const archived = await setAccountArchived(db, bank.id, true);
    expect(archived.isArchived).toBe(true);
  });

  it('refuses to archive the only active account', async () => {
    await expect(setAccountArchived(db, 'acc_cash', true)).rejects.toThrow(
      /only active account/,
    );
  });
});

describe('deleteAccount', () => {
  it('refuses to delete an account with transactions', async () => {
    await createTransaction(db, {
      accountId: 'acc_cash',
      categoryId: 'cat_food',
      kind: 'expense',
      amountCents: 100,
    });
    await expect(deleteAccount(db, 'acc_cash')).rejects.toThrow(/transactions/);
  });

  it('refuses to delete the last remaining account', async () => {
    await expect(deleteAccount(db, 'acc_cash')).rejects.toThrow(/last account/);
  });

  it('deletes an empty secondary account', async () => {
    const bank = await createAccount(db, { name: 'Bank' });
    await deleteAccount(db, bank.id);
    await expect(accountNames()).resolves.toEqual(['Cash']);
  });
});
