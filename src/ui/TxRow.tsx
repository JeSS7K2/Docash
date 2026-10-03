import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Trash2 } from 'react-native-feather';
import { useMoney } from '../state/useMoney';
import { useSettings } from '../state/useSettings';
import { usePalette, useThemedStyles } from '../theme';
import { formatDateTime } from '../utils/format';
import { CategoryIcon } from './icons';
import { makeStyles } from './TxRow.styles';

export interface TxRowData {
  id: string;
  categoryId?: string;
  icon?: string;
  title: string;
  note: string;
  occurredOn: number;
  amountCents: number;
  kind: 'expense' | 'income' | 'transfer';
}

interface TxRowProps {
  row: TxRowData;
  onPress?: (id: string) => void;
  onDelete?: (id: string) => void;
}

/** Fila memoizada: props planos (nunca el modelo Watermelon) para memo efectivo. */
function TxRow({ row, onPress, onDelete }: TxRowProps) {
  const styles = useThemedStyles(makeStyles);
  const palette = usePalette();
  const money = useMoney();
  const locale = useSettings(s => s.locale);
  const sign = row.kind === 'expense' ? '−' : row.kind === 'income' ? '+' : '';
  const amountColor =
    row.kind === 'expense' ? palette.expense : row.kind === 'income' ? palette.income : palette.transfer;
  const subtitle = [row.note, formatDateTime(row.occurredOn, locale)].filter(Boolean).join(' · ');

  const content = (
    <Pressable
      style={styles.row}
      testID={`tx-row-${row.id}`}
      accessibilityRole="button"
      onPress={onPress ? () => onPress(row.id) : undefined}>
      <View style={styles.iconWrap}>
        <CategoryIcon id={row.categoryId} icon={row.icon} color={palette.ink} size={20} />
      </View>
      <View style={styles.meta}>
        <Text style={styles.title} numberOfLines={1}>
          {row.title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Text style={[styles.amount, { color: amountColor }]} numberOfLines={1}>
        {`${sign}${money(row.amountCents)}`}
      </Text>
    </Pressable>
  );

  if (!onDelete) {
    return content;
  }

  return (
    <Swipeable
      renderRightActions={() => (
        <Pressable
          testID={`tx-delete-${row.id}`}
          style={styles.deleteAction}
          accessibilityRole="button"
          accessibilityLabel="Delete"
          onPress={() => onDelete(row.id)}>
          <Trash2 width={22} height={22} color={palette.onAction} strokeWidth={2} />
        </Pressable>
      )}>
      {content}
    </Swipeable>
  );
}

export default React.memo(TxRow);
