import { StyleSheet } from 'react-native';
import { spacing, type, type Palette } from '../theme';

export const makeStyles = (c: Palette) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: 0,
      minHeight: 62,
      backgroundColor: c.paper,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    iconIncome: { backgroundColor: c.incomeSoft },
    iconExpense: { backgroundColor: c.primarySoft },
    meta: { flex: 1, marginRight: spacing.md },
    title: { fontSize: 15, fontWeight: '700', color: c.ink },
    subtitle: { fontSize: type.metaSize, color: c.muted, marginTop: spacing.xs },
    amount: { fontSize: 15, fontWeight: '800' },
    deleteAction: {
      width: 72,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.expense,
    },
  });
