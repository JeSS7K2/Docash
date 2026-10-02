import { StyleSheet } from 'react-native';
import { radius, spacing, type, type Palette } from '../../theme';

export const makeStyles = (c: Palette) =>
  StyleSheet.create({
    chipsSpacing: { marginTop: spacing.md },
    addButton: { marginTop: spacing.md },
    daysInput: {
      width: 64,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.action,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      color: c.ink,
      textAlign: 'center',
      minHeight: 40,
    },
    kindRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md },
    kindCard: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xl,
      borderRadius: radius.action,
      minHeight: 96,
      gap: spacing.md,
    },
    kindCardExpense: { backgroundColor: c.expense },
    kindCardIncome: { backgroundColor: c.income },
    kindCardText: { color: c.onAction, fontSize: type.actionSize, fontWeight: '800' },
    backButton: { alignSelf: 'flex-start', marginBottom: spacing.md, paddingVertical: spacing.sm },
    backText: { color: c.muted, fontSize: type.bodySize },
  });
