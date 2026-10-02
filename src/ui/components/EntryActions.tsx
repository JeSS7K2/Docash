import React from 'react';
import { Box, Pressable, Text } from '@gluestack-ui/themed';
import { useTranslation } from '../../i18n';
import { usePalette, useThemedStyles } from '../../theme';
import { Icon } from '../icons';
import { makeStyles } from './EntryActions.styles';

interface EntryActionsProps {
  onExpense?: () => void;
  onIncome?: () => void;
}

const noop = () => {};

/** Única zona de acción del Home. */
export default function EntryActions({ onExpense = noop, onIncome = noop }: EntryActionsProps) {
  const styles = useThemedStyles(makeStyles);
  const palette = usePalette();
  const { t } = useTranslation();
  return (
    <Box style={styles.root}>
      <Pressable
        testID="fab-expense"
        accessibilityRole="button"
        accessibilityLabel={t('action.addExpense')}
        style={[styles.action, styles.expense]}
        onPress={onExpense}>
        <Icon name="Plus" color={palette.onAction} size={20} strokeWidth={2.5} />
        <Text style={styles.label}>{t('entry.expense')}</Text>
      </Pressable>
      <Pressable
        testID="fab-income"
        accessibilityRole="button"
        accessibilityLabel={t('action.addIncome')}
        style={[styles.action, styles.income]}
        onPress={onIncome}>
        <Icon name="Plus" color={palette.onAction} size={20} strokeWidth={2.5} />
        <Text style={styles.label}>{t('entry.income')}</Text>
      </Pressable>
    </Box>
  );
}
