import { StyleSheet } from 'react-native';
import { radius, spacing, type, type Palette } from '../../theme';

export const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flexDirection: 'row', gap: spacing.lg, padding: spacing.xl },
    action: {
      flex: 1,
      borderRadius: radius.action,
      paddingVertical: 14,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.md,
      minHeight: 52,
    },
    expense: { backgroundColor: c.expense },
    income: { backgroundColor: c.income },
    label: { color: c.onAction, fontSize: type.actionSize, fontWeight: type.actionWeight },
  });
