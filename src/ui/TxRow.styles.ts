import { StyleSheet } from 'react-native';
import { spacing, type, type Palette } from '../theme';

export const makeStyles = (c: Palette) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.lg,
      paddingHorizontal: 0,
      minHeight: 76,
      backgroundColor: c.paper,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.lg,
    },
    iconIncome: { backgroundColor: c.incomeSoft },
    iconExpense: { backgroundColor: c.primarySoft },
    meta: { flex: 1, marginRight: spacing.md },
    title: { fontSize: 17, fontWeight: '700', color: c.ink },
    subtitle: { fontSize: type.bodySize, color: c.muted, marginTop: spacing.xs },
    amount: { fontSize: 17, fontWeight: '800' },
    deleteAction: {
      width: 72,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.expense,
    },
  });
