import React from 'react';
import { Box, Pressable, Text } from '@gluestack-ui/themed';
import { Plus } from 'react-native-feather';
import { useTranslation } from '../../i18n';
import { useThemedStyles } from '../../theme';
import { makeStyles } from './EntryActions.styles';

interface EntryActionsProps {
  onExpense?: () => void;
}

const noop = () => {};

/** Única zona de acción del Home. */
export default function EntryActions({ onExpense = noop }: EntryActionsProps) {
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  return (
    <Box style={styles.root}>
      <Pressable
        testID="fab-expense"
        accessibilityRole="button"
        accessibilityLabel={t('movement.register')}
        style={styles.action}
        onPress={onExpense}>
        <Box style={styles.plusCircle}><Plus width={28} height={28} color="#0D70E8" strokeWidth={3} /></Box>
        <Text style={styles.label}>{t('movement.register')}</Text>
      </Pressable>
    </Box>
  );
}
