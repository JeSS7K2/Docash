import React from 'react';
import { FlashList } from '@shopify/flash-list';
import { Text } from '@gluestack-ui/themed';
import { useTranslation } from '../../i18n';
import { useThemedStyles } from '../../theme';
import TxRow, { type TxRowData } from '../TxRow';
import { makeStyles } from './TransactionList.styles';

interface TransactionListProps {
  rows: TxRowData[];
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function TransactionList({ rows, onSelect, onDelete }: TransactionListProps) {
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  return (
    <FlashList
      data={rows}
      keyExtractor={item => item.id}
      renderItem={({ item }) => <TxRow row={item} onPress={onSelect} onDelete={onDelete} />}
      estimatedItemSize={64}
      ListEmptyComponent={<Text style={styles.empty}>{t('list.empty')}</Text>}
    />
  );
}
