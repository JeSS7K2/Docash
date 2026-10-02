import type { Database } from '@nozbe/watermelondb';
import { getAccountBalance } from '../../src/db/queries';
import { seedDatabase } from '../../src/db/seed';
import { createTestDatabase } from '../../src/db/testDb';
import { createTransfer, deleteTransfer } from '../../src/db/transfers';
import type Account from '../../src/db/models/Account';
import type Transaction from '../../src/db/models/Transaction';

let db: Database;

async function seedSecondAccount(): Promise<void> {
  const now = Date.now();
  await db.write(() =>
    db.get<Account>('accounts').create(a => {
      (a as unknown as { _raw: { id: string } })._raw.id = 'acc_bank';
      a.name = 'Bank';
      a.icon = '🏦';
      a.currency = 'USD';
      a.initialBalance = 0;
      a.isArchived = false;
      a.sortOrder = 1;
      a.createdAt = now;
      a.updatedAt = now;
    }),
  );
}

beforeEach(async () => {
  db = createTestDatabase();
  await seedDatabase(db);
  await seedSecondAccount();
});

const countTx = () => db.get<Transaction>('transactions').query().fetchCount();

describe('createTransfer (motor oculto, sin UI)', () => {
  it('creates two linked legs plus record, atomically', async () => {
    const res = await createTransfer(db, {
      fromAccountId: 'acc_cash',
      toAccountId: 'acc_bank',
      amountCents: 5000,
    });

    expect(res.groupId).toBeTruthy();
    expect(res.fromTxId).toBeTruthy();
    expect(res.toTxId).toBeTruthy();
    expect(res.fromTxId).not.toBe(res.toTxId);
    const legs = (await db
      .get<Transaction>('transactions')
      .query()
      .fetch()) as Transaction[];
    expect(legs).toHaveLength(2);
    expect(legs.map(l => l.transferGroupId)).toEqual([res.groupId, res.groupId]);

    const from = legs.find(l => l.id === res.fromTxId)!;
    const to = legs.find(l => l.id === res.toTxId)!;
    expect(from.amountSigned).toBe(-5000);
    expect(to.amountSigned).toBe(5000);

    const records = await db.get('transfers').query().fetch();
    expect(records).toHaveLength(1);
    expect(records[0].id).toBe(res.groupId);

    const cash = (await db.get<Account>('accounts').find('acc_cash')) as Account;
    const bank = (await db.get<Account>('accounts').find('acc_bank')) as Account;
    await expect(getAccountBalance(db, cash)).resolves.toBe(-5000);
    await expect(getAccountBalance(db, bank)).resolves.toBe(5000);
  });

  it('charges the fee to the source account', async () => {
    await createTransfer(db, {
      fromAccountId: 'acc_cash',
      toAccountId: 'acc_bank',
      amountCents: 5000,
      feeCents: 100,
    });
    const cash = (await db.get<Account>('accounts').find('acc_cash')) as Account;
    const bank = (await db.get<Account>('accounts').find('acc_bank')) as Account;
    await expect(getAccountBalance(db, cash)).resolves.toBe(-5100);
    await expect(getAccountBalance(db, bank)).resolves.toBe(5000);
  });

  it('rejects same-account transfer without writing anything', async () => {
    const before = await countTx();
    await expect(
      createTransfer(db, {
        fromAccountId: 'acc_cash',
        toAccountId: 'acc_cash',
        amountCents: 100,
      }),
    ).rejects.toThrow(/same account/);
    await expect(countTx()).resolves.toBe(before);
  });

  it('rejects unknown accounts without writing anything', async () => {
    const before = await countTx();
    await expect(
      createTransfer(db, {
        fromAccountId: 'acc_cash',
        toAccountId: 'ghost',
        amountCents: 100,
      }),
    ).rejects.toThrow();
    await expect(countTx()).resolves.toBe(before);
  });
});

describe('deleteTransfer (reversión)', () => {
  it('removes both legs and the pairing record, reverting balances', async () => {
    const res = await createTransfer(db, {
      fromAccountId: 'acc_cash',
      toAccountId: 'acc_bank',
      amountCents: 5000,
      feeCents: 100,
    });

    await deleteTransfer(db, res.groupId);

    await expect(countTx()).resolves.toBe(0);
    await expect(db.get('transfers').query().fetchCount()).resolves.toBe(0);

    const cash = (await db.get<Account>('accounts').find('acc_cash')) as Account;
    const bank = (await db.get<Account>('accounts').find('acc_bank')) as Account;
    await expect(getAccountBalance(db, cash)).resolves.toBe(0);
    await expect(getAccountBalance(db, bank)).resolves.toBe(0);
  });
});
