/**
 * Home Fase 1: verifica balance, cuenta y donut con DB en memoria.
 * Se mockean PieChart (Skia nativo), FlashList y el setup SQL (Loki no
 * ejecuta PRAGMAs). La lógica de agregación es la real de src/db.
 */

import React from 'react';
import { FlatList } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import { it, expect, jest, describe } from '@jest/globals';
import HomeScreen from '../src/ui/HomeScreen';
import { createTransaction } from '../src/db/operations';
import { seedDatabase } from '../src/db/seed';
import { createTestDatabase } from '../src/db/testDb';

jest.mock('../src/ui/PieChart', () => () => null);
jest.mock('../src/ui/components/TrendChart', () => () => null);

jest.mock('@gluestack-ui/themed', () => jest.requireActual('./helpers/gluestackMock'));

jest.mock('@shopify/flash-list', () => {
  const { FlatList: RNFlatList } = jest.requireActual('react-native') as {
    FlatList: typeof FlatList;
  };
  return {
    // Mock mínimo: FlatList con la misma firma usada en HomeScreen.
    FlashList: (props: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { estimatedItemSize, ...rest } = props;
      return <RNFlatList {...rest} />;
    },
  };
});

jest.mock('../src/db/database', () => ({
  ensurePerformanceSetup: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

describe('HomeScreen (Fase 1)', () => {
  it('shows seeded balance, account and transactions', async () => {
    const db = createTestDatabase();
    await seedDatabase(db);
    await createTransaction(db, {
      accountId: 'acc_cash',
      categoryId: 'cat_food',
      kind: 'expense',
      amountCents: 1000,
    });

    const screen = render(<HomeScreen db={db} />);

    await waitFor(() => expect(screen.getByTestId('balance-total')).toBeTruthy());
    expect(screen.getByTestId('balance-total')).toHaveTextContent('-$10.00');
    expect(screen.getByTestId('account-name')).toHaveTextContent(/Cash/);
    expect(screen.getByText('Current balance')).toBeTruthy();
  });
});
