import { StyleSheet } from 'react-native';
import { radius, spacing, type, type Palette } from '../../theme';

export const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.md },
    action: {
      flex: 1,
      borderRadius: radius.action,
      paddingVertical: 10,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.md,
      minHeight: 46,
    },
    expense: { backgroundColor: c.primary },
    income: { backgroundColor: c.income },
    label: { fontSize: type.bodySize, fontWeight: type.actionWeight },
    symbol: { fontSize: 18, fontWeight: '700' },
    expenseText: { color: '#FFFFFF' },
    incomeText: { color: c.ink },
  });
