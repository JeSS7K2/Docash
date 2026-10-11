/**
 * Flujo Fase 2 (3 segundos): abrir sheet → teclear monto → elegir
 * categoría → commit en SQLite + cierre. DB en memoria, UI real.
 */
import React from 'react';
import { Platform } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import EntrySheet from '../src/ui/components/EntrySheet';
import { seedDatabase } from '../src/db/seed';
import { createTestDatabase } from '../src/db/testDb';
import { useEntry } from '../src/state/useEntry';
import type Transaction from '../src/db/models/Transaction';

jest.mock('@gluestack-ui/themed', () => jest.requireActual('./helpers/gluestackMock'));
jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: () => null,
  DateTimePickerAndroid: { open: jest.fn() },
}));

jest.mock('../src/db/database', () => ({
  ensurePerformanceSetup: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

describe('EntrySheet (Fase 2)', () => {
  it('commits an expense after category selection and submit', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
    const db = createTestDatabase();
    await seedDatabase(db);
    useEntry.getState().openSheet('expense');

    const screen = render(<EntrySheet db={db} />);
    await waitFor(() => expect(screen.getByTestId('category-select')).toBeTruthy());

    fireEvent.press(screen.getByTestId('entry-date'));
    expect(DateTimePickerAndroid.open).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'date' }),
    );

    fireEvent.changeText(screen.getByTestId('entry-amount'), '10');
    await waitFor(() => expect(screen.getByTestId('entry-amount').props.value).toBe('10'));

    fireEvent.press(screen.getByTestId('category-select'));
    fireEvent.press(screen.getByTestId('category-option-cat_food'));
    fireEvent.press(screen.getByTestId('entry-submit'));

    await waitFor(async () => {
      const count = await db.get<Transaction>('transactions').query().fetchCount();
      expect(count).toBe(1);
    });
    const txs = (await db.get<Transaction>('transactions').query().fetch()) as Transaction[];
    expect(txs[0].amountSigned).toBe(-1000);
    expect(txs[0].categoryId).toBe('cat_food');
    expect(useEntry.getState().open).toBe(false);
  });
});
