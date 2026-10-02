import { StyleSheet } from 'react-native';
import { radius, spacing, type, type Palette } from '../../theme';

export const makeStyles = (c: Palette) =>
  StyleSheet.create({
    amount: {
      textAlign: 'center',
      fontSize: 40,
      fontWeight: '800',
      marginTop: spacing.md,
      marginBottom: spacing.lg,
    },
    noteInput: {
      marginHorizontal: spacing.xl,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.action,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      color: c.ink,
      minHeight: 44,
    },
    divider: { height: 1, backgroundColor: c.border, marginVertical: spacing.md },
    repeatRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginHorizontal: spacing.xl,
      marginTop: spacing.md,
      minHeight: 40,
    },
    repeatLabel: { fontSize: type.bodySize, color: c.ink },
    deleteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      marginHorizontal: spacing.xl,
      marginTop: spacing.md,
      paddingVertical: spacing.lg,
      borderRadius: radius.action,
      backgroundColor: c.faint,
      minHeight: 48,
    },
    deleteText: { color: c.expense, fontWeight: '700', fontSize: type.bodySize },
  });
