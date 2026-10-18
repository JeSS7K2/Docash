import React from 'react';
import { Platform } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import EntrySheet from '../src/ui/components/EntrySheet';
import { seedDatabase } from '../src/db/seed';
import { createTestDatabase } from '../src/db/testDb';
import { useEntry } from '../src/state/useEntry';
import { createTransaction } from '../src/db/operations';
import { getAccountBalance } from '../src/db/queries';
import type Transaction from '../src/db/models/Transaction';
import type Account from '../src/db/models/Account';

jest.mock('@gluestack-ui/themed', () => jest.requireActual('./helpers/gluestackMock'));
jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: () => null,
  DateTimePickerAndroid: { open: jest.fn() },
}));

jest.mock('../src/db/database', () => ({
  ensurePerformanceSetup: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

describe('EntrySheet (edit)', () => {
  it('persists an edited amount', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
    const db = createTestDatabase();
    await seedDatabase(db);
    const tx = await createTransaction(db, {
      accountId: 'acc_cash',
      categoryId: 'cat_food',
      kind: 'expense',
      amountCents: 1000,
    });
    useEntry.getState().openEdit({
      id: tx.id,
      kind: 'expense',
      amountCents: 1000,
      categoryId: 'cat_food',
      note: '',
      occurredOn: tx.occurredOn,
    });

    const screen = render(<EntrySheet db={db} />);
    await waitFor(() => expect(screen.getByTestId('entry-amount').props.value).toBe('10'));

    fireEvent.changeText(screen.getByTestId('entry-amount'), '25');
    await waitFor(() => expect(screen.getByTestId('entry-amount').props.value).toBe('25'));

    fireEvent.press(screen.getByTestId('entry-submit'));

    await waitFor(async () => {
      const updated = await db.get<Transaction>('transactions').find(tx.id);
      expect(updated.amountCents).toBe(2500);
      expect(updated.amountSigned).toBe(-2500);
    });
    const account = (await db.get<Account>('accounts').query().fetch())[0];
    expect(await getAccountBalance(db, account)).toBe(-2500);
  });
});
