import React from 'react';
import { Box, Pressable, Text } from '@gluestack-ui/themed';
import { useTranslation } from '../../i18n';
import { useThemedStyles } from '../../theme';
import { makeStyles } from './EntryActions.styles';

interface EntryActionsProps {
  onExpense?: () => void;
  onIncome?: () => void;
}

const noop = () => {};

/** Única zona de acción del Home. */
export default function EntryActions({ onExpense = noop, onIncome = noop }: EntryActionsProps) {
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  return (
    <Box style={styles.root}>
      <Pressable
        testID="fab-expense"
        accessibilityRole="button"
        accessibilityLabel={t('action.addExpense')}
        style={[styles.action, styles.expense]}
        onPress={onExpense}>
        <Text style={[styles.symbol, styles.expenseText]}>−</Text>
        <Text style={[styles.label, styles.expenseText]}>{t('entry.expense')}</Text>
      </Pressable>
      <Pressable
        testID="fab-income"
        accessibilityRole="button"
        accessibilityLabel={t('action.addIncome')}
        style={[styles.action, styles.income]}
        onPress={onIncome}>
        <Text style={[styles.symbol, styles.incomeText]}>＋</Text>
        <Text style={[styles.label, styles.incomeText]}>{t('entry.income')}</Text>
      </Pressable>
    </Box>
  );
}
