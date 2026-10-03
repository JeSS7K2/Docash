import { StyleSheet } from 'react-native';
import { spacing, radius, type, type Palette } from '../theme';

export const makeStyles = (c: Palette) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: spacing.xl,
      minHeight: 64,
      backgroundColor: c.faint,
      borderRadius: radius.action,
      marginBottom: spacing.sm,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: radius.icon,
      backgroundColor: c.faint,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.lg,
    },
    meta: { flex: 1, marginRight: spacing.md },
    title: { fontSize: type.titleSize, fontWeight: type.titleWeight, color: c.ink },
    subtitle: { fontSize: type.metaSize, color: c.muted, marginTop: spacing.xs },
    amount: { fontSize: type.titleSize, fontWeight: '700' },
    deleteAction: {
      width: 72,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.expense,
    },
  });
